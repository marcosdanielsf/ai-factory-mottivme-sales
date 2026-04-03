# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**
- PascalCase for React components: `AuthContext.tsx`, `Button.tsx`, `DashboardView.tsx`
- camelCase for hooks: `useFormValidation.ts`, `useAuth.ts`, `useSupabaseData.ts`
- camelCase for utilities and constants: `constants.ts`, `types.ts`
- Index files export groups of components/hooks: `index.tsx`, `index.ts`

**Functions:**
- camelCase for function names: `signIn()`, `validateAll()`, `fetchUserProfile()`
- Component functions are PascalCase: `AuthProvider()`, `ThemeProvider()`, `Button()`
- Hook functions start with `use`: `useAuth()`, `useTheme()`, `useFormValidation()`
- Private helpers use camelCase with leading underscore discouraged — instead nested or in separate files: `generateSlug()`, `translateAuthError()`

**Variables:**
- camelCase for all variable declarations: `theme`, `setError`, `activeView`, `sidebarOpen`
- Boolean variables prefixed with `is`, `has`, `can`: `isLoading`, `isMounted`, `hasError`, `canValidate`
- State variables follow React pattern: `const [theme, setTheme] = useState(...)`
- Constants in UPPERCASE when exported: `METRICS`, `RECENT_CAMPAIGNS`, `MOCK_LEADS` (in `constants.ts`)

**Types:**
- PascalCase for interfaces: `AuthContextType`, `ThemeContextType`, `UserProfile`, `Tenant`
- PascalCase for type aliases: `NavItem`, `Channel`, `Theme`
- Generic types use PascalCase: `Record<string, any>`, `React.FC<Props>`

## Code Style

**Formatting:**
- Vite default (no explicit formatter configured)
- 2-space indentation (inferred from codebase)
- Semicolons at end of statements
- Double quotes for strings (observed in code)
- Trailing commas in multi-line objects/arrays

**Linting:**
- No ESLint configuration file present
- TypeScript compiler used for type checking: `npm run typecheck`
- No enforced linting rules beyond TypeScript strict mode

## Import Organization

**Order:**
1. React and React dependencies (`import React from 'react'`, `import { useState } from 'react'`)
2. Third-party libraries (`@supabase/supabase-js`, `lucide-react`, `recharts`)
3. Internal components and contexts (relative imports: `./components/...`, `./contexts/...`)
4. Internal types (relative imports: `./types`, `./hooks/...`)
5. Type-only imports placed near related import: `import type { User as SupabaseUser }`

**Path Aliases:**
- `@/*` maps to project root (defined in `tsconfig.json` and `vite.config.ts`)
- Import as: `import { LoadingSpinner } from '@/components/common/LoadingSpinner'`
- Path aliases used for deep imports to avoid relative paths

**Example:**
```typescript
import React, { useState, useCallback } from 'react';
import { supabase, auth } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/UI';
```

## Error Handling

**Patterns:**
- Try-catch blocks with error logging to console: `console.error('message:', err)`
- Errors stored in component state: `const [error, setError] = useState<string | null>(null)`
- Error messages translated via helper function: `translateAuthError(err.message)` in `AuthContext.tsx`
- Graceful fallbacks with warning logs: `console.warn('Tenant not found:', tenantError.message)`
- User-facing errors set in state and displayed in UI
- Internal errors logged to console without exposing to users

**Example from AuthContext:**
```typescript
try {
  setLoading(true);
  setError(null);
  const { error: signInError } = await auth.signIn(email, password);
  if (signInError) throw signInError;
} catch (err: any) {
  const message = translateAuthError(err.message);
  setError(message);
  throw err;
} finally {
  setLoading(false);
}
```

## Logging

**Framework:** console (no external logging library)

**Patterns:**
- `console.log()` for general info: `'[Auth] Initializing...'`, `'[Auth] Session:', currentSession ? 'found' : 'none'`
- `console.warn()` for non-critical issues: `'Tenant not found:', tenantError.message`
- `console.error()` for exceptions: `'Error fetching user profile:', err`
- Log prefixes in brackets for clarity: `'[Auth] message'`
- No debug logging in production

**Example:**
```typescript
console.log('[Auth] Initializing...');
console.warn('[Auth] Profile fetch failed:', profileErr);
console.error('[Auth] Error initializing:', err);
```

## Comments

**When to Comment:**
- Complex authentication flows (sections marked with `// ============================================`)
- Non-obvious business logic (e.g., fallback behavior)
- Workarounds or temporary solutions
- Integration points with external services

**JSDoc/TSDoc:**
- Used sparingly, not extensively documented
- Function parameters have TypeScript types instead of JSDoc
- Component prop types defined via TypeScript interfaces

**Example:**
```typescript
// ============================================
// SIGN IN
// ============================================

const signIn = async (email: string, password: string) => {
  // Implementation
};

// FETCH USER PROFILE AND TENANT
// Called after auth state change to load user context
```

## Function Design

**Size:**
- Most functions 10-50 lines
- Auth functions average 20-30 lines
- Complex hooks (like `AuthProvider`) broken into sections with comments
- Utility functions focused on single responsibility

**Parameters:**
- Use destructuring for object parameters: `({ children }: { children: React.ReactNode })`
- Typed parameters with TypeScript: `(email: string, password: string)`
- Optional parameters marked with `?`: `companyName?: string`
- Callback parameters typed explicitly: `(value: any) => string | null`

**Return Values:**
- Functions return typed values: `Promise<void>`, `boolean`, `Record<string, string | null>`
- Async functions always return `Promise<T>`
- Render functions return `React.ReactNode` or JSX element
- Utility functions return single focused type

**Example:**
```typescript
const validate = useCallback(
  (field: keyof T, value: any): string | null => {
    // validation logic
    return null; // or error message
  },
  [rules, t]
);
```

## Module Design

**Exports:**
- Named exports for functions/components: `export function useAuth() {...}`
- Default exports for single components: `export default function App() {...}`
- Type exports as named: `export interface AuthContextType { ... }`
- One context per file with related hook

**Barrel Files:**
- `components/leads/index.ts` exports individual components
- `hooks/index.ts` may export multiple hooks (if exists)
- Used to simplify imports: `import { Button } from '@/components/UI'`

**Example structure:**
```typescript
// AuthContext.tsx
export interface AuthContextType { ... }
export function AuthProvider({ children }: { children: React.ReactNode }) { ... }
export function useAuth() { ... }
```

---

*Convention analysis: 2026-03-25*
