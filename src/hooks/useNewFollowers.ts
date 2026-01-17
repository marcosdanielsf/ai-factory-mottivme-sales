import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Types
export interface InstagramAccount {
  id: string;
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
  account_id: string;
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

interface UseNewFollowersOptions {
  accountId?: string;
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

// Hook para listar novos seguidores
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
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

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

// Hook para listar contas monitoradas
interface UseMonitoredAccountsReturn {
  accounts: AccountSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addAccount: (username: string, tenantId: string) => Promise<InstagramAccount | null>;
  updateAccount: (id: string, updates: Partial<InstagramAccount>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
}

export const useMonitoredAccounts = (): UseMonitoredAccountsReturn => {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

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
    if (!isSupabaseConfigured()) return null;

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

  const updateAccount = useCallback(async (id: string, updates: Partial<InstagramAccount>): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error: updateError } = await supabase
        .from('instagram_accounts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchAccounts();
      return true;
    } catch (err: any) {
      console.error('Error updating account:', err);
      setError(err.message);
      return false;
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error: deleteError } = await supabase
        .from('instagram_accounts')
        .delete()
        .eq('id', id);

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

// Hook para atualizar status de outreach
interface UseOutreachActionsReturn {
  sendOutreach: (followerId: string, message: string) => Promise<boolean>;
  skipFollower: (followerId: string) => Promise<boolean>;
  bulkSendOutreach: (followerIds: string[], message: string) => Promise<number>;
  bulkSkipFollowers: (followerIds: string[]) => Promise<number>;
  loading: boolean;
}

export const useOutreachActions = (): UseOutreachActionsReturn => {
  const [loading, setLoading] = useState(false);

  const sendOutreach = useCallback(async (followerId: string, message: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      setLoading(true);

      const { error: updateError } = await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'sent',
          outreach_message: message,
          outreach_sent_at: new Date().toISOString(),
        })
        .eq('id', followerId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error sending outreach:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const skipFollower = useCallback(async (followerId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      setLoading(true);

      const { error: updateError } = await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'skipped',
        })
        .eq('id', followerId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error skipping follower:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkSendOutreach = useCallback(async (followerIds: string[], message: string): Promise<number> => {
    if (!isSupabaseConfigured() || followerIds.length === 0) return 0;

    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'sent',
          outreach_message: message,
          outreach_sent_at: new Date().toISOString(),
        })
        .in('id', followerIds)
        .select();

      if (updateError) throw updateError;

      return data?.length || 0;
    } catch (err) {
      console.error('Error bulk sending outreach:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkSkipFollowers = useCallback(async (followerIds: string[]): Promise<number> => {
    if (!isSupabaseConfigured() || followerIds.length === 0) return 0;

    try {
      setLoading(true);

      const { data, error: updateError } = await supabase
        .from('new_followers_detected')
        .update({
          outreach_status: 'skipped',
        })
        .in('id', followerIds)
        .select();

      if (updateError) throw updateError;

      return data?.length || 0;
    } catch (err) {
      console.error('Error bulk skipping followers:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendOutreach, skipFollower, bulkSendOutreach, bulkSkipFollowers, loading };
};
