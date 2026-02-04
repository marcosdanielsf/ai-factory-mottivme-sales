-- ============================================================================
-- Migration: Create instagram_accounts table
-- Description: Stores Instagram accounts connected for automation
-- Date: 2025-01-29
-- ============================================================================

-- Create table for Instagram accounts
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  username TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'blocked', 'warming_up', 'inactive', 'pending')),
  daily_limit INTEGER DEFAULT 100,
  remaining_today INTEGER DEFAULT 100,
  blocked_until TIMESTAMPTZ,
  last_action_at TIMESTAMPTZ,
  warmup_progress INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate usernames per tenant
  UNIQUE(tenant_id, username)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_tenant ON instagram_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_status ON instagram_accounts(status);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_username ON instagram_accounts(username);

-- Enable Row Level Security
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's accounts
CREATE POLICY "Users can view own tenant accounts"
  ON instagram_accounts
  FOR SELECT
  USING (
    tenant_id = (
      SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        auth.jwt() -> 'user_metadata' ->> 'organization_id',
        'demo'
      )
    )
  );

-- Policy: Users can insert accounts for their tenant
CREATE POLICY "Users can insert own tenant accounts"
  ON instagram_accounts
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        auth.jwt() -> 'user_metadata' ->> 'organization_id',
        'demo'
      )
    )
  );

-- Policy: Users can update their tenant's accounts
CREATE POLICY "Users can update own tenant accounts"
  ON instagram_accounts
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        auth.jwt() -> 'user_metadata' ->> 'organization_id',
        'demo'
      )
    )
  );

-- Policy: Users can delete their tenant's accounts
CREATE POLICY "Users can delete own tenant accounts"
  ON instagram_accounts
  FOR DELETE
  USING (
    tenant_id = (
      SELECT COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'tenant_id',
        auth.jwt() -> 'user_metadata' ->> 'organization_id',
        'demo'
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instagram_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_instagram_accounts_updated_at();

-- Function to reset daily limits (should be called by a cron job at midnight)
CREATE OR REPLACE FUNCTION reset_instagram_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE instagram_accounts
  SET remaining_today = daily_limit,
      updated_at = NOW()
  WHERE remaining_today < daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON instagram_accounts TO authenticated;
GRANT SELECT ON instagram_accounts TO anon;

-- ============================================================================
-- Migration complete
-- ============================================================================
