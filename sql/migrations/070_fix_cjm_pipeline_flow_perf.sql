-- Migration 070: Fix vw_cjm_pipeline_flow performance
-- Problema: business_hours_diff() chamada para cada row causa statement timeout
-- Solucao: Substituir por calculo simples de horas (EPOCH diff)
-- O calculo de business hours pode ser feito no frontend se necessario

-- 1. Indices para acelerar joins
CREATE INDEX IF NOT EXISTS idx_cjm_journey_state_loc_pipe_stage
  ON cjm_journey_state (location_id, pipeline_id, current_stage);

CREATE INDEX IF NOT EXISTS idx_cjm_stage_config_loc_pipe_stage
  ON cjm_stage_config (location_id, pipeline_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_cjm_journey_state_sla_status
  ON cjm_journey_state (location_id, sla_status);

-- 2. Recriar view sem business_hours_diff (calculo inline simples)
CREATE OR REPLACE VIEW vw_cjm_pipeline_flow AS
SELECT
  js.location_id,
  js.pipeline_id,
  sc.pipeline_name,
  js.current_stage,
  sc.stage_name,
  sc.stage_order,
  sc.color,
  sc.owner_name,
  sc.sla_hours,
  COUNT(js.contact_id)                             AS contact_count,
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (now() - js.entered_stage_at)) / 3600.0),
    0
  )                                                AS avg_hours_in_stage,
  COUNT(*) FILTER (WHERE js.sla_status = 'breach') AS sla_breach_count,
  COUNT(*) FILTER (WHERE js.sla_status = 'warning') AS sla_warning_count
FROM cjm_journey_state js
LEFT JOIN cjm_stage_config sc
  ON sc.location_id  = js.location_id
  AND sc.pipeline_id = js.pipeline_id
  AND sc.stage_id    = js.current_stage
GROUP BY
  js.location_id, js.pipeline_id, sc.pipeline_name,
  js.current_stage, sc.stage_name, sc.stage_order,
  sc.color, sc.owner_name, sc.sla_hours;

-- Rollback:
-- DROP INDEX IF EXISTS idx_cjm_journey_state_loc_pipe_stage;
-- DROP INDEX IF EXISTS idx_cjm_stage_config_loc_pipe_stage;
-- DROP INDEX IF EXISTS idx_cjm_journey_state_sla_status;
-- Restaurar view original com business_hours_diff() de 09-migration.sql
