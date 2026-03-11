-- migration: 040_vw_ads_hourly_heatmap.sql
-- autor: supabase-dba agent
-- data: 2026-02-26
-- descricao: View MetricsLab P2.4 — Heatmap de horarios de entrada de leads
--            Cruza n8n_schedule_tracking com ghl_opportunities para mostrar
--            volume e conversao por hora do dia e dia da semana.

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW public.vw_ads_hourly_heatmap AS
SELECT
  EXTRACT(HOUR FROM nst.created_at)::INT              AS hour_of_day,
  EXTRACT(DOW  FROM nst.created_at)::INT              AS day_of_week,

  -- Volume total de leads nessa celula
  COUNT(*)                                            AS total_leads,

  -- Leads que agendaram
  COUNT(*) FILTER (WHERE nst.etapa_funil = 'Agendou') AS leads_agendou,

  -- Leads que fecharam (won) via join com oportunidades
  COUNT(*) FILTER (WHERE o.status = 'won')            AS leads_won,

  -- Taxa de agendamento: agendou / total
  ROUND(
    (COUNT(*) FILTER (WHERE nst.etapa_funil = 'Agendou')::NUMERIC
      / NULLIF(COUNT(*), 0)) * 100, 2
  )                                                   AS conversion_rate

FROM n8n_schedule_tracking nst
LEFT JOIN ghl_opportunities o ON o.contact_id = nst.unique_id
WHERE
  nst.created_at IS NOT NULL
GROUP BY
  EXTRACT(HOUR FROM nst.created_at),
  EXTRACT(DOW  FROM nst.created_at)
ORDER BY
  day_of_week,
  hour_of_day;

-- Permissoes
GRANT SELECT ON public.vw_ads_hourly_heatmap TO authenticated;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS public.vw_ads_hourly_heatmap;
-- COMMIT;
