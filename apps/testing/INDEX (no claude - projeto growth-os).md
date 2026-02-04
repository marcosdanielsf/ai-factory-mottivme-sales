# AI Factory Agents - Índice do Projeto

> **LEIA PRIMEIRO**: Este arquivo é o mapa de navegação do projeto. Use-o para encontrar qualquer coisa.

## Links Rápidos

| O que você quer? | Onde está |
|------------------|-----------|
| Entender o projeto | [Visão Geral](#visão-geral) |
| Rodar algo | [CLAUDE.md](./CLAUDE.md) |
| Fluxos n8n | [Fluxos n8n](#fluxos-n8n) |
| Follow-up | [Sistema de Follow-up](#sistema-de-follow-up) |
| Prompts da Isabella | [Prompts](#prompts-agentes) |
| Migrations SQL | [Migrations](#migrations-sql) |
| Documentação | [Docs](#documentação) |

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MOTTIVME SALES STACK                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │   GHL       │     │    n8n      │     │  Supabase   │               │
│  │ (Contatos)  │◄───►│  (Fluxos)   │◄───►│   (Dados)   │               │
│  └─────────────┘     └─────────────┘     └─────────────┘               │
│         │                   │                   │                       │
│         │                   ▼                   │                       │
│         │          ┌─────────────┐              │                       │
│         └─────────►│  AI Agents  │◄─────────────┘                       │
│                    │  (Gemini)   │                                      │
│                    └─────────────┘                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Repositórios Relacionados

| Repo | Path | Função |
|------|------|--------|
| **ai-factory-agents** (ESTE) | `~/Projects/mottivme/ai-factory-agents` | Fluxos n8n, prompts, migrations |
| **AgenticOSKevsAcademy** | `~/Projects/mottivme/AgenticOSKevsAcademy` | Backend APIs Python (Railway) |
| **socialfy-platform** | `~/Projects/mottivme/socialfy-platform` | Frontend Socialfy CRM |

---

## Estrutura de Pastas

```
ai-factory-agents/
│
├── INDEX.md                    # ← VOCÊ ESTÁ AQUI (mapa do projeto)
├── CLAUDE.md                   # Instruções para Claude Code
├── README.md                   # Readme original (desatualizado)
│
├── docs/                       # Documentação
│   ├── ARQUITETURA_FOLLOW_UP_UNIVERSAL.md  # ★ Novo sistema FUU
│   ├── INTEGRACAO_FOLLOW_UP_ETERNO.md      # Follow-up v2.5
│   ├── GUIA_PROMPTS_MODULARES_v66.md       # Como funcionam prompts
│   ├── MANUAL_ACOMPANHAMENTO_ISABELLA_V64.md
│   └── ...
│
├── prompts/                    # Prompts dos agentes
│   ├── prompt_base_isabella.md
│   ├── prompt_sdr_inbound.md
│   ├── prompt_scheduler.md
│   ├── prompt_concierge.md
│   ├── prompt_objection_handler.md
│   ├── prompt_followuper.md
│   ├── prompt_reativador_base.md
│   └── prompt_social_seller_instagram.md
│
├── migrations/                 # SQL Migrations
│   ├── add_followup_columns_n8n_schedule_tracking.sql  # ★ FUU v2.5
│   └── 003_create_e2e_test_results.sql
│
├── sql/                        # Scripts SQL diversos
│   ├── isabella_v66_INSERT_COMPLETO.sql    # INSERT do agente
│   ├── isabella_v66_prompts_modulares.sql  # Prompts no Supabase
│   └── ...
│
├── n8n_nodes/                  # Nodes n8n exportados
│   ├── node_montar_prompts_finais_v66_supabase.json
│   ├── node_preparar_execucao_v66_supabase.json
│   └── ...
│
├── [FLUXOS N8N]                # Arquivos JSON dos workflows
│   ├── SDR Julia Amare - Corrigido.json         # ★ Principal
│   ├── [ GHL ] Follow Up Eterno - CORRIGIDO.json # ★ Follow-up v2.5
│   └── follow up eterno ARQUIVO BASE - KOMMO.json # Referência
│
├── e2e_testing/                # Sistema de testes
│   ├── agent_loader.py
│   ├── groq_test_runner.py
│   └── scenarios_isabella_v63.py
│
└── outputs/                    # Outputs gerados
    └── ...
```

---

## Fluxos n8n

### Principais (em produção ou teste)

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `SDR Julia Amare - Corrigido.json` | Fluxo SDR principal | ✅ Produção |
| `[ GHL ] Follow Up Eterno - CORRIGIDO.json` | Follow-up automático v2.5 | 🔄 Teste |
| `[ GHL ] Follow Up Eterno - UNIVERSAL v3.0.json` | Follow-up Universal multi-tenant | ✅ Pronto |

### Referência

| Arquivo | Descrição |
|---------|-----------|
| `follow up eterno ARQUIVO BASE - KOMMO.json` | Versão original Kommo (funcionando) |

---

## Sistema de Follow-up

### Documentação

1. **[INTEGRACAO_FOLLOW_UP_ETERNO.md](./docs/INTEGRACAO_FOLLOW_UP_ETERNO.md)** - Versão atual (v2.5)
   - Usa subquery no histórico de mensagens
   - Não precisa de node extra após IA responder

2. **[ARQUITETURA_FOLLOW_UP_UNIVERSAL.md](./docs/ARQUITETURA_FOLLOW_UP_UNIVERSAL.md)** - Arquitetura futura
   - Sistema escalável multi-processo
   - 30+ tipos de follow-up (SDR, clínica, financeiro, experiência)
   - Multi-tenant

### Tabelas Supabase

| Tabela | Função |
|--------|--------|
| `n8n_schedule_tracking` | Tracking de leads ativos (11k+ registros) |
| `n8n_historico_mensagens` | Histórico de conversas (fonte da verdade) |
| `follow_up_cadencias` | Intervalos por canal/tentativa |
| `fuu_follow_up_types` | 10 tipos de follow-up (sdr, closer, concierge, clinic, etc.) |
| `fuu_agent_configs` | Config de agentes por location (nome, tom, emoji, etc.) |

### Migrations

| Arquivo | Status |
|---------|--------|
| `migrations/007_fuu_agent_configs.sql` | ✅ Aplicada |
| `migrations/add_followup_columns_n8n_schedule_tracking.sql` | ✅ Aplicada |

---

## Prompts (Agentes)

### Isabella Amare v6.6

| Modo | Arquivo | Função |
|------|---------|--------|
| Base | `prompts/prompt_base_isabella.md` | Personalidade e regras gerais |
| SDR Inbound | `prompts/prompt_sdr_inbound.md` | Atendimento inicial |
| Scheduler | `prompts/prompt_scheduler.md` | Agendamento |
| Concierge | `prompts/prompt_concierge.md` | Pós-agendamento |
| Objection Handler | `prompts/prompt_objection_handler.md` | Contornar objeções |
| Followuper | `prompts/prompt_followuper.md` | Reativação |
| Reativador Base | `prompts/prompt_reativador_base.md` | Leads frios |
| Social Seller IG | `prompts/prompt_social_seller_instagram.md` | Instagram DM |
| **FUP Universal** | `prompts/PROMPT_FUP_UNIVERSAL_N8N.txt` | Follow-up multi-tenant v3.0 |

### Como funciona

```
prompt_final = prompt_base + prompt_modo_especifico + variaveis_lead
```

Ver: [GUIA_PROMPTS_MODULARES_v66.md](./docs/GUIA_PROMPTS_MODULARES_v66.md)

---

## Migrations SQL

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `migrations/007_fuu_agent_configs.sql` | Tabelas FUU v3.0 | ✅ Aplicada |
| `migrations/add_followup_columns_n8n_schedule_tracking.sql` | Colunas FUU v2.5 | ✅ Aplicada |
| `migrations/003_create_e2e_test_results.sql` | Tabela testes E2E | ✅ Aplicada |

---

## Documentação

| Arquivo | Sobre |
|---------|-------|
| `docs/FUU_UNIVERSAL_v3.md` | **★ Follow-up Universal v3.0** |
| `docs/ARQUITETURA_FOLLOW_UP_UNIVERSAL.md` | Sistema FUU escalável |
| `docs/INTEGRACAO_FOLLOW_UP_ETERNO.md` | Follow-up v2.5 atual |
| `docs/GUIA_PROMPTS_MODULARES_v66.md` | Como prompts funcionam |
| `docs/MANUAL_ACOMPANHAMENTO_ISABELLA_V64.md` | Acompanhamento de testes |
| `docs/ANALISE_ERROS_FLUXO_SDR.md` | Debug de erros |

---

## APIs e Endpoints

### AgenticOS (Railway)

Base: `https://agenticoskevsacademy-production.up.railway.app`

| Endpoint | Método | Função |
|----------|--------|--------|
| `/api/match-lead-context` | POST | Busca contexto do lead |
| `/api/analyze-conversation-context` | POST | Decide se ativa IA |
| `/webhook/rag-search` | POST | Busca no RAG |
| `/webhook/rag-ingest` | POST | Salva no RAG |

### n8n (Mentorfy)

Base: `https://cliente-a1.mentorfy.io`

| Webhook | Função |
|---------|--------|
| `/webhook/claude-memory` | Memória do Claude |

---

## Variáveis de Ambiente

```bash
# Supabase
SUPABASE_URL="https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."

# IA
GROQ_API_KEY="gsk_..."
GOOGLE_API_KEY="..."  # Gemini

# GHL (varia por location)
GHL_API_KEY="..."
GHL_LOCATION_ID="..."
```

---

## Scripts de Teste

| Script | Descrição | Comando |
|--------|-----------|---------|
| `scripts/test_fup_universal.py` | Testes do FUU v3.0 | `python3 scripts/test_fup_universal.py` |
| `scripts/test_follow_up_v2.py` | Testes do Follow-up v2.5 | `python3 scripts/test_follow_up_v2.py` |
| `run_isabella_tests.py` | Testes E2E Isabella | `python3 run_isabella_tests.py` |

---

## Tarefas Pendentes

### Follow-up Universal v3.0 (FUU)
- [x] Criar migration com tabelas FUU
- [x] Popular `fuu_follow_up_types` (10 tipos)
- [x] Criar config Instituto Amar (Isabella)
- [x] Criar workflow universal
- [x] Criar testes automatizados
- [ ] Importar workflow no n8n produção
- [ ] Adicionar configs para outras locations

### Follow-up v2.5 (Legado)
- [x] Rodar migration no Supabase
- [x] Importar fluxos no n8n
- [ ] Migrar para v3.0

---

## Histórico de Versões

| Data | Versão | O que mudou |
|------|--------|-------------|
| 2026-01-09 | FUU v3.0 | **Follow-up Universal multi-tenant com config dinâmica** |
| 2026-01-09 | FUU v1.0 | Arquitetura Follow-up Universal |
| 2026-01-09 | Follow-up v2.5 | Subquery no histórico, contexto da última msg |
| 2026-01-08 | Isabella v6.6 | Prompts modulares no Supabase |

---

## Como Navegar

1. **Novo no projeto?** Leia este INDEX.md e depois CLAUDE.md
2. **Quer rodar algo?** Veja CLAUDE.md para comandos
3. **Procurando um fluxo?** Veja seção [Fluxos n8n](#fluxos-n8n)
4. **Precisa de SQL?** Veja pastas `migrations/` e `sql/`
5. **Quer entender a arquitetura?** Veja `docs/`

---

*Última atualização: 2026-01-09*
