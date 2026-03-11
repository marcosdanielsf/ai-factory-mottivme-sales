
-- Tabela de Clientes (Base do Dashboard)
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  empresa text not null,
  email text,
  telefone text,
  vertical text, -- 'clinicas', 'mentores', etc.
  status text default 'cliente', -- 'prospect', 'cliente', 'churned'
  avatar text,
  revenue numeric default 0,
  score numeric default 0
);

-- Tabela de Configuração dos Agentes (O Coração da IA)
-- Aqui ficam os prompts dos "Set Nodes" (Avatares) e o Prompt de Sistema
create table public.agent_configs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id) not null,
  versao text default 'v1.0',
  system_prompt text, -- Prompt Geral (Main Agent)
  prompts_por_modo jsonb default '{}'::jsonb, -- JSON com os prompts de cada Avatar: { "first_contact": "...", "scheduler": "..." }
  tools_config jsonb default '{}'::jsonb, -- Configuração das ferramentas ativas
  is_active boolean default true
);

-- Tabela de Leads/Agendamentos (Para a página Leads e KPIs)
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id),
  name text not null,
  email text,
  phone text,
  status text default 'new', -- 'scheduled', 'completed', 'no-show'
  scheduled_date timestamp with time zone,
  conversation_summary text
);

-- Tabela de Chamadas/Conversas (Para métricas e histórico)
create table public.calls (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_id uuid references public.clients(id),
  titulo text,
  tipo text, -- 'diagnostico', 'suporte', etc.
  status text, -- 'analisado', 'pendente'
  duration_seconds integer,
  recording_url text
);

-- RLS (Row Level Security) - Opcional para início, mas recomendado
alter table public.clients enable row level security;
alter table public.agent_configs enable row level security;
alter table public.leads enable row level security;
alter table public.calls enable row level security;

-- Políticas de acesso público (apenas para desenvolvimento rápido hoje)
create policy "Public access" on public.clients for all using (true);
create policy "Public access" on public.agent_configs for all using (true);
create policy "Public access" on public.leads for all using (true);
create policy "Public access" on public.calls for all using (true);

-- INSERÇÃO DE DADOS INICIAIS (MOCKS REAIS)
insert into public.clients (nome, empresa, vertical, status, revenue, score)
values 
('Rafael Milagre', 'Viver de IA', 'mentores', 'cliente', 150000, 98),
('Dr. Silva', 'Clínica Silva', 'medicos', 'cliente', 85000, 85),
('Pedro Tech', 'Tech Solutions', 'servicos', 'cliente', 65000, 80);

-- Inserir Configuração para o Viver de IA
with client as (select id from public.clients where empresa = 'Viver de IA' limit 1)
insert into public.agent_configs (client_id, system_prompt, prompts_por_modo)
select 
  id, 
  '**CONTEXTO**\nVocê é a Nina...', 
  '{
    "first_contact": "Você é a Nina, SDR da Viver de IA. Identifique o lead com carisma.",
    "scheduler": "Foco total em agendar a reunião. Ofereça horários.",
    "concierge": "Tire dúvidas sobre a mentoria."
  }'::jsonb
from client;
