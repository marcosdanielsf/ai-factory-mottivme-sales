-- migration: 063_conclave.sql
-- autor: mega-brain team
-- data: 2026-03-01
-- descricao: Mega Brain — sessoes de deliberacao Conclave (advisory council)

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================
-- DROP TABLE IF EXISTS conclave_sessions;

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conclave_sessions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question              TEXT        NOT NULL,
  context               TEXT,
  council_config        JSONB       NOT NULL,
  status                TEXT        DEFAULT 'deliberating' CHECK (status IN (
                                      'deliberating', 'completed', 'cancelled'
                                    )),
  synthesis             TEXT,
  individual_responses  JSONB,
  total_tokens          INTEGER,
  total_cost            NUMERIC(10,6),
  duration_ms           INTEGER,
  user_id               UUID        DEFAULT auth.uid(),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conclave_status
  ON public.conclave_sessions(status);

CREATE INDEX IF NOT EXISTS idx_conclave_user
  ON public.conclave_sessions(user_id);

-- RLS
ALTER TABLE public.conclave_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth CRUD conclave"
  ON public.conclave_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS public.conclave_sessions;
