-- migration: 030_appointments_log_ghl_contact_id.sql
-- autor: supabase-dba agent
-- data: 2026-02-19
-- descricao: Adicionar coluna ghl_contact_id em appointments_log com backfill do raw_payload
--            e index parcial para join eficiente com n8n_schedule_tracking.unique_id

-- ============================================================
-- UP
-- ============================================================

-- 1. Adicionar coluna
ALTER TABLE appointments_log ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- 2. Backfill: extrair contact_id ou lead_id do raw_payload (COALESCE = pega o primeiro nao-null)
UPDATE appointments_log
SET ghl_contact_id = COALESCE(
  raw_payload->>'contact_id',
  raw_payload->>'lead_id'
)
WHERE ghl_contact_id IS NULL
  AND raw_payload IS NOT NULL;

-- 3. Criar index parcial para join eficiente (exclui NULLs do index)
CREATE INDEX IF NOT EXISTS idx_appointments_log_ghl_contact_id
  ON appointments_log (ghl_contact_id)
  WHERE ghl_contact_id IS NOT NULL;

-- 4. Comentario descritivo
COMMENT ON COLUMN appointments_log.ghl_contact_id IS
  'GHL contact_id extraido do raw_payload (contact_id ou lead_id). Usado pra join com n8n_schedule_tracking.unique_id';

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP INDEX IF EXISTS idx_appointments_log_ghl_contact_id;
-- ALTER TABLE appointments_log DROP COLUMN IF EXISTS ghl_contact_id;
-- COMMIT;
