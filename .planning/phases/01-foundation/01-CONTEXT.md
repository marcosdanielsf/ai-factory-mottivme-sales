# Phase 1: Foundation - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema (6 mindflow\_ tables), TypeScript types, column type registry (4 initial types), lazy-loaded route scaffolding at #/mindflow/\*, and Supabase data hooks. This is pure infrastructure — no UI components beyond route placeholders. All subsequent phases build on this foundation.

</domain>

<decisions>
## Implementation Decisions

### Column Type Registry

- 4 initial types: Text, Number, Status, Date (Person, Dropdown, Checkbox enter Phase 3)
- Registry pattern: Object map + interface — `columnRegistry[type]` returns `{renderCell, renderEditor, validate, serialize, deserialize, sortComparator, filterOperators}`
- Each column carries metadata: `{id, type, title, settings, width, position}`
- `settings` is type-specific JSONB (e.g., status has `labels[]`, number has `format`, date has `date_format`)
- Status options: Array of `{id, label, color}` in settings. Monday.com pattern: `[{id: 'done', label: 'Done', color: '#00C875'}, ...]`

### Schema JSONB Design

- `column_values` stored as map by column_id: `{"col_abc123": {"value": "Done", "label": "Done"}, "col_def456": {"value": 42}}`
- Column definitions stored as JSONB array in `mindflow_boards.columns` (not a separate table) — one query brings everything
- Fractional indexing for positions (strings like 'a0', 'a1', 'a0V') — insert between items without reindexing all. Linear/Figma pattern.
- Table prefix: `mindflow_` (mindflow_boards, mindflow_groups, mindflow_items, mindflow_views, mindflow_dashboards, mindflow_dashboard_widgets)
- GIN index on `column_values` for JSONB queries

### Code Organization

- Dedicated subfolders: `pages/mindflow/`, `hooks/mindflow/`, `lib/mindflow/`, `types/mindflow.ts`
- Components organized by feature inside `pages/mindflow/components/`: `board/`, `views/`, `columns/`, `dnd/`
- Types in single file: `types/mindflow.ts` (Board, Group, Item, View, Column, ColumnType interfaces)
- Hook barrel export: `hooks/mindflow/index.ts` — follows existing hooks/index.ts pattern
- Import pattern: `import { useBoard } from '@/hooks/mindflow'`

### Route Scaffolding

- URL pattern: `#/mindflow/*` — `#/mindflow` (board list), `#/mindflow/:boardId` (board view), `#/mindflow/:boardId/settings`
- Lazy-loaded via `React.lazy + Suspense` — separate chunk, zero impact on existing 30+ pages bundle
- Sidebar: New collapsible section "MindFlow" with LayoutDashboard icon, expands to show user's boards
- Layout: Reuse existing AI Factory Layout (header + sidebar). Sidebar gains MindFlow section. No custom layout.

### Claude's Discretion

- Exact fractional indexing library choice (or custom implementation)
- RPC function signatures for CRUD operations
- Supabase Realtime channel naming convention
- Hook internal state management pattern (useState vs useReducer)
- Migration file naming/numbering convention within existing sql/ folder

</decisions>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/lib/supabase.ts`: Primary Supabase client — reuse for all MindFlow queries
- `src/contexts/AuthContext.tsx`: Auth provider — MindFlow routes wrapped by existing ProtectedRoute
- `@tanstack/react-virtual` 3.13.18: Already installed — use for table virtualization in Phase 2
- `src/components/Layout.tsx`: Main layout — MindFlow renders inside its content area
- `src/components/Sidebar.tsx`: Navigation sidebar — add MindFlow section here

### Established Patterns

- Hooks: `useState + useCallback + fetch` pattern (see useDashboardMetrics, useAgentVersions)
- Named exports: `export const Component: React.FC<Props> = () => {}` preferred
- Type files: Domain-specific in `types/` (rpg.ts, supervision.ts) — mindflow.ts follows same pattern
- Path alias: `@/*` maps to project root (tsconfig + vite.config)
- JSONB precedent: `score_dimensions`, `tools_config`, `column_values` in agent_versions

### Integration Points

- `App.tsx`: Add lazy-loaded Route for `/mindflow/*` inside HashRouter
- `Sidebar.tsx`: Add new collapsible nav section for MindFlow boards
- `sql/`: New migration files for mindflow\_ tables (follow existing numbering)
- `vite.config.ts`: May need manual chunk config for mindflow vendor libs

</code_context>

<specifics>
## Specific Ideas

- Follow Monday.com's JSONB column_values pattern exactly — proven at scale
- Fractional indexing like Linear/Figma — no integer reindexing on every drag
- Column registry should be dead simple to extend (adding a new type = 1 file + 1 registry entry)
- Keep Phase 1 invisible to users — no UI, just schema + types + hooks + route placeholders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-foundation_
_Context gathered: 2026-03-05_
