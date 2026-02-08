---
---

::: v-pre

# 🚀 Workflow 14 - Multi-Tenant Inbox Classifier

## 📋 Visão Geral

Workflow completo para classificação automática de leads do inbox Instagram usando IA personalizada por tenant.

**Arquivo:** `14-Multi-Tenant-Inbox-Classifier.json`

---

## 🎯 Fluxo Completo

```
Webhook
  ↓
1. Buscar Tenant (valida tenant_slug)
  ↓
2. Checar Whitelist (is_known_contact)
  ├─ Conhecido + Bypass → Salvar + Responder
  └─ Desconhecido → Continuar
       ↓
3. Buscar Persona Ativa (get_active_persona)
       ↓
4. Scrape Perfil Instagram
       ↓
5. Preparar Prompt IA (personalizado por tenant)
       ↓
6. Classificar com Gemini
       ↓
7. Parse Resposta IA
       ↓
8. Salvar Lead Classificado
       ↓
[Decisão baseada em score]
  ├─ LEAD_HOT (80-100)
  │   ├─ Auto-Responder
  │   ├─ Criar Oportunidade CRM
  │   └─ Notificar Slack
  ├─ LEAD_WARM (50-79)
  │   ├─ Auto-Responder
  │   └─ Adicionar Nurturing
  └─ LEAD_COLD/SPAM/PESSOAL
      └─ Apenas salvar
```

---

## 🔧 Setup Inicial

### 1. Importar Workflow no n8n

```bash
# Copiar arquivo para n8n workflows
cp 14-Multi-Tenant-Inbox-Classifier.json ~/.n8n/workflows/

# Reiniciar n8n (se local)
n8n restart
```

Ou importar via UI:
1. Abrir n8n
2. Menu → Import from File
3. Selecionar `14-Multi-Tenant-Inbox-Classifier.json`

### 2. Configurar Credenciais

#### a) Supabase PostgreSQL

```
Nome: supabase-postgres
Tipo: PostgreSQL
Host: db.xxxxxx.supabase.co
Database: postgres
User: postgres
Password: [seu-password]
Port: 5432
SSL: Enabled
```

#### b) Google Gemini API

```
Nome: gemini-api
Tipo: Google Gemini API
API Key: [sua-api-key]
```

Obter API key: https://aistudio.google.com/app/apikey

#### c) HTTP Header Auth (opcional - para webhooks)

```
Nome: webhook-auth
Tipo: HTTP Header Auth
Header Name: X-API-Key
Header Value: [sua-secret-key]
```

### 3. Ativar Workflow

1. Abrir workflow no n8n
2. Clicar em "Activate"
3. Copiar URL do webhook (ex: `https://n8n.example.com/webhook/inbox-message`)

---

## 📨 Como Usar

### Request Payload

```bash
curl -X POST "https://n8n.example.com/webhook/inbox-message" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "sua-empresa",
    "platform": "instagram",
    "username": "joao_agencia",
    "message": "Adorei seu conteúdo sobre automação! Como posso saber mais?"
  }'
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tenant_slug` | string | ✅ | Slug do tenant (ex: "socialfy") |
| `platform` | string | ❌ | Plataforma (padrão: "instagram") |
| `username` | string | ✅ | Username do contato |
| `message` | string | ✅ | Mensagem enviada pelo lead |

### Response - Sucesso

```json
{
  "status": "success",
  "lead_id": "uuid-do-lead",
  "classification": "LEAD_HOT",
  "icp_score": 85,
  "ai_analysis": {
    "reasoning": "Match perfeito: dono de agência, 5k seguidores, bio com 'marketing digital'",
    "score_breakdown": {
      "nicho": 28,
      "followers": 18,
      "keywords_bio": 19,
      "engajamento": 12,
      "intencao": 8
    },
    "detected_signals": [
      "keyword_positiva: agência",
      "keyword_positiva: leads",
      "engajamento_alto: mensagem específica"
    ],
    "suggested_response": "Olá João! Que legal que você se interessou! Nossa automação gera 10-30 leads qualificados por mês no automático. Quer agendar uma demo de 15min?"
  },
  "actions_taken": [
    "lead_saved",
    "auto_responded",
    "opportunity_created"
  ]
}
```

### Response - Contato Conhecido

```json
{
  "status": "known_contact",
  "classification": "PESSOAL",
  "contact_type": "amigo",
  "lead_id": "uuid-do-lead",
  "message": "Contato conhecido, bypass de IA aplicado"
}
```

### Response - Erro

```json
{
  "error": "Tenant não encontrado ou inativo",
  "tenant_slug": "empresa-inexistente"
}
```

---

## 🔄 Integração com GoHighLevel

### Webhook GoHighLevel → n8n

Configurar webhook no GHL para enviar mensagens do inbox:

1. **GHL → Settings → Integrations → Webhooks**
2. **Criar webhook:** "Inbox Message Received"
3. **URL:** `https://n8n.example.com/webhook/inbox-message`
4. **Payload:**

```json
{
  "tenant_slug": "{{location.slug}}",
  "platform": "instagram",
  "username": "{{contact.instagram_username}}",
  "message": "{{message.body}}"
}
```

### n8n → GoHighLevel (Auto-resposta)

Os nós `Auto-Responder HOT` e `Auto-Responder WARM` chamam webhook que envia mensagem via GHL API:

**Endpoint:** `POST /webhook/ghl-send-message`

```json
{
  "contact_username": "joao_agencia",
  "message": "Resposta sugerida pela IA",
  "platform": "instagram",
  "lead_id": "uuid-do-lead"
}
```

Você precisará criar workflow separado que:
1. Recebe esse payload
2. Busca contact no GHL
3. Envia mensagem via GHL API

---

## 📊 Classificações Possíveis

| Classificação | Score | Ação Automática |
|---------------|-------|-----------------|
| **LEAD_HOT** | 80-100 | ✅ Auto-responder<br>✅ Criar oportunidade CRM<br>✅ Notificar Slack |
| **LEAD_WARM** | 50-79 | ✅ Auto-responder<br>✅ Adicionar nurturing |
| **LEAD_COLD** | 20-49 | ⏸️ Apenas salvar |
| **PESSOAL** | 0-19 | ⏸️ Apenas salvar |
| **SPAM** | 0-19 | ⏸️ Apenas salvar |

---

## 🧪 Testando o Workflow

### 1. Teste Básico (Manual)

1. Abrir workflow no n8n
2. Clicar em "Execute Workflow"
3. No nó "Webhook", clicar em "Listen for Test Event"
4. Enviar request via curl (exemplo acima)
5. Verificar execução passo a passo

### 2. Teste com Dados Reais

```bash
# Lead HOT (esperado: score 80+)
curl -X POST "http://localhost:5678/webhook/inbox-message" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "socialfy",
    "username": "agencia_digital_sp",
    "message": "Adorei o conteúdo sobre automação! Trabalho com agências e preciso escalar leads. Pode me contar mais?"
  }'

# Lead WARM (esperado: score 50-79)
curl -X POST "http://localhost:5678/webhook/inbox-message" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "socialfy",
    "username": "consultor_vendas",
    "message": "Oi, gostei do seu perfil!"
  }'

# Lead COLD (esperado: score 20-49)
curl -X POST "http://localhost:5678/webhook/inbox-message" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "socialfy",
    "username": "personal_trainer_123",
    "message": "Oi!"
  }'

# Contato Conhecido (esperado: bypass IA)
curl -X POST "http://localhost:5678/webhook/inbox-message" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_slug": "socialfy",
    "username": "marcos_amigo",
    "message": "E aí, tudo certo?"
  }'
```

### 3. Verificar Resultados no Supabase

```sql
-- Ver leads classificados (últimos 10)
SELECT
  username,
  classification,
  icp_score,
  ai_analysis->>'reasoning' as reasoning,
  created_at
FROM classified_leads
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'socialfy')
ORDER BY created_at DESC
LIMIT 10;

-- Performance por classificação
SELECT
  classification,
  COUNT(*) as total,
  AVG(icp_score) as avg_score,
  SUM(CASE WHEN auto_responded THEN 1 ELSE 0 END) as auto_responded,
  SUM(CASE WHEN converted_to_opportunity THEN 1 ELSE 0 END) as converted
FROM classified_leads
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'socialfy')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY classification;
```

---

## 🎛️ Personalização por Tenant

### Ajustar Score Weights

No nó `5. Preparar Prompt IA`, você pode ajustar os pesos:

```javascript
**SCORE BREAKDOWN (0-100):**
1. Nicho (30 pontos): Match com nichos ideais?       // ← Ajustar aqui
2. Followers (20 pontos): Dentro da faixa ideal?     // ← Ajustar aqui
3. Keywords Bio (20 pontos): Tem keywords positivas? // ← Ajustar aqui
4. Engajamento (15 pontos): Mensagem demonstra interesse real?
5. Intenção (15 pontos): Tem fit com produto/serviço?
```

### Criar Prompt Específico

```javascript
// Exemplo: tenant que vende pra e-commerce
const prompt = `
Você é um assistente de classificação de leads para: ${persona.business_type}

**REGRAS ESPECIAIS PARA E-COMMERCE:**
- Se tem "loja online" ou "shopify" na bio → +20 pontos nicho
- Se followers < 1000 → -10 pontos (muito pequeno)
- Se tem "dropshipping" → -5 pontos (nicho saturado)
...
`;
```

---

## 🐛 Troubleshooting

### Erro: "Tenant não encontrado"

**Causa:** `tenant_slug` não existe ou tenant está inativo.

**Solução:**
```sql
-- Verificar tenants ativos
SELECT id, name, slug, status FROM tenants WHERE status = 'active';

-- Ativar tenant
UPDATE tenants SET status = 'active' WHERE slug = 'sua-empresa';
```

### Erro: "Persona não encontrada"

**Causa:** Tenant não tem persona ativa.

**Solução:**
```sql
-- Verificar personas
SELECT tenant_id, version, is_active FROM tenant_personas
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'sua-empresa');

-- Ativar persona
UPDATE tenant_personas SET is_active = true
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'sua-empresa')
  AND version = 1;
```

### Erro: "Gemini API timeout"

**Causa:** Request muito longo ou API lenta.

**Solução:**
1. Reduzir `maxOutputTokens` no nó Gemini
2. Aumentar timeout do HTTP Request
3. Adicionar retry logic

### IA retorna JSON inválido

**Causa:** Gemini às vezes retorna texto antes/depois do JSON.

**Solução:** Já implementado no nó `7. Parse Resposta IA` com regex `jsonMatch`.

---

## 📈 Métricas e Monitoramento

### Dashboard de Performance

```sql
-- View pronta: vw_tenant_performance
SELECT * FROM vw_tenant_performance
WHERE tenant_slug = 'socialfy';
```

Retorna:
- Total de leads (30d)
- % HOT/WARM/COLD
- Score ICP médio
- Taxa de conversão
- Tempo médio de resposta

### Alertas (opcional)

Criar workflow separado que monitora:

```sql
-- Alertar se score médio cai muito
SELECT
  tenant_id,
  AVG(icp_score) as avg_score_7d
FROM classified_leads
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tenant_id
HAVING AVG(icp_score) < 50;  -- Threshold
```

---

## 🚀 Próximos Passos

1. ✅ Importar workflow no n8n
2. ✅ Configurar credenciais
3. ✅ Executar migration 005 no Supabase
4. ⏳ Testar com dados reais
5. ⏳ Configurar webhook GoHighLevel
6. ⏳ Criar workflows auxiliares:
   - `ghl-send-message` (auto-resposta)
   - `ghl-create-opportunity` (CRM)
   - `ghl-add-to-nurturing` (sequências)
   - `slack-notification` (alertas)

---

## 📝 Notas Importantes

1. **Rate Limiting Instagram:** Max 2-3 scrapes/segundo
2. **Custos Gemini:** ~$0.0001 por classificação (muito barato)
3. **Privacidade:** Dados isolados por tenant (RLS no Supabase)
4. **Escalabilidade:** Suporta 1000+ tenants sem mudança de código
5. **Performance:** <3s por classificação (incluindo scraping)

---

**Autor:** AI Factory V4 - MOTTIVME
**Data:** 31/12/2025
**Versão:** 1.0.0

:::
