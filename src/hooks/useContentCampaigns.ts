import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createProjectWithBriefing, getPipelineStatus } from '../lib/assemblyLineApi';
import type { PipelineGeneration } from '../lib/assemblyLineApi';

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

export interface PipelineProgress {
  status: 'idle' | 'generating' | 'complete' | 'error';
  generations: PipelineGeneration[];
  completedAgents: number;
  totalAgents: number;
  totalCost: number;
}

interface UseContentCampaignsReturn {
  campaigns: ContentCampaign[];
  loading: boolean;
  error: string | null;
  pipelineProgress: PipelineProgress;
  refetch: () => void;
  createCampaign: (input: CreateCampaignInput) => Promise<ContentCampaign | null>;
  updateCampaign: (id: string, updates: Partial<ContentCampaign>) => Promise<ContentCampaign | null>;
  deleteCampaign: (id: string) => Promise<boolean>;
}

const POLL_INTERVAL = 5000;

export function useContentCampaigns(filters?: { status?: string; client_id?: string }): UseContentCampaignsReturn {
  const [campaigns, setCampaigns] = useState<ContentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    status: 'idle',
    generations: [],
    completedAgents: 0,
    totalAgents: 8,
    totalCost: 0,
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCampaigns = useCallback(async () => {
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
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Pipeline polling
  const startPolling = useCallback((projectId: string, campaignId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    setPipelineProgress(prev => ({ ...prev, status: 'generating' }));

    const poll = async () => {
      try {
        const result = await getPipelineStatus(projectId);
        const completed = result.generations.filter(g => g.status === 'complete').length;
        const totalCost = result.generations.reduce((sum, g) => sum + (g.cost_usd || 0), 0);

        setPipelineProgress({
          status: result.project.status === 'complete' ? 'complete' :
                  result.project.status === 'error' ? 'error' : 'generating',
          generations: result.generations,
          completedAgents: completed,
          totalAgents: 8,
          totalCost,
        });

        // Pipeline finished
        if (result.project.status === 'complete' || result.project.status === 'error') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Count generated contents
          const contentsCount = result.project.status === 'complete'
            ? result.generations.length
            : 0;

          // Update campaign status in main Supabase
          await supabase
            .from('content_campaigns')
            .update({
              status: result.project.status === 'complete' ? 'review' : 'error',
              total_pieces: contentsCount,
              total_cost: totalCost,
              error_message: result.project.status === 'error' ? 'Pipeline falhou' : null,
            })
            .eq('id', campaignId);

          await fetchCampaigns();
        }
      } catch {
        // Silently retry on network errors
      }
    };

    // Immediate first poll
    poll();
    pollingRef.current = setInterval(poll, POLL_INTERVAL);
  }, [fetchCampaigns]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const createCampaign = useCallback(async (input: CreateCampaignInput): Promise<ContentCampaign | null> => {
    setError(null);

    try {
      // 1. Save campaign to main Supabase
      const { data: campaign, error: createError } = await supabase
        .from('content_campaigns')
        .insert({
          ...input,
          status: 'generating',
        })
        .select()
        .single();

      if (createError || !campaign) {
        setError(createError?.message || 'Erro ao criar campanha');
        return null;
      }

      // 2. Create project + briefing + start pipeline via Assembly Line API
      const result = await createProjectWithBriefing(input.name, input.briefing as Record<string, unknown>);

      // 3. Link Assembly Line project to campaign
      await supabase
        .from('content_campaigns')
        .update({
          assembly_line_project_id: result.project_id,
        })
        .eq('id', campaign.id);

      // 4. Start polling pipeline status
      startPolling(result.project_id, campaign.id);

      await fetchCampaigns();
      return campaign as ContentCampaign;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      return null;
    }
  }, [fetchCampaigns, startPolling]);

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

    await fetchCampaigns();
    return data as ContentCampaign;
  }, [fetchCampaigns]);

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('content_campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    await fetchCampaigns();
    return true;
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    pipelineProgress,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
