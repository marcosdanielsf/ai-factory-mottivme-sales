# Pipeline de Voz

## Fluxo de Áudio

```
Telefone (PSTN 8kHz)
    │
    ▼
┌─────────────────────┐
│  Telnyx/Twilio SIP   │
│  WebSocket Stream     │
└──────────┬──────────┘
           │ μ-law → PCM
           ▼
┌─────────────────────┐
│  Deepgram STT        │
│  Nova-3 (PT-BR)      │
│  endpointing: 500ms  │
└──────────┬──────────┘
           │ texto
           ▼
┌─────────────────────┐
│  SmartTurn V3        │
│  stop: 2.5s          │
│  pre_speech: 500ms   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  OpenAI gpt-4o-mini  │
│  + GHL Function Call  │
│  (6 tools)           │
└──────────┬──────────┘
           │ texto resposta
           ▼
┌─────────────────────┐
│  Cartesia TTS        │
│  Sonic-3 (Luana)     │
│  + flush_audio fix   │
└──────────┬──────────┘
           │ PCM → μ-law
           ▼
┌─────────────────────┐
│  Telnyx/Twilio SIP   │
│  WebSocket Stream     │
└──────────┬──────────┘
           │
           ▼
     Telefone Lead
```

## Supabase Schema

### cold_call_logs
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| call_id | text | ID da chamada (Twilio/Telnyx) |
| phone | text | Telefone do lead |
| lead_name | text | Nome do lead |
| status | text | completed, failed, etc |
| outcome | text | agendou, interessado, nao_atendeu, recusou |
| duration_seconds | numeric(10,2) | Duração em segundos |
| transcript | text | Transcrição completa |
| cost_usd | numeric(8,4) | Custo total USD |
| cost_breakdown | jsonb | Breakdown por componente |
| started_at | timestamptz | Início da chamada |

### cold_call_retry_queue
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| phone | text | Telefone |
| attempt_number | int | Tentativa atual |
| max_attempts | int | Máximo configurável (1-6) |
| next_retry_at | timestamptz | Próximo retry (business hours) |
| status | text | pending, paused, calling, completed, cancelled |

### Custos por Chamada (~$0.04/min)
| Componente | Custo/min | % Total |
|-----------|-----------|---------|
| Telephony | $0.045 | 56% |
| TTS | $0.018 | 22% |
| STT | $0.005 | 6% |
| LLM | $0.002 | 3% |

## Endpoints API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /health | Health check |
| GET | /costs/summary?days=30 | Custos agregados |
| GET | /calls/active | Chamadas ativas |
| GET | /retry/queue | Fila de retries |
| POST | /retry/now | Retry imediato |
| POST | /retry/cancel | Cancelar retry |
| POST | /retry/settings | Toggle auto-retry + max_attempts |
| POST | /retry/process | Processar fila (cron) |
| POST | /outbound-call | Iniciar chamada |
