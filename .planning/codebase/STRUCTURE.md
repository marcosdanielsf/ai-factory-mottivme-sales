# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
ai-factory-mottivme-sales/          # Monorepo root (pnpm workspaces + Turborepo)
├── apps/
│   ├── docs/                       # PRIMARY APP - AI Factory Dashboard (React/Vite)
│   │   ├── src/                    # Main source code
│   │   │   ├── App.tsx             # Router + provider hierarchy
│   │   │   ├── index.tsx           # React root mount
│   │   │   ├── index.css           # Global styles (Tailwind)
│   │   │   ├── types.ts            # Main TypeScript interfaces
│   │   │   ├── constants.ts        # Mock data, static configs
│   │   │   ├── components/         # Shared UI components
│   │   │   │   ├── Layout.tsx      # Main layout (header + sidebar + content)
│   │   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   │   ├── ProtectedRoute.tsx  # Auth gate wrapper
│   │   │   │   ├── AISupportWidget.tsx # AI chat/voice widget
│   │   │   │   ├── charts/         # Recharts visualization components
│   │   │   │   ├── supervision/    # Supervision feature components
│   │   │   │   ├── RPG/            # Gamification components
│   │   │   │   └── ui/             # Base UI primitives (Badge, Callout, etc.)
│   │   │   ├── pages/              # Route page components
│   │   │   │   ├── Dashboard.tsx   # Main dashboard (route: /)
│   │   │   │   ├── SalesOps/       # Sales Ops (directory with sub-components)
│   │   │   │   ├── client/         # Client portal pages
│   │   │   │   ├── docs/           # Documentation pages
│   │   │   │   ├── ajustes/        # Settings sub-pages
│   │   │   │   └── *.tsx           # Single-file page components
│   │   │   ├── hooks/              # Custom React hooks (data layer)
│   │   │   │   ├── index.ts        # Barrel export (29 hooks)
│   │   │   │   └── use*.ts         # Individual hook files
│   │   │   ├── lib/                # Infrastructure utilities
│   │   │   │   ├── supabase.ts     # PRIMARY Supabase client
│   │   │   │   ├── supabase-sales-ops.ts  # Sales Ops DAO
│   │   │   │   ├── supabaseData.ts # Legacy data functions
│   │   │   │   └── export-utils.ts # CSV export helpers
│   │   │   ├── contexts/           # React contexts
│   │   │   │   └── AuthContext.tsx  # Auth provider (Supabase Auth)
│   │   │   ├── services/           # Legacy service layer
│   │   │   │   └── dataService.ts  # ClientService with mock fallback
│   │   │   └── types/              # Domain-specific types
│   │   │       ├── rpg.ts          # RPG/gamification types
│   │   │       └── supervision.ts  # Supervision types
│   │   ├── sql/                    # Database migrations & views
│   │   ├── scripts/                # Utility scripts
│   │   ├── workflows/              # n8n workflow JSONs
│   │   ├── index.html              # Vite HTML entry
│   │   ├── vite.config.ts          # Vite config (aliases, chunks, proxy)
│   │   ├── tsconfig.json           # TypeScript config (path alias @/*)
│   │   ├── package.json            # App dependencies
│   │   └── vercel.json             # Vercel deployment config
│   ├── api/                        # API service (Python, legacy/reference)
│   └── testing/                    # Testing workflows
├── packages/
│   ├── ui/                         # Shared UI package (button.tsx, cn.ts)
│   ├── types/                      # Shared types package
│   └── config/                     # Shared configs (tailwind, tsconfig bases)
├── services/                       # Backend microservices (pnpm workspace)
├── scripts/                        # Root-level utility scripts
├── sql/                            # Root-level SQL files
├── workflows/                      # Root-level n8n workflows
├── prompts/                        # Agent prompt files
├── pnpm-workspace.yaml             # Workspace definition
├── turbo.json                      # Turborepo config
└── package.json                    # Root package.json
```

## Directory Purposes

**`apps/docs/src/pages/`:**

- Purpose: One component per route, organized as flat files or directories
- Contains: 20+ page components
- Key files:
  - `Dashboard.tsx`: Main control tower (route `/`)
  - `SalesOps/index.tsx`: Sales operations dashboard with sub-components in `SalesOps/components/`
  - `PromptEditor.tsx`: Agent prompt editing (route `/prompt-studio`)
  - `Supervision.tsx`: AI supervision panel (route `/supervision`)
  - `Validation.tsx`: Agent testing & quality (route `/validacao`)
  - `Evolution.tsx`: Agent evolution tracking (route `/evolution`)
  - `ReflectionLoop.tsx`: Agent reflection loop (route `/reflection-loop`)
  - `Login.tsx`: Authentication page (public route)
  - `client/`: Client-facing portal pages (`ClientDashboard`, `ClientConversas`, `MeuAgente`, etc.)
  - `docs/`: Documentation pages (`DocsHome`, `SkillsCatalog`, `PipelinesCatalog`, etc.)

**`apps/docs/src/hooks/`:**

- Purpose: All data fetching and state management logic
- Contains: 31 hook files, each owning one domain concern
- Key files:
  - `useDashboardMetrics.ts`: Aggregated dashboard KPIs
  - `useAgents.ts`: Agent list from `agent_versions` table
  - `useAgentVersions.ts`: Agent version CRUD operations
  - `useSupervisionPanel.ts`: Supervision conversation data
  - `useSupervisionRealtime.ts`: Real-time supervision updates
  - `useAgendamentos.ts` / `useAgendamentosStats.ts`: Scheduling data
  - `useClientCosts.ts`: Cost tracking per client
  - `useLeads.ts`: Lead management
  - `useFunnelMetrics.ts`: Funnel conversion data
  - `useToast.tsx`: Toast notification context (note: `.tsx` extension)
  - `index.ts`: Barrel export for all hooks

**`apps/docs/src/components/`:**

- Purpose: Shared UI components used across multiple pages
- Contains: Layout components, feature-specific component groups, base UI
- Key files:
  - `Layout.tsx`: Main app shell (header, sidebar, content area, search modal)
  - `Sidebar.tsx`: Navigation sidebar with collapsible state
  - `ProtectedRoute.tsx`: Auth guard with redirect + `withAuth` HOC
  - `AISupportWidget.tsx`: Floating AI chat/voice assistant
  - `MetricCard.tsx`: Reusable metric display card
  - `DateRangePicker.tsx`: Date range selection
  - `DrilldownModal.tsx` / `LeadsDrilldownModal.tsx`: Detail drill-down modals
  - `SearchableSelect.tsx`: Searchable dropdown
  - `charts/`: `AgentEvolutionChart.tsx`, `AgentPerformanceRadar.tsx`, `ConversionBarChart.tsx`, `ScoreAreaChart.tsx`
  - `supervision/`: `ConversationList.tsx`, `ConversationDetail.tsx`, `MessageBubble.tsx`, `MessageComposer.tsx`, `QualityBadge.tsx`, `QualityFlagsList.tsx`, `SupervisionFilters.tsx`
  - `RPG/`: `Avatar.tsx`, `ClientRanking.tsx`, `SkillMenu.tsx`
  - `ui/`: `Badge.tsx`, `Callout.tsx`, `StatCard.tsx`, `PageContainer.tsx`, `CodeBlock.tsx`, `SearchCommand.tsx`, `CategoryFilter.tsx`, `Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`

**`apps/docs/src/lib/`:**

- Purpose: Infrastructure code -- Supabase clients, data utilities
- Contains: 4 files
- Key files:
  - `supabase.ts`: **Use this** -- primary Supabase client with `isSupabaseConfigured()` helper
  - `supabase-sales-ops.ts`: Typed DAO for Sales Ops queries (interfaces + query functions)
  - `supabaseData.ts`: Legacy data functions (`fetchAllAgents`, `fetchTestResults`, etc.) with duplicate type definitions
  - `export-utils.ts`: `arrayToCSV()`, `downloadCSV()` for data export

**`apps/docs/src/contexts/`:**

- Purpose: React context providers
- Contains: Single file
- Key files: `AuthContext.tsx` -- provides `useAuth()` hook with full auth lifecycle

**`apps/docs/src/services/`:**

- Purpose: Legacy service layer (being replaced by hooks)
- Contains: Single file
- Key files: `dataService.ts` -- `ClientService` object with `getAll()`, uses mock fallback

**`apps/docs/sql/`:**

- Purpose: Database migrations, view definitions, discovery queries
- Contains: 20+ SQL files with numeric prefixes for ordering
- Key files: `CREATE_DASHBOARD_VIEWS.sql`, `010_supervision_panel.sql`, `014_quality_flags.sql`, `017_performance_indexes.sql`

## Key File Locations

**Entry Points:**

- `apps/docs/index.html`: Vite HTML entry point
- `apps/docs/src/index.tsx`: React app bootstrap
- `apps/docs/src/App.tsx`: Route definitions + provider tree

**Configuration:**

- `apps/docs/vite.config.ts`: Vite build config (port 3000, path alias `@/*`, chunk splitting, proxy)
- `apps/docs/tsconfig.json`: TypeScript config (ES2022 target, path alias `@/*` -> `./src/*`)
- `apps/docs/postcss.config.js`: PostCSS for Tailwind
- `apps/docs/vercel.json`: Vercel deployment config
- `pnpm-workspace.yaml`: Workspace packages (`apps/*`, `packages/*`, `services/*`)
- `turbo.json`: Turborepo pipeline config

**Core Logic:**

- `apps/docs/src/hooks/`: All data fetching and business logic
- `apps/docs/src/lib/supabase.ts`: Database connection
- `apps/docs/src/contexts/AuthContext.tsx`: Authentication state

**Styling:**

- `apps/docs/src/index.css`: Global Tailwind imports + CSS custom properties
- `packages/config/tailwind.config.ts`: Shared Tailwind config

## Naming Conventions

**Files:**

- Page components: `PascalCase.tsx` (e.g., `Dashboard.tsx`, `PromptEditor.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useDashboardMetrics.ts`, `useAgents.ts`)
- Lib utilities: `camelCase` or `kebab-case` (e.g., `supabase.ts`, `export-utils.ts`, `supabase-sales-ops.ts`)
- Types: `camelCase.ts` (e.g., `rpg.ts`, `supervision.ts`)
- SQL migrations: `NNN_description.sql` (e.g., `010_supervision_panel.sql`)

**Directories:**

- Feature directories: `PascalCase` (e.g., `SalesOps/`, `RPG/`)
- Utility directories: `lowercase` (e.g., `hooks/`, `lib/`, `contexts/`, `charts/`, `ui/`)

**Exports:**

- Components: Named exports (`export const Dashboard = ...`, `export const Layout = ...`)
- Hooks: Named exports (`export const useDashboardMetrics = ...`)
- Barrel files: Re-export via `export * from './useHookName'`

## Where to Add New Code

**New Page/Route:**

1. Create component in `apps/docs/src/pages/NewPage.tsx` (simple) or `apps/docs/src/pages/NewPage/index.tsx` (complex with sub-components)
2. Add route in `apps/docs/src/App.tsx` following the existing pattern: `<Route path="/new-page" element={<ProtectedRoute><Layout><NewPage /></Layout></ProtectedRoute>} />`
3. Add sidebar link in `apps/docs/src/components/Sidebar.tsx` under the appropriate section group
4. Create data hook in `apps/docs/src/hooks/useNewPageData.ts` if fetching from Supabase
5. Export hook from `apps/docs/src/hooks/index.ts`

**New Data Hook:**

1. Create `apps/docs/src/hooks/useNewHook.ts`
2. Follow the pattern: `useState` for state, `useCallback` for fetch, `useEffect` for trigger, return `{ data, loading, error, refetch }`
3. Import Supabase client from `apps/docs/src/lib/supabase.ts`
4. Add `export * from './useNewHook'` to `apps/docs/src/hooks/index.ts`

**New Shared Component:**

- General UI: `apps/docs/src/components/ui/NewComponent.tsx`
- Chart: `apps/docs/src/components/charts/NewChart.tsx`
- Feature-specific shared: `apps/docs/src/components/featureName/NewComponent.tsx`

**New Type:**

- Domain-wide: Add to `apps/docs/src/types.ts`
- Feature-specific: Create in `apps/docs/src/types/featureName.ts`
- Co-located with hook: Define inline in the hook file (common pattern in this codebase, e.g., `useDashboardMetrics.ts` defines `DashboardMetricsState`)

**New Supabase View:**

- SQL definition: `apps/docs/sql/NNN_description.sql` (next sequential number)
- Query it from a hook via `supabase.from('view_name').select()`

**New Utility:**

- Supabase-related: `apps/docs/src/lib/supabase-{domain}.ts`
- General utility: `apps/docs/src/lib/{name}.ts`

## Special Directories

**`apps/docs/sql/`:**

- Purpose: Database migration and view SQL files for Supabase
- Generated: No (hand-written)
- Committed: Yes

**`apps/docs/dist/`:**

- Purpose: Vite production build output
- Generated: Yes (via `npm run build`)
- Committed: No

**`packages/`:**

- Purpose: Shared monorepo packages (UI primitives, types, config)
- Generated: No
- Committed: Yes
- Note: Lightly used -- most code lives directly in `apps/docs/src/`

**`2. front-factorai-mottivme-sales/`:**

- Purpose: Separate frontend project (parallel development / worktree experiments)
- Generated: No
- Committed: Yes (has its own `.claude/worktrees/`)

**`9_archive/`:**

- Purpose: Archived/deprecated code and files
- Generated: No
- Committed: Yes

**`apps/docs/workflows/`:**

- Purpose: n8n workflow JSON exports related to the AI Factory
- Generated: No (exported from n8n)
- Committed: Yes

**`prompts/`:**

- Purpose: Agent prompt files and upgrade scripts
- Generated: No
- Committed: Yes

---

_Structure analysis: 2026-03-05_
