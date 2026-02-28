-- ============================================================================
-- 050: Sandbox Sessions - Chat interativo para testar agentes
-- Permite testar agentes direto do AgentDetail sem WhatsApp
-- ============================================================================

CREATE TABLE IF NOT EXISTS sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  session_name TEXT DEFAULT 'Teste sem nome',
  mode TEXT DEFAULT 'sdr_inbound',
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_agent
  ON sandbox_sessions(agent_version_id);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_location
  ON sandbox_sessions(location_id);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_user
  ON sandbox_sessions(created_by);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_sandbox_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sandbox_sessions_updated_at ON sandbox_sessions;
CREATE TRIGGER trg_sandbox_sessions_updated_at
  BEFORE UPDATE ON sandbox_sessions
  FOR EACH ROW EXECUTE FUNCTION update_sandbox_sessions_updated_at();

-- RLS
ALTER TABLE sandbox_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sandbox_sessions_select ON sandbox_sessions
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY sandbox_sessions_insert ON sandbox_sessions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY sandbox_sessions_update ON sandbox_sessions
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY sandbox_sessions_delete ON sandbox_sessions
  FOR DELETE USING (
    created_by = auth.uid()
  );
