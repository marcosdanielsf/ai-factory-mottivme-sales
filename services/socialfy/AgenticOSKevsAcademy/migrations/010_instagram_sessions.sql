-- ============================================
-- Migration: 010_instagram_sessions
-- Description: Table for storing Instagram session credentials (encrypted)
-- Author: AgenticOS Subagent
-- Date: 2025-01-29
-- ============================================

-- Drop if exists (development only - remove in production)
-- DROP TABLE IF EXISTS instagram_sessions CASCADE;

-- ============================================
-- Main table: instagram_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS instagram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant association
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Instagram account info
    username TEXT NOT NULL,
    session_id_encrypted TEXT NOT NULL,  -- NEVER store plain text!
    user_id_ig TEXT,                      -- Instagram numeric ID (pk)
    
    -- Profile data (cached)
    full_name TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    is_business BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Session status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'pending_validation')),
    
    -- Tracking
    last_validated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    validation_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, username)
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_instagram_sessions_tenant_id 
    ON instagram_sessions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_username 
    ON instagram_sessions(username);

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_status 
    ON instagram_sessions(status);

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_tenant_status 
    ON instagram_sessions(tenant_id, status);

-- ============================================
-- Trigger for updated_at
-- ============================================
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

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================
ALTER TABLE instagram_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can only see their own sessions
CREATE POLICY instagram_sessions_tenant_isolation ON instagram_sessions
    FOR ALL
    USING (
        tenant_id IN (
            SELECT id FROM tenants 
            WHERE id = current_setting('app.current_tenant_id', true)::uuid
        )
        OR current_setting('app.role', true) = 'service'
    );

-- ============================================
-- Audit table for session changes
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_audit_session_id 
    ON instagram_sessions_audit(session_id);

CREATE INDEX IF NOT EXISTS idx_instagram_sessions_audit_created_at 
    ON instagram_sessions_audit(created_at);

-- ============================================
-- Helper function: Log session audit
-- ============================================
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
-- View: Active sessions with tenant info
-- ============================================
CREATE OR REPLACE VIEW v_instagram_sessions_active AS
SELECT 
    s.id,
    s.tenant_id,
    t.name AS tenant_name,
    t.slug AS tenant_slug,
    s.username,
    s.user_id_ig,
    s.full_name,
    s.profile_pic_url,
    s.followers_count,
    s.following_count,
    s.is_business,
    s.is_verified,
    s.status,
    s.last_validated_at,
    s.last_used_at,
    s.created_at,
    -- Days since last validation
    EXTRACT(DAY FROM (NOW() - s.last_validated_at)) AS days_since_validation,
    -- Is session stale (>7 days without validation)
    CASE 
        WHEN s.last_validated_at IS NULL THEN TRUE
        WHEN NOW() - s.last_validated_at > INTERVAL '7 days' THEN TRUE
        ELSE FALSE
    END AS is_stale
FROM instagram_sessions s
LEFT JOIN tenants t ON s.tenant_id = t.id
WHERE s.status = 'active';

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE instagram_sessions IS 'Stores Instagram session credentials (encrypted) for multi-tenant automation';
COMMENT ON COLUMN instagram_sessions.session_id_encrypted IS 'Fernet-encrypted sessionid cookie - NEVER store plain text';
COMMENT ON COLUMN instagram_sessions.user_id_ig IS 'Instagram numeric user ID (pk) - stable even if username changes';
COMMENT ON COLUMN instagram_sessions.status IS 'active: working, expired: needs re-login, blocked: Instagram blocked, pending_validation: not yet validated';

-- ============================================
-- Grant permissions (adjust as needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON instagram_sessions TO authenticated;
-- GRANT SELECT ON v_instagram_sessions_active TO authenticated;
-- GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- Migration complete
-- ============================================
-- To run: psql -h host -U user -d database -f 010_instagram_sessions.sql
