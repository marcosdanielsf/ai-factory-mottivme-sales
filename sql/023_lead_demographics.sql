-- =====================================================
-- 023: Lead Demographics - State & Work Permit Analytics
-- =====================================================
-- Adiciona views e funcoes para analisar distribuicao
-- de leads por estado e status de work permit
-- =====================================================

-- 1. View de distribuicao por Work Permit
CREATE OR REPLACE VIEW vw_work_permit_distribution AS
SELECT
  location_id,
  CASE
    WHEN LOWER(TRIM(work_permit)) IN ('sim', 'yes', 'true', '1') THEN 'Sim'
    WHEN LOWER(TRIM(work_permit)) IN ('nao', 'não', 'no', 'false', '0') THEN 'Não'
    WHEN work_permit IS NULL OR TRIM(work_permit) = '' OR TRIM(work_permit) = 'NULL' THEN 'Não informado'
    ELSE 'Outro'
  END AS work_permit_status,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE ativo = true) AS ativos
FROM n8n_schedule_tracking
GROUP BY location_id,
  CASE
    WHEN LOWER(TRIM(work_permit)) IN ('sim', 'yes', 'true', '1') THEN 'Sim'
    WHEN LOWER(TRIM(work_permit)) IN ('nao', 'não', 'no', 'false', '0') THEN 'Não'
    WHEN work_permit IS NULL OR TRIM(work_permit) = '' OR TRIM(work_permit) = 'NULL' THEN 'Não informado'
    ELSE 'Outro'
  END;

-- 2. View de distribuicao por Estado
CREATE OR REPLACE VIEW vw_state_distribution AS
SELECT
  location_id,
  CASE
    WHEN state IS NULL OR TRIM(state) = '' OR TRIM(state) = 'NULL' THEN 'Não informado'
    ELSE INITCAP(TRIM(state))
  END AS state_name,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE ativo = true) AS ativos
FROM n8n_schedule_tracking
GROUP BY location_id,
  CASE
    WHEN state IS NULL OR TRIM(state) = '' OR TRIM(state) = 'NULL' THEN 'Não informado'
    ELSE INITCAP(TRIM(state))
  END;

-- 3. Funcao RPC para buscar demograficos com filtro de location
CREATE OR REPLACE FUNCTION get_lead_demographics(
  p_location_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work_permit JSONB;
  v_states JSONB;
BEGIN
  -- Work Permit Distribution
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'status', work_permit_status,
      'total', total,
      'ativos', ativos
    ) ORDER BY total DESC
  ), '[]'::jsonb)
  INTO v_work_permit
  FROM vw_work_permit_distribution
  WHERE (p_location_id IS NULL OR location_id = p_location_id);

  -- State Distribution (top 10)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'state', state_name,
      'total', total,
      'ativos', ativos
    ) ORDER BY total DESC
  ), '[]'::jsonb)
  INTO v_states
  FROM (
    SELECT state_name, SUM(total) as total, SUM(ativos) as ativos
    FROM vw_state_distribution
    WHERE (p_location_id IS NULL OR location_id = p_location_id)
    GROUP BY state_name
    ORDER BY SUM(total) DESC
    LIMIT 10
  ) top_states;

  RETURN jsonb_build_object(
    'work_permit', v_work_permit,
    'states', v_states,
    'updated_at', NOW()
  );
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_lead_demographics TO anon, authenticated;

COMMENT ON VIEW vw_work_permit_distribution IS 'Distribuicao de leads por status de Work Permit';
COMMENT ON VIEW vw_state_distribution IS 'Distribuicao de leads por Estado';
COMMENT ON FUNCTION get_lead_demographics IS 'Retorna dados demograficos dos leads (work permit e estado)';
