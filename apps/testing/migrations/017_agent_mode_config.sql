-- ============================================================================
-- MIGRATION 017: agent_mode_config
-- Configuracao de modos por agente/cliente
-- Data: 2026-01-25
-- ============================================================================

-- ===========================================
-- 1. CRIAR TABELA agent_mode_config
-- ===========================================

CREATE TABLE IF NOT EXISTS agent_mode_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia ao agente (1 agente por location_id)
  agent_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE CASCADE,

  -- Modo habilitado
  mode_name VARCHAR(50) NOT NULL,

  -- Status do modo para este agente
  enabled BOOLEAN DEFAULT false,

  -- Ordem de prioridade (para orquestracao)
  priority_order INTEGER DEFAULT 99,

  -- Overrides especificos do cliente (sobrescreve variaveis do template)
  custom_overrides JSONB DEFAULT '{}',

  -- Prompt customizado (se NULL, usa o template)
  custom_prompt TEXT,

  -- Tools customizadas (se NULL, usa o template)
  custom_tools JSONB,

  -- Metricas especificas deste modo neste agente
  metrics JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: modo unico por agente
  UNIQUE(agent_id, mode_name)
);

-- ===========================================
-- 2. INDICES
-- ===========================================

CREATE INDEX idx_agent_mode_config_agent_id ON agent_mode_config(agent_id);
CREATE INDEX idx_agent_mode_config_mode_name ON agent_mode_config(mode_name);
CREATE INDEX idx_agent_mode_config_enabled ON agent_mode_config(enabled) WHERE enabled = true;
CREATE INDEX idx_agent_mode_config_agent_enabled ON agent_mode_config(agent_id, enabled);

-- ===========================================
-- 3. TRIGGER updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_agent_mode_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_mode_config_updated_at
  BEFORE UPDATE ON agent_mode_config
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_mode_config_updated_at();

-- ===========================================
-- 4. RLS (Row Level Security)
-- ===========================================

ALTER TABLE agent_mode_config ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver configs dos agentes que tem acesso
CREATE POLICY "agent_mode_config_select" ON agent_mode_config
  FOR SELECT USING (true);  -- Ajustar baseado em permissoes

CREATE POLICY "agent_mode_config_insert" ON agent_mode_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agent_mode_config_update" ON agent_mode_config
  FOR UPDATE USING (true);

CREATE POLICY "agent_mode_config_delete" ON agent_mode_config
  FOR DELETE USING (true);

-- ===========================================
-- 5. VIEW: agent_full_config
-- ===========================================

CREATE OR REPLACE VIEW agent_full_config AS
SELECT
  av.id,
  av.location_id,
  av.agent_name,
  av.validation_score,
  av.is_active,
  av.status,
  COALESCE(
    ARRAY_AGG(amc.mode_name ORDER BY amc.priority_order) FILTER (WHERE amc.enabled = true),
    ARRAY[]::VARCHAR[]
  ) as modos_ativos,
  COUNT(*) FILTER (WHERE amc.enabled = true) as total_modos_ativos,
  COUNT(*) as total_modos_configurados
FROM agent_versions av
LEFT JOIN agent_mode_config amc ON av.id = amc.agent_id
GROUP BY av.id, av.location_id, av.agent_name, av.validation_score, av.is_active, av.status;

-- ===========================================
-- 6. VIEW: mode_usage_stats
-- ===========================================

CREATE OR REPLACE VIEW mode_usage_stats AS
SELECT
  amc.mode_name,
  at.display_name,
  at.category,
  COUNT(*) FILTER (WHERE amc.enabled = true) as total_ativos,
  COUNT(*) as total_configurados,
  ROUND(
    COUNT(*) FILTER (WHERE amc.enabled = true)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as percent_ativos
FROM agent_mode_config amc
LEFT JOIN agent_templates at ON amc.mode_name = at.mode_name
GROUP BY amc.mode_name, at.display_name, at.category
ORDER BY total_ativos DESC;

-- ===========================================
-- 7. FUNCAO: get_agent_active_modes
-- ===========================================

CREATE OR REPLACE FUNCTION get_agent_active_modes(p_agent_id UUID)
RETURNS TABLE (
  mode_name VARCHAR,
  display_name VARCHAR,
  category VARCHAR,
  priority_order INTEGER,
  custom_overrides JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    amc.mode_name,
    at.display_name,
    at.category,
    amc.priority_order,
    amc.custom_overrides
  FROM agent_mode_config amc
  LEFT JOIN agent_templates at ON amc.mode_name = at.mode_name
  WHERE amc.agent_id = p_agent_id
    AND amc.enabled = true
  ORDER BY amc.priority_order;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 8. FUNCAO: toggle_agent_mode
-- ===========================================

CREATE OR REPLACE FUNCTION toggle_agent_mode(
  p_agent_id UUID,
  p_mode_name VARCHAR,
  p_enabled BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_enabled BOOLEAN;
  v_new_enabled BOOLEAN;
  v_result JSONB;
BEGIN
  -- Buscar estado atual
  SELECT enabled INTO v_current_enabled
  FROM agent_mode_config
  WHERE agent_id = p_agent_id AND mode_name = p_mode_name;

  -- Se nao existe, criar
  IF NOT FOUND THEN
    v_new_enabled := COALESCE(p_enabled, true);

    INSERT INTO agent_mode_config (agent_id, mode_name, enabled)
    VALUES (p_agent_id, p_mode_name, v_new_enabled);

    RETURN jsonb_build_object(
      'success', true,
      'action', 'created',
      'mode_name', p_mode_name,
      'enabled', v_new_enabled
    );
  END IF;

  -- Se existe, toggle ou set
  v_new_enabled := COALESCE(p_enabled, NOT v_current_enabled);

  UPDATE agent_mode_config
  SET enabled = v_new_enabled, updated_at = NOW()
  WHERE agent_id = p_agent_id AND mode_name = p_mode_name;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'updated',
    'mode_name', p_mode_name,
    'enabled', v_new_enabled,
    'previous', v_current_enabled
  );
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 9. FUNCAO: build_prompts_by_mode
-- ===========================================

CREATE OR REPLACE FUNCTION build_prompts_by_mode(p_agent_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_mode RECORD;
  v_prompt TEXT;
  v_overrides JSONB;
BEGIN
  FOR v_mode IN
    SELECT
      amc.mode_name,
      amc.custom_prompt,
      amc.custom_overrides,
      at.prompt_template,
      at.tools_template
    FROM agent_mode_config amc
    JOIN agent_templates at ON amc.mode_name = at.mode_name
    WHERE amc.agent_id = p_agent_id
      AND amc.enabled = true
    ORDER BY amc.priority_order
  LOOP
    -- Usar prompt customizado ou template
    v_prompt := COALESCE(v_mode.custom_prompt, v_mode.prompt_template);

    -- Montar objeto do modo
    v_result := v_result || jsonb_build_object(
      v_mode.mode_name, jsonb_build_object(
        'prompt', v_prompt,
        'tools', v_mode.tools_template,
        'overrides', v_mode.custom_overrides
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 10. FUNCAO: sync_agent_prompts_by_mode
-- ===========================================

CREATE OR REPLACE FUNCTION sync_agent_prompts_by_mode(p_agent_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_prompts_by_mode JSONB;
  v_modos_ativos VARCHAR[];
BEGIN
  -- Construir prompts_by_mode
  v_prompts_by_mode := build_prompts_by_mode(p_agent_id);

  -- Buscar modos ativos
  SELECT ARRAY_AGG(mode_name ORDER BY priority_order)
  INTO v_modos_ativos
  FROM agent_mode_config
  WHERE agent_id = p_agent_id AND enabled = true;

  -- Atualizar agent_versions
  UPDATE agent_versions
  SET
    prompts_by_mode = v_prompts_by_mode,
    tools_config = tools_config || jsonb_build_object('modos_ativos', v_modos_ativos),
    updated_at = NOW()
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'success', true,
    'agent_id', p_agent_id,
    'modos_ativos', v_modos_ativos,
    'total_modos', COALESCE(array_length(v_modos_ativos, 1), 0)
  );
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 11. TRIGGER: auto_sync on mode change
-- ===========================================

CREATE OR REPLACE FUNCTION trigger_sync_prompts_on_mode_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar prompts_by_mode quando modo e alterado
  PERFORM sync_agent_prompts_by_mode(
    COALESCE(NEW.agent_id, OLD.agent_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_sync_prompts
  AFTER INSERT OR UPDATE OR DELETE ON agent_mode_config
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_prompts_on_mode_change();

-- ===========================================
-- 12. COMENTARIOS
-- ===========================================

COMMENT ON TABLE agent_mode_config IS 'Configuracao de modos habilitados por agente. Cada agente pode ter multiplos modos ativos.';
COMMENT ON COLUMN agent_mode_config.enabled IS 'Se o modo esta ativo para este agente';
COMMENT ON COLUMN agent_mode_config.priority_order IS 'Ordem de prioridade para orquestracao (menor = maior prioridade)';
COMMENT ON COLUMN agent_mode_config.custom_overrides IS 'Sobrescrita de variaveis do template para este cliente';
COMMENT ON COLUMN agent_mode_config.custom_prompt IS 'Prompt totalmente customizado (ignora template)';
COMMENT ON VIEW agent_full_config IS 'Visao consolidada do agente com seus modos ativos';
COMMENT ON FUNCTION toggle_agent_mode IS 'Habilita/desabilita um modo para um agente';
COMMENT ON FUNCTION sync_agent_prompts_by_mode IS 'Reconstroi o campo prompts_by_mode do agente baseado nos modos ativos';

-- ============================================================================
-- FIM MIGRATION 017
-- ============================================================================
