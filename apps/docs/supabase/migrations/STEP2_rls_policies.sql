-- ============================================
-- MOTTIVME AI Factory - STEP 2: RLS POLICIES
-- Execute AFTER STEP1_create_tables.sql
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

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

-- Get user's agency_id
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

-- Get user's sub_account_id
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

-- Get user's role
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

-- Check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is agency-level user
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

-- Check if user is sub_account-level user
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

-- Check if sub_account belongs to user's agency (with NULL check)
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
-- AGENCIES POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on agencies"
ON agencies FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view their agency"
ON agencies FOR SELECT
TO authenticated
USING (id = get_user_agency_id());

CREATE POLICY "Agency owners can update their agency"
ON agencies FOR UPDATE
TO authenticated
USING (id = get_user_agency_id() AND get_user_role() = 'agency_owner')
WITH CHECK (id = get_user_agency_id() AND get_user_role() = 'agency_owner');

-- ============================================
-- SUB_ACCOUNTS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on sub_accounts"
ON sub_accounts FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view sub_accounts in their agency"
ON sub_accounts FOR SELECT
TO authenticated
USING (agency_id = get_user_agency_id());

CREATE POLICY "Agency owners/admins can manage sub_accounts"
ON sub_accounts FOR ALL
TO authenticated
USING (
  agency_id = get_user_agency_id()
  AND get_user_role() IN ('agency_owner', 'agency_admin')
)
WITH CHECK (
  agency_id = get_user_agency_id()
  AND get_user_role() IN ('agency_owner', 'agency_admin')
);

CREATE POLICY "Sub-account users can view their sub_account"
ON sub_accounts FOR SELECT
TO authenticated
USING (id = get_user_sub_account_id());

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on user_profiles"
ON user_profiles FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Agency users can view profiles in their agency"
ON user_profiles FOR SELECT
TO authenticated
USING (
  is_agency_user() AND (
    agency_id = get_user_agency_id() OR
    (sub_account_id IS NOT NULL AND sub_account_in_user_agency(sub_account_id))
  )
);

CREATE POLICY "Agency owners can manage profiles in their agency"
ON user_profiles FOR ALL
TO authenticated
USING (
  get_user_role() = 'agency_owner' AND (
    agency_id = get_user_agency_id() OR
    (sub_account_id IS NOT NULL AND sub_account_in_user_agency(sub_account_id))
  )
)
WITH CHECK (
  get_user_role() = 'agency_owner' AND (
    agency_id = get_user_agency_id() OR
    (sub_account_id IS NOT NULL AND sub_account_in_user_agency(sub_account_id))
  )
);

-- ============================================
-- CLIENTS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on clients"
ON clients FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view clients in their sub_accounts"
ON clients FOR SELECT
TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Agency owners/admins can manage clients"
ON clients FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id)
  AND get_user_role() IN ('agency_owner', 'agency_admin')
)
WITH CHECK (
  sub_account_in_user_agency(sub_account_id)
  AND get_user_role() IN ('agency_owner', 'agency_admin')
);

CREATE POLICY "Sub-account users can view their clients"
ON clients FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

CREATE POLICY "Sub-account owners/admins can manage their clients"
ON clients FOR ALL
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
)
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
);

-- ============================================
-- AGENT_VERSIONS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on agent_versions"
ON agent_versions FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view agent_versions in their sub_accounts"
ON agent_versions FOR SELECT
TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Agency owners/admins can manage agent_versions"
ON agent_versions FOR ALL
TO authenticated
USING (
  sub_account_in_user_agency(sub_account_id)
  AND get_user_role() IN ('agency_owner', 'agency_admin')
)
WITH CHECK (
  sub_account_in_user_agency(sub_account_id)
  AND get_user_role() IN ('agency_owner', 'agency_admin')
);

CREATE POLICY "Sub-account users can view their agent_versions"
ON agent_versions FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- ============================================
-- LEADS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on leads"
ON leads FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view leads in their sub_accounts"
ON leads FOR SELECT
TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account users can view their leads"
ON leads FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

CREATE POLICY "Sub-account owners/admins can manage their leads"
ON leads FOR ALL
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
)
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
);

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on conversations"
ON conversations FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view conversations in their sub_accounts"
ON conversations FOR SELECT
TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account users can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- ============================================
-- AGENT_METRICS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on agent_metrics"
ON agent_metrics FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view metrics in their sub_accounts"
ON agent_metrics FOR SELECT
TO authenticated
USING (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account users can view their metrics"
ON agent_metrics FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

-- ============================================
-- PROMPT_CHANGE_REQUESTS POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on prompt_change_requests"
ON prompt_change_requests FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can view/manage prompt requests in their sub_accounts"
ON prompt_change_requests FOR ALL
TO authenticated
USING (sub_account_in_user_agency(sub_account_id))
WITH CHECK (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account users can view their prompt requests"
ON prompt_change_requests FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

CREATE POLICY "Sub-account owners/admins can create prompt requests"
ON prompt_change_requests FOR INSERT
TO authenticated
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
);

-- ============================================
-- KNOWLEDGE_BASE POLICIES
-- ============================================

CREATE POLICY "Super admins can do everything on knowledge_base"
ON knowledge_base FOR ALL
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Agency users can manage knowledge_base in their sub_accounts"
ON knowledge_base FOR ALL
TO authenticated
USING (sub_account_in_user_agency(sub_account_id))
WITH CHECK (sub_account_in_user_agency(sub_account_id));

CREATE POLICY "Sub-account users can view their knowledge_base"
ON knowledge_base FOR SELECT
TO authenticated
USING (sub_account_id = get_user_sub_account_id());

CREATE POLICY "Sub-account owners/admins can manage their knowledge_base"
ON knowledge_base FOR ALL
TO authenticated
USING (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
)
WITH CHECK (
  sub_account_id = get_user_sub_account_id()
  AND get_user_role() IN ('sub_account_owner', 'sub_account_admin')
);

-- ============================================
-- AUDIT_LOG POLICIES
-- ============================================

CREATE POLICY "Super admins can view all audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (is_super_admin());

CREATE POLICY "Agency users can view audit logs in their scope"
ON audit_log FOR SELECT
TO authenticated
USING (
  is_agency_user() AND (
    agency_id = get_user_agency_id() OR
    (sub_account_id IS NOT NULL AND sub_account_in_user_agency(sub_account_id))
  )
);

CREATE POLICY "Sub-account users can view their audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  is_sub_account_user() AND sub_account_id = get_user_sub_account_id()
);

-- System can insert audit logs (no user restriction)
CREATE POLICY "System can insert audit logs"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- VERIFY RLS ENABLED
-- ============================================

SELECT 'STEP 2 COMPLETE: RLS Policies created successfully!' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
