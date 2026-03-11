-- ============================================================================
-- 051: Agent Version Extras - split_config, handoff_config, safety_config, agent_flow
-- Novos campos JSONB em agent_versions para features P0-P2
-- ============================================================================

-- Split Messages: quebra respostas longas em multiplas curtas
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS split_config JSONB
  DEFAULT '{"enabled": true, "max_chars": 300, "delay_ms": 1500}';

-- Handoff: transferencia para atendente humano
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS handoff_config JSONB
  DEFAULT '{"enabled": false, "trigger_keywords": [], "default_attendant_id": null}';

-- Safety: limites de tool calls por turno
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS safety_config JSONB
  DEFAULT '{"max_tool_calls_per_turn": 5}';

-- Agent Flow: builder visual de steps
ALTER TABLE agent_versions
  ADD COLUMN IF NOT EXISTS agent_flow JSONB;

COMMENT ON COLUMN agent_versions.split_config IS 'Config de split de mensagens: enabled, max_chars, delay_ms';
COMMENT ON COLUMN agent_versions.handoff_config IS 'Config de handoff para humano: enabled, trigger_keywords[], default_attendant_id';
COMMENT ON COLUMN agent_versions.safety_config IS 'Config de seguranca: max_tool_calls_per_turn';
COMMENT ON COLUMN agent_versions.agent_flow IS 'Flow visual: {steps: [{id, name, mode, prompt_override, conditions: [{text, next_step_id}]}]}';
