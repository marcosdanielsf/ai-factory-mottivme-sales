-- migration: 044_capi_events_log.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Tabela de log para eventos enviados ao Meta CAPI.
--            Registra cada evento server-side (LeadQualified, Schedule,
--            CompleteRegistration, Purchase) com resposta do Meta.
--
-- LGPD: NUNCA armazenar dados pessoais em plaintext.
--        Campos como email/phone devem ser hasheados com SHA-256
--        ANTES de enviar ao Meta. Esta tabela NAO armazena PII.

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS capi_events_log (
  id BIGSERIAL PRIMARY KEY,

  -- Contexto
  location_id TEXT NOT NULL,
  contact_id TEXT,

  -- Evento Meta
  event_name TEXT NOT NULL,        -- LeadQualified, Schedule, CompleteRegistration, Purchase
  event_id TEXT,                   -- ID unico do evento (dedup no Meta)
  event_time BIGINT,               -- Unix timestamp do evento

  -- Dados do evento (sem PII)
  event_data JSONB DEFAULT '{}',   -- action_source, custom_data (value, currency), etc.

  -- Resposta do Meta
  meta_response JSONB,             -- Resposta raw da API do Meta
  fbtrace_id TEXT,                 -- fbtrace_id para debug no Meta

  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_capi_events_location ON capi_events_log(location_id);
CREATE INDEX IF NOT EXISTS idx_capi_events_name ON capi_events_log(event_name);
CREATE INDEX IF NOT EXISTS idx_capi_events_contact ON capi_events_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_capi_events_success ON capi_events_log(success);
CREATE INDEX IF NOT EXISTS idx_capi_events_sent_at ON capi_events_log(sent_at);

-- Indice composto para queries de dashboard
CREATE INDEX IF NOT EXISTS idx_capi_events_location_name ON capi_events_log(location_id, event_name);

-- Permissoes: apenas authenticated (admin dashboard)
GRANT SELECT ON capi_events_log TO authenticated;
-- INSERT/UPDATE via service_role (n8n usa service_role key)

-- Comentarios
COMMENT ON TABLE capi_events_log IS 'Log de eventos enviados ao Meta Conversions API (CAPI). Sem PII.';
COMMENT ON COLUMN capi_events_log.event_name IS 'Tipo do evento: LeadQualified, Schedule, CompleteRegistration, Purchase';
COMMENT ON COLUMN capi_events_log.event_id IS 'ID unico para dedup no Meta (contact_id + event_name + timestamp)';
COMMENT ON COLUMN capi_events_log.event_data IS 'Dados do evento sem PII: action_source, value, currency, content_name';
COMMENT ON COLUMN capi_events_log.fbtrace_id IS 'Trace ID retornado pelo Meta para debug no Events Manager';

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS capi_events_log;
-- COMMIT;
