-- Migration 072: CJM Phase 12+13 — Drop-off Rate View, Sankey Flow, Health Score
-- Creates: vw_cjm_drop_off, vw_cjm_sankey_flow, compute_health_score(), vw_cjm_health_scores
-- Index:   idx_cjm_events_from_to

-- ---------------------------------------------------------------------------
-- 1. Index: cjm_events(from_stage, to_stage) filtered to stage_change events
--    Speeds up both drop-off and sankey queries.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cjm_events_from_to
  ON cjm_events (from_stage, to_stage)
  WHERE event_type = 'stage_change';

-- ---------------------------------------------------------------------------
-- 2. View: vw_cjm_drop_off
--    Per-stage drop-off rate.
--
--    total_entered    = contacts who arrived at this stage (to_stage = stage_id)
--    total_advanced   = contacts who left this stage moving forward
--                       (from_stage = stage_id AND to_stage IS NOT NULL AND event_type = 'stage_change')
--    total_dropped    = total_entered - total_advanced
--    drop_off_rate    = total_dropped / NULLIF(total_entered, 0) * 100
--
--    NOTE: a contact can appear in both "entered" and "advanced" for the same
--    stage. We count distinct contacts to avoid double-counting retries.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_cjm_drop_off;

CREATE VIEW vw_cjm_drop_off AS
WITH entered AS (
  -- Contacts who arrived at each stage
  SELECT
    location_id,
    pipeline_id,
    to_stage    AS stage_id,
    COUNT(DISTINCT contact_id) AS total_entered
  FROM cjm_events
  WHERE to_stage IS NOT NULL
  GROUP BY location_id, pipeline_id, to_stage
),
advanced AS (
  -- Contacts who left each stage to a next stage
  SELECT
    location_id,
    pipeline_id,
    from_stage  AS stage_id,
    COUNT(DISTINCT contact_id) AS total_advanced
  FROM cjm_events
  WHERE event_type = 'stage_change'
    AND from_stage IS NOT NULL
    AND to_stage   IS NOT NULL
  GROUP BY location_id, pipeline_id, from_stage
),
stage_meta AS (
  -- One row per (pipeline_id, stage_id) — use latest config if duplicate
  SELECT DISTINCT ON (pipeline_id, stage_id)
    location_id,
    pipeline_id,
    stage_id,
    stage_name,
    stage_order
  FROM cjm_stage_config
  WHERE is_active = true
  ORDER BY pipeline_id, stage_id, updated_at DESC
)
SELECT
  COALESCE(e.location_id, a.location_id, sm.location_id) AS location_id,
  COALESCE(e.pipeline_id, a.pipeline_id, sm.pipeline_id) AS pipeline_id,
  sm.stage_id,
  sm.stage_name,
  sm.stage_order,
  COALESCE(e.total_entered,  0)                          AS total_entered,
  COALESCE(a.total_advanced, 0)                          AS total_advanced,
  GREATEST(COALESCE(e.total_entered, 0) - COALESCE(a.total_advanced, 0), 0)
                                                         AS total_dropped,
  ROUND(
    GREATEST(COALESCE(e.total_entered, 0) - COALESCE(a.total_advanced, 0), 0)::numeric
    / NULLIF(e.total_entered, 0) * 100,
    2
  )                                                      AS drop_off_rate
FROM stage_meta sm
LEFT JOIN entered  e ON e.pipeline_id = sm.pipeline_id AND e.stage_id = sm.stage_id
LEFT JOIN advanced a ON a.pipeline_id = sm.pipeline_id AND a.stage_id = sm.stage_id
ORDER BY sm.pipeline_id, sm.stage_order;

-- ---------------------------------------------------------------------------
-- 3. View: vw_cjm_sankey_flow
--    Flow volume between stage pairs for Sankey / alluvial charts.
--    Each row = (from_stage → to_stage) with flow_count.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_cjm_sankey_flow;

CREATE VIEW vw_cjm_sankey_flow AS
WITH flow AS (
  SELECT
    location_id,
    pipeline_id,
    from_stage,
    to_stage,
    COUNT(*) AS flow_count
  FROM cjm_events
  WHERE event_type  = 'stage_change'
    AND from_stage IS NOT NULL
    AND to_stage   IS NOT NULL
  GROUP BY location_id, pipeline_id, from_stage, to_stage
),
stage_meta AS (
  SELECT DISTINCT ON (pipeline_id, stage_id)
    pipeline_id,
    stage_id,
    stage_name,
    stage_order
  FROM cjm_stage_config
  WHERE is_active = true
  ORDER BY pipeline_id, stage_id, updated_at DESC
)
SELECT
  f.location_id,
  f.pipeline_id,
  f.from_stage,
  fs.stage_name  AS from_stage_name,
  fs.stage_order AS from_stage_order,
  f.to_stage,
  ts.stage_name  AS to_stage_name,
  ts.stage_order AS to_stage_order,
  f.flow_count
FROM flow f
LEFT JOIN stage_meta fs
  ON fs.pipeline_id = f.pipeline_id AND fs.stage_id = f.from_stage
LEFT JOIN stage_meta ts
  ON ts.pipeline_id = f.pipeline_id AND ts.stage_id = f.to_stage
ORDER BY f.pipeline_id, fs.stage_order, ts.stage_order;

-- ---------------------------------------------------------------------------
-- 4. Function: compute_health_score(p_contact_id TEXT, p_location_id TEXT)
--    Returns INTEGER 0-100.
--
--    Components:
--      SLA compliance  (40%): breach=0 / warning=50 / ok=100 / NULL=50
--      Responsiveness  (30%): responded=true → 100, false → 0, no match → 50
--      Appointment     (30%): has 'Agendamento Marcado' → 100, else → 0, no match → 50
--
--    n8n_schedule_tracking.unique_id is matched against p_contact_id.
--    If no row exists, default 50 is used for those components.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS compute_health_score(TEXT, TEXT);

CREATE OR REPLACE FUNCTION compute_health_score(
  p_contact_id  TEXT,
  p_location_id TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_sla_status      TEXT;
  v_sla_score       NUMERIC;
  v_responded       BOOLEAN;
  v_resp_score      NUMERIC;
  v_has_appointment BOOLEAN;
  v_appt_score      NUMERIC;
  v_total           NUMERIC;
BEGIN
  -- 1. SLA compliance (40%)
  SELECT sla_status
    INTO v_sla_status
    FROM cjm_journey_state
   WHERE contact_id = p_contact_id
     AND location_id = p_location_id
   LIMIT 1;

  v_sla_score := CASE
    WHEN v_sla_status IS NULL     THEN 50   -- contact not tracked yet → neutral
    WHEN v_sla_status = 'ok'      THEN 100
    WHEN v_sla_status = 'warning' THEN 50
    WHEN v_sla_status = 'breach'  THEN 0
    ELSE 50
  END;

  -- 2. Responsiveness (30%) — from n8n_schedule_tracking
  SELECT responded
    INTO v_responded
    FROM n8n_schedule_tracking
   WHERE unique_id = p_contact_id
   LIMIT 1;

  v_resp_score := CASE
    WHEN v_responded IS NULL  THEN 50   -- no match → neutral
    WHEN v_responded = true   THEN 100
    ELSE 0
  END;

  -- 3. Appointment rate (30%) — value = 'Agendamento Marcado'
  SELECT EXISTS (
    SELECT 1
      FROM n8n_schedule_tracking
     WHERE unique_id = p_contact_id
       AND value     = 'Agendamento Marcado'
  ) INTO v_has_appointment;

  -- If the contact has no rows at all in tracking, use neutral score
  IF NOT EXISTS (
    SELECT 1 FROM n8n_schedule_tracking WHERE unique_id = p_contact_id LIMIT 1
  ) THEN
    v_appt_score := 50;
  ELSE
    v_appt_score := CASE WHEN v_has_appointment THEN 100 ELSE 0 END;
  END IF;

  -- Weighted composite
  v_total := (v_sla_score * 0.40)
           + (v_resp_score * 0.30)
           + (v_appt_score * 0.30);

  RETURN LEAST(GREATEST(ROUND(v_total)::INTEGER, 0), 100);
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. View: vw_cjm_health_scores
--    Pre-computes health scores for all contacts currently in the journey.
--    Query can be slow on large datasets — use with a location_id filter
--    in the WHERE clause whenever possible.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_cjm_health_scores;

CREATE VIEW vw_cjm_health_scores AS
SELECT
  js.contact_id,
  js.location_id,
  js.pipeline_id,
  js.current_stage,
  js.sla_status,
  compute_health_score(js.contact_id, js.location_id) AS health_score
FROM cjm_journey_state js;

-- ---------------------------------------------------------------------------
-- Rollback (run manually if needed):
--   DROP VIEW  IF EXISTS vw_cjm_health_scores;
--   DROP FUNCTION IF EXISTS compute_health_score(TEXT, TEXT);
--   DROP VIEW  IF EXISTS vw_cjm_sankey_flow;
--   DROP VIEW  IF EXISTS vw_cjm_drop_off;
--   DROP INDEX IF EXISTS idx_cjm_events_from_to;
-- ---------------------------------------------------------------------------
