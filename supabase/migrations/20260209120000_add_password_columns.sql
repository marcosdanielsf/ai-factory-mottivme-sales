-- Add missing columns for Instagrapi DM service
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS owner_location_id TEXT;
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS dms_sent_today INTEGER DEFAULT 0;
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS last_dm_at TIMESTAMPTZ;
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE instagram_accounts ADD COLUMN IF NOT EXISTS proxy_url TEXT;
