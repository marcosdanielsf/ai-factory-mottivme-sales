-- =====================================================
-- AIOS Dashboard — Seed Data
-- Executar DEPOIS de 001_aios_schema.sql
-- Alinhado com schema real (total_cost, assigned_agent_id, etc.)
-- =====================================================

-- 1. SQUADS (criar primeiro — agentes referenciam)
INSERT INTO aios_squads (id, name, description, strategy, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Team Fullstack', 'Squad principal para desenvolvimento fullstack end-to-end', 'collaborative', true),
  ('a0000000-0000-0000-0000-000000000002', 'Team QA', 'Squad focado em qualidade, testes e code review', 'pipeline', true),
  ('a0000000-0000-0000-0000-000000000003', 'Team Research', 'Squad de pesquisa e analise de mercado', 'competitive', true);

-- 2. AGENTES (12 agentes core do aios-core)
INSERT INTO aios_agents (id, name, persona, role, status, capabilities, config, squad_id, total_executions, total_cost, last_active_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Dex', 'Desenvolvedor senior fullstack. Especialista em TypeScript, React e Node.js.', 'chief', 'active', '["typescript", "react", "node.js", "testing", "architecture"]', '{"model": "gpt-4o", "temperature": 0.7}', 'a0000000-0000-0000-0000-000000000001', 342, 4.85, NOW() - INTERVAL '5 minutes'),
  ('b0000000-0000-0000-0000-000000000002', 'Quinn', 'QA Engineer. Especialista em testes automatizados e code review.', 'chief', 'active', '["testing", "code-review", "e2e-tests", "unit-tests"]', '{"model": "claude-3-5-sonnet", "temperature": 0.3}', 'a0000000-0000-0000-0000-000000000002', 198, 2.34, NOW() - INTERVAL '12 minutes'),
  ('b0000000-0000-0000-0000-000000000003', 'Aria', 'Product Manager AI. Define requisitos e prioriza backlog.', 'chief', 'idle', '["product-management", "requirements", "user-stories", "prioritization"]', '{"model": "gpt-4o", "temperature": 0.5}', NULL, 87, 1.12, NOW() - INTERVAL '2 hours'),
  ('b0000000-0000-0000-0000-000000000004', 'Rex', 'Researcher. Analisa mercado, benchmarks e tendencias.', 'specialist', 'idle', '["research", "market-analysis", "benchmarking", "data-analysis"]', '{"model": "gemini-2.0-flash", "temperature": 0.4}', 'a0000000-0000-0000-0000-000000000003', 56, 0.45, NOW() - INTERVAL '1 day'),
  ('b0000000-0000-0000-0000-000000000005', 'Nova', 'Designer de sistemas. Cria arquiteturas e documentacao tecnica.', 'specialist', 'active', '["system-design", "documentation", "diagrams", "architecture"]', '{"model": "claude-3-5-sonnet", "temperature": 0.5}', 'a0000000-0000-0000-0000-000000000001', 124, 1.87, NOW() - INTERVAL '3 minutes'),
  ('b0000000-0000-0000-0000-000000000006', 'Bolt', 'DevOps Engineer. CI/CD, deploys e monitoramento.', 'specialist', 'offline', '["devops", "ci-cd", "docker", "kubernetes", "monitoring"]', '{"model": "gpt-4o-mini", "temperature": 0.3}', NULL, 45, 0.32, NOW() - INTERVAL '3 days'),
  ('b0000000-0000-0000-0000-000000000007', 'Sage', 'Data Scientist. Analise de dados, ML e otimizacao.', 'specialist', 'idle', '["data-science", "ml", "embeddings", "optimization", "python"]', '{"model": "gpt-4o", "temperature": 0.6}', 'a0000000-0000-0000-0000-000000000003', 73, 1.56, NOW() - INTERVAL '6 hours'),
  ('b0000000-0000-0000-0000-000000000008', 'Pixel', 'Frontend specialist. UI/UX, componentes e responsividade.', 'specialist', 'active', '["frontend", "ui-ux", "css", "animations", "responsive"]', '{"model": "claude-3-5-sonnet", "temperature": 0.5}', 'a0000000-0000-0000-0000-000000000001', 215, 2.98, NOW() - INTERVAL '8 minutes'),
  ('b0000000-0000-0000-0000-000000000009', 'Shield', 'Security specialist. Audita codigo e verifica vulnerabilidades.', 'specialist', 'error', '["security", "owasp", "penetration-testing", "audit"]', '{"model": "gpt-4o", "temperature": 0.2}', 'a0000000-0000-0000-0000-000000000002', 34, 0.67, NOW() - INTERVAL '30 minutes'),
  ('b0000000-0000-0000-0000-000000000010', 'Scribe', 'Technical writer. Documenta APIs e cria guias.', 'specialist', 'idle', '["documentation", "technical-writing", "api-docs", "readme"]', '{"model": "gpt-4o-mini", "temperature": 0.7}', NULL, 28, 0.18, NOW() - INTERVAL '2 days'),
  ('b0000000-0000-0000-0000-000000000011', 'Atlas', 'Database specialist. Schema design, queries e migrations.', 'specialist', 'idle', '["database", "postgresql", "migrations", "query-optimization"]', '{"model": "gpt-4o", "temperature": 0.4}', 'a0000000-0000-0000-0000-000000000001', 89, 1.23, NOW() - INTERVAL '4 hours'),
  ('b0000000-0000-0000-0000-000000000012', 'Echo', 'Integration specialist. APIs, webhooks e messaging.', 'specialist', 'idle', '["api-integration", "webhooks", "queues", "messaging"]', '{"model": "gemini-2.0-flash", "temperature": 0.5}', NULL, 42, 0.38, NOW() - INTERVAL '12 hours');

-- 3. SQUAD MEMBERS
INSERT INTO aios_squad_members (squad_id, agent_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'lead'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'member'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'member'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', 'member'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'lead'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 'member'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'lead'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 'member');

-- 4. STORIES (6 stories em diferentes status)
-- Schema real: assigned_agent_id, progress, total_cost (sem qa_loops, tags, due_date)
INSERT INTO aios_stories (id, title, description, status, priority, squad_id, assigned_agent_id, progress, total_phases, completed_phases, total_cost, started_at, completed_at, metadata) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Implementar AIOS Dashboard', 'Criar frontend SaaS com 4 features: Agent Monitor, Story Board, Cost Dashboard, Squad Manager', 'completed', 'high', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 100, 4, 4, 3.45, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour', '{"tags": ["frontend", "react", "dashboard"]}'),
  ('c0000000-0000-0000-0000-000000000002', 'API de Orquestracao de Agentes', 'Backend REST API para gerenciar agentes, squads e execucoes', 'in_progress', 'high', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 65, 5, 3, 2.18, NOW() - INTERVAL '2 days', NULL, '{"tags": ["backend", "api", "orchestration"]}'),
  ('c0000000-0000-0000-0000-000000000003', 'Sistema de QA Automatizado', 'Pipeline de testes automatizados com code review por IA', 'qa', 'medium', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 85, 3, 2, 1.67, NOW() - INTERVAL '4 days', NULL, '{"tags": ["qa", "testing", "automation"]}'),
  ('c0000000-0000-0000-0000-000000000004', 'Pesquisa de Mercado AI SaaS', 'Benchmark competitivo, sizing e posicionamento para AIOS', 'in_progress', 'medium', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 40, 4, 1, 0.89, NOW() - INTERVAL '1 day', NULL, '{"tags": ["research", "market", "saas"]}'),
  ('c0000000-0000-0000-0000-000000000005', 'Integracao com GitHub Actions', 'Conectar AIOS ao CI/CD pipeline do GitHub', 'pending', 'low', NULL, NULL, 0, 3, 0, 0, NULL, NULL, '{}'),
  ('c0000000-0000-0000-0000-000000000006', 'Security Audit Completo', 'Auditoria OWASP Top 10 em todos os endpoints', 'failed', 'critical', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000009', 30, 5, 1, 0.42, NOW() - INTERVAL '5 days', NULL, '{"tags": ["security", "audit", "owasp"]}');

-- 5. STORY PHASES
-- Schema real: sem total_tasks, sem completed_tasks
INSERT INTO aios_story_phases (id, story_id, name, phase_order, status, started_at, completed_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Schema & Tipos', 1, 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Hooks & Data Layer', 2, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Componentes UI', 3, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Integracao & Build', 4, 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour'),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'Design API', 1, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Routes & Controllers', 2, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Business Logic', 3, 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '3 hours'),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Testes Unitarios', 4, 'in_progress', NOW() - INTERVAL '3 hours', NULL),
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'Deploy & Docs', 5, 'pending', NULL, NULL);

-- 6. TASKS
-- Schema real: assigned_agent_id (nao agent_id), sem task_order, tem cost
INSERT INTO aios_tasks (phase_id, story_id, title, status, assigned_agent_id, cost) VALUES
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Testes para /agents endpoint', 'completed', 'b0000000-0000-0000-0000-000000000002', 0.043),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Testes para /stories endpoint', 'completed', 'b0000000-0000-0000-0000-000000000002', 0.038),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Testes para /squads endpoint', 'in_progress', 'b0000000-0000-0000-0000-000000000002', 0),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Testes para /costs endpoint', 'pending', NULL, 0);

-- 7. AGENT EXECUTIONS
-- Schema real: completed_at (nao finished_at), cost (nao cost_usd), result (JSONB), error_message
INSERT INTO aios_agent_executions (agent_id, story_id, task_id, status, started_at, completed_at, duration_ms, input_tokens, output_tokens, cost, model, result, error_message) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', NULL, 'completed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 120000, 4500, 2100, 0.089, 'gpt-4o', '{"summary": "Implementou rota /agents com CRUD completo"}', NULL),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', NULL, 'completed', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', 300000, 8200, 3400, 0.156, 'gpt-4o', '{"summary": "Refatorou middleware de autenticacao"}', NULL),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, 'completed', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '40 minutes', 300000, 6100, 2800, 0.042, 'claude-3-5-sonnet', '{"summary": "Executou suite de 47 testes — 45 passed, 2 failed"}', NULL),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', NULL, 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes', 600000, 12000, 5500, 0.082, 'claude-3-5-sonnet', '{"summary": "Criou diagrama de arquitetura com 8 componentes"}', NULL),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', NULL, 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', 900000, 15000, 7200, 0.105, 'claude-3-5-sonnet', '{"summary": "Implementou 8 componentes do Cost Dashboard"}', NULL),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', NULL, 'failed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '25 minutes', 300000, 5000, 800, 0.078, 'gpt-4o', NULL, 'Timeout ao escanear endpoint /api/auth — conexao recusada'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', NULL, 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 30 minutes', 1800000, 22000, 9500, 0.048, 'gemini-2.0-flash', '{"summary": "Relatorio de 15 concorrentes com pricing e features"}', NULL),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', NULL, 'completed', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours', 3600000, 35000, 12000, 0.072, 'gpt-4o', '{"summary": "Modelo de sizing TAM/SAM/SOM para AI orchestration market"}', NULL),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 3600000, 28000, 14000, 0.564, 'gpt-4o', '{"summary": "Implementou schema SQL com 8 tabelas e 1 view"}', NULL),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', NULL, 'running', NOW() - INTERVAL '5 minutes', NULL, NULL, 3200, 0, 0.043, 'claude-3-5-sonnet', NULL, NULL),
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', NULL, 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17 hours 30 minutes', 1800000, 9800, 4200, 0.189, 'gpt-4o', '{"summary": "Migration PostgreSQL com indices otimizados"}', NULL),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', NULL, 'completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours', 3600000, 18000, 8500, 0.126, 'claude-3-5-sonnet', '{"summary": "Squad Manager com 8 componentes e 2 modais"}', NULL);

-- 8. COST EVENTS (30 eventos)
-- Schema real: sem squad_id, cost (nao cost_usd), created_at (nao occurred_at)
INSERT INTO aios_cost_events (agent_id, story_id, event_type, model, input_tokens, output_tokens, cost, created_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'llm_call', 'gpt-4o', 4500, 2100, 0.089, NOW() - INTERVAL '30 minutes'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'llm_call', 'claude-3-5-sonnet', 6100, 2800, 0.042, NOW() - INTERVAL '45 minutes'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 'tool_use', 'gpt-4o', 5000, 800, 0.078, NOW() - INTERVAL '30 minutes'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'llm_call', 'gpt-4o', 8200, 3400, 0.156, NOW() - INTERVAL '1 hour'),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'llm_call', 'claude-3-5-sonnet', 3200, 1200, 0.043, NOW() - INTERVAL '5 minutes'),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'llm_call', 'claude-3-5-sonnet', 12000, 5500, 0.082, NOW() - INTERVAL '2 hours'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'llm_call', 'claude-3-5-sonnet', 15000, 7200, 0.105, NOW() - INTERVAL '3 hours'),
  ('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'llm_call', 'claude-3-5-sonnet', 18000, 8500, 0.126, NOW() - INTERVAL '12 hours'),
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'llm_call', 'gpt-4o', 28000, 14000, 0.564, NOW() - INTERVAL '1 day'),
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'llm_call', 'gpt-4o', 9800, 4200, 0.189, NOW() - INTERVAL '18 hours'),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'llm_call', 'gemini-2.0-flash', 22000, 9500, 0.048, NOW() - INTERVAL '6 hours'),
  ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'llm_call', 'gpt-4o', 35000, 12000, 0.072, NOW() - INTERVAL '8 hours'),
  ('b0000000-0000-0000-0000-000000000007', NULL, 'embedding', 'text-embedding-3-small', 45000, 0, 0.009, NOW() - INTERVAL '2 days'),
  ('b0000000-0000-0000-0000-000000000001', NULL, 'llm_call', 'gpt-4o', 5200, 2300, 0.101, NOW() - INTERVAL '3 days'),
  ('b0000000-0000-0000-0000-000000000005', NULL, 'llm_call', 'claude-3-5-sonnet', 8400, 3900, 0.058, NOW() - INTERVAL '4 days'),
  ('b0000000-0000-0000-0000-000000000002', NULL, 'llm_call', 'claude-3-5-sonnet', 7200, 3100, 0.048, NOW() - INTERVAL '5 days'),
  ('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 'tool_use', 'gpt-4o', 3800, 600, 0.059, NOW() - INTERVAL '5 days'),
  ('b0000000-0000-0000-0000-000000000001', NULL, 'llm_call', 'gpt-4o', 6700, 3200, 0.133, NOW() - INTERVAL '7 days'),
  ('b0000000-0000-0000-0000-000000000008', NULL, 'llm_call', 'claude-3-5-sonnet', 11000, 5000, 0.076, NOW() - INTERVAL '8 days'),
  ('b0000000-0000-0000-0000-000000000004', NULL, 'llm_call', 'gemini-2.0-flash', 18000, 7500, 0.039, NOW() - INTERVAL '9 days'),
  ('b0000000-0000-0000-0000-000000000002', NULL, 'llm_call', 'claude-3-5-sonnet', 9500, 4100, 0.064, NOW() - INTERVAL '10 days'),
  ('b0000000-0000-0000-0000-000000000011', NULL, 'llm_call', 'gpt-4o', 7300, 3500, 0.145, NOW() - INTERVAL '12 days'),
  ('b0000000-0000-0000-0000-000000000001', NULL, 'llm_call', 'gpt-4o', 4100, 1800, 0.079, NOW() - INTERVAL '15 days'),
  ('b0000000-0000-0000-0000-000000000005', NULL, 'llm_call', 'claude-3-5-sonnet', 13000, 6200, 0.091, NOW() - INTERVAL '18 days'),
  ('b0000000-0000-0000-0000-000000000007', NULL, 'llm_call', 'gpt-4o', 20000, 8000, 0.376, NOW() - INTERVAL '20 days'),
  ('b0000000-0000-0000-0000-000000000002', NULL, 'llm_call', 'claude-3-5-sonnet', 5500, 2400, 0.037, NOW() - INTERVAL '22 days'),
  ('b0000000-0000-0000-0000-000000000008', NULL, 'llm_call', 'claude-3-5-sonnet', 9000, 4200, 0.063, NOW() - INTERVAL '25 days'),
  ('b0000000-0000-0000-0000-000000000004', NULL, 'llm_call', 'gemini-2.0-flash', 16000, 6800, 0.035, NOW() - INTERVAL '27 days'),
  ('b0000000-0000-0000-0000-000000000001', NULL, 'llm_call', 'gpt-4o-mini', 8500, 4000, 0.019, NOW() - INTERVAL '28 days'),
  ('b0000000-0000-0000-0000-000000000006', NULL, 'tool_use', 'gpt-4o-mini', 2000, 500, 0.004, NOW() - INTERVAL '29 days');

-- 9. COST BUDGETS
-- Schema real: budget_amount (nao budget_usd), alert_threshold (nao alert_threshold_pct)
INSERT INTO aios_cost_budgets (name, period, budget_amount, alert_threshold, squad_id, is_active) VALUES
  ('Budget Global Mensal', 'monthly', 50.00, 80, NULL, true),
  ('Budget Team Fullstack', 'monthly', 25.00, 75, 'a0000000-0000-0000-0000-000000000001', true),
  ('Budget Team QA', 'weekly', 5.00, 90, 'a0000000-0000-0000-0000-000000000002', true),
  ('Budget Diario Pesquisa', 'daily', 2.00, 85, 'a0000000-0000-0000-0000-000000000003', true);

-- Verificacao
SELECT 'aios_agents' as tabela, count(*) from aios_agents
UNION ALL SELECT 'aios_squads', count(*) from aios_squads
UNION ALL SELECT 'aios_squad_members', count(*) from aios_squad_members
UNION ALL SELECT 'aios_stories', count(*) from aios_stories
UNION ALL SELECT 'aios_story_phases', count(*) from aios_story_phases
UNION ALL SELECT 'aios_tasks', count(*) from aios_tasks
UNION ALL SELECT 'aios_agent_executions', count(*) from aios_agent_executions
UNION ALL SELECT 'aios_cost_events', count(*) from aios_cost_events
UNION ALL SELECT 'aios_cost_budgets', count(*) from aios_cost_budgets;
