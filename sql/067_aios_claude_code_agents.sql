-- migration: 067_aios_claude_code_agents.sql
-- autor: supabase-dba agent
-- data: 2026-03-10
-- descricao: Fase 1 AIOS-Claude Code Integration
--   - ALTER session_events (+4 colunas: tool_count, error_count, duration_minutes, files_modified)
--   - ALTER aios_agents (+agent_source)
--   - CREATE aios_agent_map (lookup agent_key → aios_agent_id)
--   - INSERT 2 squads (Claude Code Core Dev, Claude Code GSD)
--   - INSERT 18 agentes Claude Code em aios_agents
--   - INSERT squad_members
--   - INSERT aios_agent_map

BEGIN;

-- ============================================================
-- 1. ALTER session_events — colunas que session-end-log.sh ja envia mas nao existem
-- ============================================================
ALTER TABLE public.session_events
  ADD COLUMN IF NOT EXISTS tool_count INT,
  ADD COLUMN IF NOT EXISTS error_count INT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS files_modified INT,
  ADD COLUMN IF NOT EXISTS aios_agent_key TEXT;

COMMENT ON COLUMN public.session_events.tool_count IS 'Total de tool_uses na sessao';
COMMENT ON COLUMN public.session_events.error_count IS 'Total de erros na sessao';
COMMENT ON COLUMN public.session_events.duration_minutes IS 'Duracao da sessao em minutos';
COMMENT ON COLUMN public.session_events.files_modified IS 'Numero de arquivos modificados';
COMMENT ON COLUMN public.session_events.aios_agent_key IS 'Chave do agente Claude Code (ex: orchestrator, nextjs-fullstack)';

-- ============================================================
-- 2. ALTER aios_agents — diferenciar agentes SDR vs Claude Code
-- ============================================================
ALTER TABLE public.aios_agents
  ADD COLUMN IF NOT EXISTS agent_source TEXT NOT NULL DEFAULT 'ghl_agent';

COMMENT ON COLUMN public.aios_agents.agent_source IS 'Origem do agente: claude_code ou ghl_agent';

-- Marcar agentes existentes como ghl_agent (seed do 003_aios_real_agents.sql)
UPDATE public.aios_agents SET agent_source = 'ghl_agent' WHERE agent_source = 'ghl_agent';

-- ============================================================
-- 3. CREATE aios_agent_map — lookup agent_key → aios_agent_id
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aios_agent_map (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key     TEXT        UNIQUE NOT NULL,
    aios_agent_id UUID        NOT NULL REFERENCES public.aios_agents(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.aios_agent_map IS 'Mapeamento agent_key (string do hook) → aios_agents.id (UUID)';
COMMENT ON COLUMN public.aios_agent_map.agent_key IS 'Nome do agente no Claude Code (ex: orchestrator, gsd-planner)';

CREATE INDEX IF NOT EXISTS idx_aios_agent_map_key ON public.aios_agent_map(agent_key);

-- ============================================================
-- 4. INSERT squads — Core Dev + GSD Squad
-- ============================================================
INSERT INTO public.aios_squads (id, name, description, strategy, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid,
   'Claude Code Core Dev',
   'Squad principal de desenvolvimento: orchestrator, architect, fullstack dev, code reviewer, DBA, DevOps, knowledge curator',
   'collaborative',
   '{"agent_source": "claude_code", "models": ["opus", "sonnet", "haiku"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000002'::uuid,
   'Claude Code GSD',
   'Squad GSD (Get Stuff Done): planejamento, execucao, verificacao, debug, pesquisa de fases e projetos',
   'pipeline',
   '{"agent_source": "claude_code", "models": ["sonnet", "haiku"], "framework": "GSD"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. INSERT 18 agentes Claude Code em aios_agents
-- ============================================================

-- === Core Dev Squad (7 agentes) ===
INSERT INTO public.aios_agents (id, name, persona, role, capabilities, config, squad_id, agent_source) VALUES
  -- Orchestrator (opus)
  ('cc000000-0000-0000-0000-000000000001'::uuid,
   'Orchestrator',
   'CTO virtual da MOTTIVME. Coordena tarefas, delega para agentes especializados, NUNCA codifica diretamente.',
   'chief',
   '["coordenacao", "delegacao", "decisoes_arquiteturais", "prioridade_tarefas"]'::jsonb,
   '{"agent_key": "orchestrator", "model": "opus", "restrictions": ["NUNCA codifica"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- Architect (opus)
  ('cc000000-0000-0000-0000-000000000002'::uuid,
   'Architect',
   'Arquiteto de sistemas. Analisa trade-offs, propoe fases e documenta decisoes antes da implementacao.',
   'chief',
   '["system_design", "trade_off_analysis", "planejamento_fases", "documentacao_tecnica"]'::jsonb,
   '{"agent_key": "architect", "model": "opus", "restrictions": ["NUNCA implementa"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- Next.js Fullstack (sonnet)
  ('cc000000-0000-0000-0000-000000000003'::uuid,
   'Fullstack Dev',
   'Desenvolvedor senior Next.js 14 com App Router, TypeScript, Supabase. Implementa componentes, API routes e codigo fullstack.',
   'specialist',
   '["nextjs", "typescript", "react", "supabase", "api_routes", "componentes_ui"]'::jsonb,
   '{"agent_key": "nextjs-fullstack", "model": "sonnet", "restrictions": ["worktree isolado"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- Code Reviewer (sonnet)
  ('cc000000-0000-0000-0000-000000000004'::uuid,
   'Code Reviewer',
   'Revisor senior de codigo focado em qualidade, seguranca e manutenibilidade. NUNCA modifica codigo.',
   'specialist',
   '["code_review", "seguranca", "qualidade", "manutenibilidade", "owasp"]'::jsonb,
   '{"agent_key": "code-reviewer", "model": "sonnet", "restrictions": ["NUNCA modifica codigo"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- Supabase DBA (sonnet)
  ('cc000000-0000-0000-0000-000000000005'::uuid,
   'Supabase DBA',
   'DBA especialista em Supabase/PostgreSQL. Schema design, RLS policies, migrations com rollback, query optimization.',
   'specialist',
   '["postgresql", "rls_policies", "migrations", "query_optimization", "schema_design", "views", "functions"]'::jsonb,
   '{"agent_key": "supabase-dba", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- Knowledge Curator (haiku)
  ('cc000000-0000-0000-0000-000000000006'::uuid,
   'Knowledge Curator',
   'Analisa patterns descobertos na sessao e propoe updates para skills, memory e constitution.',
   'specialist',
   '["pattern_analysis", "memory_management", "skill_proposals", "knowledge_organization"]'::jsonb,
   '{"agent_key": "knowledge-curator", "model": "haiku", "restrictions": ["NUNCA executa, apenas propoe"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code'),

  -- DevOps (haiku)
  ('cc000000-0000-0000-0000-000000000007'::uuid,
   'DevOps',
   'Operador Git da MOTTIVME. UNICO autorizado a fazer git push, criar PRs e releases.',
   'specialist',
   '["git_push", "pull_requests", "releases", "ci_cd", "deploy", "versionamento"]'::jsonb,
   '{"agent_key": "devops", "model": "haiku", "restrictions": ["NUNCA implementa feature"]}'::jsonb,
   'a0000000-0000-0000-0000-000000000001'::uuid,
   'claude_code')
ON CONFLICT (id) DO NOTHING;

-- === GSD Squad (11 agentes) ===
INSERT INTO public.aios_agents (id, name, persona, role, capabilities, config, squad_id, agent_source) VALUES
  ('cc000000-0000-0000-0000-000000000011'::uuid,
   'GSD Planner',
   'Cria planos executaveis com task breakdown, dependency analysis e verificacao goal-backward.',
   'specialist',
   '["planejamento", "task_breakdown", "dependency_analysis", "goal_backward_verification"]'::jsonb,
   '{"agent_key": "gsd-planner", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000012'::uuid,
   'GSD Executor',
   'Executa planos GSD com atomic commits, deviation handling e checkpoint protocols.',
   'specialist',
   '["execucao_planos", "atomic_commits", "deviation_handling", "checkpoints"]'::jsonb,
   '{"agent_key": "gsd-executor", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000013'::uuid,
   'GSD Verifier',
   'Verifica achievement de goals de fase via analise goal-backward. Cria VERIFICATION.md.',
   'specialist',
   '["verificacao", "goal_backward_analysis", "quality_assurance"]'::jsonb,
   '{"agent_key": "gsd-verifier", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000014'::uuid,
   'GSD Debugger',
   'Investiga bugs usando metodo cientifico, gerencia sessoes de debug e checkpoints.',
   'specialist',
   '["debugging", "metodo_cientifico", "checkpoint_management"]'::jsonb,
   '{"agent_key": "gsd-debugger", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000015'::uuid,
   'GSD Mapper',
   'Explora codebase e escreve documentos de analise estruturada.',
   'specialist',
   '["codebase_analysis", "documentation", "architecture_mapping"]'::jsonb,
   '{"agent_key": "gsd-codebase-mapper", "model": "haiku"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000016'::uuid,
   'GSD Phase Researcher',
   'Pesquisa como implementar uma fase antes do planejamento. Produz RESEARCH.md.',
   'specialist',
   '["pesquisa", "analise_implementacao", "research_output"]'::jsonb,
   '{"agent_key": "gsd-phase-researcher", "model": "haiku"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000017'::uuid,
   'GSD Integration Checker',
   'Verifica integracao cross-phase e fluxos E2E.',
   'specialist',
   '["integracao", "e2e_testing", "cross_phase_validation"]'::jsonb,
   '{"agent_key": "gsd-integration-checker", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000018'::uuid,
   'GSD Plan Checker',
   'Verifica se planos vao atingir o goal da fase. Analise goal-backward de qualidade do plano.',
   'specialist',
   '["plan_validation", "goal_backward_analysis", "quality_check"]'::jsonb,
   '{"agent_key": "gsd-plan-checker", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000019'::uuid,
   'GSD Project Researcher',
   'Pesquisa ecosistema do dominio antes da criacao do roadmap.',
   'specialist',
   '["pesquisa_dominio", "ecosystem_analysis", "roadmap_research"]'::jsonb,
   '{"agent_key": "gsd-project-researcher", "model": "haiku"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000020'::uuid,
   'GSD Synthesizer',
   'Sintetiza outputs de pesquisa de agentes paralelos em SUMMARY.md.',
   'specialist',
   '["sintese", "consolidacao", "summary_generation"]'::jsonb,
   '{"agent_key": "gsd-research-synthesizer", "model": "haiku"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code'),

  ('cc000000-0000-0000-0000-000000000021'::uuid,
   'GSD Roadmapper',
   'Cria roadmaps com phase breakdown, requirement mapping e success criteria.',
   'specialist',
   '["roadmap_creation", "phase_breakdown", "requirement_mapping", "coverage_validation"]'::jsonb,
   '{"agent_key": "gsd-roadmapper", "model": "sonnet"}'::jsonb,
   'a0000000-0000-0000-0000-000000000002'::uuid,
   'claude_code')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. INSERT squad_members — vincular agentes aos squads
-- ============================================================

-- Core Dev: orchestrator e architect como lead, resto member
INSERT INTO public.aios_squad_members (squad_id, agent_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000001'::uuid, 'lead'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000002'::uuid, 'lead'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000003'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000004'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000005'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000006'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'cc000000-0000-0000-0000-000000000007'::uuid, 'member')
ON CONFLICT (squad_id, agent_id) DO NOTHING;

-- GSD: planner como lead, resto member
INSERT INTO public.aios_squad_members (squad_id, agent_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000011'::uuid, 'lead'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000012'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000013'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000014'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000015'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000016'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000017'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000018'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000019'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000020'::uuid, 'member'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'cc000000-0000-0000-0000-000000000021'::uuid, 'member')
ON CONFLICT (squad_id, agent_id) DO NOTHING;

-- ============================================================
-- 7. INSERT aios_agent_map — lookup agent_key → aios_agent_id
-- ============================================================
INSERT INTO public.aios_agent_map (agent_key, aios_agent_id) VALUES
  ('orchestrator',            'cc000000-0000-0000-0000-000000000001'::uuid),
  ('architect',               'cc000000-0000-0000-0000-000000000002'::uuid),
  ('nextjs-fullstack',        'cc000000-0000-0000-0000-000000000003'::uuid),
  ('code-reviewer',           'cc000000-0000-0000-0000-000000000004'::uuid),
  ('supabase-dba',            'cc000000-0000-0000-0000-000000000005'::uuid),
  ('knowledge-curator',       'cc000000-0000-0000-0000-000000000006'::uuid),
  ('devops',                  'cc000000-0000-0000-0000-000000000007'::uuid),
  ('gsd-planner',             'cc000000-0000-0000-0000-000000000011'::uuid),
  ('gsd-executor',            'cc000000-0000-0000-0000-000000000012'::uuid),
  ('gsd-verifier',            'cc000000-0000-0000-0000-000000000013'::uuid),
  ('gsd-debugger',            'cc000000-0000-0000-0000-000000000014'::uuid),
  ('gsd-codebase-mapper',     'cc000000-0000-0000-0000-000000000015'::uuid),
  ('gsd-phase-researcher',    'cc000000-0000-0000-0000-000000000016'::uuid),
  ('gsd-integration-checker', 'cc000000-0000-0000-0000-000000000017'::uuid),
  ('gsd-plan-checker',        'cc000000-0000-0000-0000-000000000018'::uuid),
  ('gsd-project-researcher',  'cc000000-0000-0000-0000-000000000019'::uuid),
  ('gsd-research-synthesizer','cc000000-0000-0000-0000-000000000020'::uuid),
  ('gsd-roadmapper',          'cc000000-0000-0000-0000-000000000021'::uuid)
ON CONFLICT (agent_key) DO NOTHING;

-- ============================================================
-- 8. Budgets para os novos squads
-- ============================================================
INSERT INTO public.aios_cost_budgets (name, budget_amount, period, squad_id) VALUES
  ('Core Dev Monthly', 50.00, 'monthly', 'a0000000-0000-0000-0000-000000000001'::uuid),
  ('GSD Monthly',      30.00, 'monthly', 'a0000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DELETE FROM public.aios_agent_map WHERE agent_key IN ('orchestrator','architect','nextjs-fullstack','code-reviewer','supabase-dba','knowledge-curator','devops','gsd-planner','gsd-executor','gsd-verifier','gsd-debugger','gsd-codebase-mapper','gsd-phase-researcher','gsd-integration-checker','gsd-plan-checker','gsd-project-researcher','gsd-research-synthesizer','gsd-roadmapper');
-- DELETE FROM public.aios_squad_members WHERE squad_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
-- DELETE FROM public.aios_agents WHERE agent_source = 'claude_code';
-- DELETE FROM public.aios_squads WHERE id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
-- DELETE FROM public.aios_cost_budgets WHERE squad_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid);
-- DROP TABLE IF EXISTS public.aios_agent_map;
-- ALTER TABLE public.aios_agents DROP COLUMN IF EXISTS agent_source;
-- ALTER TABLE public.session_events DROP COLUMN IF EXISTS tool_count, DROP COLUMN IF EXISTS error_count, DROP COLUMN IF EXISTS duration_minutes, DROP COLUMN IF EXISTS files_modified, DROP COLUMN IF EXISTS aios_agent_key;
-- COMMIT;
