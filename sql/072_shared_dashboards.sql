-- Migration 072: Shared Dashboards (Client-Facing)
-- Dashboard compartilhavel por link para clientes de trafego pago
-- Funil completo: Gasto → Impressoes → Cliques → Mensagens → Respondeu → Agendou → Compareceu → Fechou
-- PRD: ~/.claude/plans/client-facing-dashboard-prd.md

-- ============================================================
-- 1. Tabela shared_dashboards
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_dashboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    location_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_accessed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shared_dashboards_token ON shared_dashboards(token);
CREATE INDEX IF NOT EXISTS idx_shared_dashboards_location ON shared_dashboards(location_id);

ALTER TABLE shared_dashboards ENABLE ROW LEVEL SECURITY;

-- Authenticated (admin) pode tudo
DROP POLICY IF EXISTS "authenticated_all" ON shared_dashboards;
CREATE POLICY "authenticated_all" ON shared_dashboards
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Anon pode ler apenas pelo token (via RPC, nao direto)
DROP POLICY IF EXISTS "anon_no_direct_access" ON shared_dashboards;
CREATE POLICY "anon_no_direct_access" ON shared_dashboards
    FOR SELECT TO anon
    USING (false);

-- ============================================================
-- 2. RPC validate_share_token
-- Retorna location_id se token valido, NULL se invalido/expirado
-- Atualiza last_accessed_at como side effect
-- ============================================================
CREATE OR REPLACE FUNCTION validate_share_token(p_token TEXT)
RETURNS TABLE(location_id TEXT, config JSONB) AS $$
DECLARE
    v_id UUID;
    v_location_id TEXT;
    v_config JSONB;
BEGIN
    SELECT sd.id, sd.location_id, sd.config
    INTO v_id, v_location_id, v_config
    FROM shared_dashboards sd
    WHERE sd.token = p_token
      AND sd.is_active = true
      AND (sd.expires_at IS NULL OR sd.expires_at > now());

    IF v_id IS NOT NULL THEN
        UPDATE shared_dashboards SET last_accessed_at = now() WHERE id = v_id;
        RETURN QUERY SELECT v_location_id, v_config;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir anon chamar a funcao
GRANT EXECUTE ON FUNCTION validate_share_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_share_token(TEXT) TO authenticated;

-- ============================================================
-- 3. View vw_client_funnel_complete
-- Agrega funil completo por location_id + dia
-- Fonte: fb_ads_performance + n8n_schedule_tracking + appointments_log + ghl_opportunities
-- ============================================================
CREATE OR REPLACE VIEW vw_client_funnel_complete AS
WITH daily_ads AS (
    -- Agregar ads por location_id + dia (pode ter multiplos ads no mesmo dia)
    SELECT
        fb.location_id,
        fb.data_relatorio AS dia,
        SUM(fb.spend) AS gasto,
        SUM(fb.impressions) AS impressoes,
        SUM(fb.clicks) AS cliques,
        SUM(fb.conversas_iniciadas) AS mensagens_fb,
        SUM(fb.cpc * fb.clicks) / NULLIF(SUM(fb.clicks), 0) AS cpc_medio,
        SUM(fb.spend) / NULLIF(SUM(fb.impressions), 0) * 1000 AS cpm_medio
    FROM fb_ads_performance fb
    WHERE fb.location_id IS NOT NULL
    GROUP BY fb.location_id, fb.data_relatorio
),
daily_leads AS (
    -- Agregar leads por location_id + dia de criacao
    SELECT
        nst.location_id,
        DATE(nst.created_at) AS dia,
        COUNT(*) AS total_leads,
        COUNT(*) FILTER (WHERE nst.responded = true) AS responderam,
        COUNT(*) FILTER (
            WHERE nst.etapa_funil ILIKE '%agend%'
               OR nst.etapa_funil ILIKE '%booked%'
               OR nst.etapa_funil ILIKE '%comparec%'
               OR nst.etapa_funil ILIKE '%won%'
               OR nst.etapa_funil ILIKE '%fechou%'
               OR nst.etapa_funil ILIKE '%ganho%'
        ) AS agendaram,
        COUNT(*) FILTER (
            WHERE nst.etapa_funil ILIKE '%comparec%'
               OR nst.etapa_funil ILIKE '%won%'
               OR nst.etapa_funil ILIKE '%fechou%'
               OR nst.etapa_funil ILIKE '%ganho%'
        ) AS compareceram,
        COUNT(*) FILTER (
            WHERE nst.etapa_funil ILIKE '%won%'
               OR nst.etapa_funil ILIKE '%fechou%'
               OR nst.etapa_funil ILIKE '%ganho%'
        ) AS fecharam_etapa
    FROM n8n_schedule_tracking nst
    WHERE nst.location_id IS NOT NULL
    GROUP BY nst.location_id, DATE(nst.created_at)
),
daily_revenue AS (
    -- Receita de oportunidades ganhas por location_id + dia
    SELECT
        nst.location_id,
        DATE(nst.created_at) AS dia,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'won') AS oportunidades_ganhas,
        COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS receita
    FROM n8n_schedule_tracking nst
    INNER JOIN ghl_opportunities o ON o.contact_id = nst.unique_id
    WHERE nst.location_id IS NOT NULL
    GROUP BY nst.location_id, DATE(nst.created_at)
),
daily_appointments AS (
    -- Appointments reais (nao apenas etapa_funil)
    SELECT
        al.location_id,
        DATE(al.appointment_date) AS dia,
        COUNT(*) AS total_appointments,
        COUNT(*) FILTER (WHERE al.manual_status = 'completed' OR al.manual_status = 'showed') AS compareceram_real
    FROM appointments_log al
    WHERE al.location_id IS NOT NULL
    GROUP BY al.location_id, DATE(al.appointment_date)
)
SELECT
    COALESCE(a.location_id, l.location_id) AS location_id,
    COALESCE(a.dia, l.dia) AS dia,
    -- Ads
    COALESCE(a.gasto, 0) AS gasto,
    COALESCE(a.impressoes, 0) AS impressoes,
    COALESCE(a.cliques, 0) AS cliques,
    COALESCE(a.mensagens_fb, 0) AS mensagens,
    a.cpc_medio,
    a.cpm_medio,
    -- CTR
    CASE WHEN COALESCE(a.impressoes, 0) > 0
        THEN ROUND(COALESCE(a.cliques, 0)::NUMERIC / a.impressoes * 100, 2)
        ELSE 0
    END AS ctr,
    -- Tx conversao click → mensagem
    CASE WHEN COALESCE(a.cliques, 0) > 0
        THEN ROUND(COALESCE(a.mensagens_fb, 0)::NUMERIC / a.cliques * 100, 2)
        ELSE 0
    END AS tx_conversao_msg,
    -- Funil leads
    COALESCE(l.total_leads, 0) AS total_leads,
    COALESCE(l.responderam, 0) AS responderam,
    COALESCE(l.agendaram, 0) AS agendaram,
    -- Compareceram: preferir appointments_log (mais preciso) com fallback pra etapa_funil
    GREATEST(COALESCE(ap.compareceram_real, 0), COALESCE(l.compareceram, 0)) AS compareceram,
    COALESCE(l.fecharam_etapa, 0) + COALESCE(r.oportunidades_ganhas, 0)
        - LEAST(COALESCE(l.fecharam_etapa, 0), COALESCE(r.oportunidades_ganhas, 0)) AS fecharam,
    -- Revenue
    COALESCE(r.receita, 0) AS receita,
    -- Metricas calculadas
    CASE WHEN COALESCE(l.total_leads, 0) > 0
        THEN ROUND(COALESCE(a.gasto, 0) / l.total_leads, 2)
        ELSE NULL
    END AS cpl,
    CASE WHEN COALESCE(l.agendaram, 0) > 0
        THEN ROUND(COALESCE(a.gasto, 0) / l.agendaram, 2)
        ELSE NULL
    END AS cpa,
    CASE WHEN COALESCE(a.gasto, 0) > 0 AND COALESCE(r.receita, 0) > 0
        THEN ROUND(r.receita / a.gasto, 2)
        ELSE 0
    END AS roas
FROM daily_ads a
FULL OUTER JOIN daily_leads l ON a.location_id = l.location_id AND a.dia = l.dia
LEFT JOIN daily_revenue r ON COALESCE(a.location_id, l.location_id) = r.location_id
    AND COALESCE(a.dia, l.dia) = r.dia
LEFT JOIN daily_appointments ap ON COALESCE(a.location_id, l.location_id) = ap.location_id
    AND COALESCE(a.dia, l.dia) = ap.dia;

-- Grant acesso
GRANT SELECT ON vw_client_funnel_complete TO authenticated;
GRANT SELECT ON vw_client_funnel_complete TO anon;

-- ============================================================
-- 4. RPC get_client_funnel (para dashboard compartilhado)
-- Recebe token + date range, retorna dados agregados + diarios
-- ============================================================
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
    -- Validar token
    SELECT sd.location_id INTO v_location_id
    FROM shared_dashboards sd
    WHERE sd.token = p_token
      AND sd.is_active = true
      AND (sd.expires_at IS NULL OR sd.expires_at > now());

    IF v_location_id IS NULL THEN
        RETURN;
    END IF;

    -- Atualizar ultimo acesso
    UPDATE shared_dashboards SET last_accessed_at = now()
    WHERE token = p_token;

    -- Retornar dados filtrados
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
    FROM vw_client_funnel_complete f
    WHERE f.location_id = v_location_id
      AND f.dia BETWEEN p_date_from AND p_date_to
    ORDER BY f.dia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_client_funnel(TEXT, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_client_funnel(TEXT, DATE, DATE) TO authenticated;

-- ============================================================
-- 5. RPC get_client_ads_breakdown (performance por anuncio)
-- ============================================================
CREATE OR REPLACE FUNCTION get_client_ads_breakdown(
    p_token TEXT,
    p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
    p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    ad_id TEXT,
    criativo TEXT,
    campanha TEXT,
    conjunto TEXT,
    gasto NUMERIC,
    impressoes BIGINT,
    cliques BIGINT,
    leads_gerados BIGINT,
    leads_responderam BIGINT,
    leads_agendaram BIGINT,
    leads_fecharam BIGINT,
    receita NUMERIC,
    cpl NUMERIC,
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

    RETURN QUERY
    SELECT
        v.ad_id,
        v.criativo,
        v.campanha,
        v.conjunto,
        SUM(v.gasto) AS gasto,
        SUM(v.impressions)::BIGINT AS impressoes,
        SUM(v.clicks)::BIGINT AS cliques,
        SUM(v.leads_gerados)::BIGINT AS leads_gerados,
        SUM(v.leads_responderam)::BIGINT AS leads_responderam,
        SUM(v.leads_agendaram)::BIGINT AS leads_agendaram,
        SUM(v.leads_fecharam)::BIGINT AS leads_fecharam,
        SUM(v.receita_total) AS receita,
        CASE WHEN SUM(v.leads_gerados) > 0
            THEN ROUND(SUM(v.gasto) / SUM(v.leads_gerados), 2)
            ELSE NULL
        END AS cpl,
        CASE WHEN SUM(v.gasto) > 0 AND SUM(v.receita_total) > 0
            THEN ROUND(SUM(v.receita_total) / SUM(v.gasto), 2)
            ELSE 0
        END AS roas
    FROM vw_ads_with_leads v
    WHERE v.location_id = v_location_id
      AND v.data_relatorio BETWEEN p_date_from AND p_date_to
    GROUP BY v.ad_id, v.criativo, v.campanha, v.conjunto
    ORDER BY SUM(v.gasto) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_client_ads_breakdown(TEXT, DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_client_ads_breakdown(TEXT, DATE, DATE) TO authenticated;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP FUNCTION IF EXISTS get_client_ads_breakdown(TEXT, DATE, DATE);
-- DROP FUNCTION IF EXISTS get_client_funnel(TEXT, DATE, DATE);
-- DROP FUNCTION IF EXISTS validate_share_token(TEXT);
-- DROP VIEW IF EXISTS vw_client_funnel_complete;
-- DROP TABLE IF EXISTS shared_dashboards;
