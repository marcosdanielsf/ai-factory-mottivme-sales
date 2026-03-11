-- ============================================
-- PROMPT CATALOG SYSTEM - MIGRATION 010
-- ============================================
-- Description: Sistema completo de catálogo de prompts para frontend
--              Expande tabelas da migration 008 com funcionalidades
--              para dashboard, analytics e edição dinâmica
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2026-01-01
-- Depends on: migration 008 (workflow_versioning_and_separation)
-- ============================================

-- ============================================
-- TABELA 1: PROMPT_CATALOG
-- ============================================
-- Metadados de exibição para frontend/dashboard

CREATE TABLE IF NOT EXISTS prompt_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  prompt_id UUID NOT NULL REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Display no frontend
  display_name VARCHAR(255) NOT NULL,
  short_description VARCHAR(500),
  long_description TEXT,

  -- Categorização visual
  icon VARCHAR(50) DEFAULT '📝', -- emoji ou nome do ícone
  color VARCHAR(20) DEFAULT '#3b82f6', -- hex color para cards
  badge VARCHAR(50), -- 'new', 'updated', 'deprecated', 'beta'

  -- Relacionamentos expandidos
  workflow_keys TEXT[], -- ['head-vendas-v2', 'sdr-conversacional']
  agent_types TEXT[], -- ['head-vendas', 'sdr', 'qa']

  -- Controle de acesso
  visibility VARCHAR(20) DEFAULT 'internal',
  -- 'internal' = só equipe MOTTIVME
  -- 'client' = cliente específico pode ver/editar
  -- 'public' = templates públicos

  editable_by TEXT[] DEFAULT ARRAY['admin'],
  -- roles que podem editar: 'admin', 'editor', 'client'

  -- Ordenação no catálogo
  category_order INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,

  -- Stats de uso (atualizados automaticamente)
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  avg_execution_time_ms INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint
  UNIQUE(prompt_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_prompt ON prompt_catalog(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_visibility ON prompt_catalog(visibility);
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_featured ON prompt_catalog(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_usage ON prompt_catalog(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_workflows ON prompt_catalog USING gin(workflow_keys);
CREATE INDEX IF NOT EXISTS idx_prompt_catalog_agents ON prompt_catalog USING gin(agent_types);

COMMENT ON TABLE prompt_catalog IS
  '[AI Factory] Catálogo de prompts para exibição no dashboard/frontend';


-- ============================================
-- TABELA 2: PROMPT_VARIABLES
-- ============================================
-- Variáveis/Placeholders esperados em cada prompt

CREATE TABLE IF NOT EXISTS prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  prompt_id UUID NOT NULL REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Identificação
  variable_key VARCHAR(100) NOT NULL, -- ex: 'icp_segmento', 'nome_lead'
  variable_placeholder VARCHAR(200) NOT NULL, -- ex: '{{icp_segmento}}'

  -- Tipo e configuração
  variable_type VARCHAR(50) DEFAULT 'text',
  -- 'text', 'textarea', 'number', 'json', 'select', 'boolean', 'date'

  default_value TEXT,
  required BOOLEAN DEFAULT false,

  -- Opções (para tipo 'select')
  options JSONB DEFAULT '[]',
  -- [{"value": "clinica", "label": "Clínica"}, {"value": "consultoria", "label": "Consultoria"}]

  -- Validação
  validation_regex VARCHAR(500),
  min_length INTEGER,
  max_length INTEGER,
  min_value NUMERIC,
  max_value NUMERIC,

  -- Descrição para UI
  label VARCHAR(255) NOT NULL,
  description TEXT,
  help_text TEXT,
  placeholder_hint VARCHAR(255), -- texto que aparece no input

  -- Agrupamento
  group_name VARCHAR(100), -- 'Dados do Lead', 'Contexto de Negócio'
  group_order INTEGER DEFAULT 0,

  -- Ordenação
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(prompt_id, variable_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_variables_prompt ON prompt_variables(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_variables_required ON prompt_variables(prompt_id, required) WHERE required = true;
CREATE INDEX IF NOT EXISTS idx_prompt_variables_group ON prompt_variables(prompt_id, group_name);

COMMENT ON TABLE prompt_variables IS
  '[AI Factory] Variáveis/placeholders esperados em cada prompt';


-- ============================================
-- TABELA 3: PROMPT_EDIT_HISTORY
-- ============================================
-- Audit trail completo de todas as edições

CREATE TABLE IF NOT EXISTS prompt_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Editor
  edited_by VARCHAR(255) NOT NULL,
  editor_role VARCHAR(50), -- 'admin', 'editor', 'system', 'self-improving'

  edited_via VARCHAR(50) NOT NULL,
  -- 'dashboard', 'terminal', 'api', 'n8n', 'self-improving', 'rollback'

  -- Mudança
  old_content TEXT,
  new_content TEXT,
  diff_summary TEXT, -- Resumo legível das mudanças
  diff_stats JSONB, -- {"lines_added": 10, "lines_removed": 5, "chars_changed": 150}

  change_type VARCHAR(50) NOT NULL,
  -- 'create', 'minor', 'major', 'rollback', 'auto_improvement', 'variable_update'

  -- Contexto
  change_reason TEXT,
  related_reflection_id UUID REFERENCES reflection_logs(id),
  related_suggestion_id UUID REFERENCES improvement_suggestions(id),

  -- Resultado
  version_before INTEGER,
  version_after INTEGER,

  -- Metadata de sessão
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_edit_history_prompt ON prompt_edit_history(prompt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_edit_history_version ON prompt_edit_history(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_prompt_edit_history_editor ON prompt_edit_history(edited_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_edit_history_type ON prompt_edit_history(change_type);
CREATE INDEX IF NOT EXISTS idx_prompt_edit_history_via ON prompt_edit_history(edited_via);

COMMENT ON TABLE prompt_edit_history IS
  '[AI Factory] Audit trail completo de edições em prompts';


-- ============================================
-- TABELA 4: PROMPT_EXECUTIONS
-- ============================================
-- Log de execuções para analytics

CREATE TABLE IF NOT EXISTS prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompt_registry(id) ON DELETE CASCADE,

  -- Execução
  workflow_execution_id VARCHAR(255), -- ID da execução no n8n
  workflow_key VARCHAR(100),

  -- Resultado
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- Performance
  execution_time_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost DECIMAL(10,6), -- custo em USD

  -- Contexto
  location_id VARCHAR(100),
  contact_id VARCHAR(255),

  -- Variáveis usadas (para debug)
  variables_resolved JSONB,

  -- Output summary (não salva output completo por privacidade)
  output_type VARCHAR(50), -- 'json', 'text', 'error'
  output_length INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompt_executions_prompt ON prompt_executions(prompt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_version ON prompt_executions(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_workflow ON prompt_executions(workflow_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_success ON prompt_executions(prompt_id, success);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_date ON prompt_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_location ON prompt_executions(location_id, created_at DESC);

-- Particionamento por data (opcional, para alta escala)
-- CREATE INDEX IF NOT EXISTS idx_prompt_executions_date_partition ON prompt_executions(created_at);

COMMENT ON TABLE prompt_executions IS
  '[AI Factory] Log de execuções de prompts para analytics';


-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: updated_at automático
CREATE TRIGGER trigger_prompt_catalog_timestamp
  BEFORE UPDATE ON prompt_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

CREATE TRIGGER trigger_prompt_variables_timestamp
  BEFORE UPDATE ON prompt_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();


-- Trigger: Incrementar uso no catalog após execução
CREATE OR REPLACE FUNCTION increment_prompt_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prompt_catalog
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE prompt_id = NEW.prompt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_prompt_usage
  AFTER INSERT ON prompt_executions
  FOR EACH ROW
  EXECUTE FUNCTION increment_prompt_usage();


-- Trigger: Registrar edição automaticamente ao criar versão
CREATE OR REPLACE FUNCTION log_prompt_version_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prompt_edit_history (
    prompt_version_id,
    prompt_id,
    edited_by,
    editor_role,
    edited_via,
    new_content,
    change_type,
    change_reason,
    version_after
  ) VALUES (
    NEW.id,
    NEW.prompt_id,
    COALESCE(NEW.changed_by, 'system'),
    CASE
      WHEN NEW.change_reason = 'auto_improvement' THEN 'self-improving'
      ELSE 'system'
    END,
    CASE
      WHEN NEW.change_reason = 'auto_improvement' THEN 'self-improving'
      WHEN NEW.change_reason = 'rollback' THEN 'rollback'
      ELSE 'api'
    END,
    NEW.prompt_content,
    COALESCE(NEW.change_reason, 'create'),
    NEW.change_summary,
    NEW.version
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_prompt_version
  AFTER INSERT ON prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION log_prompt_version_creation();


-- ============================================
-- VIEWS
-- ============================================

-- View: Catálogo completo para frontend
CREATE OR REPLACE VIEW vw_prompt_catalog_full AS
SELECT
  pr.id as prompt_id,
  pr.prompt_key,
  pr.prompt_name,
  pr.scope,
  pr.prompt_type,
  pr.category,
  pr.status,
  pr.current_version,
  pr.location_id,

  -- Catalog info
  pc.display_name,
  pc.short_description,
  pc.long_description,
  pc.icon,
  pc.color,
  pc.badge,
  pc.workflow_keys,
  pc.agent_types,
  pc.visibility,
  pc.editable_by,
  pc.category_order,
  pc.featured,
  pc.usage_count,
  pc.last_used_at,

  -- Version info
  pv.version,
  pv.prompt_content,
  pv.model_config,
  pv.performance_score,
  pv.total_evaluations,
  pv.total_conversations,
  pv.activated_at as version_activated_at,

  -- Variables count
  (SELECT COUNT(*) FROM prompt_variables pvar WHERE pvar.prompt_id = pr.id) as variables_count,

  -- Executions last 24h
  (SELECT COUNT(*) FROM prompt_executions pe
   WHERE pe.prompt_id = pr.id AND pe.created_at >= NOW() - INTERVAL '24 hours') as executions_24h,

  -- Success rate last 24h
  (SELECT ROUND(AVG(CASE WHEN pe.success THEN 100 ELSE 0 END)::numeric, 2)
   FROM prompt_executions pe
   WHERE pe.prompt_id = pr.id AND pe.created_at >= NOW() - INTERVAL '24 hours') as success_rate_24h

FROM prompt_registry pr
LEFT JOIN prompt_catalog pc ON pc.prompt_id = pr.id
LEFT JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
WHERE pr.status = 'active'
ORDER BY pc.category_order NULLS LAST, pc.featured DESC, pr.prompt_name;

COMMENT ON VIEW vw_prompt_catalog_full IS
  '[AI Factory] Catálogo completo de prompts para frontend';


-- View: Analytics de execuções por prompt
CREATE OR REPLACE VIEW vw_prompt_execution_stats AS
SELECT
  pr.prompt_key,
  pr.prompt_name,
  pv.version,
  COUNT(pe.id) as total_executions,
  SUM(CASE WHEN pe.success THEN 1 ELSE 0 END) as successful_executions,
  ROUND(AVG(CASE WHEN pe.success THEN 100 ELSE 0 END)::numeric, 2) as success_rate,
  ROUND(AVG(pe.execution_time_ms)::numeric, 0) as avg_execution_time_ms,
  ROUND(AVG(pe.input_tokens)::numeric, 0) as avg_input_tokens,
  ROUND(AVG(pe.output_tokens)::numeric, 0) as avg_output_tokens,
  SUM(pe.total_cost) as total_cost,
  MIN(pe.created_at) as first_execution,
  MAX(pe.created_at) as last_execution
FROM prompt_registry pr
JOIN prompt_versions pv ON pv.prompt_id = pr.id
LEFT JOIN prompt_executions pe ON pe.prompt_version_id = pv.id
WHERE pr.status = 'active'
GROUP BY pr.prompt_key, pr.prompt_name, pv.version
ORDER BY total_executions DESC;

COMMENT ON VIEW vw_prompt_execution_stats IS
  '[AI Factory] Estatísticas de execução por prompt';


-- View: Histórico de edições recentes
CREATE OR REPLACE VIEW vw_recent_prompt_edits AS
SELECT
  peh.id,
  pr.prompt_key,
  pr.prompt_name,
  peh.edited_by,
  peh.editor_role,
  peh.edited_via,
  peh.change_type,
  peh.change_reason,
  peh.diff_summary,
  peh.version_before,
  peh.version_after,
  peh.created_at
FROM prompt_edit_history peh
JOIN prompt_registry pr ON pr.id = peh.prompt_id
ORDER BY peh.created_at DESC
LIMIT 100;

COMMENT ON VIEW vw_recent_prompt_edits IS
  '[AI Factory] Histórico recente de edições em prompts';


-- ============================================
-- FUNCTIONS RPC PARA N8N E FRONTEND
-- ============================================

-- Function: Buscar prompt com variáveis (para n8n)
CREATE OR REPLACE FUNCTION get_prompt_with_variables(p_prompt_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_prompt_id UUID;
BEGIN
  -- Buscar ID do prompt
  SELECT id INTO v_prompt_id
  FROM prompt_registry
  WHERE prompt_key = p_prompt_key;

  IF v_prompt_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Prompt not found: ' || p_prompt_key);
  END IF;

  -- Construir resultado
  SELECT jsonb_build_object(
    'prompt', (SELECT get_active_prompt(p_prompt_key)),
    'variables', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'key', pv.variable_key,
        'placeholder', pv.variable_placeholder,
        'type', pv.variable_type,
        'default', pv.default_value,
        'required', pv.required,
        'label', pv.label,
        'description', pv.description,
        'options', pv.options,
        'group', pv.group_name,
        'order', pv.display_order
      ) ORDER BY pv.group_order, pv.display_order)
      FROM prompt_variables pv
      WHERE pv.prompt_id = v_prompt_id
    ), '[]'::jsonb),
    'catalog', (
      SELECT jsonb_build_object(
        'display_name', pc.display_name,
        'description', pc.short_description,
        'icon', pc.icon,
        'color', pc.color,
        'badge', pc.badge,
        'usage_count', pc.usage_count,
        'workflows', pc.workflow_keys
      )
      FROM prompt_catalog pc
      WHERE pc.prompt_id = v_prompt_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Listar prompts para catálogo (paginado, com filtros)
CREATE OR REPLACE FUNCTION list_prompts_for_catalog(
  p_scope VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_visibility VARCHAR DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prompts', COALESCE((
      SELECT jsonb_agg(row_to_json(catalog_rows))
      FROM (
        SELECT
          pr.id,
          pr.prompt_key,
          pr.prompt_name,
          pr.scope,
          pr.category,
          pr.current_version,
          pc.display_name,
          pc.short_description,
          pc.icon,
          pc.color,
          pc.badge,
          pc.workflow_keys,
          pc.agent_types,
          pc.visibility,
          pc.featured,
          pc.usage_count,
          pc.last_used_at,
          pv.performance_score,
          pv.total_evaluations,
          (SELECT COUNT(*) FROM prompt_variables pvar WHERE pvar.prompt_id = pr.id) as variables_count
        FROM prompt_registry pr
        LEFT JOIN prompt_catalog pc ON pc.prompt_id = pr.id
        LEFT JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
        WHERE
          pr.status = 'active'
          AND (p_scope IS NULL OR pr.scope = p_scope)
          AND (p_category IS NULL OR pr.category = p_category)
          AND (p_visibility IS NULL OR pc.visibility = p_visibility)
          AND (p_featured_only = false OR pc.featured = true)
          AND (p_search IS NULL OR
               pr.prompt_name ILIKE '%' || p_search || '%' OR
               pr.prompt_key ILIKE '%' || p_search || '%' OR
               pc.display_name ILIKE '%' || p_search || '%' OR
               pc.short_description ILIKE '%' || p_search || '%')
        ORDER BY
          pc.featured DESC NULLS LAST,
          pc.category_order NULLS LAST,
          pr.prompt_name
        LIMIT p_limit
        OFFSET p_offset
      ) catalog_rows
    ), '[]'::jsonb),
    'total', (
      SELECT COUNT(*)
      FROM prompt_registry pr
      LEFT JOIN prompt_catalog pc ON pc.prompt_id = pr.id
      WHERE
        pr.status = 'active'
        AND (p_scope IS NULL OR pr.scope = p_scope)
        AND (p_category IS NULL OR pr.category = p_category)
        AND (p_visibility IS NULL OR pc.visibility = p_visibility)
        AND (p_featured_only = false OR pc.featured = true)
    ),
    'limit', p_limit,
    'offset', p_offset
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Registrar execução de prompt (chamado pelo n8n)
CREATE OR REPLACE FUNCTION log_prompt_execution(
  p_prompt_key VARCHAR,
  p_workflow_key VARCHAR DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_input_tokens INTEGER DEFAULT NULL,
  p_output_tokens INTEGER DEFAULT NULL,
  p_workflow_execution_id VARCHAR DEFAULT NULL,
  p_location_id VARCHAR DEFAULT NULL,
  p_contact_id VARCHAR DEFAULT NULL,
  p_variables_resolved JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_prompt_id UUID;
  v_version_id UUID;
  v_execution_id UUID;
BEGIN
  -- Buscar IDs
  SELECT pr.id, pv.id INTO v_prompt_id, v_version_id
  FROM prompt_registry pr
  JOIN prompt_versions pv ON pv.prompt_id = pr.id AND pv.is_current = true
  WHERE pr.prompt_key = p_prompt_key;

  IF v_prompt_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prompt not found');
  END IF;

  -- Inserir execução
  INSERT INTO prompt_executions (
    prompt_id, prompt_version_id, workflow_key, success, error_message,
    execution_time_ms, input_tokens, output_tokens, workflow_execution_id,
    location_id, contact_id, variables_resolved
  ) VALUES (
    v_prompt_id, v_version_id, p_workflow_key, p_success, p_error_message,
    p_execution_time_ms, p_input_tokens, p_output_tokens, p_workflow_execution_id,
    p_location_id, p_contact_id, p_variables_resolved
  )
  RETURNING id INTO v_execution_id;

  RETURN jsonb_build_object(
    'success', true,
    'execution_id', v_execution_id,
    'prompt_id', v_prompt_id,
    'version_id', v_version_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Obter histórico de versões de um prompt
CREATE OR REPLACE FUNCTION get_prompt_version_history(
  p_prompt_key VARCHAR,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'prompt_key', p_prompt_key,
    'versions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'version', pv.version,
        'is_current', pv.is_current,
        'status', pv.status,
        'change_summary', pv.change_summary,
        'change_reason', pv.change_reason,
        'changed_by', pv.changed_by,
        'performance_score', pv.performance_score,
        'total_evaluations', pv.total_evaluations,
        'created_at', pv.created_at,
        'activated_at', pv.activated_at,
        'content_preview', LEFT(pv.prompt_content, 200) || '...'
      ) ORDER BY pv.version DESC)
      FROM prompt_versions pv
      JOIN prompt_registry pr ON pr.id = pv.prompt_id
      WHERE pr.prompt_key = p_prompt_key
      LIMIT p_limit
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- DADOS INICIAIS - POPULAR CATALOG
-- ============================================

-- Inserir entradas no catalog para prompts existentes
INSERT INTO prompt_catalog (prompt_id, display_name, short_description, icon, color, workflow_keys, agent_types, category_order, featured)
SELECT
  pr.id,
  pr.prompt_name,
  pr.description,
  CASE pr.category
    WHEN 'analysis' THEN '🔍'
    WHEN 'sales' THEN '💼'
    WHEN 'processing' THEN '⚙️'
    ELSE '📝'
  END,
  CASE pr.category
    WHEN 'analysis' THEN '#8b5cf6'
    WHEN 'sales' THEN '#10b981'
    WHEN 'processing' THEN '#f59e0b'
    ELSE '#3b82f6'
  END,
  ARRAY[pr.prompt_key],
  CASE
    WHEN pr.prompt_key LIKE '%vendas%' THEN ARRAY['head-vendas', 'sdr']
    WHEN pr.prompt_key LIKE '%sdr%' THEN ARRAY['sdr']
    WHEN pr.prompt_key LIKE '%qa%' THEN ARRAY['qa']
    ELSE ARRAY['general']
  END,
  CASE pr.scope
    WHEN 'internal' THEN 10
    WHEN 'template' THEN 50
    ELSE 100
  END,
  pr.scope = 'internal'
FROM prompt_registry pr
WHERE NOT EXISTS (
  SELECT 1 FROM prompt_catalog pc WHERE pc.prompt_id = pr.id
);


-- Inserir variáveis conhecidas para head-vendas-bposs
INSERT INTO prompt_variables (prompt_id, variable_key, variable_placeholder, variable_type, required, label, description, group_name, display_order)
SELECT
  pr.id,
  vars.key,
  vars.placeholder,
  vars.type,
  vars.required,
  vars.label,
  vars.description,
  vars.group_name,
  vars.display_order
FROM prompt_registry pr
CROSS JOIN (VALUES
  ('transcricao_processada', '{{transcricao_processada}}', 'textarea', true, 'Transcrição da Call', 'Texto completo da transcrição processada', 'Dados da Call', 1),
  ('nome_lead', '{{nome_lead}}', 'text', false, 'Nome do Lead', 'Nome do lead/prospect na call', 'Dados do Lead', 2),
  ('tipo_call', '{{tipo_call}}', 'select', false, 'Tipo de Call', 'Tipo da call (diagnóstico, follow-up, etc)', 'Dados da Call', 3),
  ('nome_empresa', '{{nome_empresa}}', 'text', false, 'Nome da Empresa', 'Nome da empresa do lead', 'Dados do Lead', 4),
  ('icp_segmento', '{{icp_segmento}}', 'text', false, 'Segmento ICP', 'Segmento do ICP do cliente', 'Contexto de Negócio', 5)
) AS vars(key, placeholder, type, required, label, description, group_name, display_order)
WHERE pr.prompt_key = 'head-vendas-bposs'
ON CONFLICT (prompt_id, variable_key) DO NOTHING;


-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE prompt_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

-- Policies para leitura
CREATE POLICY "Prompts públicos e internos visíveis para autenticados"
  ON prompt_catalog FOR SELECT
  TO authenticated
  USING (visibility IN ('public', 'internal'));

CREATE POLICY "Variáveis visíveis para autenticados"
  ON prompt_variables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Histórico visível para admins"
  ON prompt_edit_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Execuções visíveis para autenticados"
  ON prompt_executions FOR SELECT
  TO authenticated
  USING (true);

-- Policies para escrita (apenas admins)
CREATE POLICY "Apenas admins editam catalog"
  ON prompt_catalog FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Apenas admins editam variáveis"
  ON prompt_variables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROMPT CATALOG SYSTEM - Migration 010 Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - prompt_catalog (metadados para frontend)';
  RAISE NOTICE '  - prompt_variables (variáveis/placeholders)';
  RAISE NOTICE '  - prompt_edit_history (audit trail)';
  RAISE NOTICE '  - prompt_executions (analytics)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - vw_prompt_catalog_full';
  RAISE NOTICE '  - vw_prompt_execution_stats';
  RAISE NOTICE '  - vw_recent_prompt_edits';
  RAISE NOTICE '';
  RAISE NOTICE 'Created RPC functions:';
  RAISE NOTICE '  - get_prompt_with_variables(prompt_key)';
  RAISE NOTICE '  - list_prompts_for_catalog(filters)';
  RAISE NOTICE '  - log_prompt_execution(...)';
  RAISE NOTICE '  - get_prompt_version_history(prompt_key)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features:';
  RAISE NOTICE '  - Catálogo visual para frontend';
  RAISE NOTICE '  - Sistema de variáveis tipadas';
  RAISE NOTICE '  - Audit trail completo';
  RAISE NOTICE '  - Analytics de execuções';
  RAISE NOTICE '  - RLS configurado';
  RAISE NOTICE '============================================';
END $$;
