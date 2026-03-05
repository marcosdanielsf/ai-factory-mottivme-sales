# MindFlow - Stack Recommendations

**Date:** 2026-03-05
**Sources:** `~/pesquisa-pm-tool-2026.md`, `.planning/codebase/STACK.md`, `.planning/PROJECT.md`

---

## 1. Existing Stack (Already in AI Factory)

These are non-negotiable -- MindFlow lives inside the AI Factory monorepo and inherits this stack.

| Technology              | Version | Role                  | Notes                                            |
| ----------------------- | ------- | --------------------- | ------------------------------------------------ |
| React                   | 19.2.3  | UI framework          | Latest stable, concurrent features available     |
| TypeScript              | ~5.8.2  | Language              | Target ES2022                                    |
| Vite                    | 6.2.0   | Bundler/dev server    | Port 3000, manual chunks configured              |
| Tailwind CSS            | 4.1.18  | Styling               | v4 with `@tailwindcss/postcss`, utility-first    |
| React Router DOM        | 7.11.0  | Routing               | HashRouter (static hosting on Vercel)            |
| Supabase JS             | 2.89.0  | Backend               | Auth, PostgreSQL, Realtime, Storage              |
| Recharts                | 3.6.0   | Charts                | Already used for dashboards -- reuse for widgets |
| @tanstack/react-virtual | 3.13.18 | Virtual scrolling     | Already installed -- use for large boards        |
| Lucide React            | 0.562.0 | Icons                 | Already the icon standard                        |
| pnpm                    | 9.15.0  | Package manager       | Workspace protocol                               |
| Turborepo               | 2.3.0   | Monorepo orchestrator | Tasks: build, dev, lint, typecheck               |

**Constraint:** All new libraries must be compatible with React 19, Vite 6, and Tailwind v4. No Next.js-specific libraries (this is a Vite SPA).

---

## 2. New Libraries Required

### 2.1 TanStack Table v8

| Field          | Value                                         |
| -------------- | --------------------------------------------- |
| **Package**    | `@tanstack/react-table`                       |
| **Version**    | `8.21.x` (latest 8.x stable)                  |
| **Bundle**     | ~15KB gzipped                                 |
| **License**    | MIT                                           |
| **Confidence** | HIGH -- industry standard for headless tables |

**Why:** Headless table engine with full control over rendering. Supports column resizing, sorting, filtering, grouping, row selection, pagination, and pinning. Perfect for Monday-style table view where we control every pixel with Tailwind.

**Why not AG Grid:** AG Grid Community is powerful but opinionated on styling. MindFlow needs custom cell renderers (Status chips, Person avatars, inline editors) that are easier to build with a headless approach. AG Grid Enterprise features (row grouping, pivoting) are commercial-licensed.

**Integration notes:**

- Pairs with `@tanstack/react-virtual` (already installed) for virtualizing 1000+ row boards
- Column definitions map directly to MindFlow's custom field types (Status, Date, Person, etc.)
- Each cell renderer is a React component styled with Tailwind

### 2.2 @dnd-kit

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| **Packages**   | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Version**    | `6.3.x` / `8.0.x` / `3.2.x` (latest stable per package)    |
| **Bundle**     | ~13KB gzipped (all three)                                  |
| **License**    | MIT                                                        |
| **Confidence** | HIGH -- best React-first DnD library                       |

**Why:** Needed for Kanban card dragging, board group reordering, column reordering, dashboard widget arrangement, and item reordering within table view. Smooth built-in animations, excellent accessibility (ARIA live regions, keyboard support), and React-first architecture.

**Why not alternatives:**

- `pragmatic-drag-and-drop` (Atlassian): Framework-agnostic, requires more manual animation work. Smaller bundle (~8KB) but worse DX for React-heavy use cases.
- `hello-pangea/dnd` (react-beautiful-dnd fork): 30KB bundle, limited to vertical/horizontal lists (no free-form grid placement for dashboards).
- `react-dnd`: Lower-level API, more boilerplate, HTML5 backend has mobile issues.

**Integration notes:**

- `@dnd-kit/sortable` for lists (Kanban columns, group items, sidebar)
- `@dnd-kit/core` with custom collision detection for cross-column Kanban moves
- Combine with `react-grid-layout` for dashboard (see below) -- they handle different use cases

### 2.3 react-grid-layout

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| **Package**    | `react-grid-layout`                              |
| **Version**    | `1.5.x` (latest stable)                          |
| **Bundle**     | ~20KB gzipped                                    |
| **License**    | MIT                                              |
| **Confidence** | HIGH -- de facto standard for dashboard builders |

**Why:** Dashboard builder with drag-and-drop widget placement AND resize. Supports responsive breakpoints, collision detection, and serializable layouts (save to Supabase as JSON). Used by Grafana, Datadog, and many dashboard products.

**Why not @dnd-kit alone:** @dnd-kit handles drag-and-drop but not grid-based resize with collision avoidance. Building a full dashboard layout engine from scratch with @dnd-kit would take weeks and produce an inferior result.

**Integration notes:**

- Layout config stored as JSONB in Supabase (`dashboard_layouts` table)
- Each widget is a React component (Recharts chart, number card, table summary, etc.)
- CSS import required: `react-grid-layout/css/styles.css` and `react-resizable/css/styles.css`
- May need Tailwind `@layer` adjustments to prevent style conflicts

### 2.4 cmdk

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| **Package**    | `cmdk`                                  |
| **Version**    | `1.1.x` (latest stable)                 |
| **Bundle**     | ~5KB gzipped                            |
| **License**    | MIT                                     |
| **Confidence** | HIGH -- used by Vercel, Linear, Raycast |

**Why:** Command palette (Cmd+K) for fast navigation between boards, search items, switch views, run actions. ClickUp and Linear both use this pattern. Unstyled/headless, works perfectly with Tailwind.

**Integration notes:**

- Global keyboard shortcut `Cmd+K` / `Ctrl+K`
- Search scopes: Boards, Items, Views, Commands (create board, switch view, etc.)
- Fuzzy matching built-in (or pair with `fuse.js` for advanced fuzzy search)
- Render inside a Tailwind-styled dialog/overlay

### 2.5 TipTap v2

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| **Packages**   | `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*` |
| **Version**    | `2.12.x` (latest v2 stable)                                   |
| **Bundle**     | ~40-80KB gzipped (depends on extensions)                      |
| **License**    | MIT (core), paid (collaboration, AI)                          |
| **Confidence** | MEDIUM-HIGH -- best rich text for React, but heavy            |

**Why:** Rich text editor for item descriptions, comments/activity feed, and future Docs feature. Built on ProseMirror with 50+ official extensions (slash commands, mentions, tables, task lists, code blocks). Real-time collaboration possible via Yjs integration (future).

**Why not alternatives:**

- `Lexical` (Meta): Newer, potentially better performance, but fewer extensions and less mature ecosystem. Good alternative if TipTap bundle size becomes a problem.
- `Slate`: Stale development, known bugs with React 18+, undocumented breaking changes.
- `Quill`: Dated API, poor TypeScript support, not headless.

**Integration notes:**

- Start with `@tiptap/starter-kit` (bold, italic, headings, lists, code blocks, blockquote)
- Add incrementally: `@tiptap/extension-mention` (@ mentions), `@tiptap/extension-placeholder`, `@tiptap/extension-task-list`
- For item descriptions: minimal config (no slash commands)
- For future Docs: full config (slash commands, tables, embeds)
- Serialize to JSON (ProseMirror doc format) and store in Supabase JSONB column

---

## 3. Supporting Libraries (Small Additions)

| Package               | Version  | Bundle         | Purpose                                             | Confidence  |
| --------------------- | -------- | -------------- | --------------------------------------------------- | ----------- |
| `react-day-picker`    | `9.6.x`  | ~10KB          | Date picker for Date columns                        | HIGH        |
| `react-colorful`      | `5.6.x`  | ~2.5KB         | Color picker for Status label customization         | HIGH        |
| `react-number-format` | `5.5.x`  | ~7KB           | Number/currency formatting for Number columns       | HIGH        |
| `react-dropzone`      | `14.3.x` | ~8KB           | File upload for File columns                        | MEDIUM-HIGH |
| `date-fns`            | `4.1.x`  | tree-shakeable | Date utilities (formatting, relative time)          | HIGH        |
| `zustand`             | `5.0.x`  | ~2KB           | Lightweight state for board/view state              | HIGH        |
| `immer`               | `10.1.x` | ~6KB           | Immutable state updates for complex board mutations | MEDIUM-HIGH |
| `fuse.js`             | `7.1.x`  | ~5KB           | Fuzzy search for command palette and filters        | MEDIUM      |

**Note on Zustand:** The codebase currently uses React Context for state. For MindFlow, Zustand is recommended for board-level state (selected items, active filters, view config) because it avoids unnecessary re-renders across the board component tree. Start with Zustand for new MindFlow state; do NOT refactor existing AI Factory state.

---

## 4. What NOT to Use

| Library                          | Reason                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AG Grid** (any edition)        | Opinionated rendering conflicts with custom cell editors. Commercial license for advanced features. TanStack Table + custom UI is more flexible.                                   |
| **react-beautiful-dnd**          | Unmaintained (archived by Atlassian). Fork `hello-pangea/dnd` exists but 30KB and limited to lists.                                                                                |
| **react-dnd**                    | Low-level, excessive boilerplate, HTML5 backend breaks on mobile. @dnd-kit is strictly superior for React.                                                                         |
| **Slate** (rich text)            | Stale development, React 18+ compatibility issues, poor documentation.                                                                                                             |
| **Quill**                        | Legacy API, bad TypeScript support, not headless.                                                                                                                                  |
| **Chakra UI / MUI / Ant Design** | AI Factory uses Tailwind exclusively. Adding a component library creates styling conflicts and bundle bloat.                                                                       |
| **Apollo Client / urql**         | No GraphQL server exists. Supabase JS client handles all data fetching. Overkill for internal API.                                                                                 |
| **Redux / MobX**                 | Zustand is lighter, simpler, and sufficient. Redux is over-engineered for this use case.                                                                                           |
| **Framer Motion**                | 30KB+ bundle. Use CSS transitions + Tailwind `animate-*` for simple animations. @dnd-kit has built-in drag animations. Only consider if complex page transitions are needed later. |
| **ShadCN/UI**                    | Not installed in the codebase. Adding it now creates a parallel component system. Build MindFlow components directly with Tailwind.                                                |
| **DHTMLX Gantt**                 | Commercial license. Out of scope for v1 (Gantt is v2). When needed, evaluate SVAR React Gantt (MIT).                                                                               |
| **Liveblocks**                   | Paid service for real-time collaboration. Supabase Realtime + Yjs (future) covers the same need without vendor lock-in.                                                            |

---

## 5. Architecture Decisions

### 5.1 State Management Strategy

```
Supabase (source of truth)
    |
    v
React Query / custom hooks (server state, caching, optimistic updates)
    |
    v
Zustand stores (client state: selection, filters, view config, UI state)
    |
    v
React components (render)
```

- **Server state:** Custom hooks wrapping `supabase.from('table').select()` with optimistic updates
- **Client state:** Zustand stores per board instance (avoid global store pollution)
- **No React Query (TanStack Query):** Not currently in the codebase. Adding it is a MEDIUM-confidence recommendation -- beneficial for caching/optimistic updates but adds complexity. Evaluate after v1 MVP.

### 5.2 Custom Fields Storage

```sql
-- column_values stored as JSONB per item
-- Schema validated at application layer
{
  "col_status_abc": { "label": "Working on it", "color": "#FDAB3D" },
  "col_date_def": { "value": "2026-03-15", "include_time": false },
  "col_person_ghi": { "user_ids": ["uuid1", "uuid2"] },
  "col_number_jkl": { "value": 42500, "unit": "BRL" }
}
```

### 5.3 Real-time Strategy

- **Supabase Realtime** (already in stack) for board-level broadcasts
- Subscribe per board: `supabase.channel('board:${boardId}').on('postgres_changes', ...)`
- Optimistic UI updates with rollback on conflict
- Future: Yjs + TipTap for real-time collaborative editing in Docs

### 5.4 Bundle Impact Estimate

| Library                                            | Gzipped Size | Cumulative         |
| -------------------------------------------------- | ------------ | ------------------ |
| @tanstack/react-table                              | ~15KB        | 15KB               |
| @dnd-kit (core + sortable + utilities)             | ~13KB        | 28KB               |
| react-grid-layout                                  | ~20KB        | 48KB               |
| cmdk                                               | ~5KB         | 53KB               |
| @tiptap/react + starter-kit                        | ~45KB        | 98KB               |
| zustand                                            | ~2KB         | 100KB              |
| Supporting libs (date-fns, react-day-picker, etc.) | ~30KB        | 130KB              |
| **Total new JS**                                   |              | **~130KB gzipped** |

This is acceptable for a feature of this complexity. Vite's manual chunking (already configured) should isolate MindFlow code into a separate chunk loaded only when the user navigates to MindFlow routes.

**Recommendation:** Add a manual chunk in `vite.config.ts`:

```ts
'vendor-mindflow': ['@tanstack/react-table', '@dnd-kit/core', '@dnd-kit/sortable', 'react-grid-layout', 'cmdk']
```

---

## 6. Version Pinning Summary

```jsonc
// Add to apps/docs/package.json
{
  // Core MindFlow
  "@tanstack/react-table": "^8.21.0",
  "@dnd-kit/core": "^6.3.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.0",
  "react-grid-layout": "^1.5.0",
  "cmdk": "^1.1.0",

  // Rich text (add when item descriptions are implemented)
  "@tiptap/react": "^2.12.0",
  "@tiptap/starter-kit": "^2.12.0",
  "@tiptap/extension-placeholder": "^2.12.0",
  "@tiptap/extension-mention": "^2.12.0",

  // State
  "zustand": "^5.0.0",
  "immer": "^10.1.0",

  // UI utilities
  "react-day-picker": "^9.6.0",
  "react-colorful": "^5.6.0",
  "react-number-format": "^5.5.0",
  "date-fns": "^4.1.0",

  // Types
  "@types/react-grid-layout": "^1.3.0",
}
```

**Install order recommendation:**

1. **Phase 1 (Board Engine):** `@tanstack/react-table`, `@dnd-kit/*`, `zustand`, `cmdk`, `react-day-picker`, `react-colorful`, `react-number-format`, `date-fns`
2. **Phase 2 (Dashboards + Docs):** `react-grid-layout`, `@tiptap/*`, `immer`

---

## 7. Compatibility Matrix

| Library                   | React 19 | Vite 6 | Tailwind v4            | TypeScript 5.8     |
| ------------------------- | -------- | ------ | ---------------------- | ------------------ |
| @tanstack/react-table 8.x | OK       | OK     | OK (headless)          | OK (generic types) |
| @dnd-kit 6.x/8.x          | OK       | OK     | OK (headless)          | OK                 |
| react-grid-layout 1.5.x   | OK (1)   | OK     | Needs CSS override (2) | OK (@types)        |
| cmdk 1.x                  | OK       | OK     | OK (headless)          | OK                 |
| TipTap 2.12.x             | OK       | OK     | OK (headless)          | OK                 |
| zustand 5.x               | OK       | OK     | N/A                    | OK                 |
| react-day-picker 9.x      | OK       | OK     | OK (headless)          | OK                 |

**(1)** react-grid-layout uses `React.Children` and class components internally. Tested compatible with React 19 but monitor for deprecation warnings.

**(2)** react-grid-layout ships its own CSS. Import in the MindFlow layout component and scope with Tailwind `@layer` to prevent conflicts with Tailwind v4's cascade layers.

---

_Research compiled 2026-03-05. Review before implementation to verify latest stable versions._
