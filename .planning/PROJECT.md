# AI Factory Platform

## What This Is

AI Factory (factorai.mottivme.com.br) e a plataforma interna da MOTTIVME para gestao de agentes IA, clientes, operacoes e analytics. Inclui modulos como SalesOps, Agendamentos, PromptEditor, Supervision, Brand Dashboard, e MindFlow (project management). O proximo modulo e o Customer Journey Map — sistema completo pra mapear, trackear e visualizar a jornada do cliente MOTTIVME ponta a ponta.

## Core Value

Visibilidade total da jornada do cliente — da prospecao ate renovacao/churn — com tracking de cada touchpoint, owners claros, SLAs definidos e dashboard visual que mostra onde cada cliente esta e onde estao os gargalos.

## Current Milestone: v3.0 AI Engineer

**Goal:** Conectar as 6 camadas do AI Factory V3 (Ingestao → Provisionamento → Execucao → QA → Self-Improving → CS) em um loop fechado e autonomo, eliminando intervencao manual do Marcos na operacao de agentes.

**Context:** O AI Factory V3 ja tem 20 workflows n8n ativos cobrindo as 6 camadas. O loop Self-Improving (Reflection Loop 3AM → Prompt Updater → upgrade_agent_version()) ja roda em producao. O que falta sao 5 conexoes entre camadas existentes.

**Target features:**
- AI as Judge conectado ao Reflection Loop (QA → Self-Improving)
- Tasks automaticas em mottivme_tasks quando escalate (visibilidade no dashboard)
- CS Bot nos grupos WhatsApp dos clientes (deteccao automatica de problemas)
- Agent Skills integrado ao Prompt Updater (editar skills isoladas, nao SP monolitico)
- Dashboard frontend para visualizar todo o sistema Self-Improving

## Previous Milestone: v2.0 Customer Journey Map

**Goal:** Mapear, trackear e visualizar a jornada completa do cliente MOTTIVME no AI Factory, integrando dados de GHL, Supabase e n8n em um sistema visual e acionavel.

**Target features:**

- Mapa visual ponta-a-ponta da jornada (touchpoints, owners, ferramentas, SLAs por etapa)
- Schema de tracking para cada evento/etapa da jornada (Supabase)
- Editor visual de jornada com drag-and-drop de etapas
- Dashboard analytics com Sankey flow, drop-off rates, SLA compliance
- Integracao E2E com GHL pipelines + n8n workflows + Supabase em tempo real

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Board Engine com colunas tipadas (Text, Number, Status, Date, Person, Dropdown, Checkbox, URL, Rating, Formula)
- [ ] Table view com edicao inline, grupos coloriveis, subitems collapsiveis
- [ ] Kanban view com drag-and-drop por status/qualquer coluna
- [ ] Dashboard builder com widgets arrastaveis (charts, numbers, battery, table)
- [ ] Automacoes basicas (trigger + condition + action, 10 receitas iniciais)
- [ ] Calendar view para items com datas
- [ ] Sistema de permissoes (Admin, Member, Viewer)
- [ ] API interna para CRUD de boards/items/views
- [ ] Templates de board pre-configurados (Projeto, CRM, Sprint, Onboarding)
- [ ] Bulk actions (selecionar multiplos items, floating toolbar)
- [ ] Command palette (Cmd+K) para navegacao rapida
- [ ] Filtros, sort e group-by por view (salvos independentemente)
- [ ] Real-time updates via Supabase Realtime
- [ ] Integracao com ecosystem AI Factory (agentes, leads, contatos GHL)

### Out of Scope

- Mobile app nativo — web-first, responsive depois
- Apps marketplace / framework de extensoes third-party — complexidade prematura
- Whiteboards / drawing canvas — nao e core de PM
- Video calls / chat nativo — usa Slack/WhatsApp existentes
- Gantt chart avancado com dependencias — v2 (SVAR React Gantt)
- Connect Boards + Mirror cross-board — v2 (complexidade alta)
- Goals/OKRs — v2
- Sprint management completo (burndown, velocity) — v2
- Time tracking nativo — v2

## Context

### v1.0 MindFlow (pausado — Fase 1/8 completa)

Project management boards inspirado no Monday.com. Fase 1 Foundation completa (schema, types, column registry, hooks, routes). Fases 2-8 pendentes. Pausado para priorizar Customer Journey Map.

### Customer Journey Map — Contexto Existente

**4 Pipelines GHL (fonte de verdade):**

- **Prospects** (`zay1uZBOKpheJKFlk2Il`) — Cadencia outbound 19 dias, 7 touchpoints (D1→D19→Ganho/Descartado)
- **Pre-Vendas/Vendas** (`5LwcbrLUXG6TCLaP9wf3`) — 12 stages (Novo Lead→Qualificacao→Reuniao→Proposta→Ganho/Perdido)
- **Sales Farming** (`cKc7qtxHdyVqG7aPkl3H`) — 14 stages, reativacao base dormida 2+ meses
- **CS/Retencao** (`QMG7pyGM6hlbvHrDPBVD`) — 6 stages (Onboarding→Ativo→Upsell→Renovacao→Risco→Churned)

**6 Clientes Ativos:** MOTTIVME, Dra. Gabriela, Instituto Amare, Dra. Carolina, Alberto (churned), Eline (churned)

**Tracking Parcial Supabase:**

- `n8n_schedule_tracking` — agendamentos, etapa_funil, responded
- `agent_conversation_reflections` — reflection loop, quality_score
- `clients` — metadata cliente (api_key, location_id, calendars)

**Workflows n8n (3 principais):**

- `HXWGWQFBY4KVfY64` — Fluxo Principal (40+ nodes, webhook→agent→send)
- `IawOpB56MTFoEP3M` — Classificacao e Roteamento (36+ nodes)
- `YlCtmyzCtGu2SmEx` — Reflection Loop (scheduled hourly)

**Onboarding atual:** 10-14 dias (meta <48h). Playbook VTX 6 etapas internas.

**Gaps conhecidos:** Multi-channel tracking incompleto, LLM timeout sem fallback, reflection credenciais NULL, onboarding >48h.

### Codebase Existente (AI Factory)

- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase
- **Monorepo:** Turborepo com apps/docs (frontend principal), packages/ui, packages/types
- **Routing:** HashRouter (React Router v7)
- **Charts:** Recharts 3.6 (ja instalado)
- **Auth:** Supabase Auth via AuthContext
- **Paginas existentes:** 30+ (Dashboard, SalesOps, Agendamentos, PromptEditor, Supervision, etc)
- **Concerns:** Zero testes, componentes de 1500+ linhas, mock data em producao, dual supabase clients

Codebase map: `.planning/codebase/`

### Diferenciais vs Monday/ClickUp

1. **Customizacao total** — controle do codigo, sem limites de plano
2. **IA nativa** (futuro) — agentes como membros do board, AI columns, auto-fill, scoring
3. **Integracao GHL/n8n** (futuro) — leads GHL como items, automacoes n8n como triggers
4. **Custo zero por seat** — sem $19/seat/mes
5. **Multi-tenant** (futuro) — clientes do AI Factory usam como feature

## Constraints

- **Tech stack:** React 19 + TypeScript + Vite + Tailwind v4 + Supabase (stack do AI Factory)
- **Monorepo:** Deve viver dentro de apps/docs (mesmo app) como novas paginas/rotas
- **Backend:** Supabase only (PostgreSQL + Realtime + Auth) — sem backend separado
- **Compatibilidade:** Deve coexistir com as 30+ paginas existentes sem quebrar nada
- **Performance:** Boards com ate 1000 items devem ser fluidos (virtualizar se necessario)
- **Design:** Seguir design system existente (Tailwind + Lucide icons + tema dark/light)

## Key Decisions

| Decision                          | Rationale                                                               | Outcome   |
| --------------------------------- | ----------------------------------------------------------------------- | --------- |
| TanStack Table v8 para Table view | Headless, controle total do design, MIT, 15KB bundle                    | — Pending |
| @dnd-kit para drag-and-drop       | Melhor DX React, animacoes nativas, acessibilidade, 13KB                | — Pending |
| react-grid-layout para dashboards | Standard para dashboard DnD + resize, battle-tested                     | — Pending |
| cmdk para command palette         | Usado por Vercel/Linear/Raycast, 5KB                                    | — Pending |
| JSONB para column_values          | Flexivel para custom fields, schema-less, query com operadores Postgres | — Pending |
| Supabase Realtime para updates    | Ja no stack, broadcast por board, sem infra adicional                   | — Pending |
| Recharts para widgets             | Ja instalado no projeto, API declarativa React                          | — Pending |
| Materialized Path para hierarquia | Boards > Groups > Items > Subitems, queries eficientes                  | — Pending |

---

_Last updated: 2026-03-20 — milestone v3.0 AI Engineer iniciado_
