-- ================================================================
-- CORREÇÃO DO NÓ "Salvar registro de Atividade - alan"
-- Problema: Query não incluía api_key, location_id, source
-- ================================================================

-- ❌ QUERY ATUAL (PROBLEMÁTICA):
/*
INSERT INTO n8n_schedule_tracking (
  field,
  value,
  execution_id,
  unique_id,
  ativo,
  chat_id
) VALUES (
  $1, $2, $3, $4, $5, $6
)
ON CONFLICT (unique_id) DO UPDATE
SET
  field = EXCLUDED.field,
  value = EXCLUDED.value,
  execution_id = EXCLUDED.execution_id,
  ativo = EXCLUDED.ativo,
  chat_id = EXCLUDED.chat_id;
*/

-- ✅ QUERY CORRIGIDA:
INSERT INTO n8n_schedule_tracking (
  field,
  value,
  execution_id,
  unique_id,
  ativo,
  chat_id,
  api_key,
  location_id,
  source
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
)
ON CONFLICT (unique_id) DO UPDATE
SET
  field = EXCLUDED.field,
  value = EXCLUDED.value,
  execution_id = EXCLUDED.execution_id,
  ativo = EXCLUDED.ativo,
  chat_id = EXCLUDED.chat_id,
  api_key = COALESCE(EXCLUDED.api_key, n8n_schedule_tracking.api_key),
  location_id = COALESCE(EXCLUDED.location_id, n8n_schedule_tracking.location_id),
  source = COALESCE(EXCLUDED.source, n8n_schedule_tracking.source);

-- ================================================================
-- CONFIGURAÇÃO NO N8N
-- ================================================================
/*
No nó Postgres "Salvar registro de Atividade - alan":

1. Substituir a query pela versão corrigida acima

2. No campo "Query Replacement", atualizar para incluir os novos campos:

   ANTES:
   {{ $json.session.split(',') }}

   DEPOIS (assumindo que os dados vêm do mesmo JSON):
   {{ [
     $json.field,
     $json.value,
     $json.execution_id,
     $json.unique_id,
     $json.ativo,
     $json.chat_id,
     $json.api_key,      // NOVO
     $json.location_id,  // NOVO
     $json.source        // NOVO
   ] }}

   OU se usa session.split(','):
   Garantir que a string session inclua os 9 valores separados por vírgula

3. IMPORTANTE: Verificar de onde vêm api_key e location_id no fluxo
   - Se não existirem, buscar do contexto/webhook anterior
   - Se o webhook não tiver, adicionar ao payload de entrada

*/

-- ================================================================
-- VERIFICAÇÃO: Campos disponíveis na tabela
-- ================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'n8n_schedule_tracking'
-- ORDER BY ordinal_position;
