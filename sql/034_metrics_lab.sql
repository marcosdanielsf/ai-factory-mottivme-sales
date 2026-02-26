-- ================================================================
-- METRICS LAB
-- ================================================================
-- Migration: 034_metrics_lab.sql
-- Criado: 2026-02-26
-- Descricao: Adiciona metricas de video e ARC (Hook/Hold/Body) em
--            fb_ads_performance, cria tabela conversion_events para
--            rastrear conversoes multi-gateway (Hotmart, Kiwify,
--            Stripe, GHL), e view vw_metrics_lab_lead_score para
--            calcular score ponderado 0-100 por criativo.
-- Autor: supabase-dba agent
-- ================================================================

-- ================================================================
-- PARTE 1: ALTER TABLE fb_ads_performance
--          Adiciona colunas de video e metricas ARC
-- ================================================================

-- 1a. Colunas base de video (necessarias antes das generated columns)
ALTER TABLE fb_ads_performance
  ADD COLUMN IF NOT EXISTS video_views_3s   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p25        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p75        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p100       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outbound_clicks  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ctr_link         NUMERIC(8,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach            INTEGER DEFAULT 0;

COMMENT ON COLUMN fb_ads_performance.video_views_3s   IS 'Visualizacoes de video com 3+ segundos (ThruPlay threshold)';
COMMENT ON COLUMN fb_ads_performance.video_p25        IS 'Usuarios que assistiram 25% do video';
COMMENT ON COLUMN fb_ads_performance.video_p75        IS 'Usuarios que assistiram 75% do video — base do Hold Rate';
COMMENT ON COLUMN fb_ads_performance.video_p100       IS 'Usuarios que assistiram 100% do video';
COMMENT ON COLUMN fb_ads_performance.outbound_clicks  IS 'Cliques que saem do Facebook (link externo) — base do Body Rate';
COMMENT ON COLUMN fb_ads_performance.ctr_link         IS 'CTR de link (outbound_clicks / impressions * 100) vindo da API do Facebook';
COMMENT ON COLUMN fb_ads_performance.reach            IS 'Alcance unico do ad (pessoas atingidas)';

-- 1b. Generated columns (computed automaticamente pelo banco)
--     Adicionadas separadamente pois dependem das colunas acima.
--     Uso de DO $$ para checagem idempotente — ADD COLUMN IF NOT EXISTS
--     nao e suportado para generated columns diretamente.

DO $$
BEGIN
  -- hook_rate: % de quem viu o video 3s em relacao ao total de impressoes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fb_ads_performance'
      AND column_name  = 'hook_rate'
  ) THEN
    ALTER TABLE fb_ads_performance
      ADD COLUMN hook_rate NUMERIC(8,4)
        GENERATED ALWAYS AS (
          CASE WHEN impressions > 0
            THEN video_views_3s::NUMERIC / impressions * 100
            ELSE 0
          END
        ) STORED;
    COMMENT ON COLUMN fb_ads_performance.hook_rate IS 'ARC Hook Rate (%): video_views_3s / impressions * 100. Mede poder de captura da abertura do anuncio.';
  END IF;

  -- hold_rate: % de quem chegou ao p75 em relacao a quem iniciou (3s)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fb_ads_performance'
      AND column_name  = 'hold_rate'
  ) THEN
    ALTER TABLE fb_ads_performance
      ADD COLUMN hold_rate NUMERIC(8,4)
        GENERATED ALWAYS AS (
          CASE WHEN video_views_3s > 0
            THEN video_p75::NUMERIC / video_views_3s * 100
            ELSE 0
          END
        ) STORED;
    COMMENT ON COLUMN fb_ads_performance.hold_rate IS 'ARC Hold Rate (%): video_p75 / video_views_3s * 100. Mede retencao do conteudo (corpo do video).';
  END IF;

  -- body_rate: % de cliques externos em relacao a quem chegou ao p75
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fb_ads_performance'
      AND column_name  = 'body_rate'
  ) THEN
    ALTER TABLE fb_ads_performance
      ADD COLUMN body_rate NUMERIC(8,4)
        GENERATED ALWAYS AS (
          CASE WHEN video_p75 > 0
            THEN outbound_clicks::NUMERIC / video_p75 * 100
            ELSE 0
          END
        ) STORED;
    COMMENT ON COLUMN fb_ads_performance.body_rate IS 'ARC Body Rate (%): outbound_clicks / video_p75 * 100. Mede efetividade do CTA (call-to-action) apos retencao.';
  END IF;
END $$;

-- ================================================================
-- PARTE 2: CREATE TABLE conversion_events
--          Rastreia conversoes de qualquer gateway + Meta CAPI
-- ================================================================

CREATE TABLE IF NOT EXISTS conversion_events (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificadores de negocio
  location_id   TEXT        NOT NULL,
  lead_id       TEXT,                        -- contact_id do GHL ou identificador interno
  ad_id         TEXT,                        -- ad_id do Facebook que gerou o lead

  -- Origem da conversao
  source        TEXT        NOT NULL,        -- 'hotmart' | 'kiwify' | 'stripe' | 'ghl_opportunity' | 'manual'

  -- Valor financeiro
  amount        NUMERIC(12,2) DEFAULT 0,
  currency      TEXT          DEFAULT 'BRL',

  -- Status do pagamento
  status        TEXT          DEFAULT 'confirmed',  -- 'confirmed' | 'refunded' | 'pending' | 'chargeback'

  -- Identificadores externos
  source_id     TEXT,                        -- transaction_id do gateway OU opportunity_id do GHL
  pixel_id      TEXT,                        -- Facebook Pixel ID usado para envio CAPI

  -- Controle de envio Meta CAPI
  capi_sent     BOOLEAN       DEFAULT false,
  capi_sent_at  TIMESTAMPTZ,

  -- Dados extras (payload completo do webhook, UTMs, etc.)
  metadata      JSONB         DEFAULT '{}',

  -- Timestamps
  converted_at  TIMESTAMPTZ   DEFAULT now(),
  created_at    TIMESTAMPTZ   DEFAULT now()
);

COMMENT ON TABLE conversion_events IS 'Conversoes de qualquer gateway (Hotmart, Kiwify, Stripe, GHL) com suporte a Meta CAPI. Permite atribuicao financeira ao ad_id do Facebook.';
COMMENT ON COLUMN conversion_events.source     IS 'Gateway de origem: hotmart | kiwify | stripe | ghl_opportunity | manual';
COMMENT ON COLUMN conversion_events.status     IS 'Status do pagamento: confirmed | refunded | pending | chargeback';
COMMENT ON COLUMN conversion_events.source_id  IS 'ID externo: transaction_id do gateway ou opportunity_id do GHL';
COMMENT ON COLUMN conversion_events.pixel_id   IS 'Facebook Pixel ID utilizado para envio do evento via Conversions API (CAPI)';
COMMENT ON COLUMN conversion_events.capi_sent  IS 'Flag: true quando o evento ja foi enviado para a Meta Conversions API';
COMMENT ON COLUMN conversion_events.metadata   IS 'Payload bruto do webhook do gateway, UTMs, fingerprint, etc.';

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_conversion_events_location
  ON conversion_events(location_id);

CREATE INDEX IF NOT EXISTS idx_conversion_events_ad
  ON conversion_events(ad_id, location_id);

CREATE INDEX IF NOT EXISTS idx_conversion_events_source
  ON conversion_events(source, location_id);

CREATE INDEX IF NOT EXISTS idx_conversion_events_date
  ON conversion_events(converted_at);

-- Index parcial para fila de envio CAPI (apenas eventos ainda nao enviados)
CREATE INDEX IF NOT EXISTS idx_conversion_events_capi_pending
  ON conversion_events(created_at)
  WHERE capi_sent = false AND status = 'confirmed';

-- RLS: autenticados podem ler e inserir; service role tem acesso total
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_read_conversion_events'
      AND tablename  = 'conversion_events'
  ) THEN
    CREATE POLICY authenticated_read_conversion_events
      ON conversion_events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_insert_conversion_events'
      AND tablename  = 'conversion_events'
  ) THEN
    CREATE POLICY authenticated_insert_conversion_events
      ON conversion_events
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'service_role_all_conversion_events'
      AND tablename  = 'conversion_events'
  ) THEN
    CREATE POLICY service_role_all_conversion_events
      ON conversion_events
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END $$;

-- ================================================================
-- PARTE 3: VIEW vw_metrics_lab_lead_score
--          Score ponderado 0-100 por criativo (ad_id)
--          Componentes (25pts cada):
--            - CTR de link (qualidade do trafego)
--            - Taxa de resposta (engajamento na conversa)
--            - Taxa de conversao (receita atribuida)
--            - Eficiencia do CPL (custo por lead)
-- ================================================================

CREATE OR REPLACE VIEW vw_metrics_lab_lead_score AS
WITH base AS (
  -- Agregacao por criativo, com join de conversoes
  SELECT
    ap.ad_id,
    ap.ad_name,
    ap.adset_name,
    ap.campaign_name,
    ap.account_name,

    -- Metricas brutas agregadas
    SUM(ap.spend)                  AS gasto,
    SUM(ap.clicks)                 AS leads,       -- proxy de leads (cliques unicos)
    SUM(ap.conversas_iniciadas)    AS conversas,
    AVG(ap.ctr_link)               AS avg_ctr_link,
    AVG(ap.hook_rate)              AS avg_hook_rate,
    AVG(ap.hold_rate)              AS avg_hold_rate,
    AVG(ap.body_rate)              AS avg_body_rate,

    -- Conversoes financeiras atribuidas ao ad_id
    COUNT(ce.id)                   AS total_conversoes

  FROM fb_ads_performance ap
  LEFT JOIN conversion_events ce
         ON ce.ad_id        = ap.ad_id
        AND ce.status        = 'confirmed'
  GROUP BY
    ap.ad_id,
    ap.ad_name,
    ap.adset_name,
    ap.campaign_name,
    ap.account_name
),
scored AS (
  SELECT
    *,

    -- CPL calculado
    CASE WHEN leads > 0 THEN gasto / leads ELSE 0 END AS cpl,

    -- Taxa de resposta (%)
    CASE WHEN leads > 0
      THEN (conversas::NUMERIC / leads) * 100
      ELSE 0
    END AS resp_pct,

    -- Score composto 0-100 (4 componentes de 25pts cada)
    LEAST(100, GREATEST(0,

      -- Componente 1 (0-25): CTR de link
      -- CTR 3% = 24pts; escala linear com teto em 25pts
      LEAST(25, COALESCE(avg_ctr_link, 0) * 8)

      -- Componente 2 (0-25): Taxa de resposta
      -- 100% resposta = 25pts; escala: resp_pct / 4
      + LEAST(25,
          CASE WHEN leads > 0
            THEN (conversas::NUMERIC / leads) * 100 / 4
            ELSE 0
          END
        )

      -- Componente 3 (0-25): Taxa de conversao
      -- 5% de conversao = 25pts
      + LEAST(25,
          COALESCE(
            total_conversoes::NUMERIC / NULLIF(leads, 0) * 100 * 5,
            0
          )
        )

      -- Componente 4 (0-25): Eficiencia de CPL
      -- CPL R$0 = 25pts; CPL R$100+ = 0pts; escala: 25 - cpl/4
      + LEAST(25,
          CASE WHEN gasto > 0 AND leads > 0
            THEN 25 - LEAST(25, (gasto / leads) / 4)
            ELSE 0
          END
        )

    ))::INTEGER AS score

  FROM base
)
SELECT
  ad_id,
  ad_name,
  adset_name,
  campaign_name,
  account_name,

  -- Metricas financeiras
  gasto,
  leads,
  cpl,
  total_conversoes,

  -- Metricas de engajamento
  resp_pct,
  avg_ctr_link,

  -- Score ponderado
  score,

  -- Semaforo de potencial
  CASE
    WHEN score >= 70 THEN 'alto'
    WHEN score >= 40 THEN 'medio'
    WHEN score >= 20 THEN 'baixo'
    ELSE 'desqualificado'
  END AS potencial,

  -- Metricas ARC do video
  ROUND(avg_hook_rate, 2) AS avg_hook_rate,
  ROUND(avg_hold_rate, 2) AS avg_hold_rate,
  ROUND(avg_body_rate, 2) AS avg_body_rate

FROM scored
ORDER BY score DESC, gasto DESC;

GRANT SELECT ON vw_metrics_lab_lead_score TO authenticated;

COMMENT ON VIEW vw_metrics_lab_lead_score IS 'Score de potencial 0-100 por criativo. Combina CTR de link, taxa de resposta, taxa de conversao e eficiencia de CPL (25pts cada). Inclui metricas ARC de video (hook/hold/body rates).';

-- ================================================================
-- ROLLBACK
-- ================================================================
-- Para reverter esta migration, descomentar e executar o bloco abaixo:
--
-- BEGIN;
--
-- -- Remover view
-- DROP VIEW IF EXISTS vw_metrics_lab_lead_score;
--
-- -- Remover tabela conversion_events (e seus indices/policies)
-- DROP TABLE IF EXISTS conversion_events;
--
-- -- Remover generated columns de fb_ads_performance
-- ALTER TABLE fb_ads_performance
--   DROP COLUMN IF EXISTS hook_rate,
--   DROP COLUMN IF EXISTS hold_rate,
--   DROP COLUMN IF EXISTS body_rate;
--
-- -- Remover colunas base de video de fb_ads_performance
-- ALTER TABLE fb_ads_performance
--   DROP COLUMN IF EXISTS video_views_3s,
--   DROP COLUMN IF EXISTS video_p25,
--   DROP COLUMN IF EXISTS video_p75,
--   DROP COLUMN IF EXISTS video_p100,
--   DROP COLUMN IF EXISTS outbound_clicks,
--   DROP COLUMN IF EXISTS ctr_link,
--   DROP COLUMN IF EXISTS reach;
--
-- COMMIT;
-- ================================================================
