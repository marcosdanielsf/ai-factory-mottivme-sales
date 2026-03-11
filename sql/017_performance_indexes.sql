-- =====================================================
-- PERFORMANCE INDEXES - Otimização de Consultas
-- =====================================================
-- Indices criticos para acelerar o painel de supervisao
-- 
-- IMPORTANTE: Use CREATE INDEX CONCURRENTLY para nao bloquear writes
-- Execute cada comando separadamente se necessario
-- =====================================================

-- 1. INDICE COMPOSTO PARA DISTINCT ON (MAIS IMPORTANTE!)
-- Usado na query que pega a ultima mensagem de cada session
-- O ORDER BY (session_id, created_at DESC) precisa desse indice
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_hist_session_created
ON public.n8n_historico_mensagens (session_id, created_at DESC)
WHERE session_id IS NOT NULL;

-- 2. INDICE PARA session_id PURO
-- Usado em COUNT(*), JOINs e filtros por session
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_hist_session_id
ON public.n8n_historico_mensagens (session_id)
WHERE session_id IS NOT NULL;

-- 3. INDICE PARA created_at (ORDER BY global)
-- Usado para ordenar conversas por data da ultima mensagem
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_hist_created_at
ON public.n8n_historico_mensagens (created_at DESC);

-- 4. INDICE PARA location_id (filtro por cliente)
-- Usado quando filtra conversas por cliente/location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_hist_location
ON public.n8n_historico_mensagens (location_id)
WHERE location_id IS NOT NULL;

-- 5. INDICE COMPOSTO PARA location_id + session_id
-- Otimiza filtros combinados (cliente + session)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_n8n_hist_location_session
ON public.n8n_historico_mensagens (location_id, session_id)
WHERE location_id IS NOT NULL AND session_id IS NOT NULL;

-- 6. ATUALIZAR ESTATISTICAS
-- Essencial apos criar indices para o query planner funcionar bem
ANALYZE public.n8n_historico_mensagens;

-- =====================================================
-- INDICES PARA TABELAS RELACIONADAS
-- =====================================================

-- Supervision states - ja tem indices no 013, mas garantir:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supervision_states_session_status
ON public.supervision_states (session_id, status);

-- Quality flags - indice para join com session
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quality_flags_session_unresolved
ON public.conversation_quality_flags (session_id)
WHERE NOT is_resolved;

-- =====================================================
-- VERIFICACAO
-- =====================================================
-- Execute para verificar se os indices foram criados:
--
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'n8n_historico_mensagens'
-- ORDER BY indexname;
--
-- Para verificar uso dos indices:
-- EXPLAIN ANALYZE SELECT DISTINCT ON (session_id) * 
-- FROM n8n_historico_mensagens 
-- WHERE session_id IS NOT NULL 
-- ORDER BY session_id, created_at DESC;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON INDEX idx_n8n_hist_session_created IS 'Indice composto para DISTINCT ON - critico para performance';
COMMENT ON INDEX idx_n8n_hist_session_id IS 'Indice para COUNT e JOINs por session_id';
COMMENT ON INDEX idx_n8n_hist_created_at IS 'Indice para ORDER BY created_at DESC';
COMMENT ON INDEX idx_n8n_hist_location IS 'Indice para filtro por location_id (cliente)';
