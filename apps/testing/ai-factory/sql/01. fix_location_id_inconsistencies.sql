-- ================================================================
-- SCRIPT DE CORREÇÃO: Location IDs Inconsistentes
-- Projeto: ai-factory
-- Data: 2026-01-24
-- Problema: n8n_schedule_tracking e n8n_historico_mensagens
--           têm location_id NULL ou inconsistente
-- Fonte de verdade: ops_schedule_tracking (3.419 registros com location_id)
-- ================================================================

-- ================================================================
-- PARTE 1: DIAGNÓSTICO (RODAR PRIMEIRO PARA VALIDAR)
-- ================================================================

-- 1.1 Verificar quantos registros serão atualizados no n8n_schedule_tracking
SELECT
    'n8n_schedule_tracking' as tabela,
    COUNT(*) as total_para_atualizar
FROM n8n_schedule_tracking nst
JOIN ops_schedule_tracking ost ON nst.unique_id = ost.unique_id
WHERE ost.location_id IS NOT NULL
  AND ost.location_id != ''
  AND (nst.location_id IS NULL OR nst.location_id != ost.location_id);

-- 1.2 Verificar quantos registros serão atualizados no n8n_historico_mensagens
SELECT
    'n8n_historico_mensagens' as tabela,
    COUNT(*) as total_para_atualizar
FROM n8n_historico_mensagens nhm
JOIN ops_schedule_tracking ost ON nhm.session_id = ost.unique_id
WHERE ost.location_id IS NOT NULL
  AND ost.location_id != ''
  AND (nhm.location_id IS NULL OR nhm.location_id != ost.location_id);

-- 1.3 Amostra de registros que serão atualizados
SELECT
    nhm.session_id,
    nhm.location_id as location_id_atual,
    ost.location_id as location_id_correto,
    ost.api_key
FROM n8n_historico_mensagens nhm
JOIN ops_schedule_tracking ost ON nhm.session_id = ost.unique_id
WHERE ost.location_id IS NOT NULL
  AND ost.location_id != ''
  AND (nhm.location_id IS NULL OR nhm.location_id != ost.location_id)
LIMIT 20;

-- ================================================================
-- PARTE 2: CORREÇÃO DO n8n_schedule_tracking
-- (Adiciona api_key e location_id onde faltam)
-- ================================================================

-- RODAR EM TRANSAÇÃO PARA PODER ROLLBACK SE NECESSÁRIO
BEGIN;

UPDATE n8n_schedule_tracking nst
SET
    location_id = ost.location_id,
    api_key = ost.api_key
FROM ops_schedule_tracking ost
WHERE nst.unique_id = ost.unique_id
  AND ost.location_id IS NOT NULL
  AND ost.location_id != ''
  AND (nst.location_id IS NULL OR nst.location_id = '' OR nst.api_key IS NULL);

-- Verificar resultado antes de COMMIT
SELECT
    'Registros atualizados no n8n_schedule_tracking' as acao,
    COUNT(*) as total
FROM n8n_schedule_tracking
WHERE location_id IS NOT NULL AND api_key IS NOT NULL;

-- Se estiver OK:
COMMIT;

-- Se precisar desfazer:
-- ROLLBACK;

-- ================================================================
-- PARTE 3: CORREÇÃO DO n8n_historico_mensagens
-- (Atualiza location_id baseado no session_id)
-- ================================================================

BEGIN;

UPDATE n8n_historico_mensagens nhm
SET location_id = ost.location_id
FROM ops_schedule_tracking ost
WHERE nhm.session_id = ost.unique_id
  AND ost.location_id IS NOT NULL
  AND ost.location_id != ''
  AND (nhm.location_id IS NULL OR nhm.location_id != ost.location_id);

-- Verificar resultado
SELECT
    location_id,
    COUNT(*) as total
FROM n8n_historico_mensagens
GROUP BY location_id
ORDER BY total DESC;

-- Se estiver OK:
COMMIT;

-- Se precisar desfazer:
-- ROLLBACK;

-- ================================================================
-- PARTE 4: CORREÇÃO DO WORKFLOW N8N (PREVENTIVA)
-- O nó "Salvar registro de Atividade - alan" precisa incluir
-- api_key e location_id na query INSERT
-- ================================================================

/*
QUERY ATUAL (PROBLEMÁTICA):
INSERT INTO n8n_schedule_tracking (
  field, value, execution_id, unique_id, ativo, chat_id
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (unique_id) DO UPDATE SET...

QUERY CORRIGIDA:
INSERT INTO n8n_schedule_tracking (
  field, value, execution_id, unique_id, ativo, chat_id, api_key, location_id, source
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (unique_id) DO UPDATE SET
  field = EXCLUDED.field,
  value = EXCLUDED.value,
  execution_id = EXCLUDED.execution_id,
  ativo = EXCLUDED.ativo,
  chat_id = EXCLUDED.chat_id,
  api_key = COALESCE(EXCLUDED.api_key, n8n_schedule_tracking.api_key),
  location_id = COALESCE(EXCLUDED.location_id, n8n_schedule_tracking.location_id),
  source = COALESCE(EXCLUDED.source, n8n_schedule_tracking.source);

NOTA: Usar COALESCE para não sobrescrever dados existentes com NULL
*/

-- ================================================================
-- PARTE 5: VERIFICAÇÃO FINAL
-- ================================================================

-- 5.1 Verificar distribuição final no n8n_schedule_tracking
SELECT
    CASE WHEN location_id IS NULL THEN 'NULL' ELSE location_id END as location_id,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentual
FROM n8n_schedule_tracking
GROUP BY location_id
ORDER BY total DESC;

-- 5.2 Verificar distribuição final no n8n_historico_mensagens
SELECT
    CASE WHEN location_id IS NULL THEN 'NULL' ELSE location_id END as location_id,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentual
FROM n8n_historico_mensagens
GROUP BY location_id
ORDER BY total DESC;

-- 5.3 Testar a query de follow-up original
WITH ultima_msg AS (
  SELECT DISTINCT ON (session_id)
    session_id,
    COALESCE(message->>'type', 'unknown') as last_sender,
    created_at as last_message_at
  FROM n8n_historico_mensagens
  WHERE message->>'content' IS NOT NULL
    AND message->>'content' != ''
  ORDER BY session_id, created_at DESC
)
SELECT
  t.unique_id,
  t.api_key,
  t.location_id,
  um.last_sender,
  um.last_message_at
FROM n8n_schedule_tracking t
JOIN follow_up_cadencias c
  ON LOWER(COALESCE(t.source, 'whatsapp')) = c.canal
  AND COALESCE(t.follow_up_count, 0) + 1 = c.tentativa
LEFT JOIN ultima_msg um ON um.session_id = t.unique_id
WHERE t.ativo = true
  AND t.location_id IS NOT NULL
  AND t.api_key IS NOT NULL
LIMIT 10;
