# SOP 03: Gestão de Workflows n8n

**Versão:** 1.0
**Data:** 14/01/2026
**Plataforma:** n8n (cliente-a1.mentorfy.io)

---

## OBJETIVO

Gerenciar, manter e escalar workflows n8n para orquestração de IA e automações.

---

## ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA N8N MOTTIVME                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WEBHOOK GHL    │    SUPABASE     │    AI AGENT     │    WHATSAPP API      │
│  (Recebe msg)   │    (Busca IA)    │    (Claude/GPT)  │    (Envia resp)     │
│       ↓         │        ↓         │        ↓         │        ↓           │
│  ───────────────────────────────────────────────────────────────────────  │
│                              WORKFLOW N8N                                  │
│  ───────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  1. Webhook Trigger      → Recebe mensagem do GHL                       │
│  2. Buscar Agente        → Consulta Supabase pela configuração           │
│  3. Preparar Contexto    → Monta prompt com dados do lead                │
│  4. Executar IA          → Chama Claude/GPT-4                            │
│  5. Processar Resposta   → Verifica se há tool call                      │
│  6. Executar Tool        → Se necessário, chama função                   │
│  7. Enviar Mensagem      → Via API do WhatsApp                           │
│  8. Salvar Histórico     → Atualiza Supabase e GHL                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOWS PRINCIPAIS

### 1. Workflow Principal: Atendimento IA

**Nome:** `[AGENTE-NAME] - Main Workflow`
**Trigger:** Webhook do GHL
**Frequência:** Tempo real

**Estrutura:**

```
Node 1: Webhook (GHL Message Received)
  ↓
Node 2: Supabase - Get Agent Config
  ↓
Node 3: Merge Data (Lead + Agent Config)
  ↓
Node 4: Prepare System Prompt
  ↓
Node 5: AI Agent (Claude/GPT)
  ↓
Node 6: IF (Tool Call Detected)
  ├─ TRUE → Node 7a: Execute Tool
  │           ↓
  │           Node 8a: Update Context
  │           ↓
  │           [Volta para Node 5]
  │
  └─ FALSE → Node 7b: Extract Response
              ↓
              Node 8b: Send WhatsApp Message
              ↓
              Node 9b: Save History (Supabase)
              ↓
              Node 10b: Update GHL Contact
```

### 2. Workflow: Lead Scoring

**Nome:** `Auto Lead Scoring`
**Trigger:** Novo contato criado
**Frequência:** A cada novo lead

**Lógica de Pontuação:**

```javascript
// Pontuação Demográfica (max 30)
const demoScore =
  (cargo == 'CEO' ? 15 : cargo == 'Gerente' ? 10 : cargo == 'Analista' ? 5 : 0) +
  (funcionarios >= 10 ? 10 : funcionarios >= 2 ? 5 : 0) +
  (segmento == 'Servicos B2B' ? 5 : 0);

// Pontuação Comportamental (max 40)
const behavScore =
  (respondeu ? 10 : 0) +
  (perguntou_preco ? 15 : 0) +
  (solicitou_reuniao ? 20 : 0) +
  (visitou_site_3x ? 5 : 0) +
  (abriu_email_3x ? 5 : 0);

// Pontuação BANT (max 30)
const bantScore =
  (budget_confirmado ? 10 : 0) +
  (eh_decisor ? 10 : 0) +
  (necessidade_clara ? 5 : 0) +
  (timeline_definido ? 5 : 0);

const totalScore = demoScore + behavScore + bantScore; // 0-100

// Classificar
if (totalScore >= 70) return 'QUENTE';
if (totalScore >= 40) return 'MORNO';
return 'FRIO';
```

### 3. Workflow: Follow-up Automático

**Nome:** `Follow-up Automation`
**Trigger:** Agendamento (cron)
**Frequência:** Diário às 9h, 14h, 19h

**Lógica:**

```javascript
// Buscar leads que precisam de follow-up
const leads = await db.query(`
  SELECT c.id, c.name, c.phone, c.ultima_interacao
  FROM contacts c
  WHERE c.status = 'em_qualificacao'
    AND (
      c.ultima_interacao < NOW() - INTERVAL '2 days'
      OR c.ultima_interacao IS NULL
    )
    AND c.followup_count < 5
  LIMIT 50
`);

// Para cada lead, enviar mensagem personalizada
for (const lead of leads) {
  const mensagem = gerarMensagemFollowUp(lead);
  await enviarWhatsApp(lead.phone, mensagem);
  await incrementarFollowupCount(lead.id);
}
```

### 4. Workflow: Reaquecimento

**Nome:** `Lead Reengagement`
**Trigger:** Agendamento (cron semanal)
**Frequência:** Segundas às 10h

**Alvo:** Leads frios > 30 dias

---

## MANUTENÇÃO DE WORKFLOWS

### Checklist Diário (5 min)

- [ ] Verificar se workflows estão ativos
- [ ] Checar erros nas últimas 24h
- [ ] Monitorar tempo de execução
- [ ] Verificar custos de API

### Checklist Semanal (30 min)

- [ ] Revisar logs de erro
- [ ] Otimizar nodes lentos
- [ ] Atualizar documentação
- [ ] Testar fluxos críticos

### Checklist Mensal (2h)

- [ ] Auditoria completa de workflows
- [ ] Limpar execuções antigas
- [ ] Revisar custos e otimizar
- [ ] Atualizar versões de nodes
- [ ] Backup de configurações

---

## SOLUÇÃO DE PROBLEMAS

### Problema: Workflow não executa

**Diagnóstico:**
```bash
# 1. Verificar se está ativo
# n8n > Workflows > [Nome] > Active (toggle ON)

# 2. Verificar erros recentes
# n8n > Executions > [Nome] > Filter: Failed

# 3. Testar webhook
curl -X POST [WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Causas comuns:**
- Webhook URL desatualizada no GHL
- API key do Supabase expirada
- Node com configuração incorreta
- Rate limit da API da OpenAI

**Soluções:**
1. Atualizar webhook URL no GHL
2. Renovar API key no Supabase
3. Reconfigurar node com erro
4. Implementar retry com exponential backoff

### Problema: Resposta da IA demora muito

**Diagnóstico:**
```javascript
// Adicionar logs de tempo
const startTime = Date.now();
const response = await callAI(prompt);
const duration = Date.now() - startTime;
console.log(`AI Response took ${duration}ms`);
```

**Causas comuns:**
- Prompt muito longo
- Contexto acumulado excessivo
- API da OpenAI sobrecarregada
- Network latency

**Soluções:**
1. Resumir histórico (manter últimas 10 msgs)
2. Usar GPT-3.5 para tarefas simples
3. Implementar cache de respostas comuns
4. Adicionar timeout de 30s

### Problema: Custo de API muito alto

**Diagnóstico:**
```sql
-- Consultar custos no Supabase
SELECT
  DATE(created_at) as dia,
  COUNT(*) as total_chamadas,
  SUM(tokens_used) as tokens_total,
  SUM(cost) as custo_total
FROM ai_calls_log
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

**Otimizações:**
1. **Cache de respostas** (mensagens repetitivas)
2. **Model selection** (GPT-3.5 vs GPT-4)
3. **Prompt compression** (remover redundâncias)
4. **Batch processing** (processar múltiplos leads)

---

## ESCALABILIDADE

### Nível 1: Até 100 leads/dia

**Configuração atual suficiente**
- 1 workflow principal
- 1 instância Supabase
- GPT-3.5 para respostas

### Nível 2: 100-500 leads/dia

**Upgrade necessário:**
- [ ] Implementar fila de processamento (Redis)
- [ ] Separar workflows por tipo (first_contact, followup)
- [ ] Usar GPT-4 apenas para qualificação
- [ ] Adicionar monitoramento com alertas

### Nível 3: 500-1000 leads/dia

**Arquitetura escalável:**
- [ ] Multiple n8n workers (load balancing)
- [ ] Supabase pool sizing (5-10 conexões)
- [ ] Redis para cache e fila
- [ ] CDN para assets estáticos
- [ ] Monitoring com dashboard

---

## DOCUMENTAÇÃO DE WORKFLOW

### Template de Documentação

Para cada workflow, documentar:

```markdown
# [Nome do Workflow]

## Propósito
[Breve descrição do que faz]

## Trigger
- **Tipo:** [Webhook/Cron/Manual]
- **Condição:** [Quando dispara]

## Fluxo
1. [Node 1] → [Descrição]
2. [Node 2] → [Descrição]
...

## Inputs
- [Campo 1]: [Tipo e descrição]
- [Campo 2]: [Tipo e descrição]

## Outputs
- [Resultado 1]: [Descrição]
- [Resultado 2]: [Descrição]

## Dependências
- [Serviço 1]: [Para que serve]
- [Serviço 2]: [Para que serve]

## Monitoramento
- **Métrica chave:** [O que medir]
- **Alerta:** [Quando acionar]
- **Ação:** [O que fazer]

## Histórico de Mudanças
| Data | Versão | Mudança | Autor |
|------|--------|---------|-------|
```

---

## BACKUP E VERSIONAMENTO

### Backup de Workflows

```bash
# Exportar todos os workflows
# n8n > Workflows > Export All

# Salvar como JSON
mkdir -p ~/Backups/n8n/$(date +%Y-%m-%d)
n8n export:workflow --all > ~/Backups/n8n/$(date +%Y-%m-%d)/workflows.json
```

### Versionamento

```bash
# Usar Git para versionar mudanças importantes
cd ~/Projects/mottivme/ai-factory-mottivme-sales
git add workflows/
git commit -m "feat: new workflow for [X]"
git push
```

---

## MÉTRICAS E MONITORAMENTO

### KPIs de Workflows

| Métrica | Meta | Como medir |
|---------|------|------------|
| Uptime | > 99% | Tempo ativo / tempo total |
| Tempo resposta | < 5s | Duração execução workflow |
| Taxa erro | < 1% | Erros / Total execuções |
| Custo por lead | < R$ 0,50 | Custo API / Leads processados |
| Throughput | 1000/dia | Leads processados por dia |

### Dashboard de Monitoramento

```sql
-- Query para dashboard
SELECT
  DATE(created_at) as dia,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN error = true THEN 1 ELSE 0 END) as erros,
  AVG(duration_ms) as tempo_medio_ms,
  SUM(cost) as custo_total
FROM workflow_executions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

---

## INTEGRAÇÕES

### GoHighLevel

**Webhook de mensagem recebida:**
```json
{
  "contact": {
    "id": "abc123",
    "phone": "+5518999999999",
    "email": "lead@email.com",
    "firstName": "Maria",
    "lastName": "Silva"
  },
  "message": {
    "body": "Oi, gostaria de saber mais",
    "direction": "inbound",
    "timestamp": "2026-01-14T10:30:00Z"
  },
  "location": {
    "id": "ehlHgDeJS3sr8rCDcZtA",
    "name": "Cliente X"
  }
}
```

### Supabase

**Buscar agente:**
```sql
SELECT * FROM agent_versions
WHERE location_id = '{{ $json.location.id }}'
  AND is_active = true
  AND status = 'active'
LIMIT 1;
```

### WhatsApp API

**Enviar mensagem:**
```bash
curl -X POST https://graph.facebook.com/v18.0/[PHONE_NUMBER_ID]/messages \
  -H "Authorization: Bearer [ACCESS_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "{{ $json.contact.phone }}",
    "type": "text",
    "text": {
      "body": "{{ $json.ai_response }}"
    }
  }'
```

---

## MELHORES PRÁTICAS

### Performance

1. **Paralelizar quando possível**
   - Usar SplitInBatches para múltiplos registros
   - Processar leads independentes em paralelo

2. **Evitar loops infinitos**
   - Sempre adicionar condição de parada
   - Usar timeout nodes

3. **Usar code judiciosamente**
   - Manter funções simples e focadas
   - Comentar código complexo

### Segurança

1. **Nunca expor credenciais**
   - Usar variáveis de ambiente
   - Nunca hardcodar senhas

2. **Validar inputs**
   - Sempre validar dados externos
   - Sanitizar strings antes de usar

3. **Rate limiting**
   - Respeitar limites das APIs
   - Implementar fila se necessário

### Debugabilidade

1. **Logs estruturados**
   ```javascript
   console.log(JSON.stringify({
     timestamp: new Date().toISOString(),
     workflow: 'nome-do-workflow',
     node: 'node-name',
     data: { /* relevant data */ }
   }, null, 2));
   ```

2. **Error handling**
   - Capturar erros em nodes críticos
   - Adicionar contexto ao erro
   - Notificar em caso de falha

---

## EVOLUÇÃO

### Roadmap

**Q1 2026:**
- [ ] Implementar monitoramento avançado
- [ ] Dashboard de métricas em tempo real
- [ ] Otimizar custos de API

**Q2 2026:**
- [ ] Sistema de failover automático
- [ ] Load balancing para workflows
- [ ] Integração com mais canais

---

*SOP 03 - Gestão de Workflows n8n*
*Versão 1.0 - Janeiro 2026*
