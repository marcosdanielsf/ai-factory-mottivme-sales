-- Funil de leads SEM atribuicao de ad_id (bucket de nao-atribuidos)
-- Complemento da view vw_funnel_tracking_by_ad (035), que filtra WHERE ad_id IS NOT NULL.
-- Leads que chegam organicamente, direto, ou com tracking quebrado somem do funil atribuido.
-- Esta view quantifica esse gap para auditoria de cobertura de atribuicao.
--
-- Criterios de "sem atribuicao valida" (espelham o NOT IN de 035):
--   - ad_id IS NULL                     → campo vazio na origem
--   - TRIM(ad_id) IN ('NULL', ...)       → string literal invalida enviada pelo tracker
--   - LENGTH(TRIM(ad_id)) <= 5          → valor curto demais para ser um ad_id real do FB
--
-- JOIN: n8n_schedule_tracking.unique_id = ghl_opportunities.contact_id
-- Criada: 2026-02-26

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW vw_funnel_unattributed AS
SELECT
  -- Total de leads sem atribuicao valida de ad_id
  COUNT(*) AS total_leads,

  -- Distribuicao por etapa do funil
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Novo')        AS novo,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Em Contato')  AS em_contato,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Agendou')     AS agendou,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'No-show')     AS no_show,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Perdido')     AS perdido,

  -- Conversoes e receita (via JOIN com oportunidades GHL)
  COUNT(*) FILTER (WHERE o.status = 'won')                                       AS won,
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0)             AS won_value

FROM n8n_schedule_tracking t
LEFT JOIN ghl_opportunities o ON o.contact_id = t.unique_id

-- Condicoes que definem "sem atribuicao valida" — inverso exato do WHERE em 035
WHERE t.ad_id IS NULL
   OR TRIM(t.ad_id) IN ('NULL', 'null', 'undefined', '')
   OR LENGTH(TRIM(t.ad_id)) <= 5;

-- ============================================================
-- Permissoes
-- ============================================================

-- Apenas usuarios autenticados. NUNCA conceder ao role anon.
GRANT SELECT ON vw_funnel_unattributed TO authenticated;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS vw_funnel_unattributed;
-- COMMIT;
