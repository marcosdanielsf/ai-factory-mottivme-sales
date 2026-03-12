-- ============================================================================
-- Migration 077: RPC para salvar inputs manuais de Health Score
-- ============================================================================

CREATE OR REPLACE FUNCTION save_health_manual_input(
  p_location_id TEXT,
  p_dimension TEXT,
  p_score NUMERIC,
  p_notes TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_dimension NOT IN ('satisfaction', 'payment') THEN
    RAISE EXCEPTION 'Dimension must be satisfaction or payment';
  END IF;

  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
  END IF;

  -- Validar que o usuario tem acesso ao location_id
  IF NOT EXISTS (
    SELECT 1 FROM user_locations
    WHERE user_id = COALESCE(p_user_id, auth.uid())
      AND (location_id = p_location_id OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'User does not have access to this location';
  END IF;

  INSERT INTO client_health_manual_inputs (
    location_id, dimension, score, notes, recorded_by
  ) VALUES (
    p_location_id, p_dimension, p_score, p_notes, COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
