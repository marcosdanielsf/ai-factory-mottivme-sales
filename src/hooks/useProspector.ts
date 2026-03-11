import { useEffect, useState, useCallback } from 'react';
import { prospectorApi } from '../lib/prospector-api';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type ProspectorChannel = 'instagram' | 'linkedin' | 'whatsapp';

export interface ProspectorCampaign {
  id: string;
  name: string;
  vertical: 'clinicas' | 'coaches' | 'infoprodutores';
  channels: ProspectorChannel[];
  status: 'ativa' | 'pausada' | 'concluida';
  total_leads: number;
  leads_processed: number;
  dms_sent: number;
  replies: number;
  conversions: number;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

export interface ProspectorQueueLead {
  id: string;
  campaign_id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  channel: ProspectorChannel;
  stage: string;
  temperature: 'hot' | 'warm' | 'cold';
  icp_tier: 'A' | 'B' | 'C';
  next_action: string;
  next_action_at: string;
  bio_highlight?: string;
  city?: string;
  followers?: number;
  created_at: string;
}

export interface DMTemplate {
  id: string;
  name: string;
  channel: ProspectorChannel;
  stage: string;
  vertical: string;
  content: string;
  variant: string;
  reply_rate: number;
  times_sent: number;
  times_replied: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectorMetrics {
  total_campaigns_active: number;
  leads_in_queue_today: number;
  dms_sent_today: number;
  reply_rate_7d: number;
  conversion_rate: number;
}

export interface ProspectorAnalyticsData {
  dailyDMs: { date: Date; sent: number; replies: number }[];
  replyRateByChannel: { channel: string; rate: number }[];
  replyRateByVertical: { vertical: string; rate: number }[];
  leadsByStage: { stage: string; count: number }[];
  bestHours: { hour: number; day: string; rate: number }[];
}

export interface TemplatePerformance {
  template_name: string;
  channel: string;
  vertical: string;
  sent: number;
  replied: number;
  reply_rate: number;
  conversion_rate: number;
}

// ═══════════════════════════════════════════════════════════════════════
// MAPPERS — transform backend shapes to frontend types
// ═══════════════════════════════════════════════════════════════════════

function mapCampaign(c: Record<string, unknown>): ProspectorCampaign {
  const rawStatus = (c.status as string) || 'ativa';
  const statusMap: Record<string, ProspectorCampaign['status']> = {
    active: 'ativa',
    running: 'ativa',
    ativa: 'ativa',
    paused: 'pausada',
    pausada: 'pausada',
    completed: 'concluida',
    concluida: 'concluida',
  };
  return {
    id: (c.id as string) || '',
    name: (c.name as string) || 'Campanha sem nome',
    vertical: (c.vertical as ProspectorCampaign['vertical']) || 'clinicas',
    channels: (c.channels as ProspectorChannel[]) || ['linkedin'],
    status: statusMap[rawStatus] ?? 'ativa',
    total_leads: Number(c.total_leads ?? c.leads_count ?? 0),
    leads_processed: Number(c.leads_processed ?? 0),
    dms_sent: Number(c.dms_sent ?? c.invites_sent ?? c.messages_sent ?? 0),
    replies: Number(c.replies ?? c.connections_accepted ?? 0),
    conversions: Number(c.conversions ?? 0),
    daily_limit: Number(c.daily_limit ?? c.daily_invite_limit ?? 50),
    created_at: (c.created_at as string) || new Date().toISOString(),
    updated_at: (c.updated_at as string) || new Date().toISOString(),
  };
}

function mapLead(l: Record<string, unknown>): ProspectorQueueLead {
  const rawTemp = (l.temperature ?? l.ai_temperature ?? 'cold') as string;
  const tempMap: Record<string, ProspectorQueueLead['temperature']> = {
    hot: 'hot', warm: 'warm', cold: 'cold',
  };
  return {
    id: (l.id as string) || '',
    campaign_id: (l.campaign_id as string) || '',
    name: (l.name ?? l.full_name ?? 'Lead') as string,
    username: (l.public_id ?? l.username) as string | undefined,
    avatar_url: (l.profile_picture ?? l.avatar_url) as string | undefined,
    channel: ((l.channel as ProspectorChannel) ?? 'linkedin'),
    stage: (l.stage ?? l.status ?? 'first_contact') as string,
    temperature: tempMap[rawTemp] ?? 'cold',
    icp_tier: ((l.icp_tier as ProspectorQueueLead['icp_tier']) ?? 'B'),
    next_action: (l.next_action ?? 'Aguardando') as string,
    next_action_at: (l.next_action_at ?? new Date().toISOString()) as string,
    bio_highlight: (l.headline ?? l.bio_highlight) as string | undefined,
    city: (l.location ?? l.city) as string | undefined,
    followers: l.followers as number | undefined,
    created_at: (l.created_at as string) || new Date().toISOString(),
  };
}

function mapTemplate(t: Record<string, unknown>): DMTemplate {
  return {
    id: (t.id as string) || '',
    name: (t.name as string) || 'Template',
    channel: ((t.channel as ProspectorChannel) ?? 'linkedin'),
    stage: (t.stage as string) || 'first_contact',
    vertical: (t.vertical as string) || 'clinicas',
    content: (t.content as string) || '',
    variant: (t.variant as string) || 'A',
    reply_rate: Number(t.reply_rate ?? 0),
    times_sent: Number(t.times_sent ?? 0),
    times_replied: Number(t.times_replied ?? 0),
    is_active: Boolean(t.is_active ?? true),
    created_at: (t.created_at as string) || new Date().toISOString(),
    updated_at: (t.updated_at as string) || new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════

export const useProspectorCampaigns = () => {
  const [campaigns, setCampaigns] = useState<ProspectorCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await prospectorApi.getCampaigns();
      const list = Array.isArray(data) ? data : [];
      setCampaigns(list.map((c: Record<string, unknown>) => mapCampaign(c)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar campanhas';
      setError(message);
      console.error('Error in useProspectorCampaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (data: Partial<ProspectorCampaign> & { account_id?: string }) => {
    try {
      // Get first available account if account_id not provided
      let accountId = data.account_id;
      if (!accountId) {
        try {
          const accounts = await prospectorApi.getAccounts();
          accountId = Array.isArray(accounts) && accounts.length > 0 ? accounts[0].id : 'default';
        } catch {
          accountId = 'default';
        }
      }

      await prospectorApi.createCampaign({
        name: data.name || 'Nova Campanha',
        account_id: accountId,
        daily_invite_limit: data.daily_limit,
      });
      await fetchCampaigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar campanha';
      console.error('Error creating campaign:', err);
      throw new Error(message);
    }
  }, [fetchCampaigns]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<ProspectorCampaign>) => {
    // Optimistic update — no generic PUT /campaigns/{id} endpoint yet
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    console.warn('updateCampaign: no backend endpoint yet, using optimistic update only');
  }, []);

  const pauseCampaign = useCallback(async (id: string) => {
    try {
      await prospectorApi.pauseCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'pausada' } : c));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao pausar campanha';
      throw new Error(message);
    }
  }, []);

  const resumeCampaign = useCallback(async (id: string) => {
    try {
      await prospectorApi.resumeCampaign(id);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'ativa' } : c));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao retomar campanha';
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { campaigns, loading, error, refetch: fetchCampaigns, createCampaign, updateCampaign, pauseCampaign, resumeCampaign };
};

export const useProspectorQueue = (campaignId?: string) => {
  const [leads, setLeads] = useState<ProspectorQueueLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await prospectorApi.getLeads({ campaign_id: campaignId });
      const list = Array.isArray(data) ? data : [];
      setLeads(list.map((l: Record<string, unknown>) => mapLead(l)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fila';
      setError(message);
      console.error('Error in useProspectorQueue:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Optimistic local actions — no backend endpoints for these yet
  const skipLead = useCallback(async (leadId: string) => {
    const nextActionAt = new Date();
    nextActionAt.setDate(nextActionAt.getDate() + 7);
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, stage: 'paused', next_action: 'Aguardando (skipped)', next_action_at: nextActionAt.toISOString() }
        : l
    ));
  }, []);

  const pauseLead = useCallback(async (leadId: string) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, stage: 'paused', next_action: 'Pausado manualmente', next_action_at: '' }
        : l
    ));
  }, []);

  const advanceStage = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const stageMap: Record<string, { stage: string; action: string; hours: number }> = {
      warm_up: { stage: 'first_contact', action: 'Enviar DM inicial', hours: 24 },
      first_contact: { stage: 'follow_up', action: 'Follow-up dia 2', hours: 48 },
      follow_up: { stage: 'breakup', action: 'Enviar mensagem de breakup', hours: 72 },
      breakup: { stage: 'completed', action: 'Concluído', hours: 0 },
    };

    const nextStageInfo = stageMap[lead.stage] || stageMap.first_contact;
    const nextActionAt = new Date();
    nextActionAt.setHours(nextActionAt.getHours() + nextStageInfo.hours);

    setLeads(prev => prev.map(l =>
      l.id === leadId
        ? {
            ...l,
            stage: nextStageInfo.stage,
            next_action: nextStageInfo.action,
            next_action_at: nextStageInfo.hours > 0 ? nextActionAt.toISOString() : '',
          }
        : l
    ));
  }, [leads]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return { leads, loading, error, refetch: fetchQueue, skipLead, pauseLead, advanceStage };
};

export const useProspectorTemplates = (channel?: ProspectorChannel) => {
  const [templates, setTemplates] = useState<DMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await prospectorApi.getTemplates();
      let list = Array.isArray(data) ? data : [];

      if (channel) {
        list = list.filter((t: Record<string, unknown>) => t.channel === channel);
      }

      setTemplates(list.map((t: Record<string, unknown>) => mapTemplate(t)));
    } catch (err: unknown) {
      // Backend may not have /api/templates yet — graceful fallback
      console.warn('useProspectorTemplates: endpoint not available, returning empty list', err);
      setTemplates([]);
      setError(null); // Don't show error for missing endpoint
    } finally {
      setLoading(false);
    }
  }, [channel]);

  const createTemplate = useCallback(async (data: Partial<DMTemplate>) => {
    try {
      await prospectorApi.createTemplate({
        name: data.name,
        channel: data.channel,
        stage: data.stage,
        vertical: data.vertical,
        content: data.content,
        variant: data.variant || 'A',
        is_active: data.is_active !== false,
      });
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar template';
      console.error('Error creating template:', err);
      throw new Error(message);
    }
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<DMTemplate>) => {
    try {
      await prospectorApi.updateTemplate(id, updates as Record<string, unknown>);
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar template';
      console.error('Error updating template:', err);
      throw new Error(message);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await prospectorApi.deleteTemplate(id);
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar template';
      console.error('Error deleting template:', err);
      throw new Error(message);
    }
  }, [fetchTemplates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate };
};

export const useProspectorAnalytics = (_campaignId?: string, _dateRange?: { from: Date; to: Date }) => {
  const [metrics, setMetrics] = useState<ProspectorMetrics>({
    total_campaigns_active: 0,
    leads_in_queue_today: 0,
    dms_sent_today: 0,
    reply_rate_7d: 0,
    conversion_rate: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<ProspectorAnalyticsData>({
    dailyDMs: [],
    replyRateByChannel: [],
    replyRateByVertical: [],
    leadsByStage: [],
    bestHours: [],
  });
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try dashboard metrics endpoint first
      let metricsRaw: Record<string, unknown> = {};
      try {
        metricsRaw = await prospectorApi.getDashboardMetrics() as Record<string, unknown>;
      } catch {
        // Endpoint not available yet — try to derive from campaigns
        try {
          const campaigns = await prospectorApi.getCampaigns() as Record<string, unknown>[];
          const active = Array.isArray(campaigns) ? campaigns.filter((c) => {
            const s = c.status as string;
            return s === 'active' || s === 'running' || s === 'ativa';
          }) : [];
          metricsRaw = {
            total_campaigns_active: active.length,
            leads_in_queue_today: 0,
            dms_sent_today: active.reduce((sum, c) => sum + Number(c.dms_sent ?? c.invites_sent ?? 0), 0),
            reply_rate_7d: 0,
            conversion_rate: 0,
          };
        } catch {
          // All fallbacks exhausted — keep zeros
        }
      }

      setMetrics({
        total_campaigns_active: Number(metricsRaw.total_campaigns_active ?? metricsRaw.active_campaigns ?? 0),
        leads_in_queue_today: Number(metricsRaw.leads_in_queue_today ?? metricsRaw.leads_today ?? 0),
        dms_sent_today: Number(metricsRaw.dms_sent_today ?? metricsRaw.messages_today ?? 0),
        reply_rate_7d: Number(metricsRaw.reply_rate_7d ?? metricsRaw.reply_rate ?? 0),
        conversion_rate: Number(metricsRaw.conversion_rate ?? 0),
      });

      // Analytics charts — try to get from backend, fallback to empty
      let dailyDMs: ProspectorAnalyticsData['dailyDMs'] = [];
      let replyRateByChannel: ProspectorAnalyticsData['replyRateByChannel'] = [];
      let replyRateByVertical: ProspectorAnalyticsData['replyRateByVertical'] = [];
      let leadsByStage: ProspectorAnalyticsData['leadsByStage'] = [];

      try {
        const raw = metricsRaw as Record<string, unknown>;
        if (Array.isArray(raw.daily_dms)) {
          dailyDMs = (raw.daily_dms as Record<string, unknown>[]).map(d => ({
            date: new Date(d.date as string),
            sent: Number(d.sent ?? 0),
            replies: Number(d.replies ?? 0),
          }));
        }
        if (Array.isArray(raw.reply_rate_by_channel)) {
          replyRateByChannel = raw.reply_rate_by_channel as { channel: string; rate: number }[];
        }
        if (Array.isArray(raw.reply_rate_by_vertical)) {
          replyRateByVertical = raw.reply_rate_by_vertical as { vertical: string; rate: number }[];
        }
      } catch {
        // Charts unavailable — keep empty arrays
      }

      // Leads by stage
      try {
        const leads = await prospectorApi.getLeads({ campaign_id: _campaignId }) as Record<string, unknown>[];
        if (Array.isArray(leads)) {
          const stageCounts = new Map<string, number>();
          leads.forEach(l => {
            const stage = (l.stage ?? l.status ?? 'unknown') as string;
            stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
          });
          leadsByStage = Array.from(stageCounts.entries()).map(([stage, count]) => ({
            stage: stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' '),
            count,
          }));
        }
      } catch {
        // Leads endpoint fallback
      }

      setAnalyticsData({
        dailyDMs,
        replyRateByChannel,
        replyRateByVertical,
        leadsByStage,
        bestHours: [],
      });

      setTemplatePerformance([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar analytics';
      setError(message);
      console.error('Error in useProspectorAnalytics:', err);
    } finally {
      setLoading(false);
    }
  }, [_campaignId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { metrics, analyticsData, templatePerformance, loading, error, refetch: fetchAnalytics };
};
