-- ============================================
-- MOTTIVME AI Factory - Agency/Sub-account Model
-- Migration: 001_agency_subaccount_structure
-- Description: Creates the core multi-tenant structure
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

-- Create index for faster lookups
CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_owner ON agencies(owner_id);

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

  -- Ensure unique slug within agency
  UNIQUE(agency_id, slug)
);

-- Create indexes
CREATE INDEX idx_sub_accounts_agency ON sub_accounts(agency_id);
CREATE INDEX idx_sub_accounts_slug ON sub_accounts(agency_id, slug);
CREATE INDEX idx_sub_accounts_owner_email ON sub_accounts(owner_email);

-- ============================================
-- 3. USERS TABLE (Extended from auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'sub_account_user' CHECK (role IN (
    'super_admin',        -- MOTTIVME internal - full access to everything
    'agency_owner',       -- Agency owner - full access to agency + all sub-accounts
    'agency_admin',       -- Agency admin - manage sub-accounts
    'agency_support',     -- Agency support - view only, limited actions
    'sub_account_owner',  -- Client owner - full access to their sub-account
    'sub_account_admin',  -- Client admin - manage their sub-account
    'sub_account_user'    -- Client user - limited access
  )),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_agency ON user_profiles(agency_id);
CREATE INDEX idx_user_profiles_sub_account ON user_profiles(sub_account_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 4. CLIENTS TABLE (Updated with sub_account_id)
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

-- Create indexes
CREATE INDEX idx_clients_sub_account ON clients(sub_account_id);
CREATE INDEX idx_clients_ghl_contact ON clients(ghl_contact_id);
CREATE INDEX idx_clients_email ON clients(email);

-- ============================================
-- 5. AGENT_VERSIONS TABLE (Updated with sub_account_id)
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
  is_template BOOLEAN DEFAULT false,  -- Agency can create templates
  created_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_agent_versions_sub_account ON agent_versions(sub_account_id);
CREATE INDEX idx_agent_versions_client ON agent_versions(client_id);
CREATE INDEX idx_agent_versions_active ON agent_versions(is_active) WHERE is_active = true;
CREATE INDEX idx_agent_versions_template ON agent_versions(is_template) WHERE is_template = true;

-- ============================================
-- 6. LEADS TABLE (Updated with sub_account_id)
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

-- Create indexes
CREATE INDEX idx_leads_sub_account ON leads(sub_account_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_scheduled ON leads(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- ============================================
-- 7. CONVERSATIONS TABLE (Chat history)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_account_id UUID NOT NULL REFERENCES sub_accounts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'messenger', 'web', 'sms')),
  external_id TEXT,  -- ID from GHL or other platform
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  messages_count INTEGER DEFAULT 0,
  user_messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_conversations_sub_account ON conversations(sub_account_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================
-- 8. AGENT_METRICS TABLE (Analytics)
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

  -- Unique constraint for daily metrics per agent
  UNIQUE(sub_account_id, agent_version_id, date)
);

-- Create indexes
CREATE INDEX idx_agent_metrics_sub_account ON agent_metrics(sub_account_id);
CREATE INDEX idx_agent_metrics_date ON agent_metrics(date);

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

-- Create indexes
CREATE INDEX idx_prompt_changes_sub_account ON prompt_change_requests(sub_account_id);
CREATE INDEX idx_prompt_changes_status ON prompt_change_requests(status);

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

-- Create indexes
CREATE INDEX idx_knowledge_base_sub_account ON knowledge_base(sub_account_id);
CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

-- ============================================
-- 11. AUDIT_LOG TABLE (Track all changes)
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

-- Create indexes
CREATE INDEX idx_audit_log_agency ON audit_log(agency_id);
CREATE INDEX idx_audit_log_sub_account ON audit_log(sub_account_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- 12. UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_accounts_updated_at
  BEFORE UPDATE ON sub_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_versions_updated_at
  BEFORE UPDATE ON agent_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. SEED DATA: MOTTIVME Agency
-- ============================================

-- Insert MOTTIVME as the main agency
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