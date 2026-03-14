-- Migration 083: Fix vw_unified_funnel collision
-- BUG CRITICO: 082_unified_events.sql (CJM) sobrescreveu vw_unified_funnel do semantic layer (078)
-- Schema CJM (contact_id, current_stage, has_responded) e INCOMPATIVEL com RPCs (dia, gasto, total_leads)
-- Resultado: get_unified_summary, get_unified_daily, get_client_funnel TODOS quebrados
--
-- Fix:
-- 1. DROP views CJM que colidiram (nao sao usadas por nenhum codigo TS)
-- 2. Re-aplicar vw_unified_funnel do semantic layer (078) com fix no responderam
-- 3. Re-aplicar vw_unified_summary
-- 4. RPCs ja existem e voltam a funcionar automaticamente

-- ============================================================
-- 1. DROP views CJM que colidiram (NENHUM consumer TS)
-- ============================================================
-- vw_unified_funnel_monthly depende de vw_unified_funnel_summary que depende de vw_unified_funnel
-- vw_unified_summary (semantic layer) tambem depende de vw_unified_funnel
-- Dropar TUDO e recriar na ordem correta
DROP VIEW IF EXISTS vw_unified_funnel_monthly;
DROP VIEW IF EXISTS vw_unified_funnel_summary;
DROP VIEW IF EXISTS vw_unified_summary;
DROP VIEW IF EXISTS vw_unified_funnel;

-- ============================================================
-- 2. Re-aplicar vw_unified_funnel (semantic layer 078)
--    FIX: responderam agora usa etapa_funil NOT IN ('Novo','new','null','')
--    em vez de depender do campo responded=true (quase nunca atualizado)
-- ============================================================
CREATE VIEW vw_unified_funnel AS
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
        -- FIX: responderam = qualquer etapa alem de "Novo" (responded field quase nunca atualizado)
        COUNT(*) FILTER (WHERE
            nst.responded = true
            OR nst.etapa_funil NOT IN ('Novo', 'new', '')
            OR nst.etapa_funil IS NULL AND nst.responded = true
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
    -- FIX: responderam com constraint logica (nunca > total_leads)
    LEAST(
        COALESCE(l.responderam, 0),
        GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0))
    ) AS responderam,
    -- Agendaram: GREATEST entre appointments_log e etapa_funil
    -- FIX: constraint logica (nunca > responderam)
    LEAST(
        GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)),
        LEAST(
            COALESCE(l.responderam, 0),
            GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0))
        )
    ) AS agendaram,
    -- Compareceram: preferir appointments_log com fallback pra etapa_funil
    -- FIX: constraint logica (nunca > agendaram)
    LEAST(
        GREATEST(COALESCE(ap.compareceram_real, 0), COALESCE(l.compareceram, 0)),
        LEAST(
            GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)),
            LEAST(
                COALESCE(l.responderam, 0),
                GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0))
            )
        )
    ) AS compareceram,
    -- Fecharam: dedup entre etapa_funil e ghl_opportunities
    -- FIX: constraint logica (nunca > compareceram)
    LEAST(
        COALESCE(l.fecharam_etapa, 0) + COALESCE(r.oportunidades_ganhas, 0)
            - LEAST(COALESCE(l.fecharam_etapa, 0), COALESCE(r.oportunidades_ganhas, 0)),
        LEAST(
            GREATEST(COALESCE(ap.compareceram_real, 0), COALESCE(l.compareceram, 0)),
            LEAST(
                GREATEST(COALESCE(ap.total_appointments, 0), COALESCE(l.agendaram, 0)),
                LEAST(
                    COALESCE(l.responderam, 0),
                    GREATEST(COALESCE(l.total_leads, 0), COALESCE(a.mensagens_fb, 0))
                )
            )
        )
    ) AS fecharam,
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
-- 3. Re-aplicar vw_unified_summary (depende de vw_unified_funnel)
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
-- 4. NOTA: RPCs get_unified_summary e get_unified_daily ja existem
-- (migration 078) e referenciam vw_unified_funnel.
-- Agora que a view tem o schema correto, os RPCs voltam a funcionar.
-- ============================================================

-- ============================================================
-- ROLLBACK
-- ============================================================
-- Para reverter (restaurar views CJM):
-- DROP VIEW IF EXISTS vw_unified_summary;
-- DROP VIEW IF EXISTS vw_unified_funnel;
-- Depois re-aplicar 082_unified_events.sql
