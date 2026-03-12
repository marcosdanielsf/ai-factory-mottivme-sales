-- migration: 070_fix_avg_of_avgs_views.sql
-- autor: supabase-dba agent
-- data: 2026-03-12
-- descricao: Corrige AVG de AVGs em vw_criativo_roi e vw_ads_summary_by_date.
--            AVG(custo_por_conversa) → SUM(spend)/SUM(conversas_iniciadas)
--            AVG(cpc) → SUM(spend)/SUM(clicks)
--            AVG(cpm) → SUM(spend)/SUM(impressions)*1000

-- ============================================================
-- UP
-- ============================================================

-- 1. vw_criativo_roi — custo_medio_conversa corrigido
CREATE OR REPLACE VIEW vw_criativo_roi AS
SELECT
  ad_name AS criativo,
  campaign_name AS campanha,
  account_name,

  -- Totais FB
  SUM(spend) AS gasto_total,
  SUM(impressions) AS impressoes_total,
  SUM(clicks) AS cliques_total,
  SUM(conversas_iniciadas) AS conversas_total,

  -- Custo medio por conversa: SUM(spend)/SUM(conversas) em vez de AVG(custo_por_conversa)
  ROUND(
    CASE WHEN SUM(conversas_iniciadas) > 0
    THEN SUM(spend) / SUM(conversas_iniciadas)
    ELSE NULL END
  , 2) AS custo_medio_conversa,

  -- Datas
  MIN(data_relatorio) AS primeira_data,
  MAX(data_relatorio) AS ultima_data,
  COUNT(DISTINCT data_relatorio) AS dias_rodando

FROM fb_ads_performance
WHERE ad_name IS NOT NULL AND ad_name != 'N/A'
GROUP BY ad_name, campaign_name, account_name
ORDER BY SUM(spend) DESC;

-- 2. vw_ads_summary_by_date — cpc, cpm e custo_conversa corrigidos
CREATE OR REPLACE VIEW vw_ads_summary_by_date AS
SELECT
  data_relatorio,
  account_name,
  COUNT(DISTINCT ad_id) AS ads_ativos,
  SUM(spend) AS gasto_total,
  SUM(impressions) AS impressoes,
  SUM(clicks) AS cliques,
  SUM(conversas_iniciadas) AS conversas,

  -- CPC: SUM(spend)/SUM(clicks) em vez de AVG(cpc)
  ROUND(
    CASE WHEN SUM(clicks) > 0
    THEN SUM(spend) / SUM(clicks)
    ELSE NULL END
  , 2) AS cpc_medio,

  -- CPM: SUM(spend)/SUM(impressions)*1000 em vez de AVG(cpm)
  ROUND(
    CASE WHEN SUM(impressions) > 0
    THEN (SUM(spend) / SUM(impressions)) * 1000
    ELSE NULL END
  , 2) AS cpm_medio,

  -- Custo por conversa: SUM(spend)/SUM(conversas) em vez de AVG(custo_por_conversa)
  ROUND(
    CASE WHEN SUM(conversas_iniciadas) > 0
    THEN SUM(spend) / SUM(conversas_iniciadas)
    ELSE NULL END
  , 2) AS custo_conversa_medio

FROM fb_ads_performance
GROUP BY data_relatorio, account_name
ORDER BY data_relatorio DESC;

-- Permissoes (manter existentes)
GRANT SELECT ON vw_criativo_roi TO anon, authenticated;
GRANT SELECT ON vw_ads_summary_by_date TO anon, authenticated;

-- ============================================================
-- DOWN (rollback) — reverter para versao 025 com AVG
-- ============================================================
-- CREATE OR REPLACE VIEW vw_criativo_roi AS ... (versao com AVG(custo_por_conversa));
-- CREATE OR REPLACE VIEW vw_ads_summary_by_date AS ... (versao com AVG(cpc), AVG(cpm), AVG(custo_por_conversa));
