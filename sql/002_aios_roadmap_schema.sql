-- migration: 002_aios_roadmap_schema.sql
-- autor: supabase-dba agent
-- data: 2026-02-17
-- descricao: Schema de roadmap AIOS — quality gates, journey log, expert clones e context health
--            Inclui ALTER em aios_agent_executions para suporte a executor_type

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- 1. content_quality_gates
-- Registra checkpoints de qualidade por conteudo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_quality_gates (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id  UUID        NOT NULL,
    gate_name   TEXT        NOT NULL,
    passed      BOOLEAN     NOT NULL,
    details     JSONB,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    checked_by  TEXT,
    account_id  UUID        NOT NULL
);

COMMENT ON TABLE  public.content_quality_gates             IS 'Checkpoints de qualidade por unidade de conteudo';
COMMENT ON COLUMN public.content_quality_gates.content_id  IS 'UUID da entidade de conteudo avaliada (story, task, artefato)';
COMMENT ON COLUMN public.content_quality_gates.gate_name   IS 'Nome do gate: ex. tone_check, compliance_check, grammar_check';
COMMENT ON COLUMN public.content_quality_gates.passed      IS 'true = gate aprovado, false = reprovado';
COMMENT ON COLUMN public.content_quality_gates.details     IS 'Detalhes estruturados do resultado da validacao';
COMMENT ON COLUMN public.content_quality_gates.checked_by  IS 'Agente ou usuario que executou a verificacao';
COMMENT ON COLUMN public.content_quality_gates.account_id  IS 'Tenant owner — usado para RLS multi-tenant';

-- RLS
ALTER TABLE public.content_quality_gates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_quality_gates_account_select"
    ON public.content_quality_gates FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "content_quality_gates_account_insert"
    ON public.content_quality_gates FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "content_quality_gates_account_update"
    ON public.content_quality_gates FOR UPDATE
    USING (account_id = auth.uid());

CREATE POLICY "content_quality_gates_account_delete"
    ON public.content_quality_gates FOR DELETE
    USING (account_id = auth.uid());

-- Indices
CREATE INDEX IF NOT EXISTS idx_cqg_content_id  ON public.content_quality_gates(content_id);
CREATE INDEX IF NOT EXISTS idx_cqg_account_id  ON public.content_quality_gates(account_id);
CREATE INDEX IF NOT EXISTS idx_cqg_checked_at  ON public.content_quality_gates(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_cqg_gate_passed ON public.content_quality_gates(gate_name, passed);

-- ------------------------------------------------------------
-- 2. content_journey_log
-- Log auditavel de transicoes de status por conteudo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_journey_log (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id  UUID        NOT NULL,
    action      TEXT        NOT NULL,
    actor       TEXT        NOT NULL,
    old_status  TEXT,
    new_status  TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    account_id  UUID        NOT NULL
);

COMMENT ON TABLE  public.content_journey_log            IS 'Log auditavel de todas as transicoes e acoes sobre conteudo';
COMMENT ON COLUMN public.content_journey_log.content_id IS 'UUID da entidade de conteudo (story, task, artefato)';
COMMENT ON COLUMN public.content_journey_log.action     IS 'Acao executada: ex. status_change, review_requested, approved, rejected';
COMMENT ON COLUMN public.content_journey_log.actor      IS 'Identificador do agente ou usuario que executou a acao';
COMMENT ON COLUMN public.content_journey_log.old_status IS 'Status anterior (null se criacao)';
COMMENT ON COLUMN public.content_journey_log.new_status IS 'Status resultante apos a acao';
COMMENT ON COLUMN public.content_journey_log.account_id IS 'Tenant owner — usado para RLS multi-tenant';

-- RLS
ALTER TABLE public.content_journey_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_journey_log_account_select"
    ON public.content_journey_log FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "content_journey_log_account_insert"
    ON public.content_journey_log FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "content_journey_log_account_update"
    ON public.content_journey_log FOR UPDATE
    USING (account_id = auth.uid());

CREATE POLICY "content_journey_log_account_delete"
    ON public.content_journey_log FOR DELETE
    USING (account_id = auth.uid());

-- Indices
CREATE INDEX IF NOT EXISTS idx_cjl_content_id  ON public.content_journey_log(content_id);
CREATE INDEX IF NOT EXISTS idx_cjl_account_id  ON public.content_journey_log(account_id);
CREATE INDEX IF NOT EXISTS idx_cjl_created_at  ON public.content_journey_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cjl_actor       ON public.content_journey_log(actor);

-- ------------------------------------------------------------
-- 3. aios_expert_clones
-- Clones de especialistas com conhecimento estruturado
-- Depende de: aios_squads (FK)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_expert_clones (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    expertise    TEXT,
    frameworks   JSONB       NOT NULL DEFAULT '[]',
    swipe_files  JSONB       NOT NULL DEFAULT '[]',
    checklists   JSONB       NOT NULL DEFAULT '[]',
    tasks        JSONB       NOT NULL DEFAULT '[]',
    voice_type   TEXT,
    avatar_url   TEXT,
    squad_id     UUID        REFERENCES public.aios_squads(id) ON DELETE SET NULL,
    account_id   UUID        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.aios_expert_clones             IS 'Clones de especialistas com frameworks, swipe files, checklists e tasks proprias';
COMMENT ON COLUMN public.aios_expert_clones.expertise   IS 'Dominio de especialidade: ex. copywriting, vendas, design, seo';
COMMENT ON COLUMN public.aios_expert_clones.frameworks  IS 'Frameworks que o clone domina (array de objetos com nome e descricao)';
COMMENT ON COLUMN public.aios_expert_clones.swipe_files IS 'Exemplos de referencia do especialista (array de texto/url)';
COMMENT ON COLUMN public.aios_expert_clones.checklists  IS 'Checklists de qualidade do especialista (array de itens)';
COMMENT ON COLUMN public.aios_expert_clones.tasks       IS 'Tasks padrao que o clone pode executar (array de descricoes)';
COMMENT ON COLUMN public.aios_expert_clones.voice_type  IS 'Estilo de voz/comunicacao: ex. formal, casual, tecnico, persuasivo';
COMMENT ON COLUMN public.aios_expert_clones.avatar_url  IS 'URL do avatar visual do clone';
COMMENT ON COLUMN public.aios_expert_clones.account_id  IS 'Tenant owner — usado para RLS multi-tenant';

CREATE TRIGGER set_aios_expert_clones_updated_at
    BEFORE UPDATE ON public.aios_expert_clones
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.aios_expert_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aios_expert_clones_account_select"
    ON public.aios_expert_clones FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "aios_expert_clones_account_insert"
    ON public.aios_expert_clones FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "aios_expert_clones_account_update"
    ON public.aios_expert_clones FOR UPDATE
    USING (account_id = auth.uid());

CREATE POLICY "aios_expert_clones_account_delete"
    ON public.aios_expert_clones FOR DELETE
    USING (account_id = auth.uid());

-- Indices
CREATE INDEX IF NOT EXISTS idx_aec_account_id  ON public.aios_expert_clones(account_id);
CREATE INDEX IF NOT EXISTS idx_aec_squad_id    ON public.aios_expert_clones(squad_id);
CREATE INDEX IF NOT EXISTS idx_aec_created_at  ON public.aios_expert_clones(created_at DESC);

-- ------------------------------------------------------------
-- 4. aios_context_health
-- Monitor de saude de contexto por entidade do projeto
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aios_context_health (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID,
    entity_type     TEXT        NOT NULL,
    entity_name     TEXT        NOT NULL,
    last_validated  TIMESTAMPTZ,
    health_score    INTEGER     NOT NULL DEFAULT 100
                                CHECK (health_score BETWEEN 0 AND 100),
    notes           JSONB       NOT NULL DEFAULT '{}',
    account_id      UUID        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.aios_context_health                  IS 'Monitor de saude de contexto para entidades do projeto (agentes, stories, squads)';
COMMENT ON COLUMN public.aios_context_health.project_id       IS 'UUID do projeto associado (opcional)';
COMMENT ON COLUMN public.aios_context_health.entity_type      IS 'Tipo de entidade: ex. agent, story, squad, clone, workflow';
COMMENT ON COLUMN public.aios_context_health.entity_name      IS 'Nome legivel da entidade para identificacao rapida';
COMMENT ON COLUMN public.aios_context_health.last_validated   IS 'Ultima vez que a saude foi verificada';
COMMENT ON COLUMN public.aios_context_health.health_score     IS 'Score de saude de 0 (critico) a 100 (saudavel)';
COMMENT ON COLUMN public.aios_context_health.notes            IS 'Notas estruturadas sobre o estado de saude (alertas, historico, etc)';
COMMENT ON COLUMN public.aios_context_health.account_id       IS 'Tenant owner — usado para RLS multi-tenant';

-- RLS
ALTER TABLE public.aios_context_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aios_context_health_account_select"
    ON public.aios_context_health FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "aios_context_health_account_insert"
    ON public.aios_context_health FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "aios_context_health_account_update"
    ON public.aios_context_health FOR UPDATE
    USING (account_id = auth.uid());

CREATE POLICY "aios_context_health_account_delete"
    ON public.aios_context_health FOR DELETE
    USING (account_id = auth.uid());

-- Indices
CREATE INDEX IF NOT EXISTS idx_ach_account_id    ON public.aios_context_health(account_id);
CREATE INDEX IF NOT EXISTS idx_ach_project_id    ON public.aios_context_health(project_id);
CREATE INDEX IF NOT EXISTS idx_ach_entity_type   ON public.aios_context_health(entity_type);
CREATE INDEX IF NOT EXISTS idx_ach_created_at    ON public.aios_context_health(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ach_health_score  ON public.aios_context_health(health_score)
    WHERE health_score < 70;

-- ------------------------------------------------------------
-- 5. ALTER aios_agent_executions
-- Adiciona coluna executor_type para rastrear quem executou
-- ------------------------------------------------------------
ALTER TABLE public.aios_agent_executions
    ADD COLUMN IF NOT EXISTS executor_type TEXT NOT NULL DEFAULT 'agent'
    CHECK (executor_type IN ('agent', 'worker', 'clone', 'human'));

COMMENT ON COLUMN public.aios_agent_executions.executor_type IS 'Tipo de executor: agent=agente IA padrao, worker=worker celery, clone=expert clone, human=acao manual';

-- Indice parcial para buscas por tipo de executor nao-padrao
CREATE INDEX IF NOT EXISTS idx_aios_executions_executor_type
    ON public.aios_agent_executions(executor_type)
    WHERE executor_type != 'agent';

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- -- Remover coluna adicionada (nao remove dados existentes)
-- ALTER TABLE public.aios_agent_executions DROP COLUMN IF EXISTS executor_type;
--
-- -- Remover indices das novas tabelas
-- DROP INDEX IF EXISTS idx_ach_health_score;
-- DROP INDEX IF EXISTS idx_ach_created_at;
-- DROP INDEX IF EXISTS idx_ach_entity_type;
-- DROP INDEX IF EXISTS idx_ach_project_id;
-- DROP INDEX IF EXISTS idx_ach_account_id;
-- DROP INDEX IF EXISTS idx_aec_created_at;
-- DROP INDEX IF EXISTS idx_aec_squad_id;
-- DROP INDEX IF EXISTS idx_aec_account_id;
-- DROP INDEX IF EXISTS idx_cjl_actor;
-- DROP INDEX IF EXISTS idx_cjl_created_at;
-- DROP INDEX IF EXISTS idx_cjl_account_id;
-- DROP INDEX IF EXISTS idx_cjl_content_id;
-- DROP INDEX IF EXISTS idx_cqg_gate_passed;
-- DROP INDEX IF EXISTS idx_cqg_checked_at;
-- DROP INDEX IF EXISTS idx_cqg_account_id;
-- DROP INDEX IF EXISTS idx_cqg_content_id;
-- DROP INDEX IF EXISTS idx_aios_executions_executor_type;
--
-- -- Remover novas tabelas (ordem inversa de dependencia)
-- DROP TABLE IF EXISTS public.aios_context_health      CASCADE;
-- DROP TABLE IF EXISTS public.aios_expert_clones       CASCADE;
-- DROP TABLE IF EXISTS public.content_journey_log      CASCADE;
-- DROP TABLE IF EXISTS public.content_quality_gates    CASCADE;
-- COMMIT;
