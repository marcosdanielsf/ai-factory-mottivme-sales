-- migration: 003_aios_real_agents.sql
-- autor: supabase-dba agent
-- data: 2026-02-17
-- descricao: Substitui seed data fake por agentes REAIS do agent_versions
--            + squads reais por cliente + mapeamento agent_versions.id

-- ============================================================
-- LIMPAR SEED DATA FAKE
-- ============================================================
DELETE FROM aios_cost_events;
DELETE FROM aios_cost_budgets;
DELETE FROM aios_agent_executions;
DELETE FROM aios_tasks;
DELETE FROM aios_story_phases;
DELETE FROM aios_stories;
DELETE FROM aios_squad_members;
DELETE FROM aios_agents;
DELETE FROM aios_squads;

-- ============================================================
-- 1. SQUADS REAIS (1 squad por cliente)
-- ============================================================
INSERT INTO aios_squads (id, name, description, strategy, metadata) VALUES
  ('s0000000-0000-0000-0000-000000000001', 'Team Diana - Atelie', 'Agentes do Atelie Diana Brasil (4 unidades EUA)', 'collaborative', '{"client": "diana_brasil", "location_count": 4}'),
  ('s0000000-0000-0000-0000-000000000002', 'Team Financeiros', 'Agentes financeiros (Fernanda, Milton, Marina)', 'collaborative', '{"client": "apex_pro_financial", "vertical": "financeiro"}'),
  ('s0000000-0000-0000-0000-000000000003', 'Team Saude', 'Agentes de saude (Alberto, Eline, Gabriella)', 'collaborative', '{"vertical": "saude"}'),
  ('s0000000-0000-0000-0000-000000000004', 'Team BPOSS', 'Agente Heloise - BPO Simplificado', 'collaborative', '{"client": "bposs"}'),
  ('s0000000-0000-0000-0000-000000000005', 'Team Marcos Social', 'Agente Marcos - Social Business', 'collaborative', '{"client": "marcos_social"}');

-- ============================================================
-- 2. AGENTES REAIS (do agent_versions)
-- config.agent_version_id = link pro agent_versions real
-- ============================================================
INSERT INTO aios_agents (id, name, persona, role, status, capabilities, config, squad_id, total_executions, total_cost, last_active_at) VALUES
  -- Diana v3.8.5
  ('4ed5c420-4e99-4245-bfa5-e6238dadac95',
   'Diana', 'SDR do Atelie Diana Brasil. Qualifica leads por regiao (Woburn/Revere/Framingham/Orlando), agenda consultas de beleza.',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v3.8.5", "agent_version_id": "4ed5c420-4e99-4245-bfa5-e6238dadac95"}',
   's0000000-0000-0000-0000-000000000001', 0, 0, NOW()),

  -- Heloise v2.7.0
  ('f21fb515-907a-4dd2-95a1-5092f59f57cb',
   'Heloise', 'SDR da BPOSS. Vende pacote BPO simplificado (R$800+R$240+R$560).',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v2.7.0", "agent_version_id": "f21fb515-907a-4dd2-95a1-5092f59f57cb"}',
   's0000000-0000-0000-0000-000000000004', 0, 0, NOW()),

  -- Alberto v5.8.0 (Tricomind)
  ('1f8bb37f-f1c0-4ada-b72b-17845b1e6877',
   'Alberto', 'Dr. Alberto Correia - Mentoria Tricomind. Fala em PRIMEIRA PESSOA. Screener seletivo.',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v5.8.0", "agent_version_id": "1f8bb37f-f1c0-4ada-b72b-17845b1e6877"}',
   's0000000-0000-0000-0000-000000000003', 0, 0, NOW()),

  -- Eline v3.8.0 (HormoSafe)
  ('1e6cb46c-2dd1-4754-8dfc-014f801511e0',
   'Eline', 'SDR da HormoSafe. Todos leads sao medicos de reposicao hormonal.',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v3.8.0", "agent_version_id": "1e6cb46c-2dd1-4754-8dfc-014f801511e0"}',
   's0000000-0000-0000-0000-000000000003', 0, 0, NOW()),

  -- Gabriella v4.2.0 (Dra. Rossmann)
  ('7f878446-0000-0000-0000-000000000000',
   'Gabriella', 'Dra. Gabriella Rossmann - Ginecologia. Lean 4 fases, zero precos, concierge fecha.',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v4.2.0", "agent_version_id": "7f878446"}',
   's0000000-0000-0000-0000-000000000003', 0, 0, NOW()),

  -- Fernanda Lappe v3.2.0
  ('6c549226-8cd2-440d-9e81-6c12f19819a6',
   'Fernanda', 'Fernanda Lappe - Agente financeiro. Social selling universal NS/VS/GS.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "socialsellercarreira", "socialsellerconsultoria", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base"]',
   '{"model": "gemini-2.0-flash", "version": "v3.2.0", "agent_version_id": "6c549226-8cd2-440d-9e81-6c12f19819a6"}',
   's0000000-0000-0000-0000-000000000002', 0, 0, NOW()),

  -- Milton (Legacy Agency) v2.2.0
  ('b5437e3c-f53c-4780-ae21-d05e7d4a4b8e',
   'Milton', 'Milton - Legacy Agency. Agente financeiro com social selling universal.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "socialsellercarreira", "socialsellerconsultoria", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base"]',
   '{"model": "gemini-2.0-flash", "version": "v2.2.0", "agent_version_id": "b5437e3c-f53c-4780-ae21-d05e7d4a4b8e"}',
   's0000000-0000-0000-0000-000000000002', 0, 0, NOW()),

  -- Marina Couto v1.1.0
  ('86b1255d-8a82-4219-9dcb-dcf3b6a58d17',
   'Marina', 'Marina Couto - Pompano Beach FL. Agente financeiro, Brazillionaires.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "socialsellercarreira", "socialsellerconsultoria", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base"]',
   '{"model": "gemini-2.0-flash", "version": "v1.1.0", "agent_version_id": "86b1255d-8a82-4219-9dcb-dcf3b6a58d17"}',
   's0000000-0000-0000-0000-000000000002', 0, 0, NOW()),

  -- Marcos Social v2.5.0
  ('4b038b87-31eb-4f31-8cf0-d5b761d29db7',
   'Marcos Social', 'Marcos Social Business v2.5.0. Social selling com qualificacao R$2.500/mes.',
   'chief', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "closer", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v2.5.0", "agent_version_id": "4b038b87-31eb-4f31-8cf0-d5b761d29db7"}',
   's0000000-0000-0000-0000-000000000005', 0, 0, NOW()),

  -- Thauan v4.9.0
  ('e64753dc-96d8-40e6-bbe0-4a905b7add01',
   'Thauan', 'Thauan - Template social seller v4.9.0. Base dos prompts universais.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v4.9.0", "agent_version_id": "e64753dc-96d8-40e6-bbe0-4a905b7add01"}',
   's0000000-0000-0000-0000-000000000001', 0, 0, NOW()),

  -- Isabella Instituto Amare v10.0
  ('eb421a7d-ee91-4ea1-a8f7-f07426b2bf4c',
   'Isabella Amare', 'Isabella do Instituto Amare. 9 modos PBM reais.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v10.0", "agent_version_id": "eb421a7d-ee91-4ea1-a8f7-f07426b2bf4c"}',
   's0000000-0000-0000-0000-000000000003', 0, 0, NOW()),

  -- Fernanda Leal v1.2.0
  ('600520c6-25aa-4091-a3e0-1344643b4dcd',
   'Fernanda Leal', 'Fernanda Leal v1.2.0.',
   'specialist', 'active',
   '["sdr_inbound", "social_seller_instagram", "followuper", "concierge", "scheduler", "rescheduler", "objection_handler", "reativador_base", "customersuccess"]',
   '{"model": "gemini-2.0-flash", "version": "v1.2.0", "agent_version_id": "600520c6-25aa-4091-a3e0-1344643b4dcd"}',
   's0000000-0000-0000-0000-000000000001', 0, 0, NOW());

-- ============================================================
-- 3. SQUAD MEMBERS
-- ============================================================
INSERT INTO aios_squad_members (squad_id, agent_id, role) VALUES
  -- Team Diana
  ('s0000000-0000-0000-0000-000000000001', '4ed5c420-4e99-4245-bfa5-e6238dadac95', 'lead'),
  ('s0000000-0000-0000-0000-000000000001', 'e64753dc-96d8-40e6-bbe0-4a905b7add01', 'member'),
  ('s0000000-0000-0000-0000-000000000001', '600520c6-25aa-4091-a3e0-1344643b4dcd', 'member'),
  -- Team Financeiros
  ('s0000000-0000-0000-0000-000000000002', '6c549226-8cd2-440d-9e81-6c12f19819a6', 'lead'),
  ('s0000000-0000-0000-0000-000000000002', 'b5437e3c-f53c-4780-ae21-d05e7d4a4b8e', 'member'),
  ('s0000000-0000-0000-0000-000000000002', '86b1255d-8a82-4219-9dcb-dcf3b6a58d17', 'member'),
  -- Team Saude
  ('s0000000-0000-0000-0000-000000000003', '1f8bb37f-f1c0-4ada-b72b-17845b1e6877', 'lead'),
  ('s0000000-0000-0000-0000-000000000003', '1e6cb46c-2dd1-4754-8dfc-014f801511e0', 'member'),
  ('s0000000-0000-0000-0000-000000000003', '7f878446-0000-0000-0000-000000000000', 'member'),
  ('s0000000-0000-0000-0000-000000000003', 'eb421a7d-ee91-4ea1-a8f7-f07426b2bf4c', 'member'),
  -- Team BPOSS
  ('s0000000-0000-0000-0000-000000000004', 'f21fb515-907a-4dd2-95a1-5092f59f57cb', 'lead'),
  -- Team Marcos Social
  ('s0000000-0000-0000-0000-000000000005', '4b038b87-31eb-4f31-8cf0-d5b761d29db7', 'lead');

-- ============================================================
-- 4. BUDGET REAL (global mensal)
-- ============================================================
INSERT INTO aios_cost_budgets (name, period, budget_amount, alert_threshold, squad_id, is_active) VALUES
  ('Budget Global Mensal', 'monthly', 100.00, 80, NULL, true),
  ('Budget Financeiros', 'monthly', 30.00, 85, 's0000000-0000-0000-0000-000000000002', true),
  ('Budget Saude', 'monthly', 25.00, 85, 's0000000-0000-0000-0000-000000000003', true),
  ('Budget Diana', 'monthly', 20.00, 80, 's0000000-0000-0000-0000-000000000001', true);

-- ============================================================
-- VERIFICACAO
-- ============================================================
SELECT 'aios_squads' as tabela, count(*) from aios_squads
UNION ALL SELECT 'aios_agents', count(*) from aios_agents
UNION ALL SELECT 'aios_squad_members', count(*) from aios_squad_members
UNION ALL SELECT 'aios_cost_budgets', count(*) from aios_cost_budgets;
