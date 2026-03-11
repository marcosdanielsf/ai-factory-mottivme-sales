-- ===================================================================
-- DISCOVERY: ENCONTRAR DADOS REAIS DO FUNIL
-- Execute no Supabase SQL Editor e cole o resultado aqui
-- ===================================================================

-- 1. ESTRUTURA DA VIEW dashboard_ranking_clientes
SELECT '=== COLUNAS DE dashboard_ranking_clientes ===' AS info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dashboard_ranking_clientes'
ORDER BY ordinal_position;

-- 2. AMOSTRA DOS DADOS (para ver quais colunas têm valores)
SELECT '=== SAMPLE dashboard_ranking_clientes ===' AS info;
SELECT * FROM dashboard_ranking_clientes LIMIT 3;

-- 3. ESTRUTURA DA TABELA app_dash_principal (fonte GHL)
SELECT '=== COLUNAS DE app_dash_principal ===' AS info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'app_dash_principal'
ORDER BY ordinal_position;

-- 4. CONTAGEM POR STATUS em app_dash_principal
SELECT '=== STATUS em app_dash_principal ===' AS info;
SELECT status, COUNT(*) as total
FROM app_dash_principal
GROUP BY status
ORDER BY total DESC;

-- 5. ESTRUTURA DA TABELA socialfy_leads
SELECT '=== COLUNAS DE socialfy_leads ===' AS info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'socialfy_leads'
ORDER BY ordinal_position;

-- 6. CONTAGEM POR STATUS em socialfy_leads
SELECT '=== STATUS em socialfy_leads ===' AS info;
SELECT status, COUNT(*) as total
FROM socialfy_leads
GROUP BY status
ORDER BY total DESC;

-- 7. LISTAR TODAS AS VIEWS QUE CONTÊM "dashboard" ou "funnel" ou "ranking"
SELECT '=== VIEWS RELACIONADAS ===' AS info;
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND (table_name LIKE '%dashboard%' OR table_name LIKE '%funnel%' OR table_name LIKE '%ranking%' OR table_name LIKE '%lead%')
ORDER BY table_name;

-- 8. LISTAR TODAS AS TABELAS QUE CONTÊM "lead" ou "contact" ou "opportunity"
SELECT '=== TABELAS DE LEADS/CONTACTS ===' AS info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (table_name LIKE '%lead%' OR table_name LIKE '%contact%' OR table_name LIKE '%opportunity%' OR table_name LIKE '%ghl%')
ORDER BY table_name;

-- 9. TOTAL DE REGISTROS NAS TABELAS PRINCIPAIS
SELECT '=== CONTAGEM DE REGISTROS ===' AS info;
SELECT 'dashboard_ranking_clientes' as tabela, COUNT(*) as total FROM dashboard_ranking_clientes
UNION ALL
SELECT 'app_dash_principal', COUNT(*) FROM app_dash_principal
UNION ALL
SELECT 'socialfy_leads', COUNT(*) FROM socialfy_leads;
