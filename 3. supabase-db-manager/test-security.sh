#!/bin/bash

# Script de teste de segurança para as APIs corrigidas
# Executar com: bash test-security.sh

BASE_URL="http://localhost:3000"

echo "🔒 Testando correções de segurança..."
echo ""

# Test 1: SQL Injection via Table Name
echo "1️⃣ Test SQL Injection via Table Name"
echo "Request: GET /api/data/users\"; DROP TABLE users--"
curl -s -X GET "${BASE_URL}/api/data/users\"; DROP TABLE users--" | jq .
echo ""

# Test 2: SQL Injection via Column Name  
echo "2️⃣ Test SQL Injection via Column Name"
echo "Request: GET /api/data/users?sortColumn=id; DROP TABLE users--"
curl -s -X GET "${BASE_URL}/api/data/users?sortColumn=id; DROP TABLE users--" | jq .
echo ""

# Test 3: Operator Injection
echo "3️⃣ Test Operator Injection"
echo 'Request: POST /api/data/users with malicious operator'
curl -s -X POST "${BASE_URL}/api/data/users" \
  -H 'Content-Type: application/json' \
  -d '{"filters":[{"column":"id","operator":"OR 1=1--","value":"1"}]}' | jq .
echo ""

# Test 4: Query Confirmation Status
echo "4️⃣ Test Query Confirmation Status"
echo 'Request: POST /api/query with DELETE (should return 409)'
curl -s -i -X POST "${BASE_URL}/api/query" \
  -H 'Content-Type: application/json' \
  -d '{"sql":"DELETE FROM users WHERE id=1"}' | head -20
echo ""

# Test 5: Invalid Table Name Characters
echo "5️⃣ Test Invalid Table Name Characters"
echo "Request: GET /api/data/users@#$%"
curl -s -X GET "${BASE_URL}/api/data/users@#$%" | jq .
echo ""

# Test 6: Valid Request (should work)
echo "6️⃣ Test Valid Request (should work)"
echo "Request: GET /api/data/users (valid table name)"
curl -s -X GET "${BASE_URL}/api/data/users?limit=5" | jq .
echo ""

# Test 7: RLS Toggle with invalid table
echo "7️⃣ Test RLS Toggle with invalid table"
echo 'Request: POST /api/rls with malicious table name'
curl -s -X POST "${BASE_URL}/api/rls" \
  -H 'Content-Type: application/json' \
  -d '{"table_name":"users; DROP TABLE users--","enable":true}' | jq .
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "Resultados esperados:"
echo "- Testes 1-5 e 7: Devem retornar erro 400 (Invalid table name/column/operator)"
echo "- Teste 4: Deve retornar status 409 Conflict"
echo "- Teste 6: Deve retornar dados válidos (se tabela existir)"
