-- AI Factory Agents - Tabelas Supabase
-- =====================================
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Tabela de execuções de agentes individuais
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_name TEXT NOT NULL,
    pipeline_name TEXT,
    input_data JSONB,
    output_data JSONB,
    success BOOLEAN DEFAULT true,
    tokens_used INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    model TEXT,
    contact_id TEXT,
    location_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_name ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_pipeline ON agent_executions(pipeline_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_contact ON agent_executions(contact_id);

-- 2. Tabela de execuções de pipelines completos
CREATE TABLE IF NOT EXISTS pipeline_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_name TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    total_time_ms INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    agent_results JSONB,
    final_output JSONB,
    errors JSONB DEFAULT '[]',
    contact_id TEXT,
    location_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_name ON pipeline_executions(pipeline_name);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_created ON pipeline_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_executions_contact ON pipeline_executions(contact_id);

-- 3. Tabela de comparação n8n vs Claude
CREATE TABLE IF NOT EXISTS comparison_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id TEXT,
    workflow_id TEXT,
    n8n_result JSONB,
    claude_result JSONB,
    metrics JSONB,
    classification_match BOOLEAN,
    score_difference FLOAT,
    time_ratio FLOAT,
    cost_estimate_usd FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comparison_contact ON comparison_results(contact_id);
CREATE INDEX IF NOT EXISTS idx_comparison_workflow ON comparison_results(workflow_id);
CREATE INDEX IF NOT EXISTS idx_comparison_created ON comparison_results(created_at DESC);

-- 4. Tabela de resultados de testes de agentes
CREATE TABLE IF NOT EXISTS agent_test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_version_id UUID REFERENCES agent_versions(id),
    test_suite TEXT,
    overall_score FLOAT,
    passed BOOLEAN,
    scores JSONB,
    test_results JSONB,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    failures JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    approval_status TEXT,
    tokens_used INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_test_results_agent ON agent_test_results(agent_version_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON agent_test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_score ON agent_test_results(overall_score DESC);

-- 5. View para estatísticas de pipeline
CREATE OR REPLACE VIEW pipeline_stats AS
SELECT
    pipeline_name,
    COUNT(*) as total_executions,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
    ROUND(AVG(total_time_ms)::numeric, 2) as avg_time_ms,
    ROUND(AVG(total_tokens)::numeric, 2) as avg_tokens,
    ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 2) as success_rate
FROM pipeline_executions
GROUP BY pipeline_name;

-- 6. View para estatísticas de agentes
CREATE OR REPLACE VIEW agent_stats AS
SELECT
    agent_name,
    COUNT(*) as total_executions,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
    ROUND(AVG(execution_time_ms)::numeric, 2) as avg_time_ms,
    ROUND(AVG(tokens_used)::numeric, 2) as avg_tokens,
    ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 2) as success_rate
FROM agent_executions
GROUP BY agent_name;

-- Comentário: Execute este SQL completo no Supabase Dashboard
-- https://supabase.com/dashboard/project/bfumywvwubvernvhjehk/sql/new
