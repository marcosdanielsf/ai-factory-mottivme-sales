
-- SCHEMA OFICIAL: MOTTIVME CONTROL TOWER (AI FACTORY V3/V4 + SALES OS)
-- Fonte da Verdade para n8n, Python e React Dashboard

-- Habilita UUIDs para IDs seguros
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Central de LEADS (O coração do CRM - Sales OS)
-- Alimenta: Dashboard de Pipeline e Camada 1 (Aquisição)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ghl_contact_id TEXT UNIQUE, -- ID do GoHighLevel para sincronia
    name TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'new_lead', -- new_lead, qualified, call_booked, proposal, won, lost
    
    -- Dados de Qualificação (Camada 1 & 4)
    work_permit BOOLEAN,
    location_country TEXT, -- 'BR', 'US', etc
    career_segment TEXT, -- 'TI', 'Saúde', etc
    budget_range TEXT,
    
    -- Metadados de Negócio
    acquisition_channel TEXT, -- 'Instagram', 'Ads', 'Referral'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de AGENTES (Definição das Personas - Factory)
-- Alimenta: Camada 1 (Seleção) e Camada 5 (Factory)
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- ex: 'sdr_carreira', 'closer_alpha', 'nina_viverdeia'
    name TEXT NOT NULL, -- Ex: 'Nina'
    role TEXT NOT NULL, -- 'SDR', 'Closer', 'Support'
    description TEXT,
    
    -- Configurações Base
    base_personality TEXT, -- Extraído pelo AI Factory
    current_version_id UUID, -- Link para a versão ativa do prompt (FK será adicionada após criar tabela versions)
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de VERSÕES DE PROMPT (O Cérebro Evolutivo - AI Factory)
-- Alimenta: Camada 6 (Loop) e Camada 7 (Prompt Studio)
CREATE TABLE public.prompt_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id) NOT NULL,
    version_number TEXT NOT NULL, -- '1.0', '1.1', '2.0-beta'
    
    -- O Prompt Real
    system_prompt TEXT NOT NULL,
    
    -- Novo: Prompts Específicos por Modo (Sets do n8n)
    prompts_por_modo JSONB DEFAULT '{}'::jsonb, -- { "first_contact": "...", "scheduler": "..." }

    -- Metadados de Evolução
    change_log TEXT, -- "Ajuste para objeção de preço"
    parent_version_id UUID REFERENCES public.prompt_versions(id), -- De qual versão essa nasceu
    
    -- Métricas de Performance desta Versão (Atualizadas pelo Batch Job Python)
    conversion_rate NUMERIC(5,2) DEFAULT 0,
    avg_interactions_to_goal INT DEFAULT 0,
    
    status TEXT DEFAULT 'sandbox', -- 'production', 'sandbox', 'archived', 'draft'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualizar FK circular em agents
ALTER TABLE public.agents ADD CONSTRAINT fk_current_version FOREIGN KEY (current_version_id) REFERENCES public.prompt_versions(id);

-- 4. Tabela de INTERAÇÕES / MENSAGENS (Memória Conversacional - Logs)
-- Alimenta: Camada 1 (Contexto) e Debug
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    agent_id UUID REFERENCES public.agents(id), -- Quem falou (se foi IA)
    
    role TEXT NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT,
    channel TEXT, -- 'whatsapp', 'instagram', 'sms'
    
    -- Metadados Técnicos
    tokens_used INT,
    cost_usd NUMERIC(10,6),
    sentiment_score NUMERIC, -- -1 (Irritado) a 1 (Feliz)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de CALLS (Camada 2 - Fechamento)
-- Alimenta: Call Analyzer e CRM
CREATE TABLE public.sales_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    closer_agent_id UUID REFERENCES public.agents(id),
    
    audio_url TEXT,
    transcript_text TEXT,
    
    -- A Mágica: JSONB para armazenar a análise flexível da IA
    -- Ex: { "bant_score": 80, "objections": ["price", "spouse"], "emotional_triggers": ["fear_of_missing_out"] }
    analysis_data JSONB,
    
    deal_outcome TEXT, -- 'closed', 'follow_up', 'lost'
    duration_seconds INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de CONTRATOS INTELIGENTES (Camada 3)
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id),
    
    -- Dados do Deal
    amount_value NUMERIC(10,2),
    product_name TEXT,
    payment_terms TEXT,
    
    -- Status do Fluxo
    status TEXT DEFAULT 'draft', -- 'generated', 'sent', 'viewed', 'signed'
    contract_url TEXT,
    signed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de KNOWLEDGE BASE / FACTORY (Camada 5 - Artifacts)
-- Armazena os documentos gerados pelo "Gestor Roteador"
CREATE TABLE public.factory_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id), -- Se for onboarding de um cliente
    
    artifact_type TEXT, -- 'persona_analysis', 'objection_map', 'tone_guide'
    title TEXT, -- Adicionado para listagem no frontend
    content TEXT, -- Markdown ou JSON
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de REFLEXÃO E MÉTRICAS (Camada 6 - Loop)
-- O "Juiz" escreve aqui (Python LLM-as-a-Judge)
CREATE TABLE public.improvement_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES public.agents(id),
    evaluated_version_id UUID REFERENCES public.prompt_versions(id),
    
    -- O Insight
    issue_detected TEXT, -- "Alta taxa de queda ao pedir preço"
    suggested_fix TEXT, -- "Ancorar valor antes"
    severity TEXT, -- 'high', 'medium', 'low'
    
    is_implemented BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR RLS PARA SEGURANÇA BÁSICA (Permitir tudo por enquanto para dev rápido)
alter table public.leads enable row level security;
create policy "Public Access" on public.leads for all using (true);

alter table public.agents enable row level security;
create policy "Public Access" on public.agents for all using (true);

alter table public.prompt_versions enable row level security;
create policy "Public Access" on public.prompt_versions for all using (true);

alter table public.messages enable row level security;
create policy "Public Access" on public.messages for all using (true);

alter table public.sales_calls enable row level security;
create policy "Public Access" on public.sales_calls for all using (true);

alter table public.contracts enable row level security;
create policy "Public Access" on public.contracts for all using (true);

alter table public.factory_artifacts enable row level security;
create policy "Public Access" on public.factory_artifacts for all using (true);

alter table public.improvement_logs enable row level security;
create policy "Public Access" on public.improvement_logs for all using (true);

-- SEED DATA (Mocks Reais para Teste Imediato)
INSERT INTO public.agents (slug, name, role, description, base_personality)
VALUES ('nina_viverdeia', 'Nina', 'SDR', 'SDR focada em agendar mentorias', 'Calorosa, usa emojis, objetiva');

-- Pegar o ID do agente criado
DO $$
DECLARE
    agent_uuid UUID;
BEGIN
    SELECT id INTO agent_uuid FROM public.agents WHERE slug = 'nina_viverdeia';

    -- Criar Versão 1.0
    INSERT INTO public.prompt_versions (agent_id, version_number, system_prompt, prompts_por_modo, status)
    VALUES (
        agent_uuid,
        '1.0',
        'Você é a Nina. Sua missão é agendar.',
        '{ "first_contact": "Olá! Sou a Nina...", "scheduler": "Qual melhor horário?" }'::jsonb,
        'production'
    );
END $$;
