-- Migration 063: Conclave Sessions
-- Autor: supabase-dba agent
-- Data: 2026-03-01
-- Descricao: Sessoes de deliberacao do Conclave — conselho de especialistas IA

-- Rollback: DROP TABLE conclave_sessions;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS conclave_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  context TEXT,
  council_config JSONB NOT NULL,
  status TEXT DEFAULT 'deliberating' CHECK (status IN ('deliberating', 'completed', 'cancelled')),
  synthesis TEXT,
  individual_responses JSONB,
  total_tokens INTEGER,
  total_cost NUMERIC(10,6),
  duration_ms INTEGER,
  user_id UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conclave_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth CRUD conclave" ON conclave_sessions FOR ALL TO authenticated USING (true);

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS conclave_sessions;
-- COMMIT;
