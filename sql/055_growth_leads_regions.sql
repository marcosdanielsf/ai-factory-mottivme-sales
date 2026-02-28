-- 055: Growth Leads - RPC regions + indices
-- Objetivo: Suportar filtro por região e date range no dashboard Growth Leads

-- RPC para listar regiões distintas
CREATE OR REPLACE FUNCTION growth_leads_regions()
RETURNS TABLE(region TEXT) LANGUAGE sql STABLE AS $$
  SELECT DISTINCT gl.region FROM growth_leads gl
  WHERE gl.region IS NOT NULL ORDER BY gl.region;
$$;

GRANT EXECUTE ON FUNCTION growth_leads_regions() TO authenticated;

-- Indices para performance nos filtros
CREATE INDEX IF NOT EXISTS idx_growth_leads_created_at ON growth_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_growth_leads_region ON growth_leads(region);
