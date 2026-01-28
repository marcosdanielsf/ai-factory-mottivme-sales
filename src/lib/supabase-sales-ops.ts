// ============================================
// MOTTIVME AI Factory - Sales Ops DAO
// ============================================

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface SalesOpsOverview {
  location_id: string;
  location_name: string;
  leads_ativos: number;
  leads_inativos: number;
  total_leads: number;
  media_follow_ups: number | null;
  ultima_execucao: string | null;
  canais_ativos: number;
}

export interface FollowUpFunnel {
  location_id: string;
  location_name: string;
  follow_up_count: number;
  quantidade: number;
  percentual: number;
}

export interface LeadsProntosFollowUp {
  location_id: string;
  location_name: string;
  prontos_para_follow_up: number;
}

export interface ConversaoPorEtapa {
  location_id: string;
  location_name: string;
  etapa: number;
  ativos_nesta_etapa: number;
  desativados_nesta_etapa: number;
  total_etapa: number;
  taxa_desistencia_percentual: number;
}

export interface AtividadeDiaria {
  location_id: string;
  location_name: string;
  data: string;
  mensagens_enviadas: number;
  leads_contactados: number;
}

export interface ClientInfo {
  location_id: string;
  location_name: string;
  leads_ativos: number;
}

export interface LeadDetail {
  session_id: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  location_id: string | null;
  location_name: string | null;
  last_message: string | null;
  follow_up_count: number;
  last_contact_at: string | null;
  is_active: boolean;
}

export type LeadFilterType = 
  | 'ativos' 
  | 'inativos' 
  | 'prontos_fu' 
  | 'fu_0' 
  | 'fu_1' 
  | 'fu_2' 
  | 'fu_3' 
  | 'fu_4_plus';

// ============================================
// SALES OPS DAO
// ============================================

export const salesOpsDAO = {
  async getOverview(locationId?: string): Promise<SalesOpsOverview[]> {
    let query = supabase
      .from('vw_sales_ops_overview')
      .select('*')
      .order('leads_ativos', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTotals(): Promise<{
    totalAtivos: number;
    totalInativos: number;
    totalLeads: number;
    mediaFollowUps: number;
  }> {
    // Buscar dados diretamente da n8n_schedule_tracking para cálculos precisos
    const { data, error } = await supabase
      .from('n8n_schedule_tracking')
      .select('ativo, follow_up_count');

    if (error) throw error;

    const leads = data || [];
    const totalAtivos = leads.filter(l => l.ativo === true).length;
    const totalInativos = leads.filter(l => l.ativo === false).length;
    const totalLeads = leads.length;
    
    // Calcular média de follow-ups corretamente (soma total / quantidade de leads)
    const totalFollowUps = leads.reduce((sum, l) => sum + (l.follow_up_count || 0), 0);
    const mediaFollowUps = totalLeads > 0 
      ? Math.round((totalFollowUps / totalLeads) * 100) / 100 
      : 0;

    return {
      totalAtivos,
      totalInativos,
      totalLeads,
      mediaFollowUps,
    };
  },

  async getFunnel(locationId?: string): Promise<FollowUpFunnel[]> {
    let query = supabase
      .from('vw_follow_up_funnel')
      .select('*')
      .order('follow_up_count', { ascending: true });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAggregatedFunnel(): Promise<{ follow_up_count: number; quantidade: number; percentual: number }[]> {
    const { data, error } = await supabase
      .from('vw_follow_up_funnel')
      .select('follow_up_count, quantidade');

    if (error) throw error;

    const aggregated = (data || []).reduce((acc, row) => {
      const key = row.follow_up_count;
      if (!acc[key]) {
        acc[key] = { follow_up_count: key, quantidade: 0 };
      }
      acc[key].quantidade += row.quantidade;
      return acc;
    }, {} as Record<number, { follow_up_count: number; quantidade: number }>);

    const result = Object.values(aggregated);
    const total = result.reduce((sum, r) => sum + r.quantidade, 0);

    return result
      .map(r => ({
        ...r,
        percentual: total > 0 ? Math.round((r.quantidade / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => a.follow_up_count - b.follow_up_count);
  },

  async getLeadsProntos(locationId?: string): Promise<LeadsProntosFollowUp[]> {
    let query = supabase
      .from('vw_leads_prontos_follow_up')
      .select('*')
      .order('prontos_para_follow_up', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTotalLeadsProntos(locationId?: string): Promise<number> {
    const data = await this.getLeadsProntos(locationId);
    return data.reduce((sum, row) => sum + row.prontos_para_follow_up, 0);
  },

  async getConversao(locationId?: string): Promise<ConversaoPorEtapa[]> {
    let query = supabase
      .from('vw_conversao_por_etapa')
      .select('*')
      .order('etapa', { ascending: true });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAtividade(locationId?: string, days: number = 30): Promise<AtividadeDiaria[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('vw_atividade_diaria')
      .select('*')
      .gte('data', startDate.toISOString().split('T')[0])
      .order('data', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAggregatedAtividade(days: number = 30): Promise<{ data: string; mensagens_enviadas: number; leads_contactados: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('vw_atividade_diaria')
      .select('data, mensagens_enviadas, leads_contactados')
      .gte('data', startDate.toISOString().split('T')[0]);

    if (error) throw error;

    const aggregated = (data || []).reduce((acc, row) => {
      const key = row.data;
      if (!acc[key]) {
        acc[key] = { data: key, mensagens_enviadas: 0, leads_contactados: 0 };
      }
      acc[key].mensagens_enviadas += row.mensagens_enviadas;
      acc[key].leads_contactados += row.leads_contactados;
      return acc;
    }, {} as Record<string, { data: string; mensagens_enviadas: number; leads_contactados: number }>);

    return Object.values(aggregated).sort((a, b) => a.data.localeCompare(b.data));
  },

  async getClients(): Promise<ClientInfo[]> {
    // Buscar clientes diretamente da n8n_schedule_tracking para ter dados atualizados
    const { data, error } = await supabase
      .from('n8n_schedule_tracking')
      .select('location_id, location_name, ativo');

    if (error) throw error;

    // Agrupar por location_id e contar leads ativos
    const clientMap = new Map<string, { location_id: string; location_name: string; leads_ativos: number }>();
    
    for (const row of data || []) {
      if (!row.location_id) continue;
      
      const existing = clientMap.get(row.location_id);
      if (!existing) {
        clientMap.set(row.location_id, {
          location_id: row.location_id,
          // Se não tem nome, usar ID truncado
          location_name: row.location_name || `Location ${row.location_id.substring(0, 8)}...`,
          leads_ativos: row.ativo ? 1 : 0,
        });
      } else {
        if (row.ativo) existing.leads_ativos++;
        // Atualiza nome se encontrar um válido
        if (row.location_name && existing.location_name.startsWith('Location ')) {
          existing.location_name = row.location_name;
        }
      }
    }

    return Array.from(clientMap.values())
      .filter(c => c.leads_ativos > 0 || c.location_name) // Remove completamente vazios
      .sort((a, b) => b.leads_ativos - a.leads_ativos);
  },

  /**
   * Busca leads detalhados por tipo de filtro
   * Usa n8n_schedule_tracking como fonte principal (mesma do gráfico)
   */
  async getLeadsByFilter(filterType: LeadFilterType, locationId?: string): Promise<LeadDetail[]> {
    // Query base - usar n8n_schedule_tracking diretamente para consistência com o gráfico
    let query = supabase
      .from('n8n_schedule_tracking')
      .select('unique_id, location_id, location_name, follow_up_count, ativo, created_at, first_name, source')
      .order('created_at', { ascending: false })
      .limit(100);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    // Aplica filtros baseado no tipo
    switch (filterType) {
      case 'ativos':
        query = query.eq('ativo', true);
        break;
      case 'inativos':
        query = query.eq('ativo', false);
        break;
      case 'prontos_fu':
        // Leads ativos com follow_up_count = 0 (prontos para primeiro FU)
        query = query.eq('ativo', true).eq('follow_up_count', 0);
        break;
      case 'fu_0':
        query = query.eq('follow_up_count', 0);
        break;
      case 'fu_1':
        query = query.eq('follow_up_count', 1);
        break;
      case 'fu_2':
        query = query.eq('follow_up_count', 2);
        break;
      case 'fu_3':
        query = query.eq('follow_up_count', 3);
        break;
      case 'fu_4_plus':
        query = query.gte('follow_up_count', 4);
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar leads:', error);
      // Tenta fallback com tabelas base se a view não existir
      return this.getLeadsFallback(filterType, locationId);
    }

    // Mapear dados da n8n_schedule_tracking para formato LeadDetail
    return (data || []).map((lead: any) => ({
      session_id: null,
      contact_id: lead.unique_id,
      // Usar first_name ou extrair algo do source/unique_id
      contact_name: lead.first_name || (lead.source ? `Lead via ${lead.source}` : null),
      contact_phone: null,
      location_id: lead.location_id,
      location_name: lead.location_name,
      // Usar source como info adicional se não tiver mensagem
      last_message: lead.source ? `Origem: ${lead.source}` : null,
      follow_up_count: lead.follow_up_count || 0,
      last_contact_at: lead.created_at,
      is_active: lead.ativo ?? true,
    }));
  },

  /**
   * Fallback caso as views de leads detalhados não existam
   * Busca diretamente das tabelas base
   */
  async getLeadsFallback(filterType: LeadFilterType, locationId?: string): Promise<LeadDetail[]> {
    try {
      // Tenta buscar de follow_up_leads com join
      let query = supabase
        .from('follow_up_leads')
        .select(`
          id,
          session_id,
          contact_id,
          contact_phone,
          location_id,
          follow_up_count,
          is_active,
          ultima_resposta,
          ultima_mensagem_lead
        `)
        .order('ultima_resposta', { ascending: false })
        .limit(100);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      // Aplica filtros
      switch (filterType) {
        case 'ativos':
          query = query.eq('is_active', true);
          break;
        case 'inativos':
          query = query.eq('is_active', false);
          break;
        case 'prontos_fu':
          query = query.eq('is_active', true);
          break;
        case 'fu_0':
          query = query.eq('follow_up_count', 0);
          break;
        case 'fu_1':
          query = query.eq('follow_up_count', 1);
          break;
        case 'fu_2':
          query = query.eq('follow_up_count', 2);
          break;
        case 'fu_3':
          query = query.eq('follow_up_count', 3);
          break;
        case 'fu_4_plus':
          query = query.gte('follow_up_count', 4);
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapeia para o formato LeadDetail
      return (data || []).map((lead) => ({
        session_id: lead.session_id,
        contact_id: lead.contact_id,
        contact_name: null, // Não disponível no fallback
        contact_phone: lead.contact_phone,
        location_id: lead.location_id,
        location_name: null, // Não disponível no fallback
        last_message: lead.ultima_mensagem_lead,
        follow_up_count: lead.follow_up_count || 0,
        last_contact_at: lead.ultima_resposta,
        is_active: lead.is_active ?? true,
      }));
    } catch (err) {
      console.error('Fallback também falhou:', err);
      return [];
    }
  },
};

export default salesOpsDAO;
