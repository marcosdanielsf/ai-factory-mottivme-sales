-- ============================================================================
-- SOCIALFY - DATABASE SCHEMA (SAFE TO RE-RUN)
-- Supabase PostgreSQL Schema for Sales Intelligence Platform
-- Prefix: socialfy_
-- ============================================================================

-- ============================================================================
-- 1. USERS & ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS socialfy_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES socialfy_organizations(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  company VARCHAR(255),
  avatar_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  instagram_handle VARCHAR(100),
  whatsapp VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in_cadence', 'responding', 'scheduled', 'converted', 'lost')),
  icp_score INTEGER DEFAULT 0 CHECK (icp_score >= 0 AND icp_score <= 100),
  channels VARCHAR(20)[] DEFAULT '{}',
  source VARCHAR(100),
  source_data JSONB DEFAULT '{}'::jsonb,
  cnpj VARCHAR(20),
  cnpj_data JSONB DEFAULT '{}'::jsonb,
  tags VARCHAR(100)[] DEFAULT '{}',
  list_ids UUID[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES socialfy_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_leads_org ON socialfy_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_status ON socialfy_leads(status);
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_icp ON socialfy_leads(icp_score DESC);
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_channels ON socialfy_leads USING GIN(channels);
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_tags ON socialfy_leads USING GIN(tags);

-- ============================================================================
-- 3. CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('connection', 'warm_up', 'authority', 'instagram_dm', 'multi_channel')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  channels VARCHAR(20)[] DEFAULT '{}',
  cadence_id UUID,
  cadence_name VARCHAR(100),
  leads_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  meetings_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  owner_id UUID REFERENCES socialfy_users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_campaigns_org ON socialfy_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_campaigns_status ON socialfy_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_socialfy_campaigns_type ON socialfy_campaigns(type);

-- ============================================================================
-- 4. CADENCES (Templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  channels VARCHAR(20)[] DEFAULT '{}',
  duration_days INTEGER DEFAULT 14,
  touch_level VARCHAR(20) DEFAULT 'medium' CHECK (touch_level IN ('low', 'medium', 'high')),
  lead_source VARCHAR(20) DEFAULT 'outbound' CHECK (lead_source IN ('outbound', 'inbound', 'referral')),
  steps JSONB DEFAULT '[]'::jsonb,
  avg_response_rate DECIMAL(5,2) DEFAULT 0,
  avg_meeting_rate DECIMAL(5,2) DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_template BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES socialfy_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_cadences_org ON socialfy_cadences(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_cadences_status ON socialfy_cadences(status);

-- ============================================================================
-- 5. LEAD CADENCE (Lead enrollment in cadences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_lead_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES socialfy_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES socialfy_campaigns(id) ON DELETE SET NULL,
  cadence_id UUID NOT NULL REFERENCES socialfy_cadences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  current_day INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'responded', 'converted', 'bounced')),
  next_activity_at TIMESTAMPTZ,
  next_activity_channel VARCHAR(20),
  next_activity_type VARCHAR(50),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, cadence_id)
);

CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_lead ON socialfy_lead_cadences(lead_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_campaign ON socialfy_lead_cadences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_status ON socialfy_lead_cadences(status);
CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_next ON socialfy_lead_cadences(next_activity_at);

-- ============================================================================
-- 6. ACTIVITIES (All touchpoints with leads)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES socialfy_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES socialfy_campaigns(id) ON DELETE SET NULL,
  lead_cadence_id UUID REFERENCES socialfy_lead_cadences(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  direction VARCHAR(20) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  subject VARCHAR(500),
  content TEXT,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'failed', 'cancelled')),
  responded BOOLEAN DEFAULT FALSE,
  response_time_hours DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES socialfy_users(id),
  scheduled_at TIMESTAMPTZ,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_activities_org ON socialfy_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_lead ON socialfy_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_campaign ON socialfy_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_type ON socialfy_activities(type);
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_channel ON socialfy_activities(channel);
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_performed ON socialfy_activities(performed_at DESC);

-- ============================================================================
-- 7. MESSAGES (Inbox - Unified messaging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  thread_id UUID,
  lead_id UUID NOT NULL REFERENCES socialfy_leads(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'read', 'failed')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_by UUID REFERENCES socialfy_users(id),
  external_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_messages_org ON socialfy_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_lead ON socialfy_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_thread ON socialfy_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_channel ON socialfy_messages(channel);
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_sent ON socialfy_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_unread ON socialfy_messages(is_read) WHERE is_read = FALSE;

-- ============================================================================
-- 8. CONNECTED ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES socialfy_users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'rate_limited')),
  daily_limit INTEGER DEFAULT 100,
  daily_usage INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  credentials JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform, account_name)
);

CREATE INDEX IF NOT EXISTS idx_socialfy_connected_accounts_org ON socialfy_connected_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_connected_accounts_platform ON socialfy_connected_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_socialfy_connected_accounts_status ON socialfy_connected_accounts(status);

-- ============================================================================
-- 9. PIPELINE (Deals/Opportunities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_pipeline_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES socialfy_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES socialfy_campaigns(id) ON DELETE SET NULL,
  title VARCHAR(255),
  value DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BRL',
  stage VARCHAR(50) DEFAULT 'new' CHECK (stage IN ('new', 'relationship', 'scheduled', 'proposal', 'negotiation', 'won', 'lost')),
  meeting_scheduled_at TIMESTAMPTZ,
  meeting_type VARCHAR(100),
  show_rate_guard JSONB DEFAULT '{}'::jsonb,
  expected_close_date DATE,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  owner_id UUID REFERENCES socialfy_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_org ON socialfy_pipeline_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_lead ON socialfy_pipeline_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_stage ON socialfy_pipeline_deals(stage);
CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_meeting ON socialfy_pipeline_deals(meeting_scheduled_at) WHERE meeting_scheduled_at IS NOT NULL;

-- ============================================================================
-- 10. AI AGENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('connection', 'inbox', 'content', 'qualifier', 'voice_ai')),
  description TEXT,
  language VARCHAR(10) DEFAULT 'pt-BR',
  model VARCHAR(50) DEFAULT 'claude-sonnet',
  system_prompt TEXT,
  templates JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  total_executions INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES socialfy_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_socialfy_ai_agents_org ON socialfy_ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_ai_agents_type ON socialfy_ai_agents(type);
CREATE INDEX IF NOT EXISTS idx_socialfy_ai_agents_active ON socialfy_ai_agents(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 11. ICP CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_icp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  criteria JSONB DEFAULT '[]'::jsonb,
  high_fit_threshold INTEGER DEFAULT 80,
  medium_fit_threshold INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ============================================================================
-- 12. ANALYTICS SNAPSHOTS (Daily metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS socialfy_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  meetings_scheduled INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  show_rate DECIMAL(5,2) DEFAULT 0,
  leads_added INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  channel_metrics JSONB DEFAULT '{}'::jsonb,
  deals_won INTEGER DEFAULT 0,
  revenue DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

CREATE INDEX IF NOT EXISTS idx_socialfy_analytics_daily_org ON socialfy_analytics_daily(organization_id);
CREATE INDEX IF NOT EXISTS idx_socialfy_analytics_daily_date ON socialfy_analytics_daily(date DESC);

-- ============================================================================
-- 13. ENABLE RLS
-- ============================================================================

ALTER TABLE socialfy_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_lead_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_pipeline_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_icp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE socialfy_analytics_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. RLS POLICIES (Organization-based access)
-- ============================================================================

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION socialfy_get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM socialfy_users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Users can view own organization" ON socialfy_organizations;
DROP POLICY IF EXISTS "Users can view org members" ON socialfy_users;
DROP POLICY IF EXISTS "Leads scoped to organization" ON socialfy_leads;
DROP POLICY IF EXISTS "Campaigns scoped to organization" ON socialfy_campaigns;
DROP POLICY IF EXISTS "Cadences scoped to organization" ON socialfy_cadences;
DROP POLICY IF EXISTS "Lead cadences via lead org" ON socialfy_lead_cadences;
DROP POLICY IF EXISTS "Activities scoped to organization" ON socialfy_activities;
DROP POLICY IF EXISTS "Messages scoped to organization" ON socialfy_messages;
DROP POLICY IF EXISTS "Connected accounts scoped to organization" ON socialfy_connected_accounts;
DROP POLICY IF EXISTS "Pipeline scoped to organization" ON socialfy_pipeline_deals;
DROP POLICY IF EXISTS "AI agents scoped to organization" ON socialfy_ai_agents;
DROP POLICY IF EXISTS "ICP config scoped to organization" ON socialfy_icp_config;
DROP POLICY IF EXISTS "Analytics scoped to organization" ON socialfy_analytics_daily;

-- Create policies
CREATE POLICY "Users can view own organization" ON socialfy_organizations
  FOR SELECT USING (id = socialfy_get_user_org_id());

CREATE POLICY "Users can view org members" ON socialfy_users
  FOR SELECT USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Leads scoped to organization" ON socialfy_leads
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Campaigns scoped to organization" ON socialfy_campaigns
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Cadences scoped to organization" ON socialfy_cadences
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Lead cadences via lead org" ON socialfy_lead_cadences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM socialfy_leads WHERE socialfy_leads.id = socialfy_lead_cadences.lead_id AND socialfy_leads.organization_id = socialfy_get_user_org_id())
  );

CREATE POLICY "Activities scoped to organization" ON socialfy_activities
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Messages scoped to organization" ON socialfy_messages
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Connected accounts scoped to organization" ON socialfy_connected_accounts
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Pipeline scoped to organization" ON socialfy_pipeline_deals
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "AI agents scoped to organization" ON socialfy_ai_agents
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "ICP config scoped to organization" ON socialfy_icp_config
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

CREATE POLICY "Analytics scoped to organization" ON socialfy_analytics_daily
  FOR ALL USING (organization_id = socialfy_get_user_org_id());

-- ============================================================================
-- 15. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION socialfy_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if exist (safe to re-run)
DROP TRIGGER IF EXISTS update_socialfy_organizations_updated_at ON socialfy_organizations;
DROP TRIGGER IF EXISTS update_socialfy_users_updated_at ON socialfy_users;
DROP TRIGGER IF EXISTS update_socialfy_leads_updated_at ON socialfy_leads;
DROP TRIGGER IF EXISTS update_socialfy_campaigns_updated_at ON socialfy_campaigns;
DROP TRIGGER IF EXISTS update_socialfy_cadences_updated_at ON socialfy_cadences;
DROP TRIGGER IF EXISTS update_socialfy_lead_cadences_updated_at ON socialfy_lead_cadences;
DROP TRIGGER IF EXISTS update_socialfy_connected_accounts_updated_at ON socialfy_connected_accounts;
DROP TRIGGER IF EXISTS update_socialfy_pipeline_deals_updated_at ON socialfy_pipeline_deals;
DROP TRIGGER IF EXISTS update_socialfy_ai_agents_updated_at ON socialfy_ai_agents;
DROP TRIGGER IF EXISTS update_socialfy_icp_config_updated_at ON socialfy_icp_config;

-- Apply triggers
CREATE TRIGGER update_socialfy_organizations_updated_at BEFORE UPDATE ON socialfy_organizations FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_users_updated_at BEFORE UPDATE ON socialfy_users FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_leads_updated_at BEFORE UPDATE ON socialfy_leads FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_campaigns_updated_at BEFORE UPDATE ON socialfy_campaigns FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_cadences_updated_at BEFORE UPDATE ON socialfy_cadences FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_lead_cadences_updated_at BEFORE UPDATE ON socialfy_lead_cadences FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_connected_accounts_updated_at BEFORE UPDATE ON socialfy_connected_accounts FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_pipeline_deals_updated_at BEFORE UPDATE ON socialfy_pipeline_deals FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_ai_agents_updated_at BEFORE UPDATE ON socialfy_ai_agents FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();
CREATE TRIGGER update_socialfy_icp_config_updated_at BEFORE UPDATE ON socialfy_icp_config FOR EACH ROW EXECUTE FUNCTION socialfy_update_updated_at();

-- Reset daily usage at midnight
CREATE OR REPLACE FUNCTION socialfy_reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE socialfy_connected_accounts
  SET daily_usage = 0, last_reset_at = NOW()
  WHERE last_reset_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Socialfy schema created successfully!' as status;
