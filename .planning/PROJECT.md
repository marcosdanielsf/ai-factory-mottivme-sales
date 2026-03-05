# MindFlow

## What This Is

MindFlow e um sistema de gerenciamento de projetos, tarefas e workflows integrado ao AI Factory (factorai.mottivme.com.br). Inspirado no Monday.com e ClickUp, oferece boards flexiveis com views multiplas (Table, Kanban, Calendar, Gantt), custom fields tipados, dashboards com widgets arrastaveis e automacoes. Comeca como ferramenta interna da MOTTIVME e evolui para feature multi-tenant disponivel para clientes do AI Factory.

## Core Value

Boards flexiveis com colunas tipadas e edicao inline — o usuario consegue criar qualquer tipo de board (projetos, CRM, ops, tracking) e visualizar os mesmos dados em multiplas views, sem depender de ferramentas externas como Monday.com ou ClickUp.

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

### Pesquisa de Mercado Realizada (2026-03-04)

Pesquisa completa com 5 agentes paralelos cobrindo:

- **Monday.com:** 30+ column types, 14+ views, 50+ automation triggers, Apps Framework, Vibe Design System
- **ClickUp:** 22+ fields, 15+ views, hierarquia 7 niveis, Brain AI multi-LLM, Chat nativo
- **18 projetos open-source:** Plane (46.2k stars, React+Django), Huly (24.8k, Svelte), OpenProject (14.5k, Rails)
- **UX patterns:** Inline editing, DnD (@dnd-kit), command palette (cmdk), bulk selection, view switching
- **Stack recomendada:** TanStack Table v8, @dnd-kit, TipTap v2, react-grid-layout, cmdk, Recharts

Documento completo: `~/pesquisa-pm-tool-2026.md`

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

_Last updated: 2026-03-05 after initialization_
