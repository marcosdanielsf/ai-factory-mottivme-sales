# Integração Agentes → FUU (Follow Up Universal)

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FONTES DE EVENTOS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SDR Julia        Scheduler       Concierge      Social Seller          │
│      │                │                │               │                 │
│      │                │                │               │                 │
│      ▼                ▼                ▼               ▼                 │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    WEBHOOK /fuu/schedule                      │      │
│   │                                                               │      │
│   │   POST /webhook/fuu-schedule                                  │      │
│   │   {                                                           │      │
│   │     "contact_id": "abc123",                                   │      │
│   │     "location_id": "cd1uyzpJox6XPt4Vct8Y",                   │      │
│   │     "follow_up_type": "sdr_inbound",                         │      │
│   │     "phone": "+5511999999999",                                │      │
│   │     "contact_name": "João Silva",                            │      │
│   │     "context": {                                              │      │
│   │       "ultimo_assunto": "preço do serviço",                  │      │
│   │       "etapa": "qualificacao",                               │      │
│   │       "temperatura": "morno"                                  │      │
│   │     }                                                         │      │
│   │   }                                                           │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                              │                                           │
│                              ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                     SUPABASE FUU                              │      │
│   │                                                               │      │
│   │   fuu_queue ← INSERT via fuu_schedule_followup()             │      │
│   │                                                               │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                              │                                           │
│                              ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │              n8n: Follow Up Eterno (CRON)                     │      │
│   │                                                               │      │
│   │   - Roda a cada 15 min (8h-20h)                              │      │
│   │   - Consulta fuu_next_followups (VIEW)                       │      │
│   │   - Busca cadência por location + tipo                       │      │
│   │   - Envia mensagem via GHL API                               │      │
│   │   - Registra em fuu_execution_log                            │      │
│   │                                                               │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quando cada agente agenda follow-up?

### 1. SDR (Julia Amare)

| Situação | follow_up_type | Quando agenda |
|----------|---------------|---------------|
| Lead inbound não responde | `sdr_inbound` | Após 30min sem resposta |
| Proposta enviada | `sdr_proposal` | Imediatamente após enviar |
| Demo realizada | `sdr_demo` | Após encerrar demo |
| Prospecção cold | `sdr_cold` | Após primeira DM |

**Exemplo no fluxo n8n:**
```javascript
// Após IA responder e lead não interagir em 30min
const payload = {
  contact_id: $json.contact.id,
  location_id: $json.contact.locationId,
  follow_up_type: "sdr_inbound",
  phone: $json.contact.phone,
  contact_name: $json.contact.name,
  context: {
    ultimo_assunto: $json.lastMessage,
    etapa: "qualificacao",
    classificacao: $json.classification // LEAD_HOT, WARM, etc
  }
};

// POST para webhook que insere no FUU
$http.post("https://agenticoskevsacademy-production.up.railway.app/webhook/fuu-schedule", payload);
```

### 2. Scheduler

| Situação | follow_up_type | Quando agenda |
|----------|---------------|---------------|
| Link pagamento enviado | `ops_contract` | Imediatamente |
| Dados incompletos | `ops_document` | Após solicitar dados |

### 3. Concierge (Clínicas)

| Situação | follow_up_type | Quando agenda |
|----------|---------------|---------------|
| Novo paciente | `clinic_welcome` | Após cadastro |
| Consulta amanhã | `clinic_reminder_24h` | Automatico (CRON busca consultas) |
| Consulta em 2h | `clinic_reminder_2h` | Automatico (CRON busca consultas) |
| Faltou consulta | `clinic_noshow` | Após marcar no-show no GHL |
| Pós-procedimento | `clinic_post_procedure` | Após registrar procedimento |

### 4. Social Seller (Prospector Instagram)

| Situação | follow_up_type | Quando agenda |
|----------|---------------|---------------|
| DM enviada sem resposta | `sdr_cold` | Após enviar DM |
| Novo seguidor | `sdr_inbound` | Após DM de boas-vindas |

### 5. Followuper (Reativação)

| Situação | follow_up_type | Quando agenda |
|----------|---------------|---------------|
| Lead esfriou | `sdr_reactivation` | Após 7 dias sem interação |

---

## API Endpoints Necessários

### 1. Agendar Follow-up
```
POST /webhook/fuu-schedule
```

**Request:**
```json
{
  "contact_id": "string (obrigatório)",
  "location_id": "string (obrigatório)",
  "follow_up_type": "string (obrigatório)",
  "phone": "string (opcional)",
  "email": "string (opcional)",
  "contact_name": "string (opcional)",
  "context": {
    "ultimo_assunto": "string",
    "etapa": "string",
    "temperatura": "string",
    "custom_field": "any"
  },
  "scheduled_at": "ISO timestamp (opcional, default NOW())"
}
```

**Response:**
```json
{
  "success": true,
  "queue_id": "uuid",
  "message": "Follow-up agendado com sucesso",
  "scheduled_at": "2026-01-09T15:30:00Z"
}
```

### 2. Cancelar Follow-up (quando lead responde)
```
POST /webhook/fuu-cancel
```

**Request:**
```json
{
  "contact_id": "string (obrigatório)",
  "location_id": "string (obrigatório)",
  "follow_up_type": "string (opcional - se omitido, cancela todos)",
  "reason": "responded | manual_cancel | converted | lost"
}
```

### 3. Marcar como Respondido
```
POST /webhook/fuu-responded
```

**Request:**
```json
{
  "contact_id": "string",
  "location_id": "string"
}
```

---

## Implementação no n8n (Exemplo SDR Julia)

### Nó: "Agendar Follow-up se Lead não Responder"

**Posição:** Após o nó de resposta da IA

**Tipo:** HTTP Request

**Configuração:**
```
Method: POST
URL: https://agenticoskevsacademy-production.up.railway.app/webhook/fuu-schedule
Headers:
  Content-Type: application/json
Body:
{
  "contact_id": "{{ $json.contact.id }}",
  "location_id": "{{ $json.contact.locationId }}",
  "follow_up_type": "sdr_inbound",
  "phone": "{{ $json.contact.phone }}",
  "contact_name": "{{ $json.contact.name || $json.contact.firstName }}",
  "context": {
    "ultimo_assunto": "{{ $json.lastUserMessage }}",
    "etapa": "{{ $json.currentStage }}",
    "classificacao": "{{ $json.classification }}"
  }
}
```

### Nó: "Cancelar Follow-up se Lead Respondeu"

**Posição:** No início do fluxo, após receber mensagem do lead

**Tipo:** Supabase (ou HTTP Request)

**SQL direto:**
```sql
SELECT fuu_mark_responded(
  '{{ $json.contact.id }}',
  '{{ $json.contact.locationId }}'
);
```

---

## Modificações Necessárias

### 1. Backend AgenticOS (Railway)

Criar 3 novos endpoints em `api_server.py`:

```python
@app.post("/webhook/fuu-schedule")
async def fuu_schedule(request: Request):
    data = await request.json()

    # Validação
    required = ['contact_id', 'location_id', 'follow_up_type']
    for field in required:
        if field not in data:
            return {"success": False, "error": f"Campo {field} obrigatório"}

    # Chama função do Supabase
    result = supabase.rpc('fuu_schedule_followup', {
        'p_contact_id': data['contact_id'],
        'p_location_id': data['location_id'],
        'p_follow_up_type': data['follow_up_type'],
        'p_phone': data.get('phone'),
        'p_email': data.get('email'),
        'p_contact_name': data.get('contact_name'),
        'p_context': json.dumps(data.get('context', {})),
        'p_scheduled_at': data.get('scheduled_at')
    }).execute()

    return {
        "success": True,
        "queue_id": result.data,
        "message": "Follow-up agendado"
    }

@app.post("/webhook/fuu-cancel")
async def fuu_cancel(request: Request):
    data = await request.json()

    result = supabase.rpc('fuu_cancel_followup', {
        'p_contact_id': data['contact_id'],
        'p_location_id': data['location_id'],
        'p_follow_up_type': data.get('follow_up_type'),
        'p_reason': data.get('reason', 'manual_cancel')
    }).execute()

    return {
        "success": True,
        "cancelled_count": result.data,
        "message": f"{result.data} follow-ups cancelados"
    }

@app.post("/webhook/fuu-responded")
async def fuu_responded(request: Request):
    data = await request.json()

    result = supabase.rpc('fuu_mark_responded', {
        'p_contact_id': data['contact_id'],
        'p_location_id': data['location_id']
    }).execute()

    return {
        "success": True,
        "marked_count": result.data
    }
```

### 2. Workflow n8n SDR Julia

Adicionar 2 nós:

1. **No início:** Cancelar follow-ups quando lead responde
2. **No final:** Agendar follow-up após IA responder

### 3. Workflow n8n Follow Up Eterno

Migrar de:
- `n8n_schedule_tracking` → `fuu_queue`
- `follow_up_cadencias` → `fuu_cadences`

Query principal muda de buscar `n8n_schedule_tracking` para usar a VIEW `fuu_next_followups`.

---

## Fluxo Completo (Exemplo SDR Inbound)

```
1. Lead manda mensagem no WhatsApp
   │
   ▼
2. GHL dispara webhook para n8n (SDR Julia)
   │
   ▼
3. n8n: Cancelar follow-ups pendentes ← POST /webhook/fuu-responded
   │
   ▼
4. n8n: Classificar lead, buscar contexto, gerar resposta IA
   │
   ▼
5. n8n: Enviar resposta via GHL API
   │
   ▼
6. n8n: Agendar follow-up ← POST /webhook/fuu-schedule
   │                         (só executa se lead não responder em X min)
   │
   ▼
7. [Lead não responde por 35 min]
   │
   ▼
8. n8n Follow Up Eterno (CRON 15min)
   │
   ├─ Consulta VIEW fuu_next_followups
   │
   ├─ Encontra lead com scheduled_at <= NOW()
   │
   ├─ Busca cadência (fuu_cadences) por location + tipo + tentativa
   │
   ├─ Gera mensagem (template ou IA)
   │
   ├─ Envia via GHL API
   │
   ├─ Registra em fuu_execution_log
   │
   └─ Incrementa current_attempt no fuu_queue
   │
   ▼
9. [Se lead responder em qualquer momento]
   │
   └─ Volta para passo 2 (cancela follow-ups automaticamente)
```

---

## Próximos Passos

1. [ ] Criar endpoints no AgenticOS (Railway)
2. [ ] Atualizar fluxo SDR Julia com nós de FUU
3. [ ] Migrar Follow Up Eterno para usar tabelas FUU
4. [ ] Criar cadências default por location
5. [ ] Testar fluxo E2E

---

*Documentação criada em 2026-01-09*
*Projeto: MOTTIVME Sales / Socialfy*
