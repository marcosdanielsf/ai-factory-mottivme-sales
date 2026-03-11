-- Migration: 003_create_e2e_test_results
-- Descrição: Cria tabela dedicada para resultados de testes E2E
-- Data: 2026-01-04
--
-- PROBLEMA RESOLVIDO:
-- Antes, resultados E2E eram salvos como novos registros em agent_versions,
-- criando "agentes fantasmas" como "Julia Amare - E2E Hot Lead".
-- Agora, E2E results são armazenados separadamente com FK para o agente real.

-- Criar tabela e2e_test_results
CREATE TABLE IF NOT EXISTS e2e_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign key para o agente testado (o REAL, não cópia)
    agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,

    -- Identificação do teste
    scenario_name VARCHAR(100) NOT NULL,
    scenario_description TEXT,
    test_type VARCHAR(50) DEFAULT 'e2e',  -- 'e2e', 'e2e_suite', 'groq_quick', 'claude_full'

    -- Configuração do cenário
    lead_persona VARCHAR(50),  -- 'hot', 'warm', 'cold', 'objection'
    initial_agent VARCHAR(100),
    expected_outcome TEXT,
    expected_handoffs JSONB DEFAULT '[]',
    max_turns INTEGER DEFAULT 10,

    -- Resultados
    status VARCHAR(20) NOT NULL,  -- 'passed', 'failed', 'timeout', 'error'
    actual_outcome TEXT,
    handoffs JSONB DEFAULT '[]',
    handoff_accuracy FLOAT,

    -- Métricas
    total_turns INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    duration_seconds FLOAT,
    score FLOAT,  -- Score calculado 0-10

    -- Conversa completa (para análise)
    conversation JSONB DEFAULT '[]',
    modes_tested TEXT[],
    mode_transitions JSONB DEFAULT '[]',

    -- Dados para Dashboard (formato compatível)
    validation_result JSONB,  -- Formato completo do dashboard

    -- Erro (se houver)
    error_message TEXT,
    error_details JSONB,

    -- Metadata
    model_used VARCHAR(100),  -- 'groq-llama-3.3-70b', 'claude-3-5-sonnet', etc
    location_id VARCHAR(100),
    tags TEXT[],

    -- Timestamps
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_e2e_results_agent ON e2e_test_results(agent_version_id);
CREATE INDEX IF NOT EXISTS idx_e2e_results_scenario ON e2e_test_results(scenario_name);
CREATE INDEX IF NOT EXISTS idx_e2e_results_status ON e2e_test_results(status);
CREATE INDEX IF NOT EXISTS idx_e2e_results_created ON e2e_test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_e2e_results_location ON e2e_test_results(location_id);
CREATE INDEX IF NOT EXISTS idx_e2e_results_test_type ON e2e_test_results(test_type);

-- Comentários para documentação
COMMENT ON TABLE e2e_test_results IS 'Resultados de testes E2E dos agentes. Separado de agent_versions para não poluir a tabela principal.';
COMMENT ON COLUMN e2e_test_results.agent_version_id IS 'FK para o agente real testado (não criar novos agents para E2E)';
COMMENT ON COLUMN e2e_test_results.validation_result IS 'Formato compatível com Dashboard para exibição de resultados';

-- View para facilitar consultas de histórico de testes por agente
CREATE OR REPLACE VIEW v_agent_test_history AS
SELECT
    av.id as agent_id,
    av.agent_name,
    av.version as agent_version,
    e2e.id as test_id,
    e2e.scenario_name,
    e2e.status,
    e2e.score,
    e2e.total_turns,
    e2e.total_tokens,
    e2e.duration_seconds,
    e2e.lead_persona,
    e2e.model_used,
    e2e.created_at as tested_at
FROM agent_versions av
LEFT JOIN e2e_test_results e2e ON av.id = e2e.agent_version_id
ORDER BY e2e.created_at DESC;

-- View para métricas agregadas por agente
CREATE OR REPLACE VIEW v_agent_test_metrics AS
SELECT
    av.id as agent_id,
    av.agent_name,
    av.version as agent_version,
    COUNT(e2e.id) as total_tests,
    SUM(CASE WHEN e2e.status = 'passed' THEN 1 ELSE 0 END) as passed_tests,
    SUM(CASE WHEN e2e.status = 'failed' THEN 1 ELSE 0 END) as failed_tests,
    ROUND(AVG(e2e.score)::numeric, 2) as avg_score,
    ROUND(AVG(e2e.total_turns)::numeric, 1) as avg_turns,
    SUM(e2e.total_tokens) as total_tokens_used,
    MAX(e2e.created_at) as last_tested_at
FROM agent_versions av
LEFT JOIN e2e_test_results e2e ON av.id = e2e.agent_version_id
GROUP BY av.id, av.agent_name, av.version;

-- Função para buscar último resultado de teste por cenário
CREATE OR REPLACE FUNCTION get_latest_test_result(
    p_agent_id UUID,
    p_scenario_name VARCHAR
)
RETURNS TABLE (
    test_id UUID,
    status VARCHAR,
    score FLOAT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.status,
        e.score,
        e.created_at
    FROM e2e_test_results e
    WHERE e.agent_version_id = p_agent_id
    AND e.scenario_name = p_scenario_name
    ORDER BY e.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
