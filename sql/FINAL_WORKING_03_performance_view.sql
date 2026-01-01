-- ===================================================================
-- VIEW DE PERFORMANCE POR AGENTE - Para gráfico do Dashboard
-- Versão simplificada baseada apenas em agent_versions e agenttest_runs
-- ===================================================================

DROP VIEW IF EXISTS vw_agent_performance_summary CASCADE;

CREATE OR REPLACE VIEW vw_agent_performance_summary AS
SELECT
    av.id AS agent_id,
    av.id::text AS slug,
    COALESCE(c.nome, av.id::text) AS name,
    'Agent' AS role,
    CASE WHEN av.status = 'active' THEN true ELSE false END AS is_active,

    -- Contagem de versões por "agente" (agrupado por client_id)
    1 AS total_versions,

    -- Taxa de conversão baseada em score (simulada a partir do avg_score_overall)
    -- Score médio * 10 = % de conversão estimada
    COALESCE(ROUND(av.avg_score_overall * 10, 1), 0) AS conversion_rate_pct,

    -- Total de interações = total de testes rodados (proxy)
    COALESCE(av.total_test_runs, 0) AS total_interactions,

    -- Leads qualificados = proxy baseado em score
    CASE
        WHEN av.avg_score_overall > 7.0 THEN COALESCE(av.total_test_runs * 3, 0)
        WHEN av.avg_score_overall > 5.0 THEN COALESCE(av.total_test_runs * 2, 0)
        ELSE COALESCE(av.total_test_runs, 0)
    END AS qualified_leads,

    -- Métricas de testes
    COALESCE(av.total_test_runs, 0) AS total_tests_run,

    COALESCE(
        (SELECT SUM(passed_tests) FROM agenttest_runs WHERE agent_version_id = av.id),
        0
    ) AS total_tests_passed,

    COALESCE(
        (SELECT SUM(failed_tests) FROM agenttest_runs WHERE agent_version_id = av.id),
        0
    ) AS total_tests_failed,

    -- Taxa de sucesso dos testes
    CASE
        WHEN (SELECT SUM(total_tests) FROM agenttest_runs WHERE agent_version_id = av.id) > 0
        THEN ROUND(
            (SELECT SUM(passed_tests)::NUMERIC / SUM(total_tests)::NUMERIC * 100
             FROM agenttest_runs
             WHERE agent_version_id = av.id),
            1
        )
        ELSE 0
    END AS test_pass_rate_pct

FROM agent_versions av
LEFT JOIN clients c ON c.id = av.client_id
WHERE av.status = 'active'
ORDER BY conversion_rate_pct DESC;

COMMENT ON VIEW vw_agent_performance_summary IS 'Performance resumida por agente ativo - baseado em scores e testes';
