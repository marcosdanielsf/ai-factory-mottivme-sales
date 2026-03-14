-- Migration 079: Alinhar get_client_funnel com vw_unified_funnel
-- Fase 3 do PRD Semantic Layer Unification
-- Antes: lia de vw_client_funnel_complete
-- Depois: le de vw_unified_funnel (fonte unica de verdade)
-- Validado: Dr. Luiz (sNwLyynZWP6jEtBy1ubf) — numeros identicos entre
--   get_client_funnel (ShareDashboard) e get_unified_summary (Central Tower)

CREATE OR REPLACE FUNCTION get_client_funnel(
    p_token TEXT,
    p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
    p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    dia DATE,
    gasto NUMERIC,
    impressoes BIGINT,
    cliques BIGINT,
    mensagens BIGINT,
    ctr NUMERIC,
    tx_conversao_msg NUMERIC,
    total_leads BIGINT,
    responderam BIGINT,
    agendaram BIGINT,
    compareceram BIGINT,
    fecharam BIGINT,
    receita NUMERIC,
    cpl NUMERIC,
    cpa NUMERIC,
    roas NUMERIC
) AS $$
DECLARE
    v_location_id TEXT;
BEGIN
    SELECT sd.location_id INTO v_location_id
    FROM shared_dashboards sd
    WHERE sd.token = p_token
      AND sd.is_active = true
      AND (sd.expires_at IS NULL OR sd.expires_at > now());

    IF v_location_id IS NULL THEN
        RETURN;
    END IF;

    UPDATE shared_dashboards SET last_accessed_at = now()
    WHERE token = p_token;

    RETURN QUERY
    SELECT
        f.dia,
        f.gasto,
        f.impressoes,
        f.cliques,
        f.mensagens,
        f.ctr,
        f.tx_conversao_msg,
        f.total_leads,
        f.responderam,
        f.agendaram,
        f.compareceram,
        f.fecharam,
        f.receita,
        f.cpl,
        f.cpa,
        f.roas
    FROM vw_unified_funnel f
    WHERE f.location_id = v_location_id
      AND f.dia BETWEEN p_date_from AND p_date_to
    ORDER BY f.dia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_client_funnel(TEXT, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_client_funnel(TEXT, DATE, DATE) TO authenticated;

-- ROLLBACK:
-- Restaurar para vw_client_funnel_complete (ver sql/072_shared_dashboards.sql)
