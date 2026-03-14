-- FormFlow v1.0.0
-- Migration 090: FormFlow — clone Typeform integrado ao AI Factory
-- Cria: ff_workspaces, ff_forms, ff_fields, ff_submissions, ff_analytics_events
-- View:  vw_ff_form_stats
-- Author: supabase-dba agent
-- Date: 2026-03-14
--
-- ROLLBACK PLAN:
-- BEGIN;
--   DROP VIEW  IF EXISTS vw_ff_form_stats;
--   DROP TABLE IF EXISTS ff_analytics_events;
--   DROP TABLE IF EXISTS ff_submissions;
--   DROP TABLE IF EXISTS ff_fields;
--   DROP TABLE IF EXISTS ff_forms;
--   DROP TABLE IF EXISTS ff_workspaces;
-- COMMIT;

-- ---------------------------------------------------------------------------
-- Extensao moddatetime (necessaria para triggers de updated_at)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================================
-- 1. ff_workspaces — workspace/conta do FormFlow
--    Cada workspace pertence a um usuario autenticado (owner_id).
--    Multiplos forms podem existir dentro de um workspace.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ff_workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  owner_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: updated_at automatico
CREATE TRIGGER set_ff_workspaces_updated_at
  BEFORE UPDATE ON public.ff_workspaces
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.ff_workspaces ENABLE ROW LEVEL SECURITY;

-- Dono ve e gerencia seu proprio workspace
CREATE POLICY "ff_workspaces_owner_select"
  ON public.ff_workspaces FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "ff_workspaces_owner_insert"
  ON public.ff_workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "ff_workspaces_owner_update"
  ON public.ff_workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "ff_workspaces_owner_delete"
  ON public.ff_workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- 2. ff_forms — formularios
--    Cada form pertence a um workspace.
--    slug e o identificador publico para a URL de resposta.
--    ghl_mapping mapeia field_id -> custom_field_id do GoHighLevel.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ff_forms (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES public.ff_workspaces(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  slug         TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  -- Configuracoes: theme, redirect_url, close_message, etc.
  settings     JSONB       NOT NULL DEFAULT '{}',
  -- Webhook disparado a cada nova submission
  webhook_url  TEXT,
  -- Mapeamento field_id -> custom_field_id do GHL para sync automatico
  ghl_mapping  JSONB       NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: updated_at automatico
CREATE TRIGGER set_ff_forms_updated_at
  BEFORE UPDATE ON public.ff_forms
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ff_forms_workspace_id  ON public.ff_forms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ff_forms_status        ON public.ff_forms(status);
-- slug ja e UNIQUE (index criado automaticamente)

-- RLS
ALTER TABLE public.ff_forms ENABLE ROW LEVEL SECURITY;

-- Dono do workspace acessa seus forms
CREATE POLICY "ff_forms_owner_all"
  ON public.ff_forms FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.ff_workspaces
      WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. ff_fields — campos/perguntas do formulario
--    Suporta 11 tipos de campo.
--    skip_logic define logica condicional: [{if, operator, value, then: {go_to}}]
--    position define a ordem de exibicao no formulario.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ff_fields (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID    NOT NULL REFERENCES public.ff_forms(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL
    CHECK (type IN (
      'short_text', 'long_text', 'multiple_choice', 'single_choice',
      'rating', 'scale', 'email', 'phone', 'date',
      'file_upload', 'statement', 'yes_no'
    )),
  title       TEXT    NOT NULL,
  description TEXT,
  required    BOOLEAN NOT NULL DEFAULT false,
  -- Ordem de exibicao no formulario (1-based)
  position    INTEGER NOT NULL,
  -- Opcoes especificas do tipo: choices, placeholder, min, max, etc.
  properties  JSONB   NOT NULL DEFAULT '{}',
  -- Regras de validacao: regex, min_length, max_length, etc.
  validations JSONB   NOT NULL DEFAULT '{}',
  -- Logica de salto condicional
  -- Ex: [{"if": "field_id", "operator": "equals", "value": "sim", "then": {"go_to": "field_id"}}]
  skip_logic  JSONB   NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ff_fields_form_id  ON public.ff_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_ff_fields_position ON public.ff_fields(form_id, position);

-- RLS
ALTER TABLE public.ff_fields ENABLE ROW LEVEL SECURITY;

-- Dono do workspace gerencia os campos dos seus forms
CREATE POLICY "ff_fields_owner_all"
  ON public.ff_fields FOR ALL
  USING (
    form_id IN (
      SELECT f.id FROM public.ff_forms f
      JOIN public.ff_workspaces w ON w.id = f.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. ff_submissions — respostas submetidas
--    answers e um mapa {field_id: valor} persistido como JSONB.
--    metadata captura contexto de rastreio: IP, user_agent, UTMs, duracao.
--    Publico pode inserir (anon) — formularios sao acessiveis sem login.
--    Apenas o dono do form pode ler as respostas.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ff_submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      UUID        NOT NULL REFERENCES public.ff_forms(id) ON DELETE CASCADE,
  -- Mapa field_id -> valor respondido
  answers      JSONB       NOT NULL,
  -- Contexto da submissao: ip, user_agent, referrer, utm_source, utm_medium, duration_seconds
  metadata     JSONB       NOT NULL DEFAULT '{}',
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_complete  BOOLEAN     NOT NULL DEFAULT true
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ff_submissions_form_id      ON public.ff_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_ff_submissions_completed_at ON public.ff_submissions(completed_at DESC);

-- RLS
ALTER TABLE public.ff_submissions ENABLE ROW LEVEL SECURITY;

-- Dono do form pode ler todas as submissoes
CREATE POLICY "ff_submissions_owner_select"
  ON public.ff_submissions FOR SELECT
  USING (
    form_id IN (
      SELECT f.id FROM public.ff_forms f
      JOIN public.ff_workspaces w ON w.id = f.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- Qualquer pessoa (anon) pode submeter um formulario publicado
CREATE POLICY "ff_submissions_public_insert"
  ON public.ff_submissions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM public.ff_forms
      WHERE status = 'published'
    )
  );

-- ============================================================================
-- 5. ff_analytics_events — eventos de analytics por formulario
--    Captura: view, start, field_view, field_drop, completion.
--    submission_id e nullable (view/start acontecem antes da submission existir).
--    field_id e nullable (eventos de form-level nao referenciam campo especifico).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ff_analytics_events (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID    NOT NULL REFERENCES public.ff_forms(id) ON DELETE CASCADE,
  submission_id UUID    REFERENCES public.ff_submissions(id) ON DELETE SET NULL,
  event_type    TEXT    NOT NULL
    CHECK (event_type IN ('view', 'start', 'field_view', 'field_drop', 'completion')),
  -- Campo relacionado ao evento (apenas para field_view e field_drop)
  field_id      UUID    REFERENCES public.ff_fields(id) ON DELETE SET NULL,
  metadata      JSONB   NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ff_analytics_form_id    ON public.ff_analytics_events(form_id);
CREATE INDEX IF NOT EXISTS idx_ff_analytics_event_type ON public.ff_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ff_analytics_created_at ON public.ff_analytics_events(created_at DESC);

-- RLS
ALTER TABLE public.ff_analytics_events ENABLE ROW LEVEL SECURITY;

-- Dono do form pode ler os eventos de analytics
CREATE POLICY "ff_analytics_owner_select"
  ON public.ff_analytics_events FOR SELECT
  USING (
    form_id IN (
      SELECT f.id FROM public.ff_forms f
      JOIN public.ff_workspaces w ON w.id = f.workspace_id
      WHERE w.owner_id = auth.uid()
    )
  );

-- Qualquer pessoa (anon) pode registrar eventos em forms publicados
CREATE POLICY "ff_analytics_public_insert"
  ON public.ff_analytics_events FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM public.ff_forms
      WHERE status = 'published'
    )
  );

-- ============================================================================
-- 6. View: vw_ff_form_stats
--    Metricas consolidadas por formulario.
--    Calcula: total_submissions, completion_rate, avg_duration, total_views, total_starts.
--    completion_rate = submissions completas / total starts (0 a 100, 2 casas decimais).
--    avg_duration = media de duration_seconds registrado no metadata das submissions.
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_ff_form_stats
WITH (security_invoker = true) AS
SELECT
  f.id                                          AS form_id,
  f.title                                       AS form_title,
  f.slug,
  f.status,
  f.workspace_id,

  -- Total de submissoes completas
  COUNT(DISTINCT s.id) FILTER (WHERE s.is_complete = true)
                                                AS total_submissions,

  -- Views unicas (evento 'view')
  COUNT(ae_view.id)                             AS total_views,

  -- Starts (evento 'start')
  COUNT(ae_start.id)                            AS total_starts,

  -- Taxa de conclusao: submissions / starts (em %)
  CASE
    WHEN COUNT(ae_start.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(DISTINCT s.id) FILTER (WHERE s.is_complete = true)::NUMERIC
      / COUNT(ae_start.id)::NUMERIC * 100,
      2
    )
  END                                           AS completion_rate,

  -- Duracao media em segundos (extraida do metadata da submission)
  ROUND(
    AVG(
      (s.metadata ->> 'duration_seconds')::NUMERIC
    ) FILTER (WHERE (s.metadata ->> 'duration_seconds') IS NOT NULL),
    0
  )                                             AS avg_duration_seconds

FROM public.ff_forms f

LEFT JOIN public.ff_submissions s
  ON s.form_id = f.id

LEFT JOIN public.ff_analytics_events ae_view
  ON ae_view.form_id = f.id
  AND ae_view.event_type = 'view'

LEFT JOIN public.ff_analytics_events ae_start
  ON ae_start.form_id = f.id
  AND ae_start.event_type = 'start'

GROUP BY
  f.id,
  f.title,
  f.slug,
  f.status,
  f.workspace_id;
