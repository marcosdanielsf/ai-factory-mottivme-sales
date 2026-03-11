#!/bin/bash
# Orchestrator Master Script
# Inicializa todos os agentes em paralelo e gerencia o ciclo de vida

set -e

echo "🚀 Starting AI Factory Multi-Agent Orchestrator..."

# Verificar variáveis de ambiente
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: Missing environment variables"
    echo "Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY"
    exit 1
fi

# Criar diretórios de logs
mkdir -p .swarm/logs

# Função para iniciar agente em background
start_agent() {
    local agent_name=$1
    local agent_script=$2
    local log_file=".swarm/logs/${agent_name}.log"

    echo "▶️ Starting ${agent_name}..."
    python3 ".swarm/agents/${agent_script}" > "$log_file" 2>&1 &
    echo $! > ".swarm/pids/${agent_name}.pid"
    echo "✅ ${agent_name} started (PID: $!)"
}

# Criar diretório de PIDs
mkdir -p .swarm/pids

# Iniciar todos os agentes em paralelo
echo ""
echo "📦 Spawning specialized agents..."
echo ""

start_agent "ai_judge" "ai_judge_agent.py"
start_agent "analytics" "analytics_agent.py"
start_agent "webhook_sync" "webhook_sync_agent.py"

echo ""
echo "✅ All agents spawned successfully!"
echo ""
echo "📊 Agent Status:"
echo "  - AI Judge: Monitoring pending approvals"
echo "  - Analytics: Calculating conversion rates"
echo "  - Webhook Sync: API Server running on port 5000"
echo ""
echo "🔗 API Endpoints:"
echo "  - POST http://localhost:5000/api/agents/test-version"
echo "  - GET  http://localhost:5000/api/agents/<id>/scores"
echo "  - PATCH http://localhost:5000/api/agents/<id>/status"
echo "  - POST http://localhost:5000/api/conversations/log"
echo ""
echo "📝 Logs are being written to .swarm/logs/"
echo ""
echo "To stop all agents: ./orchestrator.sh stop"
echo ""

# Função para parar todos os agentes
stop_agents() {
    echo "🛑 Stopping all agents..."

    for pid_file in .swarm/pids/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            agent_name=$(basename "$pid_file" .pid)

            if kill -0 "$pid" 2>/dev/null; then
                echo "Stopping ${agent_name} (PID: ${pid})..."
                kill "$pid"
            fi

            rm "$pid_file"
        fi
    done

    echo "✅ All agents stopped"
}

# Capturar sinais de interrupção
trap stop_agents EXIT INT TERM

# Se argumento for "stop", parar agentes e sair
if [ "$1" == "stop" ]; then
    stop_agents
    exit 0
fi

# Manter o script rodando e monitorar logs
echo "📡 Monitoring agents... Press Ctrl+C to stop all agents"
echo ""

tail -f .swarm/logs/*.log
