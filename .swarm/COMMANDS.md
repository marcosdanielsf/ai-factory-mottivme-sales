# ⚡ Comandos Rápidos - AI Factory Multi-Agent System

## 🚀 Setup Inicial (Primeira vez)

```bash
# 1. Verificar estrutura
cd .swarm
./test-structure.sh

# 2. Configurar credenciais
cp .env.example .env
nano .env  # Adicionar suas keys

# 3. Instalar dependências (se necessário)
pip3 install -r requirements.txt
```

---

## 🎯 Comandos Principais

### Iniciar Sistema
```bash
cd .swarm
./orchestrator.sh
```

### Parar Sistema
```bash
cd .swarm
./orchestrator.sh stop
```

### Teste de Integração Completo
```bash
cd .swarm
./test-integration.sh
```

### Teste de Estrutura (sem credenciais)
```bash
cd .swarm
./test-structure.sh
```

---

## 📊 Monitoramento

### Ver todos os logs em tempo real
```bash
cd .swarm
tail -f logs/*.log
```

### Ver log específico
```bash
tail -f logs/ai_judge.log
tail -f logs/analytics.log
tail -f logs/webhook_sync.log
```

### Ver últimas 50 linhas
```bash
tail -n 50 logs/ai_judge.log
```

### Ver processos rodando
```bash
ls -la pids/
cat pids/*.pid
```

### Verificar se agentes estão rodando
```bash
ps aux | grep python | grep agent
```

---

## 🔗 API Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Triggerar Teste Manual
```bash
curl -X POST http://localhost:5000/api/agents/test-version \
  -H "Content-Type: application/json" \
  -d '{"version_id": "UUID-DA-VERSAO"}'
```

### Buscar Scores de um Agente
```bash
curl http://localhost:5000/api/agents/AGENT-ID/scores
```

### Aprovar Versão
```bash
curl -X PATCH http://localhost:5000/api/agents/VERSION-ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "production"}'
```

### Logar Conversa
```bash
curl -X POST http://localhost:5000/api/conversations/log \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "UUID",
    "agent_id": "UUID",
    "role": "user",
    "content": "Quanto custa?",
    "channel": "whatsapp"
  }'
```

### Métricas do Dashboard
```bash
curl http://localhost:5000/api/dashboard/metrics
```

---

## 🐍 Executar Agentes Manualmente

### AI Judge (execução única)
```bash
cd .swarm
python3 agents/ai_judge_agent.py
```

### Analytics Engine (recalcular métricas)
```bash
cd .swarm
python3 agents/analytics_agent.py
```

### Webhook Sync (API Server)
```bash
cd .swarm
python3 agents/webhook_sync_agent.py
```

---

## 🗄️ Comandos Supabase (SQL)

### Criar Versão de Teste
```sql
INSERT INTO agent_versions (
  agent_id,
  version_number,
  system_prompt,
  status,
  created_at
) VALUES (
  'seu-agent-id',
  'v1.0.0-test',
  'Você é um assistente profissional.',
  'pending_approval',
  NOW()
) RETURNING id;
```

### Ver Últimos Testes
```sql
SELECT
  id,
  agent_version_id,
  score_overall,
  score_dimensions,
  status,
  created_at
FROM agenttest_runs
ORDER BY created_at DESC
LIMIT 10;
```

### Ver Versões Pendentes
```sql
SELECT
  id,
  version_number,
  status,
  avg_score_overall,
  total_test_runs,
  created_at
FROM agent_versions
WHERE status = 'pending_approval'
ORDER BY created_at DESC;
```

### Ver Métricas do Dashboard
```sql
SELECT * FROM vw_dashboard_metrics;
```

---

## 🔧 Troubleshooting

### Reiniciar tudo
```bash
cd .swarm
./orchestrator.sh stop
sleep 2
./orchestrator.sh
```

### Limpar PIDs
```bash
cd .swarm
rm -f pids/*.pid
```

### Limpar Logs
```bash
cd .swarm
rm -f logs/*.log
```

### Ver porta 5000
```bash
lsof -i :5000
```

### Matar processo na porta 5000
```bash
kill $(lsof -t -i:5000)
```

### Verificar variáveis de ambiente
```bash
cd .swarm
source .env
echo $SUPABASE_URL
echo $ANTHROPIC_API_KEY | head -c 30
```

### Reinstalar dependências
```bash
cd .swarm
pip3 install -r requirements.txt --upgrade
```

---

## 📦 Git Commands (para commitar)

### Ver status
```bash
git status .swarm/
```

### Adicionar arquivos
```bash
git add .swarm/
```

### Commit
```bash
git commit -m "feat: add multi-agent orchestration system"
```

---

## 🔄 n8n Integration

### Importar workflow
1. Abra n8n
2. Settings → Import Workflow
3. Selecione: `.swarm/n8n-workflow-template.json`
4. Ative o workflow

### Testar webhook n8n
```bash
curl -X POST https://cliente-a1.mentorfy.io/webhook/ai-factory-new-version \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "uuid",
    "version_number": "v1.0.0",
    "system_prompt": "Prompt aqui...",
    "created_by": "user-id"
  }'
```

---

## 📊 Dashboards & Monitoring

### Abrir Dashboard
```bash
# No navegador:
http://localhost:3000/
```

### Ver API Docs (se implementado)
```bash
http://localhost:5000/docs
```

### Logs do Supabase
```bash
# No Supabase Dashboard:
# Logs → Query logs
# Procure por: SELECT FROM agenttest_runs
```

---

## 🎯 Fluxo Completo de Teste

```bash
# 1. Criar versão no Supabase (SQL acima)

# 2. Verificar que AI Judge pegou
tail -f .swarm/logs/ai_judge.log

# 3. Aguardar ~30 segundos

# 4. Verificar resultado
curl http://localhost:5000/api/agents/AGENT-ID/scores

# 5. Dashboard atualiza automaticamente!
```

---

## 💡 Atalhos úteis

```bash
# Alias para facilitar
alias swarm-start="cd .swarm && ./orchestrator.sh"
alias swarm-stop="cd .swarm && ./orchestrator.sh stop"
alias swarm-logs="cd .swarm && tail -f logs/*.log"
alias swarm-test="cd .swarm && ./test-structure.sh"
alias swarm-health="curl -s http://localhost:5000/health | python3 -m json.tool"

# Adicionar ao ~/.zshrc ou ~/.bashrc
```

---

**Desenvolvido para MOTTIVME - AI Factory Project** 🚀
