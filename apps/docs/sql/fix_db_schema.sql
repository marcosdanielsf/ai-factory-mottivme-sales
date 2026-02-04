-- Fix missing tables and columns

-- 1. Create factory_artifacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.factory_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    client_id UUID REFERENCES public.clients(id) NOT NULL,
    type TEXT, -- 'contract', 'onboarding_summary', 'persona_doc'
    title TEXT,
    content TEXT, -- Texto puro ou Markdown
    file_url TEXT, -- Se for PDF/Doc
    metadata jsonb default '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.factory_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.factory_artifacts FOR ALL USING (true);

-- 2. Check if agent_versions uses 'version' or 'version_number'
-- We can't easily rename conditionally in SQL without a function, 
-- but we can ensure the code handles both.

-- 3. Ensure clients table exists (it seems to exist but maybe missing data)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nome TEXT NOT NULL,
    empresa TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    vertical TEXT,
    status TEXT DEFAULT 'active',
    ghl_location_id TEXT,
    avatar_url TEXT,
    settings jsonb default '{}'::jsonb
);

-- Enable RLS for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.clients FOR ALL USING (true);
