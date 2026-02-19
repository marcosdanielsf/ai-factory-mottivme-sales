import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES (match actual leadgen.linkedin_leads columns)
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

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
      console.error('Error in useLinkedinLeads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
};
