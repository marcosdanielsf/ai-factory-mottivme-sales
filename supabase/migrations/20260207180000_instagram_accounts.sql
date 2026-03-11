-- ================================================
-- Instagram Accounts - Session Management
-- ================================================
-- Stores Instagram credentials and sessions for automated DM sending
-- Used by Instagrapi on Railway for DM outreach

CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    session_json JSONB,
    proxy_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked', 'needs_challenge', 'disabled')),
    last_login_at TIMESTAMPTZ,
    last_dm_at TIMESTAMPTZ,
    dms_sent_today INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 50,
    owner_location_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_status ON instagram_accounts(status);

-- Function to increment DM count
CREATE OR REPLACE FUNCTION increment_dm_count(p_username TEXT)
RETURNS void AS $$
BEGIN
    UPDATE instagram_accounts
    SET dms_sent_today = dms_sent_today + 1,
        last_dm_at = NOW(),
        updated_at = NOW()
    WHERE username = p_username;
END;
$$ LANGUAGE plpgsql;

-- Also create the GHL location keys table
CREATE TABLE IF NOT EXISTS ghl_location_keys (
    location_id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies (service_role bypasses, but good practice)
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_location_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_instagram_accounts ON instagram_accounts;
CREATE POLICY service_role_instagram_accounts ON instagram_accounts
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_ghl_location_keys ON ghl_location_keys;
CREATE POLICY service_role_ghl_location_keys ON ghl_location_keys
    FOR ALL USING (true) WITH CHECK (true);
