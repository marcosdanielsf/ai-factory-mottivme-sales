-- =====================================================
-- MIGRATION 009: Action Types e Funis Empilhados
-- =====================================================
-- Data: 2026-01-10
-- Autor: Claude + Marcos Daniels
-- Objetivo: Adicionar sistema modular de action_types
--           e suporte a múltiplos funis empilhados
-- =====================================================

-- =====================================================
-- PARTE 1: ACTION TYPES NA TABELA EXISTENTE
-- =====================================================

-- Adicionar novas colunas na tabela fuu_cadences
ALTER TABLE fuu_cadences
ADD COLUMN IF NOT EXISTS action_type VARCHAR(20) DEFAULT 'ai_text',
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fallback_action VARCHAR(20) DEFAULT 'ai_text',
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS requires_qualification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_engagement_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowed_stages VARCHAR[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS qualification_tags VARCHAR[] DEFAULT '{}';

-- Constraint para validar action_types
ALTER TABLE fuu_cadences
ADD CONSTRAINT chk_action_type
CHECK (action_type IN ('ai_text', 'template', 'tag', 'ai_call', 'skip', 'manual', 'webhook'));

-- Constraint para validar fallback_action
ALTER TABLE fuu_cadences
ADD CONSTRAINT chk_fallback_action
CHECK (fallback_action IS NULL OR fallback_action IN ('ai_text', 'template', 'tag', 'skip'));

-- Comentários
COMMENT ON COLUMN fuu_cadences.action_type IS 'Tipo de ação: ai_text (IA gera), template (msg fixa), tag (dispara GHL), ai_call (ligação IA), skip, manual, webhook';
COMMENT ON COLUMN fuu_cadences.is_enabled IS 'Se false, etapa é pulada na cadência';
COMMENT ON COLUMN fuu_cadences.fallback_action IS 'Ação alternativa se action_type não puder ser executado';
COMMENT ON COLUMN fuu_cadences.webhook_url IS 'URL para chamar quando action_type = webhook';
COMMENT ON COLUMN fuu_cadences.requires_qualification IS 'Se true, verifica qualificação antes de executar (usado em ai_call)';
COMMENT ON COLUMN fuu_cadences.min_engagement_score IS 'Score mínimo de engajamento para executar ação (0-100)';
COMMENT ON COLUMN fuu_cadences.allowed_stages IS 'Array de estágios onde esta ação pode ser executada';
COMMENT ON COLUMN fuu_cadences.qualification_tags IS 'Array de tags que o lead precisa ter para executar ação';

-- =====================================================
-- PARTE 2: TABELAS DE FUNIS EMPILHADOS
-- =====================================================

-- Tabela: Definição de Funis
CREATE TABLE IF NOT EXISTS fuu_funnel_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  funnel_code VARCHAR(50) UNIQUE NOT NULL,
  funnel_name VARCHAR(100) NOT NULL,
  funnel_order INTEGER NOT NULL,

  -- Configuração
  duration_days INTEGER NOT NULL,
  max_stages INTEGER NOT NULL,
  channels JSONB NOT NULL DEFAULT '["whatsapp"]',

  -- Próximo funil
  next_funnel_code VARCHAR(50),

  -- Métricas esperadas
  expected_conversion_rate DECIMAL(5,2),

  -- Controle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados iniciais dos funis
INSERT INTO fuu_funnel_definitions (
  funnel_code, funnel_name, funnel_order, duration_days, max_stages, channels, next_funnel_code, expected_conversion_rate
) VALUES
  ('sdr_direto', 'SDR Direto', 1, 7, 6, '["whatsapp", "instagram"]', 'grupo_vip', 0.20),
  ('grupo_vip', 'Grupo VIP', 2, 30, 4, '["whatsapp_group"]', 'email_nurturing', 0.15),
  ('email_nurturing', 'Email Nurturing', 3, 45, 16, '["email"]', 'video_loom', 0.10),
  ('video_loom', 'Video Loom/VSL', 4, 14, 5, '["email", "whatsapp"]', 'webinar', 0.18),
  ('webinar', 'Webinar Cíclico', 5, 30, 8, '["email", "whatsapp"]', 'farming', 0.22),
  ('farming', 'Sales Farming', 6, 90, 12, '["email"]', 'reativacao', 0.06),
  ('reativacao', 'Reativação Cíclica', 7, 60, 5, '["email", "whatsapp"]', NULL, 0.04),
  ('noshow_rescue', 'No-Show Rescue', 0, 5, 5, '["whatsapp"]', 'grupo_vip', 0.35)
ON CONFLICT (funnel_code) DO NOTHING;

-- Tabela: Tracking de Lead no Funil
CREATE TABLE IF NOT EXISTS fuu_funnel_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,

  -- Funil atual
  current_funnel VARCHAR(50) NOT NULL REFERENCES fuu_funnel_definitions(funnel_code),
  funnel_stage INTEGER DEFAULT 1,

  -- Histórico
  previous_funnels JSONB DEFAULT '[]',
  funnel_started_at TIMESTAMPTZ DEFAULT NOW(),

  -- Métricas do funil atual
  messages_sent INTEGER DEFAULT 0,
  messages_opened INTEGER DEFAULT 0,
  links_clicked INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Controle
  status VARCHAR(20) DEFAULT 'active',
  next_action_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id)
);

-- Índices para funnel_tracking
CREATE INDEX IF NOT EXISTS idx_fuu_funnel_location_status
ON fuu_funnel_tracking(location_id, status);

CREATE INDEX IF NOT EXISTS idx_fuu_funnel_current
ON fuu_funnel_tracking(current_funnel, funnel_stage);

CREATE INDEX IF NOT EXISTS idx_fuu_funnel_next_action
ON fuu_funnel_tracking(next_action_at) WHERE status = 'active';

-- Constraint para status
ALTER TABLE fuu_funnel_tracking
ADD CONSTRAINT chk_funnel_status
CHECK (status IN ('active', 'converted', 'moved', 'paused', 'archived'));

-- =====================================================
-- PARTE 3: TABELAS DE TRACKING ESPECÍFICAS
-- =====================================================

-- Tracking de Grupos VIP
CREATE TABLE IF NOT EXISTS fuu_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  group_id VARCHAR(100) NOT NULL,

  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  reactions_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  last_engagement_at TIMESTAMPTZ,

  launch_participated BOOLEAN DEFAULT false,
  launch_converted BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, group_id)
);

-- Tracking de Emails
CREATE TABLE IF NOT EXISTS fuu_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  email_sequence_id VARCHAR(50) NOT NULL,
  email_number INTEGER NOT NULL,

  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, email_sequence_id, email_number)
);

-- Tracking de Vídeos
CREATE TABLE IF NOT EXISTS fuu_video_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  video_id VARCHAR(100) NOT NULL,
  video_type VARCHAR(20) NOT NULL,

  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  watch_time_seconds INTEGER DEFAULT 0,
  watch_percentage DECIMAL(5,2) DEFAULT 0,

  cta_clicked BOOLEAN DEFAULT false,
  cta_clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, video_id)
);

-- Tracking de Webinars
CREATE TABLE IF NOT EXISTS fuu_webinar_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,
  webinar_id VARCHAR(100) NOT NULL,
  webinar_date DATE NOT NULL,

  registered_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  watch_time_minutes INTEGER DEFAULT 0,

  offer_viewed BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  replay_sent BOOLEAN DEFAULT false,
  replay_viewed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, contact_id, webinar_id)
);

-- Tracking de Ligações IA
CREATE TABLE IF NOT EXISTS fuu_call_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  location_id VARCHAR(100) NOT NULL,
  contact_id VARCHAR(100) NOT NULL,

  -- Referência ao follow-up
  cadence_attempt INTEGER,
  funnel_code VARCHAR(50),

  -- Dados da ligação
  call_provider VARCHAR(50), -- 'vapi', 'bland', 'retell', etc
  call_id VARCHAR(100),
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  call_duration_seconds INTEGER DEFAULT 0,

  -- Status
  call_status VARCHAR(30), -- 'queued', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'
  call_outcome VARCHAR(30), -- 'scheduled', 'callback_requested', 'not_interested', 'voicemail', 'answered_no_action'

  -- Qualificação que permitiu a ligação
  qualification_score DECIMAL(5,2),
  qualification_tags VARCHAR[],

  -- Transcrição e análise
  transcript TEXT,
  summary TEXT,
  sentiment VARCHAR(20),

  -- Custo
  cost_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(call_id)
);

CREATE INDEX IF NOT EXISTS idx_fuu_call_contact
ON fuu_call_tracking(location_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_fuu_call_status
ON fuu_call_tracking(call_status);

-- =====================================================
-- PARTE 4: FUNÇÃO PARA MOVER LEAD ENTRE FUNIS
-- =====================================================

CREATE OR REPLACE FUNCTION move_lead_to_next_funnel(
  p_location_id VARCHAR,
  p_contact_id VARCHAR,
  p_reason VARCHAR DEFAULT 'timeout'
)
RETURNS JSONB AS $$
DECLARE
  v_current_funnel VARCHAR;
  v_next_funnel VARCHAR;
  v_history JSONB;
BEGIN
  -- Buscar funil atual
  SELECT current_funnel, previous_funnels
  INTO v_current_funnel, v_history
  FROM fuu_funnel_tracking
  WHERE location_id = p_location_id AND contact_id = p_contact_id;

  -- Se não encontrou, retorna erro
  IF v_current_funnel IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Lead not found in funnel tracking');
  END IF;

  -- Buscar próximo funil
  SELECT next_funnel_code INTO v_next_funnel
  FROM fuu_funnel_definitions
  WHERE funnel_code = v_current_funnel;

  -- Se não tem próximo funil, arquivar
  IF v_next_funnel IS NULL THEN
    UPDATE fuu_funnel_tracking
    SET status = 'archived', updated_at = NOW()
    WHERE location_id = p_location_id AND contact_id = p_contact_id;

    RETURN jsonb_build_object('status', 'archived', 'reason', 'no_next_funnel');
  END IF;

  -- Atualizar histórico
  v_history = v_history || jsonb_build_object(
    'funnel', v_current_funnel,
    'moved_at', NOW(),
    'reason', p_reason
  );

  -- Mover para próximo funil
  UPDATE fuu_funnel_tracking
  SET
    current_funnel = v_next_funnel,
    funnel_stage = 1,
    previous_funnels = v_history,
    funnel_started_at = NOW(),
    messages_sent = 0,
    messages_opened = 0,
    links_clicked = 0,
    engagement_score = 0,
    status = 'active',
    updated_at = NOW()
  WHERE location_id = p_location_id AND contact_id = p_contact_id;

  RETURN jsonb_build_object(
    'status', 'moved',
    'from_funnel', v_current_funnel,
    'to_funnel', v_next_funnel
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: FUNÇÃO PARA VERIFICAR QUALIFICAÇÃO AI_CALL
-- =====================================================

CREATE OR REPLACE FUNCTION check_ai_call_qualification(
  p_location_id VARCHAR,
  p_contact_id VARCHAR,
  p_cadence_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_engagement_score DECIMAL(5,2);
  v_current_stage VARCHAR;
  v_lead_tags VARCHAR[];
  v_min_score DECIMAL(5,2);
  v_allowed_stages VARCHAR[];
  v_required_tags VARCHAR[];
  v_is_qualified BOOLEAN := true;
  v_reasons TEXT[] := '{}';
BEGIN
  -- Buscar configuração da cadência
  SELECT min_engagement_score, allowed_stages, qualification_tags
  INTO v_min_score, v_allowed_stages, v_required_tags
  FROM fuu_cadences
  WHERE id = p_cadence_id;

  -- Buscar dados do lead no funnel tracking
  SELECT engagement_score, current_funnel
  INTO v_engagement_score, v_current_stage
  FROM fuu_funnel_tracking
  WHERE location_id = p_location_id AND contact_id = p_contact_id;

  -- Se não encontrou tracking, não qualificado
  IF v_engagement_score IS NULL THEN
    RETURN jsonb_build_object(
      'qualified', false,
      'reasons', ARRAY['Lead não encontrado no tracking de funil']
    );
  END IF;

  -- Verificar engagement score
  IF v_engagement_score < v_min_score THEN
    v_is_qualified := false;
    v_reasons := array_append(v_reasons,
      format('Engagement score %s < mínimo %s', v_engagement_score, v_min_score));
  END IF;

  -- Verificar estágio permitido
  IF array_length(v_allowed_stages, 1) > 0 AND NOT (v_current_stage = ANY(v_allowed_stages)) THEN
    v_is_qualified := false;
    v_reasons := array_append(v_reasons,
      format('Estágio %s não está nos permitidos', v_current_stage));
  END IF;

  -- TODO: Verificar tags (precisa buscar do GHL ou de outra tabela)
  -- Por ora, assumimos que as tags são verificadas no n8n

  RETURN jsonb_build_object(
    'qualified', v_is_qualified,
    'engagement_score', v_engagement_score,
    'current_stage', v_current_stage,
    'reasons', v_reasons
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 6: FUNÇÃO PARA DETERMINAR AÇÃO A EXECUTAR
-- =====================================================

CREATE OR REPLACE FUNCTION get_cadence_action(
  p_cadence_id UUID,
  p_location_id VARCHAR,
  p_contact_id VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_action_type VARCHAR;
  v_fallback_action VARCHAR;
  v_requires_qual BOOLEAN;
  v_is_enabled BOOLEAN;
  v_qualification JSONB;
  v_final_action VARCHAR;
BEGIN
  -- Buscar configuração da cadência
  SELECT action_type, fallback_action, requires_qualification, is_enabled
  INTO v_action_type, v_fallback_action, v_requires_qual, v_is_enabled
  FROM fuu_cadences
  WHERE id = p_cadence_id;

  -- Se etapa desabilitada, retorna skip
  IF NOT v_is_enabled THEN
    RETURN jsonb_build_object(
      'action', 'skip',
      'reason', 'etapa desabilitada'
    );
  END IF;

  -- Se requer qualificação (ai_call), verificar
  IF v_requires_qual THEN
    v_qualification := check_ai_call_qualification(p_location_id, p_contact_id, p_cadence_id);

    IF NOT (v_qualification->>'qualified')::boolean THEN
      v_final_action := COALESCE(v_fallback_action, 'ai_text');
      RETURN jsonb_build_object(
        'action', v_final_action,
        'original_action', v_action_type,
        'reason', 'não qualificado para ' || v_action_type,
        'qualification', v_qualification
      );
    END IF;
  END IF;

  -- Retorna ação original
  RETURN jsonb_build_object(
    'action', v_action_type,
    'requires_config', v_action_type IN ('tag', 'template', 'webhook')
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 7: TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas novas tabelas
DROP TRIGGER IF EXISTS update_fuu_funnel_definitions_updated_at ON fuu_funnel_definitions;
CREATE TRIGGER update_fuu_funnel_definitions_updated_at
  BEFORE UPDATE ON fuu_funnel_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuu_funnel_tracking_updated_at ON fuu_funnel_tracking;
CREATE TRIGGER update_fuu_funnel_tracking_updated_at
  BEFORE UPDATE ON fuu_funnel_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuu_group_members_updated_at ON fuu_group_members;
CREATE TRIGGER update_fuu_group_members_updated_at
  BEFORE UPDATE ON fuu_group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 8: GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON fuu_funnel_definitions TO authenticated;
GRANT ALL ON fuu_funnel_tracking TO authenticated;
GRANT ALL ON fuu_group_members TO authenticated;
GRANT ALL ON fuu_email_tracking TO authenticated;
GRANT ALL ON fuu_video_tracking TO authenticated;
GRANT ALL ON fuu_webinar_tracking TO authenticated;
GRANT ALL ON fuu_call_tracking TO authenticated;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009 concluída com sucesso!';
  RAISE NOTICE '📊 Novas colunas em fuu_cadences: action_type, is_enabled, fallback_action, etc';
  RAISE NOTICE '📊 Novas tabelas: fuu_funnel_definitions, fuu_funnel_tracking, fuu_group_members, fuu_email_tracking, fuu_video_tracking, fuu_webinar_tracking, fuu_call_tracking';
  RAISE NOTICE '📊 Novas funções: move_lead_to_next_funnel, check_ai_call_qualification, get_cadence_action';
END $$;
