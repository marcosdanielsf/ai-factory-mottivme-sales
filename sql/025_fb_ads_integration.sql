-- =====================================================
-- 025: Facebook Ads Integration
-- =====================================================
-- Tabela para armazenar dados do Facebook Ads API
-- Permite calcular ROI real: Gasto → Conversas → Agendamentos → Vendas
-- =====================================================

-- 1. Tabela principal de performance de ads
CREATE TABLE IF NOT EXISTS fb_ads_performance (
  id BIGSERIAL PRIMARY KEY,

  -- Identificadores do Facebook
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  account_name TEXT,

  -- Status
  effective_status TEXT,

  -- Métricas de alcance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,

  -- Métricas de custo
  spend DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,4) DEFAULT 0,
  cpm DECIMAL(10,4) DEFAULT 0,

  -- Métricas de conversão (purchase)
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(10,2) DEFAULT 0,

  -- Métricas de mensagens (Meta Lead Ads / Click to WhatsApp)
  conversas_iniciadas INTEGER DEFAULT 0,
  custo_por_conversa DECIMAL(10,4) DEFAULT 0,
  mensagens_profundidade_2 INTEGER DEFAULT 0,  -- Usuário enviou 2+ mensagens
  primeira_resposta INTEGER DEFAULT 0,          -- Você respondeu
  custo_primeira_resposta DECIMAL(10,4) DEFAULT 0,
  custo_msg_profundidade_2 DECIMAL(10,4) DEFAULT 0,

  -- Video (se aplicável)
  video_id TEXT,

  -- Data do relatório
  data_relatorio DATE NOT NULL,

  -- Metadata
  location_id TEXT,  -- Para multi-tenancy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint para evitar duplicatas
  UNIQUE(ad_id, data_relatorio)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_fb_ads_ad_id ON fb_ads_performance(ad_id);
CREATE INDEX IF NOT EXISTS idx_fb_ads_data ON fb_ads_performance(data_relatorio);
CREATE INDEX IF NOT EXISTS idx_fb_ads_campaign ON fb_ads_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fb_ads_location ON fb_ads_performance(location_id);
CREATE INDEX IF NOT EXISTS idx_fb_ads_ad_name ON fb_ads_performance(ad_name);

-- 3. View que junta FB Ads com Leads (via ad_id)
CREATE OR REPLACE VIEW vw_ads_with_leads AS
SELECT
  fb.ad_id,
  fb.ad_name AS criativo,
  fb.campaign_name AS campanha,
  fb.adset_name AS conjunto,
  fb.data_relatorio,
  fb.account_name,

  -- Métricas do Facebook
  fb.spend AS gasto,
  fb.impressions,
  fb.clicks,
  fb.cpc,
  fb.cpm,
  fb.conversas_iniciadas AS conversas_fb,
  fb.custo_por_conversa,
  fb.mensagens_profundidade_2 AS engajados_fb,

  -- Métricas dos Leads (do nosso tracking)
  COUNT(DISTINCT t.id) AS leads_gerados,
  COUNT(DISTINCT t.id) FILTER (WHERE t.responded = true) AS leads_responderam,
  COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%') AS leads_agendaram,
  COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%') AS leads_fecharam,

  -- Cálculos de ROI
  CASE
    WHEN COUNT(DISTINCT t.id) > 0 THEN ROUND(fb.spend / COUNT(DISTINCT t.id), 2)
    ELSE NULL
  END AS custo_por_lead,

  CASE
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%') > 0
    THEN ROUND(fb.spend / COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%agend%' OR t.etapa_funil ILIKE '%booked%'), 2)
    ELSE NULL
  END AS custo_por_agendamento,

  CASE
    WHEN COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%') > 0
    THEN ROUND(fb.spend / COUNT(DISTINCT t.id) FILTER (WHERE t.etapa_funil ILIKE '%won%' OR t.etapa_funil ILIKE '%fechou%'), 2)
    ELSE NULL
  END AS custo_por_venda

FROM fb_ads_performance fb
LEFT JOIN n8n_schedule_tracking t ON t.ad_id = fb.ad_id
GROUP BY
  fb.ad_id, fb.ad_name, fb.campaign_name, fb.adset_name,
  fb.data_relatorio, fb.account_name, fb.spend, fb.impressions,
  fb.clicks, fb.cpc, fb.cpm, fb.conversas_iniciadas,
  fb.custo_por_conversa, fb.mensagens_profundidade_2;

-- 4. View agregada por criativo (para dashboard)
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
  AVG(custo_por_conversa) AS custo_medio_conversa,

  -- Totais de leads (precisa recalcular sem duplicatas)
  MIN(data_relatorio) AS primeira_data,
  MAX(data_relatorio) AS ultima_data,
  COUNT(DISTINCT data_relatorio) AS dias_rodando

FROM fb_ads_performance
WHERE ad_name IS NOT NULL AND ad_name != 'N/A'
GROUP BY ad_name, campaign_name, account_name
ORDER BY SUM(spend) DESC;

-- 5. View resumo por período
CREATE OR REPLACE VIEW vw_ads_summary_by_date AS
SELECT
  data_relatorio,
  account_name,
  COUNT(DISTINCT ad_id) AS ads_ativos,
  SUM(spend) AS gasto_total,
  SUM(impressions) AS impressoes,
  SUM(clicks) AS cliques,
  SUM(conversas_iniciadas) AS conversas,
  ROUND(AVG(cpc), 2) AS cpc_medio,
  ROUND(AVG(cpm), 2) AS cpm_medio,
  ROUND(AVG(custo_por_conversa), 2) AS custo_conversa_medio
FROM fb_ads_performance
GROUP BY data_relatorio, account_name
ORDER BY data_relatorio DESC;

-- 6. Função para upsert de dados do Facebook
CREATE OR REPLACE FUNCTION upsert_fb_ad_performance(
  p_ad_id TEXT,
  p_ad_name TEXT,
  p_adset_id TEXT,
  p_adset_name TEXT,
  p_campaign_id TEXT,
  p_campaign_name TEXT,
  p_account_name TEXT,
  p_effective_status TEXT,
  p_impressions INTEGER,
  p_clicks INTEGER,
  p_spend DECIMAL,
  p_cpc DECIMAL,
  p_cpm DECIMAL,
  p_conversas_iniciadas INTEGER,
  p_custo_por_conversa DECIMAL,
  p_mensagens_profundidade_2 INTEGER,
  p_primeira_resposta INTEGER,
  p_custo_primeira_resposta DECIMAL,
  p_custo_msg_profundidade_2 DECIMAL,
  p_video_id TEXT,
  p_data_relatorio DATE,
  p_location_id TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO fb_ads_performance (
    ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name,
    account_name, effective_status, impressions, clicks, spend, cpc, cpm,
    conversas_iniciadas, custo_por_conversa, mensagens_profundidade_2,
    primeira_resposta, custo_primeira_resposta, custo_msg_profundidade_2,
    video_id, data_relatorio, location_id, updated_at
  )
  VALUES (
    p_ad_id, p_ad_name, p_adset_id, p_adset_name, p_campaign_id, p_campaign_name,
    p_account_name, p_effective_status, p_impressions, p_clicks, p_spend, p_cpc, p_cpm,
    p_conversas_iniciadas, p_custo_por_conversa, p_mensagens_profundidade_2,
    p_primeira_resposta, p_custo_primeira_resposta, p_custo_msg_profundidade_2,
    p_video_id, p_data_relatorio, p_location_id, NOW()
  )
  ON CONFLICT (ad_id, data_relatorio)
  DO UPDATE SET
    ad_name = EXCLUDED.ad_name,
    adset_id = EXCLUDED.adset_id,
    adset_name = EXCLUDED.adset_name,
    campaign_id = EXCLUDED.campaign_id,
    campaign_name = EXCLUDED.campaign_name,
    account_name = EXCLUDED.account_name,
    effective_status = EXCLUDED.effective_status,
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    spend = EXCLUDED.spend,
    cpc = EXCLUDED.cpc,
    cpm = EXCLUDED.cpm,
    conversas_iniciadas = EXCLUDED.conversas_iniciadas,
    custo_por_conversa = EXCLUDED.custo_por_conversa,
    mensagens_profundidade_2 = EXCLUDED.mensagens_profundidade_2,
    primeira_resposta = EXCLUDED.primeira_resposta,
    custo_primeira_resposta = EXCLUDED.custo_primeira_resposta,
    custo_msg_profundidade_2 = EXCLUDED.custo_msg_profundidade_2,
    video_id = EXCLUDED.video_id,
    location_id = EXCLUDED.location_id,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 7. Permissions
GRANT SELECT ON fb_ads_performance TO anon, authenticated;
GRANT SELECT ON vw_ads_with_leads TO anon, authenticated;
GRANT SELECT ON vw_criativo_roi TO anon, authenticated;
GRANT SELECT ON vw_ads_summary_by_date TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_fb_ad_performance TO authenticated;

-- Comments
COMMENT ON TABLE fb_ads_performance IS 'Dados de performance do Facebook Ads API';
COMMENT ON VIEW vw_ads_with_leads IS 'Join FB Ads com leads do tracking (via ad_id)';
COMMENT ON VIEW vw_criativo_roi IS 'ROI agregado por criativo';
COMMENT ON FUNCTION upsert_fb_ad_performance IS 'Insere ou atualiza dados de FB Ads';
