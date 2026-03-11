-- =====================================================
-- MIGRAÇÃO: Adicionar colunas de Follow-up na n8n_schedule_tracking
-- Data: 2025-01-08
-- Versão: 2.0 - Usa subquery na n8n_historico_mensagens (sem last_message_from)
-- Descrição: Adiciona campos necessários para o Follow Up Eterno funcionar
-- =====================================================

-- 1. Adicionar coluna SOURCE (whatsapp, instagram, sms, email)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'whatsapp';

-- 2. Adicionar coluna FOLLOW_UP_COUNT (contador de tentativas)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- 3. Adicionar coluna API_KEY (chave da API do GHL)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- 4. Adicionar coluna LOCATION_ID (ID da location no GHL)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS location_id VARCHAR(100);

-- NOTA: Removemos last_message_from e last_message_at
-- Agora usamos subquery na n8n_historico_mensagens para obter:
-- - Quem enviou a última mensagem (message->>'type')
-- - Quando foi enviada (created_at)
-- - Conteúdo da última mensagem (message->>'content')

-- =====================================================
-- POPULAR DADOS INICIAIS (para registros existentes)
-- =====================================================

-- Setar source = 'whatsapp' como padrão para registros antigos
UPDATE n8n_schedule_tracking
SET source = 'whatsapp'
WHERE source IS NULL;

-- Setar follow_up_count = 0 para registros que não têm
UPDATE n8n_schedule_tracking
SET follow_up_count = 0
WHERE follow_up_count IS NULL;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para a query principal do Follow Up Eterno
CREATE INDEX IF NOT EXISTS idx_n8n_schedule_tracking_followup
ON n8n_schedule_tracking (ativo, source, follow_up_count)
WHERE ativo = true;

-- Índice para busca por unique_id
CREATE INDEX IF NOT EXISTS idx_n8n_schedule_tracking_unique_id
ON n8n_schedule_tracking (unique_id);

-- Índice na n8n_historico_mensagens para performance da subquery
CREATE INDEX IF NOT EXISTS idx_n8n_historico_mensagens_session_created
ON n8n_historico_mensagens (session_id, created_at DESC);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Rodar após a migração para confirmar:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'n8n_schedule_tracking'
-- ORDER BY ordinal_position;

-- Testar a subquery de última mensagem:
-- SELECT
--   nst.unique_id,
--   (SELECT message->>'type' FROM n8n_historico_mensagens WHERE session_id = nst.unique_id ORDER BY created_at DESC LIMIT 1) as last_sender,
--   (SELECT message->>'content' FROM n8n_historico_mensagens WHERE session_id = nst.unique_id ORDER BY created_at DESC LIMIT 1) as last_content,
--   (SELECT created_at FROM n8n_historico_mensagens WHERE session_id = nst.unique_id ORDER BY created_at DESC LIMIT 1) as last_message_at
-- FROM n8n_schedule_tracking nst
-- WHERE nst.ativo = true
-- LIMIT 5;
