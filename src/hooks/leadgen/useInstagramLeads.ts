import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type InstagramLeadStatus = 'new' | 'enriched' | 'contacted' | 'qualified' | 'disqualified';

export interface InstagramLead {
  id: string;
  list_id?: string;
  username?: string;
  full_name?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  followers?: number;
  following?: number;
  posts_count?: number;
  is_business?: boolean;
  business_category?: string;
  avatar_url?: string;
  profile_url?: string;
  location?: string;
  status: InstagramLeadStatus;
  icp_score?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseInstagramLeadsOptions {
  listId?: string;
  status?: InstagramLeadStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useInstagramLeads = (options: UseInstagramLeadsOptions = {}) => {
  const { listId, status, search, page = 1, pageSize = 50 } = options;

  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [byStatus, setByStatus] = useState<{ status: InstagramLeadStatus; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let query = supabase
        .schema('leadgen')
        .from('instagram_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (listId) {
        query = query.eq('list_id', listId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(
          `username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,bio.ilike.%${search}%`
        );
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setLeads(data || []);
      setTotalCount(count || 0);

      // Fetch status grouping
      const { data: statusData, error: statusError } = await supabase
        .schema('leadgen')
        .from('instagram_leads')
        .select('status');

      if (statusError) throw statusError;

      const statusCounts = new Map<InstagramLeadStatus, number>();
      (statusData || []).forEach((row) => {
        const s = row.status as InstagramLeadStatus;
        statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
      });

      setByStatus(
        Array.from(statusCounts.entries()).map(([s, c]) => ({ status: s, count: c }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads Instagram';
      setError(message);
      console.error('Error in useInstagramLeads:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, status, search, page, pageSize]);

  const updateLeadStatus = useCallback(async (id: string, newStatus: InstagramLeadStatus) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('instagram_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLeads();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Error updating instagram lead status:', err);
      throw new Error(message);
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, totalCount, byStatus, loading, error, refetch: fetchLeads, updateLeadStatus };
};
