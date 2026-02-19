import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type ApolloLeadStatus = 'new' | 'enriched' | 'contacted' | 'qualified' | 'disqualified';

export interface ApolloLead {
  id: string;
  list_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  email_status?: string;
  phone?: string;
  title?: string;
  company?: string;
  company_domain?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  employee_count?: number;
  revenue?: string;
  status: ApolloLeadStatus;
  icp_score?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ApolloLeadsByStatus {
  status: ApolloLeadStatus;
  count: number;
}

export interface UseApolloLeadsOptions {
  listId?: string;
  status?: ApolloLeadStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useApolloLeads = (options: UseApolloLeadsOptions = {}) => {
  const { listId, status, search, page = 1, pageSize = 50 } = options;

  const [leads, setLeads] = useState<ApolloLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [byStatus, setByStatus] = useState<ApolloLeadsByStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let query = supabase
        .schema('leadgen')
        .from('apollo_leads')
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
          `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
        );
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setLeads(data || []);
      setTotalCount(count || 0);

      // Fetch status grouping
      const { data: statusData, error: statusError } = await supabase
        .schema('leadgen')
        .from('apollo_leads')
        .select('status');

      if (statusError) throw statusError;

      const statusCounts = new Map<ApolloLeadStatus, number>();
      (statusData || []).forEach((row) => {
        const s = row.status as ApolloLeadStatus;
        statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
      });

      setByStatus(
        Array.from(statusCounts.entries()).map(([s, c]) => ({ status: s, count: c }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads Apollo';
      setError(message);
      console.error('Error in useApolloLeads:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, status, search, page, pageSize]);

  const updateLeadStatus = useCallback(async (id: string, newStatus: ApolloLeadStatus) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('apollo_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLeads();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Error updating apollo lead status:', err);
      throw new Error(message);
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, totalCount, byStatus, loading, error, refetch: fetchLeads, updateLeadStatus };
};
