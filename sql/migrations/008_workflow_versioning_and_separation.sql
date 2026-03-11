-- ============================================
-- WORKFLOW VERSIONING & SEPARATION - MIGRATION 008
-- ============================================
-- Description: Separa fluxos internos (AI Factory) de fluxos de clientes
--              Adiciona versionamento completo de prompts e workflows
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2026-01-01
-- ============================================

-- ============================================
-- CONCEITO PRINCIPAL
-- ============================================
--
-- FLUXOS INTERNOS (scope = 'internal'):
--   - São os workflows da AI Factory que preparam/geram os fluxos de clientes
--   - Ex: 01-Organizador-Calls, 02-AI-Agent-Head-Vendas, 11-Reflection-Loop
--   - Usados apenas internamente pela MOTTIVME
--
-- FLUXOS DE CLIENTES (scope = 'client'):
--   - São os workflows gerados PARA os clientes
--   - Ex: Agentes SDR, chatbots, integrações específicas
--   - Cada cliente tem seus próprios fluxos derivados dos internos
--
-- TEMPLATES (scope = 'template'):
--   - São bases para gerar fluxos de clientes
--   - Ex: Template de SDR para clínicas, Template de follow-up
--
-- ============================================

-- ============================================
-- TABELA 1: WORKFLOW_REGISTRY
-- ============================================
-- Registro central de todos os workflows (internos, clientes, templates)

CREATE TABLE IF NOT EXISTS workflow_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  workflow_name VARCHAR(255) NOT NULL,
  workflow_key VARCHAR(100) UNIQUE NOT NULL, -- ex: 'head-vendas-v2', 'sdr-clinicas-template'
  description TEXT,

  -- Classificação
  scope VARCHAR(20) NOT NULL DEFAULT 'internal',
  -- 'internal' = AI Factory interno
  -- 'client' = Gerado para cliente
  -- 'template' = Base para gerar fluxos de clientes

  category VARCHAR(100), -- 'sales', 'onboarding', 'support', 'analysis', 'automation'

  -- Relacionamento hierárquico
  parent_template_id UUID REFERENCES workflow_registry(id), -- Se é derivado de template
  source_internal_id UUID REFERENCES workflow_registry(id), -- Qual interno o gerou

  -- Para fluxos de clientes
  location_id VARCHAR(100), -- GHL location_id
  client_id UUID, -- Referência a clients table se existir

  -- Versão atual
  current_version INTEGER DEFAULT 1,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  -- 'draft', 'active', 'deprecated', 'archived'

  -- Arquivo físico
  n8n_workflow_id VARCHAR(100), -- ID do workflow no n8n
  file_path TEXT, -- Caminho do JSON se existir

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_scope CHECK (scope IN ('internal', 'client', 'template')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'deprecated', 'archived'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_registry_scope ON workflow_registry(scope);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_location ON workflow_registry(location_id);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_category ON workflow_registry(category);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_parent ON workflow_registry(parent_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_tags ON workflow_registry USING gin(tags);

-- Comentários
COMMENT ON TABLE workflow_registry IS
  '[AI Factory] Registro central de todos os workflows - internos, templates e clientes';

COMMENT ON COLUMN workflow_registry.scope IS
  'internal = AI Factory, template = base para clientes, client = gerado para cliente';


-- ============================================
-- TABELA 2: WORKFLOW_VERSIONS
-- ============================================
-- Histórico de versões de cada workflow

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  workflow_id UUID NOT NULL REFERENCES workflow_registry(id) ON DELETE CASCADE,

  -- Versionamento
  version INTEGER NOT NULL,
  version_tag VARCHAR(50), -- 'v1.0.0', 'v2.0.0-beta'

  -- Relação com versão anterior
  parent_version_id UUID REFERENCES workflow_versions(id),

  -- Conteúdo
  workflow_json JSONB, -- O JSON completo do workflow n8n
  workflow_hash VARCHAR(64), -- SHA-256 para detectar mudanças

  -- Status
  is_current BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft',
  -- 'draft', 'testing', 'approved', 'active', 'deprecated', 'rolled_back'

  -- Changelog
  change_summary TEXT, -- Resumo das mudanças
  change_reason VARCHAR(100), -- 'initial', 'improvement', 'bugfix', 'rollback', 'feature'
  changed_by VARCHAR(255), -- Quem fez a mudança

  -- Validação
  validated_at TIMESTAMPTZ,
  validated_by VARCHAR(255),
  validation_notes TEXT,

  -- Métricas (populadas após uso)
  executions_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  avg_execution_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(workflow_id, version),
  CONSTRAINT valid_version_status CHECK (
    status IN ('draft', 'testing', 'approved', 'active', 'deprecated', 'rolled_back')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON workflow_versions(workflow_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_current ON workflow_versions(workflow_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_workflow_versions_status ON workflow_versions(status);

-- Comentários
COMMENT ON TABLE workflow_versions IS
  '[AI Factory] Histórico de versões de workflows com conteúdo completo';


-- ============================================
-- TABELA 3: PROMPT_REGISTRY
-- ============================================
-- Registro de prompts separado (podem ser usados em múltiplos workflows)

CREATE TABLE IF NOT EXISTS prompt_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  prompt_name VARCHAR(255) NOT NULL,
  prompt_key VARCHAR(100) UNIQUE NOT NULL, -- ex: 'head-vendas-bposs', 'sdr-clinicas'
  description TEXT,

  -- Classificação
  scope VARCHAR(20) NOT NULL DEFAULT 'internal',
  -- 'internal' = prompt dos fluxos AI Factory
  -- 'template' = base para customizar por cliente
  -- 'client' = prompt customizado para cliente específico

  prompt_type VARCHAR(50), -- 'system', 'user', 'assistant', 'function'
  category VARCHAR(100), -- 'sales', 'analysis', 'support', etc

  -- Relacionamento
  parent_template_id UUID REFERENCES prompt_registry(id), -- Se derivado de template
  workflow_id UUID REFERENCES workflow_registry(id), -- Workflow principal que usa

  -- Para prompts de clientes
  location_id VARCHAR(100),
  agent_version_id UUID REFERENCES agent_versions(id),

  -- Versão atual
  current_version INTEGER DEFAULT 1,

  -- Status
  status VARCHAR(50) DEFAULT 'active',

  -- Metadata
  tags TEXT[],
  variables_used TEXT[], -- Variáveis que o prompt espera: ['{{nome_empresa}}', '{{icp}}']

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_prompt_scope CHECK (scope IN ('internal', 'template', 'client')),
  CONSTRAINT valid_prompt_type CHECK (prompt_type IN ('system', 'user', 'assistant', 'function'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_registry_scope ON prompt_registry(scope);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_workflow ON prompt_registry(workflow_id);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_location ON prompt_registry(location_id);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_agent ON prompt_registry(agent_version_id);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_tags ON prompt_registry USING gin(tags);

-- Comentários
COMMENT ON TABLE prompt_registry IS
  '[AI Factory] Registro central de prompts - separado de workflows para reuso';


-- ============================================
-- TABELA 4: PROMPT_VERSIONS
-- ============================================
-- Histórico de versões de cada prompt

CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  prompt_id UUID NOT NULL REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Versionamento
  version INTEGER NOT NULL,

  -- Relação com versão anterior
  parent_version_id UUID REFERENCES prompt_versions(id),

  -- Conteúdo
  prompt_content TEXT NOT NULL,
  prompt_hash VARCHAR(64), -- SHA-256

  -- Configurações associadas
  model_config JSONB DEFAULT '{}',
  -- {
  --   "model": "llama-3.3-70b-versatile",
  --   "temperature": 0.7,
  --   "max_tokens": 4096
  -- }

  -- Status
  is_current BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft',

  -- Changelog
  change_summary TEXT,
  change_reason VARCHAR(100), -- 'initial', 'improvement', 'auto_improvement', 'rollback'
  changed_by VARCHAR(255),

  -- Métricas de performance (do self-improving system)
  performance_score DECIMAL(3,2), -- 0.00 a 5.00
  total_evaluations INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,

  -- Ligação com system_prompts (se existir)
  system_prompt_id UUID REFERENCES system_prompts(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(prompt_id, version),
  CONSTRAINT valid_prompt_version_status CHECK (
    status IN ('draft', 'testing', 'approved', 'active', 'deprecated', 'rolled_back')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_current ON prompt_versions(prompt_id) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_status ON prompt_versions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_performance ON prompt_versions(performance_score DESC NULLS LAST);

-- Comentários
COMMENT ON TABLE prompt_versions IS
  '[AI Factory] Histórico de versões de prompts com métricas de performance';


-- ============================================
-- TABELA 5: CLIENT_CONTEXTS (para onboarding)
-- ============================================
-- Contexto de negócio de cada cliente para customização de prompts

CREATE TABLE IF NOT EXISTS client_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação do cliente
  location_id VARCHAR(100) UNIQUE NOT NULL,
  client_id UUID,
  empresa_nome VARCHAR(255),

  -- Modelo de negócio
  segmento VARCHAR(255), -- 'Clínica odontológica', 'Consultoria', etc
  vertical VARCHAR(100), -- 'Saúde', 'Tecnologia', 'Serviços'
  tipo_venda VARCHAR(20), -- 'B2B', 'B2C', 'B2B2C'

  -- Tickets
  tickets JSONB DEFAULT '[]',
  -- [
  --   {"nome": "Entry", "preco": 3500, "perfil": "Iniciantes"},
  --   {"nome": "Standard", "preco": 5000, "perfil": "Maioria"}
  -- ]
  ticket_medio DECIMAL(10,2),
  ticket_minimo DECIMAL(10,2),

  -- ICP
  icp JSONB DEFAULT '{}',
  -- {
  --   "segmento_alvo": "Clínicas premium",
  --   "faturamento_minimo": 50000,
  --   "cargo_decisor": "Dono",
  --   "dor_principal": "Leads desperdiçados"
  -- }

  -- Red Flags
  red_flags_criticos TEXT[],
  red_flags_moderados TEXT[],

  -- Objeções
  objecoes JSONB DEFAULT '[]',
  -- [
  --   {"objecao": "Tá caro", "resposta_ideal": "...", "resposta_ruim": "..."}
  -- ]

  -- Processo de vendas
  etapas_funil JSONB DEFAULT '[]',
  tipos_call JSONB DEFAULT '[]',

  -- Concorrência
  concorrentes JSONB DEFAULT '[]',

  -- Metadata
  onboarding_completo BOOLEAN DEFAULT false,
  onboarding_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_contexts_location ON client_contexts(location_id);
CREATE INDEX IF NOT EXISTS idx_client_contexts_segmento ON client_contexts(segmento);
CREATE INDEX IF NOT EXISTS idx_client_contexts_onboarding ON client_contexts(onboarding_completo);

-- Comentários
COMMENT ON TABLE client_contexts IS
  '[AI Factory] Contexto de negócio do cliente para customização de prompts (onboarding)';


-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_registry_timestamp
  BEFORE UPDATE ON workflow_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

CREATE TRIGGER trigger_prompt_registry_timestamp
  BEFORE UPDATE ON prompt_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

CREATE TRIGGER trigger_client_contexts_timestamp
  BEFORE UPDATE ON client_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();


-- Trigger: Garantir apenas uma versão current por workflow
CREATE OR REPLACE FUNCTION ensure_single_current_workflow_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE workflow_versions
    SET is_current = false, deactivated_at = NOW()
    WHERE workflow_id = NEW.workflow_id
      AND id != NEW.id
      AND is_current = true;

    NEW.activated_at = NOW();
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_current_workflow_version
  BEFORE INSERT OR UPDATE ON workflow_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_workflow_version();


-- Trigger: Garantir apenas uma versão current por prompt
CREATE OR REPLACE FUNCTION ensure_single_current_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE prompt_versions
    SET is_current = false, deactivated_at = NOW()
    WHERE prompt_id = NEW.prompt_id
      AND id != NEW.id
      AND is_current = true;

    NEW.activated_at = NOW();
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_current_prompt_version
  BEFORE INSERT OR UPDATE ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_prompt_version();


-- ============================================
-- VIEWS
-- ============================================

-- View: Visão geral de workflows por scope
CREATE OR REPLACE VIEW vw_workflows_by_scope AS
SELECT
  scope,
  category,
  COUNT(*) as total_workflows,
  COUNT(*) FILTER (WHERE status = 'active') as active_workflows,
  MAX(updated_at) as last_updated
FROM workflow_registry
GROUP BY scope, category
ORDER BY scope, category;

COMMENT ON VIEW vw_workflows_by_scope IS
  '[AI Factory] Contagem de workflows por escopo e categoria';


-- View: Prompts ativos com versão atual
CREATE OR REPLACE VIEW vw_active_prompts AS
SELECT
  pr.id as prompt_id,
  pr.prompt_key,
  pr.prompt_name,
  pr.scope,
  pr.category,
  pr.location_id,
  pv.version,
  pv.prompt_content,
  pv.performance_score,
  pv.total_evaluations,
  pv.activated_at,
  wr.workflow_name
FROM prompt_registry pr
JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
LEFT JOIN workflow_registry wr ON wr.id = pr.workflow_id
WHERE pr.status = 'active';

COMMENT ON VIEW vw_active_prompts IS
  '[AI Factory] Prompts ativos com sua versão atual';


-- View: Clientes com contexto configurado
CREATE OR REPLACE VIEW vw_client_onboarding_status AS
SELECT
  cc.location_id,
  cc.empresa_nome,
  cc.segmento,
  cc.onboarding_completo,
  cc.onboarding_at,
  (SELECT COUNT(*) FROM prompt_registry pr
   WHERE pr.location_id = cc.location_id AND pr.scope = 'client') as prompts_customizados,
  (SELECT COUNT(*) FROM workflow_registry wr
   WHERE wr.location_id = cc.location_id AND wr.scope = 'client') as workflows_gerados
FROM client_contexts cc
ORDER BY cc.onboarding_completo, cc.created_at DESC;

COMMENT ON VIEW vw_client_onboarding_status IS
  '[AI Factory] Status de onboarding de clientes';


-- ============================================
-- FUNCTIONS PARA N8N
-- ============================================

-- Function: Registrar novo workflow
CREATE OR REPLACE FUNCTION register_workflow(
  p_workflow_key VARCHAR,
  p_workflow_name VARCHAR,
  p_scope VARCHAR DEFAULT 'internal',
  p_category VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_file_path TEXT DEFAULT NULL,
  p_n8n_workflow_id VARCHAR DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_workflow_id UUID;
BEGIN
  INSERT INTO workflow_registry (
    workflow_key, workflow_name, scope, category, description,
    file_path, n8n_workflow_id, tags, metadata
  ) VALUES (
    p_workflow_key, p_workflow_name, p_scope, p_category, p_description,
    p_file_path, p_n8n_workflow_id, p_tags, p_metadata
  )
  ON CONFLICT (workflow_key) DO UPDATE SET
    workflow_name = EXCLUDED.workflow_name,
    description = EXCLUDED.description,
    file_path = EXCLUDED.file_path,
    n8n_workflow_id = EXCLUDED.n8n_workflow_id,
    tags = EXCLUDED.tags,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_workflow_id;

  RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql;


-- Function: Criar nova versão de prompt
CREATE OR REPLACE FUNCTION create_prompt_version(
  p_prompt_key VARCHAR,
  p_prompt_content TEXT,
  p_change_summary TEXT DEFAULT NULL,
  p_change_reason VARCHAR DEFAULT 'improvement',
  p_changed_by VARCHAR DEFAULT 'system',
  p_model_config JSONB DEFAULT '{}',
  p_activate BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_prompt_id UUID;
  v_current_version INTEGER;
  v_new_version INTEGER;
  v_parent_version_id UUID;
  v_version_id UUID;
BEGIN
  -- Buscar prompt
  SELECT id INTO v_prompt_id
  FROM prompt_registry
  WHERE prompt_key = p_prompt_key;

  IF v_prompt_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prompt not found: ' || p_prompt_key
    );
  END IF;

  -- Buscar versão atual
  SELECT version, id INTO v_current_version, v_parent_version_id
  FROM prompt_versions
  WHERE prompt_id = v_prompt_id AND is_current = true;

  v_new_version := COALESCE(v_current_version, 0) + 1;

  -- Inserir nova versão
  INSERT INTO prompt_versions (
    prompt_id, version, parent_version_id, prompt_content,
    prompt_hash, change_summary, change_reason, changed_by,
    model_config, is_current, status
  ) VALUES (
    v_prompt_id, v_new_version, v_parent_version_id, p_prompt_content,
    encode(sha256(p_prompt_content::bytea), 'hex'),
    p_change_summary, p_change_reason, p_changed_by,
    p_model_config, p_activate, CASE WHEN p_activate THEN 'active' ELSE 'draft' END
  )
  RETURNING id INTO v_version_id;

  -- Atualizar current_version no registry
  IF p_activate THEN
    UPDATE prompt_registry
    SET current_version = v_new_version, updated_at = NOW()
    WHERE id = v_prompt_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'prompt_id', v_prompt_id,
    'version_id', v_version_id,
    'version', v_new_version,
    'is_current', p_activate
  );
END;
$$ LANGUAGE plpgsql;


-- Function: Obter prompt ativo por key
CREATE OR REPLACE FUNCTION get_active_prompt(p_prompt_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prompt_id', pr.id,
    'prompt_key', pr.prompt_key,
    'prompt_name', pr.prompt_name,
    'scope', pr.scope,
    'version', pv.version,
    'prompt_content', pv.prompt_content,
    'model_config', pv.model_config,
    'performance_score', pv.performance_score,
    'variables_used', pr.variables_used,
    'activated_at', pv.activated_at
  ) INTO v_result
  FROM prompt_registry pr
  JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
  WHERE pr.prompt_key = p_prompt_key;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'Prompt not found'));
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- DADOS INICIAIS - WORKFLOWS INTERNOS
-- ============================================

-- Registrar workflows internos da AI Factory
INSERT INTO workflow_registry (workflow_key, workflow_name, scope, category, description, tags) VALUES
  ('organizador-calls', '01-Organizador-Calls', 'internal', 'automation',
   'Monitora Google Drive e organiza arquivos de calls de vendas',
   ARRAY['drive', 'calls', 'organizacao']),

  ('head-vendas-v2', '02-AI-Agent-Head-Vendas-V2', 'internal', 'analysis',
   'Analisa transcrições de calls com framework BANT/SPIN e pré-processamento',
   ARRAY['ai', 'vendas', 'analise', 'bposs']),

  ('call-analyzer-onboarding', '03-Call-Analyzer-Onboarding', 'internal', 'analysis',
   'Analisa calls de onboarding de novos clientes',
   ARRAY['ai', 'onboarding', 'analise']),

  ('agent-configurator', '04-AI-Agent-Configurator', 'internal', 'setup',
   'Configura agentes AI com hiperpersonalização',
   ARRAY['ai', 'config', 'personas']),

  ('agent-execution', '05-AI-Agent-Execution-Modular', 'internal', 'execution',
   'Executa agentes de IA quando mensagens chegam do GHL',
   ARRAY['ai', 'execution', 'ghl']),

  ('boot-validator', '08-Boot-Validator', 'internal', 'validation',
   'Valida novas versões de agentes antes de ativar',
   ARRAY['ai', 'validation', 'testing']),

  ('qa-analyzer', '09-QA-Analyzer', 'internal', 'analysis',
   'Analisa qualidade das conversas dos agentes',
   ARRAY['ai', 'qa', 'analise']),

  ('reflection-loop', '11-Reflection-Loop', 'internal', 'self-improving',
   'Sistema de auto-melhoria com reflexão periódica',
   ARRAY['ai', 'reflection', 'self-improving']),

  ('ai-as-judge', '12-AI-as-Judge', 'internal', 'self-improving',
   'Avalia performance de prompts usando rúbricas',
   ARRAY['ai', 'evaluation', 'judge']),

  ('prompt-updater', '13-Prompt-Updater', 'internal', 'self-improving',
   'Aplica sugestões de melhoria automaticamente',
   ARRAY['ai', 'prompt', 'auto-update']),

  ('inbox-classifier', '14-Multi-Tenant-Inbox-Classifier', 'internal', 'classification',
   'Classifica mensagens para roteamento multi-tenant',
   ARRAY['ai', 'classifier', 'multi-tenant'])
ON CONFLICT (workflow_key) DO NOTHING;


-- Registrar prompts internos
INSERT INTO prompt_registry (prompt_key, prompt_name, scope, prompt_type, category, description, variables_used, tags) VALUES
  ('head-vendas-bposs', 'Head de Vendas BPOSS V2', 'internal', 'system', 'analysis',
   'Prompt principal do Head de Vendas com contexto BPOSS, ICP, red flags',
   ARRAY['{{transcricao_processada}}', '{{nome_lead}}', '{{tipo_call}}'],
   ARRAY['vendas', 'bposs', 'analise', 'bant', 'spin']),

  ('pre-processador-transcricao', 'Pré-Processador de Transcrição', 'internal', 'function', 'processing',
   'Limpa e estrutura transcrições antes de enviar para IA',
   ARRAY['{{transcricao_bruta}}'],
   ARRAY['preprocessing', 'transcricao', 'limpeza']),

  ('sdr-clinicas-template', 'Template SDR para Clínicas', 'template', 'system', 'sales',
   'Template base para SDR em clínicas odontológicas/médicas',
   ARRAY['{{empresa_nome}}', '{{icp}}', '{{tickets}}', '{{red_flags}}'],
   ARRAY['sdr', 'clinicas', 'template', 'vendas'])
ON CONFLICT (prompt_key) DO NOTHING;


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'WORKFLOW VERSIONING & SEPARATION - Migration Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - workflow_registry (registro central de workflows)';
  RAISE NOTICE '  - workflow_versions (histórico de versões)';
  RAISE NOTICE '  - prompt_registry (registro central de prompts)';
  RAISE NOTICE '  - prompt_versions (histórico de versões)';
  RAISE NOTICE '  - client_contexts (contexto de onboarding)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - vw_workflows_by_scope';
  RAISE NOTICE '  - vw_active_prompts';
  RAISE NOTICE '  - vw_client_onboarding_status';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - register_workflow()';
  RAISE NOTICE '  - create_prompt_version()';
  RAISE NOTICE '  - get_active_prompt()';
  RAISE NOTICE '';
  RAISE NOTICE 'Scope separation:';
  RAISE NOTICE '  - internal = AI Factory workflows (ex: 02-Head-Vendas)';
  RAISE NOTICE '  - template = Bases para clientes (ex: SDR Clínicas)';
  RAISE NOTICE '  - client = Gerado para cliente específico';
  RAISE NOTICE '============================================';
END $$;
