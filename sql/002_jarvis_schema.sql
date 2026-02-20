-- migration: 002_jarvis_schema.sql
-- autor: supabase-dba agent
-- data: 2026-02-20
-- descricao: Schema completo do JARVIS - assistente pessoal com memoria vetorial, projetos e Brain Router

-- ============================================================
-- UP
-- ============================================================

-- Extensao pgvector para busca semantica
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================
-- TABELA: jarvis_conversations
-- Sessoes de chat do usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jarvis_conversations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT,
  project_slug TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_jarvis_conversations_updated_at
  BEFORE UPDATE ON public.jarvis_conversations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE public.jarvis_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_conversations_user_all"
  ON public.jarvis_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jarvis_conversations_user_id
  ON public.jarvis_conversations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jarvis_conversations_project_slug
  ON public.jarvis_conversations (project_slug)
  WHERE project_slug IS NOT NULL;

-- ============================================================
-- TABELA: jarvis_messages
-- Mensagens individuais de cada conversa
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jarvis_messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID          NOT NULL REFERENCES public.jarvis_conversations(id) ON DELETE CASCADE,
  role            TEXT          NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content         TEXT          NOT NULL,
  tokens_used     INT           NOT NULL DEFAULT 0,
  cost            NUMERIC(10,6) NOT NULL DEFAULT 0,
  model           TEXT,
  intent          TEXT,
  project_slug    TEXT,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.jarvis_messages ENABLE ROW LEVEL SECURITY;

-- RLS via ownership da conversation
CREATE POLICY "jarvis_messages_user_all"
  ON public.jarvis_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.jarvis_conversations jc
      WHERE jc.id = jarvis_messages.conversation_id
        AND jc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jarvis_conversations jc
      WHERE jc.id = jarvis_messages.conversation_id
        AND jc.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_jarvis_messages_conversation_created
  ON public.jarvis_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_jarvis_messages_project_slug
  ON public.jarvis_messages (project_slug)
  WHERE project_slug IS NOT NULL;

-- ============================================================
-- TABELA: jarvis_memory
-- Memoria vetorial do usuario (pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jarvis_memory (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT          NOT NULL CHECK (type IN ('task', 'preference', 'decision', 'update', 'fact')),
  content      TEXT          NOT NULL,
  project_slug TEXT,
  embedding    vector(1536),
  importance   FLOAT         NOT NULL DEFAULT 0.5,
  source       TEXT          NOT NULL DEFAULT 'conversation',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);

ALTER TABLE public.jarvis_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_memory_user_all"
  ON public.jarvis_memory
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index ivfflat para busca vetorial eficiente (cosine)
-- lists=100 adequado para ate ~1M vetores
CREATE INDEX IF NOT EXISTS idx_jarvis_memory_embedding
  ON public.jarvis_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_jarvis_memory_user_type
  ON public.jarvis_memory (user_id, type);

CREATE INDEX IF NOT EXISTS idx_jarvis_memory_project_slug
  ON public.jarvis_memory (project_slug)
  WHERE project_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jarvis_memory_expires_at
  ON public.jarvis_memory (expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================
-- TABELA: jarvis_projects
-- Projetos configurados pelo usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jarvis_projects (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT      NOT NULL,
  slug         TEXT      NOT NULL,
  description  TEXT,
  type         TEXT      NOT NULL DEFAULT 'general' CHECK (type IN ('coding', 'business', 'content', 'financial', 'personal', 'general')),
  path         TEXT,
  keywords     TEXT[]    NOT NULL DEFAULT '{}',
  permissions  JSONB     NOT NULL DEFAULT '{"read": true, "write": true, "execute": false}',
  claude_md    TEXT,
  model_override TEXT,
  is_active    BOOLEAN   NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TRIGGER set_jarvis_projects_updated_at
  BEFORE UPDATE ON public.jarvis_projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE public.jarvis_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_projects_user_all"
  ON public.jarvis_projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jarvis_projects_slug
  ON public.jarvis_projects (slug);

CREATE INDEX IF NOT EXISTS idx_jarvis_projects_user_active
  ON public.jarvis_projects (user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jarvis_projects_keywords
  ON public.jarvis_projects USING gin (keywords);

-- ============================================================
-- TABELA: jarvis_brain_config
-- Configuracao individual do Brain Router por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jarvis_brain_config (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword_confidence        FLOAT       NOT NULL DEFAULT 0.8,
  semantic_confidence       FLOAT       NOT NULL DEFAULT 0.6,
  max_docs_context          INT         NOT NULL DEFAULT 5,
  max_conversations_context INT         NOT NULL DEFAULT 5,
  max_memories_context      INT         NOT NULL DEFAULT 10,
  default_model             TEXT        NOT NULL DEFAULT 'claude-3-5-haiku-20241022',
  rate_limit_per_minute     INT         NOT NULL DEFAULT 30,
  max_response_length       INT         NOT NULL DEFAULT 4000,
  confirm_destructive       BOOLEAN     NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_jarvis_brain_config_updated_at
  BEFORE UPDATE ON public.jarvis_brain_config
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE public.jarvis_brain_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_brain_config_user_all"
  ON public.jarvis_brain_config
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FUNCAO RPC: jarvis_search_memory
-- Busca semantica por similaridade coseno na memoria do usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.jarvis_search_memory(
  query_embedding  vector(1536),
  match_threshold  float   DEFAULT 0.7,
  match_count      int     DEFAULT 10,
  filter_project   text    DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  type         text,
  content      text,
  project_slug text,
  importance   float,
  similarity   float,
  created_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jm.id,
    jm.type,
    jm.content,
    jm.project_slug,
    jm.importance,
    (1 - (jm.embedding <=> query_embedding))::float AS similarity,
    jm.created_at
  FROM public.jarvis_memory jm
  WHERE
    jm.user_id = auth.uid()
    AND jm.embedding IS NOT NULL
    AND (jm.expires_at IS NULL OR jm.expires_at > now())
    AND (1 - (jm.embedding <=> query_embedding)) >= match_threshold
    AND (filter_project IS NULL OR jm.project_slug = filter_project)
  ORDER BY jm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- FUNCAO RPC: jarvis_save_memory
-- Salvar nova memoria vetorial
-- ============================================================
CREATE OR REPLACE FUNCTION public.jarvis_save_memory(
  p_user_id    uuid,
  p_type       text,
  p_content    text,
  p_project    text    DEFAULT NULL,
  p_embedding  vector(1536) DEFAULT NULL,
  p_importance float   DEFAULT 0.5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Validar que o caller e o proprio usuario ou service_role
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot save memory for another user';
  END IF;

  INSERT INTO public.jarvis_memory (
    user_id, type, content, project_slug, embedding, importance
  ) VALUES (
    p_user_id, p_type, p_content, p_project, p_embedding, p_importance
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- VIEW: vw_jarvis_stats
-- Stats agregadas do Jarvis por usuario
-- ============================================================
CREATE OR REPLACE VIEW public.vw_jarvis_stats AS
SELECT
  u.id                                           AS user_id,
  COUNT(DISTINCT jc.id)                          AS total_conversations,
  COUNT(DISTINCT jm.id)                          AS total_messages,
  COALESCE(SUM(jm.cost), 0)                      AS total_cost,
  COALESCE(SUM(jm.tokens_used), 0)               AS total_tokens,
  COUNT(DISTINCT mem.id)                         AS total_memories,
  COUNT(DISTINCT jp.id) FILTER (WHERE jp.is_active) AS active_projects,
  -- breakdown de memorias por tipo
  COUNT(DISTINCT mem.id) FILTER (WHERE mem.type = 'task')       AS memories_tasks,
  COUNT(DISTINCT mem.id) FILTER (WHERE mem.type = 'preference') AS memories_preferences,
  COUNT(DISTINCT mem.id) FILTER (WHERE mem.type = 'decision')   AS memories_decisions,
  COUNT(DISTINCT mem.id) FILTER (WHERE mem.type = 'update')     AS memories_updates,
  COUNT(DISTINCT mem.id) FILTER (WHERE mem.type = 'fact')       AS memories_facts,
  -- ultima atividade
  MAX(jc.updated_at)                             AS last_conversation_at,
  -- custo ultimos 30 dias
  COALESCE(SUM(jm.cost) FILTER (
    WHERE jm.created_at >= now() - INTERVAL '30 days'
  ), 0)                                          AS cost_last_30_days
FROM auth.users u
LEFT JOIN public.jarvis_conversations jc ON jc.user_id = u.id
LEFT JOIN public.jarvis_messages jm      ON jm.conversation_id = jc.id
LEFT JOIN public.jarvis_memory mem       ON mem.user_id = u.id
LEFT JOIN public.jarvis_projects jp      ON jp.user_id = u.id
GROUP BY u.id;

-- ============================================================
-- DOWN (rollback — descomentar para reverter)
-- ============================================================
-- BEGIN;
-- DROP VIEW  IF EXISTS public.vw_jarvis_stats;
-- DROP FUNCTION IF EXISTS public.jarvis_save_memory(uuid, text, text, text, vector, float);
-- DROP FUNCTION IF EXISTS public.jarvis_search_memory(vector, float, int, text);
-- DROP TABLE IF EXISTS public.jarvis_brain_config  CASCADE;
-- DROP TABLE IF EXISTS public.jarvis_projects      CASCADE;
-- DROP TABLE IF EXISTS public.jarvis_memory        CASCADE;
-- DROP TABLE IF EXISTS public.jarvis_messages      CASCADE;
-- DROP TABLE IF EXISTS public.jarvis_conversations CASCADE;
-- COMMIT;
