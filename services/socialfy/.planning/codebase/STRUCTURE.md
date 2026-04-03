# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```
socialfy/
├── index.tsx                  # React app entry point (context providers)
├── App.tsx                    # Main app component (auth routing + DataProvider)
├── index.css                  # Tailwind CSS v4 + dark mode + theme variables
├── index.html                 # HTML template
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration with @/* path alias
├── tailwind.config.js         # Tailwind configuration (minimal for v4)
├── vitest.config.ts           # Vitest test runner config
├── types.ts                   # Global type definitions (NavItem, Channel, Lead, Campaign, etc.)
├── constants.ts               # Mock data and static constants
├──
├── components/                # UI component library
│   ├── UI.tsx                 # Centralized reusable UI components (Button, Card, Input, Badge, etc.)
│   ├── auth/                  # Authentication screens
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── common/                # Shared utility components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Toast.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   └── Skeleton.tsx
│   ├── layout/                # App shell components
│   │   ├── Sidebar.tsx        # Navigation sidebar (theme/language toggles)
│   │   └── Header.tsx         # Top header/nav bar
│   ├── leads/                 # Lead-specific components
│   │   └── [lead components]
│   ├── settings/              # Settings page components
│   │   └── [settings components]
│   ├── views/                 # Full-page view components (routed)
│   │   ├── DashboardView.tsx
│   │   ├── GrowthDashboardView.tsx
│   │   ├── LeadsView.tsx
│   │   ├── CampaignsView.tsx
│   │   ├── PipelineView.tsx
│   │   ├── InboxView.tsx
│   │   ├── AgentsView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── AccountsView.tsx
│   │   ├── NewFollowersView.tsx
│   │   └── OtherViews.tsx    # Bundled: LinkedInSearchView, InstagramSearchView, CNPJSearchView, etc.
│   └── __tests__/             # Component unit tests
│
├── contexts/                  # React Context providers (global state)
│   ├── AuthContext.tsx        # Authentication & tenant management
│   ├── ThemeContext.tsx       # Light/dark mode toggle
│   ├── LanguageContext.tsx    # PT/EN internationalization
│   ├── ToastContext.tsx       # Toast notification queue
│   └── __tests__/             # Context unit tests (AuthContext.test.tsx)
│
├── hooks/                     # Custom React hooks (data + business logic)
│   ├── index.ts               # Export barrel (all hooks + types)
│   ├── useSupabaseData.ts     # Main Supabase aggregator (leads, campaigns, pipeline, etc.)
│   ├── useMetrics.ts          # Derive metrics from data
│   ├── useLeads.ts            # AgenticOS leads CRUD
│   ├── useCampaigns.ts        # AgenticOS campaigns CRUD
│   ├── usePipeline.ts         # Pipeline data & operations
│   ├── useInbox.ts            # Inbox messages & conversations
│   ├── useAgents.ts           # AI agents management
│   ├── useAgenticOSStats.ts   # AgenticOS system stats (lazy load)
│   ├── useAgenticOSAccounts.ts # AgenticOS account management (lazy load)
│   ├── useSystemHealth.ts     # System health polling (lazy load)
│   ├── useInstagramSearch.ts  # Instagram profile search
│   ├── useInstagramAccounts.ts # Instagram account session management
│   ├── useNewFollowers.ts     # Instagram new followers tracking
│   ├── useTenants.ts          # Multi-tenant support
│   ├── useFormValidation.ts   # Form validation helpers
│   └── __tests__/             # Hook unit tests
│
├── lib/                       # Infrastructure & utilities
│   └── supabase.ts            # Supabase client + database types (Organization, User, Lead, Campaign, etc.)
│
├── src/                       # Additional utilities
│   └── test/                  # Test setup & utilities
│
├── supabase/                  # Supabase configuration
│   ├── functions/             # Edge Functions
│   └── migrations/            # Database migrations
│
├── docs/                      # Project documentation
│   └── [documentation files]
│
├── dist/                      # Production build output (generated)
│   └── assets/                # Minified JS/CSS chunks
│
├── node_modules/              # Dependencies (not committed)
│
├── CLAUDE.md                  # Project-specific Claude instructions
├── DEPLOY.md                  # Deployment guide
├── README.md                  # Project overview
├── package.json               # npm dependencies & scripts
├── package-lock.json          # Dependency lock file
├── env.example                # Example environment variables
├── metadata.json              # Project metadata
└── vercel.json                # Vercel deployment configuration
```

## Directory Purposes

**Root Components:**
- Purpose: Top-level app logic and configuration
- Contains: App.tsx (authentication router + DataProvider), index.tsx (context provider setup)
- Key files: `App.tsx` (217 lines, central navigation logic), `index.tsx` (entry point)

**components/:**
- Purpose: Modular, reusable React components organized by feature
- Contains: UI primitives, page layouts, feature-specific screens
- Key files:
  - `UI.tsx` (centralized Button, Card, Input, Badge, Table, Modal, etc.)
  - `views/*` (full-screen pages: DashboardView, LeadsView, CampaignsView, etc.)
  - `auth/*` (LoginPage, SignupPage, ForgotPasswordPage)
  - `common/*` (LoadingSpinner, ErrorBoundary, Toast, ConfirmDialog, EmptyState, Skeleton)

**contexts/:**
- Purpose: Global application state managed via React Context
- Contains: AuthContext (auth + tenant + profile), ThemeContext (light/dark), LanguageContext (i18n), ToastContext (notifications), DataContext (in App.tsx aggregates all data)
- Key files: `AuthContext.tsx` (250+ lines, authentication & session management)

**hooks/:**
- Purpose: Encapsulate business logic and API interactions
- Contains: Custom hooks for data fetching, transformations, and domain operations
- Key files:
  - `index.ts` (barrel export of all hooks + types)
  - `useSupabaseData.ts` (aggregates leads, campaigns, pipeline, accounts, agents from Supabase)
  - `useMetrics.ts` (derives KPIs from raw data)
  - `useAgenticOSStats.ts`, `useAgenticOSAccounts.ts`, `useSystemHealth.ts` (AgenticOS integrations with lazy loading)
  - `useInstagramSearch.ts`, `useInstagramAccounts.ts` (Instagram-specific operations)

**lib/:**
- Purpose: Infrastructure layer (external service clients)
- Contains: Supabase client initialization, database schema types
- Key file: `supabase.ts` (defines Organization, User, Lead, Campaign, Pipeline, Account, Agent types; initializes Supabase client)

**supabase/:**
- Purpose: Backend configuration and migrations
- Contains: Edge Functions (serverless logic), migrations (schema versioning)
- Not the focus of frontend codebase mapping but referenced for data types

**types.ts:**
- Purpose: Centralized TypeScript types for UI layer
- Contains: NavItem (navigation destinations), Channel (communication platforms), Lead, Campaign, Agent, PipelineCard, Account, Metric
- Used by: All components and views

**constants.ts:**
- Purpose: Static data and mock data for development/testing
- Contains: METRICS, RECENT_CAMPAIGNS, MOCK_LEADS, PIPELINE_DATA, MOCK_ACCOUNTS, MOCK_AGENTS
- Used by: DataProvider fallback, component examples

**index.css:**
- Purpose: Global styling with Tailwind CSS v4
- Contains: Dark mode via @custom-variant, CSS variables for theme colors, imported Tailwind directives
- Configured for: Light mode (default) + dark mode (.dark class), navy blue color scheme

## Key File Locations

**Entry Points:**
- `index.tsx`: React app mount point; wraps with ErrorBoundary, ThemeProvider, LanguageProvider, AuthProvider, ToastProvider
- `App.tsx`: Main app component; checks auth state, renders AuthFlow or AuthenticatedApp with DataProvider
- `components/auth/LoginPage.tsx`: Initial user authentication screen
- `components/views/DashboardView.tsx`: Main dashboard after login

**Configuration:**
- `vite.config.ts`: Build config (React plugin, Tailwind CSS v4, path aliases, code splitting)
- `tsconfig.json`: TypeScript compiler options (@/* path alias)
- `tailwind.config.js`: Tailwind configuration
- `vercel.json`: Vercel deployment settings

**Core Logic:**
- `App.tsx`: Authentication routing + DataProvider (centralized state)
- `contexts/AuthContext.tsx`: User session, tenant, profile management
- `hooks/useSupabaseData.ts`: Main data aggregator from Supabase
- `lib/supabase.ts`: Supabase client + database schema types

**Styling:**
- `index.css`: Global Tailwind + dark mode + CSS variables
- `components/UI.tsx`: Reusable styled components (Button, Card, Input, etc.)

**Testing:**
- `contexts/__tests__/AuthContext.test.tsx`: Auth context unit tests
- `components/__tests__/`: Component tests
- `hooks/__tests__/`: Hook tests
- `src/test/`: Test utilities and setup

## Naming Conventions

**Files:**
- React components: PascalCase (LoginPage.tsx, DashboardView.tsx, Sidebar.tsx)
- Custom hooks: camelCase with `use` prefix (useSupabaseData.ts, useMetrics.ts)
- Contexts: PascalCase + Context suffix (AuthContext.tsx, ThemeContext.tsx)
- Utilities: camelCase (constants.ts, types.ts)
- Tests: FileName.test.tsx or __tests__/FileName.test.tsx

**Directories:**
- Feature folders: camelCase or PascalCase (components/auth/, hooks/, lib/)
- View containers: views/ (grouped full-page components)
- Test directories: __tests__/ (co-located with source)

**Functions & Variables:**
- React components: PascalCase (AuthFlow, AuthenticatedApp)
- Custom hooks: camelCase with `use` prefix (useData, useAuth)
- Context values: camelCase (user, theme, language)
- Constants: UPPER_SNAKE_CASE (METRICS, MOCK_LEADS, DEMO_ORG_ID)

## Where to Add New Code

**New Feature (Multi-screen flow):**
- Primary code: `components/views/YourFeatureView.tsx` (create view component)
- Custom hook: `hooks/useYourFeature.ts` (data & business logic)
- Types: Add to `types.ts` if shared globally, or inline in hook
- Tests: `hooks/__tests__/useYourFeature.test.tsx` + `components/__tests__/YourFeatureView.test.tsx`
- Integration: Import in App.tsx, add NavItem type to types.ts, add Sidebar button in components/layout/Sidebar.tsx

**New Component (Reusable UI):**
- Implementation: `components/UI.tsx` (if primitive like Button, Card) or `components/[feature]/ComponentName.tsx` (if feature-specific)
- Types: Inline in component file or `types.ts` if shared
- Tests: `components/__tests__/ComponentName.test.tsx`
- Export: If in components/UI.tsx, export from barrel; if feature-specific, import directly

**New Custom Hook (Data or Logic):**
- Implementation: `hooks/useYourHook.ts`
- Types: Define in hook file or import from `types.ts`
- Export: Add to `hooks/index.ts` barrel export
- Tests: `hooks/__tests__/useYourHook.test.tsx`

**Global State (Theme, Auth, Toast):**
- Implementation: `contexts/YourContext.tsx`
- Types: Define inline in context file
- Setup: Wrap provider in `index.tsx` or appropriate parent
- Usage: Create custom hook useYourContext() to access; import in components

**Utilities (Validation, Formatting):**
- Implementation: `lib/yourUtil.ts` (infrastructure) or `hooks/useYourHook.ts` (if hook-like)
- Tests: `lib/__tests__/` or `hooks/__tests__/`
- Export: From hook index or lib barrel

## Special Directories

**dist/:**
- Purpose: Production build output
- Generated: Yes (via `npm run build`)
- Committed: No (.gitignore)
- Contains: Minified JS/CSS chunks, split by vite rollupOptions (react-vendor, supabase, default)

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (via `npm install`)
- Committed: No (.gitignore)

**supabase/:**
- Purpose: Backend schema & Edge Functions
- Generated: No (manually versioned migrations)
- Committed: Yes
- Contents: SQL migrations, TypeScript Edge Functions, local setup files

**docs/:**
- Purpose: Project documentation
- Generated: No (manually written)
- Committed: Yes
- Contents: Architecture diagrams, API reference, deployment guide

---

*Structure analysis: 2026-03-25*
