-- =============================================================================
-- NEW FOLLOWERS FEATURE - Migration SQL
-- Feature: Detectar e abordar novos seguidores do Instagram
-- Data: 2026-01-17
-- =============================================================================

-- =============================================================================
-- TABELA: instagram_accounts
-- Contas Instagram monitoradas por tenant
-- =============================================================================
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    username VARCHAR(255) NOT NULL,
    instagram_user_id TEXT,
    display_name TEXT,
    profile_pic_url TEXT,
    followers_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_check_at TIMESTAMPTZ,
    outreach_enabled BOOLEAN DEFAULT false,
    outreach_min_icp_score INTEGER DEFAULT 70,
    outreach_daily_limit INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- Index para queries por tenant
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_tenant
ON instagram_accounts(tenant_id);

-- Index para queries de contas ativas
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_active
ON instagram_accounts(is_active, last_check_at);

-- =============================================================================
-- TABELA: instagram_followers_snapshots
-- Snapshots de seguidores para detectar delta (novos seguidores)
-- =============================================================================
CREATE TABLE IF NOT EXISTS instagram_followers_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    snapshot_at TIMESTAMPTZ DEFAULT NOW(),
    followers_data JSONB,
    total_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para queries por conta e data
CREATE INDEX IF NOT EXISTS idx_followers_snapshots_account
ON instagram_followers_snapshots(account_id, snapshot_at DESC);

-- =============================================================================
-- TABELA: new_followers_detected
-- Novos seguidores detectados aguardando ou processados para outreach
-- =============================================================================
CREATE TABLE IF NOT EXISTS new_followers_detected (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    follower_user_id TEXT NOT NULL,
    follower_username TEXT NOT NULL,
    follower_full_name TEXT,
    follower_bio TEXT,
    follower_profile_pic TEXT,
    follower_followers_count INTEGER,
    follower_following_count INTEGER,
    follower_is_business BOOLEAN,
    follower_is_verified BOOLEAN,
    icp_score INTEGER,
    icp_analysis JSONB,
    outreach_status TEXT DEFAULT 'pending',
    outreach_message TEXT,
    outreach_sent_at TIMESTAMPTZ,
    outreach_response TEXT,
    outreach_responded_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, follower_user_id)
);

-- Index para status de outreach
CREATE INDEX IF NOT EXISTS idx_new_followers_status
ON new_followers_detected(outreach_status);

-- Index para queries por conta
CREATE INDEX IF NOT EXISTS idx_new_followers_account
ON new_followers_detected(account_id, detected_at DESC);

-- Index para queries por ICP score
CREATE INDEX IF NOT EXISTS idx_new_followers_icp
ON new_followers_detected(icp_score DESC)
WHERE outreach_status = 'pending';

-- =============================================================================
-- VIEW: vw_new_followers_summary
-- Resumo de novos seguidores por conta
-- =============================================================================
CREATE OR REPLACE VIEW vw_new_followers_summary AS
SELECT
    ia.id as account_id,
    ia.tenant_id,
    ia.username,
    ia.display_name,
    ia.profile_pic_url,
    ia.followers_count,
    ia.is_active,
    ia.outreach_enabled,
    ia.outreach_min_icp_score,
    ia.outreach_daily_limit,
    ia.last_check_at,
    COUNT(nf.id) as total_new_followers,
    COUNT(nf.id) FILTER (WHERE nf.outreach_status = 'pending') as pending_count,
    COUNT(nf.id) FILTER (WHERE nf.outreach_status = 'sent') as sent_count,
    COUNT(nf.id) FILTER (WHERE nf.outreach_status = 'responded') as responded_count,
    COUNT(nf.id) FILTER (WHERE nf.outreach_status = 'skipped') as skipped_count,
    COUNT(nf.id) FILTER (WHERE nf.icp_score >= ia.outreach_min_icp_score AND nf.outreach_status = 'pending') as ready_for_outreach,
    AVG(nf.icp_score) FILTER (WHERE nf.icp_score IS NOT NULL) as avg_icp_score,
    MAX(nf.detected_at) as last_follower_detected_at
FROM instagram_accounts ia
LEFT JOIN new_followers_detected nf ON ia.id = nf.account_id
GROUP BY ia.id;

-- =============================================================================
-- VIEW: vw_new_followers_list
-- Lista de novos seguidores com informacoes da conta
-- =============================================================================
CREATE OR REPLACE VIEW vw_new_followers_list AS
SELECT
    nf.*,
    ia.username as account_username,
    ia.display_name as account_display_name,
    ia.tenant_id,
    ia.outreach_enabled,
    ia.outreach_min_icp_score,
    CASE
        WHEN nf.icp_score >= ia.outreach_min_icp_score THEN true
        ELSE false
    END as meets_icp_threshold
FROM new_followers_detected nf
JOIN instagram_accounts ia ON nf.account_id = ia.id;

-- =============================================================================
-- FUNCAO: fn_update_updated_at
-- Trigger para atualizar updated_at automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trg_instagram_accounts_updated_at ON instagram_accounts;
CREATE TRIGGER trg_instagram_accounts_updated_at
    BEFORE UPDATE ON instagram_accounts
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

DROP TRIGGER IF EXISTS trg_new_followers_updated_at ON new_followers_detected;
CREATE TRIGGER trg_new_followers_updated_at
    BEFORE UPDATE ON new_followers_detected
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- =============================================================================
-- RLS (Row Level Security) - Opcional, ativar se necessario
-- =============================================================================

-- ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE instagram_followers_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE new_followers_detected ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios so veem dados do seu tenant
-- CREATE POLICY "Users can only access their tenant data" ON instagram_accounts
--     FOR ALL USING (tenant_id = auth.uid());

-- =============================================================================
-- COMENTARIOS
-- =============================================================================
COMMENT ON TABLE instagram_accounts IS 'Contas Instagram monitoradas para detecao de novos seguidores';
COMMENT ON TABLE instagram_followers_snapshots IS 'Snapshots periodicos de seguidores para detectar deltas';
COMMENT ON TABLE new_followers_detected IS 'Novos seguidores detectados com status de outreach';
COMMENT ON VIEW vw_new_followers_summary IS 'Resumo agregado de novos seguidores por conta';
COMMENT ON VIEW vw_new_followers_list IS 'Lista de novos seguidores com dados da conta';
