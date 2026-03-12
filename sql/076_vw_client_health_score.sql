-- ============================================================================
-- Migration 076: View calculada de Health Score por cliente
-- Obsessao: Entrega Extraordinaria
--
-- Dimensoes (0-100 cada):
-- 1. Engajamento: % leads que responderam (n8n_schedule_tracking)
-- 2. Agendamento: % leads que agendaram (n8n_schedule_tracking.etapa_funil)
-- 3. Satisfacao: input manual (client_health_manual_inputs)
-- 4. Atividade: se agente esta ativo + leads nos ultimos 7 dias
-- 5. Pagamento: input manual (client_health_manual_inputs)
--
-- Score geral: media ponderada (engajamento 25%, agendamento 30%,
--              satisfacao 20%, atividade 15%, pagamento 10%)
-- NOTA: pesos duplicados em src/pages/HealthScore/types.ts (DIMENSIONS) —
--       se alterar aqui, alterar la tambem.
-- ============================================================================

CREATE OR REPLACE VIEW vw_client_health_score AS
WITH
-- Dados de leads por location (ultimos 30 dias)
lead_stats AS (
  SELECT
    location_id,
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE responded = true) AS leads_responded,
    COUNT(*) FILTER (WHERE etapa_funil IN ('booked', 'completed', 'won', 'qualifying')) AS leads_scheduled,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_last_7d,
    MAX(created_at) AS last_lead_at
  FROM n8n_schedule_tracking
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY location_id
),

-- Agentes ativos (1 por location, mais recente)
agent_status AS (
  SELECT DISTINCT ON (location_id)
    location_id,
    agent_name,
    is_active,
    updated_at
  FROM agent_versions
  WHERE location_id IS NOT NULL
  ORDER BY location_id, updated_at DESC
),

-- Ultimo input manual de satisfacao
latest_satisfaction AS (
  SELECT DISTINCT ON (location_id)
    location_id,
    score AS satisfaction_score,
    recorded_at
  FROM client_health_manual_inputs
  WHERE dimension = 'satisfaction'
  ORDER BY location_id, recorded_at DESC
),

-- Ultimo input manual de pagamento
latest_payment AS (
  SELECT DISTINCT ON (location_id)
    location_id,
    score AS payment_score,
    recorded_at
  FROM client_health_manual_inputs
  WHERE dimension = 'payment'
  ORDER BY location_id, recorded_at DESC
),

-- Calcular scores por dimensao
scores AS (
  SELECT
    a.location_id,
    a.agent_name,
    a.is_active,

    -- Engajamento: % responderam (0-100)
    COALESCE(
      CASE WHEN ls.total_leads > 0
        THEN LEAST(100, (ls.leads_responded::numeric / ls.total_leads) * 100)
        ELSE 0
      END, 0
    ) AS score_engagement,

    -- Agendamento: % agendaram (0-100)
    COALESCE(
      CASE WHEN ls.total_leads > 0
        THEN LEAST(100, (ls.leads_scheduled::numeric / ls.total_leads) * 100)
        ELSE 0
      END, 0
    ) AS score_scheduling,

    -- Satisfacao: input manual (default 50 se nao preenchido)
    COALESCE(sat.satisfaction_score, 50) AS score_satisfaction,

    -- Atividade: combina agente ativo + volume recente
    CASE
      WHEN NOT a.is_active THEN 0
      WHEN COALESCE(ls.leads_last_7d, 0) >= 10 THEN 100
      WHEN COALESCE(ls.leads_last_7d, 0) >= 5 THEN 75
      WHEN COALESCE(ls.leads_last_7d, 0) >= 1 THEN 50
      ELSE 25
    END AS score_activity,

    -- Pagamento: input manual (default 80 se nao preenchido)
    COALESCE(pay.payment_score, 80) AS score_payment,

    COALESCE(ls.total_leads, 0) AS total_leads_30d,
    COALESCE(ls.leads_responded, 0) AS leads_responded_30d,
    COALESCE(ls.leads_scheduled, 0) AS leads_scheduled_30d,
    COALESCE(ls.leads_last_7d, 0) AS leads_last_7d,
    ls.last_lead_at

  FROM agent_status a
  LEFT JOIN lead_stats ls ON ls.location_id = a.location_id
  LEFT JOIN latest_satisfaction sat ON sat.location_id = a.location_id
  LEFT JOIN latest_payment pay ON pay.location_id = a.location_id
),

-- Score geral calculado uma unica vez (DRY)
final AS (
  SELECT
    s.*,
    ROUND(
      s.score_engagement * 0.25 +
      s.score_scheduling * 0.30 +
      s.score_satisfaction * 0.20 +
      s.score_activity * 0.15 +
      s.score_payment * 0.10
    , 1) AS score_overall
  FROM scores s
)

SELECT
  f.location_id,
  f.agent_name,
  f.is_active,

  ROUND(f.score_engagement, 1) AS score_engagement,
  ROUND(f.score_scheduling, 1) AS score_scheduling,
  ROUND(f.score_satisfaction, 1) AS score_satisfaction,
  ROUND(f.score_activity, 1) AS score_activity,
  ROUND(f.score_payment, 1) AS score_payment,

  f.score_overall,

  CASE
    WHEN f.score_overall >= 80 THEN 'excellent'
    WHEN f.score_overall >= 60 THEN 'healthy'
    WHEN f.score_overall >= 40 THEN 'at_risk'
    ELSE 'critical'
  END AS risk_level,

  f.total_leads_30d,
  f.leads_responded_30d,
  f.leads_scheduled_30d,
  f.leads_last_7d,
  f.last_lead_at

FROM final f
ORDER BY f.score_overall DESC;
