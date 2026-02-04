/**
 * Hook para gerenciar contas Instagram conectadas
 * Usa AgenticOS API para criar/deletar sessões e Supabase para persistência
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================
// TYPES
// ============================================

export interface InstagramAccount {
  id: string;
  username: string;
  session_id: string;
  status: 'active' | 'blocked' | 'warming_up' | 'inactive' | 'pending';
  daily_limit: number;
  remaining_today: number;
  blocked_until?: string;
  last_action_at?: string;
  warmup_progress?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface CreateAccountParams {
  username: string;
  session_id: string;
}

export interface UseInstagramAccountsReturn {
  accounts: InstagramAccount[];
  loading: boolean;
  error: string | null;
  createAccount: (params: CreateAccountParams) => Promise<InstagramAccount | null>;
  deleteAccount: (accountId: string) => Promise<boolean>;
  validateSession: (sessionId: string) => Promise<{ valid: boolean; username?: string; error?: string }>;
  refetch: () => Promise<void>;
}

// ============================================
// HOOK: useInstagramAccounts
// ============================================

export function useInstagramAccounts(): UseInstagramAccountsReturn {
  const { user, tenant } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tenant_id from AuthContext tenant (carregado do Supabase)
  const tenantId = tenant?.id || user?.user_metadata?.tenant_id || user?.user_metadata?.organization_id || 'demo';

  /**
   * Busca contas do Supabase e sincroniza com AgenticOS
   */
  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Buscar contas do Supabase (tabela: instagram_sessions)
      const { data: supabaseAccounts, error: dbError } = await supabase
        .from('instagram_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.warn('Supabase accounts not found, trying AgenticOS:', dbError.message);
      }

      // 2. Buscar status atual do AgenticOS
      let agenticAccounts: any[] = [];
      try {
        const response = await fetch(`${API_BASE_URL}/followers/accounts`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          agenticAccounts = Array.isArray(data) ? data : (data.accounts || data.data || []);
        }
      } catch (apiErr) {
        console.warn('AgenticOS API not available:', apiErr);
      }

      // 3. Merge data - Supabase como fonte principal, AgenticOS para status
      const mergedAccounts: InstagramAccount[] = (supabaseAccounts || []).map((acc: any) => {
        // Find matching AgenticOS account by username
        const agenticAcc = agenticAccounts.find(
          (a: any) => a.username?.toLowerCase() === acc.username?.toLowerCase()
        );

        return {
          id: acc.id,
          username: acc.username,
          session_id: acc.session_id,
          status: agenticAcc?.status || acc.status || 'pending',
          daily_limit: agenticAcc?.daily_limit || acc.daily_limit || 100,
          remaining_today: agenticAcc?.remaining_today || acc.remaining_today || 100,
          blocked_until: agenticAcc?.blocked_until || acc.blocked_until,
          last_action_at: agenticAcc?.last_action_at || acc.last_action_at,
          warmup_progress: agenticAcc?.warmup_progress || acc.warmup_progress,
          error_message: agenticAcc?.error_message || acc.error_message,
          created_at: acc.created_at,
          updated_at: acc.updated_at,
          tenant_id: acc.tenant_id,
        };
      });

      // 4. Se não houver contas no Supabase, usar AgenticOS como fallback
      if (mergedAccounts.length === 0 && agenticAccounts.length > 0) {
        const fallbackAccounts: InstagramAccount[] = agenticAccounts.map((acc: any) => ({
          id: String(acc.id || acc.account_id || crypto.randomUUID()),
          username: acc.username || acc.name || 'unknown',
          session_id: acc.session_id || '',
          status: normalizeStatus(acc.status || 'active'),
          daily_limit: acc.daily_limit || 100,
          remaining_today: acc.remaining_today || acc.remaining || 100,
          blocked_until: acc.blocked_until,
          last_action_at: acc.last_action_at || acc.updated_at,
          warmup_progress: acc.warmup_progress,
          error_message: acc.error_message,
          created_at: acc.created_at || new Date().toISOString(),
          updated_at: acc.updated_at || new Date().toISOString(),
          tenant_id: tenantId,
        }));
        setAccounts(fallbackAccounts);
      } else {
        setAccounts(mergedAccounts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar contas';
      setError(message);
      console.error('useInstagramAccounts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId]);

  /**
   * Valida session_id com Instagram
   */
  const validateSession = useCallback(async (sessionId: string): Promise<{ valid: boolean; username?: string; error?: string }> => {
    try {
      // Tenta validar via AgenticOS
      const response = await fetch(`${API_BASE_URL}/followers/validate-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: data.valid || data.success || false,
          username: data.username || data.user?.username,
        };
      }

      // If endpoint doesn't exist, try a lighter validation
      if (response.status === 404) {
        // Basic validation - session_id should be a long string
        const isValidFormat = sessionId.length > 50 && sessionId.includes('%');
        return {
          valid: isValidFormat,
          error: isValidFormat ? undefined : 'Formato de session_id inválido',
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: errorData.detail || errorData.message || 'Sessão inválida',
      };
    } catch (err) {
      console.warn('Session validation error:', err);
      // Fallback: basic format validation
      const isValidFormat = sessionId.length > 20;
      return {
        valid: isValidFormat,
        error: isValidFormat ? undefined : 'Não foi possível validar a sessão',
      };
    }
  }, []);

  /**
   * Cria nova conta Instagram
   */
  const createAccount = useCallback(async (params: CreateAccountParams): Promise<InstagramAccount | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Validação básica do session_id (formato)
      if (!params.session_id || params.session_id.length < 20) {
        setError('Session ID muito curto ou inválido');
        setLoading(false);
        return null;
      }

      if (!params.username || params.username.length < 1) {
        setError('Username é obrigatório');
        setLoading(false);
        return null;
      }

      // 2. Tentar validar via AgenticOS (opcional - não bloqueia se falhar)
      try {
        const response = await fetch(`${API_BASE_URL}/api/instagram/connect`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          body: JSON.stringify({
            session_id: params.session_id,
            username: params.username,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AgenticOS connect response:', data);
        } else {
          console.warn('AgenticOS connect failed, saving locally');
        }
      } catch (apiErr) {
        console.warn('AgenticOS API not available:', apiErr);
      }

      // 3. Salvar no Supabase (tabela: instagram_sessions)
      const newAccount = {
        id: crypto.randomUUID(),
        username: params.username.replace('@', ''),
        session_id_encrypted: params.session_id, // Note: em produção, encriptar no backend
        status: 'active',
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: savedAccount, error: dbError } = await supabase
        .from('instagram_sessions')
        .upsert(newAccount, { onConflict: 'tenant_id,username' })
        .select()
        .single();

      if (dbError) {
        console.error('Supabase save error:', dbError);
        throw new Error(dbError.message || 'Erro ao salvar conta');
      }

      // Mapear para o tipo esperado
      const createdAccount: InstagramAccount = {
        id: savedAccount.id,
        username: savedAccount.username,
        session_id: savedAccount.session_id_encrypted,
        status: savedAccount.status || 'active',
        daily_limit: 100,
        remaining_today: 100,
        tenant_id: savedAccount.tenant_id,
        created_at: savedAccount.created_at,
        updated_at: savedAccount.updated_at,
      };

      setAccounts((prev) => [createdAccount, ...prev]);
      return createdAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(message);
      console.error('createAccount error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, tenantId]);

  /**
   * Remove conta Instagram
   */
  const deleteAccount = useCallback(async (accountId: string): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Find account to get username
      const account = accounts.find((a) => a.id === accountId);

      // 1. Remover do AgenticOS
      if (account) {
        try {
          await fetch(`${API_BASE_URL}/followers/accounts/${account.username}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (apiErr) {
          console.warn('AgenticOS delete error (non-critical):', apiErr);
        }
      }

      // 2. Remover do Supabase (tabela: instagram_sessions)
      const { error: dbError } = await supabase
        .from('instagram_sessions')
        .delete()
        .eq('id', accountId)
        .eq('tenant_id', tenantId);

      if (dbError) {
        console.warn('Supabase delete error:', dbError);
        // Continue anyway to update UI
      }

      // 3. Atualizar estado local
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover conta';
      setError(message);
      console.error('deleteAccount error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, accounts]);

  // Auto-fetch on mount and when user changes
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    error,
    createAccount,
    deleteAccount,
    validateSession,
    refetch: fetchAccounts,
  };
}

// ============================================
// HELPERS
// ============================================

function normalizeStatus(status: string): InstagramAccount['status'] {
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
  if (normalized.includes('pending') || normalized.includes('validat')) {
    return 'pending';
  }

  return 'inactive';
}

export default useInstagramAccounts;
