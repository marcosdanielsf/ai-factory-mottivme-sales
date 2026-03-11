---
phase: 01-foundation
plan: 02
subsystem: ui
tags:
  [
    typescript,
    react,
    supabase,
    column-registry,
    hooks,
    lazy-loading,
    fractional-indexing,
  ]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: "SQL schema (mindflow_boards, mindflow_groups, mindflow_items, mindflow_views, RPCs)"
provides:
  - "TypeScript types mirroring all MindFlow database tables"
  - "Column type registry with 4 registered types (text, number, status, date)"
  - "Supabase data hooks (useBoard, useBoardItems, useBoardGroups)"
  - "Lazy-loaded routes at #/mindflow and #/mindflow/:boardId"
  - "Sidebar navigation entry for MindFlow"
  - "fractional-indexing package installed"
affects:
  [
    02-table-view,
    03-column-system,
    04-views-filters,
    05-board-management,
    06-item-detail,
  ]

# Tech tracking
tech-stack:
  added: [fractional-indexing]
  patterns:
    [
      column-type-registry,
      lazy-loading-routes,
      suspense-fallback,
      supabase-rpc-hooks,
    ]

key-files:
  created:
    - apps/docs/src/types/mindflow.ts
    - apps/docs/src/lib/mindflow/column-registry.ts
    - apps/docs/src/lib/mindflow/column-types/text.tsx
    - apps/docs/src/lib/mindflow/column-types/number.tsx
    - apps/docs/src/lib/mindflow/column-types/status.tsx
    - apps/docs/src/lib/mindflow/column-types/date.tsx
    - apps/docs/src/lib/mindflow/column-types/index.ts
    - apps/docs/src/hooks/mindflow/useBoard.ts
    - apps/docs/src/hooks/mindflow/useBoardItems.ts
    - apps/docs/src/hooks/mindflow/useBoardGroups.ts
    - apps/docs/src/hooks/mindflow/index.ts
    - apps/docs/src/pages/mindflow/index.tsx
    - apps/docs/src/pages/mindflow/BoardPage.tsx
  modified:
    - apps/docs/src/App.tsx
    - apps/docs/src/components/Sidebar.tsx
    - apps/docs/package.json

key-decisions:
  - "Column type files use .tsx extension (JSX in renderCell/renderEditor)"
  - "MindFlow pages use export default (React.lazy requirement) diverging from codebase named export convention"
  - "Column settings cast through unknown to handle Record<string, unknown> base type"

patterns-established:
  - "Column registry: registerColumnType<T>() with Map singleton, fallback to 'text' type"
  - "Lazy route pattern: React.lazy + Suspense with loading fallback inside ProtectedRoute+Layout"
  - "MindFlow hooks in separate hooks/mindflow/ directory with barrel export"

requirements-completed: [BOARD-07]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 1 Plan 2: Types + Hooks + Routes Summary

**TypeScript types mirroring DB schema, column registry com 4 tipos extensiveis, hooks Supabase com RPC, e rotas lazy-loaded com navegacao sidebar**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T10:40:37Z
- **Completed:** 2026-03-05T10:45:06Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- TypeScript types para Board, Group, Item, View, Column com settings tipados (StatusColumnSettings, NumberColumnSettings, DateColumnSettings)
- Column type registry singleton com 4 tipos registrados, cada um com renderCell, renderEditor, validate, serialize, deserialize, sortComparator, filterOperators
- 3 hooks Supabase: useBoard (fetch paralelo), useBoardItems (CRUD com RPC atomico), useBoardGroups (CRUD com RPC)
- Rotas lazy-loaded com React.Suspense e fallback, zero impacto no bundle existente
- Secao MINDFLOW no sidebar com icone LayoutDashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TypeScript types + column registry + 4 column type implementations** - `eb543f9` (feat)
2. **Task 2: Create Supabase data hooks + install fractional-indexing** - `d65400a` (feat)
3. **Task 3: Create lazy-loaded routes + sidebar MindFlow section** - `b22421e` (feat)

## Files Created/Modified

- `apps/docs/src/types/mindflow.ts` - All MindFlow type definitions (Board, Group, Item, View, Column, settings)
- `apps/docs/src/lib/mindflow/column-registry.ts` - ColumnType interface + registry singleton (register, get, getAll)
- `apps/docs/src/lib/mindflow/column-types/text.tsx` - Text column type with contains/equals/empty filters
- `apps/docs/src/lib/mindflow/column-types/number.tsx` - Number column with currency/percent/number formatting
- `apps/docs/src/lib/mindflow/column-types/status.tsx` - Status column with colored badges and dropdown editor
- `apps/docs/src/lib/mindflow/column-types/date.tsx` - Date column with pt-BR formatting and optional time
- `apps/docs/src/lib/mindflow/column-types/index.ts` - Barrel file triggering all type registrations
- `apps/docs/src/hooks/mindflow/useBoard.ts` - Board data hook (parallel fetch board+groups+items)
- `apps/docs/src/hooks/mindflow/useBoardItems.ts` - Item CRUD (create, updateColumnValue via RPC, archive, move via RPC)
- `apps/docs/src/hooks/mindflow/useBoardGroups.ts` - Group CRUD (create, update, delete, reorder via RPC)
- `apps/docs/src/hooks/mindflow/index.ts` - Barrel export for all hooks
- `apps/docs/src/pages/mindflow/index.tsx` - Board list placeholder (default export)
- `apps/docs/src/pages/mindflow/BoardPage.tsx` - Board view placeholder (default export)
- `apps/docs/src/App.tsx` - Added React.lazy imports and 2 MindFlow routes above catch-all
- `apps/docs/src/components/Sidebar.tsx` - Added MINDFLOW section with LayoutDashboard icon
- `apps/docs/package.json` - Added fractional-indexing dependency

## Decisions Made

- Column type .tsx extension: renderCell/renderEditor return JSX, so .tsx is cleaner than React.createElement() in .ts
- MindFlow pages use `export default` (React.lazy requirement), diverging from codebase's named export convention for other pages
- StatusColumnSettings cast uses `as unknown as StatusColumnSettings` to handle the `Record<string, unknown>` base type from MindflowColumn.settings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed StatusColumnSettings type cast error**

- **Found during:** Task 1 (Column type implementations)
- **Issue:** TypeScript TS2352 error - `Record<string, unknown>` cannot be cast directly to `StatusColumnSettings` because neither type overlaps sufficiently
- **Fix:** Added intermediate `unknown` cast: `column.settings as unknown as StatusColumnSettings`
- **Files modified:** `apps/docs/src/lib/mindflow/column-types/status.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero MindFlow errors
- **Committed in:** `eb543f9` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor type cast fix, no scope creep.

## Issues Encountered

None - all tasks executed smoothly after the type cast fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Types, registry, hooks, and routes are all in place for Phase 2 (Table View)
- Column registry pattern is extensible for future column types (person, dropdown, checkbox)
- Hooks connect to real Supabase tables created in Plan 01-01
- Placeholder pages ready to be replaced with actual UI components

---

_Phase: 01-foundation_
_Completed: 2026-03-05_

## Self-Check: PASSED

- 13/13 created files found on disk
- 3/3 task commits verified in git log
