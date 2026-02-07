import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface ColdCallCampaign {
  id: string;
  name: string;
  description: string | null;
  prompt_id: string | null;
  location_id: string | null;
  status: CampaignStatus;
  phone_list: PhoneListItem[];
  total_calls: number;
  completed_calls: number;
  success_rate: number;
  rate_limit: number;
  schedule_start: string; // HH:MM
  schedule_end: string;   // HH:MM
  schedule_days: string[]; // ['mon','tue',...]
  created_at: string;
  updated_at: string;
  // View metrics
  total_queued: number;
  total_completed: number;
  total_pending: number;
  total_in_progress: number;
  total_failed: number;
}

export interface PhoneListItem {
  phone: string;
  name: string;
  context?: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  prompt_id?: string;
  location_id?: string;
  phone_list: PhoneListItem[];
  rate_limit?: number;
  schedule_start?: string;
  schedule_end?: string;
  schedule_days?: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  prompt_id?: string;
  status?: CampaignStatus;
  rate_limit?: number;
  schedule_start?: string;
  schedule_end?: string;
  schedule_days?: string[];
}

interface UseColdCallCampaignsReturn {
  campaigns: ColdCallCampaign[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCampaign: (input: CreateCampaignInput) => Promise<ColdCallCampaign>;
  updateCampaign: (id: string, input: UpdateCampaignInput) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useColdCallCampaigns(): UseColdCallCampaignsReturn {
  const [campaigns, setCampaigns] = useState<ColdCallCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('cold_call_campaigns_with_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching campaigns:', queryError);
        throw queryError;
      }

      setCampaigns((data as ColdCallCampaign[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar campanhas';
      console.error('Error in useColdCallCampaigns:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (input: CreateCampaignInput): Promise<ColdCallCampaign> => {
    const campaignPayload = {
      name: input.name,
      description: input.description || null,
      prompt_id: input.prompt_id || null,
      location_id: input.location_id || null,
      status: 'draft' as CampaignStatus,
      phone_list: input.phone_list,
      total_calls: input.phone_list.length,
      completed_calls: 0,
      success_rate: 0,
      rate_limit: input.rate_limit ?? 10,
      schedule_start: input.schedule_start ?? '09:00',
      schedule_end: input.schedule_end ?? '18:00',
      schedule_days: input.schedule_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
    };

    const { data: campaign, error: insertError } = await supabase
      .from('cold_call_campaigns')
      .insert(campaignPayload)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating campaign:', insertError);
      throw new Error(insertError.message);
    }

    // Create queue items from phone_list
    if (input.phone_list.length > 0) {
      const queueItems = input.phone_list.map((item) => ({
        campaign_id: campaign.id,
        phone_number: item.phone,
        lead_name: item.name,
        lead_context: item.context || null,
        status: 'pending' as const,
        attempt: 0,
        max_attempts: 3,
      }));

      const { error: queueError } = await supabase
        .from('cold_call_queue')
        .insert(queueItems);

      if (queueError) {
        console.error('Error creating queue items:', queueError);
        // Campaign was created, but queue failed — don't throw, log and continue
      }
    }

    return campaign as ColdCallCampaign;
  }, []);

  const updateCampaign = useCallback(async (id: string, input: UpdateCampaignInput): Promise<void> => {
    const { error: updateError } = await supabase
      .from('cold_call_campaigns')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      throw new Error(updateError.message);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    // Delete queue items first (FK dependency)
    const { error: queueDeleteError } = await supabase
      .from('cold_call_queue')
      .delete()
      .eq('campaign_id', id);

    if (queueDeleteError) {
      console.error('Error deleting queue items:', queueDeleteError);
      throw new Error(queueDeleteError.message);
    }

    const { error: deleteError } = await supabase
      .from('cold_call_campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      throw new Error(deleteError.message);
    }
  }, []);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
