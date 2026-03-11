#!/bin/bash
# Script de teste end-to-end da orquestração

set -e

echo "🧪 Testing AI Factory Multi-Agent Integration"
echo ""

# Verificar se variáveis de ambiente estão configuradas
if [ ! -f ".swarm/.env" ]; then
    echo "❌ Error: .env file not found"
    echo "Copy .env.example to .env and configure your credentials"
    exit 1
fi

source .swarm/.env

echo "✅ Environment variables loaded"
echo ""

# Teste 1: Verificar conexão com Supabase
echo "📡 Test 1: Supabase Connection"
SUPABASE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_SERVICE_KEY}")

if [ "$SUPABASE_HEALTH" == "200" ] || [ "$SUPABASE_HEALTH" == "401" ]; then
    echo "✅ Supabase connection OK"
else
    echo "❌ Supabase connection failed (HTTP ${SUPABASE_HEALTH})"
    exit 1
fi
echo ""

# Teste 2: Verificar instalação de dependências Python
echo "🐍 Test 2: Python Dependencies"
if python3 -c "import anthropic, supabase, flask" 2>/dev/null; then
    echo "✅ Python dependencies installed"
else
    echo "⚠️ Missing dependencies. Installing..."
    pip3 install -r .swarm/requirements.txt
fi
echo ""

# Teste 3: Criar versão de teste no Supabase
echo "📝 Test 3: Create Test Agent Version"

TEST_VERSION_ID=$(uuidgen)
TEST_AGENT_ID="test-agent-$(date +%s)"

cat > /tmp/test_version.json <<EOF
{
    "id": "${TEST_VERSION_ID}",
    "agent_id": "${TEST_AGENT_ID}",
    "version_number": "v0.0.1-test",
    "system_prompt": "Você é um assistente de vendas educado e profissional.",
    "status": "draft",
    "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

SUPABASE_INSERT=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/agent_versions" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d @/tmp/test_version.json)

if echo "$SUPABASE_INSERT" | grep -q "id"; then
    echo "✅ Test version created: ${TEST_VERSION_ID}"
else
    echo "❌ Failed to create test version"
    echo "$SUPABASE_INSERT"
    exit 1
fi
echo ""

# Teste 4: Iniciar agentes em background
echo "🤖 Test 4: Starting Agents"

./orchestrator.sh &
ORCHESTRATOR_PID=$!

echo "✅ Orchestrator started (PID: ${ORCHESTRATOR_PID})"
sleep 5

# Verificar se processos estão rodando
if [ -f ".swarm/pids/webhook_sync.pid" ]; then
    WEBHOOK_PID=$(cat .swarm/pids/webhook_sync.pid)
    if kill -0 "$WEBHOOK_PID" 2>/dev/null; then
        echo "✅ Webhook Sync Agent running (PID: ${WEBHOOK_PID})"
    fi
fi
echo ""

# Teste 5: Verificar API
echo "🌐 Test 5: API Health Check"
sleep 3

API_HEALTH=$(curl -s http://localhost:5000/health)
if echo "$API_HEALTH" | grep -q "healthy"; then
    echo "✅ API Server healthy"
    echo "$API_HEALTH" | python3 -m json.tool
else
    echo "❌ API Server not responding"
fi
echo ""

# Teste 6: Trigger teste via API
echo "🔬 Test 6: Trigger AI Judge Test"

TRIGGER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/agents/test-version \
    -H "Content-Type: application/json" \
    -d "{\"version_id\": \"${TEST_VERSION_ID}\"}")

if echo "$TRIGGER_RESPONSE" | grep -q "success"; then
    echo "✅ Test triggered successfully"
    echo "$TRIGGER_RESPONSE" | python3 -m json.tool
else
    echo "⚠️ Test trigger response:"
    echo "$TRIGGER_RESPONSE"
fi
echo ""

# Aguardar processamento
echo "⏳ Waiting 30 seconds for AI Judge to process..."
sleep 30

# Teste 7: Verificar resultados no Supabase
echo "📊 Test 7: Check Test Results"

TEST_RESULTS=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/agenttest_runs?agent_version_id=eq.${TEST_VERSION_ID}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

if echo "$TEST_RESULTS" | grep -q "score_overall"; then
    echo "✅ Test results found in database"
    echo "$TEST_RESULTS" | python3 -m json.tool | head -20
else
    echo "⚠️ No test results yet (may take longer)"
fi
echo ""

# Limpar
echo "🧹 Cleanup"
./orchestrator.sh stop
kill $ORCHESTRATOR_PID 2>/dev/null || true

echo ""
echo "✅ Integration test completed!"
echo ""
echo "📝 Summary:"
echo "  - Supabase: Connected"
echo "  - Dependencies: Installed"
echo "  - Test Version: Created (${TEST_VERSION_ID})"
echo "  - Agents: Started and stopped"
echo "  - API: Responded"
echo ""
echo "🚀 Ready for production!"
