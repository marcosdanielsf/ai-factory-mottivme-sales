# MindFlow Pitfalls Guide

**Date:** 2026-03-05
**Purpose:** Catalog known pitfalls for building a PM tool inside the AI Factory codebase, with warning signs, prevention strategies, and phase assignments.

---

## 1. Performance Pitfalls

### 1.1 JSONB Queries Getting Slow with 1000+ Items

**Context:** `column_values` stored as JSONB means every filter, sort, and group-by on custom fields hits JSONB operators (`->`, `->>`, `@>`). PostgreSQL does not use standard B-tree indexes on JSONB paths by default.

**Warning Signs:**

- Table view takes >500ms to load with 500+ items
- Supabase Dashboard shows sequential scans on `board_items` table
- Filters on Status or Date columns noticeably slower than filters on native columns

**Prevention Strategy:**

- Create GIN indexes on `column_values` from day 1: `CREATE INDEX idx_items_col_values ON board_items USING gin(column_values jsonb_path_ops)`
- For frequently-filtered columns (Status, Date, Person), consider extracted/materialized columns alongside JSONB
- Use `EXPLAIN ANALYZE` on every new query pattern before shipping
- Set a performance budget: any board query must return in <200ms for 1000 items

**Phase:** Phase 1 (Board Engine) — indexes must ship with the initial migration

---

### 1.2 Rendering Large Tables Without Virtualization

**Context:** The codebase already has pages like `Performance.tsx` (1586 lines) that render full DOM trees. A board with 500+ rows and 15+ columns means 7500+ DOM cells without virtualization.

**Warning Signs:**

- Scrolling becomes janky (FPS drops below 30) with 200+ visible rows
- React DevTools Profiler shows >16ms render cycles on scroll
- Memory usage climbs above 200MB on board pages
- Users report "the page freezes when I open my big board"

**Prevention Strategy:**

- Integrate TanStack Virtual from Phase 1 — not as a "later optimization"
- Virtualize both rows AND columns (horizontal virtualization matters when boards have 20+ columns)
- Set a hard rule: never render more than `viewport + 20` rows in DOM at once
- Benchmark with 1000 items x 15 columns as the stress test during development

**Phase:** Phase 1 (Table View) — must be built into the table from the start. Retrofitting virtualization is 3-5x harder.

---

### 1.3 Too Many Supabase Realtime Subscriptions

**Context:** Supabase Realtime has per-connection limits. Each board view, each widget on a dashboard, and each collaborative edit could spawn its own subscription. The existing codebase already uses Realtime in `useSupervisionRealtime.ts`.

**Warning Signs:**

- WebSocket connection drops or reconnects frequently
- Console warnings about max channels exceeded
- Updates stop arriving on some boards/widgets silently
- Supabase dashboard shows subscription count climbing with each page navigation (leak)

**Prevention Strategy:**

- One subscription per board (not per column, not per group, not per view)
- Dashboard: one subscription for the entire dashboard, fan out to widgets in-memory
- Implement a subscription manager singleton that deduplicates and cleans up on unmount
- Use Supabase `postgres_changes` with filter on `board_id` — never subscribe to entire tables
- Max budget: 5 concurrent Realtime channels per user session

**Phase:** Phase 1 (Real-time) — design the subscription architecture before implementing any real-time feature

---

### 1.4 DnD Performance with Many Items

**Context:** @dnd-kit recalculates layouts on every drag move. With 500+ Kanban cards across 8 columns, or 1000 table rows with sortable groups, drag operations can stutter.

**Warning Signs:**

- Visible lag between cursor movement and card following during drag
- CPU spikes above 50% during drag operations
- Kanban columns with 100+ cards cause drag to freeze momentarily on enter

**Prevention Strategy:**

- Kanban: paginate/collapse columns beyond 50 items — show "Load more" at bottom
- Table: use `@dnd-kit/sortable` with virtualized list (only measure visible items)
- Disable auto-scroll animation during drag if FPS drops below 30
- Use `useMemo` aggressively on sortable item lists — never recompute all items on single-item drag
- Profile with Chrome Performance tab during drag operations as part of QA

**Phase:** Phase 1 (Kanban + Table DnD) — set item limits per container from day 1

---

## 2. Architecture Pitfalls

### 2.1 Coupling Views to Data Model

**Context:** If Table view directly queries `board_items` with specific column expectations, and Kanban view does the same with different transforms, changing the data model breaks all views simultaneously.

**Warning Signs:**

- Adding a new column type requires changes in 3+ view components
- Each view has its own data fetching logic with slightly different transforms
- Renaming a database column breaks Table view but not Kanban (or vice versa)
- View components import from `supabaseData.ts` directly instead of through a shared abstraction

**Prevention Strategy:**

- Single `useBoardData(boardId)` hook that returns normalized items + columns + groups
- Views receive pre-transformed data via a `ViewAdapter` pattern:
  ```
  useBoardData() -> raw data
  useTableAdapter(boardData) -> { rows, columns, cellRenderers }
  useKanbanAdapter(boardData) -> { columns: KanbanColumn[], cards }
  ```
- Views are pure renderers — they never query Supabase directly
- Column type renderers are a registry, not switch/case blocks in each view

**Phase:** Phase 1 (Board Engine) — this is the foundational architecture decision

---

### 2.2 Not Designing Column Type System as Extensible Registry

**Context:** Monday.com has 30+ column types. Starting with a `switch(type)` block in the renderer means every new type requires modifying the same file, growing it indefinitely.

**Warning Signs:**

- A single `renderCell()` function exceeds 200 lines
- Adding a new column type touches 5+ files (renderer, editor, filter, sort, serializer)
- Developers avoid adding column types because the switch/case is intimidating
- Column type behavior (render, edit, filter, sort, validate, serialize) is scattered across different files

**Prevention Strategy:**

- Define a `ColumnTypeDefinition` interface from day 1:
  ```typescript
  interface ColumnTypeDefinition {
    type: string;
    label: string;
    icon: LucideIcon;
    renderCell: (value: any, config: ColumnConfig) => ReactNode;
    renderEditor: (
      value: any,
      onChange: (v: any) => void,
      config: ColumnConfig,
    ) => ReactNode;
    filterOperators: FilterOperator[];
    sortComparator: (a: any, b: any) => number;
    serialize: (value: any) => JsonValue;
    deserialize: (raw: JsonValue) => any;
    defaultValue: () => any;
    validate: (value: any, config: ColumnConfig) => ValidationResult;
  }
  ```
- Register types in a `Map<string, ColumnTypeDefinition>` — adding a type = adding one file
- Never import column-specific logic in view components — always go through the registry

**Phase:** Phase 1 (Board Engine) — this is the single most important architecture decision for extensibility

---

### 2.3 Monolithic Board Component

**Context:** The codebase already has `Performance.tsx` at 1586 lines and `supabase-sales-ops.ts` at 1471 lines. A board page that handles table rendering, inline editing, toolbar, filters, group headers, sub-items, column resizing, and DnD in one file will easily hit 2000+ lines.

**Warning Signs:**

- Board component exceeds 500 lines
- More than 5 `useState` calls in the board component
- Developers need to scroll through 1000+ lines to find where a specific behavior lives
- Multiple developers cannot work on the board page simultaneously without merge conflicts

**Prevention Strategy:**

- Enforce a 300-line soft limit per component file from day 1
- Decompose the board into explicit sub-components with clear contracts:
  ```
  BoardPage (route, layout, toolbar)
  BoardHeader (board name, view tabs, share)
  BoardToolbar (filters, sort, group-by, search, bulk actions)
  BoardTable (virtualized grid shell)
  TableRow (single row renderer)
  TableCell (delegates to column type registry)
  CellEditor (inline editing wrapper)
  GroupHeader (collapsible group)
  SubItemsPanel (expandable sub-items)
  ```
- State management in hooks, not in components: `useBoardState()`, `useSelection()`, `useFilters()`
- PR review gate: reject any component file exceeding 500 lines

**Phase:** Phase 1 — enforce from the first component created

---

### 2.4 Not Virtualizing from Day 1

**Context:** Retrofitting virtualization into an existing table is painful. Absolute positioning required by virtual scrollers conflicts with normal CSS flow. Components that assume all items are in DOM (e.g., Ctrl+F browser search, scroll-to-item) break when virtualization is added later.

**Warning Signs:**

- Table works fine in development (10-50 items) but production boards have 500+
- "We'll add virtualization later" appears in code comments or planning docs
- CSS relies on `position: relative` flow layout inside the table body
- Features like "scroll to item" or "highlight search match" assume DOM presence

**Prevention Strategy:**

- Use TanStack Virtual from the very first table implementation
- Design all table CSS around absolute positioning from the start
- Implement `scrollToItem(itemId)` as a first-class API on the virtual scroller
- Browser Ctrl+F will not work with virtualization — plan an in-app search from Phase 1

**Phase:** Phase 1 (Table View) — non-negotiable starting point

---

## 3. UX Pitfalls

### 3.1 Inline Editing Focus Management

**Context:** Monday.com's core UX is click-to-edit cells. This requires precise focus management: clicking a cell opens an editor, Tab moves to next cell, Escape cancels, clicking outside saves. Getting this wrong makes the table feel broken.

**Warning Signs:**

- Clicking a cell sometimes opens the editor, sometimes does not
- Tab key moves focus to browser elements instead of next cell
- Two cells appear in edit mode simultaneously
- Editing a cell in a virtualized row and scrolling away loses the edit
- Date picker or dropdown portal closes when clicking inside it (focus steal)

**Prevention Strategy:**

- Single source of truth for "active cell": `{ rowId, columnId } | null` in state
- Only ONE cell can be in edit mode at a time — enforced at the state level
- Tab/Shift+Tab navigation: compute next/prev cell coordinates, set active cell, scroll into view
- Portaled editors (date picker, dropdown) must use `onPointerDownOutside` from Radix, not generic `onBlur`
- Escape = cancel (revert value), Enter = confirm (save value), Tab = confirm + move
- Test matrix: click, double-click, Tab, Shift+Tab, Escape, Enter, click-outside for EVERY column type

**Phase:** Phase 1 (Table View) — inline editing IS the core UX

---

### 3.2 DnD Visual Feedback and Accessibility

**Context:** @dnd-kit provides hooks but visual feedback (drop indicators, card previews, placeholder gaps) must be implemented manually. Poor DnD feedback makes the board feel unpolished.

**Warning Signs:**

- Users cannot tell where an item will be dropped
- No visible gap or indicator appears between items during drag
- Dragging to empty Kanban columns has no visual target
- Screen reader users cannot use the board at all
- Drop animation is absent — items "teleport" to new position

**Prevention Strategy:**

- Implement drop indicator line (2px colored bar) between items during drag-over
- Empty column drop zone: dashed border + "Drop here" text appears on drag-enter
- Drag preview: semi-transparent clone of the card/row, offset from cursor
- Drop animation: use @dnd-kit's `measuring` config for smooth layout shift
- Accessibility: implement `announcements` prop on DndContext for screen reader narration
- Keyboard DnD: Space to grab, arrow keys to move, Space to drop

**Phase:** Phase 1 (Kanban) — DnD without proper feedback feels like a bug

---

### 3.3 Undo/Redo Complexity

**Context:** Users expect Ctrl+Z to work, especially with inline editing. Implementing undo/redo for a board with multiple concurrent operations (inline edits, DnD reorders, bulk actions, column changes) is architecturally complex.

**Warning Signs:**

- Users accidentally delete items and have no way to recover
- Ctrl+Z undoes the wrong action (browser default undo vs app undo)
- Undo after a DnD reorder sends items to wrong positions
- Undo stack grows unbounded in memory
- Multi-user conflict: User A undoes an action that User B's edit depends on

**Prevention Strategy:**

- Phase 1: Do NOT implement full undo/redo. Instead:
  - Soft-delete with "Undo" toast (5-second window) for destructive actions
  - Confirmation dialog for bulk deletes and column removal
  - "Recently deleted" view (trash) accessible from board menu
- Phase 2+: If full undo/redo is needed, use command pattern with operation log
- Never try to undo server-side changes via reverse operations — use event sourcing or versioned state
- Cap undo stack at 50 operations

**Phase:** Phase 1 (soft-delete + undo toast only), Phase 3 (full undo/redo if validated as needed)

---

### 3.4 Keyboard Navigation in Tables

**Context:** Power users navigate Monday.com entirely via keyboard (arrow keys between cells, Enter to edit, Escape to exit). Without keyboard nav, the table feels like a display-only grid.

**Warning Signs:**

- Users report "I can't Tab through cells"
- Arrow keys scroll the page instead of moving between cells
- No visible focus indicator on the active cell
- Keyboard users get "trapped" inside an editor with no way to navigate out

**Prevention Strategy:**

- Implement a focus grid: arrow keys move a visual focus ring between cells
- Enter on focused cell = enter edit mode. Escape = exit edit mode and return to grid nav
- Focus ring must be visible (2px ring, high contrast) — not just the browser default outline
- Prevent default on arrow keys when focus is inside the grid (avoid page scroll)
- Shift+Space = select row. Ctrl+Space = select column. Space = toggle checkbox (if checkbox cell)
- Test without mouse: can a user create an item, fill all fields, and save using only keyboard?

**Phase:** Phase 1 (Table View) — keyboard nav is an accessibility requirement, not a nice-to-have

---

## 4. Integration Pitfalls

### 4.1 Breaking Existing 30+ Pages When Adding New Routes

**Context:** The AI Factory already has 30+ pages with HashRouter (React Router v7). Adding MindFlow routes (`/boards`, `/boards/:id`, `/dashboards/:id`) could conflict with existing routes, break the sidebar, or cause lazy-loading issues.

**Warning Signs:**

- Existing pages return 404 or show blank after MindFlow routes are added
- Sidebar navigation breaks or shows MindFlow pages for non-MindFlow users
- Bundle size increases for ALL pages because MindFlow components are eagerly imported
- Route params from MindFlow routes conflict with existing param patterns

**Prevention Strategy:**

- Namespace all MindFlow routes under `/mindflow/*` — never add top-level routes
- Lazy-load the entire MindFlow module: `const MindFlowRoutes = lazy(() => import('./mindflow/routes'))`
- MindFlow gets its own sub-router — changes to MindFlow routes never touch the main route file
- Sidebar: MindFlow section is a separate component, conditionally rendered
- Test after integration: navigate to every existing page and verify no regressions

**Phase:** Phase 1 (Setup) — route structure must be defined before any page is created

---

### 4.2 Supabase RLS Policies Conflicting with Existing Ones

**Context:** The AI Factory Supabase has existing RLS policies on tables like `agent_versions`, `crm_leads`, etc. MindFlow tables need their own RLS, and cross-table queries (e.g., linking board items to GHL contacts) could hit unexpected RLS blocks. The codebase concern about `vw_client_costs_summary` having 7 dependent views shows how interconnected the schema is.

**Warning Signs:**

- MindFlow queries return empty results even though data exists (RLS silently filters)
- Existing pages break after MindFlow migrations run
- `GRANT` statements in MindFlow migrations affect roles used by existing features
- Performance degrades on existing queries because new RLS policies add evaluation overhead

**Prevention Strategy:**

- MindFlow tables use a `mindflow_` prefix to avoid any naming collision
- MindFlow RLS policies reference only MindFlow tables — never add policies to existing tables
- Test RLS in isolation: create a test user, verify they can only see their boards/items
- Never modify existing views or functions in MindFlow migrations
- Use a dedicated migration prefix (e.g., `070-079` range) to keep MindFlow SQL organized

**Phase:** Phase 1 (Database Setup) — schema design and RLS must be reviewed before first migration

---

### 4.3 Bundle Size Explosion from New Libraries

**Context:** MindFlow requires several new libraries: TanStack Table (~15KB), @dnd-kit (~13KB), TanStack Virtual (~5KB), cmdk (~5KB), potentially react-grid-layout (~40KB) for dashboards, plus TipTap (~100KB+) for rich text. Current bundle size is unknown but the app already loads 30+ pages.

**Warning Signs:**

- Initial page load time increases by >1 second after MindFlow is added
- Lighthouse performance score drops below 60
- Users on slow connections (mobile, rural) report the app is unusable
- `npm run build` output shows chunks >500KB

**Prevention Strategy:**

- Lazy-load ALL MindFlow code — zero bytes added to non-MindFlow pages
- Within MindFlow, lazy-load heavy views: Gantt, Dashboard builder, rich text editor
- Set a bundle budget per chunk: max 200KB gzipped for the MindFlow entry chunk
- Audit with `npx vite-bundle-visualizer` before and after MindFlow integration
- Prefer lighter alternatives when possible: cmdk (5KB) over heavier command palette libs
- TipTap: only load when user opens a doc/comment — never in the main board bundle

**Phase:** Phase 1 (Setup) — configure code splitting and set budget before adding any library

---

## 5. Scope Pitfalls

### 5.1 Trying to Build Monday.com in One Go

**Context:** The research document catalogs 30+ column types, 14+ views, 50+ automation triggers, dashboard widgets, docs, forms, and an apps framework. The temptation to "build it all" will fragment focus and produce a half-working system.

**Warning Signs:**

- Phase 1 scope creep: "Let's also add Gantt since we're building views anyway"
- 4+ weeks into Phase 1 with no usable board (still building infrastructure)
- Column type count exceeds 10 before any board is used in production
- Discussions about automation engine before table view works reliably
- Comparing progress to Monday.com (a 12-year-old product with 1800+ employees)

**Prevention Strategy:**

- Phase 1 hard scope: Table view + Kanban view + 7 column types (Text, Number, Status, Date, Person, Dropdown, Checkbox) + inline editing + DnD
- Definition of done for Phase 1: Marcos can create a board, add items, edit inline, drag in Kanban, and use it daily for a real workflow
- No Phase 2 work starts until Phase 1 is used in production for 1+ week
- Track "time to first real use" as the primary metric — not feature count
- Every feature request during Phase 1 goes to a backlog file, not into the sprint

**Phase:** All phases — this is an ongoing discipline

---

### 5.2 Adding Automations Before Board Engine is Solid

**Context:** Automations (trigger + condition + action) are the #2 feature request after boards. But automations depend on a stable event system, reliable data model, and predictable state changes. Building automations on a shaky foundation creates cascading bugs.

**Warning Signs:**

- Board data model changes require updating automation trigger definitions
- Automations fire incorrectly because column value format changed
- Users report "my automation stopped working" after unrelated board updates
- Automation execution errors are silent (no logs, no notifications)
- Developers spend more time fixing automation edge cases than building board features

**Prevention Strategy:**

- Automations are Phase 2 minimum — board engine must be stable first
- Board engine must emit structured events (item.created, column.changed, status.changed) before automations are considered
- Start with 3 automations max: status change notification, due date reminder, item assignment notification
- Every automation must have: execution log, error state, manual re-trigger, disable toggle
- Do NOT build a visual automation builder in Phase 2 — use predefined recipes only

**Phase:** Phase 2 at earliest — only after board engine has been stable in production for 2+ weeks

---

### 5.3 Over-Engineering Column Types

**Context:** Monday.com's Formula column supports IF/SUM/CONCATENATE with 10K char limit. Mirror columns project data across boards. These are powerful but extremely complex to implement. Building them early steals time from core functionality.

**Warning Signs:**

- Implementing Formula column before basic Text/Number/Status work reliably
- Column type `ColumnTypeDefinition` interface has 20+ methods before 5 types are implemented
- Spending 1+ week on a single column type
- Building column types nobody has asked for yet
- Column config UI is more complex than the board itself

**Prevention Strategy:**

- Phase 1 column types (7 only): Text, Number, Status, Date, Person, Dropdown, Checkbox
- Phase 2 additions (5): URL, Rating, Email, Phone, Files
- Phase 3 (complex): Formula, Dependencies, Connect Boards, Mirror
- Each column type must be shippable in <2 days — if it takes longer, it is too complex for the current phase
- Validate need before building: which column type is Marcos actually blocked on?
- Formula columns: use a proven parser library (mathjs), do not write a custom expression engine

**Phase:** Phased rollout — 7 types in Phase 1, expand only based on validated need

---

## Summary: Phase Assignment Matrix

| Pitfall                 | Phase 1 Action                               | Phase 2+ Action                        |
| ----------------------- | -------------------------------------------- | -------------------------------------- |
| JSONB slow queries      | GIN index on `column_values`                 | Extracted columns for hot paths        |
| No virtualization       | TanStack Virtual in Table from day 1         | Extend to Kanban if needed             |
| Realtime subscriptions  | 1 channel per board, subscription manager    | Dashboard channels                     |
| DnD performance         | Item limits per container, profile during QA | Optimize with requestAnimationFrame    |
| Views coupled to data   | `useBoardData()` + ViewAdapter pattern       | New views plug in without data changes |
| Column type system      | Registry pattern with 7 types                | Extend registry, never modify core     |
| Monolithic components   | 300-line limit, decomposed from start        | PR gate on file size                   |
| Inline editing focus    | Single active cell state, full test matrix   | Edge cases from user feedback          |
| DnD feedback            | Drop indicators, drag preview, empty zones   | Keyboard DnD, screen reader            |
| Undo/redo               | Soft-delete + undo toast                     | Full command pattern if validated      |
| Keyboard navigation     | Arrow keys, Enter/Escape, focus ring         | Advanced shortcuts                     |
| Route conflicts         | `/mindflow/*` namespace, lazy-load           | Sub-routing for new features           |
| RLS conflicts           | `mindflow_` prefix, isolated policies        | Cross-table joins with care            |
| Bundle size             | Lazy-load all, budget per chunk              | Audit quarterly                        |
| Scope creep             | Hard 7 column types, 2 views, daily use      | Expand on validated need only          |
| Premature automations   | Do not build                                 | 3 recipes after board stable 2 weeks   |
| Over-engineered columns | 2-day max per type, no Formula               | Formula/Mirror in Phase 3              |

---

_Pitfalls guide: 2026-03-05 | Sources: pesquisa-pm-tool-2026.md, CONCERNS.md, PROJECT.md_
