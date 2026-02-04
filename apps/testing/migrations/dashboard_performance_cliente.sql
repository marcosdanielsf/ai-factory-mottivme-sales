-- ============================================
-- DASHBOARD PERFORMANCE POR CLIENTE
-- Data: 2026-01-10 (CORRIGIDO)
-- ============================================
-- View para exibir performance por cliente/agente
-- Usa: agent_versions (location_id), fuu_queue, llm_costs
-- ============================================

-- ============================================
-- 1. PERFORMANCE POR CLIENTE (VIEW PRINCIPAL)
-- ============================================
CREATE OR REPLACE VIEW dashboard_performance_cliente AS
SELECT
    av.id as agent_version_id,
    av.location_id,
    av.agent_name,
    av.status as agent_status,
    av.version,
    av.is_active,
    av.created_at as agent_created_at,
    av.total_test_runs,
    av.last_test_score,
    av.avg_score_overall,

    -- Métricas de Follow-up (da fuu_queue)
    COALESCE(fq.total_leads, 0) as total_leads,
    COALESCE(fq.leads_responderam, 0) as leads_responderam,
    COALESCE(fq.leads_agendaram, 0) as leads_agendaram,
    COALESCE(fq.leads_compareceram, 0) as leads_compareceram,
    COALESCE(fq.leads_fecharam, 0) as leads_fecharam,
    COALESCE(fq.taxa_resposta, 0) as taxa_resposta,
    COALESCE(fq.taxa_agendamento, 0) as taxa_agendamento,
    COALESCE(fq.taxa_conversao_geral, 0) as taxa_conversao_geral,

    -- Métricas de Custo (da llm_costs)
    COALESCE(lc.total_tokens, 0) as total_tokens,
    COALESCE(lc.custo_total_usd, 0) as custo_total_usd,
    COALESCE(lc.total_chamadas_ia, 0) as total_chamadas_ia

FROM agent_versions av

-- Join com métricas de follow-up agregadas
LEFT JOIN LATERAL (
    SELECT
        COUNT(DISTINCT contact_id) as total_leads,
        COUNT(DISTINCT contact_id) FILTER (WHERE status = 'responded') as leads_responderam,
        COUNT(DISTINCT contact_id) FILTER (WHERE context->>'etapa' ILIKE '%agend%' OR context->>'status' = 'agendado') as leads_agendaram,
        COUNT(DISTINCT contact_id) FILTER (WHERE context->>'status' IN ('compareceu', 'atendido', 'presente')) as leads_compareceram,
        COUNT(DISTINCT contact_id) FILTER (WHERE context->>'status' IN ('won', 'fechou', 'vendido', 'converted')) as leads_fecharam,
        ROUND(
            COUNT(DISTINCT contact_id) FILTER (WHERE status = 'responded')::numeric /
            NULLIF(COUNT(DISTINCT contact_id), 0) * 100,
            1
        ) as taxa_resposta,
        ROUND(
            COUNT(DISTINCT contact_id) FILTER (WHERE context->>'etapa' ILIKE '%agend%')::numeric /
            NULLIF(COUNT(DISTINCT contact_id) FILTER (WHERE status = 'responded'), 0) * 100,
            1
        ) as taxa_agendamento,
        ROUND(
            COUNT(DISTINCT contact_id) FILTER (WHERE context->>'status' IN ('won', 'fechou', 'vendido'))::numeric /
            NULLIF(COUNT(DISTINCT contact_id), 0) * 100,
            1
        ) as taxa_conversao_geral
    FROM fuu_queue
    WHERE location_id = av.location_id
) fq ON true

-- Join com custos agregados
LEFT JOIN LATERAL (
    SELECT
        SUM(tokens_input + tokens_output) as total_tokens,
        SUM(custo_usd) as custo_total_usd,
        COUNT(*) as total_chamadas_ia
    FROM llm_costs
    WHERE location_id = av.location_id
) lc ON true

-- Filtrar apenas a versão mais recente de cada location
WHERE av.id IN (
    SELECT DISTINCT ON (location_id) id
    FROM agent_versions
    WHERE location_id IS NOT NULL
    ORDER BY location_id, updated_at DESC
)

ORDER BY fq.total_leads DESC NULLS LAST;

COMMENT ON VIEW dashboard_performance_cliente IS 'Performance consolidada por cliente/agente - usa location_id como identificador';


-- ============================================
-- 2. RANKING DE CLIENTES (TOP PERFORMERS)
-- ============================================
CREATE OR REPLACE VIEW dashboard_ranking_clientes AS
SELECT
    location_id,
    agent_name,
    total_leads,
    leads_responderam,
    leads_fecharam,
    taxa_resposta,
    taxa_conversao_geral,
    custo_total_usd,
    avg_score_overall as score_medio,
    -- Ranking
    ROW_NUMBER() OVER (ORDER BY taxa_conversao_geral DESC NULLS LAST) as rank_conversao,
    ROW_NUMBER() OVER (ORDER BY total_leads DESC NULLS LAST) as rank_volume,
    ROW_NUMBER() OVER (ORDER BY taxa_resposta DESC NULLS LAST) as rank_resposta
FROM dashboard_performance_cliente
WHERE total_leads > 0
ORDER BY taxa_conversao_geral DESC NULLS LAST;

COMMENT ON VIEW dashboard_ranking_clientes IS 'Ranking de clientes por performance';


-- ============================================
-- 3. ALERTAS POR CLIENTE
-- ============================================
CREATE OR REPLACE VIEW dashboard_alertas_cliente AS
SELECT
    pc.location_id,
    pc.agent_name,
    -- Alertas
    CASE WHEN pc.taxa_resposta < 10 AND pc.total_leads > 5 THEN true ELSE false END as alerta_baixa_resposta,
    CASE WHEN pc.taxa_conversao_geral < 5 AND pc.total_leads > 10 THEN true ELSE false END as alerta_baixa_conversao,
    CASE WHEN pc.custo_total_usd > 50 AND pc.leads_fecharam = 0 THEN true ELSE false END as alerta_custo_sem_resultado,
    CASE WHEN pc.avg_score_overall < 5 AND pc.total_test_runs > 0 THEN true ELSE false END as alerta_score_baixo,
    -- Contagem de alertas
    (
        CASE WHEN pc.taxa_resposta < 10 AND pc.total_leads > 5 THEN 1 ELSE 0 END +
        CASE WHEN pc.taxa_conversao_geral < 5 AND pc.total_leads > 10 THEN 1 ELSE 0 END +
        CASE WHEN pc.custo_total_usd > 50 AND pc.leads_fecharam = 0 THEN 1 ELSE 0 END +
        CASE WHEN pc.avg_score_overall < 5 AND pc.total_test_runs > 0 THEN 1 ELSE 0 END
    ) as total_alertas
FROM dashboard_performance_cliente pc
WHERE (
    (pc.taxa_resposta < 10 AND pc.total_leads > 5) OR
    (pc.taxa_conversao_geral < 5 AND pc.total_leads > 10) OR
    (pc.custo_total_usd > 50 AND pc.leads_fecharam = 0) OR
    (pc.avg_score_overall < 5 AND pc.total_test_runs > 0)
)
ORDER BY total_alertas DESC;

COMMENT ON VIEW dashboard_alertas_cliente IS 'Alertas de performance por cliente';


-- ============================================
-- FIM
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Dashboard Performance Cliente criado!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Views: dashboard_performance_cliente';
    RAISE NOTICE 'Views: dashboard_ranking_clientes';
    RAISE NOTICE 'Views: dashboard_alertas_cliente';
END $$;
