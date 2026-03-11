-- ============================================
-- System Config v4.0
-- Tabela para armazenar configuracao do sistema
-- de desenvolvimento (agentes, hooks, workflows, etc)
-- ============================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index por key
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_config_updated ON system_config;
CREATE TRIGGER trg_system_config_updated
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION system_config_updated_at();

-- RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_system_config_all" ON system_config
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA
-- ============================================

-- 1. AGENTS
INSERT INTO system_config (key, value, description) VALUES
('agents', '[
  {"id":"orchestrator","name":"Orchestrator","role":"CTO virtual — coordena, delega, NUNCA codifica","model":"opus","canEdit":false,"canBash":false,"permissions":["Read","Grep","Glob","Task","WebSearch","WebFetch"],"domains":["orquestracao","decisoes","delegacao"]},
  {"id":"architect","name":"Architect","role":"System design, trade-offs, fases e documentacao","model":"opus","canEdit":false,"canBash":false,"permissions":["Read","Grep","Glob","WebSearch","WebFetch"],"domains":["arquitetura","system-design","planejamento"]},
  {"id":"nextjs-fullstack","name":"Next.js Fullstack","role":"Implementa componentes, API routes, codigo fullstack","model":"sonnet","canEdit":true,"canBash":true,"permissions":["Read","Write","Edit","Bash","Grep","Glob"],"domains":["frontend","api","typescript","react"]},
  {"id":"code-reviewer","name":"Code Reviewer","role":"Revisa qualidade, seguranca, manutenibilidade — NUNCA modifica","model":"sonnet","canEdit":false,"canBash":true,"permissions":["Read","Grep","Glob","Bash"],"domains":["review","qualidade","seguranca"]},
  {"id":"supabase-dba","name":"Supabase DBA","role":"Schema design, RLS, migrations, query optimization","model":"sonnet","canEdit":true,"canBash":true,"permissions":["Read","Write","Edit","Bash","Grep","Glob"],"domains":["database","postgresql","rls","migrations"]},
  {"id":"knowledge-curator","name":"Knowledge Curator","role":"Analisa patterns e propoe updates para memory/skills","model":"haiku","canEdit":false,"canBash":false,"permissions":["Read","Grep","Glob"],"domains":["memory","skills","patterns"]},
  {"id":"devops","name":"DevOps","role":"Git push, PRs, deploy, CI/CD","model":"haiku","canEdit":false,"canBash":true,"permissions":["Read","Bash","Grep","Glob"],"domains":["git","deploy","ci-cd"]}
]'::jsonb, 'Agentes do sistema v4.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 2. HOOKS
INSERT INTO system_config (key, value, description) VALUES
('hooks', '[
  {"id":"model-router","name":"Model Router","event":"PreToolCall","type":"guard","description":"Roteia modelo por complexidade da tarefa (haiku/sonnet/opus)","command":"model-router.sh"},
  {"id":"session-context-loader","name":"Session Context Loader","event":"PostToolCall","type":"loader","description":"Carrega memory tier-1 e context do projeto ativo","command":"session-context-loader.sh"},
  {"id":"session-start-tasks","name":"Session Start Tasks","event":"PostToolCall","type":"loader","description":"Busca tasks pendentes do Supabase ao iniciar sessao","command":"session-start-tasks.sh"},
  {"id":"constitution-guard","name":"Constitution Guard","event":"PreToolCall","type":"guard","description":"Valida acoes contra constitution antes de executar","command":"constitution-guard.sh"},
  {"id":"auto-qa-scheduler","name":"Auto QA Scheduler","event":"PostToolCall","type":"scheduler","description":"Agenda code-reviewer apos implementacao automaticamente","command":"auto-qa-scheduler.sh"},
  {"id":"context-budget-monitor","name":"Context Budget Monitor","event":"PostToolCall","type":"monitor","description":"Monitora uso de contexto e avisa ao ultrapassar 70%","command":"context-budget-monitor.sh"},
  {"id":"pre-compact-reminder","name":"Pre-Compact Reminder","event":"PreToolCall","type":"monitor","description":"Lembra de salvar estado antes de compactacao de contexto","command":"pre-compact-reminder.sh"},
  {"id":"git-safety","name":"Git Safety","event":"PreToolCall","type":"guard","description":"Impede commits direto na main e push sem build","command":"git-safety.sh"}
]'::jsonb, 'Hooks do sistema v4.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 3. WORKFLOWS
INSERT INTO system_config (key, value, description) VALUES
('workflows', '[
  {"id":"feature-development","name":"Feature Development","trigger":"Nova feature ou implementacao","phases":[{"step":1,"name":"Elicitation (3 perguntas)","agent":"orchestrator","model":"opus"},{"step":2,"name":"Architecture Review","agent":"architect","model":"opus"},{"step":3,"name":"Skill Loading","agent":"orchestrator","model":"opus"},{"step":4,"name":"Implementation","agent":"nextjs-fullstack","model":"sonnet"},{"step":5,"name":"Code Review","agent":"code-reviewer","model":"sonnet"},{"step":6,"name":"Fix Issues","agent":"nextjs-fullstack","model":"sonnet"},{"step":7,"name":"Build & Deploy","agent":"devops","model":"haiku"}]},
  {"id":"agent-upgrade","name":"Agent Upgrade","trigger":"Nova versao de agente CRITICS","phases":[{"step":1,"name":"Carregar versao atual","agent":"supabase-dba","model":"sonnet"},{"step":2,"name":"Gerar nova versao","agent":"nextjs-fullstack","model":"sonnet"},{"step":3,"name":"Validar 11 campos JSONB","agent":"code-reviewer","model":"sonnet"},{"step":4,"name":"INSERT + DEPRECAR anterior","agent":"supabase-dba","model":"sonnet"},{"step":5,"name":"Testar em staging","agent":"code-reviewer","model":"sonnet"},{"step":6,"name":"Atualizar memory","agent":"knowledge-curator","model":"haiku"}]},
  {"id":"bug-fix","name":"Bug Fix","trigger":"Bug report ou erro em producao","phases":[{"step":1,"name":"Reproduzir e diagnosticar","agent":"code-reviewer","model":"sonnet"},{"step":2,"name":"Implementar fix","agent":"nextjs-fullstack","model":"sonnet"},{"step":3,"name":"Review do fix","agent":"code-reviewer","model":"sonnet"},{"step":4,"name":"Build & Test","agent":"devops","model":"haiku"},{"step":5,"name":"Deploy fix","agent":"devops","model":"haiku"}]},
  {"id":"n8n-workflow","name":"n8n Workflow","trigger":"Novo workflow ou modificacao n8n","phases":[{"step":1,"name":"Mapear nodes e conexoes","agent":"architect","model":"opus"},{"step":2,"name":"Implementar nodes","agent":"nextjs-fullstack","model":"sonnet"},{"step":3,"name":"Validar safeParseJSON","agent":"code-reviewer","model":"sonnet"},{"step":4,"name":"Deploy via API","agent":"devops","model":"haiku"},{"step":5,"name":"Testar execucao","agent":"code-reviewer","model":"sonnet"}]}
]'::jsonb, 'Workflows do sistema v4.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 4. MEMORY FILES
INSERT INTO system_config (key, value, description) VALUES
('memory_files', '[
  {"path":"memory/tier-1/patterns.md","category":"Patterns","description":"Patterns criticos do sistema","tier":1},
  {"path":"memory/tier-1/clients.md","category":"Clientes","description":"Mapeamento de clientes ativos","tier":1},
  {"path":"memory/tier-1/agents.md","category":"Agentes","description":"Versoes e configs dos agentes","tier":1},
  {"path":"memory/api-keys.md","category":"Credenciais","description":"API keys de 17 servicos","tier":2},
  {"path":"memory/ghl-clients-mapping.md","category":"GHL","description":"12 clientes com location_id e calendarios","tier":2},
  {"path":"memory/mottivme-sales-workflow.md","category":"Workflows","description":"Workflow principal n8n (48 nodes)","tier":2},
  {"path":"memory/agent-restructure.md","category":"Agentes","description":"Restructure e roteamento multi-servico","tier":2},
  {"path":"memory/assembly-line-quick-ref.md","category":"Produtos","description":"Assembly Line quick reference","tier":2},
  {"path":"memory/brand-portal.md","category":"Clientes","description":"Brand Portal config","tier":2},
  {"path":"memory/llm-cost-tracking.md","category":"Custos","description":"Cost tracking workflows","tier":2},
  {"path":"memory/MEMORY-INDEX.md","category":"Index","description":"Keyword → arquivo mapping","tier":2}
]'::jsonb, 'Arquivos de memory do sistema v4.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 5. CONSTITUTION
INSERT INTO system_config (key, value, description) VALUES
('constitution', '[
  {"number":1,"title":"Git Safety","severity":"NON-NEGOTIABLE","rules":["NUNCA commitar direto na main — SEMPRE criar branch primeiro","Prefixos obrigatorios: feat: fix: chore: refactor:","NUNCA commitar .env, credenciais, node_modules, .temp","Apenas agente devops faz git push e abre PRs","Pre-merge: rodar build/tsc antes de mergear","Mensagens de commit em PT-BR"]},
  {"number":2,"title":"Agent Authority","severity":"NON-NEGOTIABLE","rules":["orchestrator: decide e coordena, NUNCA codifica","nextjs-fullstack: implementa codigo, NUNCA faz git push","code-reviewer: revisa e aponta riscos, NUNCA modifica codigo","devops: git push, PR, deploy, NUNCA implementa feature","supabase-dba: operacoes de banco, preferido para DDL/migrations","Skill SEMPRE antes de agente","Max 5 sub-agentes simultaneos","Max 3 loops CODER → REVIEWER"]},
  {"number":3,"title":"Skill Before Code","severity":"MUST","rules":["NUNCA codificar sem consultar skill primeiro","Keywords detect → carregar skill → implementar","Implementou sem skill → /cr obrigatorio","Verificar ~/.claude/skills/ antes de criar novo codigo"]},
  {"number":4,"title":"Agent Version Safety","severity":"MUST","rules":["NUNCA UPDATE direto em agent_versions","INSERT nova versao (is_active=true, status=active)","DEPRECAR anterior (is_active=false, status=deprecated)","is_active e status sao campos SEPARADOS — setar AMBOS","client_id e location_id NUNCA nulos","11 campos JSONB obrigatorios em toda nova versao"]},
  {"number":5,"title":"Cost Discipline","severity":"MUST","rules":["Max 45min ou 1 tarefa complexa por sessao","Avisar usuario ao ultrapassar 30 turnos","NAO editar CLAUDE.md mid-session","Max 5 web searches por batch","Haiku: pesquisa, git | Sonnet: implementacao | Opus: arquitetura"]},
  {"number":6,"title":"Data Safety","severity":"MUST","rules":["vw_client_costs_summary tem 7 views dependentes — NUNCA DROP","REST API Supabase = DML only (DDL requer Management API)","SEMPRE ter rollback plan antes de migration","NUNCA DROP table/column sem aprovacao explicita","NUNCA expor service role key em client-side"]},
  {"number":7,"title":"Persistence Rule","severity":"SHOULD","rules":["Salvar estado em 3 lugares ao fim de sessao","Listar decisoes tomadas antes de encerrar","Sugerir proximos passos ao usuario","3 lugares: memory/*.md, claude-mem (Ollama), scripts (git-tracked)"]}
]'::jsonb, 'Constitution v1.0 do sistema')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 6. SYSTEM STATS
INSERT INTO system_config (key, value, description) VALUES
('system_stats', '{"agents":7,"hooks":8,"workflows":4,"workflowPhases":23,"memoryFiles":11,"constitutionArticles":7,"skills":15,"pbmModes":9}'::jsonb, 'Estatisticas gerais do sistema v4.0')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- 7. MEMORY CATEGORIES
INSERT INTO system_config (key, value, description) VALUES
('memory_categories', '[
  {"name":"Patterns","count":1},
  {"name":"Clientes","count":3},
  {"name":"Agentes","count":2},
  {"name":"Credenciais","count":1},
  {"name":"GHL","count":1},
  {"name":"Workflows","count":1},
  {"name":"Produtos","count":1},
  {"name":"Custos","count":1}
]'::jsonb, 'Categorias do memory index')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ROLLBACK:
-- DROP TRIGGER IF EXISTS trg_system_config_updated ON system_config;
-- DROP FUNCTION IF EXISTS system_config_updated_at();
-- DROP TABLE IF EXISTS system_config;
