-- Migration 060: Mega Brain Knowledge System
-- Tabelas: knowledge_sources, knowledge_chunks
-- Rollback: DROP TABLE knowledge_chunks; DROP TABLE knowledge_sources; DROP FUNCTION search_knowledge;
-- Depende de: pgvector extension (ja habilitada)

-- ============================================================
-- Fontes de conhecimento (cada conteudo ingerido)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'youtube', 'pdf', 'audio', 'whatsapp_chat', 'slack', 'gdrive_doc',
    'webpage', 'transcript', 'note', 'call_recording', 'spreadsheet'
  )),
  source_url TEXT,
  source_file_path TEXT,
  author TEXT,
  duration_seconds INTEGER,
  total_chunks INTEGER,
  total_tokens INTEGER,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  raw_text TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Chunks com embeddings (pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  chunk_index INTEGER NOT NULL,
  chunk_overlap_prev TEXT,
  chunk_overlap_next TEXT,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(processing_status);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD sources"
  ON knowledge_sources FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read chunks"
  ON knowledge_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chunks"
  ON knowledge_chunks FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- RPC: busca semantica nos chunks
-- ============================================================
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_source_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_title TEXT,
  source_type TEXT,
  source_url TEXT,
  author TEXT,
  similarity FLOAT,
  metadata JSONB,
  chunk_index INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    ks.title AS source_title,
    ks.source_type,
    ks.source_url,
    ks.author,
    (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity,
    kc.metadata,
    kc.chunk_index
  FROM knowledge_chunks kc
  JOIN knowledge_sources ks ON kc.source_id = ks.id
  WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (filter_source_type IS NULL OR ks.source_type = filter_source_type)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Trigger updated_at
-- ============================================================
CREATE OR REPLACE TRIGGER set_updated_at_knowledge_sources
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
