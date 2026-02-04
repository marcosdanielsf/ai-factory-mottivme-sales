
-- SCHEMA BRIDGE: UNIFICANDO MOTTIVME DASHBOARD + AI FACTORY
-- Este arquivo garante compatibilidade entre o código React existente e a nova arquitetura.

-- Habilita UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LEADS (Mantido)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ghl_contact_id TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'new_lead',
    work_permit BOOLEAN,
    location_country TEXT,
    career_segment TEXT,
    budget_range TEXT,
    acquisition_channel TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENTS (Personas)
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    base_personality TEXT,
    current_version_id UUID, -- FK adicionada via alter table abaixo
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGENT_VERSIONS (Antigo prompt_versions - Compatível com Dashboard)
CREATE TABLE public.agent_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id) NOT NULL,
    version_number TEXT NOT NULL,
    
    -- O Prompt
    system_prompt TEXT NOT NULL,
    prompts_por_modo JSONB DEFAULT '{}'::jsonb, -- Sets do n8n
    
    -- Metadados
    change_log TEXT,
    parent_version_id UUID REFERENCES public.agent_versions(id),
    
    -- Métricas
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    avg_interactions_to_goal INT DEFAULT 0,
    
    status TEXT DEFAULT 'sandbox', -- 'production', 'sandbox', 'archived', 'draft'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar FK circular
ALTER TABLE public.agents ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id) REFERENCES public.agent_versions(id);

-- 4. AGENT_CONVERSATIONS (Antigo messages - Compatível com Dashboard)
CREATE TABLE public.agent_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    agent_id UUID REFERENCES public.agents(id),
    
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT,
    channel TEXT,
    
    -- Metadados
    tokens_used INT,
    cost_usd NUMERIC(10,6),
    sentiment_score NUMERIC,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SALES_CALLS (Mantido)
CREATE TABLE public.sales_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    closer_agent_id UUID REFERENCES public.agents(id),
    audio_url TEXT,
    transcript_text TEXT,
    analysis_data JSONB,
    deal_outcome TEXT,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONTRACTS (Mantido)
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    amount_value NUMERIC(10,2),
    product_name TEXT,
    payment_terms TEXT,
    status TEXT DEFAULT 'draft',
    contract_url TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FACTORY_ARTIFACTS (Mantido)
CREATE TABLE public.factory_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    artifact_type TEXT,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. IMPROVEMENT_LOGS (Mantido)
CREATE TABLE public.improvement_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id),
    evaluated_version_id UUID REFERENCES public.agent_versions(id),
    issue_detected TEXT,
    suggested_fix TEXT,
    severity TEXT,
    is_implemented BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AGENTTEST_RUNS (Nova tabela para Validação V4)
CREATE TABLE public.agenttest_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_version_id UUID REFERENCES public.agent_versions(id),
    total_tests INT,
    passed_tests INT,
    failed_tests INT,
    html_report_url TEXT,
    status TEXT, -- 'running', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POLÍTICAS DE ACESSO (DEV)
create policy "Public Access" on public.leads for all using (true);
create policy "Public Access" on public.agents for all using (true);
create policy "Public Access" on public.agent_versions for all using (true);
create policy "Public Access" on public.agent_conversations for all using (true);
create policy "Public Access" on public.sales_calls for all using (true);
create policy "Public Access" on public.contracts for all using (true);
create policy "Public Access" on public.factory_artifacts for all using (true);
create policy "Public Access" on public.improvement_logs for all using (true);
create policy "Public Access" on public.agenttest_runs for all using (true);

alter table public.leads enable row level security;
alter table public.agents enable row level security;
alter table public.agent_versions enable row level security;
alter table public.agent_conversations enable row level security;
alter table public.sales_calls enable row level security;
alter table public.contracts enable row level security;
alter table public.factory_artifacts enable row level security;
alter table public.improvement_logs enable row level security;
alter table public.agenttest_runs enable row level security;

-- SEED DATA (Mocks Reais)
INSERT INTO public.agents (slug, name, role, description, base_personality)
VALUES ('nina_viverdeia', 'Nina', 'SDR', 'SDR focada em agendar mentorias', 'Calorosa, usa emojis, objetiva');

DO $$
DECLARE
    agent_uuid UUID;
BEGIN
    SELECT id INTO agent_uuid FROM public.agents WHERE slug = 'nina_viverdeia';

    -- Versão 1.0 (Produção)
    INSERT INTO public.agent_versions (agent_id, version_number, system_prompt, prompts_por_modo, status)
    VALUES (
        agent_uuid,
        '1.0',
        'Você é a Nina. Sua missão é agendar.',
        '{ "first_contact": "Olá! Sou a Nina...", "scheduler": "Qual melhor horário?" }'::jsonb,
        'production'
    );
    
    -- Versão 1.1 (Sandbox - Teste)
    INSERT INTO public.agent_versions (agent_id, version_number, system_prompt, prompts_por_modo, status)
    VALUES (
        agent_uuid,
        '1.1-beta',
        'Você é a Nina 2.0. Mais agressiva nas vendas.',
        '{ "first_contact": "Oi! Vamos fechar?", "scheduler": "Tenho horário agora." }'::jsonb,
        'sandbox'
    );
END $$;
