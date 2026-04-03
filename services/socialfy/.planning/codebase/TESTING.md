# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**Runner:**
- Vitest 2.0.0
- Config: `vitest.config.ts`
- Environment: jsdom (browser-like)
- Globals enabled: `true` (no need to import `describe`, `it`, `expect`)

**Assertion Library:**
- `@testing-library/jest-dom` (provides DOM matchers)
- Native Vitest assertions via `expect()`

**Run Commands:**
```bash
npm run test              # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage reporting
npm run typecheck        # TypeScript type checking (separate from tests)
```

## Test File Organization

**Location:**
- Tests co-located with source: `components/__tests__/Button.test.tsx`
- Tests in `__tests__/` directory within the same folder as source file
- Setup file: `src/test/setup.ts` (configured in vitest.config.ts)

**Naming:**
- Pattern: `[ComponentName].test.tsx` or `[HookName].test.tsx`
- Examples: `Button.test.tsx`, `AuthContext.test.tsx`, `useFormValidation.test.tsx`

**Structure:**
```
components/
├── __tests__/
│   └── Button.test.tsx
├── UI.tsx
└── common/
    └── [other components]

contexts/
├── __tests__/
│   └── AuthContext.test.tsx
├── AuthContext.tsx
└── ThemeContext.tsx

hooks/
├── __tests__/
│   └── useFormValidation.test.tsx
└── useFormValidation.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Button } from '../UI';

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Patterns:**
- `describe()` groups related tests
- `it()` describes individual test case
- `beforeEach()` runs before each test (used to clear mocks)
- `vi.clearAllMocks()` resets spy/mock state
- Async tests use `async/await` with `waitFor()`

## Mocking

**Framework:** Vitest's `vi` object (mimics Jest)

**Setup File Mocks:**
Located in `src/test/setup.ts`, provides global mocks:

```typescript
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
  },
  auth: { /* similar structure */ },
}));

// localStorage mock
const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() };
global.localStorage = localStorageMock as any;
```

**Mocking Patterns in Tests:**

Function mocks:
```typescript
const handleClick = vi.fn();
render(<Button onClick={handleClick}>Click</Button>);
expect(handleClick).toHaveBeenCalledTimes(1);
```

Mocking auth methods:
```typescript
(auth.getSession as any).mockResolvedValue({ session: null, error: null });
(auth.signIn as any).mockResolvedValue({ data: null, error: null });
```

**What to Mock:**
- External API calls (Supabase auth, database queries)
- Browser APIs (localStorage, fetch)
- Third-party library functions
- Callbacks and event handlers in isolated tests

**What NOT to Mock:**
- React hooks (useState, useCallback) — test actual behavior
- Context providers when testing components that consume them
- Tailwind classes in rendered output (test via DOM selectors instead)
- User interactions (use `userEvent` instead of manually calling handlers)

## Fixtures and Factories

**Test Data:**
Named patterns in test files (no separate fixture files observed):

```typescript
// From Button.test.tsx
render(<Button>Click me</Button>);
render(<Button loading={true}>Submit</Button>);
render(<Button variant="secondary">Secondary Button</Button>);

// From AuthContext.test.tsx
const TestComponent = () => {
  const { user, loading, signIn, signOut, error } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
    </div>
  );
};
```

**Location:**
- Test data defined inline in test files
- No centralized fixtures directory
- Wrapper components defined at top of test file

**Pattern for Context Wrappers:**
```typescript
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const { result } = renderHook(() => useFormValidation(rules), { wrapper });
```

## Coverage

**Requirements:** Not enforced (no coverage thresholds in vitest.config.ts)

**View Coverage:**
```bash
npm run test:coverage
```

Generates coverage report for lines, branches, functions, statements.

**Current Test Count:**
- 3 test files found in codebase:
  - `contexts/__tests__/AuthContext.test.tsx` (8 test cases)
  - `components/__tests__/Button.test.tsx` (13 test cases)
  - `hooks/__tests__/useFormValidation.test.tsx` (9 test cases)
- Total: ~30 test cases

## Test Types

**Unit Tests:**
- Scope: Individual components, hooks, utility functions
- Approach: Test component props, hook state changes, validation logic
- Example: `Button.test.tsx` tests button variants, disabled state, click handling
- Example: `useFormValidation.test.tsx` tests validation rules (required, email, minLength, pattern, custom)

**Integration Tests:**
- Scope: Context providers with components that consume them
- Approach: Render provider + test component, verify context effects
- Example: `AuthContext.test.tsx` tests useAuth hook within AuthProvider
- Tests authentication state flow: loading → authenticated → signed out

**E2E Tests:**
- Framework: Not used
- Status: Not implemented yet
- Future: Should test full user journeys (login → dashboard → logout)

## Common Patterns

**Async Testing:**
```typescript
it('starts with no user (loading state)', async () => {
  (auth.getSession as any).mockResolvedValue({ session: null, error: null });
  (auth.onAuthStateChange as any).mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  });

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  // Initially loading
  expect(screen.getByTestId('loading')).toHaveTextContent('loading');

  // After initialization, should be ready with no user
  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
  });

  expect(screen.getByTestId('user')).toHaveTextContent('no-user');
});
```

**Error Testing:**
```typescript
it('handles auth errors', async () => {
  const errorMessage = 'Invalid credentials';
  (auth.signIn as any).mockResolvedValue({
    data: null,
    error: { message: errorMessage }
  });

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
  });

  const signInButton = screen.getByText('Sign In');
  signInButton.click();

  await waitFor(() => {
    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
  });
});
```

**User Interaction Testing:**
```typescript
it('handles click events when not disabled', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Click me</Button>);

  const button = screen.getByRole('button', { name: /click me/i });
  await user.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**DOM Query Patterns:**
- `screen.getByRole('button', { name: /text/i })` — preferred for accessibility
- `screen.getByTestId('id')` — for elements without semantic roles
- `screen.getByText('text')` — for simple text matching
- `screen.queryByRole()` — when element might not exist
- All queries use `screen` object (recommended by Testing Library)

**Validation Hook Testing:**
```typescript
it('validates required fields', () => {
  const rules = { email: { required: true } };
  const { result } = renderHook(() => useFormValidation(rules), { wrapper });

  // Test empty value (should fail)
  const errorEmpty = result.current.validate('email', '');
  expect(errorEmpty).toBeTruthy();

  // Test with value (should pass)
  const errorWithValue = result.current.validate('email', 'test@example.com');
  expect(errorWithValue).toBeNull();
});
```

---

*Testing analysis: 2026-03-25*
