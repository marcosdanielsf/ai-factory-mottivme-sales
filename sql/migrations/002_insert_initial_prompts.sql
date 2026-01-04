-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 002
-- ============================================
-- Description: Insere prompts iniciais na tabela system_prompts
--              baseado nos prompts existentes em agent_versions
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-27
-- ============================================

-- ============================================
-- PASSO 1: Inserir prompts iniciais para todos os agentes ativos
-- ============================================

-- Inserir prompt inicial (version 1) para cada agente ativo
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
  COALESCE(av.agent_name, c.nome) as prompt_name,
  'Prompt inicial importado do sistema legado' as prompt_description,
  jsonb_build_object(
    'model', COALESCE(av.model, 'gpt-4o'),
    'temperature', 0.7,
    'max_tokens', 4096
  ) as model_config,
  'initial' as change_reason,
  'Prompt importado da tabela agent_versions para sistema self-improving' as change_summary,
  NOW() as activated_at
FROM agent_versions av
JOIN clients c ON av.client_id = c.id
WHERE av.is_active = true
  AND av.system_prompt IS NOT NULL
  AND av.id NOT IN (
    SELECT agent_version_id FROM system_prompts
  )
ON CONFLICT (agent_version_id, version) DO NOTHING;

-- ============================================
-- PASSO 2: Atualizar settings para agentes que ainda não têm
-- ============================================

INSERT INTO self_improving_settings (
  agent_version_id,
  reflection_enabled,
  reflection_interval_hours,
  min_conversations_for_reflection,
  auto_apply_enabled,
  notify_on_suggestion,
  notify_on_auto_update,
  notify_on_escalation
)
SELECT
  av.id,
  true,  -- reflection_enabled
  6,     -- interval_hours
  10,    -- min_conversations
  false, -- auto_apply começa desabilitado por segurança
  true,  -- notify on suggestion
  true,  -- notify on auto_update
  true   -- notify on escalation
FROM agent_versions av
WHERE av.is_active = true
  AND av.id NOT IN (
    SELECT agent_version_id
    FROM self_improving_settings
    WHERE agent_version_id IS NOT NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- PASSO 3: Verificar inserções
-- ============================================

-- Mostrar prompts criados
SELECT
  sp.id,
  sp.agent_version_id,
  sp.prompt_name,
  sp.version,
  sp.is_active,
  sp.change_reason,
  LEFT(sp.prompt_content, 100) as prompt_preview,
  sp.created_at
FROM system_prompts sp
ORDER BY sp.created_at DESC;

-- Mostrar settings criados
SELECT
  ss.id,
  ss.agent_version_id,
  ss.reflection_enabled,
  ss.auto_apply_enabled,
  ss.threshold_none,
  ss.threshold_suggestion,
  ss.threshold_auto_update
FROM self_improving_settings ss;

-- Mostrar resumo do sistema
SELECT
  (SELECT COUNT(*) FROM system_prompts) as total_prompts,
  (SELECT COUNT(*) FROM system_prompts WHERE is_active = true) as active_prompts,
  (SELECT COUNT(*) FROM self_improving_settings) as total_settings,
  (SELECT COUNT(*) FROM self_improving_settings WHERE reflection_enabled = true) as reflection_enabled_count,
  (SELECT COUNT(*) FROM self_improving_settings WHERE auto_apply_enabled = true) as auto_apply_enabled_count;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute as queries abaixo separadamente para verificar:
-- SELECT COUNT(*) as total_prompts FROM system_prompts;
-- SELECT COUNT(*) as total_settings FROM self_improving_settings;
