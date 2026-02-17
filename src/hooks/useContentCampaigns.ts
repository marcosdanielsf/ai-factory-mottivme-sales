import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ContentCampaign {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  name: string;
  briefing: {
    produto?: string;
    avatar_descricao?: string;
    diferencial?: string;
    tom_comunicacao?: string;
    objetivo?: string;
    nicho?: string;
    ticket_medio?: number;
    tipo_funil?: string;
  };
  status: 'draft' | 'generating' | 'review' | 'approved' | 'published' | 'error';
  assembly_line_project_id: string | null;
  assembly_line_api_url: string | null;
  total_pieces: number;
  approved_pieces: number;
  published_pieces: number;
  total_cost: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateCampaignInput {
  name: string;
  client_id?: string;
  briefing: ContentCampaign['briefing'];
}

interface UseContentCampaignsReturn {
  campaigns: ContentCampaign[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createCampaign: (input: CreateCampaignInput) => Promise<ContentCampaign | null>;
  updateCampaign: (id: string, updates: Partial<ContentCampaign>) => Promise<ContentCampaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
}

export function useContentCampaigns(filters?: { status?: string; client_id?: string }): UseContentCampaignsReturn {
  const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('content_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCampaigns((data ?? []) as ContentCampaign[]);
    }
    setLoading(false);
  }, [filters?.status, filters?.client_id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createCampaign = useCallback(async (input: CreateCampaignInput): Promise<ContentCampaign | null> => {
    const { data, error: createError } = await supabase
      .from('content_campaigns')
      .insert(input)
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    await fetch();
    return data as ContentCampaign;
  }, [fetch]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<ContentCampaign>): Promise<ContentCampaign | null> => {
    const { data, error: updateError } = await supabase
      .from('content_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetch();
    return data as ContentCampaign;
  }, [fetch]);

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('content_campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    await fetch();
    return true;
  }, [fetch]);

  return { campaigns, loading, error, refetch: fetch, createCampaign, updateCampaign, deleteCampaign };
}
