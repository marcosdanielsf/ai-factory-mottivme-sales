-- 045_growth_leads_dashboard.sql
-- RPCs e indices para o dashboard Growth Leads

-- ============================================
-- RPC: Breakdown por pais
-- Correcao 2026-02-28: location_id e TEXT (nao UUID),
-- instagram_username (nao instagram), linkedin_url (nao website)
-- ============================================
CREATE OR REPLACE FUNCTION growth_leads_country_breakdown(p_location_id TEXT DEFAULT NULL)
RETURNS TABLE (
  country TEXT,
  total BIGINT,
  with_email BIGINT,
  with_whatsapp BIGINT,
  with_instagram BIGINT,
  with_linkedin BIGINT,
  enriched BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.country,
    COUNT(*)::BIGINT AS total,
    COUNT(g.email)::BIGINT AS with_email,
    COUNT(g.whatsapp)::BIGINT AS with_whatsapp,
    COUNT(g.instagram_username)::BIGINT AS with_instagram,
    COUNT(g.linkedin_url)::BIGINT AS with_linkedin,
    COUNT(CASE WHEN g.email IS NOT NULL OR g.whatsapp IS NOT NULL OR g.instagram_username IS NOT NULL THEN 1 END)::BIGINT AS enriched
  FROM growth_leads g
  WHERE (p_location_id IS NULL OR g.location_id = p_location_id)
  GROUP BY g.country
  ORDER BY COUNT(*) DESC;
$$;

-- ============================================
-- RPC: Top especialidades
-- Correcao 2026-02-28: location_id e TEXT, specialty nao existe —
-- usando coluna title (cargo/especialidade) com alias specialty
-- ============================================
CREATE OR REPLACE FUNCTION growth_leads_top_specialties(
  p_location_id TEXT DEFAULT NULL,
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
    g.title AS specialty,
    COUNT(*)::BIGINT AS total,
    COUNT(g.email)::BIGINT AS with_email,
    COUNT(g.whatsapp)::BIGINT AS with_whatsapp
  FROM growth_leads g
  WHERE g.title IS NOT NULL
    AND (p_location_id IS NULL OR g.location_id = p_location_id)
    AND (p_country IS NULL OR g.country = p_country)
  GROUP BY g.title
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

-- DROP IF EXISTS para idempotencia (reexecutavel sem erro)
DROP POLICY IF EXISTS "authenticated_read_growth_leads" ON growth_leads;
DROP POLICY IF EXISTS "authenticated_insert_growth_leads" ON growth_leads;
DROP POLICY IF EXISTS "authenticated_update_growth_leads" ON growth_leads;

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
