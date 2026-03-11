-- ============================================
-- SENTINELA - EXPANSÃO DO SISTEMA DE INTELIGÊNCIA
-- Migration 012: Expansão CORRIGIDA (respeita schema existente)
-- ============================================
--
-- IMPORTANTE: Esta migration EXPANDE o sistema existente
-- NÃO recria tabelas que já existem!
--
-- TABELAS EXISTENTES (NÃO TOCAR):
-- - messages (apenas expandir)
-- - alerts
-- - process_maps
-- - automation_opportunities
-- - sales_metrics
-- - customer_engagement
-- - sentinel_insights
-- - knowledge_base
-- - issues
--
-- NOVAS TABELAS CRIADAS:
-- - problem_types
-- - process_categories
-- - sops
-- - sop_executions
-- - agent_types
-- - agents
-- - subagents
-- - agent_performance
-- - business_areas
-- - area_metrics
-- - group_sessions
-- ============================================

-- ============================================
-- PARTE 1: EXPANDIR TABELA MESSAGES EXISTENTE
-- ============================================

-- Adicionar colunas que faltam na tabela messages existente
DO $$
BEGIN
  -- Colunas de contexto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'external_id') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN external_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'contact_id') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN contact_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'customer_id') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN customer_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'customer_name') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN customer_name VARCHAR(255);
  END IF;

  -- Fonte e workflow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'source') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN source VARCHAR(50) DEFAULT 'ghl';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'location_name') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN location_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'workflow_id') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN workflow_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'workflow_name') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN workflow_name VARCHAR(255);
  END IF;

  -- Sender info expandido
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'sender_phone') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN sender_phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'sender_tags') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN sender_tags TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'sender_type') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN sender_type VARCHAR(50);
  END IF;

  -- Mensagem expandida
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN message_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'message_transcription') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN message_transcription TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'attachment_url') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN attachment_url TEXT;
  END IF;

  -- Flags de processamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'needs_attention') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN needs_attention BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'processed_by_observer') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN processed_by_observer BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'processed_by_sentinel') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN processed_by_sentinel BOOLEAN DEFAULT FALSE;
  END IF;

  -- Grupo expandido
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'is_group_message') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN is_group_message BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'group_type') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN group_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'group_sender_phone') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN group_sender_phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'group_sender_name') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN group_sender_name VARCHAR(255);
  END IF;

  -- Análise de time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'team_analysis') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN team_analysis JSONB;
  END IF;

  -- Keywords como array
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'messages' AND column_name = 'keywords') THEN
    ALTER TABLE mottivme_intelligence_system.messages ADD COLUMN keywords TEXT[];
  END IF;

END $$;

-- ============================================
-- PARTE 2: EXPANDIR TABELA ISSUES EXISTENTE
-- (para suportar funcionalidades de "problems")
-- ============================================

DO $$
BEGIN
  -- Tipo de problema
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'problem_type_code') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN problem_type_code VARCHAR(50);
  END IF;

  -- Source message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'source_message_id') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN source_message_id UUID;
  END IF;

  -- AI Analysis
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'ai_analysis') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN ai_analysis TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'ai_suggested_solution') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN ai_suggested_solution TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'root_cause') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN root_cause TEXT;
  END IF;

  -- SLA tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'acknowledged_at') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN acknowledged_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'time_to_acknowledge_minutes') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN time_to_acknowledge_minutes INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'time_to_resolution_minutes') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN time_to_resolution_minutes INTEGER;
  END IF;

  -- SOP gerado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'generated_sop_id') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN generated_sop_id UUID;
  END IF;

  -- Tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mottivme_intelligence_system' AND table_name = 'issues' AND column_name = 'tags') THEN
    ALTER TABLE mottivme_intelligence_system.issues ADD COLUMN tags TEXT[];
  END IF;

END $$;

-- ============================================
-- PARTE 3: TIPOS DE PROBLEMAS (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.problem_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- technical, process, people, client, financial
  default_priority VARCHAR(20) DEFAULT 'medium',
  auto_assign_to VARCHAR(255),
  sla_minutes INTEGER,
  requires_sop BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de tipos de problemas
INSERT INTO mottivme_intelligence_system.problem_types (code, name, category, default_priority, sla_minutes) VALUES
  ('ai_malfunction', 'IA com mal funcionamento', 'technical', 'high', 60),
  ('ai_wrong_response', 'IA deu resposta errada', 'technical', 'high', 30),
  ('missing_process', 'Processo não documentado', 'process', 'medium', 480),
  ('missing_sop', 'SOP faltando', 'process', 'medium', 480),
  ('blocked_approval', 'Bloqueado por aprovação', 'process', 'high', 120),
  ('client_complaint', 'Reclamação de cliente', 'client', 'critical', 60),
  ('client_churn_risk', 'Risco de churn', 'client', 'high', 240),
  ('payment_overdue', 'Pagamento atrasado', 'financial', 'high', 1440),
  ('team_overload', 'Membro do time sobrecarregado', 'people', 'medium', 240),
  ('team_off_hours', 'Trabalho fora do horário', 'people', 'low', NULL),
  ('ads_blocked', 'Conta de anúncios bloqueada', 'technical', 'critical', 30),
  ('integration_error', 'Erro de integração', 'technical', 'high', 120),
  ('manual_task_needed', 'Tarefa manual necessária', 'process', 'medium', 240),
  ('knowledge_gap', 'Gap de conhecimento', 'people', 'medium', 480),
  ('communication_failure', 'Falha de comunicação', 'process', 'medium', 120)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PARTE 4: CATEGORIAS DE PROCESSOS (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.process_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  icon VARCHAR(50),
  color VARCHAR(20)
);

INSERT INTO mottivme_intelligence_system.process_categories (code, name, department) VALUES
  ('sales_prospecting', 'Prospecção de Vendas', 'vendas'),
  ('sales_closing', 'Fechamento de Vendas', 'vendas'),
  ('client_onboarding', 'Onboarding de Clientes', 'cs'),
  ('client_support', 'Suporte ao Cliente', 'cs'),
  ('client_renewal', 'Renovação de Clientes', 'cs'),
  ('financial_billing', 'Faturamento', 'financeiro'),
  ('financial_collection', 'Cobrança', 'financeiro'),
  ('marketing_content', 'Produção de Conteúdo', 'marketing'),
  ('marketing_ads', 'Gestão de Anúncios', 'marketing'),
  ('tech_automation', 'Automações', 'tech'),
  ('tech_ai_agents', 'Agentes de IA', 'tech'),
  ('ops_general', 'Operações Gerais', 'operacoes'),
  ('hr_hiring', 'Contratação', 'rh'),
  ('hr_training', 'Treinamento', 'rh')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PARTE 5: SOPs - STANDARD OPERATING PROCEDURES (NOVA)
-- Complementa process_maps com mais estrutura
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  code VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_code VARCHAR(50) REFERENCES mottivme_intelligence_system.process_categories(code),

  -- Relacionamento com process_maps existente
  process_map_id UUID,

  -- Conteúdo estruturado
  objective TEXT,
  triggers TEXT[],
  steps JSONB,
  tools_needed TEXT[],
  roles_involved TEXT[],

  -- Tempo e métricas
  estimated_time_minutes INTEGER,
  success_criteria TEXT,
  kpis JSONB,

  -- Status e versão
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'deprecated')),
  version INTEGER DEFAULT 1,

  -- Origem
  origin VARCHAR(50), -- manual, ai_generated, problem_derived
  source_issue_id UUID,

  -- Responsáveis
  owner VARCHAR(255),
  created_by VARCHAR(255),
  last_updated_by VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Uso e efetividade
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  effectiveness_score DECIMAL(3,2),

  -- Relacionamentos
  related_sops UUID[],
  related_agents UUID[]
);

-- ============================================
-- PARTE 6: EXECUÇÕES DE SOPS (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.sop_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES mottivme_intelligence_system.sops(id),

  -- Quem executou
  executed_by VARCHAR(255),
  executed_by_type VARCHAR(50), -- human, agent

  -- Contexto
  context TEXT,
  trigger_reason TEXT,
  related_issue_id UUID,

  -- Resultado
  status VARCHAR(50), -- completed, partial, failed, abandoned
  actual_time_minutes INTEGER,
  steps_completed INTEGER,
  total_steps INTEGER,

  -- Feedback
  was_successful BOOLEAN,
  feedback TEXT,
  improvement_suggestions TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- PARTE 7: TIPOS DE AGENTES (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agent_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- sdr, cs, ops, analyst, coordinator
  capabilities TEXT[],
  required_integrations TEXT[]
);

INSERT INTO mottivme_intelligence_system.agent_types (code, name, category, capabilities) VALUES
  ('sdr_inbound', 'SDR Inbound', 'sdr', ARRAY['qualify_leads', 'schedule_meetings', 'answer_questions']),
  ('sdr_outbound', 'SDR Outbound', 'sdr', ARRAY['prospecting', 'cold_outreach', 'follow_up']),
  ('cs_onboarding', 'CS Onboarding', 'cs', ARRAY['onboarding', 'training', 'activation']),
  ('cs_support', 'CS Suporte', 'cs', ARRAY['ticket_handling', 'issue_resolution', 'escalation']),
  ('cs_retention', 'CS Retenção', 'cs', ARRAY['churn_prevention', 'renewal', 'upsell']),
  ('ops_scheduler', 'Scheduler', 'ops', ARRAY['scheduling', 'rescheduling', 'confirmations']),
  ('ops_followup', 'Follow Up', 'ops', ARRAY['follow_up', 'reminders', 'reengagement']),
  ('analyst_sentinel', 'Sentinel Observer', 'analyst', ARRAY['monitoring', 'analysis', 'alerting']),
  ('coordinator_daily', 'Coordenador Diário', 'coordinator', ARRAY['daily_summary', 'task_distribution', 'priority_management'])
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PARTE 8: AGENTES (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_type_code VARCHAR(50) REFERENCES mottivme_intelligence_system.agent_types(code),

  -- Configuração GHL
  location_id VARCHAR(255),
  location_name VARCHAR(255),

  -- Persona
  persona JSONB,
  system_prompt TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated', 'testing')),
  is_production BOOLEAN DEFAULT FALSE,

  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  conversion_rate DECIMAL(5,4),
  satisfaction_score DECIMAL(3,2),

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_agent_id UUID REFERENCES mottivme_intelligence_system.agents(id),

  -- SOPs que usa
  sops_used UUID[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[],
  metadata JSONB
);

-- ============================================
-- PARTE 9: SUBAGENTES (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.subagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agent_id UUID REFERENCES mottivme_intelligence_system.agents(id),

  -- Identificação
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),

  -- Quando ativar
  trigger_conditions JSONB,

  -- Configuração específica
  additional_instructions TEXT,
  specific_sops UUID[],

  -- Status
  status VARCHAR(50) DEFAULT 'active',

  -- Métricas
  times_activated INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTE 10: PERFORMANCE DE AGENTES (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agent_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES mottivme_intelligence_system.agents(id),

  -- Período
  period_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily',

  -- Volume
  conversations_count INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,

  -- Qualidade
  positive_sentiment_rate DECIMAL(5,4),
  escalation_rate DECIMAL(5,4),
  resolution_rate DECIMAL(5,4),

  -- Conversão
  leads_qualified INTEGER,
  meetings_booked INTEGER,
  conversion_rate DECIMAL(5,4),

  -- Tempo
  avg_response_time_seconds INTEGER,
  avg_conversation_duration_minutes INTEGER,

  -- Problemas
  problems_detected INTEGER,
  problems_caused INTEGER,

  -- Feedback
  positive_feedback_count INTEGER,
  negative_feedback_count INTEGER,

  UNIQUE(agent_id, period_date, period_type)
);

-- ============================================
-- PARTE 11: ÁREAS DE NEGÓCIO (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.business_areas (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  responsible VARCHAR(255),
  team_members TEXT[],

  -- Metas
  monthly_targets JSONB,

  -- Status
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  automation_level INTEGER DEFAULT 0 CHECK (automation_level >= 0 AND automation_level <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO mottivme_intelligence_system.business_areas (code, name, responsible, team_members) VALUES
  ('sales', 'Vendas', 'Marcos Daniel', ARRAY['Isabella Delduco']),
  ('cs', 'Customer Success', 'Isabella Delduco', ARRAY['Isabella Delduco']),
  ('ops', 'Operações', 'Allesson', ARRAY['Allesson']),
  ('marketing', 'Marketing', 'Arthur Santos', ARRAY['Arthur Santos']),
  ('tech', 'Tecnologia', 'Marcos Daniel', ARRAY['Marcos Daniel', 'Allesson']),
  ('financial', 'Financeiro', 'Hallen Naiane', ARRAY['Hallen Naiane']),
  ('admin', 'Administrativo', 'Hallen Naiane', ARRAY['Hallen Naiane'])
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PARTE 12: MÉTRICAS POR ÁREA (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.area_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code VARCHAR(50) REFERENCES mottivme_intelligence_system.business_areas(code),
  metric_date DATE NOT NULL,

  -- Volume
  messages_count INTEGER DEFAULT 0,
  problems_detected INTEGER DEFAULT 0,
  problems_resolved INTEGER DEFAULT 0,

  -- Saúde
  health_score INTEGER,
  sentiment_avg DECIMAL(3,2),
  urgency_avg DECIMAL(4,2),

  -- Eficiência
  avg_response_time_minutes INTEGER,
  automation_rate DECIMAL(5,4),

  -- Metas
  target_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  target_completion_rate DECIMAL(5,4),

  -- Detalhes
  top_issues JSONB,
  highlights JSONB,
  recommendations TEXT[],

  UNIQUE(area_code, metric_date)
);

-- ============================================
-- PARTE 13: SESSÕES DE GRUPO (NOVA)
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,

  -- Grupo
  group_name VARCHAR(255),
  group_type VARCHAR(50),

  -- Período
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Métricas
  total_messages INTEGER DEFAULT 0,
  participants TEXT[],
  topics_discussed TEXT[],

  -- Análise
  summary TEXT,
  key_decisions TEXT[],
  action_items JSONB,
  problems_identified UUID[],

  -- Status
  status VARCHAR(50) DEFAULT 'active'
);

-- ============================================
-- PARTE 14: VIEWS ÚTEIS
-- ============================================

-- View: Issues/Problemas abertos por prioridade (expandida)
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_open_issues AS
SELECT
  i.*,
  pt.name as problem_type_name,
  pt.category as problem_category,
  pt.sla_minutes,
  EXTRACT(EPOCH FROM (NOW() - i.detected_at))/60 as minutes_open,
  CASE
    WHEN pt.sla_minutes IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - i.detected_at))/60 > pt.sla_minutes
    THEN TRUE
    ELSE FALSE
  END as sla_breached
FROM mottivme_intelligence_system.issues i
LEFT JOIN mottivme_intelligence_system.problem_types pt ON i.problem_type_code = pt.code
WHERE i.status NOT IN ('resolved', 'closed')
ORDER BY
  CASE i.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  i.detected_at ASC;

-- View: Saúde das áreas
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_area_health AS
SELECT
  ba.*,
  am.metric_date as last_metric_date,
  am.health_score as current_health,
  am.problems_detected as today_problems,
  am.automation_rate
FROM mottivme_intelligence_system.business_areas ba
LEFT JOIN mottivme_intelligence_system.area_metrics am
  ON ba.code = am.area_code
  AND am.metric_date = CURRENT_DATE;

-- View: Agentes ativos com performance
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_active_agents AS
SELECT
  a.*,
  at.name as agent_type_name,
  at.category as agent_category,
  ap.conversations_count as today_conversations,
  ap.conversion_rate as today_conversion
FROM mottivme_intelligence_system.agents a
JOIN mottivme_intelligence_system.agent_types at ON a.agent_type_code = at.code
LEFT JOIN mottivme_intelligence_system.agent_performance ap
  ON a.id = ap.agent_id
  AND ap.period_date = CURRENT_DATE
WHERE a.status = 'active';

-- View: Mensagens que precisam atenção
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_needs_attention AS
SELECT *
FROM mottivme_intelligence_system.messages
WHERE needs_attention = TRUE
  AND (processed_by_sentinel = FALSE OR processed_by_sentinel IS NULL)
ORDER BY urgency_score DESC, created_at DESC;

-- View: Backlog de automações (usa tabela existente)
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_automation_backlog AS
SELECT *
FROM mottivme_intelligence_system.automation_opportunities
WHERE status IN ('identified', 'in_progress')
ORDER BY priority_score DESC, created_at ASC;

-- View: SOPs publicados
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_published_sops AS
SELECT
  s.*,
  pc.name as category_name,
  pc.department
FROM mottivme_intelligence_system.sops s
LEFT JOIN mottivme_intelligence_system.process_categories pc ON s.category_code = pc.code
WHERE s.status = 'published'
ORDER BY s.usage_count DESC;

-- ============================================
-- PARTE 15: FUNÇÕES ÚTEIS
-- ============================================

-- Função: Criar issue a partir de mensagem
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.create_issue_from_message(
  p_message_id UUID,
  p_problem_type_code VARCHAR(50),
  p_title VARCHAR(500),
  p_description TEXT DEFAULT NULL,
  p_assigned_to VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_issue_id UUID;
  v_problem_type RECORD;
BEGIN
  -- Buscar tipo de problema
  SELECT * INTO v_problem_type
  FROM mottivme_intelligence_system.problem_types
  WHERE code = p_problem_type_code;

  -- Criar issue
  INSERT INTO mottivme_intelligence_system.issues (
    problem_type_code,
    title,
    description,
    source_message_id,
    assigned_to,
    priority
  ) VALUES (
    p_problem_type_code,
    p_title,
    p_description,
    p_message_id,
    COALESCE(p_assigned_to, v_problem_type.auto_assign_to),
    v_problem_type.default_priority
  ) RETURNING id INTO v_issue_id;

  -- Marcar mensagem como processada
  UPDATE mottivme_intelligence_system.messages
  SET processed_by_sentinel = TRUE
  WHERE id = p_message_id;

  RETURN v_issue_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Calcular health score da área
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.calculate_area_health(
  p_area_code VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 100;
  v_open_issues INTEGER;
  v_critical_issues INTEGER;
  v_sla_breaches INTEGER;
BEGIN
  -- Contar issues abertas
  SELECT COUNT(*) INTO v_open_issues
  FROM mottivme_intelligence_system.v_open_issues;

  -- Contar issues críticas
  SELECT COUNT(*) INTO v_critical_issues
  FROM mottivme_intelligence_system.issues
  WHERE priority = 'critical'
    AND status NOT IN ('resolved', 'closed');

  -- Contar SLA breaches
  SELECT COUNT(*) INTO v_sla_breaches
  FROM mottivme_intelligence_system.v_open_issues
  WHERE sla_breached = TRUE;

  -- Calcular score
  v_score := v_score - (v_open_issues * 5);
  v_score := v_score - (v_critical_issues * 15);
  v_score := v_score - (v_sla_breaches * 10);

  -- Limitar entre 0 e 100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Atualizar área
  UPDATE mottivme_intelligence_system.business_areas
  SET health_score = v_score, updated_at = NOW()
  WHERE code = p_area_code;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Função: Registrar execução de SOP
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.record_sop_execution(
  p_sop_id UUID,
  p_executed_by VARCHAR(255),
  p_executed_by_type VARCHAR(50),
  p_was_successful BOOLEAN,
  p_actual_time_minutes INTEGER DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
BEGIN
  INSERT INTO mottivme_intelligence_system.sop_executions (
    sop_id,
    executed_by,
    executed_by_type,
    status,
    actual_time_minutes,
    was_successful,
    feedback,
    completed_at
  ) VALUES (
    p_sop_id,
    p_executed_by,
    p_executed_by_type,
    CASE WHEN p_was_successful THEN 'completed' ELSE 'failed' END,
    p_actual_time_minutes,
    p_was_successful,
    p_feedback,
    NOW()
  ) RETURNING id INTO v_execution_id;

  -- Atualizar contagem de uso do SOP
  UPDATE mottivme_intelligence_system.sops
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_sop_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 16: ÍNDICES PARA NOVAS TABELAS
-- ============================================

-- Messages (novos índices)
CREATE INDEX IF NOT EXISTS idx_messages_needs_attention ON mottivme_intelligence_system.messages(needs_attention) WHERE needs_attention = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_processed_sentinel ON mottivme_intelligence_system.messages(processed_by_sentinel) WHERE processed_by_sentinel = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_sender_phone ON mottivme_intelligence_system.messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_messages_group_type ON mottivme_intelligence_system.messages(group_type);

-- Issues (novos índices)
CREATE INDEX IF NOT EXISTS idx_issues_problem_type ON mottivme_intelligence_system.issues(problem_type_code);
CREATE INDEX IF NOT EXISTS idx_issues_source_message ON mottivme_intelligence_system.issues(source_message_id);

-- SOPs
CREATE INDEX IF NOT EXISTS idx_sops_category ON mottivme_intelligence_system.sops(category_code);
CREATE INDEX IF NOT EXISTS idx_sops_status ON mottivme_intelligence_system.sops(status);
CREATE INDEX IF NOT EXISTS idx_sops_origin ON mottivme_intelligence_system.sops(origin);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON mottivme_intelligence_system.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_location ON mottivme_intelligence_system.agents(location_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON mottivme_intelligence_system.agents(agent_type_code);

-- Agent Performance
CREATE INDEX IF NOT EXISTS idx_agent_performance_date ON mottivme_intelligence_system.agent_performance(period_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent ON mottivme_intelligence_system.agent_performance(agent_id);

-- Area Metrics
CREATE INDEX IF NOT EXISTS idx_area_metrics_date ON mottivme_intelligence_system.area_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_area_metrics_area ON mottivme_intelligence_system.area_metrics(area_code);

-- Group Sessions
CREATE INDEX IF NOT EXISTS idx_group_sessions_status ON mottivme_intelligence_system.group_sessions(status);
CREATE INDEX IF NOT EXISTS idx_group_sessions_group ON mottivme_intelligence_system.group_sessions(group_name);

-- ============================================
-- PARTE 17: RLS (Row Level Security)
-- ============================================

ALTER TABLE mottivme_intelligence_system.problem_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.process_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.sop_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.subagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.business_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.area_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mottivme_intelligence_system.group_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajustar conforme necessidade)
CREATE POLICY "Allow all on problem_types" ON mottivme_intelligence_system.problem_types FOR ALL USING (true);
CREATE POLICY "Allow all on process_categories" ON mottivme_intelligence_system.process_categories FOR ALL USING (true);
CREATE POLICY "Allow all on sops" ON mottivme_intelligence_system.sops FOR ALL USING (true);
CREATE POLICY "Allow all on sop_executions" ON mottivme_intelligence_system.sop_executions FOR ALL USING (true);
CREATE POLICY "Allow all on agent_types" ON mottivme_intelligence_system.agent_types FOR ALL USING (true);
CREATE POLICY "Allow all on agents" ON mottivme_intelligence_system.agents FOR ALL USING (true);
CREATE POLICY "Allow all on subagents" ON mottivme_intelligence_system.subagents FOR ALL USING (true);
CREATE POLICY "Allow all on agent_performance" ON mottivme_intelligence_system.agent_performance FOR ALL USING (true);
CREATE POLICY "Allow all on business_areas" ON mottivme_intelligence_system.business_areas FOR ALL USING (true);
CREATE POLICY "Allow all on area_metrics" ON mottivme_intelligence_system.area_metrics FOR ALL USING (true);
CREATE POLICY "Allow all on group_sessions" ON mottivme_intelligence_system.group_sessions FOR ALL USING (true);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 'Migration 012 - Sentinel Expansion CORRIGIDA executada com sucesso!' as status;

-- Listar todas as tabelas do schema
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name
   AND c.table_schema = 'mottivme_intelligence_system') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'mottivme_intelligence_system'
ORDER BY table_name;
