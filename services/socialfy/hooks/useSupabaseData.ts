import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types for UI (matching Growth OS schema)
// ============================================================================

export interface UIMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

export interface UICampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  channels: string[];
  leads: number;
  responses: number;
  conversionRate: number;
  cadenceName: string;
  owner: string;
}

export interface UILead {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  status: string;
  channels: string[];
  icpScore: number;
  funnelStage: string;
  sourceType: 'outbound' | 'inbound';
  sourceChannel: string;
  temperature: string;
  lastContactAt?: string;
  cadenceStatus?: {
    name: string;
    step: string;
    nextActivity: string;
  };
}

export interface UIPipelineCard {
  id: string;
  leadName: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  channels: string[];
  cadenceStatus: string;
  nextActivity: string;
  showRateGuard?: Record<string, string>;
}

export interface UIAccount {
  id: string;
  platform: string;
  name: string;
  status: string;
  usage: number;
  limit: number;
}

export interface UIAgent {
  id: string;
  name: string;
  type: string;
  language: string;
  model: string;
  isActive: boolean;
  description: string;
}

export interface UIConversation {
  id: string;
  leadName: string;
  leadAvatar: string;
  channel: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageDirection: string;
  unreadCount: number;
  status: string;
}

export interface UIFunnelData {
  stage: string;
  count: number;
  percentage: number;
}

// ============================================================================
// Outbound vs Inbound channel classification
// ============================================================================

// Outbound = prospecção ativa (scraping, DMs, cold outreach)
const OUTBOUND_CHANNELS = [
  'instagram', 'instagram_dm', 'instagram_search', 'instagram_scraping',
  'linkedin', 'linkedin_search', 'linkedin_dm',
  'apify_scraping', 'cnpj_search',
  'cold_email', 'cold_call'
];

// Inbound = leads que chegam por tráfego/resposta
const INBOUND_CHANNELS = [
  'ads', 'facebook_ads', 'instagram_ads', 'google_ads',
  'whatsapp', 'referral', 'organic', 'inbound_call', 'website'
];

function getSourceType(sourceChannel: string): 'outbound' | 'inbound' {
  const channel = (sourceChannel || '').toLowerCase();

  // Check if it's explicitly outbound
  if (OUTBOUND_CHANNELS.some(c => channel.includes(c) || c.includes(channel))) {
    return 'outbound';
  }

  // Check if it's explicitly inbound
  if (INBOUND_CHANNELS.some(c => channel.includes(c) || c.includes(channel))) {
    return 'inbound';
  }

  // Default: if it has scrape/search/dm in the name, it's outbound
  if (channel.includes('scrape') || channel.includes('search') || channel.includes('dm')) {
    return 'outbound';
  }

  return 'inbound';
}

// ============================================================================
// Transform functions (Growth OS DB -> UI format)
// ============================================================================

function transformGrowthLead(lead: any): UILead {
  const sourceType = getSourceType(lead.source_channel || '');

  // Map funnel_stage to UI status
  const statusMap: Record<string, string> = {
    'prospected': 'Prospected',
    'lead_novo': 'New Lead',
    'lead': 'Lead',
    'qualified': 'Qualified',
    'scheduled': 'Scheduled',
    'showed': 'Showed',
    'no_show': 'No Show',
    'proposal': 'Proposal',
    'won': 'Won',
    'lost': 'Lost',
  };

  // Normalize funnel_stage for counting
  // lead_novo is basically "lead" stage for funnel purposes
  const normalizedStage = lead.funnel_stage === 'lead_novo' ? 'lead' : lead.funnel_stage;

  // Detect channels from data
  const channels: string[] = [];
  if (lead.instagram_username) channels.push('instagram');
  if (lead.linkedin_url) channels.push('linkedin');
  if (lead.whatsapp || lead.phone) channels.push('whatsapp');
  if (lead.email) channels.push('email');
  if (channels.length === 0) channels.push('instagram'); // default

  return {
    id: lead.id,
    name: lead.name || 'Sem nome',
    title: lead.job_title || '',
    company: lead.company || '',
    avatar: lead.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name || 'U')}&background=random`,
    status: statusMap[lead.funnel_stage] || lead.funnel_stage || 'New Lead',
    channels,
    icpScore: lead.lead_score || lead.bant_total_score || 0,
    funnelStage: normalizedStage || 'lead',
    sourceType,
    sourceChannel: lead.source_channel || 'unknown',
    temperature: lead.lead_temperature || 'cold',
    lastContactAt: lead.last_contact_at,
    cadenceStatus: undefined,
  };
}

function transformConversation(conv: any): UIConversation {
  return {
    id: conv.id,
    leadName: conv.lead?.name || 'Desconhecido',
    leadAvatar: conv.lead?.avatar_url || `https://ui-avatars.com/api/?name=U&background=random`,
    channel: conv.channel || 'instagram',
    lastMessage: conv.last_message || '',
    lastMessageAt: conv.last_message_at || conv.created_at,
    lastMessageDirection: conv.last_message_direction || 'inbound',
    unreadCount: conv.unread_count || 0,
    status: conv.status || 'open',
  };
}

// ============================================================================
// Main hook - fetches from Growth OS tables
// ============================================================================

export function useSupabaseData(locationId?: string) {
  const [leads, setLeads] = useState<UILead[]>([]);
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [campaigns, setCampaigns] = useState<UICampaign[]>([]);
  const [pipeline, setPipeline] = useState<UIPipelineCard[]>([]);
  const [accounts, setAccounts] = useState<UIAccount[]>([]);
  const [agents, setAgents] = useState<UIAgent[]>([]);
  const [metrics, setMetrics] = useState<UIMetric[]>([]);
  const [funnelData, setFunnelData] = useState<UIFunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch Growth OS leads
        let leadsQuery = supabase
          .from('growth_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (locationId) {
          leadsQuery = leadsQuery.eq('location_id', locationId);
        }

        // Fetch conversations with lead data
        let conversationsQuery = supabase
          .from('portal_conversations')
          .select(`
            *,
            lead:growth_leads(id, name, avatar_url, funnel_stage, lead_temperature)
          `)
          .order('last_message_at', { ascending: false })
          .limit(50);

        if (locationId) {
          conversationsQuery = conversationsQuery.eq('location_id', locationId);
        }

        // Execute queries in parallel
        const [leadsResult, conversationsResult] = await Promise.all([
          leadsQuery,
          conversationsQuery,
        ]);

        // Handle leads
        const transformedLeads = (leadsResult.data || []).map(transformGrowthLead);
        setLeads(transformedLeads);

        // Handle conversations
        const transformedConversations = (conversationsResult.data || []).map(transformConversation);
        setConversations(transformedConversations);

        // Calculate funnel metrics
        const funnelStages = ['prospected', 'lead', 'qualified', 'scheduled', 'showed', 'no_show', 'proposal', 'won', 'lost'];
        const funnelCounts: Record<string, number> = {};

        funnelStages.forEach(stage => {
          funnelCounts[stage] = transformedLeads.filter(l => l.funnelStage === stage).length;
        });

        const totalLeads = transformedLeads.length;
        const funnelDataCalc: UIFunnelData[] = funnelStages.map(stage => ({
          stage,
          count: funnelCounts[stage],
          percentage: totalLeads > 0 ? Math.round((funnelCounts[stage] / totalLeads) * 100) : 0,
        }));
        setFunnelData(funnelDataCalc);

        // Calculate breakdown
        const outboundLeads = transformedLeads.filter(l => l.sourceType === 'outbound');
        const inboundLeads = transformedLeads.filter(l => l.sourceType === 'inbound');

        // Generate pipeline from leads in later stages
        const pipelineLeads = transformedLeads.filter(l =>
          ['scheduled', 'showed', 'proposal', 'won'].includes(l.funnelStage)
        );

        const transformedPipeline: UIPipelineCard[] = pipelineLeads.map(lead => ({
          id: lead.id,
          leadName: lead.name,
          title: lead.title,
          company: lead.company,
          value: 0, // Would come from conversion_value if available
          stage: lead.funnelStage === 'showed' ? 'Scheduled' :
                 lead.funnelStage === 'proposal' ? 'Proposal' :
                 lead.funnelStage === 'won' ? 'Won' : 'Scheduled',
          channels: lead.channels,
          cadenceStatus: lead.status,
          nextActivity: 'Follow-up',
        }));
        setPipeline(transformedPipeline);

        // Calculate metrics
        const prospectedCount = funnelCounts['prospected'] || 0;
        const leadsCount = totalLeads - prospectedCount;
        const qualifiedCount = funnelCounts['qualified'] || 0;
        const scheduledCount = funnelCounts['scheduled'] || 0;
        const showedCount = funnelCounts['showed'] || 0;
        const wonCount = funnelCounts['won'] || 0;

        // Conversion rates
        const leadRate = prospectedCount > 0 ? Math.round((leadsCount / prospectedCount) * 100) : 0;
        const qualificationRate = leadsCount > 0 ? Math.round((qualifiedCount / leadsCount) * 100) : 0;
        const showRate = scheduledCount > 0 ? Math.round((showedCount / scheduledCount) * 100) : 0;
        const closingRate = showedCount > 0 ? Math.round((wonCount / showedCount) * 100) : 0;

        setMetrics([
          {
            label: 'Total Leads',
            value: totalLeads.toLocaleString(),
            change: `${outboundLeads.length} outbound`,
            trend: 'up',
            description: `${inboundLeads.length} inbound`
          },
          {
            label: 'Prospectados',
            value: prospectedCount.toString(),
            change: `${leadRate}% converteram`,
            trend: leadRate > 30 ? 'up' : 'down',
            description: 'DMs/contatos enviados'
          },
          {
            label: 'Agendados',
            value: scheduledCount.toString(),
            change: `${showRate}% show-rate`,
            trend: showRate >= 70 ? 'up' : 'down',
            description: 'Reuniões marcadas'
          },
          {
            label: 'Vendas',
            value: wonCount.toString(),
            change: `${closingRate}% fechamento`,
            trend: closingRate > 20 ? 'up' : 'down',
            description: 'Negócios fechados'
          },
        ]);

        // Mock campaigns for now (would come from separate table)
        setCampaigns([]);
        setAccounts([]);
        setAgents([]);

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [locationId]);

  // Refetch function for manual refresh
  const refetch = () => {
    setLoading(true);
  };

  return {
    leads,
    conversations,
    campaigns,
    pipeline,
    accounts,
    agents,
    metrics,
    funnelData,
    loading,
    error,
    refetch,
  };
}

export default useSupabaseData;
