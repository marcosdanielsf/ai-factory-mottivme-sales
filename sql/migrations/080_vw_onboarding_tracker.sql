-- Migration 080: View vw_onboarding_tracker
-- Creates: vw_onboarding_tracker
-- Author: supabase-dba agent
-- Date: 2026-03-12
--
-- ROLLBACK PLAN:
-- BEGIN;
--   DROP VIEW IF EXISTS vw_onboarding_tracker;
-- COMMIT;

-- ---------------------------------------------------------------------------
-- View: vw_onboarding_tracker
--
-- Retorna todos os campos de client_onboardings enriquecidos com:
--   steps_completed  — quantos checklist items estao marcados como concluidos
--   total_steps      — sempre 7 (steps padrao do processo)
--   progress_pct     — percentual de conclusao (0–100)
--   hours_elapsed    — horas decorridas desde started_at
--   is_sla_at_risk   — true se > 36h e ainda nao concluido
--   is_sla_breached  — true se > 48h e ainda nao concluido
--   next_step        — proximo step_number nao completado (menor step pendente)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_onboarding_tracker;

CREATE VIEW vw_onboarding_tracker AS
WITH checklist_summary AS (
  SELECT
    onboarding_id,
    COUNT(*)                                          AS total_items,
    COUNT(*) FILTER (WHERE is_completed = true)       AS items_completed,
    MIN(step_number) FILTER (WHERE is_completed = false) AS next_pending_step
  FROM public.onboarding_checklist_items
  GROUP BY onboarding_id
),
hours_calc AS (
  SELECT
    id,
    EXTRACT(EPOCH FROM (now() - started_at)) / 3600.0 AS hours_elapsed
  FROM public.client_onboardings
)
SELECT
  -- Campos base de client_onboardings
  co.id,
  co.client_id,
  co.client_name,
  co.vertical,
  co.current_step,
  co.status,
  co.assigned_to,
  co.sla_deadline,
  co.started_at,
  co.completed_at,
  co.notes,
  co.created_at,
  co.updated_at,

  -- Progresso calculado a partir dos checklist items
  COALESCE(cs.items_completed, 0)                       AS steps_completed,
  7                                                      AS total_steps,
  ROUND(
    (COALESCE(cs.items_completed, 0)::numeric / 7) * 100,
    1
  )                                                      AS progress_pct,

  -- Tempo decorrido desde o inicio
  ROUND(hc.hours_elapsed::numeric, 1)                   AS hours_elapsed,

  -- Flags de SLA (ignorar se ja concluido ou cancelado)
  (
    hc.hours_elapsed > 36
    AND co.status NOT IN ('concluido', 'cancelado')
  )                                                      AS is_sla_at_risk,

  (
    hc.hours_elapsed > 48
    AND co.status NOT IN ('concluido', 'cancelado')
  )                                                      AS is_sla_breached,

  -- Proximo step pendente (menor step_number com is_completed = false)
  cs.next_pending_step                                   AS next_step

FROM public.client_onboardings co
LEFT JOIN checklist_summary cs ON cs.onboarding_id = co.id
JOIN hours_calc hc ON hc.id = co.id;
