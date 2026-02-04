-- ============================================================================
-- Migration 019: Pipeline Runs - Tracking de execucoes do orquestrador
-- ============================================================================
-- Armazena historico de execucoes do AgentFactoryOrchestrator
-- para auditoria, debugging e metricas de performance.

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id VARCHAR(100) NOT NULL UNIQUE,

    -- Modo de operacao
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('create', 'improve', 'full_cycle', 'qa_only')),

    -- Resultado
    success BOOLEAN NOT NULL DEFAULT false,
    error TEXT,

    -- Agente
    agent_name VARCHAR(255),
    agent_version_id UUID REFERENCES agent_versions(id),

    -- Progresso
    stages_completed TEXT[] DEFAULT '{}',

    -- Metricas
    final_score DECIMAL(4,2),
    improvements_applied INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    duration_seconds DECIMAL(10,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_mode ON pipeline_runs(mode);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_agent ON pipeline_runs(agent_version_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_success ON pipeline_runs(success);

-- Comentarios
COMMENT ON TABLE pipeline_runs IS 'Historico de execucoes do AgentFactoryOrchestrator';
COMMENT ON COLUMN pipeline_runs.mode IS 'Modo: create, improve, full_cycle, qa_only';
COMMENT ON COLUMN pipeline_runs.stages_completed IS 'Lista de etapas concluidas (ex: 01_extractor, 14_qa_analyzer)';
COMMENT ON COLUMN pipeline_runs.final_score IS 'Score final do debate (create) ou QA medio (improve)';

-- View para dashboard
CREATE OR REPLACE VIEW v_pipeline_stats AS
SELECT
    mode,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE success) as successful,
    COUNT(*) FILTER (WHERE NOT success) as failed,
    ROUND(AVG(final_score), 2) as avg_score,
    ROUND(AVG(tokens_used)) as avg_tokens,
    ROUND(AVG(duration_seconds), 1) as avg_duration_seconds,
    SUM(improvements_applied) as total_improvements
FROM pipeline_runs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY mode;

COMMENT ON VIEW v_pipeline_stats IS 'Estatisticas de execucoes por modo (ultimos 30 dias)';
