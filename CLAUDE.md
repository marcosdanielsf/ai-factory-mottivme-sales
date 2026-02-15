# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MOTTIVME AI Factory Dashboard - A React/Vite frontend for managing AI sales agents. The system allows creating, testing, and validating AI agent versions with a scoring system (0-10) across multiple dimensions (tone, engagement, compliance, accuracy, empathy, efficiency).

## Development Commands

```bash
npm install    # Install dependencies
npm run dev    # Start dev server on port 3000
npm run build  # Production build (minified with terser)
npm run preview # Preview production build
```

## Architecture

### Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router v7 (HashRouter)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts 3.6
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: lucide-react

### Directory Structure
```
/                     # Root contains main App.tsx, index.tsx, types.ts
├── pages/            # Route components (Dashboard, PromptEditor, etc.)
├── components/       # Reusable UI components
│   ├── charts/       # Recharts-based visualization components
│   └── RPG/          # Gamification components
├── src/
│   ├── hooks/        # Custom React hooks (data fetching, state)
│   ├── lib/          # Supabase client and data utilities
│   ├── contexts/     # React contexts (AuthContext)
│   └── components/   # Additional components (ProtectedRoute)
├── sql/              # Database migrations and views
└── types/            # Additional TypeScript types
```

### Key Patterns

**Authentication**: Uses Supabase Auth via `AuthContext` (`src/contexts/AuthContext.tsx`). All routes except `/login` are wrapped with `ProtectedRoute`.

**Data Fetching**: Custom hooks in `src/hooks/` fetch from Supabase views (prefixed `vw_`). Hooks export from `src/hooks/index.ts`. Key hooks:
- `useDashboardMetrics` - reads from `vw_dashboard_metrics`
- `usePendingApprovals` - reads from `vw_pending_approvals`
- `useAgentVersions` - manages agent version CRUD
- `useTestResults` - test execution results

**Supabase Clients**: Two client files exist:
- `src/lib/supabase.ts` - Main client (use this)
- `supabaseClient.ts` - Legacy root-level client

**Path Alias**: `@/*` maps to project root (defined in `tsconfig.json` and `vite.config.ts`).

### Database Schema

Core tables:
- `agent_versions` - AI agent prompts and configurations
- `test_results` / `agenttest_runs` - Test execution data with score dimensions
- `leads` - Sales leads
- `factory_artifacts` - Generated content (persona analysis, objection maps)

Optimized views (in `sql/`):
- `vw_dashboard_metrics` - Aggregated dashboard stats
- `vw_pending_approvals` - Versions awaiting approval
- `vw_score_evolution` - Version comparison with score deltas

### Scoring System

Tests evaluate agents on 6 dimensions (0-10 scale):
- `tone`, `engagement`, `compliance`, `accuracy`, `empathy`, `efficiency`

Stored as JSONB in `score_dimensions` column, with `score_overall` as aggregate.

## Environment Variables

Required (prefix with `VITE_` for frontend access):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key  # For AI voice support
```

## Tipos Compartilhados

- `DateRange` → fonte unica: `src/components/DateRangePicker.tsx`. NUNCA exportar DateRange de hooks.
- Hooks usam `DateRange` internamente (sem export). Paginas importam de `DateRangePicker`.

## Notes

- The app uses HashRouter for client-side routing compatibility
- Production build drops console/debugger statements
- Chunk splitting configured for vendor libraries (react, recharts, supabase)
