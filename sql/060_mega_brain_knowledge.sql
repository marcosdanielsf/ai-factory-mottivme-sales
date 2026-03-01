-- migration: 060_mega_brain_knowledge.sql
-- autor: supabase-dba agent
-- data: 2026-03-01
-- descricao: Mega Brain — tabelas de ingestao de conhecimento com embeddings pgvector

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================
-- DROP FUNCTION IF EXISTS search_knowledge(vector(1536), FLOAT, INT, TEXT);
-- DROP TABLE IF EXISTS knowledge_chunks;
-- DROP TABLE IF EXISTS knowledge_sources;
-- (triggers sao removidos automaticamente com o DROP TABLE)

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- Extensao pgvector (ja habilitada no Supabase, idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- Extensao moddatetime (ja habilitada no Supabase, idempotente)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ------------------------------------------------------------
-- Fontes de conhecimento
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT        NOT NULL,
  source_type        TEXT        NOT NULL CHECK (source_type IN (
                                   'youtube', 'pdf', 'audio', 'whatsapp_chat', 'slack',
                                   'gdrive_doc', 'webpage', 'transcript', 'note',
                                   'call_recording', 'spreadsheet'
                                 )),
  source_url         TEXT,
  source_file_path   TEXT,
  author             TEXT,
  duration_seconds   INTEGER,
  total_chunks       INTEGER,
  total_tokens       INTEGER,
  processing_status  TEXT        NOT NULL DEFAULT 'pending' CHECK (processing_status IN (
                                   'pending', 'processing', 'completed', 'failed'
                                 )),
  processing_error   TEXT,
  raw_text           TEXT,
  metadata           JSONB       NOT NULL DEFAULT '{}',
  user_id            UUID        DEFAULT auth.uid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Chunks com embeddings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           UUID        NOT NULL,
  content             TEXT        NOT NULL,
  embedding           vector(1536),
  chunk_index         INTEGER     NOT NULL,
  chunk_overlap_prev  TEXT,
  chunk_overlap_next  TEXT,
  token_count         INTEGER,
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Foreign key
-- ------------------------------------------------------------
ALTER TABLE public.knowledge_chunks
  ADD CONSTRAINT fk_chunks_source
  FOREIGN KEY (source_id) REFERENCES public.knowledge_sources(id)
  ON DELETE CASCADE;

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
-- Busca semantica via cosine distance (ivfflat)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source
  ON public.knowledge_chunks(source_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type
  ON public.knowledge_sources(source_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status
  ON public.knowledge_sources(processing_status);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.knowledge_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Chunks: qualquer usuario autenticado pode ler e inserir
-- (ownership controlado pela fonte, nao pelo chunk)
CREATE POLICY "Authenticated users can read all knowledge"
  ON public.knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert knowledge"
  ON public.knowledge_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sources: CRUD completo para autenticados (multi-tenant via user_id na query)
CREATE POLICY "Authenticated users can CRUD sources"
  ON public.knowledge_sources
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- Trigger updated_at em knowledge_sources
-- ------------------------------------------------------------
CREATE TRIGGER set_updated_at_knowledge_sources
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ------------------------------------------------------------
-- RPC: busca semantica nos chunks
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_knowledge(
  query_embedding    vector(1536),
  match_threshold    FLOAT   DEFAULT 0.7,
  match_count        INT     DEFAULT 10,
  filter_source_type TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  source_title TEXT,
  source_type TEXT,
  source_url  TEXT,
  author      TEXT,
  similarity  FLOAT,
  metadata    JSONB,
  chunk_index INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    ks.title              AS source_title,
    ks.source_type,
    ks.source_url,
    ks.author,
    (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity,
    kc.metadata,
    kc.chunk_index
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_sources ks ON kc.source_id = ks.id
  WHERE (1 - (kc.embedding <=> query_embedding)) > match_threshold
    AND (filter_source_type IS NULL OR ks.source_type = filter_source_type)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant para usuarios autenticados chamarem via RPC
GRANT EXECUTE ON FUNCTION public.search_knowledge(
  vector(1536), FLOAT, INT, TEXT
) TO authenticated;

COMMIT;

-- ============================================================
-- DOWN (rollback — descomentar e executar se necessario)
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.search_knowledge(vector(1536), FLOAT, INT, TEXT);
-- DROP TABLE IF EXISTS public.knowledge_chunks;
-- DROP TABLE IF EXISTS public.knowledge_sources;
-- COMMIT;
