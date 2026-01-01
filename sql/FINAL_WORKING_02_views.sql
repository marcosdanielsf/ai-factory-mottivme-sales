-- ===================================================================
-- VIEWS OTIMIZADAS - VERSÃO FINAL QUE FUNCIONA
-- Baseado no schema real: agent_versions tem FK para clients e sub_accounts
-- ===================================================================

-- Dropar views antigas primeiro (evita conflito de nomes de colunas)
DROP VIEW IF EXISTS vw_dashboard_metrics CASCADE;
DROP VIEW IF EXISTS vw_pending_approvals CASCADE;
DROP VIEW IF EXISTS vw_score_evolution CASCADE;
DROP VIEW IF EXISTS vw_score_dimensions_detail CASCADE;
DROP VIEW IF EXISTS vw_test_results_summary CASCADE;

-- View 1: Dashboard Metrics (Dados Reais)
CREATE OR REPLACE VIEW vw_dashboard_metrics AS
SELECT
    -- Total de versões em produção (são os "agentes ativos")
    (SELECT COUNT(*) FROM public.agent_versions WHERE status = 'active') AS total_active_agents,

    -- Total de leads
    (SELECT COUNT(*) FROM public.ai_factory_leads) AS total_leads,

    -- Leads qualificados
    (SELECT COUNT(*) FROM public.ai_factory_leads
     WHERE status IN ('qualified', 'scheduled', 'converted')) AS qualified_leads,

    -- Taxa de conversão global
    CASE
        WHEN (SELECT COUNT(*) FROM public.ai_factory_leads) > 0
        THEN ROUND(
            ((SELECT COUNT(*) FROM public.ai_factory_leads WHERE status IN ('qualified', 'scheduled', 'converted'))::NUMERIC /
             (SELECT COUNT(*) FROM public.ai_factory_leads)::NUMERIC) * 100,
            2
        )
        ELSE 0
    END AS global_conversion_rate_pct,

    -- Versões
    (SELECT COUNT(*) FROM public.agent_versions WHERE status = 'active') AS versions_in_production,
    (SELECT COUNT(*) FROM public.agent_versions WHERE status = 'pending_approval') AS versions_pending_approval,

    -- Atividade recente
    (SELECT COUNT(*) FROM public.agenttest_runs WHERE created_at > NOW() - INTERVAL '24 hours') AS tests_last_24h,
    (SELECT COUNT(*) FROM public.ai_factory_conversations) AS conversations_last_24h;

COMMENT ON VIEW vw_dashboard_metrics IS 'Métricas gerais do dashboard - dados reais';


-- View 2: Pending Approvals
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
    av.id AS version_id,
    av.id AS agent_id,
    COALESCE(c.nome, av.id::text) AS agent_name, -- Nome do cliente ou ID
    COALESCE(c.nome, '') AS agent_slug,
    av.id::text AS version_number,
    'Versão aguardando aprovação'::text AS description, -- Placeholder - changelog column doesn't exist
    av.created_at,
    av.status,
    NULL::text AS previous_version,

    -- Métricas de testes
    (SELECT SUM(passed_tests) FROM public.agenttest_runs WHERE agent_version_id = av.id) AS tests_passed,
    (SELECT SUM(failed_tests) FROM public.agenttest_runs WHERE agent_version_id = av.id) AS tests_failed,

    'System' AS requested_by

FROM public.agent_versions av
LEFT JOIN public.clients c ON c.id = av.client_id
WHERE av.status = 'pending_approval'
ORDER BY av.created_at DESC;

COMMENT ON VIEW vw_pending_approvals IS 'Versões aguardando aprovação';


-- View 3: Score Evolution
CREATE OR REPLACE VIEW vw_score_evolution AS
SELECT
    av.id AS agent_id,
    COALESCE(c.nome, av.id::text) AS agent_name,
    COALESCE(c.nome, av.id::text) AS slug,
    av.id AS version_id,
    av.id::text AS version_number,
    av.status,
    av.created_at,
    av.deployed_at,

    -- Scores
    av.avg_score_overall,
    av.avg_score_dimensions,
    av.total_test_runs,
    av.last_test_at,

    -- Placeholders
    NULL::text AS previous_version,
    NULL::NUMERIC AS previous_avg_score,
    NULL::NUMERIC AS score_delta,
    NULL::NUMERIC AS improvement_pct

FROM public.agent_versions av
LEFT JOIN public.clients c ON c.id = av.client_id
WHERE av.avg_score_overall IS NOT NULL
ORDER BY av.created_at DESC;

COMMENT ON VIEW vw_score_evolution IS 'Evolução de scores por versão';


-- View 4: Score Dimensions Detail
CREATE OR REPLACE VIEW vw_score_dimensions_detail AS
SELECT
    atr.id AS test_run_id,
    atr.created_at,
    COALESCE(c.nome, av.id::text) AS agent_name,
    av.id::text AS version_number,
    atr.score_overall,

    -- Dimensões
    (atr.score_dimensions->>'tone')::numeric AS score_tone,
    (atr.score_dimensions->>'engagement')::numeric AS score_engagement,
    (atr.score_dimensions->>'compliance')::numeric AS score_compliance,
    (atr.score_dimensions->>'accuracy')::numeric AS score_accuracy,
    (atr.score_dimensions->>'empathy')::numeric AS score_empathy,
    (atr.score_dimensions->>'efficiency')::numeric AS score_efficiency,

    -- Metadados
    atr.total_tests,
    atr.passed_tests,
    atr.failed_tests,
    atr.execution_time_ms

FROM public.agenttest_runs atr
LEFT JOIN public.agent_versions av ON av.id = atr.agent_version_id
LEFT JOIN public.clients c ON c.id = av.client_id

WHERE atr.status = 'completed'
  AND atr.score_overall IS NOT NULL
  AND atr.score_overall > 0

ORDER BY atr.created_at DESC;

COMMENT ON VIEW vw_score_dimensions_detail IS 'Scores detalhados por dimensão';


-- View 5: Test Results Summary
CREATE OR REPLACE VIEW vw_test_results_summary AS
SELECT
    atr.id AS test_run_id,
    atr.created_at,
    atr.status,

    -- Versão
    av.id AS version_id,
    av.id::text AS version_number,
    av.status AS version_status,

    -- Resultados
    atr.total_tests,
    atr.passed_tests,
    atr.failed_tests,
    atr.html_report_url,
    atr.score_overall,

    -- Taxa de sucesso
    CASE
        WHEN atr.total_tests > 0
        THEN ROUND((atr.passed_tests::NUMERIC / atr.total_tests::NUMERIC) * 100, 2)
        ELSE 0
    END AS pass_rate_pct

FROM public.agenttest_runs atr
LEFT JOIN public.agent_versions av ON av.id = atr.agent_version_id

ORDER BY atr.created_at DESC;

COMMENT ON VIEW vw_test_results_summary IS 'Resumo de testes executados';


-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_agent_versions_status ON public.agent_versions(status);
CREATE INDEX IF NOT EXISTS idx_agent_versions_client ON public.agent_versions(client_id);
CREATE INDEX IF NOT EXISTS idx_agenttest_runs_created ON public.agenttest_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_factory_leads_status ON public.ai_factory_leads(status);
