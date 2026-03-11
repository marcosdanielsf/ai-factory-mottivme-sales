-- Full Funnel Tracking: FB Ads → GHL leads por ad_id
-- JOIN: n8n_schedule_tracking.unique_id = ghl_opportunities.contact_id
-- Criada: 2026-02-26

DROP VIEW IF EXISTS vw_funnel_tracking_by_ad;

CREATE VIEW vw_funnel_tracking_by_ad AS
SELECT
  t.ad_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Novo') as novo,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Em Contato') as em_contato,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Agendou') as agendou,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'No-show') as no_show,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Perdido') as perdido,
  COUNT(*) FILTER (WHERE o.status = 'won') as won,
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) as won_value
FROM n8n_schedule_tracking t
LEFT JOIN ghl_opportunities o ON o.contact_id = t.unique_id
WHERE t.ad_id IS NOT NULL
  AND TRIM(t.ad_id) NOT IN ('NULL', 'null', 'undefined', '')
  AND LENGTH(TRIM(t.ad_id)) > 5
GROUP BY t.ad_id;

-- Permissoes (apenas authenticated, sem anon)
GRANT SELECT ON vw_funnel_tracking_by_ad TO authenticated;

-- Indice para performance
CREATE INDEX IF NOT EXISTS idx_n8n_schedule_tracking_ad_id
  ON n8n_schedule_tracking(ad_id)
  WHERE ad_id IS NOT NULL;
