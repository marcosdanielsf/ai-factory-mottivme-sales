import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES (match actual leadgen.instagram_leads columns)
// ═══════════════════════════════════════════════════════════════════════

export interface InstagramLead {
  id: string;
  search_query?: string;
  maximum_results?: number;
  notes?: string;
  number_of_results?: number;
  status?: string;
  error_status?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useInstagramLeads = () => {
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('leadgen')
        .from('instagram_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setLeads(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads Instagram';
      setError(message);
      console.error('Error in useInstagramLeads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
};
