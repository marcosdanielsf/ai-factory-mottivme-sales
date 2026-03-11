# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Single-Page Application (SPA) with client-side routing, direct Supabase data access via custom hooks (no backend API layer for the dashboard).

**Key Characteristics:**

- HashRouter-based SPA with protected routes
- Data fetching via custom React hooks that query Supabase directly (no REST API middleware)
- Supabase serves as both database and auth provider
- Monorepo structure (pnpm workspaces + Turborepo) but the dashboard app (`apps/docs/`) is the primary deliverable
- No server-side rendering -- pure client-side React + Vite

## Layers

**Routing & Auth (outermost shell):**

- Purpose: Route resolution, authentication gate, layout wrapper
- Location: `apps/docs/src/App.tsx`
- Contains: Route definitions, provider hierarchy (`AuthProvider` > `ToastProvider` > `HashRouter`)
- Depends on: `react-router-dom`, `AuthContext`, `ProtectedRoute`
- Used by: Entry point (`apps/docs/src/index.tsx`)

**Layout:**

- Purpose: Sidebar navigation, header with search/notifications, main content area
- Location: `apps/docs/src/components/Layout.tsx`, `apps/docs/src/components/Sidebar.tsx`
- Contains: Global search modal (Cmd+K), notification panel, mobile-responsive sidebar (collapsible), AI support widget
- Depends on: `useAgents` hook (for search), `useIsMobile` hook, `useAuth` (sidebar logout), `constants.ts` (mock alerts)
- Used by: Every protected route wraps its page in `<Layout>`

**Pages:**

- Purpose: Feature-specific views, each corresponding to a route
- Location: `apps/docs/src/pages/`
- Contains: 20+ page components, some as single files, some as directories with sub-components
- Depends on: Custom hooks for data, shared components for UI
- Used by: `App.tsx` route definitions

**Custom Hooks (data layer):**

- Purpose: Encapsulate all Supabase queries, state management, and data transformation
- Location: `apps/docs/src/hooks/`
- Contains: 31 hook files, barrel-exported via `apps/docs/src/hooks/index.ts`
- Depends on: `apps/docs/src/lib/supabase.ts` (Supabase client)
- Used by: Page components, Layout component

**Lib (infrastructure):**

- Purpose: Supabase client initialization, data access functions, utilities
- Location: `apps/docs/src/lib/`
- Contains:
  - `supabase.ts` -- Primary Supabase client (use this one)
  - `supabase-sales-ops.ts` -- Sales Ops DAO with typed interfaces and query functions
  - `supabaseData.ts` -- Legacy data fetching functions with type definitions
  - `export-utils.ts` -- CSV export utilities
- Depends on: `@supabase/supabase-js`, environment variables
- Used by: Hooks, services

**Services (legacy):**

- Purpose: Higher-level data operations with mock fallbacks
- Location: `apps/docs/src/services/dataService.ts`
- Contains: `ClientService` with fallback to mock data when Supabase is not configured
- Depends on: `lib/supabase.ts`, `constants.ts` (mocks), `types.ts`
- Used by: Some older page components

**Types:**

- Purpose: TypeScript interfaces for domain entities
- Location: `apps/docs/src/types.ts` (main), `apps/docs/src/types/` (domain-specific: `rpg.ts`, `supervision.ts`)
- Contains: `Lead`, `Agent`, `AgentVersion`, `ScoreDimensions`, `Client`, and more
- Used by: Hooks, pages, services, lib

**Contexts:**

- Purpose: React context providers for cross-cutting state
- Location: `apps/docs/src/contexts/AuthContext.tsx`
- Contains: `AuthProvider` with `signIn`, `signUp`, `signOut`, `resetPassword`
- Depends on: `lib/supabase.ts` (Supabase Auth)
- Used by: `App.tsx` (provider), `ProtectedRoute`, `Sidebar` (logout), any component via `useAuth()`

## Data Flow

**Page Load (authenticated):**

1. `index.tsx` renders `<App />` inside `React.StrictMode`
2. `AuthProvider` initializes -- calls `supabase.auth.getSession()`, subscribes to `onAuthStateChange`
3. `HashRouter` resolves route, `ProtectedRoute` checks `useAuth()` state
4. If not authenticated: redirect to `/login` with `returnTo` param
5. If authenticated: render `<Layout>` wrapping the page component
6. Page component calls custom hooks (e.g., `useDashboardMetrics`)
7. Hook queries Supabase directly, manages loading/error/data state
8. Component renders with data

**Data Fetching Pattern (standard hook):**

1. Hook initializes state with `useState` (loading: true, error: null, data: empty)
2. `useCallback` wraps async fetch function that calls `supabase.from('table').select()`
3. `useEffect` triggers fetch on mount (and optionally on dependency changes)
4. Hook returns `{ data, loading, error, refetch }` tuple
5. Some hooks query Supabase views (prefixed `vw_` or `dashboard_`) for pre-aggregated data

**State Management:**

- No global state library (no Redux, Zustand, Jotai)
- Each hook manages its own local state via `useState`
- Auth state via React Context (`AuthContext`)
- Sidebar collapse preference via `localStorage`
- Toast notifications via context (`useToast`)

## Key Abstractions

**Custom Hooks as Data Layer:**

- Purpose: Replace traditional service/repository pattern
- Examples: `apps/docs/src/hooks/useDashboardMetrics.ts`, `apps/docs/src/hooks/useAgents.ts`, `apps/docs/src/hooks/useSupervisionPanel.ts`
- Pattern: Each hook owns one domain concern, queries Supabase directly, returns `{ data, loading, error, refetch }`

**Supabase Views as API:**

- Purpose: Pre-aggregated data for dashboards, avoiding complex client-side joins
- Examples: `dashboard_ranking_clientes`, `vw_dashboard_metrics`, `vw_pending_approvals`, `vw_score_evolution`
- Pattern: SQL views defined in `apps/docs/sql/` are queried from hooks like regular tables

**Page-scoped Component Directories:**

- Purpose: Complex pages decompose into sub-components co-located in a directory
- Examples: `apps/docs/src/pages/SalesOps/components/`, `apps/docs/src/pages/client/`
- Pattern: `index.tsx` exports the page, `components/` holds page-specific UI pieces

**Scoring System:**

- Purpose: Evaluate AI agents across 6 dimensions (0-10 scale)
- Dimensions: `tone`, `engagement`, `compliance`, `accuracy`, `empathy`, `efficiency`
- Storage: JSONB `score_dimensions` column + `score_overall` aggregate
- Used in: `apps/docs/src/pages/Validation.tsx`, `apps/docs/src/pages/Evolution.tsx`, chart components

## Entry Points

**Application Bootstrap:**

- Location: `apps/docs/src/index.tsx`
- Triggers: Browser loads `apps/docs/index.html`
- Responsibilities: Mount React root, render `<App />` in StrictMode

**Router (App.tsx):**

- Location: `apps/docs/src/App.tsx`
- Triggers: HashRouter resolves URL hash fragments
- Responsibilities: Map routes to pages, wrap in auth/layout providers

**Route Groups (defined in App.tsx):**

- **Public:** `/login`, `/onboarding`, `/welcome`
- **Sales OS:** `/` (Dashboard), `/sales-ops`, `/agendamentos`, `/supervision`
- **AI Factory:** `/prompt-studio`, `/agents/:id`, `/validacao`, `/reflection-loop`, `/evolution`, `/knowledge-base`
- **Gamification:** `/team-rpg`, `/super-agent`
- **System:** `/custos`, `/performance`, `/configuracoes`
- **Legacy:** `/clientes` (redirects to `/`), `/clientes/:id`, `/clientes/:id/agente`, `/aprovacoes`

## Error Handling

**Strategy:** Per-hook try/catch with error state propagation to UI

**Patterns:**

- Hooks catch errors from Supabase queries, set `error` state string, log to `console.error`
- `useDashboardMetrics` has fallback queries: if `dashboard_ranking_clientes` fails, falls back to `socialfy_leads`
- `dataService.ts` falls back to mock data (`MOCK_CLIENTS`) when Supabase is not configured
- `AuthContext` wraps all auth operations in try/catch, returns `{ error }` objects
- No global error boundary detected

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` / `console.log` throughout hooks and services. Production build strips console via Terser (`drop_console: true` in `apps/docs/vite.config.ts`).

**Validation:** No centralized validation library. Form validation is inline in components. Supabase RLS provides server-side access control.

**Authentication:** Supabase Auth via `apps/docs/src/contexts/AuthContext.tsx`. `ProtectedRoute` component gates all non-public routes. Preserves `returnTo` URL on redirect.

**Notifications:** Toast system via `apps/docs/src/hooks/useToast.tsx` (context-based). Alert notifications in header use `MOCK_ALERTS` from `apps/docs/src/constants.ts`.

**Responsive Design:** `useIsMobile` hook (`apps/docs/src/hooks/useMediaQuery.ts`) drives mobile sidebar behavior. Tailwind responsive classes throughout.

---

_Architecture analysis: 2026-03-05_
