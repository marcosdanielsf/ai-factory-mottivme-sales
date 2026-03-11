-- ===================================================================
-- DISCOVERY COMPLETO - Execute TUDO de uma vez no Supabase SQL Editor
-- Cole a saída aqui para eu gerar os SQLs corretos
-- ===================================================================

-- 1. LISTAR TODAS AS TABELAS
SELECT '=== TABELAS ===' AS info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. COLUNAS DA TABELA agent_versions
SELECT '=== AGENT_VERSIONS ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agent_versions'
ORDER BY ordinal_position;

-- 3. COLUNAS DA TABELA agenttest_runs
SELECT '=== AGENTTEST_RUNS ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agenttest_runs'
ORDER BY ordinal_position;

-- 4. COLUNAS DA TABELA ai_factory_leads
SELECT '=== AI_FACTORY_LEADS ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_factory_leads'
ORDER BY ordinal_position;

-- 5. COLUNAS DA TABELA ai_factory_conversations
SELECT '=== AI_FACTORY_CONVERSATIONS ===' AS info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_factory_conversations'
ORDER BY ordinal_position;

-- 6. SAMPLE DATA de agent_versions (1 registro)
SELECT '=== SAMPLE agent_versions ===' AS info;
SELECT *
FROM agent_versions
LIMIT 1;

-- 7. SAMPLE DATA de agenttest_runs (1 registro)
SELECT '=== SAMPLE agenttest_runs ===' AS info;
SELECT *
FROM agenttest_runs
LIMIT 1;

-- 8. CONTAGEM DE REGISTROS
SELECT '=== COUNTS ===' AS info;
SELECT
    'agent_versions' AS table_name,
    COUNT(*) AS total_rows
FROM agent_versions
UNION ALL
SELECT
    'agenttest_runs',
    COUNT(*)
FROM agenttest_runs
UNION ALL
SELECT
    'ai_factory_leads',
    COUNT(*)
FROM ai_factory_leads
UNION ALL
SELECT
    'ai_factory_conversations',
    COUNT(*)
FROM ai_factory_conversations;
