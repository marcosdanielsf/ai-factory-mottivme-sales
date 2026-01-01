# 🚀 Quick Start Guide

## Teste AGORA (Sem Credenciais)

```bash
# 1. Verificar estrutura
./test-structure.sh
```

**Resultado esperado:** ✅ STRUCTURE TEST PASSED

---

## Setup Completo (Com Credenciais)

### 1️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar o arquivo .env
nano .env  # ou vim, code, etc.
```

**Preencha com suas credenciais:**

```env
# Supabase Configuration
SUPABASE_URL=https://SUPABASE_URL.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Dashboard Webhook (opcional)
DASHBOARD_WEBHOOK_URL=http://localhost:3000

# Flask Server Port
PORT=5000

# n8n Webhook URL
N8N_WEBHOOK_URL=https://cliente-a1.mentorfy.io/webhook/ai-factory-orchestrator
```

### 2️⃣ Instalar Dependências

```bash
pip3 install -r requirements.txt
```

**Ou instalar manualmente:**
```bash
pip3 install anthropic supabase flask flask-cors requests python-dotenv
```

### 3️⃣ Testar Integração

```bash
./test-integration.sh
```

**Isso vai:**
- ✅ Verificar conexão com Supabase
- ✅ Criar versão de teste
- ✅ Iniciar agentes em background
- ✅ Testar API (health check)
- ✅ Triggerar teste via API
- ✅ Verificar resultados no banco

### 4️⃣ Iniciar Produção

```bash
./orchestrator.sh
```

**Agentes iniciados:**
- 🤖 AI Judge (monitorando versões pendentes)
- 📊 Analytics Engine (calculando métricas)
- 🔗 Webhook Sync Agent (API na porta 5000)

**Logs em tempo real:**
```bash
tail -f logs/*.log
```

### 5️⃣ Parar Todos os Agentes

```bash
./orchestrator.sh stop
```

---

## ⚡ Comandos Rápidos

```bash
# Status dos agentes
ls -la pids/

# Ver logs
tail -f logs/ai_judge.log
tail -f logs/analytics.log
tail -f logs/webhook_sync.log

# Health check da API
curl http://localhost:5000/health

# Triggerar teste manual
curl -X POST http://localhost:5000/api/agents/test-version \
  -H "Content-Type: application/json" \
  -d '{"version_id": "uuid-da-versao"}'
```

---

## 🔧 Troubleshooting

### Erro: "Missing environment variables"
```bash
# Verifique se .env existe
ls -la .env

# Verifique o conteúdo
cat .env

# Recarregue as variáveis
source .env
```

### Erro: "Connection refused (Supabase)"
```bash
# Teste a URL manualmente
curl -I $SUPABASE_URL

# Verifique a service key
echo $SUPABASE_SERVICE_KEY | head -c 50
```

### Erro: "Port 5000 already in use"
```bash
# Ver o que está rodando na porta
lsof -i :5000

# Matar o processo
kill $(lsof -t -i:5000)

# Ou usar outra porta
PORT=5001 ./orchestrator.sh
```

### Agentes não estão rodando
```bash
# Verificar PIDs
cat pids/*.pid

# Verificar processos
ps aux | grep python

# Reiniciar
./orchestrator.sh stop
./orchestrator.sh
```

---

## 📊 Verificar se Está Funcionando

### 1. API Health Check
```bash
curl http://localhost:5000/health
```

**Esperado:**
```json
{
  "status": "healthy",
  "service": "Dashboard Sync Agent",
  "timestamp": "2025-12-31T..."
}
```

### 2. Verificar Logs
```bash
tail -n 50 logs/ai_judge.log
```

**Esperado:**
```
🤖 AI Judge Agent running... Monitoring pending approvals
🔍 Found 0 versions pending approval
```

### 3. Dashboard
Abra `http://localhost:3000/` e veja:
- ✅ Métricas atualizadas
- ✅ Gráficos carregados
- ✅ Últimos testes exibidos

---

## 🎯 Fluxo Completo de Teste

### Criar Nova Versão (via Supabase SQL)

```sql
-- No Supabase SQL Editor
INSERT INTO agent_versions (
  agent_id,
  version_number,
  system_prompt,
  status,
  created_at
) VALUES (
  'seu-agent-id-aqui',
  'v1.0.0-test',
  'Você é um assistente de vendas profissional e educado.',
  'pending_approval',
  NOW()
) RETURNING id;
```

### Aguardar Processamento (30s)

O AI Judge vai:
1. Detectar a nova versão
2. Executar testes
3. Gerar scores
4. Salvar resultados
5. Atualizar status

### Verificar Resultados

```sql
-- Ver resultado dos testes
SELECT
  score_overall,
  score_dimensions,
  status
FROM agenttest_runs
WHERE agent_version_id = 'uuid-da-versao'
ORDER BY created_at DESC
LIMIT 1;
```

### Dashboard Atualiza Automaticamente! 🎉

---

## 💡 Dicas

1. **Use o test-structure.sh primeiro** para validar a instalação
2. **Mantenha os logs abertos** durante desenvolvimento
3. **Use curl para testar a API** antes de integrar com o frontend
4. **Monitore o Supabase** em tempo real (Table Editor)
5. **Rode analytics manualmente** se precisar recalcular métricas:
   ```bash
   python3 agents/analytics_agent.py
   ```

---

## 📞 Próximos Passos

Depois que tudo estiver rodando:

1. ✅ Integrar com o Dashboard (já funciona via Supabase!)
2. ✅ Configurar n8n workflow (template pronto)
3. ✅ Adicionar Slack notifications
4. ✅ Implementar Knowledge Manager (RAG)
5. ✅ Adicionar WebSocket para real-time updates

---

**Desenvolvido para MOTTIVME - AI Factory Project** 🚀
