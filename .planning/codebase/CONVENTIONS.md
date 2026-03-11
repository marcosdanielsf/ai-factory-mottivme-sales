# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**

- Page components: PascalCase (`Dashboard.tsx`, `PromptEditor.tsx`, `ClientCosts.tsx`)
- Hooks: camelCase with `use` prefix (`useDashboardMetrics.ts`, `useAgentVersions.ts`)
- Lib/utilities: camelCase kebab-style (`supabase.ts`, `export-utils.ts`, `supabase-sales-ops.ts`)
- Type files: camelCase (`types.ts`, `supervision.ts`, `rpg.ts`)
- Constants: camelCase (`constants.ts`)

**Functions:**

- React components: PascalCase (`MetricCard`, `ProtectedRoute`, `Layout`)
- Hooks: camelCase with `use` prefix (`useDashboardMetrics`, `useAgentVersions`)
- Service methods: camelCase (`getAll`, `getConfig`, `saveConfig`)
- Utility functions: camelCase (`arrayToCSV`, `downloadCSV`, `isSupabaseConfigured`)
- Event handlers inside components: camelCase with `handle` prefix (`handleToggleSidebarCollapse`)

**Variables:**

- State: camelCase (`loading`, `error`, `metrics`, `sidebarOpen`)
- Constants: UPPER_SNAKE_CASE for mock data (`MOCK_CLIENTS`, `MOCK_ALERTS`, `DASHBOARD_METRICS`)
- Booleans: `is` prefix in types (`is_active`, `is_resolved`), no prefix in React state (`loading`, `headerVisible`)

**Types:**

- Interfaces: PascalCase (`AgentVersion`, `DashboardMetricsState`, `SupervisionConversation`)
- Type aliases: PascalCase (`ToastType`, `QualityFlagType`, `SupervisionStatus`)
- Props interfaces: PascalCase with `Props` suffix (`MetricCardProps`, `ProtectedRouteProps`, `AuthProviderProps`)
- Enums/unions: string literal unions preferred over TypeScript enums

## Component Patterns

**Named exports for components (preferred):**

```typescript
export const MetricCard: React.FC<MetricCardProps> = ({ title, value, ...props }) => {
  return <div>...</div>;
};
```

**Named export with function declaration (for contexts/providers):**

```typescript
export function AuthProvider({ children }: AuthProviderProps) {
  // ...
}
```

**Default export for App and pages that use it:**

```typescript
// App.tsx
const App = () => { ... };
export default App;

// OnboardingWizard.tsx
export default OnboardingWizard;
```

**Page component pattern:**

- Use named `export const` for most pages: `export const Dashboard = () => { ... }`
- Hooks destructured at top of component
- State declarations after hooks
- `useMemo`/`useCallback` for computed values
- Inline sub-components for section headers and wrappers (defined above the main export)

**Inline sub-components pattern (common in pages):**

```typescript
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <h2 className="text-sm font-semibold...">{title}</h2>
);

export const Dashboard = () => {
  // uses SectionHeader internally
};
```

## Code Style

**Formatting:**

- No Prettier or ESLint configured in this project
- 2-space indentation (de facto standard from existing code)
- Single quotes for imports and strings
- Semicolons used consistently
- Trailing commas in multi-line objects/arrays

**Linting:**

- No linting tooling detected
- TypeScript compiler provides type checking only (`noEmit: true` in tsconfig)
- `skipLibCheck: true` enabled

## Import Organization

**Order:**

1. React and React ecosystem (`react`, `react-dom`, `react-router-dom`)
2. Third-party libraries (`@supabase/supabase-js`, `lucide-react`, `recharts`)
3. Local absolute imports using `@/` alias or relative paths (`../lib/supabase`, `../hooks`, `../types`)
4. Types (often imported inline with components, not separated)

**Path Aliases:**

- `@/*` maps to `./src/*` (defined in `tsconfig.json` and `vite.config.ts`)
- In practice, most imports use relative paths (`../hooks`, `../lib/supabase`)
- The `@/` alias is available but inconsistently used

**Barrel exports:**

- `src/hooks/index.ts` re-exports all hooks via `export * from './useXxx'`
- `src/components/charts/index.ts` re-exports chart components
- `src/components/ui/index.ts` re-exports UI design system components
- Import hooks via barrel: `import { useDashboardMetrics, useAgents } from '../hooks'`
- Some hooks imported directly when not in barrel: `import { useToast } from '../hooks/useToast'`

## Error Handling

**Patterns:**

**Hook-level try/catch with state:**

```typescript
const [error, setError] = useState<string | null>(null);

try {
  setLoading(true);
  const { data, error } = await supabase.from("table").select("*");
  if (error) throw error;
  setData(data || []);
} catch (err: any) {
  console.error("Error fetching X:", err);
  setError(err.message || "Erro ao carregar X");
} finally {
  setLoading(false);
}
```

**Fallback pattern (common):**

```typescript
// Try primary source, fallback to secondary
const { data, error } = await supabase.from("primary_view").select("*");
if (error) {
  console.warn("primary_view nao disponivel, usando fallback");
  const { data: fallbackData } = await supabase
    .from("fallback_table")
    .select("*");
  // use fallbackData
}
```

**Mock fallback when Supabase not configured:**

```typescript
if (!isSupabaseConfigured()) {
  console.warn("Supabase not configured, returning mocks");
  return MOCK_DATA;
}
```

**Error display in UI:** Loading/error/empty states handled via wrapper components:

```typescript
{loading ? <Spinner /> : error ? <ErrorDisplay message={error} /> : <Content />}
```

## Logging

**Framework:** `console` (native browser console)

**Patterns:**

- `console.error('Error fetching X:', error)` for caught errors
- `console.warn('X nao disponivel, usando Y')` for fallback paths
- `console.log('Debug info:', data)` for development debugging
- Production build strips all console/debugger via Terser (`drop_console: true`)

## Comments

**When to Comment:**

- PT-BR comments for business logic explanations
- English comments for technical/code-level notes
- Inline comments explaining Supabase query logic or fallback reasoning
- `@deprecated` JSDoc tags used for legacy fields in types

**JSDoc/TSDoc:**

- Minimal usage; primarily on utility functions (`export-utils.ts`)
- `@deprecated` annotations on legacy type fields in `types.ts`
- No systematic JSDoc on components or hooks

## Data Fetching Pattern

**Standard hook structure (use this for all new hooks):**

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const useXxx = (param?: string) => {
  const [data, setData] = useState<Type[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from("table").select("*");
      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [param]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

**Key conventions:**

- Always return `{ data, loading, error, refetch }` from hooks
- Use `useCallback` for fetch functions
- Use `useEffect` to trigger initial fetch
- Error stored as `string | null`
- Loading starts as `true`

## Styling Conventions

**Framework:** Tailwind CSS v4 with CSS custom properties

**Theme tokens (use these, not raw colors):**

- Backgrounds: `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`, `bg-bg-hover`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Borders: `border-border-default`, `border-border-hover`
- Accents: `accent-primary` (blue), `accent-success` (green), `accent-warning` (amber), `accent-error` (red)
- Fonts: `font-sans` (Inter), `font-mono` (JetBrains Mono)

**Responsive pattern:** Mobile-first with `md:` breakpoint

```typescript
className = "text-xs md:text-sm p-3 md:p-4";
```

**Dark theme only:** The app uses a single dark theme defined via CSS variables in `index.css`. No light mode toggle in the main app.

## Context Pattern

**Standard context structure:**

```typescript
const XxxContext = createContext<XxxContextValue | undefined>(undefined);

export function XxxProvider({ children }: { children: React.ReactNode }) {
  // state and logic
  const value = useMemo(() => ({ ...state, actions }), [deps]);
  return <XxxContext.Provider value={value}>{children}</XxxContext.Provider>;
}

export function useXxx(): XxxContextValue {
  const context = useContext(XxxContext);
  if (context === undefined) {
    throw new Error('useXxx must be used within a XxxProvider');
  }
  return context;
}
```

## Module Design

**Exports:** Named exports preferred. Default exports only for `App.tsx` and occasional page components.

**Barrel Files:** Used in `hooks/index.ts`, `components/ui/index.ts`, `components/charts/index.ts`. Add new hooks/components to the relevant barrel file.

**Service objects:** Use object literal pattern with async methods:

```typescript
export const XxxService = {
  async getAll(): Promise<Type[]> { ... },
  async getById(id: string): Promise<Type | null> { ... },
};
```

## Type Conventions

**Types location:**

- Core domain types: `src/types.ts` (single file, ~350 lines)
- Feature-specific types: `src/types/supervision.ts`, `src/types/rpg.ts`
- Inline interfaces for hook state: defined inside the hook file
- Config maps with visual metadata: colocated with types (`qualityFlagConfig`, `severityConfig`)

**Supabase field naming:** Use snake_case matching database columns (`client_id`, `created_at`, `is_active`). Do not convert to camelCase.

**Optional fields:** Use `?` suffix liberally. Most fields from Supabase are optional due to nullable columns.

**`any` usage:** Used for JSONB columns (`Record<string, any>`), Lucide icon props (`icon?: any`), and catch blocks (`catch (err: any)`). Acceptable for JSONB but avoid expanding.

---

_Convention analysis: 2026-03-05_
