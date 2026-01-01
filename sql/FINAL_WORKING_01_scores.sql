-- ===================================================================
-- SISTEMA DE SCORES - VERSÃO FINAL QUE FUNCIONA
-- Baseado no schema real descoberto
-- ===================================================================

-- 1. Adicionar colunas de score em agenttest_runs
ALTER TABLE public.agenttest_runs
ADD COLUMN IF NOT EXISTS score_overall NUMERIC(4,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS score_dimensions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- 2. Adicionar colunas de métricas em agent_versions
ALTER TABLE public.agent_versions
ADD COLUMN IF NOT EXISTS avg_score_overall NUMERIC(4,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS avg_score_dimensions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_test_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;

-- 3. Função para atualizar médias automaticamente
CREATE OR REPLACE FUNCTION update_version_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.agent_versions
    SET
        avg_score_overall = (
            SELECT AVG(score_overall)
            FROM public.agenttest_runs
            WHERE agent_version_id = NEW.agent_version_id
              AND status = 'completed'
              AND score_overall > 0
        ),
        avg_score_dimensions = (
            SELECT jsonb_object_agg(dimension, avg_score)
            FROM (
                SELECT
                    key AS dimension,
                    AVG((value)::numeric) AS avg_score
                FROM public.agenttest_runs,
                     jsonb_each_text(score_dimensions)
                WHERE agent_version_id = NEW.agent_version_id
                  AND status = 'completed'
                  AND score_dimensions IS NOT NULL
                  AND score_dimensions != '{}'::jsonb
                GROUP BY key
            ) dim_averages
        ),
        total_test_runs = (
            SELECT COUNT(*)
            FROM public.agenttest_runs
            WHERE agent_version_id = NEW.agent_version_id
        ),
        last_test_at = NEW.created_at
    WHERE id = NEW.agent_version_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_update_version_metrics ON public.agenttest_runs;
CREATE TRIGGER trigger_update_version_metrics
AFTER INSERT OR UPDATE ON public.agenttest_runs
FOR EACH ROW
EXECUTE FUNCTION update_version_test_metrics();

-- 5. Migrar scores antigos para novo formato (se existirem)
UPDATE public.agenttest_runs
SET
    score_overall = ROUND(
        (COALESCE(tone_score, 0) +
         COALESCE(engagement_score, 0) +
         COALESCE(compliance_score, 0) +
         COALESCE(completeness_score, 0)) / 4.0,
        2
    ),
    score_dimensions = jsonb_build_object(
        'tone', COALESCE(tone_score, 0),
        'engagement', COALESCE(engagement_score, 0),
        'compliance', COALESCE(compliance_score, 0),
        'accuracy', COALESCE(completeness_score, 0)
    )
WHERE (score_overall IS NULL OR score_overall = 0)
  AND (tone_score IS NOT NULL OR engagement_score IS NOT NULL);

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_agenttest_runs_score ON public.agenttest_runs(score_overall) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_agent_versions_avg_score ON public.agent_versions(avg_score_overall DESC);
CREATE INDEX IF NOT EXISTS idx_agenttest_runs_version ON public.agenttest_runs(agent_version_id);

-- Comentários
COMMENT ON COLUMN public.agenttest_runs.score_overall IS 'Score geral (0-10)';
COMMENT ON COLUMN public.agenttest_runs.score_dimensions IS 'Scores por dimensão: {"tone": 8.5, "engagement": 7.2}';
COMMENT ON COLUMN public.agent_versions.avg_score_overall IS 'Média de todos os testes desta versão';
COMMENT ON COLUMN public.agent_versions.avg_score_dimensions IS 'Médias por dimensão';
