
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client, Agent, AgentVersion } from '../../types'; // Using new types
import { MOCK_CLIENTS } from '../../constants';
import { SYSTEM_PROMPT_TEMPLATE } from '../data/agent-config';

// Compatibility interface for UI components
export interface AgentConfig {
  id: string;
  client_id: string; // Will map to Agent ID in new schema context
  system_prompt: string;
  prompts_por_modo: Record<string, string>;
  tools_config: Record<string, any>;
  created_at: string;
}

export const ClientService = {
  // Now fetching from 'leads' or a dedicated 'clients' table if you separate them. 
  // Assuming 'clients' table still exists for multi-tenancy or we derive from Agents/Leads context.
  // Based on schema, we have 'leads' and 'agents'. 
  // For dashboard "Clients" view, we might need to look at 'agents' as "Companies" or create a dummy client view.
  // Let's assume for now we mock Clients or use a placeholder, 
  // OR we can query distinct companies from a new table if added, 
  // BUT based on user schema 'agents' seems to be the main entity for configuration.
  
  // WAIT: User schema doesn't have a 'clients' table. It has 'agents'. 
  // But Dashboard expects 'Clients' (Viver de IA, etc). 
  // We will map Agents to Clients for the UI.
  
  async getAll(): Promise<Client[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning mocks');
      return MOCK_CLIENTS;
    }

    // Fetch Agents and map to Client structure
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching agents:', error);
      return MOCK_CLIENTS;
    }

    // Map Agent -> Client (UI)
    return data.map((agent: any) => ({
      id: agent.id,
      nome: agent.name, // "Nina"
      empresa: agent.slug, // "viverdeia" (using slug as company name proxy)
      email: '',
      telefone: '',
      vertical: 'mentores', // Default or derive
      status: agent.is_active ? 'cliente' : 'churned',
      created_at: agent.created_at,
      avatar: '', 
      revenue: 0,
      score: 0
    })) as Client[];
  }
};

export const AgentService = {
  // Fetch latest version for an Agent
  async getConfig(agentId: string): Promise<AgentConfig | null> {
    if (!isSupabaseConfigured()) {
       // Mock fallback
       return {
        id: 'mock-config',
        client_id: agentId,
        system_prompt: SYSTEM_PROMPT_TEMPLATE,
        prompts_por_modo: {
          first_contact: "Você é a Nina...",
          scheduler: "Agora seu foco é agendar...",
        },
        tools_config: {},
        created_at: new Date().toISOString()
      };
    }

    // Get current version ID from Agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('current_version_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agentData?.current_version_id) {
       // Try to find ANY version if current is not set
       const { data: latestVersion, error: versionError } = await supabase
        .from('agent_versions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
       if (versionError) return null;
       
       return {
         id: latestVersion.id,
         client_id: agentId,
         system_prompt: latestVersion.system_prompt,
         prompts_por_modo: latestVersion.prompts_por_modo || {},
         tools_config: {}, // Not in new schema yet, optional
         created_at: latestVersion.created_at
       };
    }

    // Fetch the specific version
    const { data: versionData, error: versionError } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('id', agentData.current_version_id)
      .single();

    if (versionError) return null;

    return {
      id: versionData.id,
      client_id: agentId,
      system_prompt: versionData.system_prompt,
      prompts_por_modo: versionData.prompts_por_modo || {},
      tools_config: {},
      created_at: versionData.created_at
    };
  },

  async saveConfig(config: Partial<AgentConfig>) {
    if (!isSupabaseConfigured()) {
      console.log('Mock saving config:', config);
      return { data: config, error: null };
    }

    // In new schema, saving config usually means creating a NEW version or updating draft
    // For simplicity, we'll update the current version if it exists, or create new.
    // NOTE: Real implementation should likely create a new DRAFT version.
    
    // We need the ID of the version to update. 
    // If 'config.id' matches a version ID, update it.
    if (config.id && config.id !== 'mock-config') {
        const { data, error } = await supabase
          .from('agent_versions')
          .update({
            system_prompt: config.system_prompt,
            prompts_por_modo: config.prompts_por_modo
          })
          .eq('id', config.id)
          .select()
          .single();
          
        return { data, error };
    }
    
    return { data: null, error: 'No version ID provided for update' };
  }
};
