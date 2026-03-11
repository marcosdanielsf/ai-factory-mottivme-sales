-- migration: 039_vw_ads_anomaly_detection.sql
-- autor: supabase-dba agent
-- data: 2026-02-26
-- descricao: View MetricsLab P2.2 — Deteccao de anomalias por ad_id
--            Compara KPIs (CPL, CTR, spend) dos ultimos 7 dias vs 30 dias anteriores.
--            Flag is_anomaly = true quando variacao supera 50% em qualquer metrica.

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW public.vw_ads_anomaly_detection AS
WITH
  -- Periodo: ultimos 7 dias
  recent AS (
    SELECT
      f.ad_id,
      MAX(f.ad_name)                                   AS ad_name,
      SUM(f.spend)                                     AS spend_7d,
      SUM(f.impressions)                               AS impressions_7d,
      SUM(f.clicks)                                    AS clicks_7d,
      SUM(f.conversas_iniciadas)                       AS leads_7d
    FROM fb_ads_performance f
    WHERE
      f.data_relatorio >= (CURRENT_DATE - INTERVAL '7 days')
      AND f.ad_id IS NOT NULL
      AND TRIM(f.ad_id) <> ''
    GROUP BY f.ad_id
  ),

  -- Periodo: 30 dias anteriores (dia -37 ate dia -8)
  baseline AS (
    SELECT
      f.ad_id,
      SUM(f.spend)                                     AS spend_30d,
      SUM(f.impressions)                               AS impressions_30d,
      SUM(f.clicks)                                    AS clicks_30d,
      SUM(f.conversas_iniciadas)                       AS leads_30d
    FROM fb_ads_performance f
    WHERE
      f.data_relatorio >= (CURRENT_DATE - INTERVAL '37 days')
      AND f.data_relatorio <  (CURRENT_DATE - INTERVAL '7 days')
      AND f.ad_id IS NOT NULL
      AND TRIM(f.ad_id) <> ''
    GROUP BY f.ad_id
  ),

  -- Calcular CPL e CTR para cada periodo
  metrics AS (
    SELECT
      r.ad_id,
      r.ad_name,

      -- Spend
      ROUND(r.spend_7d::NUMERIC, 2)                   AS spend_7d,
      ROUND(COALESCE(b.spend_30d, 0)::NUMERIC, 2)     AS spend_30d,

      -- CPL: custo por conversa iniciada (proxy de lead, coluna real: conversas_iniciadas)
      ROUND(
        NULLIF(r.spend_7d, 0) / NULLIF(r.leads_7d, 0)
      , 2)                                             AS cpl_7d,
      ROUND(
        NULLIF(b.spend_30d, 0) / NULLIF(b.leads_30d, 0)
      , 2)                                             AS cpl_30d,

      -- CTR: clicks / impressions * 100
      ROUND(
        (NULLIF(r.clicks_7d, 0)::NUMERIC / NULLIF(r.impressions_7d, 0)) * 100
      , 4)                                             AS ctr_7d,
      ROUND(
        (NULLIF(b.clicks_30d, 0)::NUMERIC / NULLIF(b.impressions_30d, 0)) * 100
      , 4)                                             AS ctr_30d

    FROM recent r
    LEFT JOIN baseline b USING (ad_id)
  )

SELECT
  m.ad_id,
  m.ad_name,

  -- CPL
  m.cpl_7d,
  m.cpl_30d,
  ROUND(
    ((m.cpl_7d - m.cpl_30d) / NULLIF(m.cpl_30d, 0)) * 100
  , 2)                                                 AS cpl_delta_pct,

  -- CTR
  m.ctr_7d,
  m.ctr_30d,
  ROUND(
    ((m.ctr_7d - m.ctr_30d) / NULLIF(m.ctr_30d, 0)) * 100
  , 2)                                                 AS ctr_delta_pct,

  -- Spend
  m.spend_7d,
  m.spend_30d,

  -- Flag de anomalia: variacao > 50% em CPL ou CTR
  (
    ABS(((m.cpl_7d - m.cpl_30d) / NULLIF(m.cpl_30d, 0)) * 100) > 50
    OR
    ABS(((m.ctr_7d - m.ctr_30d) / NULLIF(m.ctr_30d, 0)) * 100) > 50
  )                                                    AS is_anomaly

FROM metrics m
ORDER BY is_anomaly DESC,
         ABS(((m.cpl_7d - m.cpl_30d) / NULLIF(m.cpl_30d, 0)) * 100) DESC NULLS LAST;

-- Permissoes
GRANT SELECT ON public.vw_ads_anomaly_detection TO authenticated;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS public.vw_ads_anomaly_detection;
-- COMMIT;
