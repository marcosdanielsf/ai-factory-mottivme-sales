import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type LinkedinLeadStatus = 'new' | 'enriched' | 'contacted' | 'qualified' | 'disqualified';

export interface LinkedinLead {
  id: string;
  list_id?: string;
  user_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  title?: string;
  company?: string;
  company_linkedin_url?: string;
  profile_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  industry?: string;
  connections?: number;
  followers?: number;
  avatar_url?: string;
  status: LinkedinLeadStatus;
  icp_score?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkedinLeadsByUser {
  user_name: string;
  count: number;
}

export interface UseLinkedinLeadsOptions {
  listId?: string;
  status?: LinkedinLeadStatus;
  userName?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useLinkedinLeads = (options: UseLinkedinLeadsOptions = {}) => {
  const { listId, status, userName, search, page = 1, pageSize = 50 } = options;

  const [leads, setLeads] = useState<LinkedinLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [byUser, setByUser] = useState<LinkedinLeadsByUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let query = supabase
        .schema('leadgen')
        .from('linkedin_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (listId) {
        query = query.eq('list_id', listId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (userName) {
        query = query.eq('user_name', userName);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,headline.ilike.%${search}%`
        );
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setLeads(data || []);
      setTotalCount(count || 0);

      // Fetch grouping by user_name
      const { data: userData, error: userGroupError } = await supabase
        .schema('leadgen')
        .from('linkedin_leads')
        .select('user_name');

      if (userGroupError) throw userGroupError;

      const userCounts = new Map<string, number>();
      (userData || []).forEach((row) => {
        const u = row.user_name || 'Desconhecido';
        userCounts.set(u, (userCounts.get(u) || 0) + 1);
      });

      setByUser(
        Array.from(userCounts.entries())
          .map(([u, c]) => ({ user_name: u, count: c }))
          .sort((a, b) => b.count - a.count)
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads LinkedIn';
      setError(message);
      console.error('Error in useLinkedinLeads:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, status, userName, search, page, pageSize]);

  const updateLeadStatus = useCallback(async (id: string, newStatus: LinkedinLeadStatus) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('linkedin_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLeads();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Error updating linkedin lead status:', err);
      throw new Error(message);
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, totalCount, byUser, loading, error, refetch: fetchLeads, updateLeadStatus };
};
