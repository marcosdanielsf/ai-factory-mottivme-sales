
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client, Agent, AgentVersion } from '../types'; // Using new types
import { MOCK_CLIENTS } from '../constants';
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

    // Buscar da tabela 'clients' (conforme unified_schema.sql)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Error fetching clients:', error);
      // Se a tabela clients não existir, tentar fallback para agents (retrocompatibilidade)
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*');
      
      if (agentsError) return MOCK_CLIENTS;
      return agentsData.map((a: any) => ({
        id: a.id,
        nome: a.name,
        empresa: a.slug,
        status: a.is_active ? 'cliente' : 'churned',
        created_at: a.created_at,
        vertical: 'mentores'
      })) as Client[];
    }

    // Map Client DB -> Client UI
    return data.map((client: any) => ({
      id: client.id,
      nome: client.nome,
      empresa: client.empresa,
      email: client.email,
      telefone: client.telefone,
      vertical: client.vertical || 'mentores',
      status: client.status === 'active' ? 'cliente' : 'churned',
      created_at: client.created_at,
      avatar: client.avatar_url || '', 
      revenue: 0,
      score: 0
    })) as Client[];
  }
};

export const AgentService = {
  // Fetch latest version for an Agent (Client)
  async getConfig(clientId: string): Promise<AgentConfig | null> {
    if (!isSupabaseConfigured()) {
       // Mock fallback
       return {
        id: 'mock-config',
        client_id: clientId,
        system_prompt: SYSTEM_PROMPT_TEMPLATE,
        prompts_por_modo: {
          first_contact: "Você é a Nina...",
          scheduler: "Agora seu foco é agendar...",
        },
        tools_config: {},
        created_at: new Date().toISOString()
      };
    }

    // Buscar a versão ativa (is_active = true) para este cliente
    const { data: activeVersion, error: versionError } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle();

    if (versionError || !activeVersion) {
       // Se não houver ativa, buscar a mais recente de qualquer status
       const { data: latestVersion, error: latestError } = await supabase
        .from('agent_versions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
       if (latestError || !latestVersion) return null;
       
       return {
         id: latestVersion.id,
         client_id: clientId,
         system_prompt: latestVersion.system_prompt,
         prompts_por_modo: latestVersion.prompts_por_modo || {},
         tools_config: {},
         created_at: latestVersion.created_at
       };
    }

    return {
      id: activeVersion.id,
      client_id: clientId,
      system_prompt: activeVersion.system_prompt,
      prompts_por_modo: activeVersion.prompts_por_modo || {},
      tools_config: {},
      created_at: activeVersion.created_at
    };
  },

  async saveConfig(config: Partial<AgentConfig>) {
    if (!isSupabaseConfigured()) {
      console.log('Mock saving config:', config);
      return { data: config, error: null };
    }

    // Na nova schema, usamos client_id
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
