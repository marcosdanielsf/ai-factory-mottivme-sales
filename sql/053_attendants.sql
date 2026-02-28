-- ============================================================================
-- 053: Attendants - Atendentes humanos para handoff da IA
-- Cadastro com horarios, integracao GHL, handoff configuravel
-- ============================================================================

CREATE TABLE IF NOT EXISTS attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  role TEXT DEFAULT 'atendente',
  schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  ghl_user_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendants_location
  ON attendants(location_id) WHERE is_active = TRUE;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_attendants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendants_updated_at ON attendants;
CREATE TRIGGER trg_attendants_updated_at
  BEFORE UPDATE ON attendants
  FOR EACH ROW EXECUTE FUNCTION update_attendants_updated_at();

-- RLS
ALTER TABLE attendants ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendants_select ON attendants
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY attendants_insert ON attendants
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
      AND ul.role IN ('admin', 'manager')
    )
  );

CREATE POLICY attendants_update ON attendants
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
      AND ul.role IN ('admin', 'manager')
    )
  );

CREATE POLICY attendants_delete ON attendants
  FOR DELETE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
      AND ul.role = 'admin'
    )
  );

COMMENT ON TABLE attendants IS 'Atendentes humanos que recebem handoff da IA';
COMMENT ON COLUMN attendants.schedule IS 'Horarios: {mon: {start: "09:00", end: "18:00", active: true}, ...}';
COMMENT ON COLUMN attendants.ghl_user_id IS 'ID do usuario no GHL para transferencia automatica';
