# Roadmap: MindFlow

## Overview

MindFlow delivers flexible project management boards with typed columns, inline editing, and multiple views inside the existing AI Factory app. The roadmap moves from database foundation through core table experience, drag-and-drop interactions, Kanban view, filtering/views infrastructure, item detail and CRUD richness, real-time collaboration and permissions, and finally navigation polish with templates and multi-tenant isolation. Each phase builds on the previous, and the system is usable from Phase 2 onward.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Database schema, types, column registry, route scaffolding, and Supabase hooks
- [ ] **Phase 2: Table View Core** - Board page with table view, inline editing, groups, and basic item creation
- [ ] **Phase 3: Drag-and-Drop + Column Types** - DnD for items/groups/columns, remaining column types, bulk actions
- [ ] **Phase 4: Kanban View** - Kanban cards grouped by status/column with DnD between columns
- [ ] **Phase 5: Filtering, Sorting, and Views Infrastructure** - Filter builder, sort, group-by, view CRUD, saved view state
- [ ] **Phase 6: Item Detail + CRUD Richness** - Item detail panel, subitems, duplicate, archive, activity trail
- [ ] **Phase 7: Real-time + Permissions** - Supabase Realtime sync, presence indicators, role-based access with RLS
- [ ] **Phase 8: Navigation, Templates, and Multi-tenant** - Command palette, sidebar navigation, board templates, multi-tenant isolation

## Phase Details

### Phase 1: Foundation

**Goal**: Database and infrastructure exist so all subsequent phases can build features on a solid schema
**Depends on**: Nothing (first phase)
**Requirements**: BOARD-07
**Success Criteria** (what must be TRUE):

1. All 6 mindflow\_ tables exist in Supabase with correct columns, indexes, and GIN index on column_values
2. TypeScript types for Board, Group, Item, View, Column are defined and importable
3. Column registry exists with Text, Number, Status, Date column types registered (renderCell, renderEditor, validate, serialize, deserialize, sortComparator, filterOperators)
4. MindFlow routes are lazy-loaded at /mindflow/\* with zero impact on existing 30+ pages (verified by unchanged bundle of non-mindflow routes)
5. useBoard, useBoardItems, useBoardGroups hooks connect to Supabase and return data
   **Plans**: TBD

Plans:

- [x] 01-01: Database schema + migrations + indexes + RPC functions (Wave 1)
- [ ] 01-02: TypeScript types + column registry + Supabase hooks + route scaffolding (Wave 2, depends on 01-01)

### Phase 2: Table View Core

**Goal**: User can create a board, add groups and items, and edit cell values inline in a functional table
**Depends on**: Phase 1
**Requirements**: BOARD-01, BOARD-03, BOARD-06, TABLE-01, TABLE-02, TABLE-06, TABLE-07, CRUD-01, NAV-02
**Success Criteria** (what must be TRUE):

1. User can create a board with name, description, and select typed columns (Text, Number, Status, Date)
2. User can create collapsible, colorable groups within a board and add items inline at the bottom of each group
3. User can click any cell and edit it with the appropriate type-specific editor (text input, number input, color-coded status dropdown, date picker)
4. Table has sticky header and sticky first column, and virtualizes rows for 1000+ items without lag
5. User can navigate between cells using Tab key
   **Plans**: TBD

Plans:

- [ ] 02-01: BoardProvider context + BoardPage + BoardHeader + board list page
- [ ] 02-02: GroupContainer + ItemRow + inline editing + cell navigation + virtualization

### Phase 3: Drag-and-Drop + Column Types

**Goal**: User can rearrange everything via drag-and-drop and use all 7 MVP column types with bulk operations
**Depends on**: Phase 2
**Requirements**: BOARD-02, BOARD-05, TABLE-03, TABLE-05
**Success Criteria** (what must be TRUE):

1. User can reorder items within and between groups by dragging rows
2. User can reorder columns by dragging column headers, and resize columns by dragging borders
3. User can add, rename, reorder, and delete columns via column header menu
4. User can select multiple rows (checkbox + Shift+click range) and perform bulk actions (delete, move, change status, assign) via floating toolbar
   **Plans**: TBD

Plans:

- [ ] 03-01: @dnd-kit integration for item/group/column reorder + fractional indexing
- [ ] 03-02: Person, Dropdown, Checkbox, URL, Rating column types + bulk selection + floating toolbar

### Phase 4: Kanban View

**Goal**: User can visualize and manage board items as Kanban cards with drag-and-drop between status columns
**Depends on**: Phase 3
**Requirements**: KANBAN-01, KANBAN-02, KANBAN-03, KANBAN-04
**Success Criteria** (what must be TRUE):

1. User can switch to Kanban view and see items as cards grouped by Status column
2. User can drag cards between Kanban columns to change status (updates column_values in real-time)
3. User can group Kanban by any Status, Person, or Dropdown column
4. User can configure which fields appear on Kanban cards, and columns show card count and can be collapsed
   **Plans**: TBD

Plans:

- [ ] 04-01: KanbanView component + DnD between columns + card layout config + view switching tabs

### Phase 5: Filtering, Sorting, and Views Infrastructure

**Goal**: User can create multiple saved views with independent filter/sort/group-by settings
**Depends on**: Phase 4
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05, FILTER-06, TABLE-04
**Success Criteria** (what must be TRUE):

1. User can filter items by any column with type-appropriate operators (equals, contains, is empty, greater than, etc.) and combine filters with AND/OR logic
2. User can sort items by any column (asc/desc) including multi-column sort
3. User can group items by any column with collapsible group headers showing counts
4. User can create, rename, and delete views; each view saves its own filter/sort/group-by/hidden columns independently
5. User can search items by name via quick filter bar
   **Plans**: TBD

Plans:

- [ ] 05-01: Filter builder UI + sort config + group-by picker + quick search
- [ ] 05-02: View CRUD + saved state per view + hidden columns per view

### Phase 6: Item Detail + CRUD Richness

**Goal**: User can open item details, manage subitems, and perform advanced CRUD operations with full audit trail
**Depends on**: Phase 2
**Requirements**: BOARD-04, CRUD-02, CRUD-03, CRUD-04, CRUD-05, CRUD-06, CRUD-07
**Success Criteria** (what must be TRUE):

1. User can open an item detail panel (sidebar) showing all fields, rich text description, and activity log
2. User can create subitems (1 level deep) under any item, visible as collapsible rows in table view
3. User can duplicate, delete (with confirmation), and archive items
4. User can move items between groups via context menu
5. System logs changes per item (who changed what field, when) visible in the item detail activity tab
   **Plans**: TBD

Plans:

- [ ] 06-01: Item detail sidebar + rich text description + activity trail
- [ ] 06-02: Subitems + duplicate + delete + archive + move via context menu

### Phase 7: Real-time + Permissions

**Goal**: Multiple users can collaborate on the same board with real-time updates and role-based access control
**Depends on**: Phase 5
**Requirements**: RT-01, RT-02, PERM-01, PERM-02, PERM-03
**Success Criteria** (what must be TRUE):

1. Changes made by one user appear in real-time on other users' screens without page refresh
2. Board shows presence indicators (avatars of users currently viewing the board)
3. Board supports 3 roles (Admin, Member, Viewer) with Viewer unable to edit and Member unable to manage board settings
4. Board owner can invite users and assign roles via a share dialog
5. Supabase RLS enforces permissions at database level (verified by attempting unauthorized access)
   **Plans**: TBD

Plans:

- [ ] 07-01: Supabase Realtime channel per board + optimistic update dedup + presence
- [ ] 07-02: Permissions model (roles, invites, share dialog) + RLS policies

### Phase 8: Navigation, Templates, and Multi-tenant

**Goal**: User has polished navigation, can start from templates, and boards are isolated per tenant
**Depends on**: Phase 7
**Requirements**: NAV-01, NAV-03, NAV-04, TPL-01, TPL-02, MT-01, MT-02
**Success Criteria** (what must be TRUE):

1. MindFlow has a dedicated sidebar section with workspace/board navigation and breadcrumb showing current location
2. Command palette (Cmd+K) allows quick navigation to any board, item, or action
3. User can create a board from 4 pre-built templates (Projeto, CRM, Sprint, Onboarding) with pre-configured columns, groups, and sample items
4. Boards are scoped to location_id with RLS policies ensuring client isolation
5. Internal MOTTIVME workspace serves as first tenant and validates multi-tenant isolation
   **Plans**: TBD

Plans:

- [ ] 08-01: Sidebar navigation + breadcrumbs + command palette (cmdk)
- [ ] 08-02: Board templates (4 pre-built) + multi-tenant isolation (location_id RLS)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
Note: Phase 6 depends on Phase 2 (not Phase 5), so it CAN be parallelized with Phases 3-5 if desired.

| Phase                                    | Plans Complete | Status      | Completed |
| ---------------------------------------- | -------------- | ----------- | --------- |
| 1. Foundation                            | 1/2            | In progress | -         |
| 2. Table View Core                       | 0/2            | Not started | -         |
| 3. DnD + Column Types                    | 0/2            | Not started | -         |
| 4. Kanban View                           | 0/1            | Not started | -         |
| 5. Filtering + Views                     | 0/2            | Not started | -         |
| 6. Item Detail + CRUD                    | 0/2            | Not started | -         |
| 7. Real-time + Permissions               | 0/2            | Not started | -         |
| 8. Navigation + Templates + Multi-tenant | 0/2            | Not started | -         |
