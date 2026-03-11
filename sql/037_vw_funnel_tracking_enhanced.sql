-- migration: 037_vw_funnel_tracking_enhanced.sql
-- autor: supabase-dba agent
-- data: 2026-02-26
-- descricao: View de funil com atribuicao em 3 niveis:
--   Nivel 1 (exact)             - ad_id valido → agrupado por ad_id (equivale a 035)
--   Nivel 2 (campaign_inferred) - sem ad_id, campaign_id valido → melhor ad da campanha
--   Nivel 3 (utm_campaign)      - sem ad_id ou campaign_id, mas utm_campaign preenchido
-- Complementa vw_funnel_tracking_by_ad (035) e vw_funnel_unattributed (036).
--
-- ============================================================
-- INVESTIGACAO PRE-MIGRATION (2026-02-26)
-- ============================================================
--
-- Resultados das queries de investigacao:
--
--  n8n_schedule_tracking (2.185 leads totais):
--    com_ad_id          =   207  (9,5%)
--    sem_ad_id          = 1.978  (90,5%)
--    com_campaign_id    =   174  (todos ja possuem ad_id tambem → sem_ad_com_campaign = 0)
--    sem_ad_com_campaign =    0  (campaign_id nunca aparece sozinho — SEMPRE vem junto com ad_id)
--    sem_ad_com_utm_campaign = 266 (265 deles = "Graduation Campaign 2026")
--
--  fb_ads_performance:
--    Tem colunas campaign_id e campaign_name.
--    campaign_id em fb_ads_performance esta VAZIO (nenhum registro com valor valido).
--    O join por campaign_id entre as duas tabelas retorna 0 matches.
--    Portanto o fallback via campaign_id e INVIAVEL no estado atual dos dados.
--
--  utm_campaign:
--    266 leads sem ad_id tem utm_campaign valido.
--    O join por utm_campaign ↔ fb_ads_performance.campaign_name retorna correspondencias
--    (ex: "Graduation Campaign 2026" ↔ fb_ads_performance.campaign_name).
--    ESTA e a unica rota de fallback viavel no momento.
--
--  CONCLUSION:
--    Nivel 2 (campaign_id fallback) foi SUBSTITUIDO por utm_campaign fallback,
--    pois campaign_id de tracking nunca ocorre sem ad_id, e fb_ads_performance.campaign_id
--    esta vazio. O campo utm_campaign e o unico vetor de recuperacao de leads nao atribuidos.
--
--  ACAO RECOMENDADA PARA O FUTURO:
--    Quando o pipeline de tracking comecar a preencher campaign_id em fb_ads_performance,
--    adicionar Nivel 2b com JOIN t.campaign_id = f.campaign_id para recuperar mais leads.
--
-- ============================================================
-- LOGICA DE ATRIBUICAO
-- ============================================================
--
--  Nivel 1 — exact:
--    Criterio : ad_id valido em n8n_schedule_tracking
--    Agrupado : por t.ad_id
--    Join FB  : fb_ads_performance.ad_id = t.ad_id (metricas diretas do anuncio)
--
--  Nivel 2 — utm_campaign_inferred:
--    Criterio : sem ad_id valido, utm_campaign preenchido
--    Agrupado : por t.utm_campaign
--    Join FB  : fb_ads_performance.campaign_name = t.utm_campaign (melhor ad por spend)
--    Resolucao: LATERAL → ad com maior spend total na campanha (representativo da campanha)
--    Cobertura atual: 266 leads (~13,5% do gap)
--
--  Nivel 3 — unattributed:
--    Criterio : sem ad_id e sem utm_campaign
--    Agrupado : linha unica com ad_id = NULL (bucket de nao-atribuidos)
--    Join FB  : nenhum (nao ha ad para apontar)
--    Complementa a view 036 com granularidade adicional de etapa do funil
--
-- ============================================================
-- UP
-- ============================================================

CREATE OR REPLACE VIEW vw_funnel_tracking_enhanced AS

-- ----------------------------------------------------------------
-- NIVEL 1: atribuicao exata por ad_id
-- Equivalente direto a vw_funnel_tracking_by_ad (035).
-- Mantido aqui para ter o funil completo em uma unica view.
-- ----------------------------------------------------------------
SELECT
  -- Identificador do anuncio
  t.ad_id                                                        AS ad_id,

  -- Nivel de confianca da atribuicao
  'exact'                                                        AS attribution_level,

  -- Chave de agrupamento (ad_id para nivel 1, utm_campaign para nivel 2)
  t.ad_id                                                        AS attribution_key,

  -- Metricas de performance do anuncio em fb_ads_performance
  -- Para nivel 1 e possivel fazer JOIN direto por ad_id
  fb.ad_name                                                     AS ad_name,
  fb.campaign_name                                               AS campaign_name,
  fb.adset_name                                                  AS adset_name,
  COALESCE(SUM(fb.spend), 0)                                     AS total_spend,
  COALESCE(SUM(fb.impressions), 0)                               AS total_impressions,
  COALESCE(SUM(fb.clicks), 0)                                    AS total_clicks,
  COALESCE(SUM(fb.conversas_iniciadas), 0)                       AS total_conversas,

  -- Metricas do funil de leads
  COUNT(*)                                                       AS total_leads,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Novo')                 AS novo,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Em Contato')           AS em_contato,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Agendou')              AS agendou,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'No-show')              AS no_show,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Perdido')              AS perdido,
  COUNT(*) FILTER (WHERE o.status = 'won')                       AS won,
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS won_value,

  -- Custo por lead (CPL) calculado: total_spend / total_leads
  CASE
    WHEN COUNT(*) > 0 AND COALESCE(SUM(fb.spend), 0) > 0
    THEN ROUND(COALESCE(SUM(fb.spend), 0) / COUNT(*), 2)
    ELSE NULL
  END                                                            AS cpl

FROM n8n_schedule_tracking t

-- JOIN com metricas do Facebook (ad_id direto)
LEFT JOIN fb_ads_performance fb
  ON fb.ad_id = t.ad_id

-- JOIN com oportunidades do GHL para won/won_value
LEFT JOIN ghl_opportunities o
  ON o.contact_id = t.unique_id

-- Nivel 1: apenas leads com ad_id valido
WHERE t.ad_id IS NOT NULL
  AND TRIM(t.ad_id) NOT IN ('NULL', 'null', 'undefined', '')
  AND LENGTH(TRIM(t.ad_id)) > 5

GROUP BY t.ad_id, fb.ad_name, fb.campaign_name, fb.adset_name

-- ----------------------------------------------------------------
-- NIVEL 2: fallback por utm_campaign
-- Leads sem ad_id mas com utm_campaign preenchido.
-- O anuncio representativo e o de maior spend total na campanha.
-- ----------------------------------------------------------------
UNION ALL

SELECT
  -- Para nivel 2, o ad_id vem do anuncio de maior spend da campanha
  best_ad.ad_id                                                  AS ad_id,
  'utm_campaign_inferred'                                        AS attribution_level,
  t.utm_campaign                                                 AS attribution_key,
  best_ad.ad_name                                                AS ad_name,
  t.utm_campaign                                                 AS campaign_name,
  best_ad.adset_name                                             AS adset_name,

  -- Metricas do Facebook: soma de todos os ads da campanha (nivel campanha)
  COALESCE(SUM(fb_all.spend), 0)                                 AS total_spend,
  COALESCE(SUM(fb_all.impressions), 0)                           AS total_impressions,
  COALESCE(SUM(fb_all.clicks), 0)                                AS total_clicks,
  COALESCE(SUM(fb_all.conversas_iniciadas), 0)                   AS total_conversas,

  -- Metricas do funil de leads
  COUNT(*)                                                       AS total_leads,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Novo')                 AS novo,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Em Contato')           AS em_contato,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Agendou')              AS agendou,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'No-show')              AS no_show,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Perdido')              AS perdido,
  COUNT(*) FILTER (WHERE o.status = 'won')                       AS won,
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS won_value,

  CASE
    WHEN COUNT(*) > 0 AND COALESCE(SUM(fb_all.spend), 0) > 0
    THEN ROUND(COALESCE(SUM(fb_all.spend), 0) / COUNT(*), 2)
    ELSE NULL
  END                                                            AS cpl

FROM n8n_schedule_tracking t

-- LATERAL: seleciona o anuncio com maior spend total na campanha
-- para representar o grupo. DISTINCT ON garante uma linha por campanha.
JOIN LATERAL (
  SELECT DISTINCT ON (campaign_name)
    fb2.ad_id,
    fb2.ad_name,
    fb2.adset_name,
    fb2.campaign_name
  FROM fb_ads_performance fb2
  WHERE fb2.campaign_name IS NOT NULL
    AND fb2.campaign_name = t.utm_campaign
  ORDER BY fb2.campaign_name, SUM(fb2.spend) OVER (PARTITION BY fb2.ad_id) DESC
) best_ad ON true

-- JOIN extra para somar metricas de TODOS os ads da campanha (nivel campanha)
LEFT JOIN fb_ads_performance fb_all
  ON fb_all.campaign_name = t.utm_campaign

-- JOIN com oportunidades GHL
LEFT JOIN ghl_opportunities o
  ON o.contact_id = t.unique_id

-- Nivel 2: sem ad_id valido, mas com utm_campaign preenchido
WHERE (
    t.ad_id IS NULL
    OR TRIM(t.ad_id) IN ('NULL', 'null', 'undefined', '')
    OR LENGTH(TRIM(t.ad_id)) <= 5
  )
  AND t.utm_campaign IS NOT NULL
  AND TRIM(t.utm_campaign) NOT IN ('NULL', 'null', 'undefined', '')
  AND LENGTH(TRIM(t.utm_campaign)) > 2

GROUP BY t.utm_campaign, best_ad.ad_id, best_ad.ad_name, best_ad.adset_name

-- ----------------------------------------------------------------
-- NIVEL 3: nao-atribuidos
-- Leads sem ad_id e sem utm_campaign.
-- Linha de bucket unica sem ad de referencia.
-- Complementa vw_funnel_unattributed (036) com dados de etapa do funil.
-- ----------------------------------------------------------------
UNION ALL

SELECT
  NULL                                                           AS ad_id,
  'unattributed'                                                 AS attribution_level,
  NULL                                                           AS attribution_key,
  NULL                                                           AS ad_name,
  NULL                                                           AS campaign_name,
  NULL                                                           AS adset_name,

  -- Sem anuncio: todas as metricas de spend ficam zeradas
  0                                                              AS total_spend,
  0                                                              AS total_impressions,
  0                                                              AS total_clicks,
  0                                                              AS total_conversas,

  COUNT(*)                                                       AS total_leads,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Novo')                 AS novo,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Em Contato')           AS em_contato,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Agendou')              AS agendou,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'No-show')              AS no_show,
  COUNT(*) FILTER (WHERE t.etapa_funil = 'Perdido')              AS perdido,
  COUNT(*) FILTER (WHERE o.status = 'won')                       AS won,
  COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS won_value,

  NULL                                                           AS cpl

FROM n8n_schedule_tracking t
LEFT JOIN ghl_opportunities o
  ON o.contact_id = t.unique_id

-- Nivel 3: sem ad_id valido E (sem utm_campaign OU utm_campaign sem match em fb_ads)
-- Catch-all para nao perder leads entre nivel 2 e 3
WHERE (
    t.ad_id IS NULL
    OR TRIM(t.ad_id) IN ('NULL', 'null', 'undefined', '')
    OR LENGTH(TRIM(t.ad_id)) <= 5
  )
  AND NOT EXISTS (
    -- Exclui leads que serao cobertos pelo nivel 2 (utm_campaign com match)
    SELECT 1 FROM fb_ads_performance fb3
    WHERE fb3.campaign_name = t.utm_campaign
      AND t.utm_campaign IS NOT NULL
      AND TRIM(t.utm_campaign) NOT IN ('NULL', 'null', 'undefined', '')
      AND LENGTH(TRIM(t.utm_campaign)) > 2
  );

-- ============================================================
-- Permissoes
-- ============================================================

-- Apenas usuarios autenticados. NUNCA conceder ao role anon.
GRANT SELECT ON vw_funnel_tracking_enhanced TO authenticated;

-- ============================================================
-- Indices recomendados para performance desta view
-- ============================================================

-- Index em utm_campaign para acelerar o LATERAL do nivel 2
-- (executar separadamente via Management API com CONCURRENTLY)
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_sched_utm_campaign
--   ON n8n_schedule_tracking(utm_campaign)
--   WHERE utm_campaign IS NOT NULL;
--
-- Index em fb_ads_performance.campaign_name para o JOIN do nivel 2
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fb_ads_campaign_name
--   ON fb_ads_performance(campaign_name);

-- ============================================================
-- VALIDACAO POS-EXECUCAO (rodar manualmente)
-- ============================================================
--
-- 1. Verificar se 3 niveis aparecem:
--    SELECT attribution_level, COUNT(*) as linhas, SUM(total_leads) as leads
--    FROM vw_funnel_tracking_enhanced
--    GROUP BY attribution_level;
--
-- 2. Conferir que total_leads bate com n8n_schedule_tracking:
--    SELECT SUM(total_leads) FROM vw_funnel_tracking_enhanced;
--    -- deve ser igual a: SELECT COUNT(*) FROM n8n_schedule_tracking;
--
-- 3. Verificar cobertura do nivel 2:
--    SELECT total_leads, campaign_name
--    FROM vw_funnel_tracking_enhanced
--    WHERE attribution_level = 'utm_campaign_inferred'
--    ORDER BY total_leads DESC;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS vw_funnel_tracking_enhanced;
-- COMMIT;
