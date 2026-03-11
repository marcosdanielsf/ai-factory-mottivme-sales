-- ============================================
-- MOTTIVME AI Factory - Row Level Security Policies
-- Migration: 002_rls_policies
-- Description: Implements multi-tenant access control
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
-- HELPER FUNCTIONS
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

-- Check if user is agency level (agency_owner, agency_admin, agency_support)
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

-- Check if user can manage agency (owner or admin)
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

-- Super admins can see all agencies
CREATE POLICY "Super admins can view all agencies"
ON agencies FOR SELECT
TO authenticated
USING (is_super_admin());

-- Agency users can see their own agency
CREATE POLICY "Users can view their own agency"
ON agencies FOR SELECT
TO authenticated
USING (id = get_user_agency_id());

-- Only super admins can create agencies
CREATE POLICY "Super admins can create agencies"
ON agencies FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Agency owners can update their own agency
CREATE POLICY "Agency owners can update their agency"
ON agencies FOR UPDATE
TO authenticated
USING (id = get_user_agency_id() AND get_user_role() IN ('super_admin', 'agency_owner'));

-- ============================================
-- SUB_ACCOUNTS POLICIES
-- ============================================

-- Agency users can see all sub_accounts in their agency
CREATE POLICY "Agency users can view sub_accounts in their agency"
ON sub_accounts FOR SELECT
TO authenticated
USING (
  agency_id = get_user_agency_id() AND is_agency_user()
);

-- Sub-account users can see only their own sub_account
CREATE POLICY "Sub-account users can view their own sub_account"
ON sub_accounts FOR SELECT
TO authenticated
USING (
  id = get_user_sub_account_id()
);

-- Agency managers can create sub_accounts
CREATE POLICY "Agency managers can create sub_accounts"
ON sub_accounts FOR INSERT
TO authenticated
WITH CHECK (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

-- Agency managers can update sub_accounts in their agency
CREATE POLICY "Agency managers can update sub_accounts"
ON sub_accounts FOR UPDATE
TO authenticated
USING (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

-- Agency owners can delete sub_accounts
CREATE POLICY "Agency owners can delete sub_accounts"
ON sub_accounts FOR DELETE
TO authenticated
USING (
  agency_id = get_user_agency_id() AND get_user_role() IN ('super_admin', 'agency_owner')
);

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Agency users can view profiles in their agency
CREATE POLICY "Agency users can view agency profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  agency_id = get_user_agency_id() AND is_agency_user()
);

-- Sub-account users can view profiles in their sub_account
CREATE POLICY "Sub-account users can view sub_account profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Agency managers can manage profiles in their agency
CREATE POLICY "Agency managers can manage profiles"
ON user_profiles FOR ALL
TO authenticated
USING (
  agency_id = get_user_agency_id() AND can_manage_agency()
);

-- ============================================
-- CLIENTS POLICIES
-- ============================================

-- Agency users can see all clients across sub_accounts
CREATE POLICY "Agency users can view all clients"
ON clients FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

-- Sub-account users can see only their clients
CREATE POLICY "Sub-account users can view their clients"
ON clients FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Agency managers can manage all clients
CREATE POLICY "Agency managers can manage clients"
ON clients FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

-- Sub-account owners can manage their clients
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

-- Agency users can see all agent versions (including templates)
CREATE POLICY "Agency users can view all agent versions"
ON agent_versions FOR SELECT
TO authenticated
USING (
  (sub_account_in_user_agency(sub_account_id) AND is_agency_user()) OR
  (is_template = true AND is_agency_user())  -- Templates visible to all agency users
);

-- Sub-account users can see their own agent versions
CREATE POLICY "Sub-account users can view their agent versions"
ON agent_versions FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Agency managers can create/update all agent versions
CREATE POLICY "Agency managers can manage agent versions"
ON agent_versions FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

-- Sub-account users can only view, not modify (changes go through approval)
-- They can request changes via prompt_change_requests

-- ============================================
-- LEADS POLICIES
-- ============================================

-- Agency users can see all leads
CREATE POLICY "Agency users can view all leads"
ON leads FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

-- Sub-account users can see their leads
CREATE POLICY "Sub-account users can view their leads"
ON leads FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Agency and sub-account managers can manage leads
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

-- Same pattern as leads
CREATE POLICY "Agency users can view all conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

CREATE POLICY "Sub-account users can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- ============================================
-- AGENT_METRICS POLICIES
-- ============================================

-- Agency users can see aggregated metrics across all sub_accounts
CREATE POLICY "Agency users can view all metrics"
ON agent_metrics FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

-- Sub-account users can see their metrics
CREATE POLICY "Sub-account users can view their metrics"
ON agent_metrics FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Only system can insert metrics (via service role)
CREATE POLICY "System can insert metrics"
ON agent_metrics FOR INSERT
TO authenticated
WITH CHECK (false);  -- Blocked for regular users, use service role

-- ============================================
-- PROMPT_CHANGE_REQUESTS POLICIES
-- ============================================

-- Agency users can see all requests
CREATE POLICY "Agency users can view all change requests"
ON prompt_change_requests FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

-- Sub-account users can see their requests
CREATE POLICY "Sub-account users can view their change requests"
ON prompt_change_requests FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Sub-account users can create requests
CREATE POLICY "Sub-account users can create change requests"
ON prompt_change_requests FOR INSERT
TO authenticated
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
);

-- Agency managers can approve/reject requests
CREATE POLICY "Agency managers can manage change requests"
ON prompt_change_requests FOR UPDATE
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND can_manage_agency()
);

-- ============================================
-- KNOWLEDGE_BASE POLICIES
-- ============================================

-- Agency users can see all knowledge base entries
CREATE POLICY "Agency users can view all knowledge base"
ON knowledge_base FOR SELECT
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id) AND is_agency_user()
);

-- Sub-account users can see their knowledge base
CREATE POLICY "Sub-account users can view their knowledge base"
ON knowledge_base FOR SELECT
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
);

-- Managers can manage knowledge base
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

-- Only agency users can view audit logs
CREATE POLICY "Agency users can view audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  (agency_id = get_user_agency_id() OR sub_account_in_user_agency(sub_account_id))
  AND is_agency_user()
);

-- System inserts audit logs (via triggers or service role)
CREATE POLICY "System can insert audit logs"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow inserts, data is validated by triggers

-- Prevent updates/deletes on audit log
-- No UPDATE or DELETE policies = blocked by RLS