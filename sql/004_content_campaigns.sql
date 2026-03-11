-- migration: 004_content_campaigns.sql
-- autor: supabase-dba agent
-- data: 2026-02-17
-- descricao: Tabela de campanhas de conteudo + status de aprovacao
-- target: Supabase PRINCIPAL (bfumywvwubvernvhjehk)

BEGIN;

-- ============================================================
-- 1. CONTENT CAMPAIGNS — tracker de campanhas no Supabase principal
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_campaigns (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id                 UUID,  -- FK clients(id) se existir
  name                      TEXT        NOT NULL,
  briefing                  JSONB       NOT NULL DEFAULT '{}',
  -- briefing: { produto, avatar_descricao, diferencial, tom_comunicacao, objetivo, nicho, ticket_medio, tipo_funil }
  status                    TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'generating', 'review', 'approved', 'published', 'error')),
  assembly_line_project_id  UUID,       -- link ao projeto no Assembly Line Supabase
  assembly_line_api_url     TEXT,       -- URL do Railway pra polling
  total_pieces              INT         NOT NULL DEFAULT 0,
  approved_pieces           INT         NOT NULL DEFAULT 0,
  published_pieces          INT         NOT NULL DEFAULT 0,
  total_cost                NUMERIC(10,4) NOT NULL DEFAULT 0,
  error_message             TEXT,
  metadata                  JSONB       NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  public.content_campaigns IS 'Campanhas de conteudo geradas pela Assembly Line';
COMMENT ON COLUMN public.content_campaigns.briefing IS 'Input do usuario: produto, avatar, tom, objetivo, nicho, ticket_medio, tipo_funil';
COMMENT ON COLUMN public.content_campaigns.assembly_line_project_id IS 'UUID do projeto no Supabase Assembly Line (zsmrsapossghjgqinbuz)';

CREATE TRIGGER set_content_campaigns_updated_at
    BEFORE UPDATE ON public.content_campaigns
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 2. CONTENT PIECES — conteudos individuais (posts, reels, emails, ads)
--    Fica no Supabase PRINCIPAL pra evitar cross-db queries
--    Assembly Line API faz INSERT aqui apos gerar
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_pieces (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  campaign_id       UUID        NOT NULL REFERENCES public.content_campaigns(id) ON DELETE CASCADE,
  type              TEXT        NOT NULL CHECK (type IN ('post', 'reel', 'email', 'ad', 'story', 'carousel')),
  platform          TEXT        CHECK (platform IN ('instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'twitter', 'email')),
  title             TEXT,
  body              TEXT        NOT NULL,
  hook              TEXT,
  cta               TEXT,
  subject           TEXT,       -- email only
  preview_text      TEXT,       -- email only
  hashtags          TEXT[],
  media_url         TEXT,       -- URL do asset (imagem/video)
  media_type        TEXT        CHECK (media_type IN ('image', 'video', 'carousel', NULL)),
  approval_status   TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'published', 'scheduled')),
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  ghl_post_id       TEXT,       -- ID do post no GHL apos publicar
  generated_by      TEXT        DEFAULT 'content_factory',
  cost              NUMERIC(10,6) NOT NULL DEFAULT 0,
  metadata          JSONB       NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE  public.content_pieces IS 'Pecas de conteudo individuais geradas pela Assembly Line';
COMMENT ON COLUMN public.content_pieces.approval_status IS 'Fluxo: pending → approved → scheduled → published (ou rejected)';
COMMENT ON COLUMN public.content_pieces.ghl_post_id IS 'ID retornado pelo GHL Social Media Posting API apos publicacao';

CREATE TRIGGER set_content_pieces_updated_at
    BEFORE UPDATE ON public.content_pieces
    FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- 3. INDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_content_campaigns_client ON public.content_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_content_campaigns_status ON public.content_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_campaign ON public.content_pieces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_approval ON public.content_pieces(approval_status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled ON public.content_pieces(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_pieces_platform ON public.content_pieces(platform);

-- ============================================================
-- 4. RLS (basico — permite tudo pra authenticated)
-- ============================================================
ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_campaigns_all" ON public.content_campaigns
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "content_pieces_all" ON public.content_pieces
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- ============================================================
-- VERIFICACAO
-- ============================================================
SELECT 'content_campaigns' as tabela, count(*) from content_campaigns
UNION ALL SELECT 'content_pieces', count(*) from content_pieces;
