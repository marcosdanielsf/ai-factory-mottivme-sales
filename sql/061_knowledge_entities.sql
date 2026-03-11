-- migration: 061_knowledge_entities.sql
-- autor: mega-brain team
-- data: 2026-03-01
-- descricao: Mega Brain — entidades canonicas, mencoes e fuzzy matching

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================
-- DROP FUNCTION IF EXISTS find_entity_fuzzy(TEXT, FLOAT);
-- DROP TABLE IF EXISTS entity_mentions;
-- DROP TABLE IF EXISTS knowledge_entities;

-- ============================================================
-- UP
-- ============================================================

-- pg_trgm para fuzzy matching de nomes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- Entidades canonicas (pessoas, empresas, topicos, etc)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_entities (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name   TEXT        NOT NULL UNIQUE,
  entity_type      TEXT        NOT NULL CHECK (entity_type IN (
                                 'person', 'company', 'topic', 'book',
                                 'framework', 'tool', 'place'
                               )),
  aliases          TEXT[]      DEFAULT '{}',
  description      TEXT,
  metadata         JSONB       DEFAULT '{}',
  mention_count    INTEGER     DEFAULT 0,
  first_seen_at    TIMESTAMPTZ DEFAULT now(),
  last_seen_at     TIMESTAMPTZ DEFAULT now(),
  dossier_text     TEXT,
  dossier_updated_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Mencoes: liga chunk <-> entidade
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_mentions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID        NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
  chunk_id         UUID        NOT NULL REFERENCES public.knowledge_chunks(id) ON DELETE CASCADE,
  source_id        UUID        NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  mention_text     TEXT        NOT NULL,
  context_snippet  TEXT,
  confidence       FLOAT       DEFAULT 1.0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, chunk_id)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_entities_name_trgm
  ON public.knowledge_entities USING gin (canonical_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_entities_type
  ON public.knowledge_entities(entity_type);

CREATE INDEX IF NOT EXISTS idx_entity_mentions_entity
  ON public.entity_mentions(entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_mentions_chunk
  ON public.entity_mentions(chunk_id);

CREATE INDEX IF NOT EXISTS idx_entity_mentions_source
  ON public.entity_mentions(source_id);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read entities"
  ON public.knowledge_entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert entities"
  ON public.knowledge_entities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update entities"
  ON public.knowledge_entities FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read mentions"
  ON public.entity_mentions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert mentions"
  ON public.entity_mentions FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- RPC: buscar entidade por nome fuzzy (trigram similarity)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_entity_fuzzy(
  search_name          TEXT,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id              UUID,
  canonical_name  TEXT,
  entity_type     TEXT,
  aliases         TEXT[],
  similarity      FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.canonical_name,
    ke.entity_type,
    ke.aliases,
    similarity(ke.canonical_name, search_name)::FLOAT AS sim
  FROM public.knowledge_entities ke
  WHERE similarity(ke.canonical_name, search_name) > similarity_threshold
     OR search_name = ANY(ke.aliases)
  ORDER BY sim DESC
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_entity_fuzzy(TEXT, FLOAT) TO authenticated;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP FUNCTION IF EXISTS public.find_entity_fuzzy(TEXT, FLOAT);
-- DROP TABLE IF EXISTS public.entity_mentions;
-- DROP TABLE IF EXISTS public.knowledge_entities;
