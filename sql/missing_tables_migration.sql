-- migration: missing_tables_migration.sql
-- autor: supabase-dba agent
-- data: 2026-02-20
-- descricao: Cria as 5 tabelas referenciadas no frontend que nao existem no banco.
--            prospector_dm_templates JA EXISTE (supabase/migrations/20260207143000_prospector_tables.sql) — omitida aqui.
--            prospector_known_followers NAO tem hook TypeScript mas faz parte do modulo Prospector
--            (citada em memory/MEMORY.md como uma das 5 tabelas publicas do Prospector).
--
-- TABELAS CRIADAS:
--   1. content_ideas              (src/hooks/useContentIdeas.ts)
--   2. content_videos             (src/hooks/useContentVideos.ts)
--   3. agent_tools                (src/hooks/useAgentTools.ts)
--   4. call_recordings            (src/hooks/useCallAnalytics.ts)
--   5. prospector_known_followers (modulo Prospector — sem hook, estrutura inferida do dominio)
--
-- PRE-REQUISITOS:
--   CREATE EXTENSION IF NOT EXISTS moddatetime;
--   (disponivel por padrao no Supabase)
--
-- ATENCAO: executar via Management API — DDL nao funciona pela REST API.
-- SEMPRE executar dry-run (BEGIN; ... ROLLBACK;) antes de aplicar em producao.

-- ============================================================
-- EXTENSAO (idempotente)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================
-- UP
-- ============================================================

BEGIN;

-- ============================================================
-- 1. content_ideas
-- Origem: src/hooks/useContentIdeas.ts
-- Proposito: Armazenar ideias de conteudo capturadas de canais monitorados,
--            videos trending e videos similares. Usadas no pipeline de Content Pipeline.
-- Filtros usados em WHERE: platform, source, shortlist
-- Filtros usados em ORDER: created_at DESC
-- Busca full-text (ilike): video_title, channel_name, video_tags
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_ideas (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  video_title       TEXT        NOT NULL,
  channel_name      TEXT,
  video_summary     TEXT,
  duration          TEXT,                                          -- ex: "12:34", "PT12M34S"
  upload_date       TEXT,                                          -- data de upload na plataforma de origem
  source            TEXT        CHECK (source IN (
                                  'channel_monitoring',
                                  'trending_videos',
                                  'similar_video'
                                )),
  platform          TEXT        CHECK (platform IN (
                                  'youtube',
                                  'instagram',
                                  'tiktok'
                                )),
  channel_url       TEXT,
  views             INTEGER     NOT NULL DEFAULT 0,
  likes             INTEGER     NOT NULL DEFAULT 0,
  comments          INTEGER     NOT NULL DEFAULT 0,
  video_url         TEXT,
  video_description TEXT,
  video_tags        TEXT,                                          -- tags em texto livre (separadas por virgula ou espaco)
  script_summary    TEXT,                                          -- resumo do roteiro (gerado por IA)
  transcript        TEXT,                                          -- transcricao completa do video
  shortlist         BOOLEAN     NOT NULL DEFAULT false,            -- marcado para producao
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at automatico
CREATE TRIGGER set_content_ideas_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users: full access on content_ideas"
  ON public.content_ideas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role: full access on content_ideas"
  ON public.content_ideas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indices (WHERE + ORDER usados nos hooks)
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform
  ON public.content_ideas (platform);

CREATE INDEX IF NOT EXISTS idx_content_ideas_source
  ON public.content_ideas (source);

CREATE INDEX IF NOT EXISTS idx_content_ideas_shortlist
  ON public.content_ideas (shortlist)
  WHERE shortlist = true;

CREATE INDEX IF NOT EXISTS idx_content_ideas_created_at
  ON public.content_ideas (created_at DESC);

-- ============================================================
-- 2. content_videos
-- Origem: src/hooks/useContentVideos.ts
-- Proposito: Registra videos em producao dentro do pipeline de video.
--            Cada video pode ser criado a partir de uma content_idea (idea_id FK opcional).
--            Status controla o workflow de producao.
-- Filtros usados em WHERE: status
-- Filtros usados em ORDER: created_at DESC
-- Busca full-text (ilike): idea, title_chosen, search_term
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content_videos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          UUID        REFERENCES public.content_ideas (id) ON DELETE SET NULL,
  idea             TEXT,                                           -- descricao livre da ideia (pode vir de fora do content_ideas)
  title_chosen     TEXT,                                           -- titulo final escolhido para o video
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN (
                                 'draft',
                                 'generate',
                                 'in_progress',
                                 'ready',
                                 'error',
                                 'not_required'
                               )),
  search_term      TEXT,                                           -- termo de busca usado para encontrar referencias
  similar_videos   TEXT,                                           -- URLs ou IDs de videos similares encontrados
  similar_summaries TEXT,                                          -- resumos dos videos similares
  similar_script   TEXT,                                          -- roteiro gerado baseado nos videos similares
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at automatico
CREATE TRIGGER set_content_videos_updated_at
  BEFORE UPDATE ON public.content_videos
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.content_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users: full access on content_videos"
  ON public.content_videos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role: full access on content_videos"
  ON public.content_videos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_content_videos_status
  ON public.content_videos (status);

CREATE INDEX IF NOT EXISTS idx_content_videos_idea_id
  ON public.content_videos (idea_id);

CREATE INDEX IF NOT EXISTS idx_content_videos_created_at
  ON public.content_videos (created_at DESC);

-- ============================================================
-- 3. agent_tools
-- Origem: src/hooks/useAgentTools.ts
-- Proposito: Catalogo de ferramentas (tools) disponibilizadas para os agentes IA.
--            Cada tool tem um json_config JSONB com parametros especificos.
--            Usada na pagina Agent Tools do AI Factory.
-- Filtros usados em WHERE: id (por eq)
-- Filtros usados em ORDER: tool_name ASC
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_tools (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name     TEXT        NOT NULL,
  resource      TEXT,                                              -- recurso associado (ex: URL, nome do servico)
  json_config   JSONB       NOT NULL DEFAULT '{}',                 -- configuracao estruturada da tool
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN (
                              'active',
                              'inactive',
                              'deprecated'
                            )),
  submitted_by  TEXT,                                              -- nome ou email de quem submeteu a tool
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_agent_tools_json_config_object
    CHECK (jsonb_typeof(json_config) = 'object')
);

-- Trigger updated_at automatico
CREATE TRIGGER set_agent_tools_updated_at
  BEFORE UPDATE ON public.agent_tools
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users: full access on agent_tools"
  ON public.agent_tools
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role: full access on agent_tools"
  ON public.agent_tools
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_agent_tools_status
  ON public.agent_tools (status);

CREATE INDEX IF NOT EXISTS idx_agent_tools_tool_name
  ON public.agent_tools (tool_name);

-- Index parcial: apenas tools ativas (query mais comum)
CREATE INDEX IF NOT EXISTS idx_agent_tools_active
  ON public.agent_tools (tool_name)
  WHERE status = 'active';

-- ============================================================
-- 4. call_recordings
-- Origem: src/hooks/useCallAnalytics.ts
-- Proposito: Registra gravacoes de ligacoes de vendas com analise IA estruturada
--            (BANT, SPIN, red flags, scores, plano de acao).
--            A coluna analise_json armazena o JSON completo retornado pelo pipeline de analise.
--            Filtros WHERE: location_id, created_at (range), analise_json not null/not {}
--            Filtros ORDER: created_at DESC
--            LIMIT padrao: 100 registros
-- ============================================================

CREATE TABLE IF NOT EXISTS public.call_recordings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     TEXT,                                            -- ID do location no GoHighLevel
  tipo            TEXT        NOT NULL DEFAULT 'diagnostico',      -- tipo da call (ex: diagnostico, consultoria)
  nome_lead       TEXT,                                            -- nome do lead (campo legacy — usar contact_name)
  contact_name    TEXT,                                            -- nome do contato no GHL
  contact_id      TEXT,                                            -- ID do contato no GHL
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending',
                                'processing',
                                'analyzed',
                                'error',
                                'skipped'
                              )),
  analise_status  TEXT,                                            -- status interno do pipeline de analise IA
  recording_url   TEXT,                                            -- URL da gravacao (S3, GHL, etc.)
  duration_sec    INTEGER,                                         -- duracao da call em segundos
  analise_json    JSONB       DEFAULT '{}',                        -- JSON completo da analise IA (scores, red flags, etc.)
  analyzed_at     TIMESTAMPTZ,                                     -- quando a analise foi concluida
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at automatico
CREATE TRIGGER set_call_recordings_updated_at
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users: full access on call_recordings"
  ON public.call_recordings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role: full access on call_recordings"
  ON public.call_recordings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indices
-- Filtro principal: location_id + created_at (range queries)
CREATE INDEX IF NOT EXISTS idx_call_recordings_location_created
  ON public.call_recordings (location_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_recordings_created_at
  ON public.call_recordings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_recordings_status
  ON public.call_recordings (status);

-- Index parcial: apenas registros com analise preenchida (filtragem do hook)
CREATE INDEX IF NOT EXISTS idx_call_recordings_with_analise
  ON public.call_recordings (location_id, created_at DESC)
  WHERE analise_json IS NOT NULL AND analise_json != '{}';

-- ============================================================
-- 5. prospector_known_followers
-- Origem: sem hook TypeScript (modulo Prospector — citada em memory/MEMORY.md)
-- Proposito: Catalogo de seguidores ja conhecidos/processados pelo Prospector.
--            Evita DMs duplicadas para o mesmo perfil.
--            Armazena dados de enriquecimento de perfil para scoring ICP.
-- Nota: prospector_dm_templates JA EXISTE (ver supabase/migrations/20260207143000_prospector_tables.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.prospector_known_followers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID        REFERENCES public.prospector_campaigns (id) ON DELETE SET NULL,
  username        TEXT        NOT NULL,                            -- handle do perfil (sem @)
  platform        TEXT        NOT NULL DEFAULT 'instagram'
                              CHECK (platform IN (
                                'instagram',
                                'linkedin',
                                'whatsapp'
                              )),
  profile_url     TEXT,                                            -- URL do perfil
  full_name       TEXT,                                            -- nome completo do perfil
  bio             TEXT,                                            -- bio do perfil
  followers_count INTEGER,                                         -- numero de seguidores
  following_count INTEGER,                                         -- numero de seguindo
  is_verified     BOOLEAN     DEFAULT false,
  city            TEXT,
  icp_tier        TEXT        CHECK (icp_tier IN ('A', 'B', 'C')),
  dm_sent         BOOLEAN     NOT NULL DEFAULT false,              -- se ja recebeu DM
  dm_sent_at      TIMESTAMPTZ,                                     -- quando a DM foi enviada
  replied         BOOLEAN     NOT NULL DEFAULT false,              -- se respondeu
  replied_at      TIMESTAMPTZ,                                     -- quando respondeu
  converted       BOOLEAN     NOT NULL DEFAULT false,              -- se converteu
  notes           TEXT,                                            -- observacoes manuais
  raw_data        JSONB       DEFAULT '{}',                        -- dados brutos da plataforma (enriquecimento)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Evitar duplicatas: mesmo username + plataforma por campanha
  CONSTRAINT uq_prospector_known_followers_username_platform_campaign
    UNIQUE (campaign_id, username, platform)
);

-- Trigger updated_at automatico
CREATE TRIGGER set_prospector_known_followers_updated_at
  BEFORE UPDATE ON public.prospector_known_followers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE public.prospector_known_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users: full access on prospector_known_followers"
  ON public.prospector_known_followers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role: full access on prospector_known_followers"
  ON public.prospector_known_followers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pkf_campaign_id
  ON public.prospector_known_followers (campaign_id);

CREATE INDEX IF NOT EXISTS idx_pkf_platform_username
  ON public.prospector_known_followers (platform, username);

-- Index parcial: seguidores sem DM enviada (fila de candidatos)
CREATE INDEX IF NOT EXISTS idx_pkf_not_contacted
  ON public.prospector_known_followers (campaign_id, icp_tier, created_at)
  WHERE dm_sent = false;

-- Index parcial: seguidores que responderam (analytics)
CREATE INDEX IF NOT EXISTS idx_pkf_replied
  ON public.prospector_known_followers (campaign_id, replied_at)
  WHERE replied = true;

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- Descomentar bloco abaixo e executar para reverter COMPLETAMENTE.
-- ATENCAO: DROP TABLE e irreversivel em producao — confirmar com Marcos antes.
-- Ordem: dependentes primeiro, depois as tabelas base.
-- ============================================================

-- BEGIN;
--
-- DROP TABLE IF EXISTS public.prospector_known_followers CASCADE;
-- DROP TABLE IF EXISTS public.call_recordings CASCADE;
-- DROP TABLE IF EXISTS public.agent_tools CASCADE;
-- DROP TABLE IF EXISTS public.content_videos CASCADE;
-- DROP TABLE IF EXISTS public.content_ideas CASCADE;
--
-- COMMIT;

-- ============================================================
-- NOTAS POS-EXECUCAO
-- ============================================================
--
-- 1. Verificar RLS habilitado em todas as tabelas criadas:
--    SELECT schemaname, tablename, rowsecurity
--    FROM pg_tables
--    WHERE tablename IN (
--      'content_ideas', 'content_videos', 'agent_tools',
--      'call_recordings', 'prospector_known_followers'
--    );
--
-- 2. Verificar indices criados:
--    SELECT indexname, tablename
--    FROM pg_indexes
--    WHERE tablename IN (
--      'content_ideas', 'content_videos', 'agent_tools',
--      'call_recordings', 'prospector_known_followers'
--    )
--    ORDER BY tablename, indexname;
--
-- 3. TABELAS JA EXISTENTES (nao incluidas nesta migration):
--    prospector_dm_templates  → supabase/migrations/20260207143000_prospector_tables.sql
--    prospector_campaigns     → idem
--    prospector_queue_leads   → idem
--    prospector_dm_logs       → idem
