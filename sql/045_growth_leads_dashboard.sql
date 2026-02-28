-- 045_growth_leads_dashboard.sql
-- RPCs e indices para o dashboard Growth Leads

-- ============================================
-- RPC: Breakdown por pais
-- ============================================
CREATE OR REPLACE FUNCTION growth_leads_country_breakdown(p_location_id UUID DEFAULT NULL)
RETURNS TABLE (
  country TEXT,
  total BIGINT,
  with_email BIGINT,
  with_whatsapp BIGINT,
  with_instagram BIGINT,
  with_website BIGINT,
  enriched BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.country,
    COUNT(*)::BIGINT AS total,
    COUNT(g.email)::BIGINT AS with_email,
    COUNT(g.whatsapp)::BIGINT AS with_whatsapp,
    COUNT(g.instagram)::BIGINT AS with_instagram,
    COUNT(g.website)::BIGINT AS with_website,
    COUNT(CASE WHEN g.email IS NOT NULL OR g.whatsapp IS NOT NULL OR g.instagram IS NOT NULL THEN 1 END)::BIGINT AS enriched
  FROM growth_leads g
  WHERE (p_location_id IS NULL OR g.location_id = p_location_id)
  GROUP BY g.country
  ORDER BY COUNT(*) DESC;
$$;

-- ============================================
-- RPC: Top especialidades
-- ============================================
CREATE OR REPLACE FUNCTION growth_leads_top_specialties(
  p_location_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 15,
  p_country TEXT DEFAULT NULL
)
RETURNS TABLE (
  specialty TEXT,
  total BIGINT,
  with_email BIGINT,
  with_whatsapp BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.specialty,
    COUNT(*)::BIGINT AS total,
    COUNT(g.email)::BIGINT AS with_email,
    COUNT(g.whatsapp)::BIGINT AS with_whatsapp
  FROM growth_leads g
  WHERE g.specialty IS NOT NULL
    AND (p_location_id IS NULL OR g.location_id = p_location_id)
    AND (p_country IS NULL OR g.country = p_country)
  GROUP BY g.specialty
  ORDER BY COUNT(*) DESC
  LIMIT p_limit;
$$;

-- ============================================
-- Indices para performance (~109K rows)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_growth_leads_location_source
  ON growth_leads (location_id, source_channel);

CREATE INDEX IF NOT EXISTS idx_growth_leads_country
  ON growth_leads (country);

CREATE INDEX IF NOT EXISTS idx_growth_leads_email
  ON growth_leads (email) WHERE email IS NOT NULL;

-- ============================================
-- RLS: proteger dados pessoais (109K leads)
-- ============================================
ALTER TABLE growth_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_growth_leads"
  ON growth_leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_growth_leads"
  ON growth_leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_growth_leads"
  ON growth_leads FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- GRANT: restringir RPCs a authenticated
-- ============================================
REVOKE ALL ON FUNCTION growth_leads_country_breakdown FROM PUBLIC;
GRANT EXECUTE ON FUNCTION growth_leads_country_breakdown TO authenticated;

REVOKE ALL ON FUNCTION growth_leads_top_specialties FROM PUBLIC;
GRANT EXECUTE ON FUNCTION growth_leads_top_specialties TO authenticated;
