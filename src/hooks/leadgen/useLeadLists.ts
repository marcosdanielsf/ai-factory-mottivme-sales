import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// TYPES (match actual leadgen.lead_lists columns)
// ═══════════════════════════════════════════════════════════════════════

export type LeadListType = 'Person' | 'Company';

export interface LeadList {
  id: string;
  type?: string;
  first_name?: string;
  last_name?: string;
  email_address?: string;
  contact_phone?: string;
  linkedin_profile_url?: string;
  headline?: string;
  company_name?: string;
  email_status?: string;
  profile_picture_url?: string;
  state_name?: string;
  city_name?: string;
  country_name?: string;
  location?: string;
  likely_to_engage?: boolean;
  lead_score?: number;
  lead_source?: string;
  niche?: string;
  industry?: string;
  company_size?: string;
  revenue?: string;
  company_url?: string;
  company_id?: string;
  person_enrichment_agent?: string;
  person_enrichment?: string;
  person_details?: Record<string, unknown>;
  company_enrichment?: string;
  email_verification?: string;
  connection_message?: string;
  first_message?: string;
  append_message?: boolean;
  connection_status?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  twitter_profile_url?: string;
  github_profile_url?: string;
  facebook_profile_url?: string;
  followers?: number;
  following?: number;
  engagement_rate?: number;
  bio_completa?: string;
  average_ticket_price?: string;
  post?: string;
  comments?: string;
  comments_link?: string;
  search_term?: string;
  enrich_record?: boolean;
  enrich_person?: boolean;
  enrich_company?: boolean;
  verify_email?: boolean;
  status?: string;
  error_status?: string;
  last_contacted?: string;
  created_at: string;
  updated_at: string;
}

export interface UseLeadListsOptions {
  type?: LeadListType;
  search?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export const useLeadLists = (options: UseLeadListsOptions = {}) => {
  const { type, search } = options;

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
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email_address.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLists(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar leads';
      setError(message);
      console.error('Error in useLeadLists:', err);
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return { lists, loading, error, refetch: fetchLists };
};
