-- =============================================================================
-- Migration: 009_auth_tenant.sql
-- Purpose: Setup multi-tenant architecture with Supabase Auth + RLS
-- Date: 2026-01-29
-- Author: Claude (subagent executor-auth)
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE TENANTS TABLE
-- =============================================================================

-- Tabela de tenants (empresas/clientes SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link para auth.users do Supabase
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados da empresa
    company_name TEXT,
    slug TEXT UNIQUE, -- URL-friendly identifier
    
    -- Plano e billing
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    plan_limits JSONB DEFAULT '{
        "max_leads": 100,
        "max_messages_per_day": 50,
        "max_accounts": 1,
        "features": ["basic_scraping", "lead_scoring"]
    }'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    trial_ends_at TIMESTAMPTZ,
    
    -- Configurações do tenant
    settings JSONB DEFAULT '{
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "notifications_enabled": true
    }'::jsonb,
    
    -- GHL Integration (se aplicável)
    ghl_location_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tenants_ghl ON public.tenants(ghl_location_id) WHERE ghl_location_id IS NOT NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON public.tenants;
CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_updated_at();


-- =============================================================================
-- PART 2: ADD tenant_id TO growth_leads (IF NOT EXISTS)
-- =============================================================================

-- Verifica se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'growth_leads' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.growth_leads 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        
        -- Index para queries por tenant
        CREATE INDEX idx_growth_leads_tenant ON public.growth_leads(tenant_id);
    END IF;
END $$;


-- =============================================================================
-- PART 3: ENABLE RLS ON TABLES
-- =============================================================================

-- Habilitar RLS na tabela tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela growth_leads
ALTER TABLE public.growth_leads ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- PART 4: CREATE RLS POLICIES
-- =============================================================================

-- -----------------------------------------
-- TENANTS TABLE POLICIES
-- -----------------------------------------

-- Policy: Usuários podem ver apenas seu próprio tenant
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seu próprio tenant
DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;
CREATE POLICY "Users can update own tenant" ON public.tenants
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Service role pode fazer tudo (para APIs administrativas)
DROP POLICY IF EXISTS "Service role full access to tenants" ON public.tenants;
CREATE POLICY "Service role full access to tenants" ON public.tenants
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- -----------------------------------------
-- GROWTH_LEADS TABLE POLICIES
-- -----------------------------------------

-- Função helper para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT id FROM public.tenants WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policy: Usuários veem apenas leads do seu tenant
DROP POLICY IF EXISTS "Tenant isolation for leads SELECT" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads SELECT" ON public.growth_leads
    FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Policy: Usuários podem inserir leads apenas no seu tenant
DROP POLICY IF EXISTS "Tenant isolation for leads INSERT" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads INSERT" ON public.growth_leads
    FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Policy: Usuários podem atualizar leads apenas do seu tenant
DROP POLICY IF EXISTS "Tenant isolation for leads UPDATE" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads UPDATE" ON public.growth_leads
    FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Policy: Usuários podem deletar leads apenas do seu tenant
DROP POLICY IF EXISTS "Tenant isolation for leads DELETE" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads DELETE" ON public.growth_leads
    FOR DELETE
    USING (tenant_id = get_user_tenant_id());

-- Policy: Service role pode acessar tudo (para webhooks e jobs)
DROP POLICY IF EXISTS "Service role full access to leads" ON public.growth_leads;
CREATE POLICY "Service role full access to leads" ON public.growth_leads
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- PART 5: USEFUL FUNCTIONS
-- =============================================================================

-- Função para criar tenant automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.tenants (user_id, company_name, slug, plan, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Minha Empresa'),
        LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'company_name', NEW.email), '[^a-zA-Z0-9]', '-', 'g')),
        'free',
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar tenant automaticamente quando um usuário se cadastra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- Função para obter informações completas do tenant atual
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS JSON AS $$
DECLARE
    tenant_info JSON;
BEGIN
    SELECT json_build_object(
        'id', t.id,
        'company_name', t.company_name,
        'slug', t.slug,
        'plan', t.plan,
        'plan_limits', t.plan_limits,
        'status', t.status,
        'settings', t.settings,
        'created_at', t.created_at
    ) INTO tenant_info
    FROM public.tenants t
    WHERE t.user_id = auth.uid();
    
    RETURN tenant_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Função para contar leads do tenant (respeitando limites)
CREATE OR REPLACE FUNCTION get_tenant_lead_count()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_leads', COUNT(*),
        'max_leads', (t.plan_limits ->> 'max_leads')::INT,
        'remaining', (t.plan_limits ->> 'max_leads')::INT - COUNT(*)::INT
    ) INTO result
    FROM public.tenants t
    LEFT JOIN public.growth_leads gl ON gl.tenant_id = t.id
    WHERE t.user_id = auth.uid()
    GROUP BY t.id, t.plan_limits;
    
    RETURN COALESCE(result, '{"total_leads": 0, "max_leads": 100, "remaining": 100}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- =============================================================================
-- PART 6: COMMENTS/DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant SaaS table - cada usuário tem um tenant';
COMMENT ON COLUMN public.tenants.user_id IS 'Referência para auth.users do Supabase';
COMMENT ON COLUMN public.tenants.plan IS 'Plano atual: free, starter, pro, enterprise';
COMMENT ON COLUMN public.tenants.plan_limits IS 'Limites do plano em JSONB (max_leads, max_messages_per_day, etc)';

COMMENT ON FUNCTION get_user_tenant_id() IS 'Retorna o tenant_id do usuário autenticado (para RLS)';
COMMENT ON FUNCTION get_current_tenant() IS 'Retorna informações completas do tenant do usuário';
COMMENT ON FUNCTION handle_new_user() IS 'Trigger que cria automaticamente um tenant para novos usuários';


-- =============================================================================
-- VERIFICATION QUERIES (run manually to test)
-- =============================================================================

-- Check if tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenants', 'growth_leads');

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('tenants', 'growth_leads');

-- Check policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Test get_current_tenant() (execute as authenticated user):
-- SELECT get_current_tenant();
