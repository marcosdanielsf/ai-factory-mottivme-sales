# 📞 Cold Caller — Stack Open Source

Sistema de ligações automatizadas com IA usando stack 100% open source, substituindo VAPI com economia de **93-97%**.

## Visão Geral

| Item | Detalhe |
|------|---------|
| **Stack** | Pipecat + Deepgram + Groq + Cartesia + Telnyx |
| **Economia** | R$70/mês vs R$3.500 (VAPI) = **97% menor** |
| **Idioma** | PT-BR nativo |
| **Deploy** | Railway |
| **Painel** | Factor AI (`factorai.mottivme.com.br`) |

## Arquitetura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Factor AI  │────▶│   bot.py     │────▶│   Telnyx     │
│   (Painel)   │     │   (Railway)  │     │   (Telefonia) │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                   ┌────────┼────────┐
                   │        │        │
              ┌────▼───┐ ┌──▼───┐ ┌──▼────┐
              │Deepgram│ │ Groq │ │Cartesia│
              │  STT   │ │ LLM  │ │  TTS   │
              └────────┘ └──────┘ └────────┘
```

### Fluxo de uma Ligação

1. **Operador** cria campanha no painel Factor AI
2. **n8n** processa fila (`cold_call_queue`) a cada 5min
3. **bot.py** recebe comando e inicia ligação via Telnyx
4. **Deepgram** transcreve áudio do cliente (STT)
5. **Groq** gera resposta inteligente (LLM)
6. **Cartesia** converte resposta em voz (TTS)
7. **Resultado** salvo no Supabase

## Custos Detalhados

### Por Ligação (3min média)

| Serviço | Função | Custo/min | Total 3min |
|---------|--------|-----------|------------|
| Telnyx | Telefonia | $0.02 | $0.06 |
| Deepgram | STT | $0.0043 | $0.013 |
| Groq | LLM | ~$0.001 | $0.003 |
| Cartesia | TTS | $0.005 | $0.015 |
| **Total** | | **~$0.03/min** | **$0.09** |

### Mensal (100 ligações)

| Item | Custo |
|------|-------|
| Telnyx número | $1/mês |
| Telnyx voz (300min) | $6 |
| Deepgram STT | $0 (free tier $200) |
| Groq LLM | $0 (free tier) |
| Cartesia TTS | $0 (free tier) |
| Railway hosting | $5/mês |
| **TOTAL** | **~$12/mês (~R$70)** |

### Comparação com Alternativas

| Solução | 100 ligações/mês | Economia |
|---------|-------------------|----------|
| VAPI | R$3.500 | — |
| Bland AI | R$1.200 | 65% |
| **Cold Caller (nosso)** | **R$70** | **97%** |

## Tecnologias

### STT — Deepgram
- **Função:** Transcreve áudio em texto (Speech-to-Text)
- **Idioma:** `pt-BR` nativo
- **Latência:** ~300ms
- **Free tier:** $200 em créditos

### LLM — Groq (Llama 3.3 70B)
- **Função:** Gera respostas inteligentes
- **Latência:** ~200ms (ultra-rápido)
- **Free tier:** Generoso

### TTS — Cartesia
- **Função:** Converte texto em voz (Text-to-Speech)
- **Latência:** ~150ms (streaming)
- **Qualidade:** Natural, múltiplas vozes PT-BR

### Telefonia — Telnyx
- **Função:** Faz/recebe ligações reais
- **Protocolo:** SIP + WebSocket
- **Números:** BR (+55) disponíveis
- **Custo:** ~$0.02/min

### Orquestração — Pipecat
- **Função:** Pipeline de áudio em tempo real
- **Open source:** 100%
- **Pipeline:** STT → LLM → TTS (streaming)

## Tabelas Supabase

| Tabela | Função |
|--------|--------|
| `cold_call_campaigns` | Campanhas (nome, status, prompt, horários) |
| `cold_call_prompts` | Prompts por categoria (prospecção, followup, BANT) |
| `cold_call_queue` | Fila de execução (lead, status, resultado) |

### Schema: cold_call_campaigns
```sql
CREATE TABLE cold_call_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  prompt_id INTEGER REFERENCES cold_call_prompts(id),
  target_list JSONB, -- array de contact_ids
  schedule JSONB, -- horários permitidos
  max_concurrent INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema: cold_call_prompts
```sql
CREATE TABLE cold_call_prompts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'prospeccao', -- prospeccao, followup, bant, custom
  system_prompt TEXT NOT NULL,
  variables JSONB, -- variáveis disponíveis
  success_rate DECIMAL(5,2) DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema: cold_call_queue
```sql
CREATE TABLE cold_call_queue (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES cold_call_campaigns(id),
  contact_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, calling, completed, failed, no_answer
  result JSONB, -- transcript, duration, outcome
  attempts INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## Painel de Controle (Factor AI)

### Rotas

| Rota | Página | Função |
|------|--------|--------|
| `/#/cold-calls` | Dashboard | Visão geral + métricas |
| `/#/cold-calls/new` | Nova Ligação | Form manual + status real-time |
| `/#/cold-calls/campaigns` | Campanhas | CRUD + start/stop |
| `/#/cold-calls/prompts` | Prompts | Editor + preview variáveis |

## Configuração

### Variáveis de Ambiente

```env
# STT
DEEPGRAM_API_KEY=xxx

# LLM
GROQ_API_KEY=xxx
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile

# TTS
CARTESIA_API_KEY=xxx

# Telefonia
TELNYX_API_KEY=xxx
TELNYX_SIP_CONNECTION_ID=xxx
TELNYX_PHONE_NUMBER=+5511xxx

# Supabase
SUPABASE_URL=https://bfumywvwubvernvhjehk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# N8N
N8N_WEBHOOK_URL=https://cliente-a1.mentorfy.io/webhook/cold-call-status
```

### Deploy Railway

```bash
cd ~/Projects/mottivme/cold-call-open
railway login
railway init    # nome: cold-call-bot
railway up      # deploy
```

## Workflows n8n

| Workflow | ID | Função |
|----------|----|--------|
| Cold Call Campaign Processor | `LViELhUaRQdEvWea` | Processa fila a cada 5min |

## Status

| Item | Status |
|------|--------|
| bot.py | ✅ Pronto |
| Dockerfile | ✅ Pronto |
| Tabelas Supabase | ✅ Criadas |
| Frontend painel | ✅ Deployado |
| Workflow n8n | ✅ Ativo |
| Deploy Railway | ⏳ Pendente |
| Telnyx configurado | ⏳ Pendente |
| Cartesia configurado | ⏳ Pendente |
| Primeiro teste | ⏳ Pendente |
