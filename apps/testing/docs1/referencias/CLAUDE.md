# MOTTIVME ECOSYSTEM - Master Context

> **Missão**: Parceiros só precisam VENDER. A Mottivme cuida do resto.
> **Modelo**: High Ticket as a Service com hiperpersonalização via IA.

---

## Visão Geral do Ecossistema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FACTORY AI (Core)                                     │
│              Hiperpersonalização + IA = Execução Premium                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   GERAR DEMANDA          │   CONVERTER              │   ENTREGAR/ESCALAR       │
│   (Marketing)            │   (Vendas)               │   (Operações)            │
│   ─────────────          │   ─────────              │   ────────────────       │
│   Assembly Line          │   Growth OS              │   BPO Financeiro IA      │
│   (16 agentes IA)        │   Socialfy Platform      │   MIS Sentinel           │
│   [EM DÉFICIT]           │   SDR Julia/Isabella     │   Donna/Wendy            │
│                          │   Follow Up Eterno       │   Command Center         │
│                          │   Secretária Base        │   Invoice Generator      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Monorepo

```
/Users/marcosdaniels/Projects/mottivme/
│
├── _docs/                      # Documentação estratégica
│   ├── ARQUITETURA-ECOSSISTEMA-MOTTIVME.md
│   ├── CREDENCIAIS-MASTER.md
│   ├── PLANEJAMENTO-ESTRATEGICO.md
│   └── PLANO-90-DIAS-100K-MRR.md
│
├── AgenticOSKevsAcademy/       # Backend Python (Railway)
│   ├── implementation/         # APIs, skills, agents
│   ├── agents/                 # Definições de agentes
│   ├── GROWTH_OS_ARCHITECTURE_PLAN.md
│   └── CLAUDE.md
│
├── ai-factory-backend/         # APIs centrais (FastAPI)
│   ├── dashboard/
│   └── CLAUDE.md
│
├── ai-factory-agents/          # Criação de agentes + templates
│   ├── agents/
│   ├── prompts/
│   ├── [ GHL ] Follow Up Eterno - V6 Multi-Channel.json
│   └── CLAUDE.md
│
├── ai-factory-mottivme-sales/  # Workflows n8n organizados
│   └── workflows/
│       ├── core/               # 01-13 workflows principais
│       ├── ghl/                # Integrações GoHighLevel
│       ├── clients/            # Por cliente (julia-amare, etc)
│       ├── secretaria-base/    # Template secretária
│       └── bpo-financeiro/     # Módulo financeiro
│
├── saas/                       # Produtos SaaS
│   ├── assembly-line/          # Marketing AI (16 agentes)
│   ├── command-center/         # Hub operações
│   ├── dashboard-sales/        # Métricas vendas
│   ├── invoice-generator/      # Gerador faturas
│   └── sales-calculator/       # Calculadora preços
│
├── socialfy-platform/          # CRM Prospecção (React)
├── donna-wendy/                # Chatbot interno
├── MIS-Sentinel/               # Monitoramento
├── financeiro-mottivme-sales/  # BPO Financeiro
├── mottivme-infra/             # Docker (n8n + Postgres + Redis)
│
├── scripts/                    # Scripts Python
│   └── instagram/              # Scraping Instagram
│
├── prompts/                    # Prompts centralizados
└── front-factorai-mottivme-sales/  # Dashboard Gemini
```

---

## Componentes Principais

### Factory AI

O core do sistema. Orquestra IA (Claude, Gemini, GPT) via LangChain para hiperpersonalização.

| Componente | Função | Deploy |
|------------|--------|--------|
| `ai-factory-backend` | APIs Python | Railway |
| `ai-factory-agents` | Templates + Scripts | Local |
| `ai-factory-mottivme-sales` | Workflows n8n | Mentorfy |
| `front-factorai` | Dashboard | Vercel |

### Growth OS

Framework de vendas white-label baseado em:
- **Charlie Morgan**: Vagueness, brevidade, reverse disqualification
- **JP Middleton**: Qualificação BANT
- **Dean Jackson**: 9-word reactivation

Localização: `AgenticOSKevsAcademy/GROWTH_OS_ARCHITECTURE_PLAN.md`

### Assembly Line (PRIORIDADE)

16 agentes IA para marketing - área em déficit de execução.

Localização: `saas/assembly-line/`

---

## Infraestrutura

| Serviço | URL/Config | Função |
|---------|------------|--------|
| **Railway** | agenticoskevsacademy-production.up.railway.app | Backend APIs |
| **Supabase** | bfumywvwubvernvhjehk.supabase.co | Banco + pgvector |
| **n8n** | cliente-a1.mentorfy.io | Orquestração workflows |
| **GHL** | Múltiplas locations | CRM |
| **Vercel** | Vários deploys | Frontends |
| **Docs** | docs-jet-delta.vercel.app | Documentação |

---

## RAG / Segundo Cérebro

Sistema de memória persistente com embeddings OpenAI + pgvector.

**Endpoints:**
- `POST /webhook/rag-ingest` - Adicionar conhecimento
- `POST /webhook/rag-search` - Buscar conhecimento
- `GET /webhook/rag-categories` - Listar categorias

**Project Key:** `mottivme-ecosystem`

**Conhecimentos armazenados (11/01/2026):**
- Visão Geral do Ecossistema
- Arquitetura Factory AI
- Estrutura de Pastas
- Growth OS Framework
- SaaS Products
- Modelo de Parceiros
- Scripts de Prospecção
- Operações Internas
- SDR Agents
- Diagnóstico de Duplicatas

---

## SDR Agents

| Agente | Função | Localização |
|--------|--------|-------------|
| **Julia Amare** | SDR principal | `workflows/clients/sdr-julia-amare.json` |
| **Isabella** | Concierge executiva | n8n Mentorfy |
| **Donna/Wendy** | Secretária interna | `donna-wendy/` |
| **Follow Up Eterno** | Reengajamento | `ai-factory-agents/` |

---

## Modelo de Parceiros

```
PARCEIRO FAZ:          MOTTIVME FAZ:
─────────────          ─────────────
✅ VENDER              ✅ Infraestrutura completa
   (único foco)        ✅ Agentes IA personalizados
                       ✅ Workflows de atendimento
                       ✅ CRM + Automações
                       ✅ Follow-up automático
                       ✅ Financeiro (BPO)
                       ✅ Monitoramento
                       ✅ Escala operacional
```

---

## Comandos Úteis

### Testar API Railway
```bash
curl https://agenticoskevsacademy-production.up.railway.app/health
```

### Buscar conhecimento no RAG
```bash
curl -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-search" \
  -H "Content-Type: application/json" \
  -d '{"query": "growth os vendas", "project_key": "mottivme-ecosystem", "threshold": 0.4}'
```

### Adicionar conhecimento ao RAG
```bash
curl -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-ingest" \
  -H "Content-Type: application/json" \
  -d '{"category": "rule", "title": "Titulo", "content": "Conteudo", "project_key": "mottivme-ecosystem", "tags": ["tag1"]}'
```

---

## Prioridades Atuais

1. **Ativar Assembly Line** - Cobrir déficit de marketing
2. **Consolidação completa** - Unificar workspaces restantes
3. **Documentação parceiros** - docs-jet-delta.vercel.app
4. **Onboarding automatizado** - Growth OS white-label

---

## Documentação Relacionada

- [Dissecação GHL](https://docs-jet-delta.vercel.app/analises/dissecacao-ghl.html)
- `_docs/ARQUITETURA-ECOSSISTEMA-MOTTIVME.md`
- `_docs/PLANO-90-DIAS-100K-MRR.md`
- `AgenticOSKevsAcademy/CLAUDE.md`
- `ai-factory-agents/CLAUDE.md`

---

*Atualizado em: 11 de Janeiro de 2026*
*Versão: 2.0 - Pós consolidação*
