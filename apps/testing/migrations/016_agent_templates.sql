-- ============================================================================
-- MIGRATION 016: agent_templates
-- Biblioteca global de modos para AI Sales Squad
-- Data: 2026-01-25
-- ============================================================================

-- ===========================================
-- 1. CRIAR TABELA agent_templates
-- ===========================================

CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao do modo
  mode_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Categoria do modo
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'acquisition',    -- Aquisicao (topo funil)
    'qualification',  -- Qualificacao
    'nurture',        -- Nutricao
    'scheduling',     -- Agendamento
    'closing',        -- Fechamento
    'post_sale',      -- Pos-venda
    'recovery',       -- Recuperacao
    'management'      -- Gestao
  )),

  -- Template do prompt (com variaveis {{nome_negocio}}, {{tom_voz}}, etc)
  prompt_template TEXT NOT NULL,

  -- Template das tools habilitadas nesse modo
  tools_template JSONB DEFAULT '{}',

  -- Variaveis que o template aceita
  variables JSONB DEFAULT '[]',

  -- Exemplo de uso (para documentacao)
  example_conversation JSONB DEFAULT '[]',

  -- Prioridade de implementacao
  priority VARCHAR(2) DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),

  -- Metricas alvo
  target_metrics JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. INDICES
-- ===========================================

CREATE INDEX idx_agent_templates_mode_name ON agent_templates(mode_name);
CREATE INDEX idx_agent_templates_category ON agent_templates(category);
CREATE INDEX idx_agent_templates_priority ON agent_templates(priority);
CREATE INDEX idx_agent_templates_active ON agent_templates(is_active) WHERE is_active = true;

-- ===========================================
-- 3. TRIGGER updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_agent_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_templates_updated_at
  BEFORE UPDATE ON agent_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_templates_updated_at();

-- ===========================================
-- 4. RLS (Row Level Security)
-- ===========================================

ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- Templates sao publicos para leitura (compartilhados entre todos)
CREATE POLICY "agent_templates_select_all" ON agent_templates
  FOR SELECT USING (true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "agent_templates_insert_admin" ON agent_templates
  FOR INSERT WITH CHECK (true);  -- Ajustar para role admin

CREATE POLICY "agent_templates_update_admin" ON agent_templates
  FOR UPDATE USING (true);  -- Ajustar para role admin

CREATE POLICY "agent_templates_delete_admin" ON agent_templates
  FOR DELETE USING (true);  -- Ajustar para role admin

-- ===========================================
-- 5. COMENTARIOS
-- ===========================================

COMMENT ON TABLE agent_templates IS 'Biblioteca global de templates de modos para o AI Sales Squad. Compartilhado entre todos os clientes.';
COMMENT ON COLUMN agent_templates.mode_name IS 'Nome unico do modo (ex: sdr_inbound, closer, cold_outreach)';
COMMENT ON COLUMN agent_templates.category IS 'Categoria do funil: acquisition, qualification, nurture, scheduling, closing, post_sale, recovery, management';
COMMENT ON COLUMN agent_templates.prompt_template IS 'Template do prompt com variaveis {{var}} para substituicao';
COMMENT ON COLUMN agent_templates.tools_template IS 'JSON com ferramentas habilitadas nesse modo';
COMMENT ON COLUMN agent_templates.variables IS 'Array de variaveis aceitas no template';
COMMENT ON COLUMN agent_templates.priority IS 'Prioridade de implementacao: P0 (critico), P1 (importante), P2 (desejavel), P3 (futuro)';

-- ===========================================
-- 6. FUNCAO HELPER: get_template_by_mode
-- ===========================================

CREATE OR REPLACE FUNCTION get_template_by_mode(p_mode_name VARCHAR)
RETURNS TABLE (
  mode_name VARCHAR,
  display_name VARCHAR,
  category VARCHAR,
  prompt_template TEXT,
  tools_template JSONB,
  variables JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.mode_name,
    t.display_name,
    t.category,
    t.prompt_template,
    t.tools_template,
    t.variables
  FROM agent_templates t
  WHERE t.mode_name = p_mode_name
    AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 7. FUNCAO HELPER: list_templates_by_category
-- ===========================================

CREATE OR REPLACE FUNCTION list_templates_by_category(p_category VARCHAR DEFAULT NULL)
RETURNS TABLE (
  mode_name VARCHAR,
  display_name VARCHAR,
  category VARCHAR,
  priority VARCHAR,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.mode_name,
    t.display_name,
    t.category,
    t.priority,
    t.description
  FROM agent_templates t
  WHERE t.is_active = true
    AND (p_category IS NULL OR t.category = p_category)
  ORDER BY
    CASE t.priority
      WHEN 'P0' THEN 1
      WHEN 'P1' THEN 2
      WHEN 'P2' THEN 3
      WHEN 'P3' THEN 4
    END,
    t.display_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIM MIGRATION 016
-- ============================================================================
