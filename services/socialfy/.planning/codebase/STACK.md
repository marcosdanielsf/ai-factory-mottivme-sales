# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- TypeScript 5.8.2 - All source code (React components, hooks, contexts)
- JavaScript/JSX - React component definitions (`.tsx` files)
- CSS/Tailwind - Styling via Tailwind CSS v4 with custom theme

**Secondary:**
- SQL - Supabase database queries via PostgREST API (in `lib/supabase.ts`)

## Runtime

**Environment:**
- Node.js (v18 or higher recommended, per Vite 6 requirements)

**Package Manager:**
- npm v10+
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.1 - UI component framework
  - React DOM 19.2.1 - DOM rendering
  - Location: `App.tsx`, `index.tsx`, all `/components` files

**Build/Dev:**
- Vite 6.4.1 - Frontend build tool and dev server
  - Config: `vite.config.ts`
  - Plugins: `@vitejs/plugin-react` 5.1.2, `@tailwindcss/vite` 4.1.18
  - Dev port: 3000
  - Build output: `dist/` directory

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
  - PostCSS 8.5.6 - CSS transformer
  - Autoprefixer 10.4.22 - Browser prefix handling
  - Custom theme in `index.css` with CSS variables
  - Dark mode via `@custom-variant dark` strategy
  - Config: Defined in `index.css` via `@theme` block (no `tailwind.config.js`)

**Testing:**
- Vitest 2.0.0 - Unit test runner
  - Config: `vitest.config.ts`
  - Environment: jsdom (browser-like)
  - Test files: `**/*.test.{ts,tsx}` pattern
  - Coverage: `@vitest/coverage-v8` 2.0.0
  - Setup: `src/test/setup.ts`

**Testing Libraries:**
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.0.0 - DOM matchers for assertions
- @testing-library/user-event 14.0.0 - User interaction simulation

**Linting:**
- ESLint - JavaScript linter (configured, run via `npm run lint`)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.87.1 - Supabase client library
  - Used for: Authentication, database queries, real-time subscriptions
  - Client location: `lib/supabase.ts`
  - Auth context: `contexts/AuthContext.tsx`

- lucide-react 0.560.0 - React icon library
  - Used in: UI components, sidebar navigation, headers

- recharts 3.5.1 - React charting library
  - Used in: Dashboard metrics, analytics visualization
  - Location: `components/charts/` directory

## Configuration

**Environment (Vite):**
- Runtime config: `import.meta.env.*` for VITE_* variables
- Env file: `.env` (not committed, see `.gitignore`)
- Example: `env.example` provided

**Build:**
- Vite config: `vite.config.ts`
  - Path alias: `@/*` maps to project root
  - Chunk splitting: react-vendor, supabase chunks for optimization
  - Source maps disabled in production (`sourcemap: false`)

**TypeScript:**
- Config: `tsconfig.json`
  - Target: ES2022
  - Module: ESNext
  - JSX: react-jsx
  - Path alias: `@/*` → `./*` (root directory)

## Platform Requirements

**Development:**
- Node.js 18+ (Vite 6 requirement)
- npm 10+
- Modern browser with ES2022 support

**Production:**
- Deployment target: Vercel (configured)
- Config: `vercel.json`
  - Framework: vite
  - Build command: `npm run build`
  - Output directory: `dist/`
  - Install command: `npm install`
  - Dev command: `npm run dev`

**Security Headers (Vercel):**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## Scripts

```bash
npm run dev          # Start Vite dev server on port 3000
npm run build        # Production build (minified)
npm run preview      # Preview production build locally
npm run typecheck    # Type checking via tsc
npm run lint         # Run ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
```

## External Build Tools

- **Minification:** Terser (default Vite rollup plugin)
- **CSS Processing:** Tailwind CSS v4 via PostCSS in Vite
- **Module Resolution:** Bundler strategy (ES modules)

---

*Stack analysis: 2026-03-25*
