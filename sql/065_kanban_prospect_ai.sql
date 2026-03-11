-- migration: 065_kanban_prospect_ai.sql
-- autor: supabase-dba agent
-- data: 2026-03-02
-- descricao: Kanban Prospect AI — modulo de prospecção outbound com cadencias,
--            dimensoes de ICP, qualificacao e log de geracoes IA

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS public.kanban_ai_logs              CASCADE;
-- DROP TABLE IF EXISTS public.kanban_qualifications       CASCADE;
-- DROP TABLE IF EXISTS public.kanban_cadence_steps        CASCADE;
-- DROP TABLE IF EXISTS public.kanban_cadences             CASCADE;
-- DROP TABLE IF EXISTS public.kanban_dimensions           CASCADE;
-- DROP TABLE IF EXISTS public.prospect_kanbans            CASCADE;
-- COMMIT;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- Extensao moddatetime (ja habilitada no banco — idempotente)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================
-- 1. prospect_kanbans
--    Tabela raiz: cada kanban representa uma campanha de prospecção
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prospect_kanbans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  prospecting_type  TEXT        NOT NULL DEFAULT 'outbound'
                                CHECK (prospecting_type IN ('inbound', 'outbound', 'misto')),
  avg_ticket        TEXT,                          -- texto livre: "R$5k-10k/mês"
  industry          TEXT,
  target_icp        TEXT,                          -- descricao em linguagem natural
  ai_seed_input     TEXT,                          -- input original do usuario
  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'active', 'archived')),
  location_id       TEXT,                          -- ID do cliente GHL (null = uso proprio MOTTIVME)
  created_by        UUID        REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_kanbans ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_prospect_kanbans
  BEFORE UPDATE ON public.prospect_kanbans
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 2. kanban_dimensions
--    Dimensoes de ICP geradas por IA: produto, dores, sonhos etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanban_dimensions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kanban_id       UUID        NOT NULL REFERENCES public.prospect_kanbans(id) ON DELETE CASCADE,
  dimension_type  TEXT        NOT NULL
                              CHECK (dimension_type IN (
                                'produto',
                                'case_dor',
                                'case_sonho',
                                'sonhos',
                                'dores',
                                'atividades'
                              )),
  title           TEXT,
  content         TEXT,                            -- markdown
  examples        JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- array de bullets/exemplos
  ai_generated    BOOLEAN     NOT NULL DEFAULT true,
  ai_version      INTEGER     NOT NULL DEFAULT 1,
  approved_by     UUID        REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_dimensions ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_kanban_dimensions
  BEFORE UPDATE ON public.kanban_dimensions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 3. kanban_cadences
--    Cadencias de prospecção: Fundamental, Transacional, Relacional, Custom
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanban_cadences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kanban_id       UUID        NOT NULL REFERENCES public.prospect_kanbans(id) ON DELETE CASCADE,
  cadence_name    TEXT        NOT NULL,             -- Fundamental | Transacional | Relacional | Custom
  cadence_type    TEXT
                              CHECK (cadence_type IN (
                                'fundamental_3x3x3',
                                'transacional_5x3x1',
                                'relacional_3x4x4',
                                'custom'
                              )),
  total_contacts  INTEGER,
  days_duration   INTEGER,
  channels        JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- canais habilitados
  is_active       BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_cadences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. kanban_cadence_steps
--    Passos de cada cadencia: dia, canal, template de mensagem
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanban_cadence_steps (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id       UUID        NOT NULL REFERENCES public.kanban_cadences(id) ON DELETE CASCADE,
  step_number      INTEGER     NOT NULL,
  day_offset       INTEGER     NOT NULL,
  channel          TEXT        NOT NULL
                               CHECK (channel IN (
                                 'phone',
                                 'email',
                                 'sms',
                                 'whatsapp',
                                 'linkedin',
                                 'instagram',
                                 'facebook',
                                 'twitter'
                               )),
  objective        TEXT,
  message_template TEXT,
  tips_for_sdr     TEXT,
  ai_generated     BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_cadence_steps ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. kanban_qualifications
--    Criterios de qualificacao: must_have, nice_to_have, red_flag
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanban_qualifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kanban_id     UUID        NOT NULL REFERENCES public.prospect_kanbans(id) ON DELETE CASCADE,
  item_type     TEXT        NOT NULL
                            CHECK (item_type IN ('must_have', 'nice_to_have', 'red_flag')),
  description   TEXT        NOT NULL,
  consequence   TEXT,                              -- usado principalmente em red_flags
  ai_generated  BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_qualifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. kanban_ai_logs
--    Auditoria de geracoes IA: tokens, custo, duracao, status
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kanban_ai_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kanban_id       UUID        NOT NULL REFERENCES public.prospect_kanbans(id) ON DELETE CASCADE,
  trigger_type    TEXT
                              CHECK (trigger_type IN (
                                'initial',
                                'regenerate_full',
                                'regenerate_partial'
                              )),
  dimension_type  TEXT,                            -- NULL para geracoes completas
  model_used      TEXT,
  prompt_version  TEXT,
  tokens_input    INTEGER,
  tokens_output   INTEGER,
  cost_brl        NUMERIC(8, 4),
  duration_ms     INTEGER,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'success', 'error')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kanban_ai_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================

-- prospect_kanbans
CREATE INDEX IF NOT EXISTS idx_prospect_kanbans_created_by
  ON public.prospect_kanbans(created_by);

CREATE INDEX IF NOT EXISTS idx_prospect_kanbans_location_id
  ON public.prospect_kanbans(location_id);

CREATE INDEX IF NOT EXISTS idx_prospect_kanbans_status
  ON public.prospect_kanbans(status);

-- kanban_dimensions
CREATE INDEX IF NOT EXISTS idx_kanban_dimensions_kanban_id
  ON public.kanban_dimensions(kanban_id);

CREATE INDEX IF NOT EXISTS idx_kanban_dimensions_dimension_type
  ON public.kanban_dimensions(dimension_type);

-- kanban_cadences
CREATE INDEX IF NOT EXISTS idx_kanban_cadences_kanban_id
  ON public.kanban_cadences(kanban_id);

-- kanban_cadence_steps
CREATE INDEX IF NOT EXISTS idx_kanban_cadence_steps_cadence_id
  ON public.kanban_cadence_steps(cadence_id);

-- kanban_qualifications
CREATE INDEX IF NOT EXISTS idx_kanban_qualifications_kanban_id
  ON public.kanban_qualifications(kanban_id);

-- kanban_ai_logs
CREATE INDEX IF NOT EXISTS idx_kanban_ai_logs_kanban_id
  ON public.kanban_ai_logs(kanban_id);

CREATE INDEX IF NOT EXISTS idx_kanban_ai_logs_status
  ON public.kanban_ai_logs(status, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- Estrategia MVP (sem multitenancy por workspace):
--   SELECT  → qualquer usuario autenticado (MOTTIVME e admin)
--   INSERT  → qualquer usuario autenticado
--   UPDATE  → apenas created_by = auth.uid() (owner)
--   DELETE  → apenas created_by = auth.uid() (owner)
--
-- Tabelas filhas (dimensions, cadences, steps, qualifications, logs):
--   Herdam acesso via JOIN com prospect_kanbans — mesma politica simplificada.
-- ============================================================

-- ------------------------------------------------------------
-- prospect_kanbans policies
-- ------------------------------------------------------------
CREATE POLICY "kanban_select_authenticated"
  ON public.prospect_kanbans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "kanban_insert_authenticated"
  ON public.prospect_kanbans
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "kanban_update_owner"
  ON public.prospect_kanbans
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "kanban_delete_owner"
  ON public.prospect_kanbans
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ------------------------------------------------------------
-- kanban_dimensions policies
-- ------------------------------------------------------------
CREATE POLICY "dimensions_select_authenticated"
  ON public.kanban_dimensions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dimensions_insert_authenticated"
  ON public.kanban_dimensions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "dimensions_update_authenticated"
  ON public.kanban_dimensions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_dimensions.kanban_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "dimensions_delete_authenticated"
  ON public.kanban_dimensions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_dimensions.kanban_id
        AND created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- kanban_cadences policies
-- ------------------------------------------------------------
CREATE POLICY "cadences_select_authenticated"
  ON public.kanban_cadences
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cadences_insert_authenticated"
  ON public.kanban_cadences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cadences_update_authenticated"
  ON public.kanban_cadences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_cadences.kanban_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "cadences_delete_authenticated"
  ON public.kanban_cadences
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_cadences.kanban_id
        AND created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- kanban_cadence_steps policies
-- ------------------------------------------------------------
CREATE POLICY "cadence_steps_select_authenticated"
  ON public.kanban_cadence_steps
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cadence_steps_insert_authenticated"
  ON public.kanban_cadence_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cadence_steps_update_authenticated"
  ON public.kanban_cadence_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_cadences kc
      JOIN public.prospect_kanbans pk ON pk.id = kc.kanban_id
      WHERE kc.id = kanban_cadence_steps.cadence_id
        AND pk.created_by = auth.uid()
    )
  );

CREATE POLICY "cadence_steps_delete_authenticated"
  ON public.kanban_cadence_steps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_cadences kc
      JOIN public.prospect_kanbans pk ON pk.id = kc.kanban_id
      WHERE kc.id = kanban_cadence_steps.cadence_id
        AND pk.created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- kanban_qualifications policies
-- ------------------------------------------------------------
CREATE POLICY "qualifications_select_authenticated"
  ON public.kanban_qualifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "qualifications_insert_authenticated"
  ON public.kanban_qualifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "qualifications_update_authenticated"
  ON public.kanban_qualifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_qualifications.kanban_id
        AND created_by = auth.uid()
    )
  );

CREATE POLICY "qualifications_delete_authenticated"
  ON public.kanban_qualifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospect_kanbans
      WHERE id = kanban_qualifications.kanban_id
        AND created_by = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- kanban_ai_logs policies
--   Logs sao insert-only pelo backend (service role) e
--   leitura por qualquer usuario autenticado para auditoria.
--   UPDATE/DELETE bloqueados intencionalmente (imutabilidade).
-- ------------------------------------------------------------
CREATE POLICY "ai_logs_select_authenticated"
  ON public.kanban_ai_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ai_logs_insert_authenticated"
  ON public.kanban_ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sem UPDATE/DELETE policies para kanban_ai_logs (logs sao imutaveis)

COMMIT;

-- Migration 065 complete
