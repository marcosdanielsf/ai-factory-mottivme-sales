# 🤖 AI Factory Multi-Agent Orchestrator

## Visão Geral

Sistema de múltiplos agentes especializados que atuam como "Operários do Backend" da AI Factory, seguindo o contrato de dados do Dashboard (Torre de Controle).

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Torre de Controle)            │
│                  (Next.js + Supabase + Recharts)            │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API / WebSocket
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  WEBHOOK SYNC AGENT (Flask)                 │
│             Expõe endpoints para comunicação                │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
    ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐
    │  AI JUDGE   │ │ANALYTICS│ │KNOWLEDGE  │
    │   AGENT     │ │ ENGINE  │ │ MANAGER   │
    └──────┬──────┘ └───┬────┘ └─────┬─────┘
           │            │            │
           └────────────┴────────────┘
                       │
              ┌────────▼────────┐
              │   SUPABASE DB   │
              │  (Contrato de   │
              │      Dados)     │
              └─────────────────┘
```

## Agentes Especializados

### 1. **AI Quality Judge**
- **Responsabilidade:** Executar testes de qualidade automatizados
- **Trigger:** `agent_versions.status = 'pending_approval'`
- **Output:** Salva em `agenttest_runs` com scores 0-10
- **Script:** `agents/ai_judge_agent.py`

**Formato de Output:**
```json
{
  "score_overall": 8.5,
  "score_dimensions": {
    "tone": 9.0,
    "engagement": 8.5,
    "compliance": 7.5,
    "accuracy": 10.0,
    "empathy": 8.0,
    "efficiency": 7.0
  }
}
```

### 2. **Analytics Engine**
- **Responsabilidade:** Calcular métricas de conversão
- **Trigger:** Cron job (a cada 5 minutos) ou on-demand
- **Output:** Atualiza `agent_versions.conversion_rate`
- **Script:** `agents/analytics_agent.py`

**Fórmulas:**
- `conversion_rate = (qualified_leads / total_leads) * 100`
- `avg_interactions_to_goal = SUM(interactions) / COUNT(goals)`

### 3. **Dashboard Sync Agent (API Server)**
- **Responsabilidade:** Expor API REST para o Dashboard
- **Port:** 5000 (configurável via `.env`)
- **Script:** `agents/webhook_sync_agent.py`

**Endpoints:**
- `POST /api/agents/test-version` - Triggerar teste manual
- `GET /api/agents/<id>/scores` - Buscar scores de versões
- `PATCH /api/agents/<id>/status` - Aprovar/rejeitar versão
- `POST /api/conversations/log` - Logar conversa em tempo real

### 4. **Knowledge Manager** (Planejado)
- Indexar documentos em `factory_artifacts`
- Prover contexto RAG para agentes

## Setup

### 1. Instalar Dependências
```bash
cd .swarm
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Iniciar Orquestrador
```bash
chmod +x orchestrator.sh
./orchestrator.sh
```

**Isso irá:**
- Iniciar AI Judge Agent (monitoring mode)
- Iniciar Analytics Engine
- Iniciar API Server na porta 5000
- Criar logs em `.swarm/logs/`

### 4. Parar Todos os Agentes
```bash
./orchestrator.sh stop
```

## Integração com Dashboard

### Frontend → Backend
O Dashboard pode chamar os endpoints do Webhook Sync Agent:

```typescript
// Exemplo: Triggerar teste manual
const response = await fetch('http://localhost:5000/api/agents/test-version', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ version_id: 'uuid-da-versao' })
});
```

### Backend → Frontend
Os agentes atualizam diretamente o Supabase, e o Dashboard consome via hooks:
- `useDashboardMetrics()` → Lê de `vw_dashboard_metrics`
- `useTestResults()` → Lê de `agenttest_runs`
- `useAgentPerformance()` → Lê de `vw_agent_performance_summary`

## Workflow n8n

Importe o template em `n8n-workflow-template.json` para automatizar:
1. Receber webhook de nova versão
2. Inserir no Supabase
3. Triggerar AI Judge
4. Aguardar conclusão dos testes
5. Atualizar métricas
6. Notificar Dashboard + Slack

## Logs e Monitoramento

```bash
# Ver logs em tempo real
tail -f .swarm/logs/*.log

# Ver apenas AI Judge
tail -f .swarm/logs/ai_judge.log

# Ver API requests
tail -f .swarm/logs/webhook_sync.log
```

## Contrato de Dados (Obrigatório)

### Tabelas Usadas
- `agent_versions` - Write: status, avg_score_overall, conversion_rate
- `agenttest_runs` - Write: score_overall, score_dimensions
- `ai_factory_conversations` - Write: lead_id, content, tokens
- `factory_artifacts` - Read: knowledge base

### Views Consumidas
- `vw_dashboard_metrics` - Leitura pelo Dashboard
- `vw_agent_performance_summary` - Leitura pelo Dashboard
- `vw_score_evolution` - Leitura pelo Dashboard

## Troubleshooting

**Erro: Missing environment variables**
→ Verifique se `.env` está configurado corretamente

**Erro: Connection refused (Supabase)**
→ Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`

**Agentes não estão rodando**
→ Verifique PIDs em `.swarm/pids/` e logs em `.swarm/logs/`

**API não responde**
→ Verifique se a porta 5000 está disponível: `lsof -i :5000`

## Roadmap

- [ ] Implementar Knowledge Manager com embeddings
- [ ] Adicionar WebSocket para notificações em tempo real
- [ ] Criar dashboard de monitoramento dos agentes
- [ ] Implementar retry automático em caso de falha
- [ ] Adicionar circuit breaker para Anthropic API

## Contato

Desenvolvido para **MOTTIVME** - AI Factory Project
Dashboard: `front-factorai-mottivme-sales`
