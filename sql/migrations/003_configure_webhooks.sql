-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 003
-- ============================================
-- Description: Configura webhooks de notificação para GHL
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-27
-- ============================================

-- IMPORTANTE: Substitua a URL abaixo pela URL do seu webhook n8n
-- O webhook deve apontar para o workflow que envia notificações ao GHL

-- ============================================
-- CONFIGURAR WEBHOOK DE NOTIFICAÇÃO
-- ============================================

-- Atualizar settings com webhook URL
-- NOTA: Ajuste a URL para o seu ambiente n8n
UPDATE self_improving_settings
SET
  notification_webhook_url = 'https://SEU_N8N_URL/webhook/self-improving-notification',
  updated_at = NOW()
WHERE notification_webhook_url IS NULL;

-- ============================================
-- OPCIONAL: Configurar settings específicos por agente
-- ============================================

-- Exemplo: Desabilitar auto-apply para agentes críticos
-- UPDATE self_improving_settings ss
-- SET
--   auto_apply_enabled = false,
--   require_approval_below_confidence = 0.95
-- FROM agent_versions av
-- WHERE ss.agent_version_id = av.id
--   AND av.agent_name ILIKE '%head%vendas%';

-- Exemplo: Habilitar auto-apply para agentes de teste
-- UPDATE self_improving_settings ss
-- SET
--   auto_apply_enabled = true,
--   auto_apply_min_confidence = 0.80
-- FROM agent_versions av
-- WHERE ss.agent_version_id = av.id
--   AND av.agent_name ILIKE '%test%';

-- ============================================
-- VERIFICAR CONFIGURAÇÕES
-- ============================================

SELECT
  av.agent_name,
  ss.reflection_enabled,
  ss.auto_apply_enabled,
  ss.notification_webhook_url IS NOT NULL as has_webhook,
  ss.threshold_none,
  ss.threshold_suggestion,
  ss.threshold_auto_update,
  ss.max_updates_per_day
FROM self_improving_settings ss
JOIN agent_versions av ON av.id = ss.agent_version_id
ORDER BY av.agent_name;
