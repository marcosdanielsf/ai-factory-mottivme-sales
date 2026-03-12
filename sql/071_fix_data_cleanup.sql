-- migration: 071_fix_data_cleanup.sql
-- autor: supabase-dba agent
-- data: 2026-03-12
-- descricao: 3 fixes de dados:
--   #6 — Gabriela duplicada no ad_account_mapping (remover entrada sem account_id)
--   Limpeza ad_id vazio/organic no n8n_schedule_tracking
--   Classificacao origem_lead para Jarbas (location x7XafRxWaLa0EheQcaGS)

-- ============================================================
-- UP
-- ============================================================

-- #6: Gabriela duplicada — remover entrada sem account_id real
-- (manter apenas a que tem account_id preenchido)
DELETE FROM ad_account_mapping
WHERE account_name ILIKE '%gabriela%'
  AND (account_id IS NULL OR account_id = '' OR account_id = 'N/A')
  AND EXISTS (
    SELECT 1 FROM ad_account_mapping g2
    WHERE g2.account_name = ad_account_mapping.account_name
      AND g2.account_id IS NOT NULL
      AND g2.account_id != ''
      AND g2.account_id != 'N/A'
  );

-- Limpeza ad_id: setar NULL onde valor e vazio ou 'organic' (nao sao ad_ids reais)
UPDATE n8n_schedule_tracking
SET ad_id = NULL
WHERE ad_id IN ('', 'organic', 'null', 'NULL', 'undefined', 'N/A');

-- Jarbas: classificar origem_lead para leads da location x7XafRxWaLa0EheQcaGS
-- Leads com ad_id preenchido = 'paid', sem ad_id = 'organic'
UPDATE n8n_schedule_tracking
SET origem_lead = CASE
  WHEN ad_id IS NOT NULL AND ad_id != '' THEN 'paid'
  ELSE 'organic'
END
WHERE location_id = 'x7XafRxWaLa0EheQcaGS'
  AND origem_lead IS NULL;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- #6: Nao reversivel sem backup do registro deletado
-- ad_id: UPDATE n8n_schedule_tracking SET ad_id = '' WHERE ad_id IS NULL AND ... (nao recomendado)
-- Jarbas: UPDATE n8n_schedule_tracking SET origem_lead = NULL WHERE location_id = 'x7XafRxWaLa0EheQcaGS';
