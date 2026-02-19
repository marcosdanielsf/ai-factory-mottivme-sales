import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES (match actual leadgen.linkedin_search columns)
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

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
      console.error('Error in useLinkedinSearch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  return { searches, loading, error, refetch: fetchSearches };
};
