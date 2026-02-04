/**
 * Hook para gerenciar campanhas de prospecção
 * Conecta com a API do AgenticOS
 */

import { useState, useCallback, useEffect } from 'react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================
// TYPES
// ============================================

export interface CampaignConfig {
  name: string;
  target_type: 'hashtag' | 'profile' | 'leads' | 'new_followers';
  target_value: string;
  limit: number;
  min_score: number;
  template_id?: number;
  tenant_id?: string;
  account_id?: number; // Para new_followers - ID da conta monitorada
}

export interface CampaignStats {
  leads_scraped: number;
  dms_sent: number;
  dms_failed: number;
  dms_skipped: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  target_type: string;
  target_value: string;
  limit: number;
  min_score: number;
  tenant_id: string;
  started_at: string;
  completed_at?: string;
  stopped_at?: string;
  error?: string;
  stats: CampaignStats;
}

export interface CampaignResponse {
  success: boolean;
  campaign_id: string;
  status: string;
  message: string;
  stats?: CampaignStats;
}

// ============================================
// HOOK: useCampaigns
// ============================================

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca lista de campanhas
   */
  const fetchCampaigns = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', '50');

      const response = await fetch(`${API_BASE_URL}/api/campaigns?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      return data.campaigns;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching campaigns:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Inicia uma nova campanha
   */
  const startCampaign = useCallback(async (config: CampaignConfig): Promise<CampaignResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/campaign/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          target_type: config.target_type,
          target_value: config.target_value,
          limit: config.limit,
          min_score: config.min_score,
          template_id: config.template_id || 1,
          tenant_id: config.tenant_id || 'DEFAULT',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start campaign: ${response.statusText}`);
      }

      const data: CampaignResponse = await response.json();

      // Refresh campaigns list
      await fetchCampaigns();

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error starting campaign:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCampaigns]);

  /**
   * Busca status de uma campanha específica
   */
  const getCampaignStatus = useCallback(async (campaignId: string): Promise<Campaign | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}`);

      if (!response.ok) {
        throw new Error(`Failed to get campaign status: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error getting campaign status:', err);
      return null;
    }
  }, []);

  /**
   * Para uma campanha em execução
   */
  const stopCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to stop campaign: ${response.statusText}`);
      }

      // Refresh campaigns list
      await fetchCampaigns();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error stopping campaign:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCampaigns]);

  /**
   * Polling para atualizar status de campanhas em execução
   */
  const pollRunningCampaigns = useCallback(async () => {
    const runningCampaigns = campaigns.filter(c => c.status === 'running' || c.status === 'pending');

    if (runningCampaigns.length === 0) return;

    for (const campaign of runningCampaigns) {
      const status = await getCampaignStatus(campaign.id);
      if (status) {
        setCampaigns(prev =>
          prev.map(c => c.id === campaign.id ? { ...c, ...status } : c)
        );
      }
    }
  }, [campaigns, getCampaignStatus]);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Poll running campaigns every 5 seconds
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'running' || c.status === 'pending');

    if (!hasRunning) return;

    const interval = setInterval(pollRunningCampaigns, 5000);
    return () => clearInterval(interval);
  }, [campaigns, pollRunningCampaigns]);

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    startCampaign,
    stopCampaign,
    getCampaignStatus,
  };
}

// ============================================
// HOOK: useCampaignById
// ============================================

export function useCampaignById(campaignId: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }

    const fetchCampaign = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/campaign/${campaignId}`);

        if (!response.ok) {
          throw new Error(`Campaign not found: ${response.statusText}`);
        }

        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  return { campaign, loading, error };
}

export default useCampaigns;
