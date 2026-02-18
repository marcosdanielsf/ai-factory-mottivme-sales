-- ============================================================
-- 004_aios_context_health_seed.sql
-- Seed de entidades para o Synapse (Context Health)
-- Agentes reais do sistema MOTTIVME + projetos + squads
-- account_id: '00000000-0000-0000-0000-000000000000' (seed padrão)
-- ============================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS aios_context_health (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  entity_type   text        NOT NULL CHECK (entity_type IN ('agent', 'clone', 'squad', 'project')),
  entity_id     text        NOT NULL,
  entity_name   text        NOT NULL,
  health_score  integer     NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  alerts        jsonb       NOT NULL DEFAULT '[]',
  notes         text,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index para queries frequentes
CREATE INDEX IF NOT EXISTS idx_aios_context_health_account ON aios_context_health (account_id);
CREATE INDEX IF NOT EXISTS idx_aios_context_health_type    ON aios_context_health (entity_type);
CREATE INDEX IF NOT EXISTS idx_aios_context_health_score   ON aios_context_health (health_score);

-- ============================================================
-- SEED DATA — AGENTES REAIS
-- ============================================================

INSERT INTO aios_context_health (entity_type, entity_id, entity_name, health_score, alerts, notes, last_updated_at)
VALUES

-- Agentes com versão ativa e funcionando
('agent', '4ed5c420-0000-0000-0000-000000000001', 'Diana SDR', 95,
 '[{"level":"info","message":"v3.8.5 ativa — qualificação de região habilitada","field":"system_prompt"}]',
 'Agente principal de vendas. Última versão resolveu bug DDI.',
 now() - interval '5 minutes'),

('agent', '6c549226-0000-0000-0000-000000000002', 'Fernanda Lappe', 88,
 '[]',
 'Agente SDR para nicho financeiro Lappe. Funcionando normalmente.',
 now() - interval '20 minutes'),

('agent', 'b5437e3c-0000-0000-0000-000000000003', 'Milton Concierge', 82,
 '[{"level":"info","message":"Calendário de agendamentos pode ser otimizado","field":"calendar"}]',
 'Agente concierge multifuncional. Score estável.',
 now() - interval '1 hour'),

('agent', '86b1255d-0000-0000-0000-000000000004', 'Marina', 79,
 '[{"level":"warning","message":"Sem atualizações há 5 dias","field":"system_prompt"}]',
 'Agente SDR v1.1.0. Precisa de revisão de prompt.',
 now() - interval '5 days'),

('agent', '7f878446-0000-0000-0000-000000000005', 'Gabriella Rossmann', 91,
 '[]',
 'v4.2.0 lean — zero preços, 4 fases, tom vender sem vender. Operando bem.',
 now() - interval '2 hours'),

('agent', 'c753f872-0000-0000-0000-000000000006', 'Alberto Consulta', 74,
 '[{"level":"warning","message":"Calendário não configurado para novos horários","field":"calendar"},
   {"level":"info","message":"v2.0.0 — aguardando testes e2e","field":"system_prompt"}]',
 'Agente de consulta médica. Funcional, mas calendário desatualizado.',
 now() - interval '12 hours'),

('agent', 'a2a1b488-0000-0000-0000-000000000007', 'Eline Consulta', 71,
 '[{"level":"warning","message":"Sem testes e2e realizados","field":"testing"},
   {"level":"info","message":"v2.0.0 ativa","field":"system_prompt"}]',
 'Agente de consulta. Versão nova, ainda sem validação completa.',
 now() - interval '8 hours'),

-- Agente inativo (Isabella)
('agent', '0d28cfd6-0000-0000-0000-000000000008', 'Isabella MOTTIVME', 42,
 '[{"level":"error","message":"Agente inativo temporariamente","field":"status"},
   {"level":"warning","message":"Campo ativar_ia não criado no GHL","field":"ghl_config"},
   {"level":"warning","message":"Tag gestao_bposs não configurada","field":"ghl_tags"},
   {"level":"info","message":"Calendar ID pendente de configuração","field":"calendar"}]',
 'v1.0.0 inativa. Pendências: campo GHL, tag, calendar ID, teste e2e.',
 now() - interval '2 days'),

-- ============================================================
-- CLONES
-- ============================================================

('clone', 'clone-marcos-social', 'Clone Marcos Social', 78,
 '[{"level":"info","message":"Novos swipe files disponíveis para adicionar","field":"swipe_files"}]',
 'Clone de social selling. Conteúdo pode ser enriquecido.',
 now() - interval '30 minutes'),

-- ============================================================
-- SQUADS
-- ============================================================

('squad', 'squad-assembly-line', 'Squad Assembly Line', 87,
 '[]',
 '8 agentes IA testados e2e. Pipeline funcional. Backend no Railway.',
 now() - interval '10 minutes'),

('squad', 'squad-cold-outreach', 'Squad Cold Outreach BR', 55,
 '[{"level":"warning","message":"Credenciais Apify pendentes","field":"credentials"},
   {"level":"warning","message":"Airtable deve ser migrado para Postgres","field":"database"}]',
 'Workflows criados, mas credenciais e migração DB pendentes.',
 now() - interval '3 hours'),

('squad', 'squad-video-prod', 'Squad Video Producer', 83,
 '[{"level":"info","message":"Node GHL publicação não conectado","field":"ghl_integration"}]',
 'Pipeline e2e OK. Pendente: node GHL e legendas Remotion.',
 now() - interval '45 minutes'),

-- ============================================================
-- PROJETOS
-- ============================================================

('project', 'proj-aios-dashboard', 'AIOS Dashboard SaaS', 44,
 '[{"level":"error","message":"Schema SQL pendente de aplicação no Supabase","field":"database"},
   {"level":"warning","message":"Seed data não configurado","field":"data"},
   {"level":"warning","message":"Merge na main pendente","field":"git"}]',
 'Build OK (feat/aios-dashboard). Precisa aplicar schema SQL e seed.',
 now() - interval '6 hours'),

('project', 'proj-propostal', 'Portal de Diagnóstico / Propostal', 72,
 '[{"level":"warning","message":"n8n precisa ser separado em 2 workflows","field":"automation"},
   {"level":"info","message":"Campo @instagram pendente","field":"form"},
   {"level":"info","message":"3 novas páginas planejadas","field":"pages"}]',
 'Deploy live em propostal.vercel.app. Evoluções pendentes.',
 now() - interval '1 hour'),

('project', 'proj-follow-up-eterno', 'Follow Up Eterno v3.2', 63,
 '[{"level":"error","message":"2.456 leads sdr_inbound na fuu_queue não processados","field":"queue"},
   {"level":"warning","message":"fuu_agent_configs precisa de mais exemplos","field":"config"}]',
 'v3.2 ativo com filtros corrigidos. Backlog crítico de leads não processados.',
 now() - interval '4 hours')

ON CONFLICT (id) DO NOTHING;
