# SOP 05: Gestão de Infraestrutura

**Versão:** 1.0
**Data:** 14/01/2026
**Stack:** Railway, Supabase, n8n, GoHighLevel

---

## OBJETIVO

Gerenciar toda infraestrutura tecnológica da Mottivme para garantir disponibilidade, segurança e escalabilidade.

---

## ARQUITETURA DA INFRAESTRUTURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOTTIVME INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND LAYER                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │ Socialfy     │  │ Assembly     │  │ Dashboard    │                      │
│  │ (Vercel)     │  │ Line (Vercel) │  │ (Vercel)     │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
│         ↓                 ↓                 ↓                                │
│  API LAYER                                                                   │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │ Railway APIs (FastAPI Python)                      │                  │
│  │ - /health                                          │                  │
│  │ - /rag-search                                      │                  │
│  │ - /webhook/*                                       │                  │
│  └──────────────────────────────────────────────────────┘                  │
│         ↓                                                                    │
│  ORCHESTRATION LAYER                                                        │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │ n8n (cliente-a1.mentorfy.io)                       │                  │
│  │ - Workflows de automação                          │                  │
│  │ - Integrações                                      │                  │
│  └──────────────────────────────────────────────────────┘                  │
│         ↓                                                                    │
│  DATA LAYER                                                                  │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │ Supabase (bfumywvwubvernvhjehk.supabase.co)         │                  │
│  │ - PostgreSQL + pgvector                            │                  │
│  │ - Edge Functions                                   │                  │
│  │ - Storage                                          │                  │
│  │ - Auth                                             │                  │
│  └──────────────────────────────────────────────────────┘                  │
│         ↓                                                                    │
│  CRM LAYER                                                                   │
│  ┌──────────────────────────────────────────────────────┐                  │
│  │ GoHighLevel (Multi-location)                       │                  │
│  │ - Client management                               │                  │
│  │ - Pipeline de vendas                               │                  │
│  │ - Webhooks                                         │                  │
│  └──────────────────────────────────────────────────────┘                  │
│         ↓                                                                    │
│  AI LAYER                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐                                  │
│  │ OpenAI API      │  │ Anthropic API   │                                  │
│  │ (GPT-4/GPT-3.5) │  │ (Claude)         │                                  │
│  └─────────────────┘  └─────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SERVIÇOS E CREDENCIAIS

### Railway (Backend APIs)

**URL:** https://agenticoskevsacademy-production.up.railway.app

**Serviços:**
- Health check: `/health`
- RAG search: `/webhook/rag-search`
- RAG ingest: `/webhook/rag-ingest`
- Agent spawn: `/webhook/agent-spawn`

**Credenciais (ambiente):**
- Token: `RAILWAY_TOKEN`
- Project ID: `agenticoskevsacademy-production`

**Comandos úteis:**
```bash
# Health check
curl https://agenticoskevsacademy-production.up.railway.app/health

# Ver logs
railway logs --service agenticoskevsacademy-production

# Deploy
railway up
```

### Supabase (Database + Vector)

**URL:** https://bfumywvwubvernvhjehk.supabase.co

**Credenciais:**
- Project URL: `https://bfumywvwubvernvhjehk.supabase.co`
- Anon Key: `eyJ...` (público)
- Service Role: `eyJ...` (admin, manter secreto!)

**Tabelas principais:**
- `agent_versions` - Configurações de agentes IA
- `agent_metrics` - Métricas de desempenho
- `call_recordings` - Gravações de atendimento
- `rag_documents` - Base de conhecimento vetorial

**Comandos úteis:**
```sql
-- Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Top tabelas por tamanho
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;
```

### n8n (Orquestração)

**URL:** https://cliente-a1.mentorfy.io

**Credenciais de acesso:**
- Email: `admin@mottivme.com`
- Senha: [VERGER]

**Workflows principais:**
- `[AGENT] - Main Workflow` - Atendimento IA
- `Auto Lead Scoring` - Pontuação de leads
- `Follow-up Automation` - Follow-up automático
- `Lead Reengagement` - Reaquecimento

**Comandos úteis:**
```bash
# Reiniciar n8n (via Docker)
cd ~/mottivme-infra
docker-compose restart n8n

# Ver logs
docker-compose logs -f n8n
```

### GoHighLevel (CRM)

**URL:** https://app.gohighlevel.com/

**Agency Account:**
- ID: `agency_id`
- Sub-contas: múltiplas (por cliente)

**API Access:**
- API Key: Por location
- Documentation: https://highlevel.stoplight.io

### OpenAI / Anthropic (AI)

**OpenAI:**
- API Key: `sk-...`
- Modelos: gpt-4, gpt-3.5-turbo
- Limite: Varia por plano

**Anthropic:**
- API Key: `sk-ant-...`
- Modelos: claude-3-opus, claude-3-sonnet
- Limite: Varia por plano

---

## MONITORAMENTO

### Health Checks Diários

```bash
#!/bin/bash
# health-check.sh

echo "=== Mottivme Health Check ==="
echo "$(date '+%Y-%m-%d %H:%M:%S')"

# Railway API
echo -n "Railway: "
curl -s https://agenticoskevsacademy-production.up.railway.app/health | jq -r '.status // "DOWN"'

# Supabase
echo -n "Supabase: "
curl -s https://bfumywvwubvernvhjehk.supabase.co/rest/v1/ | grep -q "schema" && echo "UP" || echo "DOWN"

# n8n
echo -n "n8n: "
curl -s https://cliente-a1.mentorfy.io/healthz | grep -q "OK" && echo "UP" || echo "DOWN"

# GHL (ver um location)
echo -n "GHL: "
curl -s "https://app.gohighlevel.com/v2/ping" | grep -q "pong" && echo "UP" || echo "DOWN"

echo "==========================="
```

### Uptime Monitoring

**Recomendado:** UptimeRobot ou similar

**Endpoints para monitorar:**
1. Railway API: https://agenticoskevsacademy-production.up.railway.app/health
2. Supabase: https://bfumywvwubvernvhjehk.supabase.co
3. n8n: https://cliente-a1.mentorfy.io/healthz
4. Socialfy: https://socialfy-platform.vercel.app

**Alertas:**
- Down time > 5 min: Alerta WhatsApp
- Down time > 15 min: Alerta WhatsApp + Email
- Down time > 1 hora: Telefonema para on-call

---

## MANUTENÇÃO

### Backup Diário (Automático)

```bash
#!/bin/bash
# backup-daily.sh

DATA=$(date +%Y-%m-%d)
DIR_BACKUP=~/Backups/mottivme/$DATA

mkdir -p $DIR_BACKUP

# Backup Supabase
pg_dump -h bfumywvwubvernvhjehk.supabase.co -U postgres -d postgres > $DIR_BACKUP/supabase.sql

# Backup n8n workflows
n8n export:workflow --all > $DIR_BACKUP/n8n-workflows.json

# Backup configs GHL
# (manual, exportar locations regularmente)

echo "Backup concluído: $DIR_BACKUP"
```

### Limpeza Semanal

**Logs do n8n:**
```bash
# Manter apenas últimos 30 dias
n8n delete:execution --before="30 days ago"
```

**Execuções antigas Supabase:**
```sql
-- Deletar logs antigos (mais de 90 dias)
DELETE FROM workflow_executions
WHERE created_at < NOW() - INTERVAL '90 days';

-- Deletar mensagens antigas
DELETE FROM conversation_history
WHERE created_at < NOW() - INTERVAL '180 days';
```

### Atualizações Mensais

**Checklist:**
- [ ] Atualizar Railway para versão mais recente
- [ ] Atualizar n8n para versão mais recente
- [ ] Revisar e rotacionar secrets (API keys)
- [ ] Verificar se há dependências desatualizadas
- [ ] Testar restore de backup

---

## SEGURANÇA

### Gerenciamento de Secrets

**Nunca commitar credenciais!** Usar variáveis de ambiente.

**Variáveis críticas:**
```bash
# Railway
RAILWAY_TOKEN=xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Supabase
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=eyJ
SUPABASE_SERVICE_ROLE_KEY=eyJ

# n8n
N8N_ENCRYPTION_KEY=xxx
N8N_BASIC_AUTH_USER=xxx
N8N_BASIC_AUTH_PASSWORD=xxx
```

### Rotation de Secrets

**Frequência:** A cada 90 dias

**Processo:**
1. Gerar nova chave
2. Atualizar variável de ambiente
3. Testar com nova chave
4. Remover chave antiga

**Exemplo OpenAI:**
```bash
# 1. Gerar nova chave no OpenAI dashboard

# 2. Atualizar no Railway
railway variables set OPENAI_API_KEY=sk-new-key

# 3. Deploy
railway up

# 4. Testar
curl -X POST https://agenticoskevsacademy-production.up.railway.app/test-openai

# 5. Remover chave antiga (OpenAI dashboard)
```

### Controle de Acesso

**Quem tem acesso a quê:**

| Serviço | Quem | Nível |
|---------|------|-------|
| Railway | Marcos Daniel | Owner |
| Supabase | Marcos Daniel | Owner |
| n8n | Marcos Daniel + Isabella | Admin |
| GHL Agency | Marcos Daniel | Owner |
| GHL Locations | Cliente + Mottivme | Admin |

**Para adicionar/remover acesso:**
1. **Railway:** Settings > Team > Invite/Remove
2. **Supabase:** Settings > Team > Add/Remove member
3. **n8n:** Settings > Users > Add/Remove
4. **GHL:** Sub-account settings > Users

---

## ESCALABILIDADE

### Níveis de Tráfego

| Nível | Leads/dia | Ações necessárias |
|-------|-----------|-------------------|
| **Bronze** | 0-100 | Setup atual suficiente |
| **Prata** | 100-500 | Adicionar Redis para cache |
| **Ouro** | 500-1000 | Multiple n8n workers |
| **Platina** | 1000+ | Arquitetura distribuída |

### Escalando Supabase

**Plano Free:** 500MB database, 1GB bandwidth, 50GB storage

**Quando mudar de plano:**
- Database approaching 500MB
- CPU > 80% consistentemente
- Slow queries (> 1s)

**Upgrade para Pro:**
- 8GB database
- 50GB bandwidth
- 100GB storage
- Dedicated CPU

### Escalando Railway

**Plano atual:** Starter ($5/mês)

**Limites:**
- 512MB RAM
- 0.5 vCPU
- 500 hours execution time/mês

**Quando mudar:**
- RAM > 80%
- Execution time approaching limit
- Slow response times

**Upgrade para:** Docker ($20/mês)
- 2GB RAM
- 2 vCPU
- 2000 hours execution time/mês

---

## DISASTER RECOVERY

### Plano de Recuperação

**Cenário 1: Railway cai**
1. Detectar: Health check falha
2. Escalar: Verificar status.railway.app
3. Resolver: Re-deploy se necessário
4. Comunicar: Avisar clientes se downtime > 30min

**Cenário 2: Supabase cai**
1. Detectar: Queries falham
2. Escalar: Status.supabase.com
3. Resolver: Aguardar recuperação automática
4. Comunicar: Avisar clientes se downtime > 15min

**Cenário 3: n8n cai**
1. Detectar: Workflows não executam
2. Escalar: Verificar container Docker
3. Resolver: `docker-compose restart n8n`
4. Comunicar: Avisar clientes se downtime > 30min

**Cenário 4: Dados perdidos**
1. Detectar: Tabela corrompida ou deletada
2. Escalar: CRÍTICO - Imediato
3. Resolver: Restore do backup mais recente
4. Comunicar: Transparência total com clientes

### Teste de Disaster Recovery

**Frequência:** Trimestral

**Procedimento:**
1. Simular queda de Railway (parar serviço)
2. Verificar tempo de recovery
3. Simular perda de dados (deletar tabela de teste)
4. Restaurar do backup
5. Documentar melhorias necessárias

---

## OTIMIZAÇÃO DE CUSTOS

### Análise Mensal de Custos

| Serviço | Custo Atual | Uso | Oportunidade |
|---------|-------------|-----|---------------|
| Railway | $5/mês | 60% | OK |
| Supabase | $0/mês (free) | 40% | Monitorar perto do limite |
| n8n | $0 (self-hosted) | Servidor dedicado | Avaliar cloud n8n |
| OpenAI | Variável | 100k tokens/mês | Implementar cache |
| GHL | $97/mês/location | 3 locations | Consolidar se possível |

### Estratégias de Redução

1. **Cache de respostas OpenAI**
   - Respostas repetitivas não precisam de nova chamada
   - Economia estimada: 30-40%

2. **Usar GPT-3.5 para tarefas simples**
   - First contact pode usar GPT-3.5
   - Economia estimada: 60-70% vs GPT-4

3. **Consolidar GHL locations**
   - Se múltiplos clientes pequenos, usar location única
   - Economia: $97/mês por location consolidada

---

## DOCUMENTAÇÃO

### Diagrama de Infraestrutura

**Manter atualizado em:**
- `/Projects/mottivme/_docs/ARQUITETURA-INFRAESTRUTURA.md`
- Incluir: IPs, ports, endpoints, credenciais (sem valores sensíveis)

### Runbooks

**Criar runbooks para:**
- [ ] Como fazer deploy de emergência
- [ ] Como restaurar backup
- [ ] Como escalar serviço
- [ ] Como rotacionar secrets

---

## COMUNICAÇÃO COM TIME TÉCNICO

### Status Page

**Disponibilizar para clientes:** `status.mottivme.com.br`

**Mostrar:**
- Status de todos os serviços
- Incidentes ativos
- Histórico de uptime (30 dias)

### Incident Response

**Quando incidente detectado:**

1. **Identificar** (5 min)
   - Qual serviço afetado?
   - Qual o impacto?
   - Quantos clientes afetados?

2. **Comunicar** (15 min)
   - Postar no Status Page
   - Enviar WhatsApp para clientes afetados
   - Atualizar time interno

3. **Resolver** (variável)
   - Trabalhar na solução
   - Atualizar Status Page a cada 15min
   - Estimar tempo de resolução

4. **Post-incidente** (1 dia)
   - Documentar o que aconteceu
   - Criar plano de prevenção
   - Revisar com time

---

*SOP 05 - Gestão de Infraestrutura*
*Versão 1.0 - Janeiro 2026*
