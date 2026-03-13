-- migration: 010_jarvis_embedding_768.sql
-- autor: supabase-dba agent
-- data: 2026-03-12
-- descricao: Alterar embedding de 1536 (OpenAI) para 768 (nomic-embed-text local)
--            + atualizar funcoes de busca e insert

-- ============================================================
-- UP
-- ============================================================

-- 1. Alterar coluna embedding para 768 dims
ALTER TABLE public.jarvis_memory
  ALTER COLUMN embedding TYPE vector(768);

-- 2. Recriar indice ivfflat (precisa dropar e recriar com novo tipo)
DROP INDEX IF EXISTS idx_jarvis_memory_embedding;
CREATE INDEX idx_jarvis_memory_embedding
  ON public.jarvis_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3. Atualizar funcao de busca semantica
CREATE OR REPLACE FUNCTION public.jarvis_search_memory(
  query_embedding  vector(768),
  match_threshold  float   DEFAULT 0.7,
  match_count      int     DEFAULT 10,
  filter_project   text    DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  type       text,
  content    text,
  project_slug text,
  importance float,
  similarity float,
  created_at timestamptz
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND (1 - (jm.embedding <=> query_embedding)) > match_threshold
    AND (filter_project IS NULL OR jm.project_slug = filter_project)
  ORDER BY jm.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. Atualizar funcao de save memory
CREATE OR REPLACE FUNCTION public.jarvis_save_memory(
  p_user_id    uuid,
  p_type       text,
  p_content    text,
  p_project    text    DEFAULT NULL,
  p_embedding  vector(768) DEFAULT NULL,
  p_importance float   DEFAULT 0.5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Garante que user so salva pra si mesmo
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden: cannot save memory for another user';
  END IF;

  INSERT INTO public.jarvis_memory (
    user_id, type, content, project_slug, embedding, importance
  ) VALUES (
    p_user_id, p_type, p_content, p_project, p_embedding, p_importance
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 5. Funcao para busca sem RLS (service role, usada por scripts)
CREATE OR REPLACE FUNCTION public.jarvis_search_memory_admin(
  p_user_id        uuid,
  query_embedding  vector(768),
  match_threshold  float   DEFAULT 0.6,
  match_count      int     DEFAULT 10,
  filter_type      text    DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  type       text,
  content    text,
  project_slug text,
  importance float,
  similarity float,
  created_at timestamptz
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    jm.user_id = p_user_id
    AND jm.embedding IS NOT NULL
    AND (1 - (jm.embedding <=> query_embedding)) > match_threshold
    AND (filter_type IS NULL OR jm.type = filter_type)
  ORDER BY jm.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- ALTER TABLE public.jarvis_memory ALTER COLUMN embedding TYPE vector(1536);
-- DROP INDEX IF EXISTS idx_jarvis_memory_embedding;
-- CREATE INDEX idx_jarvis_memory_embedding ON public.jarvis_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- DROP FUNCTION IF EXISTS public.jarvis_search_memory_admin;
