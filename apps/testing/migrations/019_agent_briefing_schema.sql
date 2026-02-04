-- ============================================
-- MIGRATION: 019_agent_briefing_schema.sql
-- Sistema de briefing via WhatsApp para criar agentes
-- Projeto: AI Factory - MOTTIVME
-- Data: 2026-01-25
-- Decisoes: Trigger palavra-chave, 5 fases, timeout 24h, qualquer contato
-- ============================================

-- ===========================================
-- 1. TABELA: agent_briefing_sessions
-- Estado da conversa de briefing
-- ===========================================

CREATE TABLE IF NOT EXISTS agent_briefing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao do contato (WhatsApp)
  location_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  phone_number TEXT,
  conversation_id TEXT,

  -- Estado da coleta (5 fases simplificadas)
  current_phase INTEGER DEFAULT 1,
  phase_name TEXT DEFAULT 'identificacao',
  status TEXT DEFAULT 'in_progress',

  -- Dados coletados por fase (JSONB)
  collected_data JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "fase_1_identificacao": {"nome_negocio": "...", "vertical": "..."},
  --   "fase_2_location": {"location_id": "..."},
  --   "fase_3_modos": {"modos": ["sdr_inbound", "scheduler"]},
  --   "fase_4_personalidade": {"tom_voz": "...", "uso_emojis": true},
  --   "fase_5_confirmacao": {"confirmado": true}
  -- }

  -- Briefing final consolidado
  final_briefing JSONB,

  -- Resultado do Agent Creator
  agent_version_id UUID,
  agent_creation_score INTEGER,
  agent_created_at TIMESTAMPTZ,

  -- Contadores
  message_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  last_question_id TEXT,

  -- Timeouts (24h)
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  timeout_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_briefing_status CHECK (
    status IN ('in_progress', 'completed', 'abandoned', 'error', 'paused')
  ),
  CONSTRAINT valid_briefing_phase CHECK (current_phase >= 1 AND current_phase <= 6)
);

-- ===========================================
-- 2. INDICES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_briefing_sessions_location
  ON agent_briefing_sessions(location_id);

CREATE INDEX IF NOT EXISTS idx_briefing_sessions_contact
  ON agent_briefing_sessions(location_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_briefing_sessions_active
  ON agent_briefing_sessions(status, location_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_briefing_sessions_timeout
  ON agent_briefing_sessions(timeout_at)
  WHERE status = 'in_progress' AND timeout_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_briefing_sessions_activity
  ON agent_briefing_sessions(last_activity_at DESC)
  WHERE status = 'in_progress';

-- ===========================================
-- 3. TABELA: agent_briefing_logs
-- Historico de mensagens
-- ===========================================

CREATE TABLE IF NOT EXISTS agent_briefing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES agent_briefing_sessions(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  message_content TEXT,
  message_raw JSONB,
  phase_at_time INTEGER,
  phase_name_at_time TEXT,
  question_id TEXT,
  extracted_data JSONB,
  validation_result JSONB,
  error_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_briefing_logs_session
  ON agent_briefing_logs(session_id, created_at DESC);

-- ===========================================
-- 4. TRIGGER: updated_at automatico
-- ===========================================

CREATE OR REPLACE FUNCTION update_briefing_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF OLD.collected_data IS DISTINCT FROM NEW.collected_data
     OR OLD.current_phase IS DISTINCT FROM NEW.current_phase THEN
    NEW.last_activity_at = NOW();
    NEW.timeout_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_briefing_sessions_updated ON agent_briefing_sessions;
CREATE TRIGGER trigger_briefing_sessions_updated
  BEFORE UPDATE ON agent_briefing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_briefing_sessions_timestamp();

-- ===========================================
-- 5. FUNCAO: get_or_create_briefing_session
-- Para o workflow n8n usar
-- ===========================================

CREATE OR REPLACE FUNCTION get_or_create_briefing_session(
  p_location_id TEXT,
  p_contact_id TEXT,
  p_phone_number TEXT DEFAULT NULL,
  p_conversation_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session agent_briefing_sessions%ROWTYPE;
  v_is_new BOOLEAN := false;
BEGIN
  -- Buscar sessao ativa existente
  SELECT * INTO v_session
  FROM agent_briefing_sessions
  WHERE location_id = p_location_id
    AND contact_id = p_contact_id
    AND status = 'in_progress'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nao existe ou expirou, criar nova
  IF v_session.id IS NULL THEN
    INSERT INTO agent_briefing_sessions (
      location_id, contact_id, phone_number, conversation_id,
      current_phase, phase_name, status
    )
    VALUES (
      p_location_id, p_contact_id, p_phone_number, p_conversation_id,
      1, 'identificacao', 'in_progress'
    )
    RETURNING * INTO v_session;
    v_is_new := true;
  ELSE
    -- Atualizar campos se fornecidos
    UPDATE agent_briefing_sessions
    SET
      phone_number = COALESCE(p_phone_number, phone_number),
      conversation_id = COALESCE(p_conversation_id, conversation_id)
    WHERE id = v_session.id
    RETURNING * INTO v_session;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_new', v_is_new,
    'session_id', v_session.id,
    'location_id', v_session.location_id,
    'contact_id', v_session.contact_id,
    'current_phase', v_session.current_phase,
    'phase_name', v_session.phase_name,
    'status', v_session.status,
    'collected_data', v_session.collected_data,
    'message_count', v_session.message_count
  );
END;
$$;

-- ===========================================
-- 6. FUNCAO: update_briefing_phase
-- Atualizar fase da conversa
-- ===========================================

CREATE OR REPLACE FUNCTION update_briefing_phase(
  p_session_id UUID,
  p_new_phase INTEGER,
  p_phase_name TEXT,
  p_collected_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session agent_briefing_sessions%ROWTYPE;
  v_phase_key TEXT;
  v_updated_data JSONB;
BEGIN
  SELECT * INTO v_session FROM agent_briefing_sessions WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;

  IF v_session.status != 'in_progress' THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_active');
  END IF;

  v_phase_key := format('fase_%s_%s', p_new_phase, p_phase_name);

  IF p_collected_data IS NOT NULL THEN
    v_updated_data := v_session.collected_data || jsonb_build_object(
      v_phase_key, p_collected_data || jsonb_build_object('collected_at', NOW())
    );
  ELSE
    v_updated_data := v_session.collected_data;
  END IF;

  UPDATE agent_briefing_sessions
  SET
    current_phase = p_new_phase,
    phase_name = p_phase_name,
    collected_data = v_updated_data,
    message_count = message_count + 1
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'new_phase', p_new_phase,
    'phase_name', p_phase_name,
    'collected_data', v_session.collected_data
  );
END;
$$;

-- ===========================================
-- 7. FUNCAO: finalize_briefing_session
-- Consolidar e marcar como completo
-- ===========================================

CREATE OR REPLACE FUNCTION finalize_briefing_session(
  p_session_id UUID,
  p_agent_version_id UUID DEFAULT NULL,
  p_agent_score INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session agent_briefing_sessions%ROWTYPE;
  v_final_briefing JSONB;
  v_fase1 JSONB;
  v_fase2 JSONB;
  v_fase3 JSONB;
  v_fase4 JSONB;
BEGIN
  SELECT * INTO v_session FROM agent_briefing_sessions WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;

  -- Extrair dados de cada fase
  v_fase1 := v_session.collected_data->'fase_1_identificacao';
  v_fase2 := v_session.collected_data->'fase_2_location';
  v_fase3 := v_session.collected_data->'fase_3_modos';
  v_fase4 := v_session.collected_data->'fase_4_personalidade';

  -- Montar briefing no formato do Agent Creator
  v_final_briefing := jsonb_build_object(
    'nome_negocio', v_fase1->>'nome_negocio',
    'vertical', v_fase1->>'vertical',
    'location_id', COALESCE(v_fase2->>'location_id', v_session.location_id),
    'modos', COALESCE(v_fase3->'modos', '["sdr_inbound"]'::jsonb),
    'tom_voz', COALESCE(v_fase4->>'tom_voz', 'acolhedor'),
    'nivel_formalidade', COALESCE((v_fase4->>'nivel_formalidade')::int, 6),
    'uso_emojis', COALESCE((v_fase4->>'uso_emojis')::boolean, true),
    'nome_agente', v_fase4->>'nome_agente',
    'horario', COALESCE(v_fase1->>'horario', 'Seg-Sex 9h-18h'),
    'cidade', COALESCE(v_fase1->>'cidade', 'Sao Paulo'),
    'estado', 'SP',
    'source', 'whatsapp_wizard',
    'session_id', v_session.id,
    'created_via', 'Agent Briefer WhatsApp'
  );

  -- Atualizar sessao
  UPDATE agent_briefing_sessions
  SET
    status = 'completed',
    final_briefing = v_final_briefing,
    agent_version_id = p_agent_version_id,
    agent_creation_score = p_agent_score,
    agent_created_at = CASE WHEN p_agent_version_id IS NOT NULL THEN NOW() ELSE NULL END,
    completed_at = NOW()
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'status', 'completed',
    'agent_version_id', p_agent_version_id,
    'agent_score', p_agent_score,
    'final_briefing', v_final_briefing
  );
END;
$$;

-- ===========================================
-- 8. FUNCAO: log_briefing_message
-- Registrar mensagem no log
-- ===========================================

CREATE OR REPLACE FUNCTION log_briefing_message(
  p_session_id UUID,
  p_direction TEXT,
  p_message_content TEXT,
  p_extracted_data JSONB DEFAULT NULL,
  p_error_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session agent_briefing_sessions%ROWTYPE;
  v_log_id UUID;
BEGIN
  SELECT * INTO v_session FROM agent_briefing_sessions WHERE id = p_session_id;

  INSERT INTO agent_briefing_logs (
    session_id, location_id, contact_id, direction,
    message_content, phase_at_time, phase_name_at_time,
    extracted_data, error_type, processed_at
  )
  VALUES (
    p_session_id, v_session.location_id, v_session.contact_id, p_direction,
    p_message_content, v_session.current_phase, v_session.phase_name,
    p_extracted_data, p_error_type, NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ===========================================
-- 9. FUNCAO: abandon_stale_briefings
-- Job para marcar abandonados (24h)
-- ===========================================

CREATE OR REPLACE FUNCTION abandon_stale_briefings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE agent_briefing_sessions
  SET
    status = 'abandoned',
    abandoned_at = NOW()
  WHERE status = 'in_progress'
    AND last_activity_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ===========================================
-- 10. RLS (Row Level Security)
-- ===========================================

ALTER TABLE agent_briefing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_briefing_logs ENABLE ROW LEVEL SECURITY;

-- Politicas permissivas para service_role e anon (webhook)
CREATE POLICY "briefing_sessions_all" ON agent_briefing_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "briefing_logs_all" ON agent_briefing_logs FOR ALL USING (true) WITH CHECK (true);

-- ===========================================
-- 11. VIEW: Metricas de conversao
-- ===========================================

CREATE OR REPLACE VIEW vw_briefing_metrics AS
SELECT
  DATE(created_at) as data,
  COUNT(*) as total_iniciados,
  COUNT(*) FILTER (WHERE status = 'completed') as completados,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandonados,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as taxa_conversao,
  AVG(message_count) FILTER (WHERE status = 'completed') as media_mensagens,
  AVG(agent_creation_score) FILTER (WHERE status = 'completed') as media_score
FROM agent_briefing_sessions
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- ===========================================
-- FIM DA MIGRATION
-- ===========================================

COMMENT ON TABLE agent_briefing_sessions IS 'Sessoes de briefing para criacao de agentes via WhatsApp';
COMMENT ON TABLE agent_briefing_logs IS 'Log de mensagens durante coleta de briefing';
