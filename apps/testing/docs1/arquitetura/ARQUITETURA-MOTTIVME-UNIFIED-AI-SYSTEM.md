# MOTTIVME UNIFIED AI SYSTEM - Arquitetura Completa

## Visao Geral do Projeto

Sistema unificado de IA para vendas B2B que integra:
- **Atendimento automatizado** via WhatsApp, Instagram, LinkedIn e Telefone
- **Prospecao ativa** com agentes autonomos
- **Voice cloning** e **Avatar AI** para abordagens personalizadas
- **RAG/Memoria** para aprendizado continuo
- **Self-improvement** com loops de reflexao e melhoria automatica

---

## 1. INVENTARIO ATUAL

### 1.1 AI Factory V3 - 14 Workflows n8n

| # | Workflow | Trigger | Funcao |
|---|----------|---------|--------|
| **01** | Organizador-Calls | Google Drive /7.Calls/ | Classifica arquivos por prefixo, move para subpastas |
| **02** | AI-Agent-Head-Vendas | Google Drive /1.Vendas/ | Analise BANT/SPIN de calls de diagnostico |
| **02-V2** | AI-Agent-Head-Vendas-V2 | Google Drive /1.Vendas/ | Versao melhorada com mais metricas |
| **03** | Call-Analyzer-Onboarding | Google Drive /2.Onboard/ | Cria agente a partir de call de kickoff |
| **04** | Agent-Factory | Webhook | Fabrica de agentes (criacao automatizada) |
| **05** | AI-Agent-Conversacional | Webhook GHL | Agente conversacional base |
| **05-M** | AI-Agent-Execution-Modular | Webhook GHL | Execucao modular com 7 modos |
| **06** | Call-Analyzer-Revisao | Google Drive /3.Revisao/ | Analisa calls de revisao, atualiza agente |
| **07** | Engenheiro-de-Prompt | Webhook | Ajustes manuais em prompts |
| **08** | Boot-Validator | Schedule 5min | Valida agentes (7-10 cenarios simulados) |
| **09** | QA-Analyst | Schedule 1h | Monitora qualidade das conversas |
| **10** | AI-Factory-V3-Unified | Google Drive | Pipeline unificado completo |
| **10-AA** | AI-Factory-V3-Unified-ANTI-ALUCINACAO | Google Drive | Versao com protecao anti-alucinacao |
| **11** | Reflection-Loop | Webhook | Loop de auto-reflexao e melhoria |
| **12** | AI-as-Judge | Webhook | IA como juiz para avaliar outputs |
| **12-PI** | Prompt-Improver | Webhook | Melhoria automatica de prompts |
| **13** | Prompt-Updater | Webhook | Atualizacao de prompts no Supabase |
| **14** | Multi-Tenant-Inbox-Classifier | Webhook GHL | Classificador de inbox multi-tenant |

#### Arquitetura em Camadas AI Factory

```
CAMADA 1: INGESTAO
├── 01-Organizador-Calls (Google Drive trigger)
└── 14-Multi-Tenant-Inbox-Classifier (GHL webhook)

CAMADA 2: ANALISE DE CALLS
├── 02-AI-Agent-Head-Vendas (BANT/SPIN)
├── 02-V2-AI-Agent-Head-Vendas (metricas expandidas)
├── 03-Call-Analyzer-Onboarding (cria agente)
└── 06-Call-Analyzer-Revisao (atualiza agente)

CAMADA 3: FABRICA DE AGENTES
├── 04-Agent-Factory (criacao automatizada)
├── 07-Engenheiro-de-Prompt (ajustes manuais)
├── 12-Prompt-Improver (melhoria automatica)
└── 13-Prompt-Updater (atualizacao)

CAMADA 4: VALIDACAO
├── 08-Boot-Validator (testa cenarios)
├── 11-Reflection-Loop (auto-reflexao)
└── 12-AI-as-Judge (avaliacao)

CAMADA 5: EXECUCAO
├── 05-AI-Agent-Conversacional (base)
├── 05-AI-Agent-Execution-Modular (7 modos)
└── 10-AI-Factory-V3-Unified (pipeline completo)

CAMADA 6: QA
└── 09-QA-Analyst (monitora qualidade)
```

#### 7 Modos do Agent Execution Modular

| Modo | Descricao |
|------|-----------|
| first_contact | Primeiro contato com lead |
| scheduler | Agendamento de reuniao |
| rescheduler | Reagendamento |
| concierge | Atendimento geral |
| customer_success | Pos-venda |
| objection_handler | Tratamento de objecoes |
| followuper | Follow-up automatico |

---

### 1.2 AgenticOSKevsAcademy - 23 Agentes Python

| Squad | Agentes | Funcao |
|-------|---------|--------|
| **OUTBOUND** (5) | LeadDiscovery, ProfileAnalyzer, LeadQualifier, MessageComposer, OutreachExecutor | Prospeccao ativa Instagram |
| **INBOUND** (3) | InboxMonitor, LeadClassifier, AutoResponder | Responder DMs automaticamente |
| **INFRASTRUCTURE** (3) | AccountManager, Analytics, ErrorHandler | Suporte e monitoramento |
| **SECURITY** (4) | RateLimitGuard, SessionSecurity, AntiDetection, Compliance | Protecao anti-ban |
| **PERFORMANCE** (4) | CacheManager, BatchProcessor, QueueManager, LoadBalancer | Otimizacao |
| **QUALITY** (4) | DataValidator, MessageQuality, Deduplication, AuditLogger | QA |

**Stack:** Python + Playwright + Gemini Vision + Supabase + Redis + FastAPI

---

### 1.3 socialfy-platform - Frontend CRM

| Tabela Supabase | Descricao |
|-----------------|-----------|
| socialfy_leads | Leads multicanal (LI, IG, WA, Email) |
| socialfy_campaigns | Campanhas multi-channel |
| socialfy_cadences | Sequencias de follow-up |
| socialfy_messages | Inbox unificado |
| socialfy_activities | Log de touchpoints |
| socialfy_pipeline_deals | Pipeline de vendas |

**Stack:** React 19 + Vite + Tailwind + Supabase + Vercel

---

### 1.4 Infraestrutura Existente

| Componente | Funcao | Status |
|------------|--------|--------|
| **GHL (GoHighLevel)** | CRM, Calendar, Email, Pipeline | ✅ Producao |
| **Evolution API** | WhatsApp integration | ✅ Producao |
| **Supabase** | PostgreSQL + Edge Functions | ✅ Producao |
| **Groq (Llama 3.3 70B)** | LLM principal | ✅ Producao |
| **Anthropic (Claude)** | Validacao e QA | ✅ Producao |
| **Google Drive** | Storage de calls | ✅ Producao |

---

## 2. GAPS IDENTIFICADOS

### 2.1 Gaps Tecnicos

| # | Gap | Problema | Solucao | Fonte |
|---|-----|----------|---------|-------|
| 1 | **Canal de VOZ** | AI Factory so atende texto (WhatsApp) | call-center-ai + LLM-VoIP-Caller | Fork GitHub |
| 2 | **RAG/Memoria** | Cada analise eh "zerada", nao aprende | LlamaIndex sobre call_recordings | Fork GitHub |
| 3 | **Whisper Local** | Transcricao depende de API externa ($) | faster-whisper self-hosted | Ecossistema llm.c |
| 4 | **Voice Cloning** | Nao tem audio personalizado | Chatterbox (MIT license) | Open source |
| 5 | **Avatar Video** | Nao tem video personalizado | Duix.Avatar (open source) | Open source |
| 6 | **LinkedIn Outbound** | Nao tem prospeccao LinkedIn | LinkedIn-Lead-Generator | Fork GitHub |

### 2.2 Repositorios GitHub Disponiveis (Forks)

| Repo | Categoria | Para que serve |
|------|-----------|----------------|
| llama_index | RAG | Indexacao e busca sobre historico |
| call-center-ai | VoIP | Atendimento por voz |
| LLM-VoIP-Caller | VoIP | Ligacoes outbound automaticas |
| Scrapegraph-ai | Scraping | Enriquecimento de leads |
| LinkedIn-Lead-Generator | Lead Gen | Prospeccao LinkedIn |
| faster-whisper | Transcricao | Whisper local (GPU) |
| supabase-py | Database | Cliente Python Supabase |

---

## 3. ARQUITETURA UNIFICADA PROPOSTA

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         MOTTIVME UNIFIED AI SYSTEM                                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                            LAYER 1: FRONTEND                                    ││
│  │  ┌─────────────────────┐         ┌─────────────────────┐                        ││
│  │  │  socialfy-platform  │         │  GHL (CRM Oficial)  │                        ││
│  │  │  Dashboard/Analytics│         │  Calendar/Pipeline  │                        ││
│  │  └──────────┬──────────┘         └──────────┬──────────┘                        ││
│  └─────────────┼────────────────────────────────┼──────────────────────────────────┘│
│                │                                │                                    │
│  ┌─────────────┼────────────────────────────────┼──────────────────────────────────┐│
│  │             ▼           LAYER 2: DATABASE    ▼                                  ││
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   ││
│  │  │                           SUPABASE                                        │   ││
│  │  │                                                                           │   ││
│  │  │  EXISTENTES:                          NOVOS:                              │   ││
│  │  │  ├── agent_versions                   ├── client_voice_models             │   ││
│  │  │  ├── agent_conversations              ├── client_avatars                  │   ││
│  │  │  ├── agent_conversation_messages      ├── rag_index                       │   ││
│  │  │  ├── call_recordings                  ├── generated_media                 │   ││
│  │  │  ├── qa_analyses                      └── voice_call_logs                 │   ││
│  │  │  ├── clients                                                              │   ││
│  │  │  ├── locations                                                            │   ││
│  │  │  └── socialfy_* (leads, campaigns, etc)                                   │   ││
│  │  └──────────────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                      LAYER 3: ORCHESTRATION (n8n)                               ││
│  │                                                                                  ││
│  │  AI FACTORY V3 - 14 WORKFLOWS EXISTENTES                                        ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    ││
│  │  │ 01-Organizador │ 02-Head-Vendas │ 03-Onboarding │ 04-Agent-Factory     │    ││
│  │  │ 05-Execution   │ 06-Revisao     │ 07-Eng-Prompt │ 08-Boot-Validator    │    ││
│  │  │ 09-QA-Analyst  │ 10-Unified     │ 11-Reflection │ 12-AI-as-Judge       │    ││
│  │  │ 12-Prompt-Imp  │ 13-Prompt-Upd  │ 14-Inbox-Class│                      │    ││
│  │  └─────────────────────────────────────────────────────────────────────────┘    ││
│  │                                                                                  ││
│  │  NOVOS WORKFLOWS                                                                 ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    ││
│  │  │ 15-Voice-Generator    │ Gera audio com voz clonada do cliente          │    ││
│  │  │ 16-Avatar-Generator   │ Gera video com avatar do cliente               │    ││
│  │  │ 17-RAG-Query          │ Busca contexto em historico de calls           │    ││
│  │  │ 18-Whisper-Local      │ Transcricao local de calls                     │    ││
│  │  │ 19-VoIP-Handler       │ Atendimento/outbound por telefone              │    ││
│  │  │ 20-LinkedIn-Orchestr  │ Orquestra prospeccao LinkedIn                  │    ││
│  │  └─────────────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                      LAYER 4: AI ENGINES (Self-Hosted)                          ││
│  │                                                                                  ││
│  │  EXISTENTES:                              NOVOS:                                 ││
│  │  ┌───────────────┐ ┌───────────────┐     ┌───────────────┐ ┌───────────────┐    ││
│  │  │  Groq API     │ │  Claude API   │     │  Chatterbox   │ │ Duix.Avatar   │    ││
│  │  │  Llama 3.3    │ │  Sonnet       │     │  Voice Clone  │ │ Video Avatar  │    ││
│  │  └───────────────┘ └───────────────┘     └───────────────┘ └───────────────┘    ││
│  │                                                                                  ││
│  │                                          ┌───────────────┐ ┌───────────────┐    ││
│  │                                          │  LlamaIndex   │ │faster-whisper │    ││
│  │                                          │  RAG Engine   │ │ Transcricao   │    ││
│  │                                          └───────────────┘ └───────────────┘    ││
│  │                                                                                  ││
│  │                                          ┌───────────────┐                      ││
│  │                                          │ call-center-ai│                      ││
│  │                                          │ VoIP Handler  │                      ││
│  │                                          └───────────────┘                      ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                      LAYER 5: OUTBOUND AGENTS (Python)                          ││
│  │                                                                                  ││
│  │  AgenticOSKevsAcademy - 23 AGENTES EXISTENTES                                   ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    ││
│  │  │ OUTBOUND (5): LeadDiscovery, ProfileAnalyzer, LeadQualifier,            │    ││
│  │  │               MessageComposer, OutreachExecutor                          │    ││
│  │  │ INBOUND (3):  InboxMonitor, LeadClassifier, AutoResponder               │    ││
│  │  │ INFRA (3):    AccountManager, Analytics, ErrorHandler                   │    ││
│  │  │ SECURITY (4): RateLimitGuard, SessionSecurity, AntiDetection, Compliance│    ││
│  │  │ PERF (4):     CacheManager, BatchProcessor, QueueManager, LoadBalancer  │    ││
│  │  │ QUALITY (4):  DataValidator, MessageQuality, Deduplication, AuditLogger │    ││
│  │  └─────────────────────────────────────────────────────────────────────────┘    ││
│  │                                                                                  ││
│  │  NOVO: LinkedIn Squad                                                            ││
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    ││
│  │  │ LinkedInDiscovery, LinkedInProfiler, LinkedInConnector, LinkedInDM      │    ││
│  │  └─────────────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                        LAYER 6: CHANNELS                                        ││
│  │                                                                                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │ WhatsApp │ │Instagram │ │ LinkedIn │ │  Email   │ │  VoIP    │ │ Telefone │  ││
│  │  │ Evolution│ │AgenticOS │ │  (NOVO)  │ │   GHL    │ │ (NOVO)   │ │   GHL    │  ││
│  │  │    ✅    │ │    ✅    │ │    ❌    │ │    ✅    │ │    ❌    │ │    ✅    │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. NOVAS TABELAS SUPABASE

```sql
-- Modelos de voz clonada por cliente
CREATE TABLE client_voice_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  model_path TEXT NOT NULL,
  sample_audio_url TEXT,
  language VARCHAR(10) DEFAULT 'pt-BR',
  quality_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatares de video por cliente
CREATE TABLE client_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  avatar_model_path TEXT NOT NULL,
  source_video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index RAG para busca semantica
CREATE TABLE rag_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  source_type VARCHAR(50), -- 'call_recording', 'conversation', 'document'
  source_id UUID,
  content TEXT,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache de midias geradas (audio/video)
CREATE TABLE generated_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID,
  media_type VARCHAR(20), -- 'audio', 'video'
  script_hash VARCHAR(64),
  media_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de chamadas VoIP
CREATE TABLE voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID,
  direction VARCHAR(20), -- 'inbound', 'outbound'
  phone_number VARCHAR(50),
  duration_seconds INTEGER,
  transcription TEXT,
  sentiment_score DECIMAL(3,2),
  outcome VARCHAR(50),
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. ROADMAP DE IMPLEMENTACAO

### FASE 0: Integracao Sistemas Existentes (1-2 semanas)

| Tarefa | Origem | Destino | Resultado |
|--------|--------|---------|-----------|
| Conectar AgenticOS ao Supabase AI Factory | Python | Supabase | Leads enriquecidos disponiveis |
| ProfileAnalyzer → Custom Fields GHL | AgenticOS | GHL | Hyperpersonalization com dados reais |
| Quality Squad → 09-QA-Analyst | AgenticOS | n8n | QA expandido com sentiment |

### FASE 1: Whisper Local (1 semana)

| Tarefa | Ferramenta | Impacto |
|--------|------------|---------|
| Deploy faster-whisper | Docker + GPU | Transcricao $0, 10x mais rapido |
| Criar 18-Whisper-Local workflow | n8n | Processamento local de calls |
| Integrar com 03-Onboarding | n8n | Calls processadas localmente |

### FASE 2: RAG/Memoria (2 semanas)

| Tarefa | Ferramenta | Impacto |
|--------|------------|---------|
| Deploy LlamaIndex | Python + Supabase pgvector | Aprende com historico |
| Indexar call_recordings | Vector embeddings | Busca semantica |
| Criar 17-RAG-Query workflow | n8n | Contexto em todas as analises |
| Integrar com 02-Head-Vendas | n8n | Compara com calls similares |
| Integrar com 08-Boot-Validator | n8n | Cenarios de teste REAIS |

### FASE 3: Canal de VOZ (3 semanas)

| Tarefa | Ferramenta | Impacto |
|--------|------------|---------|
| Deploy call-center-ai | Docker | Atendimento por ligacao |
| Criar 19-VoIP-Handler workflow | n8n | Orquestracao de chamadas |
| Novo modo voice_agent no 05-Execution | n8n | Multicanal texto+voz |
| Integrar LLM-VoIP-Caller | Python | Follow-up por ligacao automatica |

### FASE 4: Voice Clone + Avatar (3 semanas)

| Tarefa | Ferramenta | Impacto |
|--------|------------|---------|
| Deploy Chatterbox | Docker + GPU | Audio com voz do cliente |
| Deploy Duix.Avatar | Docker + GPU | Video avatar personalizado |
| Criar 15-Voice-Generator workflow | n8n | Geracao de audio automatica |
| Criar 16-Avatar-Generator workflow | n8n | Geracao de video automatica |
| Integrar com 05-Execution (first_contact) | n8n | Video avatar no primeiro contato |
| Integrar com 05-Execution (followuper) | n8n | Audio clone no follow-up |

### FASE 5: LinkedIn Outbound (2 semanas)

| Tarefa | Ferramenta | Impacto |
|--------|------------|---------|
| Adaptar LinkedIn-Lead-Generator | Python | Novo canal de prospeccao |
| Criar LinkedIn Squad no AgenticOS | Python | 4 novos agentes |
| Criar 20-LinkedIn-Orchestrator workflow | n8n | Orquestracao LinkedIn |
| Integrar com socialfy_leads | Supabase | Leads unificados |

---

## 6. RESULTADO FINAL ESPERADO

### Canais Operacionais

| Canal | Entrada | Atendimento | Outreach | Avatar/Voz |
|-------|---------|-------------|----------|------------|
| **WhatsApp** | ✅ | ✅ AI Agent | ✅ Follow-up | ✅ Audio clone |
| **Instagram** | ✅ | ✅ AgenticOS | ✅ DM auto | ✅ Audio clone |
| **LinkedIn** | ✅ | - | ✅ DM auto | ❌ (nao suporta) |
| **Telefone/VoIP** | ✅ | ✅ AI Voice | ✅ Ligacao auto | ✅ Voz clone |
| **Email** | ✅ GHL | ✅ GHL | ✅ GHL | ❌ |

### Metricas de Impacto Estimadas

| Metrica | Atual | Com Sistema Completo |
|---------|-------|----------------------|
| Taxa resposta DM texto | 2-5% | - |
| Taxa resposta DM + audio clone | - | 25-40% |
| Taxa resposta DM + video avatar | - | 40-60% |
| Tempo transcricao call 1h | ~$3.60 (API) | $0 (local) |
| Contexto historico em analises | 0% | 100% (RAG) |
| Canais ativos | 3 (WA, IG, Email) | 5 (+LinkedIn, VoIP) |

---

## 7. REQUISITOS DE INFRAESTRUTURA

### Hardware para AI Engines (Self-Hosted)

| Componente | Minimo | Recomendado |
|------------|--------|-------------|
| **GPU** | RTX 3060 12GB | RTX 4080 16GB |
| **RAM** | 32GB | 64GB |
| **Storage** | SSD 500GB | NVMe 1TB |
| **CPU** | 8 cores | 16 cores |

### Alternativa Cloud

| Provedor | Custo Estimado | Uso |
|----------|----------------|-----|
| RunPod | ~$0.50/hora GPU | Chatterbox, Duix |
| Vast.ai | ~$0.30/hora GPU | faster-whisper |
| Modal | Pay-per-use | LlamaIndex |

---

## 8. STACK TECNOLOGICO COMPLETO

### Backend/Orquestracao
- **n8n** - Workflow automation (20 workflows)
- **Python** - Agentes autonomos (27+ agentes)
- **FastAPI** - APIs internas
- **Redis** - Message queue e cache

### AI/ML
- **Groq (Llama 3.3 70B)** - LLM principal
- **Anthropic (Claude)** - Validacao e QA
- **Chatterbox** - Voice cloning
- **Duix.Avatar** - Video avatar
- **LlamaIndex** - RAG engine
- **faster-whisper** - Transcricao local
- **Gemini Vision** - Analise de perfis

### Database
- **Supabase (PostgreSQL)** - Database principal
- **pgvector** - Vector embeddings para RAG

### Integ racoes
- **GHL (GoHighLevel)** - CRM, Calendar, Email
- **Evolution API** - WhatsApp
- **Playwright** - Instagram automation
- **call-center-ai** - VoIP

### Frontend
- **React 19 + Vite** - socialfy-platform
- **Tailwind CSS** - Styling
- **Vercel** - Hosting

---

## 9. PROXIMOS PASSOS

1. [ ] Validar arquitetura com stakeholders
2. [ ] Priorizar FASE 0 (integracao sistemas existentes)
3. [ ] Setup ambiente de desenvolvimento para novos componentes
4. [ ] Criar POC de voice cloning com Chatterbox
5. [ ] Documentar APIs internas

---

*Documento gerado em: 2026-01-02*
*Versao: 1.0*
*Projeto: MOTTIVME UNIFIED AI SYSTEM*
