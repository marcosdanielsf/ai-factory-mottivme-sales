import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES (match actual leadgen.gmaps_leads columns)
// ═══════════════════════════════════════════════════════════════════════

export interface GMapsLead {
  id: string;
  gmaps_query?: string;
  maximum_results?: number;
  notes?: string;
  status?: string;
  error_status?: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useGMapsLeads = () => {
  const [leads, setLeads] = useState<GMapsLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('leadgen')
        .from('gmaps_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setLeads(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads GMaps';
      setError(message);
      console.error('Error in useGMapsLeads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
};
