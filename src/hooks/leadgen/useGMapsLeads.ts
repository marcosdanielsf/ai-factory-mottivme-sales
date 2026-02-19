import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

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

export interface CreateGMapsJobInput {
  gmaps_query: string;
  maximum_results?: number;
  notes?: string;
}

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
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (input: CreateGMapsJobInput) => {
    const { data, error: insertError } = await supabase
      .schema('leadgen')
      .from('gmaps_leads')
      .insert({
        gmaps_query: input.gmaps_query,
        maximum_results: input.maximum_results || null,
        notes: input.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchLeads();
    return data;
  }, [fetchLeads]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads, createJob };
};
