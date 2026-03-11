-- ================================================================
-- PROSPECTOR ENGAGEMENT LOGS
-- ================================================================
-- Migration: 036_prospector_engagement_logs.sql
-- Criado: 2026-02-26
-- Descricao: Adiciona infraestrutura de warm-up para o Instagram
--            Prospector. Cria tabela prospector_engagement_logs para
--            curtidas/comentarios/follows, adiciona colunas vertical
--            e updated_at em prospector_queue_leads, cria views de
--            dashboard (vw_prospector_daily_stats e
--            vw_prospector_account_health) e RPC reset_daily_dm_counts
--            para o cron de meia-noite.
-- Autor: supabase-dba agent
-- ================================================================

-- ================================================================
-- PARTE 1: ALTER TABLE prospector_queue_leads
--          Adiciona vertical (para filtrar templates) e updated_at
-- ================================================================

ALTER TABLE prospector_queue_leads
  ADD COLUMN IF NOT EXISTS vertical   TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN prospector_queue_leads.vertical   IS 'Vertical do lead (ex: saude, imoveis, estetica) — usado para filtrar templates por vertical';
COMMENT ON COLUMN prospector_queue_leads.updated_at IS 'Timestamp da ultima atualizacao do registro';

-- Trigger para atualizar updated_at automaticamente
-- (Verifica existencia antes de criar para ser idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname   = 'set_updated_at_prospector_queue_leads'
      AND tgrelid  = 'prospector_queue_leads'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_prospector_queue_leads
      BEFORE UPDATE ON prospector_queue_leads
      FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
  END IF;
END $$;

-- ================================================================
-- PARTE 2: CREATE TABLE prospector_engagement_logs
--          Registra acoes de warm-up (curtidas, comentarios, follows,
--          story_views) feitas pelas contas do Instagram
-- ================================================================

CREATE TABLE IF NOT EXISTS prospector_engagement_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID        REFERENCES prospector_queue_leads(id) ON DELETE SET NULL,
  from_username   TEXT        NOT NULL,
  action          TEXT        NOT NULL
                              CHECK (action IN ('like', 'comment', 'follow', 'story_view')),
  target_media_id TEXT        DEFAULT '',
  content         TEXT        DEFAULT '',
  success         BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE prospector_engagement_logs IS 'Acoes de warm-up do Instagram Prospector. Registra curtidas, comentarios, follows e story views para aquecer relacoes antes do DM.';
COMMENT ON COLUMN prospector_engagement_logs.lead_id         IS 'Lead que recebeu o engajamento. NULL se o lead foi deletado.';
COMMENT ON COLUMN prospector_engagement_logs.from_username   IS 'Username da conta do Instagram que realizou a acao (de instagram_accounts)';
COMMENT ON COLUMN prospector_engagement_logs.action          IS 'Tipo de acao: like | comment | follow | story_view';
COMMENT ON COLUMN prospector_engagement_logs.target_media_id IS 'ID da midia alvo no Instagram (post, reel, story) quando aplicavel';
COMMENT ON COLUMN prospector_engagement_logs.content         IS 'Conteudo do comentario, quando action = comment';
COMMENT ON COLUMN prospector_engagement_logs.success         IS 'True se a acao foi executada com sucesso pela API do Instagram';

-- Indices para queries de dashboard e de fila
CREATE INDEX IF NOT EXISTS idx_pel_from_username_created
  ON prospector_engagement_logs(from_username, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pel_lead_id
  ON prospector_engagement_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_pel_action_created
  ON prospector_engagement_logs(action, created_at DESC);

-- Index parcial para engajamentos das ultimas 24h (usado na view account_health)
CREATE INDEX IF NOT EXISTS idx_pel_recent_24h
  ON prospector_engagement_logs(from_username, created_at)
  WHERE created_at > (now() - interval '24 hours');

-- RLS
ALTER TABLE prospector_engagement_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_read_engagement_logs'
      AND tablename  = 'prospector_engagement_logs'
  ) THEN
    CREATE POLICY authenticated_read_engagement_logs
      ON prospector_engagement_logs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated_insert_engagement_logs'
      AND tablename  = 'prospector_engagement_logs'
  ) THEN
    CREATE POLICY authenticated_insert_engagement_logs
      ON prospector_engagement_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'service_role_all_engagement_logs'
      AND tablename  = 'prospector_engagement_logs'
  ) THEN
    CREATE POLICY service_role_all_engagement_logs
      ON prospector_engagement_logs
      FOR ALL
      TO service_role
      USING (true);
  END IF;
END $$;

GRANT SELECT, INSERT ON prospector_engagement_logs TO authenticated;
GRANT ALL             ON prospector_engagement_logs TO service_role;

-- ================================================================
-- PARTE 3: VIEW vw_prospector_daily_stats
--          Estatisticas diarias de DMs (enviados, replies,
--          conversoes e reply_rate) filtradas por canal instagram
-- ================================================================

CREATE OR REPLACE VIEW vw_prospector_daily_stats AS
SELECT
  date_trunc('day', sent_at)                                               AS day,
  COUNT(*)                                                                 AS dms_sent,
  COUNT(replied_at)                                                        AS replies,
  COUNT(converted_at)                                                      AS conversions,
  ROUND(
    COUNT(replied_at)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    1
  )                                                                        AS reply_rate
FROM prospector_dm_logs
WHERE channel = 'instagram'
GROUP BY date_trunc('day', sent_at)
ORDER BY day DESC;

GRANT SELECT ON vw_prospector_daily_stats TO authenticated;
GRANT SELECT ON vw_prospector_daily_stats TO service_role;

COMMENT ON VIEW vw_prospector_daily_stats IS 'Estatisticas diarias do canal Instagram: DMs enviados, replies, conversoes e reply_rate (%). Usada no dashboard do Prospector.';

-- ================================================================
-- PARTE 4: VIEW vw_prospector_account_health
--          Saude das contas Instagram: status, limites, engajamentos
--          e DMs nas ultimas 24h
-- ================================================================

CREATE OR REPLACE VIEW vw_prospector_account_health AS
SELECT
  ia.username,
  ia.status,
  ia.is_active,
  ia.dms_sent_today,
  ia.daily_limit,
  ia.last_login_at,
  ia.last_dm_at,

  -- Engajamentos (curtidas + comentarios + follows + story_views) nas ultimas 24h
  (
    SELECT COUNT(*)
    FROM   prospector_engagement_logs pel
    WHERE  pel.from_username = ia.username
      AND  pel.created_at    > now() - interval '24 hours'
  ) AS engagements_24h,

  -- DMs enviados nas ultimas 24h (considera apenas logs do canal instagram)
  (
    SELECT COUNT(*)
    FROM   prospector_dm_logs     pdl
    WHERE  pdl.channel            = 'instagram'
      AND  pdl.sent_at            > now() - interval '24 hours'
      AND  EXISTS (
             SELECT 1
             FROM   prospector_queue_leads pql
             WHERE  pql.id            = pdl.lead_id
               AND  pql.username IS NOT NULL
           )
  ) AS dms_24h,

  -- Percentual de uso do limite diario
  ROUND(
    ia.dms_sent_today::NUMERIC / NULLIF(ia.daily_limit, 0) * 100,
    1
  ) AS daily_limit_pct

FROM instagram_accounts ia
ORDER BY ia.is_active DESC, ia.dms_sent_today DESC;

GRANT SELECT ON vw_prospector_account_health TO authenticated;
GRANT SELECT ON vw_prospector_account_health TO service_role;

COMMENT ON VIEW vw_prospector_account_health IS 'Saude das contas Instagram do Prospector. Mostra status, limites diarios, engajamentos e DMs das ultimas 24h por conta. Inclui percentual de uso do limite diario.';

-- ================================================================
-- PARTE 5: RPC reset_daily_dm_counts
--          Zera dms_sent_today em todas as contas. Deve ser
--          chamada pelo cron de meia-noite.
-- ================================================================

CREATE OR REPLACE FUNCTION reset_daily_dm_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE instagram_accounts
  SET    dms_sent_today = 0
  WHERE  dms_sent_today > 0;
END;
$$;

COMMENT ON FUNCTION reset_daily_dm_counts() IS 'Zera dms_sent_today em todas as contas do Instagram. Deve ser executada diariamente via cron de meia-noite para resetar os contadores de limite diario.';

GRANT EXECUTE ON FUNCTION reset_daily_dm_counts() TO service_role;

-- ================================================================
-- ROLLBACK
-- ================================================================
-- Para reverter esta migration, descomentar e executar o bloco abaixo:
--
-- BEGIN;
--
-- -- Remover RPC
-- DROP FUNCTION IF EXISTS reset_daily_dm_counts();
--
-- -- Remover views
-- DROP VIEW IF EXISTS vw_prospector_account_health;
-- DROP VIEW IF EXISTS vw_prospector_daily_stats;
--
-- -- Remover tabela de engajamentos (e seus indices/policies)
-- DROP TABLE IF EXISTS prospector_engagement_logs;
--
-- -- Remover trigger de updated_at
-- DROP TRIGGER IF EXISTS set_updated_at_prospector_queue_leads ON prospector_queue_leads;
--
-- -- Remover colunas adicionadas
-- ALTER TABLE prospector_queue_leads
--   DROP COLUMN IF EXISTS vertical,
--   DROP COLUMN IF EXISTS updated_at;
--
-- COMMIT;
-- ================================================================
