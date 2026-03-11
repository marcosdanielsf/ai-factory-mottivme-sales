# Socialfy - N8N Workflows Documentation

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                    socialfy-platform.vercel.app                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Database   │  │   Realtime   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Edge Functions                        │          │
│  │  • generate-message (Claude AI)                   │          │
│  │  • qualify-lead (ICP Scoring)                     │          │
│  │  • process-cadence (Step execution)               │          │
│  │  • start-cadence (Enrollment)                     │          │
│  │  • webhook-handler (External events)              │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Webhooks
┌─────────────────────────────────────────────────────────────────┐
│                          N8N                                     │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Automation Workflows                  │          │
│  │  • Cadence Executor (Scheduler)                   │          │
│  │  • LinkedIn Automation                            │          │
│  │  • Instagram DM Automation                        │          │
│  │  • WhatsApp Automation                            │          │
│  │  • Email Sender                                   │          │
│  │  • Show Rate Guard                                │          │
│  │  • Lead Enrichment                                │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  LinkedIn API │ Instagram API │ WhatsApp API │ Email SMTP       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflows N8N

### 1. Cadence Executor (Scheduler)

**Trigger:** Cron (a cada 5 minutos)

**Fluxo:**
```
[Cron Trigger] → [HTTP Request: get_due_cadence_leads] → [Loop: For Each Lead]
                                                                    │
    ┌───────────────────────────────────────────────────────────────┘
    ▼
[HTTP Request: process-cadence] → [Switch: channel]
    │
    ├── linkedin → [LinkedIn Workflow]
    ├── instagram → [Instagram Workflow]
    ├── whatsapp → [WhatsApp Workflow]
    ├── email → [Email Workflow]
    └── phone → [Phone Workflow (log only)]
```

**Configuração N8N:**
```json
{
  "name": "Socialfy - Cadence Executor",
  "nodes": [
    {
      "name": "Cron",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{ "field": "minutes", "minutesInterval": 5 }]
        }
      }
    },
    {
      "name": "Get Due Leads",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$env.SUPABASE_URL}}/rest/v1/rpc/get_due_cadence_leads",
        "method": "POST",
        "headers": {
          "apikey": "={{$env.SUPABASE_ANON_KEY}}",
          "Authorization": "Bearer ={{$env.SUPABASE_SERVICE_KEY}}"
        },
        "body": { "p_limit": 50 }
      }
    },
    {
      "name": "Process Each Lead",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": { "batchSize": 1 }
    }
  ]
}
```

---

### 2. LinkedIn Automation Workflow

**Trigger:** Webhook do Supabase (cadence_step com channel=linkedin)

**Ações Suportadas:**
- `connection_request`: Enviar convite de conexão
- `message`: Enviar mensagem direta
- `profile_view`: Visualizar perfil
- `post_like`: Curtir post
- `post_comment`: Comentar em post

**Fluxo:**
```
[Webhook Trigger] → [Switch: action]
    │
    ├── connection_request
    │   └── [Generate Message] → [LinkedIn: Send Connection] → [Log Result]
    │
    ├── message
    │   └── [Check Connection] → [Generate Message] → [LinkedIn: Send Message] → [Log Result]
    │
    ├── profile_view
    │   └── [LinkedIn: View Profile] → [Log Result]
    │
    └── post_like/comment
        └── [Get Recent Posts] → [LinkedIn: Engage] → [Log Result]
```

**Nodes Recomendados:**
- **LinkedIn Node** (n8n-nodes-base.linkedIn) - para API oficial
- **HTTP Request** - para automação via browserless/Puppeteer

**Rate Limits:**
- Connection requests: 100/semana
- Messages: 150/dia
- Profile views: 500/dia

---

### 3. Instagram DM Automation Workflow

**Trigger:** Webhook do Supabase (cadence_step com channel=instagram)

**Ações Suportadas:**
- `dm`: Enviar DM
- `follow`: Seguir perfil
- `story_reply`: Responder story
- `post_like`: Curtir post
- `post_comment`: Comentar

**Fluxo:**
```
[Webhook Trigger] → [Check Rate Limit] → [Switch: action]
    │
    ├── dm
    │   └── [Generate Message] → [Instagram API: Send DM] → [Update Account Usage] → [Log Result]
    │
    ├── follow
    │   └── [Instagram API: Follow] → [Update Account Usage] → [Log Result]
    │
    └── story_reply
        └── [Get Active Stories] → [Generate Reply] → [Instagram API: Reply] → [Log Result]
```

**Integração:**
- Instagram Graph API (para business accounts)
- Instagram Basic Display API (para personal accounts)

**Rate Limits:**
- DMs: 100/dia
- Follows: 200/dia
- Story replies: 50/dia

---

### 4. WhatsApp Automation Workflow

**Trigger:** Webhook do Supabase (cadence_step com channel=whatsapp)

**Opções de Integração:**
1. **WhatsApp Business API** (oficial)
2. **Evolution API** (self-hosted)
3. **Twilio** (cloud)

**Fluxo:**
```
[Webhook Trigger] → [Validate Phone] → [Check Rate Limit]
    │
    ├── [Generate Message via Claude]
    │
    └── [Send via WhatsApp Provider]
        │
        ├── [Success] → [Update Message Status] → [Log Activity]
        │
        └── [Failure] → [Retry Queue] → [Alert]
```

**Templates de Mensagem:**
```json
{
  "connection": {
    "template": "Olá {{name}}! Vi seu perfil e achei interessante conversar sobre {{topic}}. Podemos trocar uma ideia?",
    "max_chars": 300
  },
  "follow_up": {
    "template": "{{name}}, tudo bem? Só passando para ver se conseguiu dar uma olhada na minha mensagem anterior.",
    "max_chars": 200
  },
  "meeting_request": {
    "template": "{{name}}, que tal agendarmos uma call rápida de 15min? Tenho algumas ideias que podem te interessar.",
    "max_chars": 250
  }
}
```

---

### 5. Email Sender Workflow

**Trigger:** Webhook do Supabase (cadence_step com channel=email)

**Fluxo:**
```
[Webhook Trigger] → [Get Lead Email] → [Generate Email via Claude]
    │
    └── [SMTP/SendGrid/Mailgun: Send Email]
        │
        ├── [Success] → [Create Message Record] → [Track Opens/Clicks]
        │
        └── [Bounce] → [Mark Lead as Bounced] → [Remove from Cadence]
```

**Tracking:**
- Open tracking via pixel
- Click tracking via redirect
- Bounce handling via webhook

---

### 6. Show Rate Guard Workflow

**Objetivo:** Confirmar presença em reuniões agendadas

**Trigger:** Cron (24h e 1h antes da reunião)

**Fluxo:**
```
[Cron: Check Upcoming Meetings] → [Get Scheduled Deals]
    │
    └── [For Each Deal]
        │
        ├── [24h Before]
        │   └── [Send Confirmation Request via Email + WhatsApp]
        │
        └── [1h Before]
            └── [Send Reminder via WhatsApp + SMS]
```

**Status de Confirmação:**
- `pending`: Aguardando resposta
- `confirmed`: Confirmado
- `rescheduled`: Reagendado
- `cancelled`: Cancelado
- `no_show`: Não compareceu

---

### 7. Lead Enrichment Workflow

**Trigger:** Novo lead criado (Database Trigger)

**Fontes de Enriquecimento:**
- LinkedIn (dados do perfil)
- CNPJ (dados da empresa - ReceitaWS)
- Email validation (Neverbounce/ZeroBounce)

**Fluxo:**
```
[Database Trigger: New Lead] → [Check Available Data]
    │
    ├── [Has LinkedIn URL]
    │   └── [Scrape LinkedIn Profile] → [Extract Data]
    │
    ├── [Has CNPJ]
    │   └── [ReceitaWS API] → [Get Company Data]
    │
    └── [Has Email]
        └── [Validate Email] → [Check Deliverability]
    │
    └── [Merge Data] → [Calculate ICP Score] → [Update Lead]
```

---

### 8. Inbound Response Handler

**Trigger:** Webhook do provedor (LinkedIn/Instagram/WhatsApp/Email)

**Fluxo:**
```
[Webhook: New Message] → [Identify Lead] → [Create Message Record]
    │
    └── [Update Lead Status: Responding]
        │
        └── [Pause Cadence] → [Notify SDR] → [AI Classification]
            │
            ├── [Positive Intent] → [Move to Pipeline]
            │
            ├── [Question] → [Queue for AI Response]
            │
            └── [Negative] → [Mark as Lost]
```

---

## Variáveis de Ambiente N8N

```env
# Supabase
SUPABASE_URL=https://bfumywvwubvernvhjehk.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=your_claude_api_key

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Instagram
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# WhatsApp (Evolution API)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
```

---

## Webhooks Endpoints

### De N8N para Supabase:
```
POST /functions/v1/webhook-handler
Headers:
  - Content-Type: application/json
  - x-webhook-secret: {{WEBHOOK_SECRET}}

Body:
{
  "source": "linkedin|instagram|whatsapp|email|n8n",
  "event": "event_type",
  "data": { ... }
}
```

### De Supabase para N8N:
```
N8N Webhook URL: https://your-n8n.com/webhook/socialfy

Events:
- cadence_step: Nova ação de cadence para executar
- lead_created: Novo lead para enriquecer
- meeting_scheduled: Nova reunião para Show Rate Guard
```

---

## Cronograma de Execução

| Workflow | Frequência | Horário |
|----------|------------|---------|
| Cadence Executor | 5 min | 24/7 |
| Show Rate Guard (24h) | Diário | 09:00 |
| Show Rate Guard (1h) | A cada hora | 24/7 |
| Daily Usage Reset | Diário | 00:00 |
| Lead Enrichment | On demand | Trigger |

---

## Métricas e Monitoramento

### KPIs por Workflow:
- **Cadence Executor**: Steps processados/hora, Taxa de sucesso
- **LinkedIn**: Conexões enviadas/aceitas, Messages delivered
- **Instagram**: DMs enviados/respondidos, Follows/Followbacks
- **WhatsApp**: Messages sent/delivered/read
- **Email**: Sent/Opened/Clicked/Bounced
- **Show Rate Guard**: Confirmações/No-shows

### Alertas:
- Rate limit atingido (qualquer canal)
- Erro em mais de 10% das execuções
- Fila de processamento > 100 leads
- Account desconectada
