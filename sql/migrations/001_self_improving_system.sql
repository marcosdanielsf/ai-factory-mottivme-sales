-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 001
-- ============================================
-- Description: Cria todas as tabelas necessárias para o sistema
--              de auto-melhoria de agentes AI
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-23
-- Based on: Self_Improving_System_Starter_Kit PDFs
-- ============================================

-- ============================================
-- TABELA 1: SYSTEM_PROMPTS
-- ============================================
-- Versionamento de prompts com histórico completo
-- Permite rollback e tracking de performance por versão

CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com agent_version
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,

  -- Versionamento
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES system_prompts(id), -- Auto-referência para histórico
  is_active BOOLEAN DEFAULT false,

  -- Conteúdo do prompt
  prompt_content TEXT NOT NULL,
  prompt_name VARCHAR(255),
  prompt_description TEXT,

  -- Configurações
  model_config JSONB DEFAULT '{}',
  -- Estrutura esperada:
  -- {
  --   "model": "gpt-4o",
  --   "temperature": 0.7,
  --   "max_tokens": 4096,
  --   "tools": ["calendar", "search"]
  -- }

  -- Métricas de performance (calculadas pelo reflection loop)
  performance_score DECIMAL(3,2), -- 0.00 a 5.00 (média das avaliações)
  total_evaluations INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,

  -- Razão da mudança (trigger)
  change_reason TEXT, -- "auto_improvement", "manual_edit", "rollback", "initial"
  change_summary TEXT, -- Resumo das alterações

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(agent_version_id, version)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_prompts_agent_version
  ON system_prompts(agent_version_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_system_prompts_active
  ON system_prompts(agent_version_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_system_prompts_performance
  ON system_prompts(performance_score DESC NULLS LAST);

-- Comentários
COMMENT ON TABLE system_prompts IS
  '[Self-Improving AI] Versionamento de prompts com histórico e métricas de performance';

COMMENT ON COLUMN system_prompts.parent_id IS
  'Referência ao prompt anterior (permite rastrear evolução)';

COMMENT ON COLUMN system_prompts.performance_score IS
  'Score médio das avaliações (0-5), calculado pelo reflection loop';

COMMENT ON COLUMN system_prompts.change_reason IS
  'Trigger da mudança: auto_improvement, manual_edit, rollback, initial';


-- ============================================
-- TABELA 2: REFLECTION_LOGS
-- ============================================
-- Logs de cada ciclo de reflexão executado
-- Armazena scores, análises e decisões tomadas

CREATE TABLE IF NOT EXISTS reflection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,
  system_prompt_id UUID REFERENCES system_prompts(id) ON DELETE SET NULL,

  -- Período analisado
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Métricas do período
  conversations_analyzed INTEGER NOT NULL DEFAULT 0,
  messages_analyzed INTEGER NOT NULL DEFAULT 0,

  -- Scores por critério (rubrica do AI-as-Judge)
  score_completeness DECIMAL(3,2), -- Completude (20%)
  score_depth DECIMAL(3,2),        -- Profundidade (25%)
  score_tone DECIMAL(3,2),         -- Tom/Personalidade (15%)
  score_scope DECIMAL(3,2),        -- Escopo/Relevância (20%)
  score_missed_opportunities DECIMAL(3,2), -- Oportunidades Perdidas (20%)

  -- Score agregado (weighted average)
  overall_score DECIMAL(3,2) NOT NULL,

  -- Breakdown detalhado
  score_breakdown JSONB DEFAULT '{}',
  -- Estrutura:
  -- {
  --   "completeness": {"score": 4.2, "weight": 0.20, "feedback": "..."},
  --   "depth": {"score": 3.8, "weight": 0.25, "feedback": "..."},
  --   ...
  --   "examples": ["msg_id_1", "msg_id_2"],
  --   "worst_conversations": ["conv_id_1"]
  -- }

  -- Análise qualitativa (gerada pela IA)
  strengths TEXT[], -- Pontos fortes identificados
  weaknesses TEXT[], -- Pontos fracos identificados
  patterns_identified TEXT[], -- Padrões detectados

  -- Decisão tomada (baseada no decision framework)
  action_taken VARCHAR(50) NOT NULL, -- 'none', 'suggestion', 'auto_update', 'escalate'
  action_reason TEXT, -- Justificativa da decisão

  -- Sugestão gerada (se houver)
  suggestion_id UUID, -- FK para improvement_suggestions

  -- Safety checks
  cooldown_respected BOOLEAN DEFAULT true,
  previous_reflection_id UUID REFERENCES reflection_logs(id),
  hours_since_last_reflection DECIMAL(10,2),

  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'running', 'completed', 'failed', 'cancelled'
  error_message TEXT,

  -- Metadata de execução
  execution_time_ms INTEGER,
  evaluator_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_overall_score CHECK (overall_score >= 0 AND overall_score <= 5),
  CONSTRAINT valid_action CHECK (action_taken IN ('none', 'suggestion', 'auto_update', 'escalate'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reflection_logs_agent
  ON reflection_logs(agent_version_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_logs_score
  ON reflection_logs(overall_score, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_logs_action
  ON reflection_logs(action_taken, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_logs_period
  ON reflection_logs(period_start, period_end);

-- Índice GIN para busca em arrays
CREATE INDEX IF NOT EXISTS idx_reflection_logs_weaknesses
  ON reflection_logs USING gin(weaknesses);

-- Comentários
COMMENT ON TABLE reflection_logs IS
  '[Self-Improving AI] Logs de cada ciclo de reflexão com scores e decisões';

COMMENT ON COLUMN reflection_logs.action_taken IS
  'Decisão: none (>=4.0), suggestion (3.0-3.9), auto_update (2.0-2.9), escalate (<2.0)';

COMMENT ON COLUMN reflection_logs.cooldown_respected IS
  'Se respeitou o período mínimo de 6h entre reflexões';


-- ============================================
-- TABELA 3: IMPROVEMENT_SUGGESTIONS
-- ============================================
-- Sugestões de melhoria geradas pelo sistema
-- Podem ser aprovadas, rejeitadas ou aplicadas automaticamente

CREATE TABLE IF NOT EXISTS improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,
  reflection_log_id UUID NOT NULL REFERENCES reflection_logs(id) ON DELETE CASCADE,
  current_prompt_id UUID REFERENCES system_prompts(id),

  -- Conteúdo da sugestão
  suggestion_type VARCHAR(50) NOT NULL, -- 'prompt_update', 'config_change', 'escalation'

  -- Mudança proposta
  current_value TEXT, -- Valor atual (para comparação)
  suggested_value TEXT NOT NULL, -- Valor sugerido
  diff_summary TEXT, -- Resumo das diferenças

  -- Análise da IA
  rationale TEXT NOT NULL, -- Justificativa da sugestão
  expected_improvement TEXT, -- Melhoria esperada
  risk_assessment TEXT, -- Avaliação de risco
  confidence_score DECIMAL(3,2), -- 0.00 a 1.00

  -- Áreas de foco
  focus_areas TEXT[], -- ['tone', 'completeness', 'engagement']

  -- Status do ciclo de aprovação
  status VARCHAR(50) DEFAULT 'pending',
  -- 'pending', 'approved', 'rejected', 'auto_applied', 'rolled_back'

  -- Aprovação
  reviewed_by UUID, -- User ID que revisou
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Aplicação
  applied_at TIMESTAMPTZ,
  applied_prompt_id UUID REFERENCES system_prompts(id), -- Novo prompt criado

  -- Rollback (se necessário)
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Métricas pós-aplicação
  post_apply_score DECIMAL(3,2), -- Score após aplicar a sugestão
  improvement_delta DECIMAL(3,2), -- Diferença de score (positivo = melhorou)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Sugestões expiram após X dias

  -- Constraints
  CONSTRAINT valid_suggestion_type CHECK (
    suggestion_type IN ('prompt_update', 'config_change', 'escalation')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'approved', 'rejected', 'auto_applied', 'rolled_back')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_suggestions_agent
  ON improvement_suggestions(agent_version_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_status
  ON improvement_suggestions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_pending
  ON improvement_suggestions(agent_version_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_suggestions_reflection
  ON improvement_suggestions(reflection_log_id);

-- Índice GIN para focus_areas
CREATE INDEX IF NOT EXISTS idx_suggestions_focus
  ON improvement_suggestions USING gin(focus_areas);

-- Comentários
COMMENT ON TABLE improvement_suggestions IS
  '[Self-Improving AI] Sugestões de melhoria com ciclo de aprovação';

COMMENT ON COLUMN improvement_suggestions.confidence_score IS
  'Confiança da IA na sugestão (0-1). Auto-apply se >= 0.8';

COMMENT ON COLUMN improvement_suggestions.improvement_delta IS
  'Diferença de score após aplicação. Positivo = melhorou';


-- ============================================
-- TABELA 4: SELF_IMPROVING_SETTINGS
-- ============================================
-- Configurações do sistema por agente/location

CREATE TABLE IF NOT EXISTS self_improving_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Escopo (pode ser por agent ou global por location)
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
  location_id VARCHAR(100),

  -- Configurações de reflexão
  reflection_enabled BOOLEAN DEFAULT true,
  reflection_interval_hours INTEGER DEFAULT 6, -- Mínimo 6h entre reflexões
  min_conversations_for_reflection INTEGER DEFAULT 10,

  -- Thresholds de decisão (do rubric)
  threshold_none DECIMAL(3,2) DEFAULT 4.0, -- Score >= 4.0 = nenhuma ação
  threshold_suggestion DECIMAL(3,2) DEFAULT 3.0, -- 3.0-3.9 = gerar sugestão
  threshold_auto_update DECIMAL(3,2) DEFAULT 2.0, -- 2.0-2.9 = auto-update
  -- < 2.0 = escalate

  -- Limites de segurança
  max_updates_per_day INTEGER DEFAULT 3,
  cooldown_after_update_hours INTEGER DEFAULT 6,
  require_approval_below_confidence DECIMAL(3,2) DEFAULT 0.8,

  -- Auto-apply settings
  auto_apply_enabled BOOLEAN DEFAULT false, -- Começa desabilitado por segurança
  auto_apply_min_confidence DECIMAL(3,2) DEFAULT 0.85,
  auto_apply_max_score_drop DECIMAL(3,2) DEFAULT 0.5, -- Rollback se score cair mais que isso

  -- Notificações
  notify_on_suggestion BOOLEAN DEFAULT true,
  notify_on_auto_update BOOLEAN DEFAULT true,
  notify_on_escalation BOOLEAN DEFAULT true,
  notification_emails TEXT[], -- Emails para notificar
  notification_webhook_url TEXT, -- Webhook para n8n/GHL

  -- Modelo avaliador
  evaluator_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: apenas uma config por agent ou location
  UNIQUE NULLS NOT DISTINCT (agent_version_id),
  UNIQUE NULLS NOT DISTINCT (location_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_settings_agent
  ON self_improving_settings(agent_version_id);

CREATE INDEX IF NOT EXISTS idx_settings_location
  ON self_improving_settings(location_id);

-- Comentários
COMMENT ON TABLE self_improving_settings IS
  '[Self-Improving AI] Configurações do sistema de auto-melhoria';

COMMENT ON COLUMN self_improving_settings.auto_apply_enabled IS
  'CUIDADO: Habilitar permite mudanças automáticas no prompt';


-- ============================================
-- TRIGGERS E FUNCTIONS
-- ============================================

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_self_improving_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_system_prompts_timestamp
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_self_improving_timestamp();

CREATE TRIGGER trigger_suggestions_timestamp
  BEFORE UPDATE ON improvement_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_self_improving_timestamp();

CREATE TRIGGER trigger_settings_timestamp
  BEFORE UPDATE ON self_improving_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_self_improving_timestamp();


-- Function para garantir apenas um prompt ativo por agente
CREATE OR REPLACE FUNCTION ensure_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE system_prompts
    SET is_active = false, deactivated_at = NOW()
    WHERE agent_version_id = NEW.agent_version_id
      AND id != NEW.id
      AND is_active = true;

    NEW.activated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_prompt
  BEFORE INSERT OR UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_prompt();


-- ============================================
-- VIEWS PARA DASHBOARD
-- ============================================

-- View: Resumo de performance por agente
CREATE OR REPLACE VIEW vw_self_improving_summary AS
SELECT
  av.id as agent_version_id,
  av.agent_name,
  av.version,
  av.status as agent_status,

  -- Prompt ativo
  sp.id as active_prompt_id,
  sp.version as prompt_version,
  sp.performance_score as current_score,
  sp.total_evaluations,

  -- Última reflexão
  rl.id as last_reflection_id,
  rl.overall_score as last_reflection_score,
  rl.action_taken as last_action,
  rl.created_at as last_reflection_at,

  -- Sugestões pendentes
  (SELECT COUNT(*) FROM improvement_suggestions s
   WHERE s.agent_version_id = av.id AND s.status = 'pending') as pending_suggestions,

  -- Configurações
  ss.reflection_enabled,
  ss.auto_apply_enabled,
  ss.max_updates_per_day,

  -- Contadores últimas 24h
  (SELECT COUNT(*) FROM reflection_logs r
   WHERE r.agent_version_id = av.id
   AND r.created_at >= NOW() - INTERVAL '24 hours') as reflections_24h,

  (SELECT COUNT(*) FROM improvement_suggestions s
   WHERE s.agent_version_id = av.id
   AND s.status = 'auto_applied'
   AND s.applied_at >= NOW() - INTERVAL '24 hours') as auto_updates_24h

FROM agent_versions av
LEFT JOIN system_prompts sp ON sp.agent_version_id = av.id AND sp.is_active = true
LEFT JOIN LATERAL (
  SELECT * FROM reflection_logs
  WHERE agent_version_id = av.id
  ORDER BY created_at DESC
  LIMIT 1
) rl ON true
LEFT JOIN self_improving_settings ss ON ss.agent_version_id = av.id;

COMMENT ON VIEW vw_self_improving_summary IS
  '[Self-Improving AI] Resumo de status do sistema por agente';


-- View: Histórico de evolução de scores
CREATE OR REPLACE VIEW vw_score_evolution AS
SELECT
  rl.agent_version_id,
  av.agent_name,
  rl.created_at::DATE as date,
  AVG(rl.overall_score) as avg_score,
  AVG(rl.score_completeness) as avg_completeness,
  AVG(rl.score_depth) as avg_depth,
  AVG(rl.score_tone) as avg_tone,
  AVG(rl.score_scope) as avg_scope,
  AVG(rl.score_missed_opportunities) as avg_missed_opportunities,
  COUNT(*) as reflection_count,
  SUM(CASE WHEN rl.action_taken = 'auto_update' THEN 1 ELSE 0 END) as auto_updates,
  SUM(CASE WHEN rl.action_taken = 'escalate' THEN 1 ELSE 0 END) as escalations
FROM reflection_logs rl
JOIN agent_versions av ON av.id = rl.agent_version_id
GROUP BY rl.agent_version_id, av.agent_name, rl.created_at::DATE
ORDER BY rl.created_at::DATE DESC;

COMMENT ON VIEW vw_score_evolution IS
  '[Self-Improving AI] Evolução de scores ao longo do tempo';


-- View: Sugestões pendentes para revisão
CREATE OR REPLACE VIEW vw_pending_suggestions AS
SELECT
  s.id,
  s.agent_version_id,
  av.agent_name,
  s.suggestion_type,
  s.rationale,
  s.expected_improvement,
  s.confidence_score,
  s.focus_areas,
  s.created_at,
  s.expires_at,
  rl.overall_score as trigger_score,
  rl.weaknesses as trigger_weaknesses
FROM improvement_suggestions s
JOIN agent_versions av ON av.id = s.agent_version_id
JOIN reflection_logs rl ON rl.id = s.reflection_log_id
WHERE s.status = 'pending'
ORDER BY s.confidence_score DESC, s.created_at ASC;

COMMENT ON VIEW vw_pending_suggestions IS
  '[Self-Improving AI] Sugestões aguardando aprovação';


-- ============================================
-- RPC FUNCTIONS PARA N8N/EDGE FUNCTIONS
-- ============================================

-- Function: Buscar configurações do agente
CREATE OR REPLACE FUNCTION get_self_improving_config(p_agent_version_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT jsonb_build_object(
    'agent_version_id', s.agent_version_id,
    'reflection_enabled', s.reflection_enabled,
    'reflection_interval_hours', s.reflection_interval_hours,
    'min_conversations', s.min_conversations_for_reflection,
    'thresholds', jsonb_build_object(
      'none', s.threshold_none,
      'suggestion', s.threshold_suggestion,
      'auto_update', s.threshold_auto_update
    ),
    'auto_apply', jsonb_build_object(
      'enabled', s.auto_apply_enabled,
      'min_confidence', s.auto_apply_min_confidence,
      'max_score_drop', s.auto_apply_max_score_drop
    ),
    'limits', jsonb_build_object(
      'max_updates_per_day', s.max_updates_per_day,
      'cooldown_hours', s.cooldown_after_update_hours
    ),
    'evaluator_model', s.evaluator_model
  ) INTO v_config
  FROM self_improving_settings s
  WHERE s.agent_version_id = p_agent_version_id;

  -- Se não encontrou, retorna config padrão
  IF v_config IS NULL THEN
    v_config := jsonb_build_object(
      'agent_version_id', p_agent_version_id,
      'reflection_enabled', true,
      'reflection_interval_hours', 6,
      'min_conversations', 10,
      'thresholds', jsonb_build_object('none', 4.0, 'suggestion', 3.0, 'auto_update', 2.0),
      'auto_apply', jsonb_build_object('enabled', false, 'min_confidence', 0.85, 'max_score_drop', 0.5),
      'limits', jsonb_build_object('max_updates_per_day', 3, 'cooldown_hours', 6),
      'evaluator_model', 'claude-sonnet-4-20250514'
    );
  END IF;

  RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Verificar se pode executar reflexão
CREATE OR REPLACE FUNCTION can_run_reflection(p_agent_version_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_reflection TIMESTAMPTZ;
  v_hours_since DECIMAL;
  v_config JSONB;
  v_updates_today INTEGER;
  v_can_run BOOLEAN := true;
  v_reason TEXT := 'OK';
BEGIN
  -- Buscar config
  v_config := get_self_improving_config(p_agent_version_id);

  -- Verificar se está habilitado
  IF NOT (v_config->>'reflection_enabled')::BOOLEAN THEN
    RETURN jsonb_build_object('can_run', false, 'reason', 'Reflection disabled for this agent');
  END IF;

  -- Buscar última reflexão
  SELECT created_at INTO v_last_reflection
  FROM reflection_logs
  WHERE agent_version_id = p_agent_version_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calcular horas desde última reflexão
  IF v_last_reflection IS NOT NULL THEN
    v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_reflection)) / 3600;

    IF v_hours_since < (v_config->'limits'->>'cooldown_hours')::INTEGER THEN
      RETURN jsonb_build_object(
        'can_run', false,
        'reason', format('Cooldown: %.1f hours since last reflection (min: %s)',
                        v_hours_since, v_config->'limits'->>'cooldown_hours'),
        'hours_since_last', v_hours_since
      );
    END IF;
  END IF;

  -- Verificar limite diário de updates
  SELECT COUNT(*) INTO v_updates_today
  FROM improvement_suggestions
  WHERE agent_version_id = p_agent_version_id
    AND status = 'auto_applied'
    AND applied_at >= CURRENT_DATE;

  IF v_updates_today >= (v_config->'limits'->>'max_updates_per_day')::INTEGER THEN
    RETURN jsonb_build_object(
      'can_run', true,
      'reason', 'Can run but auto-update limit reached for today',
      'auto_update_blocked', true,
      'updates_today', v_updates_today
    );
  END IF;

  RETURN jsonb_build_object(
    'can_run', true,
    'reason', 'OK',
    'hours_since_last', v_hours_since,
    'updates_today', v_updates_today,
    'config', v_config
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir configurações padrão para agentes existentes que não têm
INSERT INTO self_improving_settings (agent_version_id, reflection_enabled, auto_apply_enabled)
SELECT id, true, false
FROM agent_versions
WHERE id NOT IN (SELECT agent_version_id FROM self_improving_settings WHERE agent_version_id IS NOT NULL)
ON CONFLICT DO NOTHING;


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SELF-IMPROVING AI SYSTEM - Migration Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - system_prompts (versionamento de prompts)';
  RAISE NOTICE '  - reflection_logs (logs de reflexão)';
  RAISE NOTICE '  - improvement_suggestions (sugestões de melhoria)';
  RAISE NOTICE '  - self_improving_settings (configurações)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - vw_self_improving_summary';
  RAISE NOTICE '  - vw_score_evolution';
  RAISE NOTICE '  - vw_pending_suggestions';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - get_self_improving_config(agent_id)';
  RAISE NOTICE '  - can_run_reflection(agent_id)';
  RAISE NOTICE '============================================';
END $$;
