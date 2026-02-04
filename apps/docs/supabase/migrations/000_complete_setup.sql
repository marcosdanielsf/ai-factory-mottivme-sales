-- ============================================
-- MOTTIVME AI Factory - COMPLETE DATABASE SETUP
-- Migration: 000_complete_setup
-- Description: Creates all tables + RLS policies in one file
-- ============================================
-- IMPORTANT: Run this in Supabase SQL Editor with full permissions

-- ============================================
-- PART 1: CREATE TABLES
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AGENCIES TABLE (MOTTIVME = Main Agency)
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
-- 2. SUB_ACCOUNTS TABLE (Clients)
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
-- 3. USER_PROFILES TABLE
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
-- 4. CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  ghl_contact_id TEXT,
  ghl_location_id TEXT,
  nome TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT,
  email TEXT,
  vertical TEXT CHECK (vertical IN ('clinicas', 'financeiro', 'servicos', 'mentores', 'outros')),
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'cliente', 'churned', 'reativado')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_sub_account ON clients(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_clients_ghl_contact ON clients(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ============================================
-- 5. AGENT_VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  versao TEXT NOT NULL,
  agent_type TEXT DEFAULT 'sdr' CHECK (agent_type IN ('sdr', 'social_seller', 'head_comercial', 'secretaria', 'suporte')),
  system_prompt TEXT NOT NULL,
  tools_config JSONB DEFAULT '{}',
  compliance_rules JSONB DEFAULT '{}',
  personality_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_versions_sub_account ON agent_versions(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_client ON agent_versions(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_active ON agent_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_versions_template ON agent_versions(is_template) WHERE is_template = true;

-- ============================================
-- 6. LEADS TABLE
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
-- 7. CONVERSATIONS TABLE
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
-- 8. AGENT_METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_conversations INTEGER DEFAULT 0,
  engaged_conversations INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  appointments_scheduled INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sub_account_id, agent_version_id, date)
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_sub_account ON agent_metrics(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(date);

-- ============================================
-- 9. PROMPT_CHANGE_REQUESTS TABLE
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
  requested_by UUID REFERENCES user_profiles(id),
  reviewed_by UUID REFERENCES user_profiles(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prompt_changes_sub_account ON prompt_change_requests(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_changes_status ON prompt_change_requests(status);

-- ============================================
-- 10. KNOWLEDGE_BASE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_sub_account ON knowledge_base(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

-- ============================================
-- 11. AUDIT_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
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
-- 12. UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_versions_updated_at ON agent_versions;
CREATE TRIGGER update_agent_versions_updated_at
  BEFORE UPDATE ON agent_versions
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
-- 13. SEED DATA: MOTTIVME Agency
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
-- PART 2: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's agency_id
CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's sub_account_id
CREATE OR REPLACE FUNCTION get_user_sub_account_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT sub_account_id FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is agency level
CREATE OR REPLACE FUNCTION is_agency_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('super_admin', 'agency_owner', 'agency_admin', 'agency_support')
    FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage agency
CREATE OR REPLACE FUNCTION can_manage_agency()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('super_admin', 'agency_owner', 'agency_admin')
    FROM user_profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if sub_account belongs to user's agency
CREATE OR REPLACE FUNCTION sub_account_in_user_agency(sa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return false if sa_id is NULL
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
-- AGENCIES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Super admins can view all agencies" ON agencies;
CREATE POLICY "Super admins can view all agencies"
ON agencies FOR SELECT
TO authenticated
USING (is_super_admin());

DROP POLICY IF EXISTS "Users can view their own agency" ON agencies;
CREATE POLICY "Users can view their own agency"
ON agencies FOR SELECT
TO authenticated
USING (id = get_user_agency_id());

DROP POLICY IF EXISTS "Super admins can create agencies" ON agencies;
CREATE POLICY "Super admins can create agencies"
ON agencies FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Agency owners can update their agency" ON agencies;
CREATE POLICY "Agency owners can update their agency"
ON agencies FOR UPDATE
TO authenticated
USING (id = get_user_agency_id() AND get_user_role() IN ('super_admin', 'agency_owner'));

-- ============================================
-- SUB_ACCOUNTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view sub_accounts in their agency" ON sub_accounts;
CREATE POLICY "Agency users can view sub_accounts in their agency"
ON sub_accounts FOR SELECT
TO authenticated
USING (
  agency_id = get_user_agency_id() AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their own sub_account" ON sub_accounts;
CREATE POLICY "Sub-account users can view their own sub_account"
ON sub_accounts FOR SELECT
TO authenticated
USING (
  id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Agency managers can create sub_accounts" ON sub_accounts;
CREATE POLICY "Agency managers can create sub_accounts"
ON sub_accounts FOR INSERT
TO authenticated
WITH CHECK (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

DROP POLICY IF EXISTS "Agency managers can update sub_accounts" ON sub_accounts;
CREATE POLICY "Agency managers can update sub_accounts"
ON sub_accounts FOR UPDATE
TO authenticated
USING (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

DROP POLICY IF EXISTS "Agency owners can delete sub_accounts" ON sub_accounts;
CREATE POLICY "Agency owners can delete sub_accounts"
ON sub_accounts FOR DELETE
TO authenticated
USING (
  agency_id = get_user_agency_id() AND get_user_role() IN ('super_admin', 'agency_owner')
);

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Agency users can view agency profiles" ON user_profiles;
CREATE POLICY "Agency users can view agency profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  agency_id = get_user_agency_id() AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view sub_account profiles" ON user_profiles;
CREATE POLICY "Sub-account users can view sub_account profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Agency managers can manage profiles" ON user_profiles;
CREATE POLICY "Agency managers can manage profiles"
ON user_profiles FOR ALL
TO authenticated
USING (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

-- ============================================
-- CLIENTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all clients" ON clients;
CREATE POLICY "Agency users can view all clients"
ON clients FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their clients" ON clients;
CREATE POLICY "Sub-account users can view their clients"
ON clients FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Agency managers can manage clients" ON clients;
CREATE POLICY "Agency managers can manage clients"
ON clients FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

DROP POLICY IF EXISTS "Sub-account owners can manage their clients" ON clients;
CREATE POLICY "Sub-account owners can manage their clients"
ON clients FOR ALL
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id() AND
  get_user_role() IN ('sub_account_owner', 'sub_account_admin')
);

-- ============================================
-- AGENT_VERSIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all agent versions" ON agent_versions;
CREATE POLICY "Agency users can view all agent versions"
ON agent_versions FOR SELECT
TO authenticated
USING (
  (sub_account_in_user_agency(sub_account_id) AND is_agency_user()) OR
  (is_template = true AND is_agency_user())
);

DROP POLICY IF EXISTS "Sub-account users can view their agent versions" ON agent_versions;
CREATE POLICY "Sub-account users can view their agent versions"
ON agent_versions FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Agency managers can manage agent versions" ON agent_versions;
CREATE POLICY "Agency managers can manage agent versions"
ON agent_versions FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

-- ============================================
-- LEADS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all leads" ON leads;
CREATE POLICY "Agency users can view all leads"
ON leads FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their leads" ON leads;
CREATE POLICY "Sub-account users can view their leads"
ON leads FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Managers can manage leads" ON leads;
CREATE POLICY "Managers can manage leads"
ON leads FOR ALL
TO authenticated
USING (
  (sub_account_in_user_agency(sub_account_id) AND can_manage_agency()) OR
  (sub_account_id = get_user_sub_account_id() AND get_user_role() IN ('sub_account_owner', 'sub_account_admin'))
);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all conversations" ON conversations;
CREATE POLICY "Agency users can view all conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their conversations" ON conversations;
CREATE POLICY "Sub-account users can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- ============================================
-- AGENT_METRICS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all metrics" ON agent_metrics;
CREATE POLICY "Agency users can view all metrics"
ON agent_metrics FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their metrics" ON agent_metrics;
CREATE POLICY "Sub-account users can view their metrics"
ON agent_metrics FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- ============================================
-- PROMPT_CHANGE_REQUESTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all change requests" ON prompt_change_requests;
CREATE POLICY "Agency users can view all change requests"
ON prompt_change_requests FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their change requests" ON prompt_change_requests;
CREATE POLICY "Sub-account users can view their change requests"
ON prompt_change_requests FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Sub-account users can create change requests" ON prompt_change_requests;
CREATE POLICY "Sub-account users can create change requests"
ON prompt_change_requests FOR INSERT
TO authenticated
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Agency managers can manage change requests" ON prompt_change_requests;
CREATE POLICY "Agency managers can manage change requests"
ON prompt_change_requests FOR UPDATE
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

-- ============================================
-- KNOWLEDGE_BASE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view all knowledge base" ON knowledge_base;
CREATE POLICY "Agency users can view all knowledge base"
ON knowledge_base FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

DROP POLICY IF EXISTS "Sub-account users can view their knowledge base" ON knowledge_base;
CREATE POLICY "Sub-account users can view their knowledge base"
ON knowledge_base FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

DROP POLICY IF EXISTS "Managers can manage knowledge base" ON knowledge_base;
CREATE POLICY "Managers can manage knowledge base"
ON knowledge_base FOR ALL
TO authenticated
USING (
  (sub_account_in_user_agency(sub_account_id) AND can_manage_agency()) OR
  (sub_account_id = get_user_sub_account_id() AND get_user_role() IN ('sub_account_owner', 'sub_account_admin'))
);

-- ============================================
-- AUDIT_LOG POLICIES
-- ============================================

DROP POLICY IF EXISTS "Agency users can view audit logs" ON audit_log;
CREATE POLICY "Agency users can view audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  is_agency_user() AND (
    agency_id = get_user_agency_id() OR
    (sub_account_id IS NOT NULL AND sub_account_in_user_agency(sub_account_id))
  )
);

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;
CREATE POLICY "System can insert audit logs"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- DONE!
-- ============================================
-- Tables created: 11
-- RLS enabled: 11 tables
-- Policies created: 30+
-- Helper functions: 7
-- Seed data: MOTTIVME agency
