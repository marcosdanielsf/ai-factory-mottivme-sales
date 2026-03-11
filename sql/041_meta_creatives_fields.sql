-- =====================================================
-- 041: meta_creatives - Adicionar campos para fetch de thumbnails
-- =====================================================
-- Adiciona colunas necessarias para o workflow fetch-creative-thumbnails.json:
-- image_url, title, body, video_id, fetched_at
-- =====================================================

-- Campos retornados pela Meta API Graph
ALTER TABLE meta_creatives ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE meta_creatives ADD COLUMN IF NOT EXISTS title       TEXT;
ALTER TABLE meta_creatives ADD COLUMN IF NOT EXISTS body        TEXT;
ALTER TABLE meta_creatives ADD COLUMN IF NOT EXISTS video_id    TEXT;

-- Controle de freshness (filtro de 7 dias no workflow)
ALTER TABLE meta_creatives ADD COLUMN IF NOT EXISTS fetched_at  TIMESTAMPTZ DEFAULT NOW();

-- Index para o filtro de freshness (WHERE fetched_at > now() - interval '7 days')
CREATE INDEX IF NOT EXISTS idx_meta_creatives_fetched_at ON meta_creatives(fetched_at);

-- Atualizar fetched_at em linhas existentes que tenham thumbnail_url preenchida
-- (considera-las como ja fetchadas para evitar chamadas desnecessarias)
UPDATE meta_creatives
SET fetched_at = updated_at
WHERE fetched_at IS NULL
  AND thumbnail_url IS NOT NULL;

COMMENT ON COLUMN meta_creatives.image_url  IS 'URL da imagem estatica do criativo (Meta API)';
COMMENT ON COLUMN meta_creatives.title      IS 'Titulo do anuncio (Meta API creative.title)';
COMMENT ON COLUMN meta_creatives.body       IS 'Texto do anuncio (Meta API creative.body)';
COMMENT ON COLUMN meta_creatives.video_id   IS 'ID do video no Facebook (quando criativo e video)';
COMMENT ON COLUMN meta_creatives.fetched_at IS 'Ultima vez que os dados foram buscados na Meta API';
