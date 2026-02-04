import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface InstagramAccount {
  id: number;
  tenant_id: string;
  username: string;
  instagram_user_id?: string;
  display_name?: string;
  profile_pic_url?: string;
  followers_count: number;
  is_active: boolean;
  last_check_at?: string;
  outreach_enabled: boolean;
  outreach_min_icp_score: number;
  outreach_daily_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AccountSummary extends InstagramAccount {
  total_new_followers: number;
  pending_count: number;
  sent_count: number;
  responded_count: number;
  skipped_count: number;
  ready_for_outreach: number;
  avg_icp_score: number | null;
  last_follower_detected_at?: string;
}

export interface NewFollower {
  id: string;
  account_id: number;
  follower_user_id: string;
  follower_username: string;
  follower_full_name?: string;
  follower_bio?: string;
  follower_profile_pic?: string;
  follower_followers_count?: number;
  follower_following_count?: number;
  follower_is_business?: boolean;
  follower_is_verified?: boolean;
  icp_score?: number;
  icp_analysis?: Record<string, any>;
  outreach_status: 'pending' | 'sent' | 'responded' | 'skipped' | 'failed';
  outreach_message?: string;
  outreach_sent_at?: string;
  outreach_response?: string;
  outreach_responded_at?: string;
  detected_at: string;
  created_at: string;
  updated_at: string;
  // From view
  account_username?: string;
  account_display_name?: string;
  tenant_id?: string;
  outreach_enabled?: boolean;
  outreach_min_icp_score?: number;
  meets_icp_threshold?: boolean;
}

export type OutreachStatus = 'all' | 'pending' | 'sent' | 'responded' | 'skipped' | 'failed';

// ============================================================================
// useNewFollowers - Lista seguidores detectados
// ============================================================================

interface UseNewFollowersOptions {
  accountId?: number;
  status?: OutreachStatus;
  minIcpScore?: number;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

interface UseNewFollowersReturn {
  followers: NewFollower[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNewFollowers = (options: UseNewFollowersOptions = {}): UseNewFollowersReturn => {
  const {
    accountId,
    status = 'all',
    minIcpScore,
    searchTerm = '',
    page = 1,
    pageSize = 20,
  } = options;

  const [followers, setFollowers] = useState<NewFollower[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('vw_new_followers_list')
        .select('*', { count: 'exact' });

      // Filtro por conta
      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      // Filtro por status
      if (status !== 'all') {
        query = query.eq('outreach_status', status);
      }

      // Filtro por ICP score minimo
      if (minIcpScore !== undefined) {
        query = query.gte('icp_score', minIcpScore);
      }

      // Filtro por busca
      if (searchTerm) {
        query = query.or(
          `follower_username.ilike.%${searchTerm}%,follower_full_name.ilike.%${searchTerm}%,follower_bio.ilike.%${searchTerm}%`
        );
      }

      // Ordenacao e paginacao
      query = query
        .order('detected_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw queryError;
      }

      setFollowers((data || []) as NewFollower[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar novos seguidores');
      console.error('Error fetching new followers:', err);
    } finally {
      setLoading(false);
    }
  }, [accountId, status, minIcpScore, searchTerm, page, pageSize]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return { followers, totalCount, loading, error, refetch: fetchFollowers };
};

// ============================================================================
// useMonitoredAccounts - Gerencia contas monitoradas
// ============================================================================

interface UseMonitoredAccountsReturn {
  accounts: AccountSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addAccount: (username: string, tenantId: string) => Promise<InstagramAccount | null>;
  updateAccount: (id: number, updates: Partial<InstagramAccount>) => Promise<boolean>;
  deleteAccount: (id: number) => Promise<boolean>;
}

export const useMonitoredAccounts = (): UseMonitoredAccountsReturn => {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('vw_new_followers_summary')
        .select('*')
        .order('last_check_at', { ascending: false, nullsFirst: false });

      if (queryError) {
        throw queryError;
      }

      setAccounts((data || []) as AccountSummary[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contas monitoradas');
      console.error('Error fetching monitored accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (username: string, tenantId: string): Promise<InstagramAccount | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('instagram_accounts')
        .insert({
          username: username.replace('@', ''),
          tenant_id: tenantId,
          is_active: true,
          outreach_enabled: false,
          outreach_min_icp_score: 70,
          outreach_daily_limit: 50,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchAccounts();
      return data as InstagramAccount;
    } catch (err: any) {
      console.error('Error adding account:', err);
      setError(err.message);
      return null;
    }
  }, [fetchAccounts]);

  // FIX: Garantir que o ID seja passado como numero para o Supabase
  const updateAccount = useCallback(async (id: number, updates: Partial<InstagramAccount>): Promise<boolean> => {
    try {
      // Garantir que id seja numero (fix do bug)
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

      if (isNaN(numericId)) {
        console.error('Invalid account ID:', id);
        return false;
      }

      const { data, error: updateError } = await supabase
        .from('instagram_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', numericId)
        .select();

      if (updateError) throw updateError;

      // Se nao retornou dados, o update nao encontrou a linha
      if (!data || data.length === 0) {
        console.warn('Update returned no rows - check if ID exists:', numericId);
        return false;
      }

      await fetchAccounts();
      return true;
    } catch (err: any) {
      console.error('Error updating account:', err);
      setError(err.message);
      return false;
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: number): Promise<boolean> => {
    try {
      const numericId = typeof id === 'string' ? parseInt(id as unknown as string, 10) : id;

      const { error: deleteError } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('id', numericId);

      if (deleteError) throw deleteError;

      await fetchAccounts();
      return true;
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message);
      return false;
    }
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts, addAccount, updateAccount, deleteAccount };
};

// ============================================================================
// useOutreachActions - Acoes de outreach (enviar DM, skip, etc)
// Agora chama a API real do Railway para enviar DMs
// ============================================================================

// URL da API de Outreach (Railway)
const OUTREACH_API_URL = import.meta.env.VITE_OUTREACH_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

interface OutreachApiResponse {
  success: boolean;
  follower_id?: string;
  username?: string;
  message?: string;
  error?: string;
  processing_in_background?: boolean;
}

interface UseOutreachActionsReturn {
  sendOutreach: (followerId: string, message: string) => Promise<boolean>;
  skipFollower: (followerId: string) => Promise<boolean>;
  bulkSendOutreach: (followerIds: string[], message: string) => Promise<number>;
  bulkSkipFollowers: (followerIds: string[]) => Promise<number>;
  loading: boolean;
  lastError: string | null;
}

export const useOutreachActions = (): UseOutreachActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Envia DM real via API Railway
  const sendOutreach = useCallback(async (followerId: string, message: string): Promise<boolean> => {
    try {
      setLoading(true);
      setLastError(null);

      // 1. Chamar API real para enviar DM
      const response = await fetch(`${OUTREACH_API_URL}/followers/outreach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          follower_id: followerId,
          message: message,
        }),
      });

      const result: OutreachApiResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || `Erro ao enviar DM: ${response.status}`;
        setLastError(errorMsg);
        console.error('Outreach API error:', errorMsg);

        // Atualizar status como failed no banco local
        await supabase
          .from('new_followers_detected')
          .update({
            outreach_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', followerId);

        return false;
      }

      // 2. Se sucesso, o backend ja atualiza o banco, mas garantimos aqui tambem
      await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'sent',
          outreach_message: message,
          outreach_sent_at: new Date().toISOString(),
        })
        .eq('id', followerId);

      return true;
    } catch (err: any) {
      const errorMsg = err.message || 'Erro de conexao com API de outreach';
      setLastError(errorMsg);
      console.error('Error sending outreach:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Skip via API (mais simples, pode ser local)
  const skipFollower = useCallback(async (followerId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setLastError(null);

      // Chamar API para skip (ou fazer direto no banco)
      const response = await fetch(`${OUTREACH_API_URL}/followers/skip?follower_id=${followerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback: atualizar direto no banco
        const { error: updateError } = await supabase
          .from('new_followers_detected')
          .update({
            outreach_status: 'skipped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', followerId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (err: any) {
      setLastError(err.message);
      console.error('Error skipping follower:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk outreach via API (executa em background)
  const bulkSendOutreach = useCallback(async (followerIds: string[], message: string): Promise<number> => {
    if (followerIds.length === 0) return 0;

    try {
      setLoading(true);
      setLastError(null);

      // Chamar API de bulk outreach (executa em background)
      const response = await fetch(`${OUTREACH_API_URL}/followers/outreach/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          follower_ids: followerIds,
          message: message,
        }),
      });

      const result: OutreachApiResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || `Erro no bulk outreach: ${response.status}`;
        setLastError(errorMsg);
        console.error('Bulk outreach API error:', errorMsg);
        return 0;
      }

      // Se executando em background, retornar quantidade iniciada
      if (result.processing_in_background) {
        console.log(`Bulk outreach iniciado para ${followerIds.length} seguidores (background)`);
        return followerIds.length;
      }

      return followerIds.length;
    } catch (err: any) {
      setLastError(err.message);
      console.error('Error bulk sending outreach:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk skip (pode ser local, mais rapido)
  const bulkSkipFollowers = useCallback(async (followerIds: string[]): Promise<number> => {
    if (followerIds.length === 0) return 0;

    try {
      setLoading(true);
      setLastError(null);

      const { data, error: updateError } = await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'skipped',
          updated_at: new Date().toISOString(),
        })
        .in('id', followerIds)
        .select();

      if (updateError) throw updateError;

      return data?.length || 0;
    } catch (err: any) {
      setLastError(err.message);
      console.error('Error bulk skipping followers:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendOutreach, skipFollower, bulkSendOutreach, bulkSkipFollowers, loading, lastError };
};

// ============================================================================
// useRateLimitStatus - Monitora limites de envio de DMs
// ============================================================================

export interface AccountRateLimitStatus {
  account_id: number;
  username: string;
  daily_limit: number;
  sent_today: number;
  remaining_today: number;
  pending_followers: number;
  outreach_enabled: boolean;
  usage_percent: number;
}

export interface RateLimitStatus {
  accounts: AccountRateLimitStatus[];
  total_capacity_today: number;
  total_sent_today: number;
  total_remaining_today: number;
  overall_usage_percent: number;
}

interface UseRateLimitStatusReturn {
  status: RateLimitStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRateLimitStatus = (): UseRateLimitStatusReturn => {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${OUTREACH_API_URL}/followers/auto-outreach/status`);

      if (!response.ok) {
        throw new Error(`Erro ao buscar status: ${response.status}`);
      }

      const data = await response.json();

      // Calcular porcentagens
      const accounts = (data.accounts || []).map((acc: any) => ({
        ...acc,
        usage_percent: acc.daily_limit > 0
          ? Math.round((acc.sent_today / acc.daily_limit) * 100)
          : 0
      }));

      const totalCapacity = data.total_capacity_today || 0;
      const totalSent = data.total_sent_today || 0;

      setStatus({
        accounts,
        total_capacity_today: totalCapacity,
        total_sent_today: totalSent,
        total_remaining_today: data.total_remaining_today || 0,
        overall_usage_percent: totalCapacity > 0
          ? Math.round((totalSent / totalCapacity) * 100)
          : 0
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar status de rate limit');
      console.error('Error fetching rate limit status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};
