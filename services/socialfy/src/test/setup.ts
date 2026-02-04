import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: { unsubscribe: vi.fn() }
        }
      })),
    },
  },
  auth: {
    signIn: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getSession: vi.fn(() => Promise.resolve({ session: null, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: { unsubscribe: vi.fn() }
      }
    })),
  },
  db: {
    leads: { list: vi.fn() },
    campaigns: { list: vi.fn() },
    pipeline: { list: vi.fn() },
    accounts: { list: vi.fn() },
    agents: { list: vi.fn() },
  },
}));

// Mock localStorage
const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() };
global.localStorage = localStorageMock as any;
