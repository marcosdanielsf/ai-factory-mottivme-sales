# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Context-based hierarchical UI architecture with React Context for global state and custom hooks for domain logic isolation.

**Key Characteristics:**
- Multi-layer separation: UI components, custom hooks, contexts, and Supabase client library
- Context-driven state management: ThemeContext, LanguageContext, AuthContext, ToastContext, and DataContext
- Lazy-loaded data fetching through custom hooks to prevent blocking initial render
- Mock data fallback for development and componentization testing

## Layers

**Presentation Layer (Views):**
- Purpose: Render domain-specific screens and handle user interactions
- Location: `components/views/`
- Contains: DashboardView, LeadsView, CampaignsView, PipelineView, InboxView, AgentsView, SettingsView, AccountsView, and specialized views (LinkedInSearchView, InstagramSearchView, etc.)
- Depends on: Custom hooks (useSupabaseData, useMetrics, useAgenticOSStats), global contexts (useAuth, useData, useTheme, useLanguage)
- Used by: AuthenticatedApp (main authenticated view router)

**Component Layer:**
- Purpose: Reusable UI building blocks
- Location: `components/` (auth/, common/, layout/, leads/, settings/)
- Contains:
  - `auth/`: LoginPage, SignupPage, ForgotPasswordPage
  - `common/`: LoadingSpinner, ErrorBoundary, Toast, ConfirmDialog, EmptyState, Skeleton
  - `layout/`: Sidebar, Header
  - `leads/`: Lead-specific component utilities
  - `UI.tsx`: Centralized reusable UI components (Button, Card, Input, Badge, etc.)
- Depends on: Contexts (theme, language), types
- Used by: View components, other components

**State Management Layer:**
- Purpose: Global application state and authentication
- Location: `contexts/`
- Contains:
  - `AuthContext.tsx`: User authentication, session management, tenant/profile data
  - `ThemeContext.tsx`: Light/dark mode toggle
  - `LanguageContext.tsx`: PT/EN internationalization
  - `ToastContext.tsx`: Toast notification queue
  - `DataContext` (in App.tsx): Aggregates Supabase data + AgenticOS integrations
- Depends on: Supabase client
- Used by: App.tsx (wraps entire application), all components via useContext hooks

**Domain Logic Layer (Custom Hooks):**
- Purpose: Encapsulate business logic, API interactions, and data transformations
- Location: `hooks/`
- Contains:
  - **Data fetching:** useSupabaseData, useLeads, useCampaigns, usePipeline, useInbox, useAgents
  - **AgenticOS integration:** useAgenticOSStats, useAgenticOSAccounts, useSystemHealth
  - **Instagram/LinkedIn:** useInstagramSearch, useInstagramAccounts, useNewFollowers
  - **Infrastructure:** useMetrics, useFormValidation, useTenants
- Depends on: Supabase client, types
- Used by: Views, DataProvider, other hooks

**Infrastructure Layer:**
- Purpose: External service clients and database queries
- Location: `lib/supabase.ts`
- Contains: Supabase client initialization, TypeScript types for database schema (Organization, User, Lead, Campaign, Pipeline, etc.)
- Depends on: @supabase/supabase-js
- Used by: Custom hooks, contexts

**Utility & Configuration Layer:**
- Purpose: Constants, type definitions, and configuration
- Location: `constants.ts`, `types.ts`, environment variables
- Contains: Mock data (METRICS, RECENT_CAMPAIGNS, MOCK_LEADS, PIPELINE_DATA, MOCK_ACCOUNTS, MOCK_AGENTS), global type definitions (NavItem, Channel, Lead, Campaign, Agent, PipelineCard, Account, Metric)
- Used by: Views, hooks, contexts

## Data Flow

**User Authentication:**

1. App.tsx checks `useAuth()` loading state
2. If authenticated: render AuthenticatedApp with DataProvider
3. If not: render AuthFlow (LoginPage, SignupPage, ForgotPasswordPage)
4. AuthContext manages Supabase session via createAuthenticatedClient()

**Data Loading on App Mount:**

1. DataProvider initializes in AuthenticatedApp
2. Extracts `organizationId` from user metadata or uses DEMO_ORG_ID
3. Calls `useSupabaseData(organizationId)` → fetches from Supabase views
4. Calls `useMetrics(leads, campaigns, pipeline)` → derives metrics client-side
5. Calls AgenticOS hooks (useAgenticOSStats, useAgenticOSAccounts) with `autoFetch=false` (lazy load)
6. Provides combined state via DataContext.Provider → all child components access via `useData()`

**View Navigation:**

1. Sidebar button click triggers `setActiveView(navItem)` in AuthenticatedApp
2. `activeView` state controls conditional rendering of appropriate View component
3. Sidebar can close on mobile via `setSidebarOpen(false)`
4. Theme/Language toggles in Sidebar update global context

**State Management:**

- **Global state:** Theme, language, auth, toast notifications, aggregated data (via DataContext)
- **Local state:** View-specific filters, form inputs, expanded sections (managed in individual View components)
- **Async state:** Loading, error handling, data refresh triggers

## Key Abstractions

**DataContext (App.tsx):**
- Purpose: Centralized access to all application data (Supabase + AgenticOS)
- Examples: `useData()` hook accesses leads, campaigns, pipeline, accounts, agents, metrics
- Pattern: Context + Provider pattern; includes fallback mock data if context unavailable

**Custom Data Hooks:**
- Purpose: Encapsulate Supabase queries and transformations
- Examples: `useSupabaseData` returns { leads, campaigns, pipeline, accounts, agents, loading, error }
- Pattern: useState + useEffect for data fetching; return structured data + loading/error states

**Lazy-Loading Integration:**
- Purpose: Prevent AgenticOS API calls from blocking initial page render
- Pattern: Pass `autoFetch=false` to useAgenticOSStats, useAgenticOSAccounts, useSystemHealth; manual refetch via `refetchAgenticData()`

**Contexts as Global Providers:**
- Purpose: Share configuration without prop drilling
- Examples: ThemeContext (className=".dark"), LanguageContext (t() function), AuthContext (user, signOut)
- Pattern: createContext + useContext; Provider wraps entire app in index.tsx

## Entry Points

**Application Entry (`index.tsx`):**
- Location: `index.tsx`
- Triggers: Browser loads index.html
- Responsibilities: Mount React app, wrap with all context providers (ErrorBoundary, ThemeProvider, LanguageProvider, AuthProvider, ToastProvider)

**Main App Component (`App.tsx`):**
- Location: `App.tsx`
- Triggers: Rendered by index.tsx
- Responsibilities: Determine auth state; render AuthFlow or AuthenticatedApp

**Authenticated App (`AuthenticatedApp` in App.tsx):**
- Location: App.tsx, lines 135-179
- Triggers: User is authenticated
- Responsibilities: Render DataProvider, Sidebar, Header, and active View component based on navigation state

**View Routing:**
- Location: AuthenticatedApp (conditional rendering)
- Triggers: activeView state changes
- Responsibilities: Render appropriate View (DashboardView, LeadsView, etc.)

## Error Handling

**Strategy:** Try-catch in async operations; fallback to mock data; error state in contexts and hooks; ErrorBoundary component for React errors.

**Patterns:**

- **API Errors:** useSupabaseData catches errors → returns { error } state; views check error && render error UI
- **Auth Errors:** AuthContext catches sign-in/sign-up errors → stores in { error } state; login page displays error message
- **Component Errors:** ErrorBoundary wraps entire app; catches unhandled errors and prevents crash
- **Fallback Data:** If useData() context unavailable, return mock data (METRICS, MOCK_LEADS, etc.)
- **Toast Notifications:** ToastContext provides showToast() for user-facing errors

**Example (from useSupabaseData):**
```typescript
try {
  const data = await supabase
    .from('table_name')
    .select('*')
    .eq('organization_id', organizationId);
} catch (err) {
  console.error('Error fetching data:', err);
  setError(err.message);
}
```

## Cross-Cutting Concerns

**Logging:** console.error/console.log in error handlers and hook initializations; no centralized logging service.

**Validation:** useFormValidation hook for form inputs; inline validation in individual form components (LoginPage, SignupPage).

**Authentication:** AuthContext manages Supabase Auth; ProtectedRoute (in src/components) wraps unauthenticated routes; session persisted via Supabase SDK.

**Theming:** Theme CSS variables in index.css; ThemeContext toggles .dark class on html element; components use dark: Tailwind prefix for dark mode styles.

**Internationalization:** LanguageContext provides t() function; translations in LanguageContext.tsx; components call useLanguage() to access i18n strings.

---

*Architecture analysis: 2026-03-25*
