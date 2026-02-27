-- 042_ads_performance_upgrade.sql
-- Novas colunas + view atualizada para Ads Performance (Looker parity)
-- APLICAR MANUALMENTE no Supabase

-- 1. Novas colunas em fb_ads_performance
-- reach ja existe (034), frequency ja existe na tabela
ALTER TABLE fb_ads_performance
  ADD COLUMN IF NOT EXISTS post_reactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS form_submissions INTEGER DEFAULT 0;

-- 2. Recriar view vw_ads_summary_by_date com colunas extras
CREATE OR REPLACE VIEW vw_ads_summary_by_date AS
SELECT
  data_relatorio,
  location_id,
  SUM(spend)::NUMERIC(12,2) AS total_spend,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SUM(conversas_iniciadas) AS total_conversas,
  SUM(COALESCE(reach, 0)) AS total_reach,
  SUM(COALESCE(post_reactions, 0)) AS total_reactions,
  SUM(COALESCE(form_submissions, 0)) AS total_form_submissions,
  CASE WHEN SUM(clicks) > 0
    THEN (SUM(spend) / SUM(clicks))::NUMERIC(8,2)
    ELSE 0 END AS avg_cpc,
  CASE WHEN SUM(impressions) > 0
    THEN (SUM(spend) / SUM(impressions) * 1000)::NUMERIC(8,2)
    ELSE 0 END AS avg_cpm,
  CASE WHEN SUM(impressions) > 0
    THEN (SUM(clicks)::NUMERIC / SUM(impressions) * 100)::NUMERIC(6,2)
    ELSE 0 END AS avg_ctr,
  CASE WHEN SUM(COALESCE(reach, 0)) > 0
    THEN (SUM(impressions)::NUMERIC / SUM(COALESCE(reach, 0)))::NUMERIC(8,4)
    ELSE 0 END AS avg_frequency,
  COUNT(DISTINCT ad_id) AS ads_count
FROM fb_ads_performance
GROUP BY data_relatorio, location_id
ORDER BY data_relatorio;

-- Rollback:
-- ALTER TABLE fb_ads_performance DROP COLUMN IF EXISTS post_reactions;
-- ALTER TABLE fb_ads_performance DROP COLUMN IF EXISTS form_submissions;
-- (view: recriar versao anterior de 025_fb_ads_integration.sql)
