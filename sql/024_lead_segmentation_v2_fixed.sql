-- =====================================================
-- 024: Lead Segmentation v2 - From app_dash_principal
-- =====================================================
-- FIXED VERSION: Uses only valid enum values (won, lost)
-- Views para segmentação de leads por:
-- - Estado normalizado (Florida/FL/Flórida → Florida)
-- - Work Permit (Possui/Não possui)
-- - Status no funil (won/lost)
-- =====================================================

-- 1. Função para normalizar nomes de estados
CREATE OR REPLACE FUNCTION normalize_us_state(raw_state TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF raw_state IS NULL OR TRIM(raw_state) = '' OR LOWER(TRIM(raw_state)) = 'null' THEN
    RETURN 'Não informado';
  END IF;

  -- Normalizar para maiúscula e trim
  raw_state := UPPER(TRIM(raw_state));

  RETURN CASE raw_state
    -- Florida variations
    WHEN 'FL' THEN 'Florida'
    WHEN 'FLORIDA' THEN 'Florida'
    WHEN 'FLÓRIDA' THEN 'Florida'
    WHEN 'FLA' THEN 'Florida'

    -- Massachusetts variations
    WHEN 'MA' THEN 'Massachusetts'
    WHEN 'MASSACHUSETTS' THEN 'Massachusetts'
    WHEN 'MASS' THEN 'Massachusetts'

    -- New Jersey variations
    WHEN 'NJ' THEN 'New Jersey'
    WHEN 'NEW JERSEY' THEN 'New Jersey'
    WHEN 'NEWJERSEY' THEN 'New Jersey'

    -- New York variations
    WHEN 'NY' THEN 'New York'
    WHEN 'NEW YORK' THEN 'New York'
    WHEN 'NEWYORK' THEN 'New York'

    -- California variations
    WHEN 'CA' THEN 'California'
    WHEN 'CALIFORNIA' THEN 'California'
    WHEN 'CALIF' THEN 'California'

    -- Texas variations
    WHEN 'TX' THEN 'Texas'
    WHEN 'TEXAS' THEN 'Texas'

    -- Connecticut variations
    WHEN 'CT' THEN 'Connecticut'
    WHEN 'CONNECTICUT' THEN 'Connecticut'

    -- Georgia variations
    WHEN 'GA' THEN 'Georgia'
    WHEN 'GEORGIA' THEN 'Georgia'

    -- Utah variations
    WHEN 'UT' THEN 'Utah'
    WHEN 'UTAH' THEN 'Utah'

    -- Carolina do Sul
    WHEN 'SC' THEN 'South Carolina'
    WHEN 'SOUTH CAROLINA' THEN 'South Carolina'
    WHEN 'CAROLINA DO SUL' THEN 'South Carolina'

    -- Nevada
    WHEN 'NV' THEN 'Nevada'
    WHEN 'NEVADA' THEN 'Nevada'

    -- Other states - capitalize properly
    ELSE INITCAP(LOWER(raw_state))
  END;
END;
$$;

-- 2. Função para normalizar work permit
CREATE OR REPLACE FUNCTION normalize_work_permit(raw_permit TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF raw_permit IS NULL OR TRIM(raw_permit) = '' OR LOWER(TRIM(raw_permit)) = 'null' THEN
    RETURN 'Não informado';
  END IF;

  raw_permit := LOWER(TRIM(raw_permit));

  RETURN CASE
    WHEN raw_permit LIKE '%possui%' AND raw_permit NOT LIKE '%não%' THEN 'Com Work Permit'
    WHEN raw_permit LIKE '%não%' OR raw_permit LIKE '%nao%' THEN 'Sem Work Permit'
    WHEN raw_permit IN ('sim', 'yes', 'true', '1') THEN 'Com Work Permit'
    WHEN raw_permit IN ('não', 'nao', 'no', 'false', '0') THEN 'Sem Work Permit'
    ELSE 'Não informado'
  END;
END;
$$;

-- 3. View principal de segmentação de leads
-- FIXED: Only uses valid enum values (won, lost)
CREATE OR REPLACE VIEW vw_lead_segmentation AS
SELECT
  id,
  location_id,
  contato_principal AS nome,
  celular_contato AS telefone,
  email_comercial_contato AS email,
  normalize_us_state(estado_onde_mora_contato) AS estado,
  normalize_work_permit(permissao_de_trabalho) AS work_permit,
  profissao_contato AS profissao,
  fonte_do_lead_bposs AS fonte,
  status,
  funil,
  tag,
  lead_usuario_responsavel AS responsavel,
  data_criada,
  data_da_atualizacao,
  scheduled_at AS agendamento_data,
  -- Classificação de status para funil (ONLY won/lost exist)
  CASE
    WHEN status::text = 'won' THEN 'Fechado'
    WHEN status::text = 'lost' THEN 'Perdido'
    ELSE 'Em Andamento'
  END AS etapa_funil
FROM app_dash_principal;

-- 4. View agregada por Estado
-- FIXED: Only uses valid enum values (won, lost)
CREATE OR REPLACE VIEW vw_leads_por_estado AS
SELECT
  location_id,
  estado,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE status::text = 'won') AS convertidos,
  COUNT(*) FILTER (WHERE status::text = 'lost') AS perdidos,
  -- Taxa de conversão = won / total
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status::text = 'won') /
    NULLIF(COUNT(*), 0), 1
  ) AS taxa_conversao
FROM vw_lead_segmentation
GROUP BY location_id, estado
ORDER BY total_leads DESC;

-- 5. View agregada por Work Permit
-- FIXED: Only uses valid enum values (won, lost)
CREATE OR REPLACE VIEW vw_leads_por_work_permit AS
SELECT
  location_id,
  work_permit,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE status::text = 'won') AS convertidos,
  COUNT(*) FILTER (WHERE status::text = 'lost') AS perdidos,
  -- Taxa de conversão = won / total
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status::text = 'won') /
    NULLIF(COUNT(*), 0), 1
  ) AS taxa_conversao
FROM vw_lead_segmentation
GROUP BY location_id, work_permit
ORDER BY total_leads DESC;

-- 6. View combinada Estado x Work Permit
-- FIXED: Only uses valid enum values (won, lost)
CREATE OR REPLACE VIEW vw_leads_estado_work_permit AS
SELECT
  location_id,
  estado,
  work_permit,
  COUNT(*) AS total_leads,
  COUNT(*) FILTER (WHERE status::text = 'won') AS convertidos,
  COUNT(*) FILTER (WHERE status::text = 'lost') AS perdidos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status::text = 'won') /
    NULLIF(COUNT(*), 0), 1
  ) AS taxa_conversao
FROM vw_lead_segmentation
WHERE estado != 'Não informado'
GROUP BY location_id, estado, work_permit
HAVING COUNT(*) >= 3  -- Mínimo de 3 leads para aparecer
ORDER BY total_leads DESC;

-- 7. Função RPC para buscar segmentação completa
-- FIXED: Only uses valid enum values (won, lost)
CREATE OR REPLACE FUNCTION get_lead_segmentation(
  p_location_id TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_estados JSONB;
  v_work_permit JSONB;
  v_totals JSONB;
BEGIN
  -- Totais gerais
  SELECT jsonb_build_object(
    'total_leads', COUNT(*),
    'com_estado', COUNT(*) FILTER (WHERE estado != 'Não informado'),
    'com_work_permit', COUNT(*) FILTER (WHERE work_permit != 'Não informado'),
    'convertidos', COUNT(*) FILTER (WHERE status::text = 'won'),
    'perdidos', COUNT(*) FILTER (WHERE status::text = 'lost')
  )
  INTO v_totals
  FROM vw_lead_segmentation
  WHERE (p_location_id IS NULL OR location_id = p_location_id)
    AND (p_start_date IS NULL OR data_criada >= p_start_date)
    AND (p_end_date IS NULL OR data_criada <= p_end_date);

  -- Top 10 Estados
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_estados
  FROM (
    SELECT
      estado,
      SUM(total_leads)::int AS total_leads,
      SUM(convertidos)::int AS convertidos,
      SUM(perdidos)::int AS perdidos,
      ROUND(AVG(taxa_conversao), 1) AS taxa_conversao
    FROM vw_leads_por_estado
    WHERE (p_location_id IS NULL OR location_id = p_location_id)
      AND estado != 'Não informado'
    GROUP BY estado
    ORDER BY SUM(total_leads) DESC
    LIMIT 10
  ) t;

  -- Work Permit
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_work_permit
  FROM (
    SELECT
      work_permit,
      SUM(total_leads)::int AS total_leads,
      SUM(convertidos)::int AS convertidos,
      SUM(perdidos)::int AS perdidos,
      ROUND(AVG(taxa_conversao), 1) AS taxa_conversao
    FROM vw_leads_por_work_permit
    WHERE (p_location_id IS NULL OR location_id = p_location_id)
    GROUP BY work_permit
    ORDER BY SUM(total_leads) DESC
  ) t;

  RETURN jsonb_build_object(
    'totals', v_totals,
    'estados', v_estados,
    'work_permit', v_work_permit,
    'updated_at', NOW()
  );
END;
$$;

-- 8. Permissions
GRANT SELECT ON vw_lead_segmentation TO anon, authenticated;
GRANT SELECT ON vw_leads_por_estado TO anon, authenticated;
GRANT SELECT ON vw_leads_por_work_permit TO anon, authenticated;
GRANT SELECT ON vw_leads_estado_work_permit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION normalize_us_state TO anon, authenticated;
GRANT EXECUTE ON FUNCTION normalize_work_permit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_lead_segmentation TO anon, authenticated;

-- Comments
COMMENT ON VIEW vw_lead_segmentation IS 'Dados de leads com estado e work permit normalizados';
COMMENT ON VIEW vw_leads_por_estado IS 'Agregação de leads por estado (won/lost)';
COMMENT ON VIEW vw_leads_por_work_permit IS 'Agregação de leads por work permit (won/lost)';
COMMENT ON FUNCTION get_lead_segmentation IS 'Retorna segmentação completa de leads';
