# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**

- TypeScript ~5.8.2 - All frontend code in `apps/docs/src/`
- SQL - Database migrations and views in `sql/migrations/` and `apps/docs/sql/`

**Secondary:**

- Python - Backend API and testing scripts in `apps/api/` and `apps/testing/`

## Runtime

**Environment:**

- Node.js (no `.nvmrc` detected; target ES2022 via `tsconfig.json`)
- Browser (DOM target, SPA)

**Package Manager:**

- pnpm 9.15.0 (declared in root `package.json` `packageManager` field)
- Lockfile: `pnpm-workspace.yaml` present; workspace protocol used

## Monorepo

**Orchestrator:** Turborepo 2.3.0 (`turbo.json`)

**Workspaces:**

- `apps/*` - Application packages (docs, api, testing)
- `packages/*` - Shared packages
- `services/*` - Service packages

**Primary app:** `apps/docs/` (`@ai-factory/docs`) - The React frontend

## Frameworks

**Core:**

- React 19.2.3 - UI framework (`apps/docs/package.json`)
- React Router DOM 7.11.0 - Client-side routing via HashRouter
- Vite 6.2.0 - Dev server and bundler (`apps/docs/vite.config.ts`)

**Styling:**

- Tailwind CSS 4.1.18 - Utility-first CSS (`@tailwindcss/postcss`)
- PostCSS 8.5.6 + Autoprefixer 10.4.23

**Charts:**

- Recharts 3.6.0 - Data visualization

**Build/Dev:**

- Terser 5.44.1 - Production minification (drops console/debugger in prod)
- Prettier 3.3.3 - Code formatting (root level)
- `@vitejs/plugin-react` 5.0.0 - React Fast Refresh

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.89.0 - Database client, auth, realtime subscriptions
- `@google/genai` 1.34.0 - Gemini AI SDK for voice support, transcription, and text generation
- `react-router-dom` 7.11.0 - All routing (HashRouter for static hosting compatibility)

**UI:**

- `lucide-react` 0.562.0 - Icon library
- `recharts` 3.6.0 - Charts and data visualizations
- `@tanstack/react-virtual` 3.13.18 - Virtual scrolling for large lists
- `dompurify` 3.3.1 - HTML sanitization (XSS prevention)

**Root-level utilities:**

- `pdf-parse` 2.4.5 - PDF parsing
- `xlsx` 0.18.5 - Excel file processing

## Configuration

**TypeScript:** (`apps/docs/tsconfig.json`)

- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` maps to `./src/*`
- `experimentalDecorators: true`, `allowJs: true`
- `noEmit: true` (Vite handles compilation)

**Vite:** (`apps/docs/vite.config.ts`)

- Dev server: port 3000, host 0.0.0.0
- Proxy: `/docs` forwards to VitePress on port 5173
- Path alias: `@` maps to `./src`
- Production: terser minification, no sourcemaps, console/debugger dropped
- Manual chunks: `vendor-react`, `vendor-ui`, `vendor-supabase`
- Chunk size warning limit: 1000KB

**Turbo:** (`turbo.json`)

- Global env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ VITE* and NEXT_PUBLIC* prefixed variants)
- Tasks: build, dev, lint, typecheck, test, clean

**Environment Variables (required for frontend, VITE\_ prefix):**

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Google Gemini API key (AI voice/transcription)
- `VITE_N8N_WEBHOOK_SEND_MESSAGE` - n8n webhook for supervision messaging
- `VITE_N8N_WEBHOOK_CHAT_AJUSTES` - n8n webhook for adjustment chat
- `VITE_N8N_WEBHOOK_CHAT_AJUSTES_SAVE` - n8n webhook for saving adjustments
- `VITE_N8N_WEBHOOK_PROMPT_ENGINEER` - n8n webhook for prompt engineering chat
- `VITE_N8N_ONBOARDING_WEBHOOK` - n8n webhook for onboarding processing

## Platform Requirements

**Development:**

- Node.js with pnpm 9.15.0
- Run: `pnpm install` then `pnpm dev` (or `turbo dev` from root)
- Dev server at `http://localhost:3000`

**Production:**

- Deployed on Vercel at `factorai.mottivme.com.br`
- Static SPA build (`vite build` outputs to `dist/`)
- HashRouter used for client-side routing compatibility with static hosting

---

_Stack analysis: 2026-03-05_
