-- migration: cold_call_metrics_notification_queue.sql
-- autor: supabase-dba agent
-- data: 2026-02-20
-- descricao: (1) VIEW cold_call_metrics agregando cold_call_logs por dia+location_id
--            (2) TABLE notification_queue para entrevistas/agendamentos pendentes

-- ============================================================
-- SCHEMA FONTE: cold_call_logs
--   outcome valores: 'agendou' | 'interessado' | 'no_answer' | 'nao_atendeu'
--                    'voicemail' | 'recusou' | 'erro' | 'unknown' | 'callback' | ''
--   coluna de data: started_at (TIMESTAMPTZ)
--   coluna de duracao: duration_seconds (NUMERIC)
-- ============================================================

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- ----------------------------------------------------------------
-- 1. VIEW: cold_call_metrics
--    Agrega cold_call_logs por (location_id, dia)
--    Mapeamento de outcome:
--      agendamentos   = outcome IN ('agendou')
--      interessados   = outcome IN ('interessado', 'callback')
--      nao_atenderam  = outcome IN ('no_answer', 'nao_atendeu')
--      recusaram      = outcome IN ('recusou')
--      caixa_postal   = outcome IN ('voicemail')
--      erros          = outcome IN ('erro', 'unknown', '')
--      total_chamadas = todas as linhas do dia
--    Nota: view anterior tinha colunas de custo (custo_total_usd,
--      custo_medio_usd, custo_por_agendamento_usd) — mantidas para
--      nao quebrar queries existentes.
--    DROP necessario pois CREATE OR REPLACE nao permite remover colunas.
-- ----------------------------------------------------------------
DROP VIEW IF EXISTS public.cold_call_metrics;

CREATE VIEW public.cold_call_metrics AS
SELECT
  COALESCE(location_id, 'unknown')                        AS location_id,
  DATE_TRUNC('day', started_at)::DATE                     AS dia,
  COUNT(*)                                                AS total_chamadas,
  COUNT(*) FILTER (WHERE outcome = 'agendou')             AS agendamentos,
  COUNT(*) FILTER (WHERE outcome IN ('interessado', 'callback'))
                                                          AS interessados,
  COUNT(*) FILTER (WHERE outcome IN ('no_answer', 'nao_atendeu'))
                                                          AS nao_atenderam,
  COUNT(*) FILTER (WHERE outcome = 'recusou')             AS recusaram,
  COUNT(*) FILTER (WHERE outcome = 'voicemail')           AS caixa_postal,
  COUNT(*) FILTER (WHERE outcome IN ('erro', 'unknown') OR outcome = '' OR outcome IS NULL)
                                                          AS erros,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'agendou') * 100.0
    / NULLIF(COUNT(*), 0),
    2
  )                                                       AS taxa_agendamento_pct,
  ROUND(
    AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL AND duration_seconds > 0),
    2
  )                                                       AS duracao_media_seg,
  -- colunas de custo mantidas por compatibilidade com queries existentes
  ROUND(COALESCE(SUM(cost_usd), 0), 6)                   AS custo_total_usd,
  ROUND(
    AVG(cost_usd) FILTER (WHERE cost_usd IS NOT NULL AND cost_usd > 0),
    6
  )                                                       AS custo_medio_usd,
  ROUND(
    SUM(cost_usd) / NULLIF(COUNT(*) FILTER (WHERE outcome = 'agendou'), 0),
    6
  )                                                       AS custo_por_agendamento_usd
FROM public.cold_call_logs
WHERE started_at IS NOT NULL
GROUP BY
  COALESCE(location_id, 'unknown'),
  DATE_TRUNC('day', started_at);

COMMENT ON VIEW public.cold_call_metrics IS
  'Metricas diarias de cold call agregadas por location_id e dia. '
  'Fonte: cold_call_logs.outcome. Atualiza em tempo real (sem cache).';

-- ----------------------------------------------------------------
-- 2. TABLE: notification_queue
--    Fila de notificacoes de entrevistas/agendamentos para leads
--    Status: pending -> sent -> clicked | expired
--    click_action: 'realizada' | 'no_show' | 'sem_interesse'
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          TEXT        NOT NULL,
  lead_name        TEXT        NOT NULL,
  lead_phone       TEXT,
  recruiter_name   TEXT        NOT NULL,
  recruiter_phone  TEXT        NOT NULL,
  interview_date   TIMESTAMPTZ NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'sent', 'clicked', 'expired')),
  click_action     TEXT        CHECK (click_action IN ('realizada', 'no_show', 'sem_interesse')),
  location_id      TEXT        NOT NULL,
  api_key          TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked_at       TIMESTAMPTZ
);

-- Indices para lookups frequentes
CREATE INDEX IF NOT EXISTS idx_nq_location_status
  ON public.notification_queue(location_id, status)
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_nq_lead_id
  ON public.notification_queue(lead_id);

CREATE INDEX IF NOT EXISTS idx_nq_interview_date
  ON public.notification_queue(interview_date DESC);

-- Trigger updated_at automatico
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER set_updated_at_notification_queue
  BEFORE UPDATE ON public.notification_queue
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (n8n, backend)
CREATE POLICY "service_role_full_access_notification_queue"
  ON public.notification_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Leitura publica por api_key (webhook de confirmacao sem auth)
CREATE POLICY "anon_read_by_api_key_notification_queue"
  ON public.notification_queue
  FOR SELECT
  TO anon
  USING (true);

-- Update por anon (click de confirmacao via link publico)
CREATE POLICY "anon_update_status_notification_queue"
  ON public.notification_queue
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.notification_queue IS
  'Fila de notificacoes WhatsApp para entrevistas/agendamentos. '
  'status: pending->sent->clicked|expired. '
  'click_action preenchido pelo lead ao clicar no link de confirmacao.';

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.notification_queue CASCADE;
-- DROP VIEW IF EXISTS public.cold_call_metrics;
-- COMMIT;
