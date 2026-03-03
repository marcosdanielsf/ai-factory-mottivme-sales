  -- ================================================================
  -- instagram_account_snapshots
  -- Histórico diário de seguidores/seguindo das contas de disparo
  -- ================================================================

  CREATE TABLE IF NOT EXISTS instagram_account_snapshots (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT NOT NULL,
    followers     INTEGER,
    following     INTEGER,
    posts_count   INTEGER,
    captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_ig_snapshots_username_captured
    ON instagram_account_snapshots (username, captured_at DESC);

  -- ================================================================
  -- vw_account_growth
  -- Última leitura + delta 7 dias por conta
  -- ================================================================

  CREATE OR REPLACE VIEW vw_ig_account_growth AS
  WITH latest AS (
    SELECT DISTINCT ON (username)
      username, followers, following, posts_count, captured_at
    FROM instagram_account_snapshots
    ORDER BY username, captured_at DESC
  ),
  week_ago AS (
    SELECT DISTINCT ON (username)
      username, followers AS followers_7d_ago
    FROM instagram_account_snapshots
    WHERE captured_at <= now() - INTERVAL '7 days'
    ORDER BY username, captured_at DESC
  ),
  month_ago AS (
    SELECT DISTINCT ON (username)
      username, followers AS followers_30d_ago
    FROM instagram_account_snapshots
    WHERE captured_at <= now() - INTERVAL '30 days'
    ORDER BY username, captured_at DESC
  )
  SELECT
    l.username,
    l.followers,
    l.following,
    l.posts_count,
    l.captured_at                                             AS last_snapshot_at,
    l.followers - COALESCE(w.followers_7d_ago,  l.followers) AS delta_7d,
    l.followers - COALESCE(m.followers_30d_ago, l.followers) AS delta_30d,
    CASE
      WHEN l.following > 0
      THEN ROUND(l.followers::numeric / l.following, 2)
      ELSE NULL
    END AS follower_ratio
  FROM latest l
  LEFT JOIN week_ago  w ON w.username = l.username
  LEFT JOIN month_ago m ON m.username = l.username;

  GRANT SELECT ON vw_ig_account_growth TO authenticated;
