# Testing Patterns

**Analysis Date:** 2026-03-05

## Test Framework

**Runner:**

- No test framework is configured in this project
- No `jest.config.*`, `vitest.config.*`, or similar files exist in `apps/docs/`
- No test runner in `package.json` scripts
- No testing libraries in dependencies or devDependencies

**Assertion Library:**

- Not applicable

**Run Commands:**

```bash
# No test commands available
# package.json scripts: dev, build, preview only
```

## Test File Organization

**Location:**

- No test files exist anywhere in the `apps/docs/src/` source tree
- No `__tests__/` directories
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files in project source

## Current State

**Testing is completely absent from this project.** There are:

- Zero unit tests
- Zero integration tests
- Zero E2E tests
- No test configuration
- No test utilities or helpers
- No mocking infrastructure
- No coverage reporting

## Sibling Projects with Testing

The archived project at `9_archive/pre-turborepo/4. socialfy-platform/` has a `vitest.config.ts`, suggesting Vitest was used in a previous iteration. The services directory `services/socialfy/` also has a `vitest.config.ts`.

## Recommended Setup (for future implementation)

Based on the project stack (React 19 + Vite + TypeScript), the recommended test setup would be:

**Framework:** Vitest (native Vite integration)
**DOM Testing:** @testing-library/react
**Config location:** `apps/docs/vitest.config.ts`

**Suggested test file pattern:**

- Co-located with source: `src/hooks/useDashboardMetrics.test.ts`
- Or separate directory: `src/__tests__/hooks/useDashboardMetrics.test.ts`

**Priority areas to test first (highest impact):**

1. Custom hooks in `src/hooks/` - 31 hooks, all doing Supabase data fetching with error handling
2. Utility functions in `src/lib/export-utils.ts` - Pure functions, easy to test
3. Service layer in `src/services/dataService.ts` - Business logic with fallbacks
4. Auth context in `src/contexts/AuthContext.tsx` - Critical auth flow

**What to mock:**

- `src/lib/supabase.ts` - Mock the Supabase client for all hook tests
- `import.meta.env` - Mock environment variables

**What NOT to mock:**

- Pure utility functions (`arrayToCSV`, `downloadCSV`)
- Type definitions
- Constants/mock data

## Coverage

**Requirements:** None enforced

**Gaps:** 100% of source code is untested. Key risk areas:

- `src/hooks/` (31 files) - All data fetching logic untested
- `src/contexts/AuthContext.tsx` - Auth flow untested
- `src/services/dataService.ts` - Service layer with complex fallback logic untested
- `src/lib/supabaseData.ts` - Data access functions untested

---

_Testing analysis: 2026-03-05_
