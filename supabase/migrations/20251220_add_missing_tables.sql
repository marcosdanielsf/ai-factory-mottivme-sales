-- ============================================
-- MOTTIVME AI Factory - ADD MISSING TABLES
-- Este script adiciona APENAS as tabelas que faltam
-- SEM dropar as existentes (agent_versions, clients, agent_metrics)
-- ============================================

-- Enable UUID extension (caso nao exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AGENCIES TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  logo_url TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_id);

-- ============================================
-- 2. SUB_ACCOUNTS TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS sub_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  owner_email TEXT,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise')),
  vertical TEXT CHECK (vertical IN ('clinicas', 'financeiro', 'servicos', 'mentores', 'outros')),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_sub_accounts_agency ON sub_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_slug ON sub_accounts(agency_id, slug);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_owner_email ON sub_accounts(owner_email);

-- ============================================
-- 3. USER_PROFILES TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'sub_account_user' CHECK (role IN (
    'super_admin',
    'agency_owner',
    'agency_admin',
    'agency_support',
    'sub_account_owner',
    'sub_account_admin',
    'sub_account_user'
  )),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_agency ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_sub_account ON user_profiles(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 4. LEADS TABLE (NOVA - separada de sales_intelligence.leads)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  ghl_contact_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'scheduled', 'completed', 'no_show', 'lost')),
  scheduled_date TIMESTAMPTZ,
  qualification_score INTEGER,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_sub_account ON leads(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_scheduled ON leads(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- ============================================
-- 5. CONVERSATIONS TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'messenger', 'web', 'sms')),
  external_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  messages_count INTEGER DEFAULT 0,
  user_messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_conversations_sub_account ON conversations(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- ============================================
-- 6. PROMPT_CHANGE_REQUESTS TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('revision', 'hotfix', 'rollback', 'new_feature')),
  title TEXT NOT NULL,
  description TEXT,
  changes_summary TEXT,
  old_prompt TEXT,
  new_prompt TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'implemented')),
  requested_by UUID,
  reviewed_by UUID,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prompt_changes_sub_account ON prompt_change_requests(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_changes_status ON prompt_change_requests(status);

-- ============================================
-- 7. KNOWLEDGE_BASE TABLE (NOVA no schema public)
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_sub_account ON knowledge_base(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

-- ============================================
-- 8. AUDIT_LOG TABLE (NOVA)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_agency ON audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_sub_account ON audit_log(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- 9. ATUALIZAR TABELAS EXISTENTES
-- Adicionar sub_account_id nas tabelas que ja existem
-- ============================================

-- Adicionar sub_account_id em clients (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'sub_account_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_clients_sub_account ON clients(sub_account_id);
  END IF;
END $$;

-- Adicionar sub_account_id em agent_versions (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_versions' AND column_name = 'sub_account_id'
  ) THEN
    ALTER TABLE agent_versions ADD COLUMN sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_agent_versions_sub_account ON agent_versions(sub_account_id);
  END IF;
END $$;

-- Adicionar sub_account_id em agent_metrics (se nao existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_metrics' AND column_name = 'sub_account_id'
  ) THEN
    ALTER TABLE agent_metrics ADD COLUMN sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_agent_metrics_sub_account ON agent_metrics(sub_account_id);
  END IF;
END $$;

-- ============================================
-- 10. TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers apenas para tabelas novas
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_accounts_updated_at ON sub_accounts;
CREATE TRIGGER update_sub_accounts_updated_at
  BEFORE UPDATE ON sub_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. SEED: MOTTIVME AGENCY
-- ============================================

INSERT INTO agencies (name, slug, plan, settings) VALUES (
  'MOTTIVME',
  'mottivme',
  'enterprise',
  '{
    "branding": {
      "primaryColor": "#8b5cf6",
      "secondaryColor": "#3b82f6"
    },
    "features": {
      "whiteLabel": true,
      "customDomain": true,
      "apiAccess": true,
      "advancedAnalytics": true
    }
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 12. ENABLE RLS
-- ============================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas existentes tambem
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
DECLARE
  agency UUID;
BEGIN
  SELECT agency_id INTO agency
  FROM user_profiles
  WHERE id = auth.uid();
  RETURN agency;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_sub_account_id()
RETURNS UUID AS $$
DECLARE
  sub_acc UUID;
BEGIN
  SELECT sub_account_id INTO sub_acc
  FROM user_profiles
  WHERE id = auth.uid();
  RETURN sub_acc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agency_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('agency_owner', 'agency_admin', 'agency_support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_sub_account_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('sub_account_owner', 'sub_account_admin', 'sub_account_user')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION sub_account_in_user_agency(sa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF sa_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM sub_accounts sa
    JOIN user_profiles up ON up.agency_id = sa.agency_id
    WHERE sa.id = sa_id AND up.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. RLS POLICIES
-- ============================================

-- AGENCIES
CREATE POLICY "Super admins full access agencies" ON agencies FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users view own agency" ON agencies FOR SELECT TO authenticated
USING (id = get_user_agency_id());

-- SUB_ACCOUNTS
CREATE POLICY "Super admins full access sub_accounts" ON sub_accounts FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency users view sub_accounts" ON sub_accounts FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id());

CREATE POLICY "Sub-account users view own" ON sub_accounts FOR SELECT TO authenticated
USING (id = get_user_sub_account_id());

-- USER_PROFILES
CREATE POLICY "Super admins full access profiles" ON user_profiles FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users view own profile" ON user_profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- CLIENTS
CREATE POLICY "Super admins full access clients" ON clients FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency view clients" ON clients FOR SELECT TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view clients" ON clients FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- AGENT_VERSIONS
CREATE POLICY "Super admins full access agents" ON agent_versions FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency view agents" ON agent_versions FOR SELECT TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view agents" ON agent_versions FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- LEADS
CREATE POLICY "Super admins full access leads" ON leads FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency view leads" ON leads FOR SELECT TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view leads" ON leads FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- CONVERSATIONS
CREATE POLICY "Super admins full access conversations" ON conversations FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency view conversations" ON conversations FOR SELECT TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view conversations" ON conversations FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- AGENT_METRICS
CREATE POLICY "Super admins full access metrics" ON agent_metrics FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency view metrics" ON agent_metrics FOR SELECT TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view metrics" ON agent_metrics FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- PROMPT_CHANGE_REQUESTS
CREATE POLICY "Super admins full access prompts" ON prompt_change_requests FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency manage prompts" ON prompt_change_requests FOR ALL TO authenticated
USING (sub_account_in_user_agency(sub_account_id))
WITH CHECK (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view prompts" ON prompt_change_requests FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- KNOWLEDGE_BASE
CREATE POLICY "Super admins full access kb" ON knowledge_base FOR ALL TO authenticated
USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Agency manage kb" ON knowledge_base FOR ALL TO authenticated
USING (sub_account_in_user_agency(sub_account_id))
WITH CHECK (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account view kb" ON knowledge_base FOR SELECT TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- AUDIT_LOG
CREATE POLICY "Super admins view all logs" ON audit_log FOR SELECT TO authenticated
USING (is_super_admin());

CREATE POLICY "System insert logs" ON audit_log FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- VERIFICACAO FINAL
-- ============================================

SELECT 'MIGRATION COMPLETE!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
