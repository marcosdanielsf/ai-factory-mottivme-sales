-- Migration 071: CJM Phase 11 — Timeline + SLA Monitor
-- Creates vw_cjm_client_timeline, cjm_onboarding_steps, and supporting indexes

-- ---------------------------------------------------------------------------
-- 1. Index: cjm_events(contact_id, occurred_at DESC) for timeline queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cjm_events_contact_timeline
  ON cjm_events (contact_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_cjm_events_location_occurred
  ON cjm_events (location_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- 2. View: vw_cjm_client_timeline
--    Per-client event history with stage names resolved from cjm_stage_config.
--    time_in_previous_stage = hours between this event and the previous event
--    for the same contact (NULL for the oldest event).
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_cjm_client_timeline;

CREATE VIEW vw_cjm_client_timeline AS
WITH ranked AS (
  SELECT
    e.id,
    e.contact_id,
    e.location_id,
    e.pipeline_id,
    e.event_type,
    e.from_stage,
    e.to_stage,
    e.metadata,
    e.occurred_at,
    -- time since previous event for same contact (hours)
    EXTRACT(
      EPOCH FROM (
        e.occurred_at - LAG(e.occurred_at) OVER (
          PARTITION BY e.contact_id
          ORDER BY e.occurred_at ASC
        )
      )
    ) / 3600.0 AS time_in_previous_stage
  FROM cjm_events e
),
stage_names AS (
  SELECT DISTINCT ON (sc.pipeline_id, sc.stage_id)
    sc.pipeline_id,
    sc.stage_id,
    sc.stage_name,
    sc.color
  FROM cjm_stage_config sc
  WHERE sc.is_active = true
  ORDER BY sc.pipeline_id, sc.stage_id, sc.updated_at DESC
)
SELECT
  r.id,
  r.contact_id,
  r.location_id,
  r.pipeline_id,
  r.event_type,
  r.from_stage,
  fs.stage_name  AS from_stage_name,
  r.to_stage,
  ts.stage_name  AS to_stage_name,
  COALESCE(ts.color, fs.color) AS stage_color,
  r.metadata,
  r.occurred_at,
  r.time_in_previous_stage
FROM ranked r
LEFT JOIN stage_names fs
  ON fs.pipeline_id = r.pipeline_id
  AND fs.stage_id   = r.from_stage
LEFT JOIN stage_names ts
  ON ts.pipeline_id = r.pipeline_id
  AND ts.stage_id   = r.to_stage
ORDER BY r.occurred_at DESC;

-- ---------------------------------------------------------------------------
-- 3. Table: cjm_onboarding_steps
--    Tracks VTX Playbook step completion per client (location + contact).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cjm_onboarding_steps (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id   text        NOT NULL,
  contact_id    text        NOT NULL,
  step_key      text        NOT NULL,
  step_name     text        NOT NULL,
  step_order    int         NOT NULL,
  completed     boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  completed_by  text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cjm_onboarding_steps_unique
    UNIQUE (location_id, contact_id, step_key)
);

-- Index for the primary access pattern (by location + contact)
CREATE INDEX IF NOT EXISTS idx_cjm_onboarding_steps_loc_contact
  ON cjm_onboarding_steps (location_id, contact_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION cjm_onboarding_steps_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cjm_onboarding_steps_updated_at ON cjm_onboarding_steps;
CREATE TRIGGER trg_cjm_onboarding_steps_updated_at
  BEFORE UPDATE ON cjm_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION cjm_onboarding_steps_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RLS: authenticated users can SELECT / INSERT / UPDATE
-- ---------------------------------------------------------------------------
ALTER TABLE cjm_onboarding_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cjm_onboarding_steps_select" ON cjm_onboarding_steps;
CREATE POLICY "cjm_onboarding_steps_select"
  ON cjm_onboarding_steps FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "cjm_onboarding_steps_insert" ON cjm_onboarding_steps;
CREATE POLICY "cjm_onboarding_steps_insert"
  ON cjm_onboarding_steps FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "cjm_onboarding_steps_update" ON cjm_onboarding_steps;
CREATE POLICY "cjm_onboarding_steps_update"
  ON cjm_onboarding_steps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
