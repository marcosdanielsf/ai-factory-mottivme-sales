-- migration: 042_attribution_columns_schedule_tracking.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Adiciona colunas de atribuicao de anuncio na tabela n8n_schedule_tracking
--            e faz backfill para leads existentes com attribution_method deterministic/rule_based

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- 1. Adicionar colunas de atribuicao
ALTER TABLE n8n_schedule_tracking
  ADD COLUMN IF NOT EXISTS attribution_method TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attributed_ad_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attribution_confidence TEXT DEFAULT NULL;

-- 2. Backfill: leads com ad_id ja preenchido = deterministic (alta confianca)
UPDATE n8n_schedule_tracking
SET
  attribution_method     = 'deterministic',
  attribution_confidence = 'high'
WHERE ad_id IS NOT NULL
  AND attribution_method IS NULL;

-- 3. Backfill: leads SDR sem ad_id, vindo do instagram = rule_based
UPDATE n8n_schedule_tracking
SET
  attribution_method     = 'rule_based',
  attribution_confidence = 'low'
WHERE agente_ia IN ('sdrcarreira', 'sdr_inbound')
  AND ad_id IS NULL
  AND source = 'instagram'
  AND attribution_method IS NULL;

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- ALTER TABLE n8n_schedule_tracking
--   DROP COLUMN IF EXISTS attribution_method,
--   DROP COLUMN IF EXISTS attributed_ad_id,
--   DROP COLUMN IF EXISTS attribution_confidence;
-- COMMIT;
