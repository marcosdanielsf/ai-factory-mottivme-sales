-- =====================================================
-- 022: Creative Attribution - Rastreamento de Criativos
-- =====================================================
-- Permite rastrear qual criativo do Meta Ads gerou cada lead,
-- agendamento e fechamento para otimizacao de campanhas.
-- TABELA CORRETA: n8n_schedule_tracking (fonte dos dados do SalesOps)
-- =====================================================

-- 1. Adicionar colunas de atribuicao em n8n_schedule_tracking
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS utm_content TEXT; -- Nome do criativo
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS ad_id TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS adset_id TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE n8n_schedule_tracking ADD COLUMN IF NOT EXISTS session_source TEXT; -- "Paid Social", "Organic", etc

-- Index para queries de atribuicao
CREATE INDEX IF NOT EXISTS idx_schedule_utm_content ON n8n_schedule_tracking(utm_content);
CREATE INDEX IF NOT EXISTS idx_schedule_utm_campaign ON n8n_schedule_tracking(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_schedule_ad_id ON n8n_schedule_tracking(ad_id);
CREATE INDEX IF NOT EXISTS idx_schedule_session_source ON n8n_schedule_tracking(session_source);

-- 2. Tabela auxiliar de criativos (para enriquecer dados do Meta)
CREATE TABLE IF NOT EXISTS meta_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id TEXT UNIQUE NOT NULL,
  ad_name TEXT, -- Nome amigavel do criativo
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,
  creative_type TEXT, -- 'video', 'image', 'carousel'
  creative_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_creatives_campaign ON meta_creatives(campaign_id);

-- 3. View de performance por criativo (baseada em n8n_schedule_tracking)
CREATE OR REPLACE VIEW vw_creative_performance AS
SELECT
  COALESCE(nst.utm_content, nst.utm_campaign, 'Desconhecido') AS creative_name,
  nst.utm_campaign AS campaign_name,
  nst.ad_id,
  nst.session_source,
  nst.location_id,

  -- Metricas de funil
  COUNT(DISTINCT nst.id) AS total_leads,
  COUNT(DISTINCT CASE WHEN nst.responded = true THEN nst.id END) AS leads_responderam,
  COUNT(DISTINCT CASE WHEN nst.status IN ('agendado', 'confirmado', 'compareceu', 'fechado') THEN nst.id END) AS leads_agendaram,
  COUNT(DISTINCT CASE WHEN nst.status IN ('compareceu', 'fechado') THEN nst.id END) AS leads_compareceram,
  COUNT(DISTINCT CASE WHEN nst.status = 'fechado' THEN nst.id END) AS leads_fecharam,

  -- Taxas de conversao
  ROUND(
    COUNT(DISTINCT CASE WHEN nst.responded = true THEN nst.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT nst.id), 0) * 100, 1
  ) AS taxa_resposta,

  ROUND(
    COUNT(DISTINCT CASE WHEN nst.status IN ('agendado', 'confirmado', 'compareceu', 'fechado') THEN nst.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT nst.id), 0) * 100, 1
  ) AS taxa_agendamento,

  ROUND(
    COUNT(DISTINCT CASE WHEN nst.status IN ('compareceu', 'fechado') THEN nst.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN nst.status IN ('agendado', 'confirmado', 'compareceu', 'fechado') THEN nst.id END), 0) * 100, 1
  ) AS taxa_comparecimento,

  ROUND(
    COUNT(DISTINCT CASE WHEN nst.status = 'fechado' THEN nst.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT CASE WHEN nst.status IN ('compareceu', 'fechado') THEN nst.id END), 0) * 100, 1
  ) AS taxa_fechamento,

  -- Periodo
  MIN(nst.created_at) AS primeiro_lead,
  MAX(nst.created_at) AS ultimo_lead

FROM n8n_schedule_tracking nst
WHERE nst.utm_source IS NOT NULL
   OR nst.session_source IS NOT NULL
   OR nst.ad_id IS NOT NULL
GROUP BY
  COALESCE(nst.utm_content, nst.utm_campaign, 'Desconhecido'),
  nst.utm_campaign,
  nst.ad_id,
  nst.session_source,
  nst.location_id;

-- 4. View simplificada para dashboard (top criativos)
CREATE OR REPLACE VIEW vw_top_creatives AS
SELECT
  creative_name,
  campaign_name,
  location_id,
  total_leads,
  leads_agendaram,
  leads_fecharam,
  taxa_resposta,
  taxa_agendamento,
  taxa_comparecimento,
  taxa_fechamento,
  -- Score composto (prioriza conversao sobre volume)
  ROUND(
    (COALESCE(taxa_agendamento, 0) * 0.3) +
    (COALESCE(taxa_comparecimento, 0) * 0.3) +
    (COALESCE(taxa_fechamento, 0) * 0.4),
    1
  ) AS performance_score
FROM vw_creative_performance
WHERE total_leads >= 5 -- Minimo de leads para ser significativo
ORDER BY performance_score DESC, total_leads DESC;

-- 5. Funcao para atualizar atribuicao de lead existente
CREATE OR REPLACE FUNCTION update_schedule_attribution(
  p_contact_id TEXT,
  p_location_id TEXT,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_utm_content TEXT DEFAULT NULL,
  p_ad_id TEXT DEFAULT NULL,
  p_adset_id TEXT DEFAULT NULL,
  p_campaign_id TEXT DEFAULT NULL,
  p_session_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INT;
BEGIN
  UPDATE n8n_schedule_tracking
  SET
    utm_source = COALESCE(p_utm_source, utm_source),
    utm_medium = COALESCE(p_utm_medium, utm_medium),
    utm_campaign = COALESCE(p_utm_campaign, utm_campaign),
    utm_content = COALESCE(p_utm_content, utm_content),
    ad_id = COALESCE(p_ad_id, ad_id),
    adset_id = COALESCE(p_adset_id, adset_id),
    campaign_id = COALESCE(p_campaign_id, campaign_id),
    session_source = COALESCE(p_session_source, session_source),
    updated_at = NOW()
  WHERE contact_id = p_contact_id
    AND location_id = p_location_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', v_updated_count > 0,
    'updated_count', v_updated_count
  );
END;
$$;

COMMENT ON VIEW vw_creative_performance IS 'Performance de cada criativo do Meta Ads com metricas de funil completo';
COMMENT ON VIEW vw_top_creatives IS 'Top criativos ordenados por performance (conversao > volume)';
