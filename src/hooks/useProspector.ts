import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

      const { data, error: queryError } = await supabase
        .from('prospector_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setCampaigns(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar campanhas';
      setError(message);
      console.error('Error in useProspectorCampaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (data: Partial<ProspectorCampaign>) => {
    try {
      const { error: insertError } = await supabase
        .from('prospector_campaigns')
        .insert({
          name: data.name,
          vertical: data.vertical,
          channels: data.channels,
          status: data.status || 'ativa',
          total_leads: data.total_leads || 0,
          leads_processed: 0,
          dms_sent: 0,
          replies: 0,
          conversions: 0,
          daily_limit: data.daily_limit || 50,
        });

      if (insertError) throw insertError;
      await fetchCampaigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar campanha';
      console.error('Error creating campaign:', err);
      throw new Error(message);
    }
  }, [fetchCampaigns]);

  const updateCampaign = useCallback(async (id: string, updates: Partial<ProspectorCampaign>) => {
    try {
      const { error: updateError } = await supabase
        .from('prospector_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCampaigns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar campanha';
      console.error('Error updating campaign:', err);
      throw new Error(message);
    }
  }, [fetchCampaigns]);

  const pauseCampaign = useCallback(async (id: string) => {
    await updateCampaign(id, { status: 'pausada' });
  }, [updateCampaign]);

  const resumeCampaign = useCallback(async (id: string) => {
    await updateCampaign(id, { status: 'ativa' });
  }, [updateCampaign]);

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

      let query = supabase
        .from('prospector_queue_leads')
        .select('*')
        .order('next_action_at', { ascending: true });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLeads(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fila';
      setError(message);
      console.error('Error in useProspectorQueue:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const skipLead = useCallback(async (leadId: string) => {
    try {
      const nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + 7);

      const { error: updateError } = await supabase
        .from('prospector_queue_leads')
        .update({
          stage: 'paused',
          next_action: 'Aguardando (skipped)',
          next_action_at: nextActionAt.toISOString(),
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
      await fetchQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao pular lead';
      console.error('Error skipping lead:', err);
      throw new Error(message);
    }
  }, [fetchQueue]);

  const pauseLead = useCallback(async (leadId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('prospector_queue_leads')
        .update({
          stage: 'paused',
          next_action: 'Pausado manualmente',
          next_action_at: null,
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
      await fetchQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao pausar lead';
      console.error('Error pausing lead:', err);
      throw new Error(message);
    }
  }, [fetchQueue]);

  const advanceStage = useCallback(async (leadId: string) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead não encontrado');

      const stageMap: Record<string, { stage: string; action: string; hours: number }> = {
        warm_up: { stage: 'first_contact', action: 'Enviar DM inicial', hours: 24 },
        first_contact: { stage: 'follow_up', action: 'Follow-up dia 2', hours: 48 },
        follow_up: { stage: 'breakup', action: 'Enviar mensagem de breakup', hours: 72 },
        breakup: { stage: 'completed', action: 'Concluído', hours: 0 },
      };

      const nextStageInfo = stageMap[lead.stage] || stageMap.first_contact;
      const nextActionAt = new Date();
      nextActionAt.setHours(nextActionAt.getHours() + nextStageInfo.hours);

      const { error: updateError } = await supabase
        .from('prospector_queue_leads')
        .update({
          stage: nextStageInfo.stage,
          next_action: nextStageInfo.action,
          next_action_at: nextStageInfo.hours > 0 ? nextActionAt.toISOString() : null,
        })
        .eq('id', leadId);

      if (updateError) throw updateError;
      await fetchQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao avançar etapa';
      console.error('Error advancing lead stage:', err);
      throw new Error(message);
    }
  }, [leads, fetchQueue]);

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

      let query = supabase
        .from('prospector_dm_templates')
        .select('*')
        .order('reply_rate', { ascending: false });

      if (channel) {
        query = query.eq('channel', channel);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setTemplates(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar templates';
      setError(message);
      console.error('Error in useProspectorTemplates:', err);
    } finally {
      setLoading(false);
    }
  }, [channel]);

  const createTemplate = useCallback(async (data: Partial<DMTemplate>) => {
    try {
      const { error: insertError } = await supabase
        .from('prospector_dm_templates')
        .insert({
          name: data.name,
          channel: data.channel,
          stage: data.stage,
          vertical: data.vertical,
          content: data.content,
          variant: data.variant || 'A',
          reply_rate: 0,
          times_sent: 0,
          times_replied: 0,
          is_active: data.is_active !== false,
        });

      if (insertError) throw insertError;
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar template';
      console.error('Error creating template:', err);
      throw new Error(message);
    }
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<DMTemplate>) => {
    try {
      const { error: updateError } = await supabase
        .from('prospector_dm_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar template';
      console.error('Error updating template:', err);
      throw new Error(message);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('prospector_dm_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
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

export const useProspectorAnalytics = (campaignId?: string, dateRange?: { from: Date; to: Date }) => {
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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const from = dateRange?.from || thirtyDaysAgo;
      const to = dateRange?.to || new Date();

      const [
        campaignsData,
        leadsData,
        dmLogsData,
        dmLogs7dData,
        templatesData,
      ] = await Promise.all([
        supabase
          .from('prospector_campaigns')
          .select('*')
          .eq('status', 'ativa'),

        supabase
          .from('prospector_queue_leads')
          .select('*')
          .gte('created_at', today.toISOString()),

        supabase
          .from('prospector_dm_logs')
          .select('*, prospector_dm_templates(name, channel, vertical)')
          .gte('sent_at', from.toISOString())
          .lte('sent_at', to.toISOString()),

        supabase
          .from('prospector_dm_logs')
          .select('*')
          .gte('sent_at', sevenDaysAgo.toISOString()),

        supabase
          .from('prospector_dm_templates')
          .select('*')
          .eq('is_active', true),
      ]);

      if (campaignsData.error) throw campaignsData.error;
      if (leadsData.error) throw leadsData.error;
      if (dmLogsData.error) throw dmLogsData.error;
      if (dmLogs7dData.error) throw dmLogs7dData.error;
      if (templatesData.error) throw templatesData.error;

      const campaigns = campaignsData.data || [];
      const leads = leadsData.data || [];
      const dmLogs = dmLogsData.data || [];
      const dmLogs7d = dmLogs7dData.data || [];
      const templates = templatesData.data || [];

      const todayDMs = dmLogs.filter(log => {
        const sentDate = new Date(log.sent_at);
        return sentDate >= today;
      });

      const repliesLast7d = dmLogs7d.filter(log => log.replied_at).length;
      const totalLast7d = dmLogs7d.length;
      const replyRate7d = totalLast7d > 0 ? (repliesLast7d / totalLast7d) * 100 : 0;

      const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
      const totalReplies = campaigns.reduce((sum, c) => sum + (c.replies || 0), 0);
      const conversionRate = totalReplies > 0 ? (totalConversions / totalReplies) * 100 : 0;

      setMetrics({
        total_campaigns_active: campaigns.length,
        leads_in_queue_today: leads.length,
        dms_sent_today: todayDMs.length,
        reply_rate_7d: Number(replyRate7d.toFixed(1)),
        conversion_rate: Number(conversionRate.toFixed(1)),
      });

      const dailyDMsMap = new Map<string, { sent: number; replies: number }>();
      dmLogs.forEach(log => {
        const dateKey = new Date(log.sent_at).toISOString().split('T')[0];
        const existing = dailyDMsMap.get(dateKey) || { sent: 0, replies: 0 };
        existing.sent += 1;
        if (log.replied_at) existing.replies += 1;
        dailyDMsMap.set(dateKey, existing);
      });

      const dailyDMs = Array.from(dailyDMsMap.entries())
        .map(([dateStr, stats]) => ({
          date: new Date(dateStr),
          sent: stats.sent,
          replies: stats.replies,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const channelStats = new Map<string, { sent: number; replied: number }>();
      dmLogs.forEach(log => {
        const channel = log.channel || 'unknown';
        const existing = channelStats.get(channel) || { sent: 0, replied: 0 };
        existing.sent += 1;
        if (log.replied_at) existing.replied += 1;
        channelStats.set(channel, existing);
      });

      const replyRateByChannel = Array.from(channelStats.entries()).map(([channel, stats]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        rate: stats.sent > 0 ? Number(((stats.replied / stats.sent) * 100).toFixed(1)) : 0,
      }));

      const verticalStats = new Map<string, { sent: number; replied: number }>();
      dmLogs.forEach(log => {
        const template = log.prospector_dm_templates as unknown as { vertical?: string } | null;
        const vertical = template?.vertical || 'unknown';
        const existing = verticalStats.get(vertical) || { sent: 0, replied: 0 };
        existing.sent += 1;
        if (log.replied_at) existing.replied += 1;
        verticalStats.set(vertical, existing);
      });

      const replyRateByVertical = Array.from(verticalStats.entries()).map(([vertical, stats]) => ({
        vertical: vertical.charAt(0).toUpperCase() + vertical.slice(1),
        rate: stats.sent > 0 ? Number(((stats.replied / stats.sent) * 100).toFixed(1)) : 0,
      }));

      const stageQuery = campaignId
        ? supabase.from('prospector_queue_leads').select('stage').eq('campaign_id', campaignId)
        : supabase.from('prospector_queue_leads').select('stage');

      const { data: stageData } = await stageQuery;
      const stageCounts = new Map<string, number>();
      (stageData || []).forEach(lead => {
        const stage = lead.stage || 'unknown';
        stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
      });

      const leadsByStage = Array.from(stageCounts.entries()).map(([stage, count]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' '),
        count,
      }));

      const hourStats = new Map<string, { replied: number; total: number }>();
      dmLogs.forEach(log => {
        if (log.replied_at) {
          const replyDate = new Date(log.replied_at);
          const hour = replyDate.getHours();
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const day = dayNames[replyDate.getDay()];
          const key = `${hour}-${day}`;
          const existing = hourStats.get(key) || { replied: 0, total: 0 };
          existing.replied += 1;
          existing.total += 1;
          hourStats.set(key, existing);
        }
      });

      const bestHours = Array.from(hourStats.entries())
        .map(([key, stats]) => {
          const [hourStr, day] = key.split('-');
          return {
            hour: parseInt(hourStr),
            day,
            rate: stats.total > 0 ? Number(((stats.replied / stats.total) * 100).toFixed(1)) : 0,
          };
        })
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 10);

      setAnalyticsData({
        dailyDMs,
        replyRateByChannel,
        replyRateByVertical,
        leadsByStage,
        bestHours,
      });

      const templatePerfData = templates.map(template => {
        const sent = template.times_sent || 0;
        const replied = template.times_replied || 0;
        const replyRate = sent > 0 ? (replied / sent) * 100 : 0;

        const templateLogs = dmLogs.filter(log => log.template_id === template.id);
        const conversions = templateLogs.filter(log => log.converted_at).length;
        const convRate = replied > 0 ? (conversions / replied) * 100 : 0;

        return {
          template_name: template.name,
          channel: template.channel,
          vertical: template.vertical,
          sent,
          replied,
          reply_rate: Number(replyRate.toFixed(1)),
          conversion_rate: Number(convRate.toFixed(1)),
        };
      }).sort((a, b) => b.reply_rate - a.reply_rate);

      setTemplatePerformance(templatePerfData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar analytics';
      setError(message);
      console.error('Error in useProspectorAnalytics:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { metrics, analyticsData, templatePerformance, loading, error, refetch: fetchAnalytics };
};
