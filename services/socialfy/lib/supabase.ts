import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ============================================================================
// Types (matching database schema)
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  title?: string;
  company?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  instagram_handle?: string;
  whatsapp?: string;
  status: 'available' | 'in_cadence' | 'responding' | 'scheduled' | 'converted' | 'lost';
  icp_score: number;
  channels: string[];
  source?: string;
  source_data?: Record<string, any>;
  cnpj?: string;
  cnpj_data?: Record<string, any>;
  tags: string[];
  list_ids: string[];
  custom_fields?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: 'connection' | 'warm_up' | 'authority' | 'instagram_dm' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  channels: string[];
  cadence_id?: string;
  cadence_name?: string;
  leads_count: number;
  responses_count: number;
  meetings_count: number;
  conversion_rate: number;
  owner_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Cadence {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  channels: string[];
  duration_days: number;
  touch_level: 'low' | 'medium' | 'high';
  lead_source: 'outbound' | 'inbound' | 'referral';
  steps: CadenceStep[];
  avg_response_rate: number;
  avg_meeting_rate: number;
  times_used: number;
  status: 'draft' | 'active' | 'archived';
  is_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CadenceStep {
  day: number;
  channel: string;
  action: string;
  template_id?: string;
  time?: string;
  content?: string;
}

export interface LeadCadence {
  id: string;
  lead_id: string;
  campaign_id?: string;
  cadence_id: string;
  current_step: number;
  current_day: number;
  status: 'active' | 'paused' | 'completed' | 'responded' | 'converted' | 'bounced';
  next_activity_at?: string;
  next_activity_channel?: string;
  next_activity_type?: string;
  started_at: string;
  completed_at?: string;
  responded_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  lead_id: string;
  campaign_id?: string;
  lead_cadence_id?: string;
  type: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  status: 'scheduled' | 'completed' | 'failed' | 'cancelled';
  responded: boolean;
  response_time_hours?: number;
  metadata?: Record<string, any>;
  performed_by?: string;
  scheduled_at?: string;
  performed_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  organization_id: string;
  thread_id?: string;
  lead_id: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
  is_read: boolean;
  read_at?: string;
  sent_by?: string;
  external_id?: string;
  metadata?: Record<string, any>;
  sent_at: string;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  organization_id: string;
  user_id: string;
  platform: string;
  account_name: string;
  status: 'connected' | 'disconnected' | 'error' | 'rate_limited';
  daily_limit: number;
  daily_usage: number;
  last_reset_at: string;
  credentials?: Record<string, any>;
  metadata?: Record<string, any>;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineDeal {
  id: string;
  organization_id: string;
  lead_id: string;
  campaign_id?: string;
  title?: string;
  value: number;
  currency: string;
  stage: 'new' | 'relationship' | 'scheduled' | 'proposal' | 'negotiation' | 'won' | 'lost';
  meeting_scheduled_at?: string;
  meeting_type?: string;
  show_rate_guard?: Record<string, string>;
  expected_close_date?: string;
  won_at?: string;
  lost_at?: string;
  lost_reason?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AIAgent {
  id: string;
  organization_id: string;
  name: string;
  type: 'connection' | 'inbox' | 'content' | 'qualifier' | 'voice_ai';
  description?: string;
  language: string;
  model: string;
  system_prompt?: string;
  templates?: any[];
  settings?: Record<string, any>;
  is_active: boolean;
  total_executions: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Auth helpers
// ============================================================================

export const auth = {
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPasswordForEmail: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }
};

// ============================================================================
// Database helpers
// ============================================================================

export const db = {
  // Growth OS Leads (primary source - multi-tenant)
  growthLeads: {
    list: async (filters?: { location_id?: string; funnel_stage?: string; source_type?: string; search?: string; limit?: number }) => {
      let query = supabase.from('growth_leads').select('*');

      if (filters?.location_id) query = query.eq('location_id', filters.location_id);
      if (filters?.funnel_stage) query = query.eq('funnel_stage', filters.funnel_stage);
      if (filters?.source_type) {
        const outboundChannels = ['instagram_dm', 'linkedin', 'cold_email', 'cold_call'];
        if (filters.source_type === 'outbound') {
          query = query.in('source_channel', outboundChannels);
        } else {
          query = query.not('source_channel', 'in', `(${outboundChannels.join(',')})`);
        }
      }
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);

      return query.order('created_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('growth_leads').select('*').eq('id', id).single();
    },

    getByGhlContactId: async (ghlContactId: string, locationId: string) => {
      return supabase.from('growth_leads')
        .select('*')
        .eq('ghl_contact_id', ghlContactId)
        .eq('location_id', locationId)
        .single();
    },

    updateStage: async (id: string, stage: string) => {
      return supabase.from('growth_leads')
        .update({ funnel_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    },
  },

  // Portal Conversations (synced from GHL)
  portalConversations: {
    list: async (filters?: { location_id?: string; channel?: string; status?: string; limit?: number }) => {
      let query = supabase.from('portal_conversations').select(`
        *,
        lead:growth_leads(id, name, avatar_url, funnel_stage, lead_temperature, instagram_username, phone)
      `);

      if (filters?.location_id) query = query.eq('location_id', filters.location_id);
      if (filters?.channel) query = query.eq('channel', filters.channel);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.limit) query = query.limit(filters.limit);

      return query.order('last_message_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('portal_conversations').select(`
        *,
        lead:growth_leads(*)
      `).eq('id', id).single();
    },

    markAsRead: async (id: string) => {
      return supabase.from('portal_conversations')
        .update({ unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', id);
    },
  },

  // Portal Messages
  portalMessages: {
    list: async (conversationId: string, limit: number = 50) => {
      return supabase.from('portal_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })
        .limit(limit);
    },
  },

  // Growth Client Configs (tenant settings)
  clientConfigs: {
    get: async (locationId: string) => {
      return supabase.from('growth_client_configs')
        .select('*')
        .eq('location_id', locationId)
        .single();
    },

    list: async () => {
      return supabase.from('growth_client_configs')
        .select('*')
        .eq('status', 'active')
        .order('client_name');
    },
  },

  // Legacy: Leads from socialfy_leads (seed data)
  leads: {
    list: async (filters?: { status?: string; search?: string; limit?: number; organization_id?: string }) => {
      let query = supabase.from('socialfy_leads').select('*');

      if (filters?.organization_id) query = query.eq('organization_id', filters.organization_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);

      return query.order('created_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('socialfy_leads').select('*').eq('id', id).single();
    },

    create: async (lead: Partial<Lead>) => {
      return supabase.from('socialfy_leads').insert(lead).select().single();
    },

    update: async (id: string, updates: Partial<Lead>) => {
      return supabase.from('socialfy_leads').update(updates).eq('id', id).select().single();
    },

    delete: async (id: string) => {
      return supabase.from('socialfy_leads').delete().eq('id', id);
    }
  },

  // Legacy: CRM Leads from crm_leads
  crmLeads: {
    list: async (filters?: { status?: string; search?: string; limit?: number }) => {
      let query = supabase.from('crm_leads').select('*');

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);

      return query.order('created_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('crm_leads').select('*').eq('id', id).single();
    },
  },

  // Campaigns
  campaigns: {
    list: async (filters?: { status?: string; type?: string; organization_id?: string }) => {
      let query = supabase.from('socialfy_campaigns').select('*');

      if (filters?.organization_id) query = query.eq('organization_id', filters.organization_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.type) query = query.eq('type', filters.type);

      return query.order('created_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('socialfy_campaigns').select('*').eq('id', id).single();
    },

    create: async (campaign: Partial<Campaign>) => {
      return supabase.from('socialfy_campaigns').insert(campaign).select().single();
    },

    update: async (id: string, updates: Partial<Campaign>) => {
      return supabase.from('socialfy_campaigns').update(updates).eq('id', id).select().single();
    },

    delete: async (id: string) => {
      return supabase.from('socialfy_campaigns').delete().eq('id', id);
    }
  },

  // Cadences
  cadences: {
    list: async (filters?: { status?: string; is_template?: boolean }) => {
      let query = supabase.from('socialfy_cadences').select('*');

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.is_template !== undefined) query = query.eq('is_template', filters.is_template);

      return query.order('created_at', { ascending: false });
    },

    get: async (id: string) => {
      return supabase.from('socialfy_cadences').select('*').eq('id', id).single();
    },

    create: async (cadence: Partial<Cadence>) => {
      return supabase.from('socialfy_cadences').insert(cadence).select().single();
    },

    update: async (id: string, updates: Partial<Cadence>) => {
      return supabase.from('socialfy_cadences').update(updates).eq('id', id).select().single();
    }
  },

  // Messages (Inbox)
  messages: {
    list: async (filters?: { lead_id?: string; channel?: string; is_read?: boolean }) => {
      let query = supabase.from('socialfy_messages').select('*, lead:socialfy_leads(name, company, avatar_url)');

      if (filters?.lead_id) query = query.eq('lead_id', filters.lead_id);
      if (filters?.channel) query = query.eq('channel', filters.channel);
      if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);

      return query.order('sent_at', { ascending: false });
    },

    markAsRead: async (id: string) => {
      return supabase.from('socialfy_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    },

    send: async (message: Partial<Message>) => {
      return supabase.from('socialfy_messages').insert(message).select().single();
    }
  },

  // Pipeline
  pipeline: {
    list: async (filters?: { stage?: string; organization_id?: string }) => {
      let query = supabase.from('socialfy_pipeline_deals').select('*, lead:socialfy_leads(name, title, company, avatar_url, channels)');

      if (filters?.organization_id) query = query.eq('organization_id', filters.organization_id);
      if (filters?.stage) query = query.eq('stage', filters.stage);

      return query.order('created_at', { ascending: false });
    },

    updateStage: async (id: string, stage: string) => {
      return supabase.from('socialfy_pipeline_deals').update({ stage }).eq('id', id);
    }
  },

  // Connected Accounts
  accounts: {
    list: async (filters?: { organization_id?: string }) => {
      let query = supabase.from('socialfy_connected_accounts').select('*');

      if (filters?.organization_id) query = query.eq('organization_id', filters.organization_id);

      return query.order('platform');
    },

    updateUsage: async (id: string, usage: number) => {
      return supabase.from('socialfy_connected_accounts').update({ daily_usage: usage }).eq('id', id);
    }
  },

  // AI Agents
  agents: {
    list: async (filters?: { organization_id?: string }) => {
      let query = supabase.from('socialfy_ai_agents').select('*');

      if (filters?.organization_id) query = query.eq('organization_id', filters.organization_id);

      return query.order('name');
    },

    toggle: async (id: string, isActive: boolean) => {
      return supabase.from('socialfy_ai_agents').update({ is_active: isActive }).eq('id', id);
    }
  }
};

// ============================================================================
// RPC Functions (SQL functions created in Supabase)
// ============================================================================

export interface DashboardTotals {
  total_leads: number;
  active_cadences: number;
  meetings_scheduled: number;
  meetings_completed: number;
  show_rate: number;
  response_rate: number;
  conversion_rate: number;
}

export interface RecentLead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  score: number;
  source_channel: string;
  created_at: string;
}

export interface MeetingsSummary {
  total_scheduled: number;
  total_completed: number;
  show_rate: number;
}

export const rpc = {
  // Get dashboard totals (6 metrics in one call)
  getDashboardTotals: async (params?: { location_id?: string; company_id?: string; sub_account_id?: string }) => {
    return supabase.rpc('fn_dashboard_totals', {
      p_location_id: params?.location_id || null,
      p_company_id: params?.company_id || null,
      p_sub_account_id: params?.sub_account_id || null,
    });
  },

  // Get recent leads (last 20)
  getRecentLeads: async (params?: { location_id?: string; company_id?: string; sub_account_id?: string }) => {
    return supabase.rpc('fn_recent_leads', {
      p_location_id: params?.location_id || null,
      p_company_id: params?.company_id || null,
      p_sub_account_id: params?.sub_account_id || null,
    });
  },

  // Get active cadences count
  getActiveCadencesCount: async (params?: { location_id?: string; company_id?: string }) => {
    return supabase.rpc('fn_cadences_active_count', {
      p_location_id: params?.location_id || null,
      p_company_id: params?.company_id || null,
    });
  },

  // Get meetings summary
  getMeetingsSummary: async (params?: { location_id?: string; company_id?: string }) => {
    return supabase.rpc('fn_meetings_summary', {
      p_location_id: params?.location_id || null,
      p_company_id: params?.company_id || null,
    });
  },
};

export default supabase;
