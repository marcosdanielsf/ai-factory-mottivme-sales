-- Migration 078: Onboarding Tracker — client_onboardings + onboarding_checklist_items
-- Creates: client_onboardings, onboarding_checklist_items
-- Author: supabase-dba agent
-- Date: 2026-03-12
--
-- ROLLBACK PLAN:
-- BEGIN;
--   DROP TABLE IF EXISTS onboarding_checklist_items;
--   DROP TABLE IF EXISTS client_onboardings;
-- COMMIT;

-- ---------------------------------------------------------------------------
-- Extensao moddatetime (necessaria para trigger updated_at)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ---------------------------------------------------------------------------
-- 1. Tabela: client_onboardings
--    Registro principal de onboarding por cliente.
--    Nao usa FK para clients(id) pois a tabela clients pode nao existir.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_onboardings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID        NOT NULL,
  client_name   TEXT        NOT NULL,
  vertical      TEXT        NOT NULL
    CHECK (vertical IN ('clinica', 'imobiliaria', 'servicos', 'ecommerce', 'educacao', 'outro')),
  current_step  INTEGER     NOT NULL DEFAULT 1
    CHECK (current_step BETWEEN 1 AND 7),
  status        TEXT        NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento', 'concluido', 'atrasado', 'cancelado')),
  assigned_to   TEXT,
  sla_deadline  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: manter updated_at sincronizado automaticamente
CREATE TRIGGER set_updated_at_client_onboardings
  BEFORE UPDATE ON public.client_onboardings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Indices
CREATE INDEX IF NOT EXISTS idx_client_onboardings_client_id
  ON public.client_onboardings (client_id);

CREATE INDEX IF NOT EXISTS idx_client_onboardings_status
  ON public.client_onboardings (status)
  WHERE status IN ('em_andamento', 'atrasado');

-- RLS
ALTER TABLE public.client_onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_client_onboardings"
  ON public.client_onboardings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_client_onboardings"
  ON public.client_onboardings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_client_onboardings"
  ON public.client_onboardings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. Tabela: onboarding_checklist_items
--    Itens de checklist por step de cada onboarding.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_checklist_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id  UUID        NOT NULL
    REFERENCES public.client_onboardings (id) ON DELETE CASCADE,
  step_number    INTEGER     NOT NULL CHECK (step_number BETWEEN 1 AND 7),
  step_key       TEXT        NOT NULL,
  step_label     TEXT        NOT NULL,
  is_completed   BOOLEAN     NOT NULL DEFAULT false,
  completed_at   TIMESTAMPTZ,
  completed_by   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: cada step_number unico por onboarding
ALTER TABLE public.onboarding_checklist_items
  ADD CONSTRAINT uq_onboarding_step
  UNIQUE (onboarding_id, step_number);

-- Indice para lookup por onboarding
CREATE INDEX IF NOT EXISTS idx_checklist_items_onboarding_id
  ON public.onboarding_checklist_items (onboarding_id);

-- RLS
ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_checklist_items"
  ON public.onboarding_checklist_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_checklist_items"
  ON public.onboarding_checklist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_checklist_items"
  ON public.onboarding_checklist_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
