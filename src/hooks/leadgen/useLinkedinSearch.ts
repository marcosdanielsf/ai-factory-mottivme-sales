import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type LinkedinSearchStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface LinkedinSearch {
  id: string;
  list_id?: string;
  search_query?: string;
  filters?: Record<string, unknown>;
  total_results?: number;
  leads_imported?: number;
  status: LinkedinSearchStatus;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UseLinkedinSearchOptions {
  listId?: string;
  status?: LinkedinSearchStatus;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useLinkedinSearch = (options: UseLinkedinSearchOptions = {}) => {
  const { listId, status, page = 1, pageSize = 50 } = options;

  const [searches, setSearches] = useState<LinkedinSearch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;

      let query = supabase
        .schema('leadgen')
        .from('linkedin_search')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (listId) {
        query = query.eq('list_id', listId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setSearches(data || []);
      setTotalCount(count || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar buscas LinkedIn';
      setError(message);
      console.error('Error in useLinkedinSearch:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, status, page, pageSize]);

  const createSearch = useCallback(async (data: Partial<LinkedinSearch>) => {
    try {
      const { error: insertError } = await supabase
        .schema('leadgen')
        .from('linkedin_search')
        .insert({
          list_id: data.list_id,
          search_query: data.search_query,
          filters: data.filters,
          status: 'pending',
        });

      if (insertError) throw insertError;
      await fetchSearches();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar busca';
      console.error('Error creating linkedin search:', err);
      throw new Error(message);
    }
  }, [fetchSearches]);

  const updateSearchStatus = useCallback(async (id: string, newStatus: LinkedinSearchStatus) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('linkedin_search')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchSearches();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status da busca';
      console.error('Error updating linkedin search status:', err);
      throw new Error(message);
    }
  }, [fetchSearches]);

  const deleteSearch = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .schema('leadgen')
        .from('linkedin_search')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchSearches();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar busca';
      console.error('Error deleting linkedin search:', err);
      throw new Error(message);
    }
  }, [fetchSearches]);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  return { searches, totalCount, loading, error, refetch: fetchSearches, createSearch, updateSearchStatus, deleteSearch };
};
