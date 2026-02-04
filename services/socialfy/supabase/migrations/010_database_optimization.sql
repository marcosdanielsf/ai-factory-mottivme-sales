-- ============================================================================
-- MIGRATION 010: DATABASE OPTIMIZATION
-- Connection Pooling, Caching, Indices, Soft Delete
-- Created: 2026-01-03
-- ============================================================================

-- ============================================================================
-- 1. SOFT DELETE - Adicionar colunas em todas as tabelas principais
-- ============================================================================

-- Soft delete permite "apagar" registros sem perder dados
-- is_deleted = true significa que o registro foi "deletado"
-- deleted_at = quando foi deletado
-- deleted_by = quem deletou (auditoria)

-- Organizations
ALTER TABLE socialfy_organizations
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Users
ALTER TABLE socialfy_users
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Leads
ALTER TABLE socialfy_leads
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Campaigns
ALTER TABLE socialfy_campaigns
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Cadences
ALTER TABLE socialfy_cadences
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Lead Cadences
ALTER TABLE socialfy_lead_cadences
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Activities
ALTER TABLE socialfy_activities
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Messages
ALTER TABLE socialfy_messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Connected Accounts
ALTER TABLE socialfy_connected_accounts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Pipeline Deals
ALTER TABLE socialfy_pipeline_deals
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- AI Agents
ALTER TABLE socialfy_ai_agents
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- ICP Config
ALTER TABLE socialfy_icp_config
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- Analytics Daily
ALTER TABLE socialfy_analytics_daily
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES socialfy_users(id);

-- ============================================================================
-- 2. INDICES PARA SOFT DELETE (Partial Indices - mais eficientes)
-- ============================================================================

-- Partial indices só indexam registros não deletados (99% dos casos)
-- Isso economiza espaço e melhora performance

CREATE INDEX IF NOT EXISTS idx_socialfy_organizations_active
ON socialfy_organizations(id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_users_active
ON socialfy_users(organization_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_leads_active
ON socialfy_leads(organization_id, status, icp_score DESC) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_campaigns_active
ON socialfy_campaigns(organization_id, status) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_cadences_active
ON socialfy_cadences(organization_id, status) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_active
ON socialfy_lead_cadences(lead_id, status, next_activity_at) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_activities_active
ON socialfy_activities(organization_id, lead_id, performed_at DESC) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_messages_active
ON socialfy_messages(organization_id, lead_id, sent_at DESC) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_active
ON socialfy_pipeline_deals(organization_id, stage) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_socialfy_agents_active
ON socialfy_ai_agents(organization_id, type) WHERE is_deleted = FALSE AND is_active = TRUE;

-- ============================================================================
-- 3. INDICES COMPOSTOS PARA QUERIES FREQUENTES
-- ============================================================================

-- Dashboard: Leads por org + status + data
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_dashboard
ON socialfy_leads(organization_id, status, created_at DESC)
WHERE is_deleted = FALSE;

-- Dashboard: Mensagens não lidas por org
CREATE INDEX IF NOT EXISTS idx_socialfy_messages_unread_org
ON socialfy_messages(organization_id, is_read, sent_at DESC)
WHERE is_deleted = FALSE AND is_read = FALSE;

-- Pipeline: Deals por org + stage + valor
CREATE INDEX IF NOT EXISTS idx_socialfy_pipeline_value
ON socialfy_pipeline_deals(organization_id, stage, value DESC)
WHERE is_deleted = FALSE;

-- Lead Cadences: Próximas atividades a processar
CREATE INDEX IF NOT EXISTS idx_socialfy_lead_cadences_due
ON socialfy_lead_cadences(next_activity_at, status)
WHERE is_deleted = FALSE AND status = 'active' AND next_activity_at IS NOT NULL;

-- Activities: Por lead e tipo (para histórico)
CREATE INDEX IF NOT EXISTS idx_socialfy_activities_lead_type
ON socialfy_activities(lead_id, type, performed_at DESC)
WHERE is_deleted = FALSE;

-- Campaigns: Ativas com métricas
CREATE INDEX IF NOT EXISTS idx_socialfy_campaigns_metrics
ON socialfy_campaigns(organization_id, status, leads_count, responses_count)
WHERE is_deleted = FALSE AND status = 'active';

-- ============================================================================
-- 4. INDICES PARA BUSCA FULL-TEXT (se precisar)
-- ============================================================================

-- Adicionar coluna de busca full-text em leads
ALTER TABLE socialfy_leads
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Criar índice GIN para busca full-text
CREATE INDEX IF NOT EXISTS idx_socialfy_leads_search
ON socialfy_leads USING GIN(search_vector);

-- Trigger para atualizar search_vector automaticamente
CREATE OR REPLACE FUNCTION socialfy_leads_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.company, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_socialfy_leads_search ON socialfy_leads;
CREATE TRIGGER trg_socialfy_leads_search
BEFORE INSERT OR UPDATE OF name, company, title, email ON socialfy_leads
FOR EACH ROW EXECUTE FUNCTION socialfy_leads_search_update();

-- Atualizar registros existentes
UPDATE socialfy_leads SET search_vector =
  setweight(to_tsvector('portuguese', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', COALESCE(company, '')), 'B') ||
  setweight(to_tsvector('portuguese', COALESCE(title, '')), 'C') ||
  setweight(to_tsvector('portuguese', COALESCE(email, '')), 'D')
WHERE search_vector IS NULL;

-- ============================================================================
-- 5. FUNÇÕES DE SOFT DELETE
-- ============================================================================

-- Função genérica para soft delete
CREATE OR REPLACE FUNCTION socialfy_soft_delete(
  p_table_name TEXT,
  p_id UUID,
  p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_query TEXT;
BEGIN
  v_query := format(
    'UPDATE %I SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = $1 WHERE id = $2 AND is_deleted = FALSE',
    p_table_name
  );
  EXECUTE v_query USING p_deleted_by, p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para restaurar soft delete
CREATE OR REPLACE FUNCTION socialfy_restore(
  p_table_name TEXT,
  p_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_query TEXT;
BEGIN
  v_query := format(
    'UPDATE %I SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND is_deleted = TRUE',
    p_table_name
  );
  EXECUTE v_query USING p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VIEWS PARA DADOS ATIVOS (sem is_deleted)
-- ============================================================================

-- View de leads ativos (mais usada)
CREATE OR REPLACE VIEW vw_socialfy_leads_active AS
SELECT * FROM socialfy_leads WHERE is_deleted = FALSE;

-- View de campanhas ativas
CREATE OR REPLACE VIEW vw_socialfy_campaigns_active AS
SELECT * FROM socialfy_campaigns WHERE is_deleted = FALSE;

-- View de mensagens ativas
CREATE OR REPLACE VIEW vw_socialfy_messages_active AS
SELECT * FROM socialfy_messages WHERE is_deleted = FALSE;

-- View de pipeline ativo
CREATE OR REPLACE VIEW vw_socialfy_pipeline_active AS
SELECT * FROM socialfy_pipeline_deals WHERE is_deleted = FALSE;

-- ============================================================================
-- 7. TABELA DE CACHE (para queries pesadas)
-- ============================================================================

-- Cache de métricas do dashboard (atualizado periodicamente)
CREATE TABLE IF NOT EXISTS socialfy_cache_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES socialfy_organizations(id) ON DELETE CASCADE,
  cache_key VARCHAR(100) NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_socialfy_cache_dashboard_key
ON socialfy_cache_dashboard(organization_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_socialfy_cache_dashboard_expires
ON socialfy_cache_dashboard(expires_at);

-- Função para get/set cache
CREATE OR REPLACE FUNCTION socialfy_cache_get(
  p_organization_id UUID,
  p_cache_key VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT cache_value INTO v_result
  FROM socialfy_cache_dashboard
  WHERE organization_id = p_organization_id
    AND cache_key = p_cache_key
    AND expires_at > NOW();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION socialfy_cache_set(
  p_organization_id UUID,
  p_cache_key VARCHAR(100),
  p_cache_value JSONB,
  p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO socialfy_cache_dashboard (organization_id, cache_key, cache_value, expires_at)
  VALUES (p_organization_id, p_cache_key, p_cache_value, NOW() + (p_ttl_minutes || ' minutes')::INTERVAL)
  ON CONFLICT (organization_id, cache_key)
  DO UPDATE SET
    cache_value = EXCLUDED.cache_value,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Limpar cache expirado (rodar periodicamente)
CREATE OR REPLACE FUNCTION socialfy_cache_cleanup()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM socialfy_cache_dashboard WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FUNÇÕES OTIMIZADAS DO DASHBOARD (com cache)
-- ============================================================================

-- Dashboard totals com cache (5 min TTL)
CREATE OR REPLACE FUNCTION socialfy_dashboard_totals_cached(
  p_organization_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_cached JSONB;
  v_result JSONB;
BEGIN
  -- Tentar buscar do cache
  v_cached := socialfy_cache_get(p_organization_id, 'dashboard_totals');

  IF v_cached IS NOT NULL THEN
    RETURN v_cached;
  END IF;

  -- Calcular métricas (query otimizada)
  WITH metrics AS (
    SELECT
      COUNT(*) FILTER (WHERE is_deleted = FALSE) as total_leads,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'in_cadence') as in_cadence,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'responding') as responding,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND status = 'converted') as converted,
      AVG(icp_score) FILTER (WHERE is_deleted = FALSE) as avg_icp_score
    FROM socialfy_leads
    WHERE organization_id = p_organization_id
  ),
  pipeline_metrics AS (
    SELECT
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND stage NOT IN ('won', 'lost')) as active_deals,
      SUM(value) FILTER (WHERE is_deleted = FALSE AND stage NOT IN ('won', 'lost')) as pipeline_value,
      SUM(value) FILTER (WHERE is_deleted = FALSE AND stage = 'won' AND won_at >= DATE_TRUNC('month', NOW())) as revenue_this_month
    FROM socialfy_pipeline_deals
    WHERE organization_id = p_organization_id
  ),
  message_metrics AS (
    SELECT
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND is_read = FALSE) as unread_messages
    FROM socialfy_messages
    WHERE organization_id = p_organization_id
  )
  SELECT jsonb_build_object(
    'total_leads', COALESCE(m.total_leads, 0),
    'in_cadence', COALESCE(m.in_cadence, 0),
    'responding', COALESCE(m.responding, 0),
    'scheduled', COALESCE(m.scheduled, 0),
    'converted', COALESCE(m.converted, 0),
    'avg_icp_score', ROUND(COALESCE(m.avg_icp_score, 0)::NUMERIC, 1),
    'active_deals', COALESCE(p.active_deals, 0),
    'pipeline_value', COALESCE(p.pipeline_value, 0),
    'revenue_this_month', COALESCE(p.revenue_this_month, 0),
    'unread_messages', COALESCE(msg.unread_messages, 0),
    'cached_at', NOW()
  ) INTO v_result
  FROM metrics m, pipeline_metrics p, message_metrics msg;

  -- Salvar no cache (5 minutos)
  PERFORM socialfy_cache_set(p_organization_id, 'dashboard_totals', v_result, 5);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. MATERIALIZED VIEW PARA ANALYTICS (atualização diária)
-- ============================================================================

-- Materialized view com métricas agregadas
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_socialfy_org_metrics AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  o.plan,
  COUNT(DISTINCT l.id) FILTER (WHERE l.is_deleted = FALSE) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.is_deleted = FALSE AND l.status = 'converted') as converted_leads,
  COUNT(DISTINCT c.id) FILTER (WHERE c.is_deleted = FALSE AND c.status = 'active') as active_campaigns,
  COUNT(DISTINCT pd.id) FILTER (WHERE pd.is_deleted = FALSE AND pd.stage = 'won') as deals_won,
  COALESCE(SUM(pd.value) FILTER (WHERE pd.is_deleted = FALSE AND pd.stage = 'won'), 0) as total_revenue,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_deleted = FALSE) as total_messages,
  NOW() as refreshed_at
FROM socialfy_organizations o
LEFT JOIN socialfy_leads l ON l.organization_id = o.id
LEFT JOIN socialfy_campaigns c ON c.organization_id = o.id
LEFT JOIN socialfy_pipeline_deals pd ON pd.organization_id = o.id
LEFT JOIN socialfy_messages m ON m.organization_id = o.id
WHERE o.is_deleted = FALSE
GROUP BY o.id, o.name, o.plan;

-- Índice na materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_socialfy_org_metrics_org
ON mv_socialfy_org_metrics(organization_id);

-- Função para refresh da materialized view
CREATE OR REPLACE FUNCTION socialfy_refresh_org_metrics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_socialfy_org_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. CONNECTION POOLING SETTINGS (recomendações para Supabase)
-- ============================================================================

-- Estas são recomendações de configuração, não comandos SQL executáveis
-- Configurar no Supabase Dashboard > Settings > Database

/*
RECOMENDAÇÕES DE POOLING:

1. Supabase usa Supavisor para connection pooling
   - Transaction mode: Melhor para aplicações serverless
   - Session mode: Para aplicações que precisam de prepared statements

2. Configurações recomendadas:
   - Pool size: 15-25 conexões por projeto
   - Pool timeout: 60s
   - Statement timeout: 30s

3. Na aplicação TypeScript/JavaScript:
   - Usar client singleton (não criar nova conexão por request)
   - Usar realtime apenas quando necessário
   - Preferir RPC functions para queries complexas
*/

-- ============================================================================
-- 11. OTIMIZAÇÃO DE STORAGE (TOAST)
-- ============================================================================

-- Configurar compressão para colunas JSONB grandes
ALTER TABLE socialfy_leads ALTER COLUMN source_data SET STORAGE EXTENDED;
ALTER TABLE socialfy_leads ALTER COLUMN cnpj_data SET STORAGE EXTENDED;
ALTER TABLE socialfy_leads ALTER COLUMN custom_fields SET STORAGE EXTENDED;
ALTER TABLE socialfy_activities ALTER COLUMN metadata SET STORAGE EXTENDED;
ALTER TABLE socialfy_messages ALTER COLUMN metadata SET STORAGE EXTENDED;
ALTER TABLE socialfy_cadences ALTER COLUMN steps SET STORAGE EXTENDED;

-- ============================================================================
-- 12. VACUUM E ANALYZE AUTOMÁTICO (recomendação)
-- ============================================================================

-- O Supabase gerencia isso automaticamente, mas você pode forçar:
-- VACUUM ANALYZE socialfy_leads;
-- VACUUM ANALYZE socialfy_messages;
-- VACUUM ANALYZE socialfy_activities;

-- ============================================================================
-- 13. PARTICIONAMENTO (para tabelas muito grandes no futuro)
-- ============================================================================

-- Se socialfy_activities crescer muito, considerar particionamento por mês
-- Exemplo de como fazer (não executar agora):
/*
CREATE TABLE socialfy_activities_partitioned (
  LIKE socialfy_activities INCLUDING ALL
) PARTITION BY RANGE (performed_at);

CREATE TABLE socialfy_activities_2026_01 PARTITION OF socialfy_activities_partitioned
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
*/

-- ============================================================================
-- 14. GRANTS E SEGURANÇA
-- ============================================================================

-- Garantir que service_role tem acesso às funções de cache
GRANT EXECUTE ON FUNCTION socialfy_cache_get TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_cache_set TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_cache_cleanup TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_dashboard_totals_cached TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_soft_delete TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_restore TO service_role;
GRANT EXECUTE ON FUNCTION socialfy_refresh_org_metrics TO service_role;

-- ============================================================================
-- CONCLUÍDO!
-- ============================================================================

SELECT 'Database optimization migration completed!' as status,
       'Soft delete, indices, caching, and views created' as details;
