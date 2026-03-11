-- migration: 046_vw_ads_with_leads_v2.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Atualiza vw_ads_with_leads com ROAS real e location_id.
--            Adiciona receita_total (monetary_value de oportunidades won)
--            e calculo de ROAS por anuncio.
--            IMPORTANTE: mantem TODAS colunas originais (025) — apenas adiciona.

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW vw_ads_with_leads AS
SELECT
  fb.ad_id,
  fb.ad_name AS criativo,
  fb.campaign_name AS campanha,
  fb.adset_name AS conjunto,
  fb.data_relatorio,
  fb.account_name,
  fb.location_id,

  -- Metricas do Facebook
  fb.spend AS gasto,
  fb.impressions,
  fb.clicks,
  fb.cpc,
  fb.cpm,
  fb.conversas_iniciadas AS conversas_fb,
  fb.custo_por_conversa,
  fb.mensagens_profundidade_2 AS engajados_fb,

  -- Metricas dos Leads (do nosso tracking)
  COUNT(DISTINCT t.id) AS leads_gerados,
  COUNT(DISTINCT t.id) FILTER (WHERE t.responded = true) AS leads_responderam,
  COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%') AS leads_agendaram,
  COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%') AS leads_fecharam,

  -- ROAS: receita de oportunidades won / gasto
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS receita_total,
  CASE
    WHEN fb.spend > 0 AND COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) > 0
    THEN ROUND(COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) / fb.spend, 2)
    ELSE 0
  END AS roas,

  -- Custo por lead
  CASE
    WHEN COUNT(DISTINCT t.id) > 0 THEN ROUND(fb.spend / COUNT(DISTINCT t.id), 2)
    ELSE NULL
  END AS custo_por_lead,

  -- Custo por agendamento
  CASE
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%') > 0
    THEN ROUND(fb.spend / COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%'), 2)
    ELSE NULL
  END AS custo_por_agendamento,

  -- Custo por venda
  CASE
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%') > 0
    THEN ROUND(fb.spend / COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%'), 2)
    ELSE NULL
  END AS custo_por_venda

FROM fb_ads_performance fb
LEFT JOIN n8n_schedule_tracking t ON t.ad_id = fb.ad_id
LEFT JOIN ghl_opportunities o ON o.contact_id = t.unique_id
GROUP BY
  fb.ad_id, fb.ad_name, fb.campaign_name, fb.adset_name,
  fb.data_relatorio, fb.account_name, fb.location_id,
  fb.spend, fb.impressions, fb.clicks, fb.cpc, fb.cpm,
  fb.conversas_iniciadas, fb.custo_por_conversa, fb.mensagens_profundidade_2;

-- Permissoes (manter as mesmas da view original)
GRANT SELECT ON vw_ads_with_leads TO anon, authenticated;

-- Comentario
COMMENT ON VIEW vw_ads_with_leads IS 'Join FB Ads com leads do tracking (via ad_id) + ROAS real via ghl_opportunities';

-- ============================================================
-- DOWN (rollback) — reverter para versao 025
-- ============================================================
-- Executar o CREATE OR REPLACE VIEW do arquivo 025_fb_ads_integration.sql
