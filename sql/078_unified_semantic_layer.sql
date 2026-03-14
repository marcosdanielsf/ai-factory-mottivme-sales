-- Migration 078: Unified Semantic Layer
-- Fonte unica de verdade para TODOS os dashboards do AI Factory
-- Evolui vw_client_funnel_complete em vw_unified_funnel (canonica)
-- PRD: ~/.claude/plans/semantic-layer-unification-prd.md

-- ============================================================
-- 1. Indices de performance (idempotentes)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_nst_location_created
    ON n8n_schedule_tracking(location_id, created_at);

CREATE INDEX IF NOT EXISTS idx_fbads_location_data
    ON fb_ads_performance(location_id, data_relatorio);

CREATE INDEX IF NOT EXISTS idx_appointments_location_date
    ON appointments_log(location_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_ghl_opps_contact_status
    ON ghl_opportunities(contact_id, status);

CREATE INDEX IF NOT EXISTS idx_nst_location_etapa
    ON n8n_schedule_tracking(location_id, etapa_funil);

-- ============================================================
-- 2. View canonica vw_unified_funnel
-- Granularidade: location_id + dia
-- Cruza: n8n_schedule_tracking + fb_ads_performance +
--         appointments_log + ghl_opportunities
-- ============================================================
CREATE OR REPLACE VIEW vw_unified_funnel AS
WITH daily_ads AS (
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
    SELECT
        nst.location_id,
        DATE(nst.created_at) AS dia,
        COUNT(*) AS total_leads,
        COUNT(*) FILTER (WHERE nst.responded = true
            OR nst.etapa_funil IN ('Respondeu', 'Agendou', 'Compareceu', 'Ganho')
        ) AS responderam,
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
daily_appointments AS (
    SELECT
        al.location_id,
        DATE(al.appointment_date) AS dia,
        COUNT(*) AS total_appointments,
        COUNT(*) FILTER (WHERE al.manual_status IN ('completed', 'showed')) AS compareceram_real
    FROM appointments_log al
    WHERE al.location_id IS NOT NULL
    GROUP BY al.location_id, DATE(al.appointment_date)
),
daily_revenue AS (
    SELECT
        nst.location_id,
        DATE(nst.created_at) AS dia,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'won') AS oportunidades_ganhas,
        COALESCE(SUM(o.monetary_value) FILTER (WHERE o.status = 'won'), 0) AS receita
    FROM n8n_schedule_tracking nst
    INNER JOIN ghl_opportunities o ON o.contact_id = nst.unique_id
    WHERE nst.location_id IS NOT NULL
    GROUP BY nst.location_id, DATE(nst.created_at)
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
    -- Tx conversao click -> mensagem
    CASE WHEN COALESCE(a.cliques, 0) > 0
        THEN ROUND(COALESCE(a.mensagens_fb, 0)::NUMERIC / a.cliques * 100, 2)
        ELSE 0
    END AS tx_conversao_msg,
    -- Funil leads (GREATEST: usa mensagens_fb do Meta como fallback)
    GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0)) AS total_leads,
    COALESCE(l.responderam, 0) AS responderam,
    -- Agendaram: GREATEST entre appointments_log e etapa_funil
    GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)) AS agendaram,
    -- Compareceram: preferir appointments_log (mais preciso) com fallback pra etapa_funil
    GREATEST(COALESCE(ap.compareceram_real, 0), COALESCE(l.compareceram, 0)) AS compareceram,
    -- Fecharam: dedup entre etapa_funil e ghl_opportunities com LEAST
    COALESCE(l.fecharam_etapa, 0) + COALESCE(r.oportunidades_ganhas, 0)
        - LEAST(COALESCE(l.fecharam_etapa, 0), COALESCE(r.oportunidades_ganhas, 0)) AS fecharam,
    -- Revenue
    COALESCE(r.receita, 0) AS receita,
    -- Metricas calculadas
    CASE WHEN GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0)) > 0
        THEN ROUND(COALESCE(a.gasto, 0) / GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0)), 2)
        ELSE NULL
    END AS cpl,
    CASE WHEN GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)) > 0
        THEN ROUND(COALESCE(a.gasto, 0) / GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)), 2)
        ELSE NULL
    END AS cpa,
    CASE WHEN COALESCE(a.gasto, 0) > 0 AND COALESCE(r.receita, 0) > 0
        THEN ROUND(r.receita / a.gasto, 2)
        ELSE 0
    END AS roas
FROM daily_ads a
FULL OUTER JOIN daily_leads l ON a.location_id = l.location_id AND a.dia = l.dia
LEFT JOIN daily_appointments ap ON COALESCE(a.location_id, l.location_id) = ap.location_id
    AND COALESCE(a.dia, l.dia) = ap.dia
LEFT JOIN daily_revenue r ON COALESCE(a.location_id, l.location_id) = r.location_id
    AND COALESCE(a.dia, l.dia) = r.dia;

-- Grant acesso
GRANT SELECT ON vw_unified_funnel TO authenticated;
GRANT SELECT ON vw_unified_funnel TO anon;

-- ============================================================
-- 3. View agregada vw_unified_summary
-- Agrega vw_unified_funnel por location_id (sem granularidade dia)
-- ============================================================
CREATE OR REPLACE VIEW vw_unified_summary AS
SELECT
    f.location_id,
    COUNT(DISTINCT f.dia) AS dias_com_dados,
    MIN(f.dia) AS primeiro_dia,
    MAX(f.dia) AS ultimo_dia,
    -- Ads totais
    SUM(f.gasto) AS gasto_total,
    SUM(f.impressoes) AS impressoes_total,
    SUM(f.cliques) AS cliques_total,
    SUM(f.mensagens) AS mensagens_total,
    -- Funil totais
    SUM(f.total_leads) AS total_leads,
    SUM(f.responderam) AS responderam,
    SUM(f.agendaram) AS agendaram,
    SUM(f.compareceram) AS compareceram,
    SUM(f.fecharam) AS fecharam,
    SUM(f.receita) AS receita_total,
    -- Taxas de conversao do funil
    CASE WHEN SUM(f.total_leads) > 0
        THEN ROUND(SUM(f.responderam)::NUMERIC / SUM(f.total_leads) * 100, 1)
        ELSE 0
    END AS tx_resposta,
    CASE WHEN SUM(f.total_leads) > 0
        THEN ROUND(SUM(f.agendaram)::NUMERIC / SUM(f.total_leads) * 100, 1)
        ELSE 0
    END AS tx_agendamento,
    CASE WHEN SUM(f.agendaram) > 0
        THEN ROUND(SUM(f.compareceram)::NUMERIC / SUM(f.agendaram) * 100, 1)
        ELSE 0
    END AS tx_comparecimento,
    CASE WHEN SUM(f.compareceram) > 0
        THEN ROUND(SUM(f.fecharam)::NUMERIC / SUM(f.compareceram) * 100, 1)
        ELSE 0
    END AS tx_fechamento,
    -- Metricas calculadas
    CASE WHEN SUM(f.total_leads) > 0
        THEN ROUND(SUM(f.gasto) / SUM(f.total_leads), 2)
        ELSE NULL
    END AS cpl,
    CASE WHEN SUM(f.agendaram) > 0
        THEN ROUND(SUM(f.gasto) / SUM(f.agendaram), 2)
        ELSE NULL
    END AS cpa,
    CASE WHEN SUM(f.gasto) > 0 AND SUM(f.receita) > 0
        THEN ROUND(SUM(f.receita) / SUM(f.gasto), 2)
        ELSE 0
    END AS roas,
    CASE WHEN SUM(f.impressoes) > 0
        THEN ROUND(SUM(f.cliques)::NUMERIC / SUM(f.impressoes) * 100, 2)
        ELSE 0
    END AS ctr
FROM vw_unified_funnel f
GROUP BY f.location_id;

GRANT SELECT ON vw_unified_summary TO authenticated;
GRANT SELECT ON vw_unified_summary TO anon;

-- ============================================================
-- 4. RPC get_unified_summary (com filtro de periodo)
-- Substitui queries ad-hoc em cada dashboard
-- ============================================================
DROP FUNCTION IF EXISTS get_unified_summary(TEXT, DATE, DATE);

CREATE OR REPLACE FUNCTION get_unified_summary(
    p_location_id TEXT,
    p_date_from DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
    p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    location_id TEXT,
    dias_com_dados BIGINT,
    primeiro_dia DATE,
    ultimo_dia DATE,
    gasto_total NUMERIC,
    impressoes_total BIGINT,
    cliques_total BIGINT,
    mensagens_total BIGINT,
    total_leads BIGINT,
    responderam BIGINT,
    agendaram BIGINT,
    compareceram BIGINT,
    fecharam BIGINT,
    receita_total NUMERIC,
    tx_resposta NUMERIC,
    tx_agendamento NUMERIC,
    tx_comparecimento NUMERIC,
    tx_fechamento NUMERIC,
    cpl NUMERIC,
    cpa NUMERIC,
    roas NUMERIC,
    ctr NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.location_id,
        COUNT(DISTINCT f.dia)::BIGINT AS dias_com_dados,
        MIN(f.dia) AS primeiro_dia,
        MAX(f.dia) AS ultimo_dia,
        SUM(f.gasto) AS gasto_total,
        SUM(f.impressoes)::BIGINT AS impressoes_total,
        SUM(f.cliques)::BIGINT AS cliques_total,
        SUM(f.mensagens)::BIGINT AS mensagens_total,
        SUM(f.total_leads)::BIGINT AS total_leads,
        SUM(f.responderam)::BIGINT AS responderam,
        SUM(f.agendaram)::BIGINT AS agendaram,
        SUM(f.compareceram)::BIGINT AS compareceram,
        SUM(f.fecharam)::BIGINT AS fecharam,
        SUM(f.receita) AS receita_total,
        CASE WHEN SUM(f.total_leads) > 0
            THEN ROUND(SUM(f.responderam)::NUMERIC / SUM(f.total_leads) * 100, 1)
            ELSE 0
        END AS tx_resposta,
        CASE WHEN SUM(f.total_leads) > 0
            THEN ROUND(SUM(f.agendaram)::NUMERIC / SUM(f.total_leads) * 100, 1)
            ELSE 0
        END AS tx_agendamento,
        CASE WHEN SUM(f.agendaram) > 0
            THEN ROUND(SUM(f.compareceram)::NUMERIC / SUM(f.agendaram) * 100, 1)
            ELSE 0
        END AS tx_comparecimento,
        CASE WHEN SUM(f.compareceram) > 0
            THEN ROUND(SUM(f.fecharam)::NUMERIC / SUM(f.compareceram) * 100, 1)
            ELSE 0
        END AS tx_fechamento,
        CASE WHEN SUM(f.total_leads) > 0
            THEN ROUND(SUM(f.gasto) / SUM(f.total_leads), 2)
            ELSE NULL
        END AS cpl,
        CASE WHEN SUM(f.agendaram) > 0
            THEN ROUND(SUM(f.gasto) / SUM(f.agendaram), 2)
            ELSE NULL
        END AS cpa,
        CASE WHEN SUM(f.gasto) > 0 AND SUM(f.receita) > 0
            THEN ROUND(SUM(f.receita) / SUM(f.gasto), 2)
            ELSE 0
        END AS roas,
        CASE WHEN SUM(f.impressoes) > 0
            THEN ROUND(SUM(f.cliques)::NUMERIC / SUM(f.impressoes) * 100, 2)
            ELSE 0
        END AS ctr
    FROM vw_unified_funnel f
    WHERE f.location_id = p_location_id
      AND f.dia BETWEEN p_date_from AND p_date_to
    GROUP BY f.location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unified_summary(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_summary(TEXT, DATE, DATE) TO anon;

-- ============================================================
-- 5. RPC get_unified_daily (dados diarios filtrados)
-- Para dashboards que precisam de granularidade diaria
-- ============================================================
DROP FUNCTION IF EXISTS get_unified_daily(TEXT, DATE, DATE);

CREATE OR REPLACE FUNCTION get_unified_daily(
    p_location_id TEXT,
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
BEGIN
    RETURN QUERY
    SELECT
        f.dia,
        f.gasto,
        f.impressoes::BIGINT,
        f.cliques::BIGINT,
        f.mensagens::BIGINT,
        f.ctr,
        f.tx_conversao_msg,
        f.total_leads::BIGINT,
        f.responderam::BIGINT,
        f.agendaram::BIGINT,
        f.compareceram::BIGINT,
        f.fecharam::BIGINT,
        f.receita,
        f.cpl,
        f.cpa,
        f.roas
    FROM vw_unified_funnel f
    WHERE f.location_id = p_location_id
      AND f.dia BETWEEN p_date_from AND p_date_to
    ORDER BY f.dia;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unified_daily(TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_daily(TEXT, DATE, DATE) TO anon;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- DROP FUNCTION IF EXISTS get_unified_daily(TEXT, DATE, DATE);
-- DROP FUNCTION IF EXISTS get_unified_summary(TEXT, DATE, DATE);
-- DROP VIEW IF EXISTS vw_unified_summary;
-- DROP VIEW IF EXISTS vw_unified_funnel;
-- DROP INDEX IF EXISTS idx_nst_location_created;
-- DROP INDEX IF EXISTS idx_fbads_location_data;
-- DROP INDEX IF EXISTS idx_appointments_location_date;
-- DROP INDEX IF EXISTS idx_ghl_opps_contact_status;
-- DROP INDEX IF EXISTS idx_nst_location_etapa;
