-- ============================================
-- EXECUTE TODAS AS MIGRATIONS DE UMA VEZ
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk/sql
-- ============================================

-- ============================================
-- MIGRATION 009: AUTH & TENANT
-- ============================================

-- Tabela de tenants (empresas/clientes SaaS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    slug TEXT UNIQUE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    plan_limits JSONB DEFAULT '{
        "max_leads": 100,
        "max_messages_per_day": 50,
        "max_accounts": 1,
        "features": ["basic_scraping", "lead_scoring"]
    }'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    trial_ends_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR",
        "notifications_enabled": true
    }'::jsonb,
    ghl_location_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tenants
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status) WHERE status = 'active';

-- Trigger updated_at para tenants
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

-- Adicionar tenant_id em growth_leads
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'growth_leads' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.growth_leads 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_growth_leads_tenant ON public.growth_leads(tenant_id);
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_leads ENABLE ROW LEVEL SECURITY;

-- Policies para tenants
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tenant" ON public.tenants;
CREATE POLICY "Users can update own tenant" ON public.tenants
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to tenants" ON public.tenants;
CREATE POLICY "Service role full access to tenants" ON public.tenants
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Função helper para tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT id FROM public.tenants WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policies para growth_leads
DROP POLICY IF EXISTS "Tenant isolation for leads SELECT" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads SELECT" ON public.growth_leads
    FOR SELECT USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for leads INSERT" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads INSERT" ON public.growth_leads
    FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for leads UPDATE" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads UPDATE" ON public.growth_leads
    FOR UPDATE USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for leads DELETE" ON public.growth_leads;
CREATE POLICY "Tenant isolation for leads DELETE" ON public.growth_leads
    FOR DELETE USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Service role full access to leads" ON public.growth_leads;
CREATE POLICY "Service role full access to leads" ON public.growth_leads
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger para criar tenant automaticamente
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Funções úteis
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

-- ============================================
-- MIGRATION 009b: FIX ORPHAN LEADS
-- ============================================

-- Criar tenant padrão se não existir nenhum
INSERT INTO public.tenants (
    id, company_name, slug, plan, status, settings
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Sistema (Leads Legados)',
    'sistema-legado',
    'free',
    'active',
    '{"is_system": true, "migration_created": true}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.tenants LIMIT 1);

-- Atribuir leads órfãos ao primeiro tenant
UPDATE public.growth_leads 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- ============================================
-- MIGRATION 010: INSTAGRAM SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS instagram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    session_id_encrypted TEXT NOT NULL,
    user_id_ig TEXT,
    full_name TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    is_business BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'pending_validation')),
    last_validated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    validation_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_tenant_id ON instagram_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_username ON instagram_sessions(username);
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_status ON instagram_sessions(status);
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_tenant_status ON instagram_sessions(tenant_id, status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_instagram_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_instagram_sessions_updated_at ON instagram_sessions;
CREATE TRIGGER trigger_instagram_sessions_updated_at
    BEFORE UPDATE ON instagram_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_instagram_sessions_updated_at();

-- RLS para instagram_sessions
ALTER TABLE instagram_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for instagram_sessions" ON instagram_sessions;
CREATE POLICY "Tenant isolation for instagram_sessions" ON instagram_sessions
    FOR ALL USING (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Service role full access to instagram_sessions" ON instagram_sessions;
CREATE POLICY "Service role full access to instagram_sessions" ON instagram_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Tabela de audit
CREATE TABLE IF NOT EXISTS instagram_sessions_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES instagram_sessions(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'validated', 'expired', 'blocked', 'deleted', 'rotated')),
    old_status TEXT,
    new_status TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_audit_session_id ON instagram_sessions_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_audit_created_at ON instagram_sessions_audit(created_at);

-- Função de audit
CREATE OR REPLACE FUNCTION log_instagram_session_audit(
    p_session_id UUID,
    p_action TEXT,
    p_old_status TEXT DEFAULT NULL,
    p_new_status TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO instagram_sessions_audit (
        session_id, action, old_status, new_status, details, ip_address, user_agent
    ) VALUES (
        p_session_id, p_action, p_old_status, p_new_status, p_details, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_audit_id;
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

DO $$
DECLARE
    tenants_count INTEGER;
    sessions_table_exists BOOLEAN;
    orphan_leads INTEGER;
BEGIN
    -- Contar tenants
    SELECT COUNT(*) INTO tenants_count FROM public.tenants;
    RAISE NOTICE '✅ Tenants criados: %', tenants_count;
    
    -- Verificar tabela instagram_sessions
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'instagram_sessions'
    ) INTO sessions_table_exists;
    
    IF sessions_table_exists THEN
        RAISE NOTICE '✅ Tabela instagram_sessions criada';
    ELSE
        RAISE NOTICE '❌ Tabela instagram_sessions NÃO criada';
    END IF;
    
    -- Verificar leads órfãos
    SELECT COUNT(*) INTO orphan_leads FROM public.growth_leads WHERE tenant_id IS NULL;
    IF orphan_leads = 0 THEN
        RAISE NOTICE '✅ Nenhum lead órfão';
    ELSE
        RAISE NOTICE '⚠️ Leads órfãos restantes: %', orphan_leads;
    END IF;
    
    RAISE NOTICE '🎉 MIGRATIONS EXECUTADAS COM SUCESSO!';
END $$;
