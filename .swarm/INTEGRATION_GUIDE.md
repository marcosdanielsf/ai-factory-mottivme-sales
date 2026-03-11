# 🔗 Guia de Integração: Dashboard ↔ Multi-Agent Backend

## Visão Geral

Este guia explica como integrar o Dashboard (Torre de Controle) com os agentes de backend que executam testes, calculam métricas e sincronizam dados.

---

## Arquitetura de Comunicação

```
Dashboard (Frontend)
     ↓ ↑ (REST API / Supabase Realtime)
Webhook Sync Agent (API Server)
     ↓ ↑
AI Judge | Analytics | Knowledge Manager
     ↓ ↑
Supabase Database
```

---

## 1. Configuração Inicial

### Backend (.swarm/)

```bash
# 1. Copiar .env.example para .env
cp .swarm/.env.example .swarm/.env

# 2. Editar .env com suas credenciais
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=your-service-key
# ANTHROPIC_API_KEY=your-anthropic-key

# 3. Instalar dependências
pip3 install -r .swarm/requirements.txt

# 4. Iniciar orquestrador
./swarm/orchestrator.sh
```

### Frontend (Dashboard)

Já está configurado! Os hooks consomem diretamente do Supabase:
- `useDashboardMetrics()` → `vw_dashboard_metrics`
- `useTestResults()` → `agenttest_runs`
- `useAgentPerformance()` → `vw_agent_performance_summary`

---

## 2. Fluxo de Dados: Criar Nova Versão

### Opção A: Via Dashboard UI (Planejado)

```typescript
// pages/PromptEditor.tsx
const handleSaveVersion = async () => {
  // 1. Salvar no Supabase com status 'pending_approval'
  const { data } = await supabase
    .from('agent_versions')
    .insert({
      agent_id: selectedAgent.id,
      version_number: 'v1.2.3',
      system_prompt: editorContent,
      status: 'pending_approval',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  // 2. AI Judge detecta automaticamente e executa testes
  // (nenhuma ação necessária - agente monitora a tabela)

  // 3. Aguardar conclusão via polling ou WebSocket
  const interval = setInterval(async () => {
    const { data: version } = await supabase
      .from('agent_versions')
      .select('status, avg_score_overall')
      .eq('id', data.id)
      .single();

    if (version?.status === 'ready_for_human_approval') {
      clearInterval(interval);
      toast.success(`Testes concluídos! Score: ${version.avg_score_overall}/10`);
    }
  }, 5000);
};
```

### Opção B: Via API Direta

```typescript
// Triggerar teste manualmente via API do Webhook Sync Agent
const triggerTest = async (versionId: string) => {
  const response = await fetch('http://localhost:5000/api/agents/test-version', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version_id: versionId })
  });

  const result = await response.json();
  console.log(result); // { success: true, message: "Test queued..." }
};
```

---

## 3. Fluxo de Dados: Aprovar Versão

```typescript
// Dashboard pode aprovar diretamente atualizando o Supabase
const approveVersion = async (versionId: string) => {
  await supabase
    .from('agent_versions')
    .update({
      status: 'production',
      deployed_at: new Date().toISOString()
    })
    .eq('id', versionId);

  toast.success('Versão aprovada e em produção!');
};

// OU via API (se precisar de lógica adicional)
const approveVersionViaAPI = async (versionId: string) => {
  await fetch(`http://localhost:5000/api/agents/${versionId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'production' })
  });
};
```

---

## 4. Fluxo de Dados: Logar Conversas em Tempo Real

Quando um agente conversa com um lead via WhatsApp/Chat, deve logar via API:

```python
# De dentro do seu agente n8n ou Python
import requests

def log_conversation(lead_id, agent_id, role, content):
    response = requests.post(
        'http://localhost:5000/api/conversations/log',
        json={
            'lead_id': lead_id,
            'agent_id': agent_id,
            'role': role,  # 'user' ou 'assistant'
            'content': content,
            'channel': 'whatsapp',
            'tokens_used': 150,
            'cost_usd': 0.0045,
            'sentiment_score': 0.85
        }
    )
    return response.json()
```

O Dashboard automaticamente mostrará em **Logs** (via `useAgentConversations()`).

---

## 5. Monitoramento de Agentes

### Verificar Status dos Agentes

```bash
# Ver logs em tempo real
tail -f .swarm/logs/*.log

# Verificar PIDs
ls -la .swarm/pids/

# Health check da API
curl http://localhost:5000/health
```

### Dashboard de Métricas

Acesse `http://localhost:3000/` e veja:
- **Total de Agentes:** Contagem de `agents` ativos
- **Leads Processados:** De `ai_factory_leads`
- **Taxa de Conversão:** Calculada pelo Analytics Agent
- **Últimas Validações:** De `agenttest_runs`

---

## 6. Integração n8n

### Importar Workflow

1. Acesse seu n8n
2. Importe `.swarm/n8n-workflow-template.json`
3. Configure o webhook URL para triggerar no n8n
4. Ative o workflow

### Webhook para Nova Versão

```bash
curl -X POST https://cliente-a1.mentorfy.io/webhook/ai-factory-new-version \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "uuid-do-agente",
    "version_number": "v1.2.3",
    "system_prompt": "Prompt aqui...",
    "created_by": "user-id"
  }'
```

O n8n irá:
1. Inserir no Supabase
2. Triggerar AI Judge via API
3. Aguardar conclusão
4. Notificar Dashboard + Slack

---

## 7. Endpoints da API

### `POST /api/agents/test-version`
Triggerar teste de uma versão

**Body:**
```json
{
  "version_id": "uuid-da-versao"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test queued. AI Judge will process it shortly.",
  "version_id": "uuid-da-versao"
}
```

---

### `GET /api/agents/<agent_id>/scores`
Buscar scores de todas as versões de um agente

**Response:**
```json
{
  "agent_id": "uuid",
  "versions": [
    {
      "id": "uuid",
      "version_number": "v1.2.3",
      "avg_score_overall": 8.5,
      "avg_score_dimensions": {
        "tone": 9.0,
        "engagement": 8.5,
        "compliance": 7.5,
        "accuracy": 10.0,
        "empathy": 8.0,
        "efficiency": 7.0
      },
      "total_test_runs": 5
    }
  ]
}
```

---

### `PATCH /api/agents/<version_id>/status`
Atualizar status de uma versão

**Body:**
```json
{
  "status": "production"  // ou "sandbox", "archived", etc.
}
```

**Response:**
```json
{
  "success": true,
  "version_id": "uuid",
  "new_status": "production"
}
```

---

### `POST /api/conversations/log`
Logar conversa em tempo real

**Body:**
```json
{
  "lead_id": "uuid",
  "agent_id": "uuid",
  "role": "user",
  "content": "Quanto custa?",
  "channel": "whatsapp",
  "tokens_used": 50,
  "cost_usd": 0.0015,
  "sentiment_score": 0.65
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "uuid-da-conversa"
}
```

---

### `GET /api/dashboard/metrics`
Retorna métricas agregadas (espelha `vw_dashboard_metrics`)

**Response:**
```json
{
  "total_active_agents": 3,
  "total_leads": 150,
  "qualified_leads": 75,
  "global_conversion_rate_pct": 50.0,
  "versions_in_production": 3,
  "versions_pending_approval": 1,
  "tests_last_24h": 12,
  "conversations_last_24h": 245
}
```

---

## 8. Troubleshooting

### Agentes não estão testando automaticamente
1. Verifique se AI Judge está rodando: `cat .swarm/pids/ai_judge.pid`
2. Verifique logs: `tail -f .swarm/logs/ai_judge.log`
3. Confirme que a versão tem `status = 'pending_approval'`

### Dashboard não atualiza métricas
1. Verifique se Analytics Agent rodou: `python3 .swarm/agents/analytics_agent.py`
2. Confirme que há leads em `ai_factory_leads`

### API não responde
1. Verifique se porta 5000 está livre: `lsof -i :5000`
2. Reinicie o Webhook Sync Agent

---

## 9. Próximos Passos

- [ ] Adicionar WebSocket para notificações em tempo real
- [ ] Implementar autenticação JWT nos endpoints
- [ ] Criar dashboard de monitoramento dos agentes
- [ ] Adicionar retry automático com exponential backoff
- [ ] Implementar rate limiting na API

---

## Suporte

Desenvolvido para **MOTTIVME** - AI Factory Project

**Contato:** Marcos Daniels
**Projeto:** `assembly-line` (front-factorai-mottivme-sales)
