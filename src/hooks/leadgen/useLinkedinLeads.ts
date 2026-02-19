import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface LinkedinLead {
  id: string;
  post_url?: string;
  user_name?: string;
  notes?: string;
  get_reactions?: boolean;
  get_comments?: boolean;
  limit_results?: number;
  status?: string;
  error_status?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLinkedinJobInput {
  post_url: string;
  user_name?: string;
  notes?: string;
  get_reactions?: boolean;
  get_comments?: boolean;
  limit_results?: number;
}

export const useLinkedinLeads = () => {
  const [leads, setLeads] = useState<LinkedinLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('leadgen')
        .from('linkedin_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setLeads(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads LinkedIn';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(async (input: CreateLinkedinJobInput) => {
    const { data, error: insertError } = await supabase
      .schema('leadgen')
      .from('linkedin_leads')
      .insert({
        post_url: input.post_url,
        user_name: input.user_name || null,
        notes: input.notes || null,
        get_reactions: input.get_reactions ?? false,
        get_comments: input.get_comments ?? false,
        limit_results: input.limit_results || null,
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
