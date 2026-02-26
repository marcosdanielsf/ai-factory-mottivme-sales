-- migration: 038_vw_conversion_time_stats.sql
-- autor: supabase-dba agent
-- data: 2026-02-26
-- descricao: View MetricsLab P1.2 — Tempo medio de conversao por ad_id
--            Cruza n8n_schedule_tracking com ghl_opportunities para medir
--            velocidade do funil e taxas de conversao por anuncio.

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW public.vw_conversion_time_stats AS
WITH
  -- Base: leads validos com ad_id tratado
  leads AS (
    SELECT
      nst.unique_id,
      nst.ad_id,
      nst.etapa_funil,
      nst.created_at AS lead_created_at
    FROM n8n_schedule_tracking nst
    WHERE
      nst.ad_id IS NOT NULL
      AND TRIM(nst.ad_id) NOT IN ('NULL', 'null', 'undefined', '')
      AND LENGTH(TRIM(nst.ad_id)) > 5
  ),

  -- Opportunities com status won e timestamp de mudanca
  opps AS (
    SELECT
      o.contact_id,
      o.status,
      o.last_status_change_at,
      o.monetary_value
    FROM ghl_opportunities o
  )

SELECT
  l.ad_id,

  -- Volume total de leads
  COUNT(DISTINCT l.unique_id)                                      AS total_leads,

  -- Tempo medio ate primeiro contato (leads que saíram de 'Novo')
  -- Aproximacao: usa elapsed desde created_at pois nao ha timestamp de mudanca de etapa
  ROUND(
    AVG(
      CASE
        WHEN l.etapa_funil <> 'Novo'
        THEN EXTRACT(EPOCH FROM (now() - l.lead_created_at)) / 3600.0
      END
    )::NUMERIC, 2
  )                                                                AS avg_hours_to_contact,

  -- Tempo medio ate agendamento
  ROUND(
    AVG(
      CASE
        WHEN l.etapa_funil = 'Agendou'
        THEN EXTRACT(EPOCH FROM (now() - l.lead_created_at)) / 3600.0
      END
    )::NUMERIC, 2
  )                                                                AS avg_hours_to_schedule,

  -- Tempo medio real ate fechamento (usando last_status_change_at da oportunidade)
  ROUND(
    AVG(
      CASE
        WHEN o.status = 'won' AND o.last_status_change_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (o.last_status_change_at - l.lead_created_at)) / 3600.0
      END
    )::NUMERIC, 2
  )                                                                AS avg_hours_to_won,

  -- Taxa de agendamento
  ROUND(
    (COUNT(DISTINCT l.unique_id) FILTER (WHERE l.etapa_funil = 'Agendou')::NUMERIC
      / NULLIF(COUNT(DISTINCT l.unique_id), 0)) * 100, 2
  )                                                                AS conversion_rate_schedule,

  -- Taxa de fechamento
  ROUND(
    (COUNT(DISTINCT l.unique_id) FILTER (WHERE o.status = 'won')::NUMERIC
      / NULLIF(COUNT(DISTINCT l.unique_id), 0)) * 100, 2
  )                                                                AS conversion_rate_won

FROM leads l
LEFT JOIN opps o ON o.contact_id = l.unique_id
GROUP BY l.ad_id
ORDER BY total_leads DESC;

-- Permissoes
GRANT SELECT ON public.vw_conversion_time_stats TO authenticated;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS public.vw_conversion_time_stats;
-- COMMIT;
