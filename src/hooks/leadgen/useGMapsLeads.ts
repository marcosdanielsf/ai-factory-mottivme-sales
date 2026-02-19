import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type GMapsLeadStatus = 'new' | 'enriched' | 'contacted' | 'qualified' | 'disqualified';

export interface GMapsLead {
  id: string;
  list_id?: string;
  query?: string;
  place_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  rating?: number;
  reviews_count?: number;
  category?: string;
  status: GMapsLeadStatus;
  icp_score?: number;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GMapsLeadsByQuery {
  query: string;
  count: number;
}

export interface UseGMapsLeadsOptions {
  listId?: string;
  status?: GMapsLeadStatus;
  query?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useGMapsLeads = (options: UseGMapsLeadsOptions = {}) => {
  const { listId, status, query, search, page = 1, pageSize = 50 } = options;

  const [leads, setLeads] = useState<GMapsLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [byQuery, setByQuery] = useState<GMapsLeadsByQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let dbQuery = supabase
        .schema('leadgen')
        .from('gmaps_leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (listId) {
        dbQuery = dbQuery.eq('list_id', listId);
      }

      if (status) {
        dbQuery = dbQuery.eq('status', status);
      }

      if (query) {
        dbQuery = dbQuery.eq('query', query);
      }

      if (search) {
        dbQuery = dbQuery.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`
        );
      }

      const { data, error: queryError, count } = await dbQuery;

      if (queryError) throw queryError;

      setLeads(data || []);
      setTotalCount(count || 0);

      // Fetch grouping by query
      const { data: queryData, error: queryGroupError } = await supabase
        .schema('leadgen')
        .from('gmaps_leads')
        .select('query');

      if (queryGroupError) throw queryGroupError;

      const queryCounts = new Map<string, number>();
      (queryData || []).forEach((row) => {
        const q = row.query || 'Sem query';
        queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
      });

      setByQuery(
        Array.from(queryCounts.entries())
          .map(([q, c]) => ({ query: q, count: c }))
          .sort((a, b) => b.count - a.count)
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads GMaps';
      setError(message);
      console.error('Error in useGMapsLeads:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, status, query, search, page, pageSize]);

  const updateLeadStatus = useCallback(async (id: string, newStatus: GMapsLeadStatus) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('gmaps_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLeads();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      console.error('Error updating gmaps lead status:', err);
      throw new Error(message);
    }
  }, [fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, totalCount, byQuery, loading, error, refetch: fetchLeads, updateLeadStatus };
};
