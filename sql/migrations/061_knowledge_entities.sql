-- Migration 061: Knowledge Entities + Entity Mentions
-- Autor: supabase-dba agent
-- Data: 2026-03-01
-- Descricao: Entidades canonicas do Mega Brain + mencoes por chunk

-- Rollback: DROP TABLE entity_mentions; DROP TABLE knowledge_entities; DROP FUNCTION find_entity_fuzzy;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'company', 'topic', 'book', 'framework', 'tool', 'place')),
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  mention_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  dossier_text TEXT,
  dossier_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  context_snippet TEXT,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_id, chunk_id)
);

CREATE INDEX idx_entities_name_trgm ON knowledge_entities USING gin (canonical_name gin_trgm_ops);
CREATE INDEX idx_entity_mentions_entity ON entity_mentions(entity_id);
CREATE INDEX idx_entity_mentions_chunk ON entity_mentions(chunk_id);

ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read entities" ON knowledge_entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write entities" ON knowledge_entities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update entities" ON knowledge_entities FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth read mentions" ON entity_mentions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write mentions" ON entity_mentions FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION find_entity_fuzzy(
  search_name TEXT,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  canonical_name TEXT,
  entity_type TEXT,
  similarity FLOAT
) LANGUAGE plpgsql AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.canonical_name,
    ke.entity_type,
    similarity(ke.canonical_name, search_name)::FLOAT AS sim
  FROM knowledge_entities ke
  WHERE similarity(ke.canonical_name, search_name) > similarity_threshold
     OR search_name = ANY(ke.aliases)
  ORDER BY sim DESC
  LIMIT 5;
END;
$fn$;

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP FUNCTION IF EXISTS find_entity_fuzzy;
-- DROP TABLE IF EXISTS entity_mentions;
-- DROP TABLE IF EXISTS knowledge_entities;
-- COMMIT;
