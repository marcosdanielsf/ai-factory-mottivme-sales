-- Migration 082: Deprecar views legadas de funil
-- Fase 6 do PRD Semantic Layer Unification
-- APENAS comentarios de deprecacao — NAO dropa nenhuma view
-- Views continuam funcionando para retrocompatibilidade
-- Dropar em futuro proximo apos confirmar que nenhum consumer externo as usa

-- ============================================================================
-- DEPRECATED: vw_client_funnel_complete
-- Substituida por: vw_unified_funnel (migration 078)
-- Ultimo consumer removido: get_client_funnel RPC (migration 079)
-- Status: ZERO referencias em codigo TS/TSX
-- Acao futura: DROP apos 30 dias sem uso (monitorar via pg_stat_user_tables)
-- ============================================================================
COMMENT ON VIEW vw_client_funnel_complete IS
  'DEPRECATED (2026-03-14): Substituida por vw_unified_funnel (migration 078). '
  'Nenhum consumer ativo. Dropar apos 2026-04-14 se sem uso.';

-- ============================================================================
-- NOTA: Views que NAO devem ser deprecated (ainda em uso ativo)
-- ============================================================================
-- vw_dashboard_metrics — usada por useDashboardMetrics (Central Tower ranking)
--   Usa app_dash_principal pra dados de lead individual (nome, telefone, etc.)
--   NAO e duplicata de vw_unified_funnel — granularidade diferente
--
-- app_dash_principal — TABELA (nao view), usada por:
--   useClientPerformance, usePerformanceDrilldown, supabase-sales-ops
--   Dados de contato individual (telefone, nome) — NAO duplica funil unificado
--
-- vw_funnel_tracking_enhanced — usada por useAdsPerformance
--   Per-ad attribution funnel (ad_id granularity) — diferente de vw_unified_funnel
--
-- vw_funnel_tracking_by_ad — usada por useMetricsLab
--   Per-ad attribution com lead scoring — complementar, nao conflitante

-- ============================================================================
-- MONITORAMENTO: Verificar uso antes de dropar
-- ============================================================================
-- SELECT schemaname, relname, seq_scan, last_seq_scan
-- FROM pg_stat_user_tables
-- WHERE relname = 'vw_client_funnel_complete';
--
-- Se seq_scan = 0 por 30+ dias, seguro dropar.

-- ROLLBACK: Nenhum — apenas comentarios adicionados
