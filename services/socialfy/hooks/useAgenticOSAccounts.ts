/**
 * Hook para gerenciar contas Instagram do AgenticOS
 * Endpoint: GET /api/accounts/{tenant_id}
 */

import { useState, useCallback, useEffect } from 'react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================
// TYPES
// ============================================

export interface AgenticOSAccount {
  id: number;
  username: string;
  status: 'active' | 'blocked' | 'warming_up' | 'inactive';
  daily_limit: number;
  remaining_today: number;
  blocked_until?: string;
  last_action_at?: string;
  warmup_progress?: number;
  error_message?: string;
}

export interface AgenticOSAccountsResponse {
  accounts: AgenticOSAccount[];
  total: number;
}

export interface UseAgenticOSAccountsReturn {
  accounts: AgenticOSAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================
// HOOK: useAgenticOSAccounts
// ============================================

export function useAgenticOSAccounts(autoFetch: boolean = true): UseAgenticOSAccountsReturn {
  const [accounts, setAccounts] = useState<AgenticOSAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca lista de contas Instagram do AgenticOS
   */
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use /followers/accounts endpoint which returns all accounts
      const endpoint = `${API_BASE_URL}/followers/accounts`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch accounts: ${response.status}`);
      }

      const data = await response.json();

      // Handle both array response and object with accounts property
      let accountsList: AgenticOSAccount[] = [];

      if (Array.isArray(data)) {
        accountsList = data;
      } else if (data.accounts && Array.isArray(data.accounts)) {
        accountsList = data.accounts;
      } else if (data.data && Array.isArray(data.data)) {
        accountsList = data.data;
      }

      // Normalize account data
      const normalizedAccounts: AgenticOSAccount[] = accountsList.map((acc: any) => ({
        id: acc.id ?? acc.account_id ?? 0,
        username: acc.username ?? acc.name ?? 'unknown',
        status: normalizeStatus(acc.status ?? acc.account_status ?? 'inactive'),
        daily_limit: acc.daily_limit ?? acc.limit ?? 100,
        remaining_today: acc.remaining_today ?? acc.remaining ?? acc.daily_limit ?? 100,
        blocked_until: acc.blocked_until ?? acc.unblock_at ?? undefined,
        last_action_at: acc.last_action_at ?? acc.updated_at ?? undefined,
        warmup_progress: acc.warmup_progress ?? undefined,
        error_message: acc.error_message ?? acc.error ?? undefined,
      }));

      setAccounts(normalizedAccounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching accounts';
      setError(message);
      console.error('useAgenticOSAccounts error:', err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount (if enabled)
  useEffect(() => {
    if (autoFetch) {
      fetchAccounts();
    }
  }, [autoFetch, fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
  };
}

// ============================================
// HELPERS
// ============================================

function normalizeStatus(status: string): 'active' | 'blocked' | 'warming_up' | 'inactive' {
  const normalized = status.toLowerCase();

  if (normalized.includes('active') || normalized === 'connected') {
    return 'active';
  }
  if (normalized.includes('block') || normalized.includes('banned')) {
    return 'blocked';
  }
  if (normalized.includes('warm') || normalized.includes('warming')) {
    return 'warming_up';
  }

  return 'inactive';
}

export default useAgenticOSAccounts;
