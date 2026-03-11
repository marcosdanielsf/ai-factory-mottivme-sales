-- migration: 001_aios_schema.sql
-- autor: supabase-dba agent
-- data: 2026-02-17
-- descricao: Schema inicial do AIOS Dashboard — 8 tabelas + 1 view
--            Agentes IA, execuções, stories, fases, tasks, squads, custos e orçamentos

-- ============================================================
-- EXTENSOES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. aios_squads (criada antes de aios_agents por FK)
-- Bundle/grupo de agentes IA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_squads (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    name        TEXT        NOT NULL,
    description TEXT,
    strategy    TEXT        NOT NULL DEFAULT 'collaborative'
                            CHECK (strategy IN ('collaborative', 'pipeline', 'competitive')),
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    metadata    JSONB       NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  public.aios_squads              IS 'Bundles/grupos de agentes IA para execução colaborativa';
COMMENT ON COLUMN public.aios_squads.strategy     IS 'Modo de operação: collaborative=todos colaboram, pipeline=sequencial, competitive=melhor resultado vence';
COMMENT ON COLUMN public.aios_squads.metadata     IS 'Dados extras do squad (configurações, tags, etc)';

CREATE TRIGGER set_aios_squads_updated_at
    BEFORE UPDATE ON public.aios_squads
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ------------------------------------------------------------
-- 2. aios_agents — registro de agentes IA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_agents (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    name              TEXT        NOT NULL,
    persona           TEXT,
    role              TEXT,
    status            TEXT        NOT NULL DEFAULT 'idle'
                                  CHECK (status IN ('idle', 'active', 'error', 'offline')),
    capabilities      JSONB       NOT NULL DEFAULT '[]',
    config            JSONB       NOT NULL DEFAULT '{}',
    squad_id          UUID        REFERENCES public.aios_squads(id) ON DELETE SET NULL,
    total_executions  INT         NOT NULL DEFAULT 0,
    total_cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
    last_active_at    TIMESTAMPTZ,
    is_active         BOOLEAN     NOT NULL DEFAULT true
);

COMMENT ON TABLE  public.aios_agents               IS 'Registro de agentes IA do AIOS (chief, specialist, etc)';
COMMENT ON COLUMN public.aios_agents.persona       IS 'Descrição da personalidade/identidade do agente';
COMMENT ON COLUMN public.aios_agents.role          IS 'Papel do agente: chief, specialist, reviewer, executor, etc';
COMMENT ON COLUMN public.aios_agents.capabilities  IS 'Lista de capacidades V3 em formato JSONB array';
COMMENT ON COLUMN public.aios_agents.config        IS 'Configurações específicas do agente (modelo padrão, temperatura, etc)';
COMMENT ON COLUMN public.aios_agents.total_cost    IS 'Custo acumulado total em USD';

CREATE TRIGGER set_aios_agents_updated_at
    BEFORE UPDATE ON public.aios_agents
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Índices aios_agents
CREATE INDEX IF NOT EXISTS idx_aios_agents_squad_id    ON public.aios_agents(squad_id);
CREATE INDEX IF NOT EXISTS idx_aios_agents_status      ON public.aios_agents(status);
CREATE INDEX IF NOT EXISTS idx_aios_agents_is_active   ON public.aios_agents(is_active) WHERE is_active = true;

-- ------------------------------------------------------------
-- 3. aios_stories — unidades de trabalho
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_stories (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    title             TEXT           NOT NULL,
    description       TEXT,
    status            TEXT           NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'in_progress', 'qa', 'completed', 'failed')),
    priority          TEXT           NOT NULL DEFAULT 'medium'
                                     CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    squad_id          UUID           REFERENCES public.aios_squads(id) ON DELETE SET NULL,
    assigned_agent_id UUID           REFERENCES public.aios_agents(id) ON DELETE SET NULL,
    progress          NUMERIC(5,2)   NOT NULL DEFAULT 0,
    total_phases      INT            NOT NULL DEFAULT 0,
    completed_phases  INT            NOT NULL DEFAULT 0,
    total_cost        NUMERIC(12,6)  NOT NULL DEFAULT 0,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    metadata          JSONB          NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  public.aios_stories                  IS 'Unidades de trabalho de alto nível, compostas por fases e tasks';
COMMENT ON COLUMN public.aios_stories.progress         IS 'Percentual de conclusão (0-100)';
COMMENT ON COLUMN public.aios_stories.total_phases     IS 'Total de fases definidas na story';
COMMENT ON COLUMN public.aios_stories.completed_phases IS 'Fases concluídas (atualizado via trigger ou aplicação)';
COMMENT ON COLUMN public.aios_stories.total_cost       IS 'Custo acumulado de todas as execuções desta story';

CREATE TRIGGER set_aios_stories_updated_at
    BEFORE UPDATE ON public.aios_stories
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Índices aios_stories
CREATE INDEX IF NOT EXISTS idx_aios_stories_squad_id          ON public.aios_stories(squad_id);
CREATE INDEX IF NOT EXISTS idx_aios_stories_assigned_agent_id ON public.aios_stories(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_aios_stories_status            ON public.aios_stories(status);
CREATE INDEX IF NOT EXISTS idx_aios_stories_priority          ON public.aios_stories(priority);
CREATE INDEX IF NOT EXISTS idx_aios_stories_created_at        ON public.aios_stories(created_at DESC);

-- ------------------------------------------------------------
-- 4. aios_story_phases — fases dentro de stories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_story_phases (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id     UUID        NOT NULL REFERENCES public.aios_stories(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    description  TEXT,
    phase_order  INT         NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE  public.aios_story_phases             IS 'Fases sequenciais de uma story';
COMMENT ON COLUMN public.aios_story_phases.phase_order IS 'Ordem de execução da fase dentro da story (começa em 1)';

-- Índices aios_story_phases
CREATE INDEX IF NOT EXISTS idx_aios_story_phases_story_id    ON public.aios_story_phases(story_id);
CREATE INDEX IF NOT EXISTS idx_aios_story_phases_order       ON public.aios_story_phases(story_id, phase_order);

-- ------------------------------------------------------------
-- 5. aios_tasks — tasks atômicas por fase
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_tasks (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id          UUID           REFERENCES public.aios_story_phases(id) ON DELETE CASCADE,
    story_id          UUID           NOT NULL REFERENCES public.aios_stories(id),
    title             TEXT           NOT NULL,
    description       TEXT,
    status            TEXT           NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
    assigned_agent_id UUID           REFERENCES public.aios_agents(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    result            JSONB,
    cost              NUMERIC(10,6)  NOT NULL DEFAULT 0
);

COMMENT ON TABLE  public.aios_tasks                    IS 'Tasks atômicas dentro de uma fase de story';
COMMENT ON COLUMN public.aios_tasks.phase_id           IS 'Fase à qual a task pertence (opcional — task pode ser independente de fase)';
COMMENT ON COLUMN public.aios_tasks.result             IS 'Resultado estruturado da execução da task em JSONB';

-- Índices aios_tasks
CREATE INDEX IF NOT EXISTS idx_aios_tasks_story_id          ON public.aios_tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_aios_tasks_phase_id          ON public.aios_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_aios_tasks_assigned_agent_id ON public.aios_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_aios_tasks_status            ON public.aios_tasks(status);

-- ------------------------------------------------------------
-- 6. aios_agent_executions — histórico de execuções
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_agent_executions (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id      UUID           NOT NULL REFERENCES public.aios_agents(id) ON DELETE CASCADE,
    story_id      UUID           REFERENCES public.aios_stories(id) ON DELETE SET NULL,
    task_id       UUID           REFERENCES public.aios_tasks(id) ON DELETE SET NULL,
    started_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ,
    status        TEXT           NOT NULL DEFAULT 'running'
                                 CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    model         TEXT,
    input_tokens  INT            NOT NULL DEFAULT 0,
    output_tokens INT            NOT NULL DEFAULT 0,
    cost          NUMERIC(10,6)  NOT NULL DEFAULT 0,
    result        JSONB,
    error_message TEXT,
    duration_ms   INT
);

COMMENT ON TABLE  public.aios_agent_executions               IS 'Histórico completo de execuções dos agentes';
COMMENT ON COLUMN public.aios_agent_executions.model         IS 'Modelo LLM utilizado (gpt-4o, claude-opus-4-6, gemini-2.0-flash, etc)';
COMMENT ON COLUMN public.aios_agent_executions.duration_ms   IS 'Duração da execução em milissegundos';
COMMENT ON COLUMN public.aios_agent_executions.error_message IS 'Mensagem de erro caso status=failed';

-- Índices aios_agent_executions
CREATE INDEX IF NOT EXISTS idx_aios_executions_agent_id   ON public.aios_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_aios_executions_story_id   ON public.aios_agent_executions(story_id);
CREATE INDEX IF NOT EXISTS idx_aios_executions_task_id    ON public.aios_agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_aios_executions_status     ON public.aios_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_aios_executions_started_at ON public.aios_agent_executions(started_at DESC);

-- ------------------------------------------------------------
-- 7. aios_squad_members — M2M agente↔squad
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_squad_members (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id  UUID        NOT NULL REFERENCES public.aios_squads(id) ON DELETE CASCADE,
    agent_id  UUID        NOT NULL REFERENCES public.aios_agents(id) ON DELETE CASCADE,
    role      TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('lead', 'member', 'observer')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (squad_id, agent_id)
);

COMMENT ON TABLE  public.aios_squad_members          IS 'Relação M2M entre agentes e squads';
COMMENT ON COLUMN public.aios_squad_members.role     IS 'Papel do agente no squad: lead=coordena, member=executa, observer=apenas monitora';

-- Índices aios_squad_members
CREATE INDEX IF NOT EXISTS idx_aios_squad_members_squad_id ON public.aios_squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_aios_squad_members_agent_id ON public.aios_squad_members(agent_id);

-- ------------------------------------------------------------
-- 8. aios_cost_events — eventos atômicos de custo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_cost_events (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    agent_id     UUID           REFERENCES public.aios_agents(id) ON DELETE SET NULL,
    story_id     UUID           REFERENCES public.aios_stories(id) ON DELETE SET NULL,
    execution_id UUID           REFERENCES public.aios_agent_executions(id) ON DELETE SET NULL,
    model        TEXT           NOT NULL,
    input_tokens  INT           NOT NULL DEFAULT 0,
    output_tokens INT           NOT NULL DEFAULT 0,
    cost         NUMERIC(10,6)  NOT NULL,
    event_type   TEXT           NOT NULL DEFAULT 'llm_call'
                                CHECK (event_type IN ('llm_call', 'tool_use', 'embedding', 'other'))
);

COMMENT ON TABLE  public.aios_cost_events            IS 'Eventos atômicos de custo para granularidade máxima no billing';
COMMENT ON COLUMN public.aios_cost_events.cost       IS 'Custo do evento em USD';
COMMENT ON COLUMN public.aios_cost_events.event_type IS 'Tipo de evento que gerou custo';

-- Índices aios_cost_events
CREATE INDEX IF NOT EXISTS idx_aios_cost_events_agent_id     ON public.aios_cost_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_aios_cost_events_story_id     ON public.aios_cost_events(story_id);
CREATE INDEX IF NOT EXISTS idx_aios_cost_events_execution_id ON public.aios_cost_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_aios_cost_events_created_at   ON public.aios_cost_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aios_cost_events_model        ON public.aios_cost_events(model);

-- ------------------------------------------------------------
-- 9. aios_cost_budgets — orçamentos e alertas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_cost_budgets (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    name             TEXT           NOT NULL,
    budget_amount    NUMERIC(12,2)  NOT NULL,
    spent_amount     NUMERIC(12,2)  NOT NULL DEFAULT 0,
    period           TEXT           NOT NULL DEFAULT 'monthly'
                                    CHECK (period IN ('daily', 'weekly', 'monthly')),
    alert_threshold  NUMERIC(5,2)   NOT NULL DEFAULT 80,
    is_active        BOOLEAN        NOT NULL DEFAULT true,
    squad_id         UUID           REFERENCES public.aios_squads(id) ON DELETE SET NULL
);

COMMENT ON TABLE  public.aios_cost_budgets                  IS 'Orçamentos e alertas de custo por período e squad';
COMMENT ON COLUMN public.aios_cost_budgets.budget_amount    IS 'Valor orçado em USD para o período';
COMMENT ON COLUMN public.aios_cost_budgets.spent_amount     IS 'Valor já gasto no período atual (atualizado pela aplicação)';
COMMENT ON COLUMN public.aios_cost_budgets.alert_threshold  IS 'Percentual (0-100) do orçamento que dispara alerta';

-- Índices aios_cost_budgets
CREATE INDEX IF NOT EXISTS idx_aios_cost_budgets_squad_id  ON public.aios_cost_budgets(squad_id);
CREATE INDEX IF NOT EXISTS idx_aios_cost_budgets_is_active ON public.aios_cost_budgets(is_active) WHERE is_active = true;

-- ------------------------------------------------------------
-- 10. vw_aios_cost_summary — view agregada de custos
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_aios_cost_summary AS
SELECT
    ce.agent_id,
    a.name                              AS agent_name,
    ce.model,
    ce.created_at::DATE                 AS date,
    SUM(ce.cost)                        AS total_cost,
    SUM(ce.input_tokens + ce.output_tokens) AS total_tokens,
    COUNT(*)                            AS event_count
FROM public.aios_cost_events ce
LEFT JOIN public.aios_agents a ON a.id = ce.agent_id
GROUP BY
    ce.agent_id,
    a.name,
    ce.model,
    ce.created_at::DATE;

COMMENT ON VIEW public.vw_aios_cost_summary IS 'View agregada de custos por agente, modelo e data — base para dashboards de billing';

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW  IF EXISTS public.vw_aios_cost_summary;
-- DROP TABLE IF EXISTS public.aios_cost_budgets      CASCADE;
-- DROP TABLE IF EXISTS public.aios_cost_events       CASCADE;
-- DROP TABLE IF EXISTS public.aios_squad_members     CASCADE;
-- DROP TABLE IF EXISTS public.aios_agent_executions  CASCADE;
-- DROP TABLE IF EXISTS public.aios_tasks             CASCADE;
-- DROP TABLE IF EXISTS public.aios_story_phases      CASCADE;
-- DROP TABLE IF EXISTS public.aios_stories           CASCADE;
-- DROP TABLE IF EXISTS public.aios_agents            CASCADE;
-- DROP TABLE IF EXISTS public.aios_squads            CASCADE;
-- COMMIT;
