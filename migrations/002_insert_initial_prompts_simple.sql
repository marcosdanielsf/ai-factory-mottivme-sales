-- MIGRATION 002 - Inserir prompts iniciais (versão corrigida)
-- Baseado na estrutura real da tabela agent_versions

INSERT INTO system_prompts (
  agent_version_id,
  version,
  is_active,
  prompt_content,
  prompt_name,
  prompt_description,
  model_config,
  change_reason,
  change_summary,
  activated_at
)
SELECT
  av.id as agent_version_id,
  1 as version,
  true as is_active,
  av.system_prompt as prompt_content,
  COALESCE(av.agent_name, 'Agente ' || av.version) as prompt_name,
  'Prompt inicial importado do sistema legado' as prompt_description,
  '{"model": "gpt-4o", "temperature": 0.7, "max_tokens": 4096}'::jsonb as model_config,
  'initial' as change_reason,
  'Prompt importado da tabela agent_versions para sistema self-improving' as change_summary,
  NOW() as activated_at
FROM agent_versions av
WHERE av.is_active = true
  AND av.system_prompt IS NOT NULL
  AND av.id NOT IN (
    SELECT agent_version_id FROM system_prompts WHERE agent_version_id IS NOT NULL
  )
ON CONFLICT (agent_version_id, version) DO NOTHING;
