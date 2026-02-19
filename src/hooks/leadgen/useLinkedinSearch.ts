import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface LinkedinSearch {
  id: string;
  search_url?: string;
  search_criteria?: Record<string, unknown>;
  notes?: string;
  status?: string;
  error_status?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLinkedinSearchInput {
  search_url: string;
  search_criteria?: Record<string, unknown>;
  notes?: string;
}

export const useLinkedinSearch = () => {
  const [searches, setSearches] = useState<LinkedinSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('leadgen')
        .from('linkedin_search')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setSearches(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar buscas LinkedIn';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (input: CreateLinkedinSearchInput) => {
    const { data, error: insertError } = await supabase
      .schema('leadgen')
      .from('linkedin_search')
      .insert({
        search_url: input.search_url,
        search_criteria: input.search_criteria || null,
        notes: input.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchSearches();
    return data;
  }, [fetchSearches]);

  useEffect(() => { fetchSearches(); }, [fetchSearches]);

  return { searches, loading, error, refetch: fetchSearches, createJob };
};
