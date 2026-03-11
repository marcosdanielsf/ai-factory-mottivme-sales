-- ============================================
-- MIGRATION 007: INTEGRATE AGENTIOS PERSONAS
-- ============================================
-- Description: Adiciona suporte para Self-Improving Lead Classifier
--              integrando padrões do AgenticOS com AI-Factory
-- Author: Database Engineer Agent
-- Date: 2026-01-01
-- Dependencies: Migration 001 (Self-Improving System)
-- Based on: AgenticOS multi-tenant lead generation
-- ============================================

-- ============================================
-- FASE 1: ADICIONAR MULTI-TENANCY AO AI-FACTORY
-- ============================================

-- Adicionar tenant_id nas tabelas existentes
ALTER TABLE system_prompts
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
ADD COLUMN location_id VARCHAR(100);

ALTER TABLE reflection_logs
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE improvement_suggestions
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE self_improving_settings
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Comentários
COMMENT ON COLUMN system_prompts.tenant_id IS
  '[Multi-Tenant] Isolamento por tenant - permite SaaS';

COMMENT ON COLUMN system_prompts.location_id IS
  '[Multi-Tenant] ID da location (GHL) - permite multi-location dentro de tenant';

-- Criar índices para multi-tenancy
CREATE INDEX IF NOT EXISTS idx_system_prompts_tenant
  ON system_prompts(tenant_id, agent_version_id);

CREATE INDEX IF NOT EXISTS idx_reflection_logs_tenant
  ON reflection_logs(tenant_id, agent_version_id);

CREATE INDEX IF NOT EXISTS idx_suggestions_tenant
  ON improvement_suggestions(tenant_id, agent_version_id);

CREATE INDEX IF NOT EXISTS idx_settings_tenant
  ON self_improving_settings(tenant_id);

-- Atualizar constraint de unique para considerar tenant
ALTER TABLE system_prompts
DROP CONSTRAINT IF EXISTS unique_agent_prompt_version,
ADD CONSTRAINT unique_tenant_agent_prompt_version
  UNIQUE (tenant_id, agent_version_id, version);

-- Habilitar RLS (Row Level Security)
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_improving_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para system_prompts
CREATE POLICY "system_prompts_tenant_isolation" ON system_prompts
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "system_prompts_select_own" ON system_prompts
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "system_prompts_insert_own" ON system_prompts
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "system_prompts_update_own" ON system_prompts
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- RLS Policies para reflection_logs
CREATE POLICY "reflection_logs_tenant_isolation" ON reflection_logs
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- RLS Policies para improvement_suggestions
CREATE POLICY "improvement_suggestions_tenant_isolation" ON improvement_suggestions
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- RLS Policies para self_improving_settings
CREATE POLICY "self_improving_settings_tenant_isolation" ON self_improving_settings
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );


-- ============================================
-- FASE 2: CRIAR TABELAS PARA PERSONAS (AgenticOS)
-- ============================================

-- Tabela: tenant_personas (ICP Versionado)
CREATE TABLE IF NOT EXISTS tenant_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Versionamento (CRÍTICO para histórico)
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false, -- Apenas 1 versão ativa por tenant

  -- PERSONA DO NEGÓCIO DO CLIENTE
  business_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  product_service TEXT NOT NULL,
  value_proposition TEXT,

  -- DORES QUE RESOLVE
  main_pain_points TEXT[] DEFAULT '{}',
  solutions_offered TEXT[] DEFAULT '{}',

  -- ICP - IDEAL CUSTOMER PROFILE
  ideal_niches TEXT[] DEFAULT '{}',
  ideal_job_titles TEXT[] DEFAULT '{}',
  ideal_business_types TEXT[] DEFAULT '{}',

  -- Filtros de perfil Instagram
  min_followers INTEGER DEFAULT 1000,
  max_followers INTEGER DEFAULT 100000,
  min_following INTEGER,
  max_following INTEGER,
  min_posts INTEGER DEFAULT 10,

  -- KEYWORDS para classificação
  positive_keywords TEXT[] DEFAULT '{}',
  negative_keywords TEXT[] DEFAULT '{}',

  -- Indicadores de qualificação
  qualification_signals TEXT[] DEFAULT '{}',
  disqualification_signals TEXT[] DEFAULT '{}',

  -- TOM DE VOZ e COMUNICAÇÃO
  brand_voice TEXT DEFAULT 'profissional',
  message_style TEXT DEFAULT 'direto',
  communication_guidelines TEXT,

  -- Prompt base para IA (pode ser sobrescrito)
  ai_classification_prompt TEXT,
  ai_response_prompt TEXT,

  -- Metadata de performance (será atualizado pelo sistema)
  leads_classified INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  avg_icp_score DECIMAL(5,2),

  -- INTEGRAÇÃO COM SELF-IMPROVING
  performance_score DECIMAL(3,2), -- 0.00-5.00 (calculado pelo reflection loop)
  last_reflection_at TIMESTAMPTZ,
  reflection_enabled BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(tenant_id, version),
  CONSTRAINT positive_followers CHECK (min_followers >= 0 AND max_followers > min_followers)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_personas_tenant ON tenant_personas(tenant_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_personas_active ON tenant_personas(tenant_id, is_active) WHERE is_active = true;

-- Índice GIN para arrays (busca rápida em keywords)
CREATE INDEX IF NOT EXISTS idx_personas_positive_kw ON tenant_personas USING gin(positive_keywords);
CREATE INDEX IF NOT EXISTS idx_personas_negative_kw ON tenant_personas USING gin(negative_keywords);

-- Habilitar RLS
ALTER TABLE tenant_personas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "tenant_personas_select_own" ON tenant_personas
  FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "tenant_personas_insert_own" ON tenant_personas
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

CREATE POLICY "tenant_personas_update_own" ON tenant_personas
  FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Trigger: Garantir apenas 1 persona ativa por tenant
CREATE OR REPLACE FUNCTION ensure_single_active_persona()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Desativa todas as outras personas do mesmo tenant
    UPDATE tenant_personas
    SET is_active = false, deactivated_at = NOW()
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND is_active = true;

    NEW.activated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_persona
  BEFORE INSERT OR UPDATE ON tenant_personas
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_persona();

-- Comentários
COMMENT ON TABLE tenant_personas IS
  '[Multi-Tenant] Personas/ICP versionados por tenant - permite histórico e A/B test';

COMMENT ON COLUMN tenant_personas.performance_score IS
  '[Self-Improving] Score calculado pelo reflection loop (0-5)';

COMMENT ON COLUMN tenant_personas.reflection_enabled IS
  '[Self-Improving] Se habilita reflection loop para esta persona';


-- ============================================
-- FASE 3: CRIAR TABELAS DE REFLECTION PARA PERSONAS
-- ============================================

-- Tabela: persona_reflection_logs
CREATE TABLE IF NOT EXISTS persona_reflection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES tenant_personas(id) ON DELETE CASCADE,

  -- Período analisado
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Métricas do período
  total_leads_classified INTEGER NOT NULL DEFAULT 0,
  hot_leads_count INTEGER DEFAULT 0,
  warm_leads_count INTEGER DEFAULT 0,
  cold_leads_count INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0, -- Leads HOT que não converteram
  false_negatives INTEGER DEFAULT 0, -- Leads COLD que converteram

  -- Scores (rubrica adaptada para lead classification)
  score_precision DECIMAL(3,2), -- Precisão das classificações (0-5)
  score_conversion_rate DECIMAL(3,2), -- Taxa de conversão (0-5)
  score_response_quality DECIMAL(3,2), -- Qualidade das respostas automáticas (0-5)
  score_keyword_relevance DECIMAL(3,2), -- Relevância dos keywords (0-5)
  overall_score DECIMAL(3,2) NOT NULL, -- Score agregado

  -- Breakdown detalhado
  score_breakdown JSONB DEFAULT '{}',
  -- Estrutura esperada:
  -- {
  --   "precision": {"score": 4.2, "weight": 0.30, "feedback": "..."},
  --   "conversion_rate": {"score": 3.8, "weight": 0.40, "feedback": "..."},
  --   "response_quality": {"score": 4.0, "weight": 0.20, "feedback": "..."},
  --   "keyword_relevance": {"score": 3.5, "weight": 0.10, "feedback": "..."}
  -- }

  -- Análise qualitativa
  strengths TEXT[], -- Pontos fortes identificados
  weaknesses TEXT[], -- Pontos fracos identificados
  patterns_identified TEXT[], -- Padrões detectados

  -- Keywords problemáticas
  keywords_causing_false_positives TEXT[],
  keywords_missing TEXT[], -- Keywords que deveriam estar

  -- Decisão tomada
  action_taken VARCHAR(50) NOT NULL, -- 'none', 'suggestion', 'auto_update', 'escalate'
  action_reason TEXT,

  -- Sugestão gerada (se houver)
  suggestion_id UUID, -- FK para persona_improvement_suggestions

  -- Safety checks
  cooldown_respected BOOLEAN DEFAULT true,
  previous_reflection_id UUID REFERENCES persona_reflection_logs(id),
  hours_since_last_reflection DECIMAL(10,2),

  -- Status
  status VARCHAR(50) DEFAULT 'completed',
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
CREATE INDEX IF NOT EXISTS idx_persona_reflection_tenant
  ON persona_reflection_logs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_reflection_persona
  ON persona_reflection_logs(persona_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_reflection_score
  ON persona_reflection_logs(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_persona_reflection_action
  ON persona_reflection_logs(action_taken, created_at DESC);

-- Índice GIN para arrays
CREATE INDEX IF NOT EXISTS idx_persona_reflection_weaknesses
  ON persona_reflection_logs USING gin(weaknesses);

CREATE INDEX IF NOT EXISTS idx_persona_reflection_false_positive_kw
  ON persona_reflection_logs USING gin(keywords_causing_false_positives);

-- Habilitar RLS
ALTER TABLE persona_reflection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_reflection_logs_tenant_isolation" ON persona_reflection_logs
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Comentários
COMMENT ON TABLE persona_reflection_logs IS
  '[Self-Improving Personas] Logs de reflexão para otimização de personas';

COMMENT ON COLUMN persona_reflection_logs.false_positives IS
  'Leads classificados como HOT mas que não converteram';

COMMENT ON COLUMN persona_reflection_logs.false_negatives IS
  'Leads classificados como COLD mas que converteram';


-- ============================================
-- FASE 4: CRIAR TABELA DE SUGESTÕES PARA PERSONAS
-- ============================================

-- Tabela: persona_improvement_suggestions
CREATE TABLE IF NOT EXISTS persona_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES tenant_personas(id) ON DELETE CASCADE,
  reflection_log_id UUID NOT NULL REFERENCES persona_reflection_logs(id) ON DELETE CASCADE,

  -- Tipo de sugestão
  suggestion_type VARCHAR(50) NOT NULL,
  -- 'keywords_update', 'prompt_update', 'scoring_weights', 'filters_update'

  -- Mudança proposta
  current_value JSONB NOT NULL, -- Valor atual (para comparação)
  suggested_value JSONB NOT NULL, -- Valor sugerido
  diff_summary TEXT,

  -- Análise da IA
  rationale TEXT NOT NULL,
  expected_improvement TEXT,
  risk_assessment TEXT,
  confidence_score DECIMAL(3,2), -- 0.00-1.00

  -- Áreas de foco
  focus_areas TEXT[], -- ['keywords', 'prompt', 'filters']

  -- Status do ciclo de aprovação
  status VARCHAR(50) DEFAULT 'pending',
  -- 'pending', 'approved', 'rejected', 'auto_applied', 'rolled_back'

  -- Aprovação
  reviewed_by UUID, -- User ID
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Aplicação
  applied_at TIMESTAMPTZ,
  applied_persona_id UUID REFERENCES tenant_personas(id), -- Nova persona criada

  -- Rollback
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Métricas pós-aplicação
  post_apply_conversion_rate DECIMAL(5,2),
  post_apply_false_positive_rate DECIMAL(5,2),
  improvement_delta DECIMAL(5,2), -- Diferença de conversão

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Sugestões expiram após X dias

  -- Constraints
  CONSTRAINT valid_suggestion_type CHECK (
    suggestion_type IN ('keywords_update', 'prompt_update', 'scoring_weights', 'filters_update')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'approved', 'rejected', 'auto_applied', 'rolled_back')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_persona_suggestions_tenant
  ON persona_improvement_suggestions(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_suggestions_persona
  ON persona_improvement_suggestions(persona_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_suggestions_status
  ON persona_improvement_suggestions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_persona_suggestions_pending
  ON persona_improvement_suggestions(tenant_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_persona_suggestions_reflection
  ON persona_improvement_suggestions(reflection_log_id);

-- Índice GIN para focus_areas
CREATE INDEX IF NOT EXISTS idx_persona_suggestions_focus
  ON persona_improvement_suggestions USING gin(focus_areas);

-- Habilitar RLS
ALTER TABLE persona_improvement_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persona_suggestions_tenant_isolation" ON persona_improvement_suggestions
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Comentários
COMMENT ON TABLE persona_improvement_suggestions IS
  '[Self-Improving Personas] Sugestões de melhoria com ciclo de aprovação';

COMMENT ON COLUMN persona_improvement_suggestions.confidence_score IS
  'Confiança da IA na sugestão (0-1). Auto-apply se >= 0.85';


-- ============================================
-- FASE 5: CRIAR VIEWS UNIFICADAS
-- ============================================

-- View: Performance unificada (Personas + Prompts)
CREATE OR REPLACE VIEW vw_unified_tenant_performance AS
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug,
  t.status,
  t.plan_tier,

  -- Persona ativa
  p.id as active_persona_id,
  p.version as persona_version,
  p.business_type,
  p.performance_score as persona_performance_score,
  p.leads_classified,
  p.conversion_rate as persona_conversion_rate,

  -- Prompt ativo (se houver integração com AI-Factory)
  sp.id as active_prompt_id,
  sp.version as prompt_version,
  sp.performance_score as prompt_performance_score,

  -- Última reflexão de persona
  prl.id as last_persona_reflection_id,
  prl.overall_score as last_persona_reflection_score,
  prl.action_taken as last_persona_action,
  prl.created_at as last_persona_reflection_at,

  -- Última reflexão de prompt
  rl.id as last_prompt_reflection_id,
  rl.overall_score as last_prompt_reflection_score,
  rl.action_taken as last_prompt_action,
  rl.created_at as last_prompt_reflection_at,

  -- Sugestões pendentes
  (SELECT COUNT(*) FROM persona_improvement_suggestions ps
   WHERE ps.tenant_id = t.id AND ps.status = 'pending') as pending_persona_suggestions,

  (SELECT COUNT(*) FROM improvement_suggestions s
   WHERE s.tenant_id = t.id AND s.status = 'pending') as pending_prompt_suggestions,

  -- Auto-updates últimas 24h
  (SELECT COUNT(*) FROM persona_improvement_suggestions ps
   WHERE ps.tenant_id = t.id
   AND ps.status = 'auto_applied'
   AND ps.applied_at >= NOW() - INTERVAL '24 hours') as persona_auto_updates_24h,

  (SELECT COUNT(*) FROM improvement_suggestions s
   WHERE s.tenant_id = t.id
   AND s.status = 'auto_applied'
   AND s.applied_at >= NOW() - INTERVAL '24 hours') as prompt_auto_updates_24h

FROM tenants t
LEFT JOIN tenant_personas p ON p.tenant_id = t.id AND p.is_active = true
LEFT JOIN system_prompts sp ON sp.tenant_id = t.id AND sp.is_active = true
LEFT JOIN LATERAL (
  SELECT * FROM persona_reflection_logs
  WHERE tenant_id = t.id
  ORDER BY created_at DESC
  LIMIT 1
) prl ON true
LEFT JOIN LATERAL (
  SELECT * FROM reflection_logs
  WHERE tenant_id = t.id
  ORDER BY created_at DESC
  LIMIT 1
) rl ON true;

COMMENT ON VIEW vw_unified_tenant_performance IS
  '[Unified Analytics] Performance integrada de personas e prompts por tenant';


-- View: Histórico de evolução de personas
CREATE OR REPLACE VIEW vw_persona_evolution AS
SELECT
  prl.tenant_id,
  t.name as tenant_name,
  prl.persona_id,
  p.version as persona_version,
  prl.created_at::DATE as date,
  prl.overall_score,
  prl.score_precision,
  prl.score_conversion_rate,
  prl.score_response_quality,
  prl.total_leads_classified,
  prl.false_positives,
  prl.false_negatives,
  prl.action_taken,
  COUNT(*) OVER (PARTITION BY prl.persona_id) as total_reflections,
  SUM(CASE WHEN prl.action_taken = 'auto_update' THEN 1 ELSE 0 END)
    OVER (PARTITION BY prl.persona_id) as total_auto_updates
FROM persona_reflection_logs prl
JOIN tenants t ON t.id = prl.tenant_id
JOIN tenant_personas p ON p.id = prl.persona_id
ORDER BY prl.created_at DESC;

COMMENT ON VIEW vw_persona_evolution IS
  '[Self-Improving Personas] Evolução de scores ao longo do tempo';


-- ============================================
-- FASE 6: CRIAR FUNCTIONS PARA N8N/API
-- ============================================

-- Function: Buscar persona ativa de um tenant
CREATE OR REPLACE FUNCTION get_active_persona(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_persona JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'tenant_id', p.tenant_id,
    'version', p.version,
    'business_type', p.business_type,
    'target_audience', p.target_audience,
    'product_service', p.product_service,
    'value_proposition', p.value_proposition,
    'main_pain_points', p.main_pain_points,
    'ideal_niches', p.ideal_niches,
    'ideal_job_titles', p.ideal_job_titles,
    'min_followers', p.min_followers,
    'max_followers', p.max_followers,
    'positive_keywords', p.positive_keywords,
    'negative_keywords', p.negative_keywords,
    'brand_voice', p.brand_voice,
    'message_style', p.message_style,
    'ai_classification_prompt', p.ai_classification_prompt,
    'ai_response_prompt', p.ai_response_prompt,
    'performance_score', p.performance_score,
    'reflection_enabled', p.reflection_enabled
  ) INTO v_persona
  FROM tenant_personas p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
  LIMIT 1;

  RETURN v_persona;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_persona IS
  '[Multi-Tenant] Retorna persona ativa de um tenant (usado pelo n8n)';


-- Function: Verificar se pode executar reflexão de persona
CREATE OR REPLACE FUNCTION can_run_persona_reflection(p_tenant_id UUID, p_persona_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_reflection TIMESTAMPTZ;
  v_hours_since DECIMAL;
  v_persona RECORD;
  v_leads_count INTEGER;
BEGIN
  -- Buscar persona
  SELECT * INTO v_persona
  FROM tenant_personas
  WHERE id = p_persona_id AND tenant_id = p_tenant_id;

  -- Verificar se existe
  IF v_persona IS NULL THEN
    RETURN jsonb_build_object('can_run', false, 'reason', 'Persona not found');
  END IF;

  -- Verificar se reflection está habilitado
  IF NOT v_persona.reflection_enabled THEN
    RETURN jsonb_build_object('can_run', false, 'reason', 'Reflection disabled for this persona');
  END IF;

  -- Buscar última reflexão
  SELECT created_at INTO v_last_reflection
  FROM persona_reflection_logs
  WHERE persona_id = p_persona_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calcular horas desde última reflexão
  IF v_last_reflection IS NOT NULL THEN
    v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_reflection)) / 3600;

    IF v_hours_since < 6 THEN
      RETURN jsonb_build_object(
        'can_run', false,
        'reason', format('Cooldown: %.1f hours since last reflection (min: 6)', v_hours_since),
        'hours_since_last', v_hours_since
      );
    END IF;
  END IF;

  -- Verificar se tem leads suficientes desde última reflexão
  SELECT COUNT(*) INTO v_leads_count
  FROM classified_leads
  WHERE tenant_id = p_tenant_id
    AND persona_version = v_persona.version
    AND created_at >= COALESCE(v_last_reflection, '1970-01-01'::TIMESTAMPTZ);

  IF v_leads_count < 10 THEN
    RETURN jsonb_build_object(
      'can_run', false,
      'reason', format('Not enough leads: %s (min: 10)', v_leads_count),
      'leads_since_last', v_leads_count
    );
  END IF;

  RETURN jsonb_build_object(
    'can_run', true,
    'reason', 'OK',
    'hours_since_last', v_hours_since,
    'leads_since_last', v_leads_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_run_persona_reflection IS
  '[Self-Improving Personas] Verifica se pode executar reflexão (cooldown, limites)';


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRATION 007 - INTEGRATE AGENTIOS PERSONAS';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fase 1: Multi-tenancy adicionado ao AI-Factory';
  RAISE NOTICE '  - tenant_id em system_prompts, reflection_logs, suggestions, settings';
  RAISE NOTICE '  - RLS habilitado em todas as tabelas';
  RAISE NOTICE '';
  RAISE NOTICE 'Fase 2: Tabelas de Personas criadas';
  RAISE NOTICE '  - tenant_personas (ICP versionado)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fase 3: Self-Improving Personas';
  RAISE NOTICE '  - persona_reflection_logs (tracking de performance)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fase 4: Sugestões de melhoria';
  RAISE NOTICE '  - persona_improvement_suggestions (auto-apply)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fase 5: Views unificadas';
  RAISE NOTICE '  - vw_unified_tenant_performance';
  RAISE NOTICE '  - vw_persona_evolution';
  RAISE NOTICE '';
  RAISE NOTICE 'Fase 6: Functions para API';
  RAISE NOTICE '  - get_active_persona(tenant_id)';
  RAISE NOTICE '  - can_run_persona_reflection(tenant_id, persona_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Executar Migration 008 (adicionar tenants table)';
  RAISE NOTICE '  2. Executar Migration 009 (adicionar classified_leads table)';
  RAISE NOTICE '  3. Configurar n8n workflow para Reflection Loop de personas';
  RAISE NOTICE '============================================';
END $$;
