import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type LeadListType = 'Person' | 'Company';

export interface LeadList {
  id: string;
  name: string;
  type: LeadListType;
  description?: string;
  total_leads?: number;
  created_at: string;
  updated_at: string;
}

export interface UseLeadListsOptions {
  type?: LeadListType;
  search?: string;
  sortBy?: 'name' | 'created_at' | 'total_leads';
  sortAsc?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useLeadLists = (options: UseLeadListsOptions = {}) => {
  const { type, search, sortBy = 'created_at', sortAsc = false } = options;

  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .schema('leadgen')
        .from('lead_lists')
        .select('*')
        .order(sortBy, { ascending: sortAsc });

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLists(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar listas de leads';
      setError(message);
      console.error('Error in useLeadLists:', err);
    } finally {
      setLoading(false);
    }
  }, [type, search, sortBy, sortAsc]);

  const createList = useCallback(async (data: Partial<LeadList>) => {
    try {
      const { error: insertError } = await supabase
        .schema('leadgen')
        .from('lead_lists')
        .insert({
          name: data.name,
          type: data.type || 'Person',
          description: data.description,
        });

      if (insertError) throw insertError;
      await fetchLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar lista';
      console.error('Error creating lead list:', err);
      throw new Error(message);
    }
  }, [fetchLists]);

  const updateList = useCallback(async (id: string, updates: Partial<LeadList>) => {
    try {
      const { error: updateError } = await supabase
        .schema('leadgen')
        .from('lead_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar lista';
      console.error('Error updating lead list:', err);
      throw new Error(message);
    }
  }, [fetchLists]);

  const deleteList = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .schema('leadgen')
        .from('lead_lists')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchLists();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar lista';
      console.error('Error deleting lead list:', err);
      throw new Error(message);
    }
  }, [fetchLists]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return { lists, loading, error, refetch: fetchLists, createList, updateList, deleteList };
};
