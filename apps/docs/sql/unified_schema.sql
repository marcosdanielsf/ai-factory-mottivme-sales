
-- SCHEMA UNIFICADO: MOTTIVME AI FACTORY V3/V4 + SALES OS
-- Este schema consolida as necessidades de automação (n8n), validação (Python) e visualização (React).

-- 1. TABELA DE CLIENTES (Sales OS + Multi-Tenancy)
-- Representa a empresa que contratou o agente.
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null, -- Nome do responsável (Ex: Rafael Milagre)
  empresa text not null, -- Nome da empresa (Ex: Viver de IA)
  email text,
  telefone text,
  vertical text, -- 'mentores', 'clinicas', etc.
  status text default 'active', -- 'active', 'churned', 'onboarding'
  ghl_location_id text, -- ID de conexão com GoHighLevel
  avatar_url text,
  settings jsonb default '{}'::jsonb -- Configs gerais
);

-- 2. VERSÕES DO AGENTE (AI Factory V3 - Core)
-- Onde vive o "Cérebro". O n8n lê daqui para saber como agir.
-- O Python/Judge gera novas versões aqui quando falhas são detectadas.
create table public.agent_versions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  version_number text not null, -- Ex: 'v2.1'
  system_prompt text, -- O Prompt Principal
  prompts_por_modo jsonb default '{}'::jsonb, -- Prompts específicos (First Contact, Scheduler, etc.)
  hyperpersonalization_config jsonb default '{}'::jsonb, -- Dados de contexto extraídos do Onboarding
  validation_status text default 'draft', -- 'draft', 'pending_approval', 'active', 'rejected', 'archived'
  changelog text, -- O que mudou nesta versão? (Gerado pela IA ou humano)
  is_active boolean default false -- Apenas UMA versão ativa por cliente
);

-- 3. CONVERSAS & LOGS (Monitoramento em Tempo Real)
-- O n8n escreve aqui cada interação. O React lê para a aba "Logs".
create table public.agent_conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  agent_version_id uuid references public.agent_versions(id), -- Qual versão estava rodando?
  lead_phone text, -- Identificador do lead
  platform text default 'whatsapp', -- 'whatsapp', 'instagram', 'web'
  message_content text,
  direction text, -- 'inbound' (Lead) ou 'outbound' (Agente)
  metadata jsonb default '{}'::jsonb -- Tokens usados, latência, tool calls
);

-- 4. ANÁLISE DE QUALIDADE (V3 QA Analyst)
-- O Agente de QA (n8n) analisa as conversas e salva aqui.
create table public.qa_analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  conversation_id uuid references public.agent_conversations(id), -- Se for análise de msg única
  client_id uuid references public.clients(id),
  score integer, -- 0 a 100
  analysis_text text, -- "O agente foi rude...", "O agente seguiu o script..."
  issues_detected jsonb default '[]'::jsonb, -- Tags: ['hallucination', 'rude', 'missed_tool_call']
  suggested_fix text -- Sugestão de melhoria para o próximo prompt
);

-- 5. TESTES AUTOMATIZADOS (V4 Testing Framework)
-- Resultados dos testes em lote rodados pelo Python.
create table public.agenttest_runs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  agent_version_id uuid references public.agent_versions(id),
  total_tests integer,
  passed_tests integer,
  failed_tests integer,
  html_report_url text, -- Link para o relatório detalhado
  status text -- 'running', 'completed', 'failed'
);

-- 6. ARTEFATOS & CONTRATOS (Sales OS + Onboarding)
-- Documentos gerados durante o ciclo de vida.
create table public.factory_artifacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  type text, -- 'contract', 'onboarding_summary', 'persona_doc'
  title text,
  content text, -- Texto puro ou Markdown
  file_url text, -- Se for PDF/Doc
  metadata jsonb default '{}'::jsonb
);

-- 7. LEADS (Sales OS - Funil)
-- Tabela simplificada de leads para KPIs.
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  name text,
  phone text,
  email text,
  status text default 'new', -- 'new', 'qualified', 'scheduled', 'closed'
  last_interaction_at timestamp with time zone
);

-- RLS (Row Level Security) - Habilitar para produção
alter table public.clients enable row level security;
alter table public.agent_versions enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.qa_analyses enable row level security;
alter table public.agenttest_runs enable row level security;
alter table public.factory_artifacts enable row level security;
alter table public.leads enable row level security;

-- Políticas de desenvolvimento (Acesso Total - CUIDADO EM PROD)
create policy "Dev Access" on public.clients for all using (true);
create policy "Dev Access" on public.agent_versions for all using (true);
create policy "Dev Access" on public.agent_conversations for all using (true);
create policy "Dev Access" on public.qa_analyses for all using (true);
create policy "Dev Access" on public.agenttest_runs for all using (true);
create policy "Dev Access" on public.factory_artifacts for all using (true);
create policy "Dev Access" on public.leads for all using (true);

-- DADOS DE EXEMPLO (SEED)
-- Inserir Cliente
insert into public.clients (id, nome, empresa, vertical, status)
values 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rafael Milagre', 'Viver de IA', 'mentores', 'active');

-- Inserir Versão v1.0
insert into public.agent_versions (client_id, version_number, system_prompt, prompts_por_modo, validation_status, is_active)
values 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'v1.0', 'Você é a Nina...', 
 '{ "first_contact": "Olá, sou a Nina...", "scheduler": "Vamos agendar?" }'::jsonb, 
 'active', true);

-- Inserir Versão v1.1 (Draft/Sugestão de melhoria)
insert into public.agent_versions (client_id, version_number, system_prompt, prompts_por_modo, validation_status, is_active, changelog)
values 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'v1.1', 'Você é a Nina (Melhorada)...', 
 '{ "first_contact": "Olá, sou a Nina da Viver de IA...", "scheduler": "Posso sugerir terça?" }'::jsonb, 
 'pending_approval', false, 'Melhoria na saudação para ser menos robótica baseada na análise QA #123.');
