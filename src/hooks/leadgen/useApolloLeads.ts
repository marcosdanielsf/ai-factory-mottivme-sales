import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface ApolloLead {
  id: string;
  apollo_url?: string;
  notes?: string;
  number_of_results?: number;
  status?: string;
  error_status?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApolloJobInput {
  apollo_url: string;
  notes?: string;
}

export const useApolloLeads = () => {
  const [leads, setLeads] = useState<ApolloLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('leadgen')
        .from('apollo_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setLeads(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads Apollo';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (input: CreateApolloJobInput) => {
    const { data, error: insertError } = await supabase
      .schema('leadgen')
      .from('apollo_leads')
      .insert({ apollo_url: input.apollo_url, notes: input.notes || null, status: 'pending' })
      .select()
      .single();

    if (insertError) throw insertError;
    await fetchLeads();
    return data;
  }, [fetchLeads]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads, createJob };
};
