-- ============================================
-- SENTINELA - SISTEMA DE INTELIGENCIA OPERACIONAL
-- Migration 011: Schema Completo Expandido
-- ============================================
--
-- OBJETIVO: Transformar o Sentinela de um simples
-- gravador de mensagens em um CEREBRO OPERACIONAL
-- que detecta problemas, identifica processos faltantes
-- e alimenta a criacao de agentes autonomos.
--
-- AREAS COBERTAS:
-- 1. Mensagens e Analise (atual)
-- 2. Problemas Detectados
-- 3. Processos/SOPs
-- 4. Agentes e Subagentes
-- 5. Metricas por Area
-- 6. Base de Conhecimento
-- 7. Automacoes Identificadas
-- ============================================

-- Schema separado para o Sentinela
CREATE SCHEMA IF NOT EXISTS mottivme_intelligence_system;

-- ============================================
-- PARTE 1: MENSAGENS (EXPANDIDO)
-- ============================================

-- Tabela principal de mensagens (ja existe, adicionar colunas)
-- Se nao existir, criar completa:
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.messages (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255),
  contact_id VARCHAR(255),
  customer_id VARCHAR(255),
  customer_name VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_at_brazil TIMESTAMPTZ,

  -- Fonte e contexto
  source VARCHAR(50) DEFAULT 'ghl', -- ghl, evolution, manual
  location_name VARCHAR(255),
  workflow_id VARCHAR(255),
  workflow_name VARCHAR(255),

  -- Sender info
  sender_name VARCHAR(255),
  sender_phone VARCHAR(50),
  sender_tags TEXT[],
  sender_type VARCHAR(50), -- team, client, prospect, unknown

  -- Mensagem
  message_type VARCHAR(50), -- text, audio, image, document
  message_body TEXT,
  message_transcription TEXT,
  attachment_url TEXT,

  -- Analise AI
  sentiment VARCHAR(20), -- positive, neutral, negative, urgent
  category VARCHAR(100),
  urgency_score INTEGER DEFAULT 0, -- 0-10
  keywords TEXT[],

  -- Flags
  needs_attention BOOLEAN DEFAULT FALSE,
  processed_by_observer BOOLEAN DEFAULT FALSE,
  processed_by_sentinel BOOLEAN DEFAULT FALSE,

  -- Grupo
  is_group_message BOOLEAN DEFAULT FALSE,
  group_type VARCHAR(50), -- internal, client, unknown
  group_name VARCHAR(255),
  group_sender_phone VARCHAR(50),
  group_sender_name VARCHAR(255),

  -- Analise de time
  team_analysis JSONB,

  -- Embedding para busca semantica
  embedding VECTOR(1536)
);

-- ============================================
-- PARTE 2: PROBLEMAS DETECTADOS
-- ============================================

-- Tipos de problemas que o sistema pode detectar
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.problem_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- technical, process, people, client, financial
  default_priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  auto_assign_to VARCHAR(255), -- role ou pessoa padrao
  sla_minutes INTEGER, -- tempo maximo pra resolver
  requires_sop BOOLEAN DEFAULT FALSE, -- se precisa de SOP pra resolver
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de tipos de problemas
INSERT INTO mottivme_intelligence_system.problem_types (code, name, category, default_priority, sla_minutes) VALUES
  ('ai_malfunction', 'IA com mal funcionamento', 'technical', 'high', 60),
  ('ai_wrong_response', 'IA deu resposta errada', 'technical', 'high', 30),
  ('missing_process', 'Processo nao documentado', 'process', 'medium', 480),
  ('missing_sop', 'SOP faltando', 'process', 'medium', 480),
  ('blocked_approval', 'Bloqueado por aprovacao', 'process', 'high', 120),
  ('client_complaint', 'Reclamacao de cliente', 'client', 'critical', 60),
  ('client_churn_risk', 'Risco de churn', 'client', 'high', 240),
  ('payment_overdue', 'Pagamento atrasado', 'financial', 'high', 1440),
  ('team_overload', 'Membro do time sobrecarregado', 'people', 'medium', 240),
  ('team_off_hours', 'Trabalho fora do horario', 'people', 'low', NULL),
  ('ads_blocked', 'Conta de anuncios bloqueada', 'technical', 'critical', 30),
  ('integration_error', 'Erro de integracao', 'technical', 'high', 120),
  ('manual_task_needed', 'Tarefa manual necessaria', 'process', 'medium', 240),
  ('knowledge_gap', 'Gap de conhecimento', 'people', 'medium', 480),
  ('communication_failure', 'Falha de comunicacao', 'process', 'medium', 120)
ON CONFLICT (code) DO NOTHING;

-- Problemas detectados
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_type_code VARCHAR(50) REFERENCES mottivme_intelligence_system.problem_types(code),

  -- Contexto
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_message_id INTEGER REFERENCES mottivme_intelligence_system.messages(id),
  source_group VARCHAR(255),

  -- Pessoas envolvidas
  detected_by VARCHAR(255), -- sistema ou pessoa
  reported_by_phone VARCHAR(50),
  reported_by_name VARCHAR(255),
  assigned_to VARCHAR(255),

  -- Cliente (se aplicavel)
  customer_id VARCHAR(255),
  customer_name VARCHAR(255),

  -- Status e prioridade
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, in_progress, blocked, resolved, wont_fix
  priority VARCHAR(20) DEFAULT 'medium',

  -- Analise AI
  ai_analysis TEXT,
  ai_suggested_solution TEXT,
  ai_suggested_sop_title VARCHAR(255),
  root_cause TEXT,

  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Metricas
  time_to_acknowledge_minutes INTEGER,
  time_to_resolution_minutes INTEGER,

  -- Resolucao
  resolution_notes TEXT,
  resolution_type VARCHAR(50), -- fixed, workaround, wont_fix, duplicate, not_a_problem

  -- Se gerou SOP/processo
  generated_sop_id UUID,

  -- Tags e metadata
  tags TEXT[],
  metadata JSONB
);

-- ============================================
-- PARTE 3: PROCESSOS E SOPs
-- ============================================

-- Categorias de processos
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.process_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100), -- vendas, operacoes, cs, financeiro, marketing, tech
  icon VARCHAR(50),
  color VARCHAR(20)
);

-- Seed de categorias
INSERT INTO mottivme_intelligence_system.process_categories (code, name, department) VALUES
  ('sales_prospecting', 'Prospecao de Vendas', 'vendas'),
  ('sales_closing', 'Fechamento de Vendas', 'vendas'),
  ('client_onboarding', 'Onboarding de Clientes', 'cs'),
  ('client_support', 'Suporte ao Cliente', 'cs'),
  ('client_renewal', 'Renovacao de Clientes', 'cs'),
  ('financial_billing', 'Faturamento', 'financeiro'),
  ('financial_collection', 'Cobranca', 'financeiro'),
  ('marketing_content', 'Producao de Conteudo', 'marketing'),
  ('marketing_ads', 'Gestao de Anuncios', 'marketing'),
  ('tech_automation', 'Automacoes', 'tech'),
  ('tech_ai_agents', 'Agentes de IA', 'tech'),
  ('ops_general', 'Operacoes Gerais', 'operacoes'),
  ('hr_hiring', 'Contratacao', 'rh'),
  ('hr_training', 'Treinamento', 'rh')
ON CONFLICT (code) DO NOTHING;

-- SOPs (Standard Operating Procedures)
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  code VARCHAR(50) UNIQUE, -- ex: SOP-SALES-001
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_code VARCHAR(50) REFERENCES mottivme_intelligence_system.process_categories(code),

  -- Conteudo
  objective TEXT, -- O que esse SOP resolve
  triggers TEXT[], -- O que dispara esse processo
  steps JSONB, -- Array de passos estruturados
  tools_needed TEXT[], -- Ferramentas necessarias
  roles_involved TEXT[], -- Quem participa

  -- Tempo e metricas
  estimated_time_minutes INTEGER,
  success_criteria TEXT,
  kpis JSONB, -- KPIs para medir sucesso

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, published, deprecated
  version INTEGER DEFAULT 1,

  -- Origem
  origin VARCHAR(50), -- manual, ai_generated, problem_derived
  source_problem_id UUID REFERENCES mottivme_intelligence_system.problems(id),

  -- Responsaveis
  owner VARCHAR(255), -- Dono do processo
  created_by VARCHAR(255),
  last_updated_by VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Uso
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  effectiveness_score DECIMAL(3,2), -- 0-1

  -- Relacionamentos
  related_sops UUID[],
  related_agents UUID[],

  -- Busca
  embedding VECTOR(1536)
);

-- Execucoes de SOPs (para medir efetividade)
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.sop_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES mottivme_intelligence_system.sops(id),

  -- Quem executou
  executed_by VARCHAR(255),
  executed_by_type VARCHAR(50), -- human, agent

  -- Contexto
  context TEXT,
  trigger_reason TEXT,
  related_problem_id UUID REFERENCES mottivme_intelligence_system.problems(id),

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
-- PARTE 4: AGENTES E SUBAGENTES
-- ============================================

-- Tipos de agentes
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agent_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- sdr, cs, ops, analyst, coordinator
  capabilities TEXT[],
  required_integrations TEXT[] -- ghl, n8n, supabase, etc
);

-- Seed de tipos
INSERT INTO mottivme_intelligence_system.agent_types (code, name, category, capabilities) VALUES
  ('sdr_inbound', 'SDR Inbound', 'sdr', ARRAY['qualify_leads', 'schedule_meetings', 'answer_questions']),
  ('sdr_outbound', 'SDR Outbound', 'sdr', ARRAY['prospecting', 'cold_outreach', 'follow_up']),
  ('cs_onboarding', 'CS Onboarding', 'cs', ARRAY['onboarding', 'training', 'activation']),
  ('cs_support', 'CS Suporte', 'cs', ARRAY['ticket_handling', 'issue_resolution', 'escalation']),
  ('cs_retention', 'CS Retencao', 'cs', ARRAY['churn_prevention', 'renewal', 'upsell']),
  ('ops_scheduler', 'Scheduler', 'ops', ARRAY['scheduling', 'rescheduling', 'confirmations']),
  ('ops_followup', 'Follow Up', 'ops', ARRAY['follow_up', 'reminders', 'reengagement']),
  ('analyst_sentinel', 'Sentinel Observer', 'analyst', ARRAY['monitoring', 'analysis', 'alerting']),
  ('coordinator_daily', 'Coordenador Diario', 'coordinator', ARRAY['daily_summary', 'task_distribution', 'priority_management'])
ON CONFLICT (code) DO NOTHING;

-- Agentes cadastrados
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  code VARCHAR(100) UNIQUE NOT NULL, -- ex: julia_amare_ve9EPM428h8vShlRW1KT
  name VARCHAR(255) NOT NULL, -- Julia Amare
  agent_type_code VARCHAR(50) REFERENCES mottivme_intelligence_system.agent_types(code),

  -- Configuracao
  location_id VARCHAR(255),
  location_name VARCHAR(255),

  -- Persona
  persona JSONB, -- tom, estilo, regras
  system_prompt TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, deprecated, testing
  is_production BOOLEAN DEFAULT FALSE,

  -- Metricas
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

-- Subagentes (especializacoes)
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.subagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agent_id UUID REFERENCES mottivme_intelligence_system.agents(id),

  -- Identificacao
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255), -- ex: "Follow-up pos-demo"

  -- Quando ativar
  trigger_conditions JSONB, -- condicoes pra ativar esse subagente

  -- Configuracao especifica
  additional_instructions TEXT,
  specific_sops UUID[],

  -- Status
  status VARCHAR(50) DEFAULT 'active',

  -- Metricas
  times_activated INTEGER DEFAULT 0,
  success_rate DECIMAL(5,4),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance de agentes (historico)
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.agent_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES mottivme_intelligence_system.agents(id),

  -- Periodo
  period_date DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly

  -- Volume
  conversations_count INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,

  -- Qualidade
  positive_sentiment_rate DECIMAL(5,4),
  escalation_rate DECIMAL(5,4),
  resolution_rate DECIMAL(5,4),

  -- Conversao (se aplicavel)
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
-- PARTE 5: METRICAS POR AREA
-- ============================================

-- Areas do negocio
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
  health_score INTEGER DEFAULT 100, -- 0-100
  automation_level INTEGER DEFAULT 0, -- 0-100 (quanto esta automatizado)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de areas
INSERT INTO mottivme_intelligence_system.business_areas (code, name, responsible, team_members) VALUES
  ('sales', 'Vendas', 'Marcos Daniel', ARRAY['Isabella Delduco']),
  ('cs', 'Customer Success', 'Isabella Delduco', ARRAY['Isabella Delduco']),
  ('ops', 'Operacoes', 'Allesson', ARRAY['Allesson']),
  ('marketing', 'Marketing', 'Arthur Santos', ARRAY['Arthur Santos']),
  ('tech', 'Tecnologia', 'Marcos Daniel', ARRAY['Marcos Daniel', 'Allesson']),
  ('financial', 'Financeiro', 'Hallen Naiane', ARRAY['Hallen Naiane']),
  ('admin', 'Administrativo', 'Hallen Naiane', ARRAY['Hallen Naiane'])
ON CONFLICT (code) DO NOTHING;

-- Metricas diarias por area
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.area_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code VARCHAR(50) REFERENCES mottivme_intelligence_system.business_areas(code),
  metric_date DATE NOT NULL,

  -- Volume de atividade
  messages_count INTEGER DEFAULT 0,
  problems_detected INTEGER DEFAULT 0,
  problems_resolved INTEGER DEFAULT 0,

  -- Saude
  health_score INTEGER, -- 0-100
  sentiment_avg DECIMAL(3,2), -- -1 a 1
  urgency_avg DECIMAL(4,2), -- 0-10

  -- Eficiencia
  avg_response_time_minutes INTEGER,
  automation_rate DECIMAL(5,4), -- quanto foi tratado por IA

  -- Metas (se aplicavel)
  target_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  target_completion_rate DECIMAL(5,4),

  -- Detalhes
  top_issues JSONB, -- principais problemas do dia
  highlights JSONB, -- destaques positivos
  recommendations TEXT[], -- sugestoes da AI

  UNIQUE(area_code, metric_date)
);

-- ============================================
-- PARTE 6: BASE DE CONHECIMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo
  type VARCHAR(50) NOT NULL, -- faq, article, solution, snippet, template
  category VARCHAR(100),

  -- Conteudo
  title VARCHAR(500) NOT NULL,
  question TEXT, -- se for FAQ
  answer TEXT,
  content TEXT,

  -- Tags e busca
  tags TEXT[],
  keywords TEXT[],
  embedding VECTOR(1536),

  -- Aplicabilidade
  applicable_to_areas TEXT[], -- areas que podem usar
  applicable_to_agents UUID[], -- agentes que podem usar

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, deprecated

  -- Uso
  usage_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2),

  -- Origem
  source VARCHAR(50), -- manual, ai_generated, extracted_from_conversation
  source_message_id INTEGER,
  source_problem_id UUID,

  -- Responsavel
  created_by VARCHAR(255),
  updated_by VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- ============================================
-- PARTE 7: OPORTUNIDADES DE AUTOMACAO
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.automation_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Contexto
  detected_from VARCHAR(50), -- message_pattern, problem_pattern, manual
  source_messages INTEGER[], -- IDs das mensagens que evidenciam
  source_problems UUID[], -- IDs dos problemas relacionados

  -- Analise
  current_process TEXT, -- como e feito hoje
  proposed_automation TEXT, -- como pode ser automatizado
  estimated_time_saved_weekly_minutes INTEGER,
  estimated_error_reduction_percent INTEGER,

  -- Complexidade
  complexity VARCHAR(20), -- low, medium, high
  implementation_effort VARCHAR(20), -- hours, days, weeks
  required_tools TEXT[],

  -- Impacto
  impact_areas TEXT[], -- areas afetadas
  impact_score INTEGER, -- 0-100
  roi_estimate DECIMAL(10,2),

  -- Status
  status VARCHAR(50) DEFAULT 'identified', -- identified, analyzing, approved, implementing, implemented, rejected

  -- Implementacao
  assigned_to VARCHAR(255),
  implementation_notes TEXT,
  implemented_at TIMESTAMPTZ,

  -- Resultado
  actual_time_saved_weekly_minutes INTEGER,
  actual_error_reduction_percent INTEGER,

  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  -- Tags
  tags TEXT[]
);

-- ============================================
-- PARTE 8: ALERTAS E NOTIFICACOES
-- ============================================

CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo e severidade
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

  -- Conteudo
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Contexto
  source_type VARCHAR(50), -- message, problem, metric, agent
  source_id VARCHAR(255),

  -- AI
  ai_analysis TEXT,
  ai_confidence_score DECIMAL(3,2),
  suggested_actions TEXT[],

  -- Destinatarios
  notify_roles TEXT[], -- quem deve ser notificado
  notify_users TEXT[],

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved, dismissed

  -- Acoes
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- PARTE 9: SESSOES DE CONVERSA
-- ============================================

-- Sessoes de grupo (para tracking de conversas)
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,

  -- Grupo
  group_name VARCHAR(255),
  group_type VARCHAR(50),

  -- Periodo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Metricas
  total_messages INTEGER DEFAULT 0,
  participants TEXT[],
  topics_discussed TEXT[],

  -- Analise
  summary TEXT,
  key_decisions TEXT[],
  action_items JSONB,
  problems_identified UUID[],

  -- Status
  status VARCHAR(50) DEFAULT 'active' -- active, idle, closed
);

-- ============================================
-- VIEWS UTEIS
-- ============================================

-- View: Problemas abertos por prioridade
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_open_problems AS
SELECT
  p.*,
  pt.name as problem_type_name,
  pt.category as problem_category,
  pt.sla_minutes,
  EXTRACT(EPOCH FROM (NOW() - p.detected_at))/60 as minutes_open,
  CASE
    WHEN pt.sla_minutes IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - p.detected_at))/60 > pt.sla_minutes
    THEN TRUE
    ELSE FALSE
  END as sla_breached
FROM mottivme_intelligence_system.problems p
JOIN mottivme_intelligence_system.problem_types pt ON p.problem_type_code = pt.code
WHERE p.status NOT IN ('resolved', 'wont_fix')
ORDER BY
  CASE p.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  p.detected_at ASC;

-- View: Saude das areas
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

-- View: Mensagens que precisam atencao
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_needs_attention AS
SELECT *
FROM mottivme_intelligence_system.messages
WHERE needs_attention = TRUE
  AND processed_by_sentinel = FALSE
ORDER BY urgency_score DESC, created_at DESC;

-- View: Oportunidades de automacao pendentes
CREATE OR REPLACE VIEW mottivme_intelligence_system.v_automation_backlog AS
SELECT *
FROM mottivme_intelligence_system.automation_opportunities
WHERE status IN ('identified', 'analyzing', 'approved')
ORDER BY impact_score DESC, detected_at ASC;

-- ============================================
-- FUNCOES UTEIS
-- ============================================

-- Funcao: Criar problema a partir de mensagem
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.create_problem_from_message(
  p_message_id INTEGER,
  p_problem_type_code VARCHAR(50),
  p_title VARCHAR(500),
  p_description TEXT DEFAULT NULL,
  p_assigned_to VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_problem_id UUID;
  v_message RECORD;
  v_problem_type RECORD;
BEGIN
  -- Buscar mensagem
  SELECT * INTO v_message
  FROM mottivme_intelligence_system.messages
  WHERE id = p_message_id;

  -- Buscar tipo de problema
  SELECT * INTO v_problem_type
  FROM mottivme_intelligence_system.problem_types
  WHERE code = p_problem_type_code;

  -- Criar problema
  INSERT INTO mottivme_intelligence_system.problems (
    problem_type_code,
    title,
    description,
    source_message_id,
    source_group,
    reported_by_phone,
    reported_by_name,
    assigned_to,
    priority
  ) VALUES (
    p_problem_type_code,
    p_title,
    COALESCE(p_description, v_message.message_body),
    p_message_id,
    v_message.group_name,
    v_message.sender_phone,
    v_message.sender_name,
    COALESCE(p_assigned_to, v_problem_type.auto_assign_to),
    v_problem_type.default_priority
  ) RETURNING id INTO v_problem_id;

  -- Marcar mensagem como processada
  UPDATE mottivme_intelligence_system.messages
  SET processed_by_sentinel = TRUE
  WHERE id = p_message_id;

  RETURN v_problem_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao: Atualizar metricas da area
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.update_area_metrics(
  p_area_code VARCHAR(50),
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO mottivme_intelligence_system.area_metrics (
    area_code,
    metric_date,
    messages_count,
    problems_detected,
    problems_resolved
  )
  SELECT
    p_area_code,
    p_date,
    COUNT(DISTINCT m.id),
    COUNT(DISTINCT p.id) FILTER (WHERE p.detected_at::DATE = p_date),
    COUNT(DISTINCT p.id) FILTER (WHERE p.resolved_at::DATE = p_date)
  FROM mottivme_intelligence_system.business_areas ba
  LEFT JOIN mottivme_intelligence_system.messages m
    ON m.created_at::DATE = p_date
  LEFT JOIN mottivme_intelligence_system.problems p
    ON TRUE
  WHERE ba.code = p_area_code
  GROUP BY ba.code
  ON CONFLICT (area_code, metric_date)
  DO UPDATE SET
    messages_count = EXCLUDED.messages_count,
    problems_detected = EXCLUDED.problems_detected,
    problems_resolved = EXCLUDED.problems_resolved;
END;
$$ LANGUAGE plpgsql;

-- Funcao: Calcular health score da area
CREATE OR REPLACE FUNCTION mottivme_intelligence_system.calculate_area_health(
  p_area_code VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 100;
  v_open_problems INTEGER;
  v_critical_problems INTEGER;
  v_sla_breaches INTEGER;
BEGIN
  -- Contar problemas abertos
  SELECT COUNT(*) INTO v_open_problems
  FROM mottivme_intelligence_system.v_open_problems
  WHERE problem_category IN (
    SELECT UNNEST(
      CASE p_area_code
        WHEN 'sales' THEN ARRAY['client', 'process']
        WHEN 'cs' THEN ARRAY['client', 'process']
        WHEN 'tech' THEN ARRAY['technical']
        WHEN 'financial' THEN ARRAY['financial']
        ELSE ARRAY['process']
      END
    )
  );

  -- Contar problemas criticos
  SELECT COUNT(*) INTO v_critical_problems
  FROM mottivme_intelligence_system.problems
  WHERE priority = 'critical'
    AND status NOT IN ('resolved', 'wont_fix');

  -- Contar SLA breaches
  SELECT COUNT(*) INTO v_sla_breaches
  FROM mottivme_intelligence_system.v_open_problems
  WHERE sla_breached = TRUE;

  -- Calcular score
  v_score := v_score - (v_open_problems * 5);
  v_score := v_score - (v_critical_problems * 15);
  v_score := v_score - (v_sla_breaches * 10);

  -- Limitar entre 0 e 100
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Atualizar area
  UPDATE mottivme_intelligence_system.business_areas
  SET health_score = v_score, updated_at = NOW()
  WHERE code = p_area_code;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES
-- ============================================

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON mottivme_intelligence_system.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_needs_attention ON mottivme_intelligence_system.messages(needs_attention) WHERE needs_attention = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_group ON mottivme_intelligence_system.messages(group_name) WHERE is_group_message = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON mottivme_intelligence_system.messages(sender_phone);

-- Problems
CREATE INDEX IF NOT EXISTS idx_problems_status ON mottivme_intelligence_system.problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_priority ON mottivme_intelligence_system.problems(priority);
CREATE INDEX IF NOT EXISTS idx_problems_detected_at ON mottivme_intelligence_system.problems(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_problems_assigned ON mottivme_intelligence_system.problems(assigned_to);

-- SOPs
CREATE INDEX IF NOT EXISTS idx_sops_category ON mottivme_intelligence_system.sops(category_code);
CREATE INDEX IF NOT EXISTS idx_sops_status ON mottivme_intelligence_system.sops(status);

-- Agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON mottivme_intelligence_system.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_location ON mottivme_intelligence_system.agents(location_id);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON mottivme_intelligence_system.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON mottivme_intelligence_system.alerts(severity);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON SCHEMA mottivme_intelligence_system IS 'Sistema de Inteligencia Operacional MOTTIVME - Sentinela';

COMMENT ON TABLE mottivme_intelligence_system.messages IS 'Todas as mensagens capturadas de grupos e conversas';
COMMENT ON TABLE mottivme_intelligence_system.problems IS 'Problemas detectados automaticamente ou reportados';
COMMENT ON TABLE mottivme_intelligence_system.sops IS 'Processos padrao (SOPs) da empresa';
COMMENT ON TABLE mottivme_intelligence_system.agents IS 'Agentes de IA cadastrados';
COMMENT ON TABLE mottivme_intelligence_system.business_areas IS 'Areas de negocio monitoradas';
COMMENT ON TABLE mottivme_intelligence_system.knowledge_base IS 'Base de conhecimento para agentes e equipe';
COMMENT ON TABLE mottivme_intelligence_system.automation_opportunities IS 'Oportunidades de automacao identificadas';
COMMENT ON TABLE mottivme_intelligence_system.alerts IS 'Alertas gerados pelo sistema';
