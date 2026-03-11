-- migration: 048_vw_cross_channel_attribution.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: View de atribuicao cross-channel para Fase 5.
--            Agrupa leads por canal (ig_dm, whatsapp, lead_ads, click_to_whatsapp, organic)
--            com CPL e ROAS por canal.
--
-- Depende de: n8n_schedule_tracking (ad_id, session_source, attribution_method),
--             fb_ads_performance (spend), ghl_opportunities (monetary_value)

-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW vw_cross_channel_attribution AS
WITH lead_channels AS (
  SELECT
    t.id,
    t.location_id,
    t.unique_id,
    t.unique_id AS contact_id,
    t.ad_id,
    t.etapa_funil,
    t.attribution_method,
    t.attribution_confidence,
    t.created_at,

    -- Classificar canal baseado em dados disponiveis
    CASE
      -- Lead Ads (form submission via Meta)
      WHEN t.session_source ILIKE '%lead%ad%' OR t.utm_source ILIKE '%lead%'
        THEN 'lead_ads'
      -- Click to WhatsApp (ctwa)
      WHEN t.session_source ILIKE '%ctwa%' OR t.utm_source ILIKE '%ctwa%'
        OR t.session_source ILIKE '%click%whatsapp%'
        THEN 'click_to_whatsapp'
      -- Instagram DM (atribuicao probabilistica ou direta)
      WHEN t.session_source ILIKE '%instagram%' OR t.utm_source ILIKE '%instagram%'
        OR t.utm_medium ILIKE '%ig%' OR t.attribution_method = 'probabilistic'
        THEN 'ig_dm'
      -- Paid Social generico (tem ad_id mas nao se encaixa nos anteriores)
      WHEN t.ad_id IS NOT NULL AND TRIM(t.ad_id) NOT IN ('NULL', 'null', 'undefined', '')
        AND LENGTH(TRIM(t.ad_id)) > 5
        THEN 'paid_social'
      -- WhatsApp organico
      WHEN t.session_source ILIKE '%whatsapp%' OR t.utm_source ILIKE '%whatsapp%'
        THEN 'whatsapp_organic'
      -- Fallback: organico
      ELSE 'organic'
    END AS channel

  FROM n8n_schedule_tracking t
  WHERE t.field = 'ghl_sync'
    OR t.field IS NULL
    OR t.field IN ('etapa', 'classificacao_origem')
),

channel_metrics AS (
  SELECT
    lc.channel,
    lc.location_id,

    -- Volume
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE lc.etapa_funil ILIKE '%agend%' OR lc.etapa_funil ILIKE '%booked%') AS leads_agendaram,
    COUNT(*) FILTER (WHERE o.status = 'won') AS leads_fecharam,

    -- Receita
    COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS receita_total,

    -- Spend (soma de ads associados)
    COALESCE(SUM(fb.spend), 0) AS total_spend,

    -- Attribution quality
    COUNT(*) FILTER (WHERE lc.attribution_confidence = 'high') AS high_confidence,
    COUNT(*) FILTER (WHERE lc.attribution_confidence = 'medium') AS medium_confidence,
    COUNT(*) FILTER (WHERE lc.attribution_confidence = 'low' OR lc.attribution_confidence IS NULL) AS low_confidence

  FROM lead_channels lc
  LEFT JOIN ghl_opportunities o ON o.contact_id = lc.unique_id
  LEFT JOIN fb_ads_performance fb ON fb.ad_id = lc.ad_id
  GROUP BY lc.channel, lc.location_id
)

SELECT
  cm.channel,
  cm.location_id,
  cm.total_leads,
  cm.leads_agendaram,
  cm.leads_fecharam,
  cm.receita_total,
  cm.total_spend,

  -- CPL (Custo por Lead)
  CASE
    WHEN cm.total_leads > 0 AND cm.total_spend > 0
    THEN ROUND(cm.total_spend / cm.total_leads, 2)
    ELSE NULL
  END AS cpl,

  -- ROAS (Return on Ad Spend)
  CASE
    WHEN cm.total_spend > 0 AND cm.receita_total > 0
    THEN ROUND(cm.receita_total / cm.total_spend, 2)
    ELSE NULL
  END AS roas,

  -- Taxa de conversao
  CASE
    WHEN cm.total_leads > 0
    THEN ROUND((cm.leads_agendaram::NUMERIC / cm.total_leads) * 100, 1)
    ELSE 0
  END AS taxa_agendamento_pct,

  CASE
    WHEN cm.total_leads > 0
    THEN ROUND((cm.leads_fecharam::NUMERIC / cm.total_leads) * 100, 1)
    ELSE 0
  END AS taxa_fechamento_pct,

  -- Qualidade da atribuicao
  cm.high_confidence,
  cm.medium_confidence,
  cm.low_confidence

FROM channel_metrics cm
ORDER BY cm.total_leads DESC;

-- Permissoes
GRANT SELECT ON vw_cross_channel_attribution TO authenticated;

-- Comentario
COMMENT ON VIEW vw_cross_channel_attribution IS 'Atribuicao cross-channel: CPL e ROAS por canal (ig_dm, whatsapp, lead_ads, click_to_whatsapp, organic)';

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS vw_cross_channel_attribution;
-- COMMIT;
