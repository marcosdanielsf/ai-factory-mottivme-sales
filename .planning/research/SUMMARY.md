# MindFlow Research Synthesis

**Date:** 2026-03-05 | **Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Key Findings

### Stack

**Already available (no install needed):**
React 19, TypeScript 5.8, Vite 6, Tailwind v4, Supabase JS, Recharts, TanStack Virtual, Lucide React, pnpm + Turborepo.

**Must add:**

| Library                                                         | Size (gzip) | Phase |
| --------------------------------------------------------------- | ----------- | ----- |
| @tanstack/react-table 8.x                                       | 15KB        | 1     |
| @dnd-kit (core+sortable+utilities)                              | 13KB        | 1     |
| zustand 5.x                                                     | 2KB         | 1     |
| cmdk 1.x                                                        | 5KB         | 1     |
| react-day-picker, react-colorful, react-number-format, date-fns | ~30KB       | 1     |
| fractional-indexing                                             | 2KB         | 1     |
| react-grid-layout 1.5.x                                         | 20KB        | 2     |
| @tiptap/react + starter-kit                                     | 45KB        | 2     |
| immer 10.x                                                      | 6KB         | 2     |

**Total new JS: ~130KB gzipped.** Isolated via Vite manual chunk (`vendor-mindflow`), lazy-loaded on `/mindflow/*` routes only. Zero impact on existing 30+ pages.

**Compatibility:** All libraries confirmed compatible with React 19 + Vite 6 + Tailwind v4. One watch item: `react-grid-layout` uses class components internally -- monitor for React 19 deprecation warnings.

**Explicitly rejected:** AG Grid, ShadCN/UI, Framer Motion, Redux, Apollo/urql, react-beautiful-dnd, Slate, Quill, Liveblocks.

---

### Table Stakes Features (12 MVP items)

**Priority 1 -- Foundation (must build first):**

| #   | Feature                                                                                    | Complexity |
| --- | ------------------------------------------------------------------------------------------ | ---------- |
| 1   | Board engine with 7 typed columns (Text, Number, Status, Date, Person, Dropdown, Checkbox) | High       |
| 2   | Table view with inline editing                                                             | High       |
| 3   | Groups/sections (collapsible, colorable)                                                   | Medium     |
| 4   | Item CRUD + bulk actions                                                                   | Medium     |

**Priority 2 -- Core UX:**

| #   | Feature                                       | Complexity |
| --- | --------------------------------------------- | ---------- |
| 5   | Kanban view with drag-and-drop                | Medium     |
| 6   | Filtering, sorting, grouping (saved per view) | Medium     |
| 7   | Item detail panel (sidebar)                   | Medium     |
| 8   | Real-time updates (Supabase Realtime)         | Medium     |

**Priority 3 -- Ship-ready:**

| #   | Feature                              | Complexity |
| --- | ------------------------------------ | ---------- |
| 9   | Permissions (Admin, Member, Viewer)  | Medium     |
| 10  | Board templates (4 pre-built)        | Low        |
| 11  | Command palette (Cmd+K)              | Low        |
| 12  | Multi-tenant isolation (location_id) | Medium     |

---

### Architecture

**Core structure:** Board Engine --> View Layer --> Column Type System

```
BoardProvider (data context)
  --> TableView (TanStack Table v8) | KanbanView (@dnd-kit) | CalendarView
  --> Column Registry (renderCell/renderEditor per type)
  --> DnD Layer (@dnd-kit, fractional indexing)
```

Views are pure renderers. They consume board context data and apply their own filter/sort/group lens. They never query Supabase directly.

**Database: 6 tables, all `mindflow_` prefixed:**

| Table                        | Purpose                                                 |
| ---------------------------- | ------------------------------------------------------- |
| `mindflow_boards`            | Board config + columns as JSONB array                   |
| `mindflow_groups`            | Sections within boards, fractional position             |
| `mindflow_items`             | Rows with `column_values` JSONB, parent_id for subitems |
| `mindflow_views`             | Saved filter/sort/group per view tab                    |
| `mindflow_dashboards`        | Dashboard containers (Phase 2)                          |
| `mindflow_dashboard_widgets` | Widget config + layout (Phase 2)                        |

Key design: JSONB `column_values` per item (Monday/Plane pattern), GIN indexed. Atomic updates via `mindflow_update_column_value()` RPC to prevent race conditions.

**Build order (8 phases, dependency-linked):**

```
P0 Foundation --> P1 Table View --> P2 DnD + Columns --> P3 Kanban
                      |                                      |
                      |                                   P4 Views Infra
                      |                                      |
                      |                              P5 / P6 / P7 (parallel)
                      |                           (Calendar/Dashboard/Automations)
                      +------------------------------------> P8 Polish
```

Phases 5-7 are independent and can be built in any order after Phase 4.

---

### Critical Pitfalls (Top 5)

**1. Not virtualizing tables from day 1 (PERFORMANCE)**
Retrofitting virtualization is 3-5x harder. TanStack Virtual must be integrated in Phase 1. Budget: never render more than viewport + 20 rows.

**2. Monolithic board component (ARCHITECTURE)**
Enforce 300-line soft limit per component. Decompose into BoardPage > BoardHeader > GroupContainer > ItemRow > CellEditor. State in hooks, not components.

**3. Column type system as switch/case instead of registry (ARCHITECTURE)**
Single most important extensibility decision. One `ColumnTypeDefinition` interface, one `Map<string, ColumnType>` registry. Adding a type = adding one file. Never switch/case in views.

**4. Scope creep toward Monday.com feature parity (SCOPE)**
Monday has 1800 employees and 12 years. Phase 1 hard scope: 2 views, 7 column types. Definition of done: Marcos uses it daily for a real workflow. No Phase 2 until Phase 1 runs 1+ week in production.

**5. Inline editing focus management (UX)**
Single active cell state `{ rowId, columnId } | null`. Only ONE cell edits at a time. Full keyboard matrix: Tab/Shift+Tab/Enter/Escape/click-outside. Portaled editors (date picker, dropdown) must not steal focus.

---

### Recommendations

1. **Start with Board Engine + Table View** -- this is the foundation for everything else. Kanban, Calendar, and Dashboard all consume the same BoardProvider data.
2. **Use column type registry pattern from day 1** -- prevents the #1 architecture debt in PM tools. One interface, one Map, one file per type.
3. **Virtualize tables from the start** -- TanStack Virtual is already installed. Integrate it in the first table implementation, not as a later optimization.
4. **Lazy-load MindFlow routes** -- `const MindFlowRoutes = lazy(() => import('./mindflow/routes'))`. Zero bytes added to non-MindFlow pages. Add `vendor-mindflow` chunk in `vite.config.ts`.
5. **Use fractional indexing for positions** -- `fractional-indexing` library (2KB). Avoids rewriting all positions on insert. Used by Linear, Plane, Figma.
6. **One Realtime channel per board** -- never per column/group/view. Max 5 concurrent channels per user session. Subscription manager singleton with cleanup on unmount.
7. **Zustand for board client state** -- selection, filters, view config. Supabase hooks for server state. Do NOT refactor existing AI Factory state.

---

### Risk Assessment

| Risk                | Level  | Mitigation                                                                                               |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| **Performance**     | Medium | Virtualization from day 1 + GIN indexes + 200ms query budget                                             |
| **Scope creep**     | High   | Hard Phase 1 scope (7 types, 2 views), backlog file for requests, no Phase 2 until Phase 1 in production |
| **Integration**     | Low    | `/mindflow/*` namespace, lazy-loaded, `mindflow_` table prefix, isolated RLS policies                    |
| **Bundle size**     | Low    | ~130KB gzipped total, all lazy-loaded, manual Vite chunk                                                 |
| **DnD performance** | Medium | Item limits per container (50 Kanban cards), profile during QA, useMemo on sortable lists                |

---

_Synthesis compiled 2026-03-05. Feeds into requirements doc and roadmap._
