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
  respondidos_nesta_etapa: number;
  desativados_nesta_etapa: number;
  total_etapa: number;
  taxa_resposta_percentual: number;
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
  source?: string | null;
}

export type LeadFilterType = 
  | 'ativos' 
  | 'inativos' 
  | 'prontos_fu' 
  | 'fu_0' 
  | 'fu_1' 
  | 'fu_2' 
  | 'fu_3' 
  | 'fu_4_plus'
  | 'esfriando'
  | 'fuu_scheduled'
  // Novos filtros por etapa + status (formato: etapa_X_status)
  | `etapa_${number}_ativos`
  | `etapa_${number}_respondidos`
  | `etapa_${number}_desistentes`;

export interface FuuQueueStats {
  pending: number;      // status = 'pending' (aguardando na fila)
  in_progress: number;  // status = 'in_progress' (sendo processado)
  completed: number;    // status = 'completed' (enviado com sucesso)
  failed: number;       // status = 'failed' (falhou)
}

export interface FuuQueueLead {
  contact_id: string;
  contact_name: string | null;
  location_id: string;
  status: string;
  scheduled_at: string | null;
  follow_up_type: string | null;
}

export interface AgentPerformance {
  agente_ia: string;
  total_leads: number;
  respondidos: number;
  taxa_conversao: number;
}

export interface CustoPorEtapa {
  etapa: number;
  custo_total_usd: number;
  total_leads: number;
  custo_medio_por_lead: number;
}

// ============================================
// SALES OPS DAO
// ============================================

// ============================================
// TREND TYPES
// ============================================

export interface TrendData {
  ativos: number;      // % variação (positivo = cresceu)
  inativos: number;
  leadsProntos: number;
}

export interface TotalsWithTrend {
  current: {
    totalAtivos: number;
    totalInativos: number;
    totalLeads: number;
    mediaFollowUps: number;
  };
  previous: {
    totalAtivos: number;
    totalInativos: number;
    totalLeads: number;
    mediaFollowUps: number;
  };
  trends: TrendData;
}

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

  /**
   * Retorna métricas de funil filtradas por período
   * Usa n8n_schedule_tracking diretamente para suportar filtro de data
   */
  async getFunnelByPeriod(days: number = 30, locationId?: string): Promise<{
    totalLeads: number;
    responderam: number;
    taxaResposta: number;
    ativos: number;
    inativos: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('n8n_schedule_tracking')
      .select('ativo, responded')
      .gte('created_at', startDate.toISOString());

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const totalLeads = rows.length;
    const responderam = rows.filter(r => r.responded === true).length;
    const ativos = rows.filter(r => r.ativo === true).length;
    const inativos = rows.filter(r => r.ativo === false).length;
    const taxaResposta = totalLeads > 0 ? Math.round((responderam / totalLeads) * 1000) / 10 : 0;

    return {
      totalLeads,
      responderam,
      taxaResposta,
      ativos,
      inativos,
    };
  },

  async getTotals(locationId?: string): Promise<{
    totalAtivos: number;
    totalInativos: number;
    totalLeads: number;
    mediaFollowUps: number;
  }> {
    // Buscar diretamente da tabela base para garantir dados atualizados
    // (views materializadas podem estar desatualizadas)
    let query = supabase
      .from('n8n_schedule_tracking')
      .select('ativo, follow_up_count');

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar totais:', error);
      // Fallback para view se a query direta falhar
      return this.getTotalsFromView(locationId);
    }

    const rows = data || [];
    const totalLeads = rows.length;
    const totalAtivos = rows.filter(r => r.ativo === true).length;
    const totalInativos = rows.filter(r => r.ativo === false).length;
    
    // Calcular média de follow-ups
    const totalFUs = rows.reduce((sum, r) => sum + (r.follow_up_count || 0), 0);
    const mediaFollowUps = totalLeads > 0 
      ? Math.round((totalFUs / totalLeads) * 100) / 100 
      : 0;

    return {
      totalAtivos,
      totalInativos,
      totalLeads,
      mediaFollowUps,
    };
  },

  // Fallback usando views (caso a query direta falhe)
  async getTotalsFromView(locationId?: string): Promise<{
    totalAtivos: number;
    totalInativos: number;
    totalLeads: number;
    mediaFollowUps: number;
  }> {
    let overviewQuery = supabase
      .from('vw_sales_ops_overview')
      .select('leads_ativos, leads_inativos, total_leads, location_id');

    if (locationId) {
      overviewQuery = overviewQuery.eq('location_id', locationId);
    }

    const { data: overviewData, error: overviewError } = await overviewQuery;

    if (overviewError) throw overviewError;

    const totals = (overviewData || []).reduce(
      (acc, row) => ({
        totalAtivos: acc.totalAtivos + (row.leads_ativos || 0),
        totalInativos: acc.totalInativos + (row.leads_inativos || 0),
        totalLeads: acc.totalLeads + (row.total_leads || 0),
      }),
      { totalAtivos: 0, totalInativos: 0, totalLeads: 0 }
    );

    // Calcular média de FU usando o funil
    let funnelQuery = supabase
      .from('vw_follow_up_funnel')
      .select('follow_up_count, quantidade, location_id');

    if (locationId) {
      funnelQuery = funnelQuery.eq('location_id', locationId);
    }

    const { data: funnelData, error: funnelError } = await funnelQuery;

    let mediaFollowUps = 0;
    if (!funnelError && funnelData) {
      const totalFUs = funnelData.reduce((sum, row) => 
        sum + (row.follow_up_count * row.quantidade), 0);
      const totalLeadsFromFunnel = funnelData.reduce((sum, row) => 
        sum + row.quantidade, 0);
      mediaFollowUps = totalLeadsFromFunnel > 0 
        ? Math.round((totalFUs / totalLeadsFromFunnel) * 100) / 100 
        : 0;
    }

    return {
      ...totals,
      mediaFollowUps,
    };
  },

  /**
   * Busca totais com comparação de tendência vs período anterior
   * @param periodDays - Número de dias para comparar (ex: 7 = última semana vs semana anterior)
   * @param locationId - Filtro opcional por location
   */
  async getTotalsWithTrend(periodDays: number = 7, locationId?: string): Promise<TotalsWithTrend> {
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    // Helper para calcular variação percentual
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Buscar dados do período atual (leads criados nos últimos X dias)
    let currentQuery = supabase
      .from('n8n_schedule_tracking')
      .select('ativo, follow_up_count', { count: 'exact' })
      .gte('created_at', currentPeriodStart.toISOString());

    if (locationId) {
      currentQuery = currentQuery.eq('location_id', locationId);
    }

    // Buscar dados do período anterior
    let previousQuery = supabase
      .from('n8n_schedule_tracking')
      .select('ativo, follow_up_count', { count: 'exact' })
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    if (locationId) {
      previousQuery = previousQuery.eq('location_id', locationId);
    }

    // Buscar leads prontos para FU (período atual)
    let currentProntosQuery = supabase
      .from('n8n_schedule_tracking')
      .select('unique_id', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('follow_up_count', 0)
      .gte('created_at', currentPeriodStart.toISOString());

    if (locationId) {
      currentProntosQuery = currentProntosQuery.eq('location_id', locationId);
    }

    // Buscar leads prontos para FU (período anterior)
    let previousProntosQuery = supabase
      .from('n8n_schedule_tracking')
      .select('unique_id', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('follow_up_count', 0)
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    if (locationId) {
      previousProntosQuery = previousProntosQuery.eq('location_id', locationId);
    }

    const [currentData, previousData, currentProntos, previousProntos] = await Promise.all([
      currentQuery,
      previousQuery,
      currentProntosQuery,
      previousProntosQuery,
    ]);

    // Processar dados do período atual
    const currentRows = currentData.data || [];
    const currentTotals = currentRows.reduce(
      (acc, row) => ({
        ativos: acc.ativos + (row.ativo ? 1 : 0),
        inativos: acc.inativos + (!row.ativo ? 1 : 0),
        total: acc.total + 1,
        fuSum: acc.fuSum + (row.follow_up_count || 0),
      }),
      { ativos: 0, inativos: 0, total: 0, fuSum: 0 }
    );

    // Processar dados do período anterior
    const previousRows = previousData.data || [];
    const previousTotals = previousRows.reduce(
      (acc, row) => ({
        ativos: acc.ativos + (row.ativo ? 1 : 0),
        inativos: acc.inativos + (!row.ativo ? 1 : 0),
        total: acc.total + 1,
        fuSum: acc.fuSum + (row.follow_up_count || 0),
      }),
      { ativos: 0, inativos: 0, total: 0, fuSum: 0 }
    );

    const currentLeadsProntos = currentProntos.count || 0;
    const previousLeadsProntos = previousProntos.count || 0;

    return {
      current: {
        totalAtivos: currentTotals.ativos,
        totalInativos: currentTotals.inativos,
        totalLeads: currentTotals.total,
        mediaFollowUps: currentTotals.total > 0 
          ? Math.round((currentTotals.fuSum / currentTotals.total) * 100) / 100 
          : 0,
      },
      previous: {
        totalAtivos: previousTotals.ativos,
        totalInativos: previousTotals.inativos,
        totalLeads: previousTotals.total,
        mediaFollowUps: previousTotals.total > 0 
          ? Math.round((previousTotals.fuSum / previousTotals.total) * 100) / 100 
          : 0,
      },
      trends: {
        ativos: calcTrend(currentTotals.ativos, previousTotals.ativos),
        inativos: calcTrend(currentTotals.inativos, previousTotals.inativos),
        leadsProntos: calcTrend(currentLeadsProntos, previousLeadsProntos),
      },
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

  async getAggregatedFunnel(locationId?: string): Promise<{ follow_up_count: number; quantidade: number; percentual: number }[]> {
    let query = supabase
      .from('vw_follow_up_funnel')
      .select('follow_up_count, quantidade');

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

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

  /**
   * Busca contagem de leads esfriando (sem contato há mais de 48h)
   */
  async getLeadsEsfriando(locationId?: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    let query = supabase
      .from('n8n_schedule_tracking')
      .select('unique_id', { count: 'exact', head: true })
      .eq('ativo', true)
      .lt('created_at', cutoffDate.toISOString());

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { count, error } = await query;
    if (error) {
      console.error('Erro ao buscar leads esfriando:', error);
      return 0;
    }
    return count || 0;
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

  async getAggregatedAtividade(days: number = 30, locationId?: string): Promise<{ data: string; mensagens_enviadas: number; leads_contactados: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('vw_atividade_diaria')
      .select('data, mensagens_enviadas, leads_contactados')
      .gte('data', startDate.toISOString().split('T')[0]);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

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
    // Usar view que já está agregada por location
    const { data, error } = await supabase
      .from('vw_sales_ops_overview')
      .select('location_id, location_name, leads_ativos')
      .order('leads_ativos', { ascending: false });

    if (error) throw error;

    // Deduplicar e tratar nomes vazios
    const clientMap = new Map<string, ClientInfo>();
    for (const row of data || []) {
      if (!row.location_id) continue;
      
      const existing = clientMap.get(row.location_id);
      if (!existing || row.leads_ativos > existing.leads_ativos) {
        clientMap.set(row.location_id, {
          location_id: row.location_id,
          // Se não tem nome, usar ID truncado para identificação
          location_name: row.location_name || `ID: ${row.location_id.substring(0, 12)}...`,
          leads_ativos: row.leads_ativos || 0,
        });
      }
    }

    return Array.from(clientMap.values())
      .sort((a, b) => b.leads_ativos - a.leads_ativos);
  },

  /**
   * Busca estatísticas da fila de follow-ups agendados (fuu_queue)
   * Status: pending (na fila), in_progress (processando), completed (enviado), failed (falhou)
   */
  async getFuuQueueStats(locationId?: string): Promise<FuuQueueStats> {
    try {
      // Buscar todos os registros e agrupar por status
      let query = supabase
        .from('fuu_queue')
        .select('status');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar fuu_queue stats:', error);
        return { pending: 0, in_progress: 0, completed: 0, failed: 0 };
      }

      // Contar por status
      const stats = (data || []).reduce(
        (acc, row) => {
          if (row.status === 'pending') acc.pending++;
          else if (row.status === 'in_progress') acc.in_progress++;
          else if (row.status === 'completed') acc.completed++;
          else if (row.status === 'failed') acc.failed++;
          return acc;
        },
        { pending: 0, in_progress: 0, completed: 0, failed: 0 }
      );

      return stats;
    } catch (err) {
      console.error('Erro ao buscar fuu_queue stats:', err);
      return { pending: 0, in_progress: 0, completed: 0, failed: 0 };
    }
  },

  /**
   * Busca leads da fuu_queue para o drawer
   */
  async getFuuQueueLeads(locationId?: string): Promise<LeadDetail[]> {
    try {
      let query = supabase
        .from('fuu_queue')
        .select('contact_id, contact_name, location_id, status, scheduled_at, follow_up_type, context, phone')
        .order('scheduled_at', { ascending: true })
        .limit(100);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar fuu_queue leads:', error);
        return [];
      }

      // Mapear para formato LeadDetail
      return (data || []).map((lead) => {
        const statusLabel = lead.status === 'scheduled' ? '📅' : 
                           lead.status === 'pending' ? '🟡' : 
                           lead.status === 'failed' ? '🔴' : '⚪';
        
        // Extrair mensagem do context.ultimo_assunto
        const context = lead.context as { ultimo_assunto?: string; etapa?: string; source?: string } | null;
        const ultimoAssunto = context?.ultimo_assunto || null;
        
        // Se tem mensagem real, mostra ela. Senão, mostra info de agendamento
        const displayMessage = ultimoAssunto 
          ? `${statusLabel} ${ultimoAssunto}`
          : `${statusLabel} ${lead.follow_up_type || 'Follow-up'} • Agendado: ${lead.scheduled_at ? new Date(lead.scheduled_at).toLocaleString('pt-BR') : 'N/A'}`;
        
        const phone = lead.phone || null;
        
        // Formatar telefone para exibição
        const formatPhoneForDisplay = (p: string | null): string | null => {
          if (!p) return null;
          const cleaned = p.replace(/\D/g, '');
          if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
          }
          if (cleaned.length >= 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
          }
          return p;
        };
        
        // Resolver nome: prioridade > contact_name > telefone > "Lead sem identificação"
        const resolveName = (): string => {
          if (lead.contact_name && lead.contact_name.trim() && 
              lead.contact_name.toLowerCase() !== 'null' && 
              lead.contact_name.toLowerCase() !== 'sem nome') {
            return lead.contact_name.trim();
          }
          const formattedPhone = formatPhoneForDisplay(phone);
          if (formattedPhone) {
            return formattedPhone;
          }
          return 'Lead sem identificação';
        };
        
        return {
          session_id: null,
          contact_id: lead.contact_id,
          contact_name: resolveName(),
          contact_phone: phone,
          location_id: lead.location_id,
          location_name: null,
          last_message: displayMessage,
          follow_up_count: 0,
          last_contact_at: lead.scheduled_at,
          is_active: lead.status === 'scheduled',
          source: context?.source || lead.follow_up_type,
        };
      });
    } catch (err) {
      console.error('Erro ao buscar fuu_queue leads:', err);
      return [];
    }
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
      case 'esfriando':
        // Leads ativos sem contato há mais de 48h
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 48);
        query = query.eq('ativo', true).lt('created_at', cutoffDate.toISOString());
        break;
      case 'fuu_scheduled':
        // Redireciona para método específico da fuu_queue
        return this.getFuuQueueLeads(locationId);
      default:
        // Verificar se é filtro por etapa+status (formato: etapa_X_status)
        console.log('[getLeadsByFilter] filterType:', filterType);
        const etapaMatch = filterType.match(/^etapa_(\d+)_(ativos|respondidos|desistentes)$/);
        console.log('[getLeadsByFilter] etapaMatch:', etapaMatch);
        if (etapaMatch) {
          const etapa = parseInt(etapaMatch[1], 10);
          const status = etapaMatch[2] as 'ativos' | 'respondidos' | 'desistentes';
          console.log('[getLeadsByFilter] calling getLeadsByEtapaStatus:', etapa, status, locationId);
          return this.getLeadsByEtapaStatus(etapa, status, locationId);
        }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar leads:', error);
      // Tenta fallback com tabelas base se a view não existir
      return this.getLeadsFallback(filterType, locationId);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar dados de contato (telefone/nome) do app_dash_principal
    // O unique_id do tracking corresponde ao id do app_dash_principal
    const uniqueIds = data.map((lead: any) => parseInt(lead.unique_id, 10)).filter((id: number) => !isNaN(id));
    
    let contactsMap: Map<string, { name: string | null; phone: string | null }> = new Map();
    
    if (uniqueIds.length > 0) {
      try {
        const { data: contactsData, error: contactsError } = await supabase
          .from('app_dash_principal')
          .select('id, contato_principal, celular_contato, telefone_comercial_contato')
          .in('id', uniqueIds);
        
        if (!contactsError && contactsData) {
          for (const contact of contactsData) {
            contactsMap.set(String(contact.id), {
              name: contact.contato_principal,
              // Preferir celular, fallback para telefone comercial
              phone: contact.celular_contato || contact.telefone_comercial_contato || null,
            });
          }
        }
      } catch (contactErr) {
        console.warn('Não foi possível enriquecer com dados de contato:', contactErr);
      }
    }

    // Mapear dados da n8n_schedule_tracking para formato LeadDetail, enriquecido com contatos
    return (data || []).map((lead: any) => {
      const contactInfo = contactsMap.get(lead.unique_id);
      const phone = contactInfo?.phone || null;
      
      // Formatar telefone para exibição
      const formatPhoneForDisplay = (p: string | null): string | null => {
        if (!p) return null;
        const cleaned = p.replace(/\D/g, '');
        if (cleaned.length === 11) {
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        if (cleaned.length >= 10) {
          return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        }
        return p;
      };
      
      // Resolver nome: prioridade > app_dash nome > first_name > telefone > "Lead sem identificação"
      const resolveName = (): string => {
        // 1. Nome do app_dash_principal
        if (contactInfo?.name && contactInfo.name.trim() && 
            contactInfo.name.toLowerCase() !== 'null' && 
            contactInfo.name.toLowerCase() !== 'sem nome') {
          return contactInfo.name.trim();
        }
        // 2. first_name do tracking
        if (lead.first_name && lead.first_name.trim() && 
            lead.first_name.toLowerCase() !== 'null' &&
            lead.first_name.toLowerCase() !== 'sem nome') {
          return lead.first_name.trim();
        }
        // 3. Telefone formatado
        const formattedPhone = formatPhoneForDisplay(phone);
        if (formattedPhone) {
          return formattedPhone;
        }
        // 4. Fallback final
        return 'Lead sem identificação';
      };
      
      const sourceLabel = lead.source === 'instagram' ? '📸 IG' : lead.source === 'whatsapp' ? '💬 WA' : lead.source || '';
      
      return {
        session_id: null,
        contact_id: lead.unique_id,
        contact_name: resolveName(),
        // Usar telefone do app_dash_principal
        contact_phone: phone,
        location_id: lead.location_id,
        location_name: lead.location_name,
        // Mostrar source como badge + origem
        last_message: sourceLabel ? `${sourceLabel} • Origem: ${lead.source}` : null,
        follow_up_count: lead.follow_up_count || 0,
        last_contact_at: lead.created_at,
        is_active: lead.ativo ?? true,
        // Campos extras para o drawer
        source: lead.source,
      };
    });
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

  /**
   * Busca performance dos agentes IA agrupando por agente_ia
   * Conta total de leads e respondidos (responded = true)
   */
  async getAgentPerformance(locationId?: string): Promise<AgentPerformance[]> {
    try {
      // Buscar apenas leads que têm agente_ia preenchido
      let query = supabase
        .from('n8n_schedule_tracking')
        .select('agente_ia, responded')
        .not('agente_ia', 'is', null);  // Filtrar apenas leads com agente

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar performance dos agentes:', error);
        return [];
      }

      // Agrupar por agente_ia
      const agentMap = new Map<string, { total: number; respondidos: number }>();

      for (const row of data || []) {
        const agentName = row.agente_ia || 'Sem Agente';
        
        if (!agentMap.has(agentName)) {
          agentMap.set(agentName, { total: 0, respondidos: 0 });
        }

        const agent = agentMap.get(agentName)!;
        agent.total++;
        if (row.responded === true) {
          agent.respondidos++;
        }
      }

      // Converter para array e calcular taxa de conversão
      const result: AgentPerformance[] = Array.from(agentMap.entries()).map(([agente_ia, stats]) => ({
        agente_ia,
        total_leads: stats.total,
        respondidos: stats.respondidos,
        taxa_conversao: stats.total > 0 
          ? Math.round((stats.respondidos / stats.total) * 10000) / 100 
          : 0,
      }));

      // Ordenar por taxa de conversão (maior primeiro)
      return result.sort((a, b) => b.taxa_conversao - a.taxa_conversao);
    } catch (err) {
      console.error('Erro ao buscar performance dos agentes:', err);
      return [];
    }
  },

  /**
   * Busca custo por etapa de follow-up
   * Cruza dados do n8n_schedule_tracking com llm_costs
   */
  async getCustoPorEtapa(locationId?: string): Promise<CustoPorEtapa[]> {
    try {
      // Primeiro, buscar contagem de leads por etapa
      let trackingQuery = supabase
        .from('n8n_schedule_tracking')
        .select('follow_up_count, location_id');

      if (locationId) {
        trackingQuery = trackingQuery.eq('location_id', locationId);
      }

      const { data: trackingData, error: trackingError } = await trackingQuery;

      if (trackingError) {
        console.error('Erro ao buscar tracking para custos:', trackingError);
        return [];
      }

      // Agrupar por etapa
      const etapaMap = new Map<number, number>();
      for (const row of trackingData || []) {
        const etapa = row.follow_up_count || 0;
        etapaMap.set(etapa, (etapaMap.get(etapa) || 0) + 1);
      }

      // Buscar custos totais
      let costQuery = supabase
        .from('llm_costs')
        .select('custo_usd, location_name');

      // Nota: llm_costs usa location_name, não location_id
      // Para filtrar por location, precisaríamos fazer join ou buscar o nome

      const { data: costData, error: costError } = await costQuery;

      if (costError) {
        console.error('Erro ao buscar custos:', costError);
        // Retornar dados sem custo
        return Array.from(etapaMap.entries()).map(([etapa, total_leads]) => ({
          etapa,
          custo_total_usd: 0,
          total_leads,
          custo_medio_por_lead: 0,
        })).sort((a, b) => a.etapa - b.etapa);
      }

      // Calcular custo total
      const custoTotal = (costData || []).reduce((sum, row) => sum + (row.custo_usd || 0), 0);
      const totalLeads = Array.from(etapaMap.values()).reduce((sum, count) => sum + count, 0);

      // Distribuir custo proporcionalmente por etapa
      // Lógica: leads em etapas maiores custaram mais (passaram por mais FUs)
      const result: CustoPorEtapa[] = [];
      let custoAcumulado = 0;

      for (const [etapa, count] of Array.from(etapaMap.entries()).sort((a, b) => a[0] - b[0])) {
        // Custo proporcional: etapas maiores = mais custo acumulado
        // Simplificação: custo médio * (etapa + 1) para refletir custo acumulado
        const pesoEtapa = etapa + 1;
        const custoEtapa = totalLeads > 0 
          ? (custoTotal * count * pesoEtapa) / (totalLeads * (Array.from(etapaMap.keys()).reduce((s, e) => s + e + 1, 0) / etapaMap.size))
          : 0;

        result.push({
          etapa,
          custo_total_usd: Math.round(custoEtapa * 100) / 100,
          total_leads: count,
          custo_medio_por_lead: count > 0 ? Math.round((custoEtapa / count) * 100) / 100 : 0,
        });
      }

      return result;
    } catch (err) {
      console.error('Erro ao buscar custo por etapa:', err);
      return [];
    }
  },

  /**
   * Busca leads por etapa e status específico
   * Inclui a última mensagem de follow-up enviada (da tabela n8n_historico_mensagens)
   */
  async getLeadsByEtapaStatus(
    etapa: number, 
    status: 'ativos' | 'respondidos' | 'desistentes',
    locationId?: string
  ): Promise<LeadDetail[]> {
    console.log('[getLeadsByEtapaStatus] START:', { etapa, status, locationId });
    try {
      let query = supabase
        .from('n8n_schedule_tracking')
        .select('unique_id, location_id, location_name, follow_up_count, ativo, responded, created_at, responded_at, first_name, source')
        .eq('follow_up_count', etapa)
        .order('created_at', { ascending: false })
        .limit(100);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      // Filtrar por status
      switch (status) {
        case 'ativos':
          // Ativos = ativo=true E (responded é null OU responded=false)
          query = query.eq('ativo', true).or('responded.is.null,responded.is.false');
          break;
        case 'respondidos':
          query = query.eq('responded', true);
          break;
        case 'desistentes':
          query = query.eq('ativo', false);
          break;
      }

      const { data, error } = await query;

      console.log('[getLeadsByEtapaStatus] query result:', { dataLength: data?.length, error });

      if (error) {
        console.error('Erro ao buscar leads por etapa/status:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('[getLeadsByEtapaStatus] No data found');
        return [];
      }

      // Buscar última mensagem de FU da tabela n8n_historico_mensagens
      const sessionIds = data.map((lead: any) => lead.unique_id).filter(Boolean);
      let messagesMap: Map<string, string> = new Map();

      if (sessionIds.length > 0) {
        try {
          // Buscar últimas mensagens do tipo 'ai' (follow-up enviado)
          // Usar filtro JSON no Supabase: message->>'type' = 'ai'
          const { data: messagesData } = await supabase
            .from('n8n_historico_mensagens')
            .select('session_id, message, created_at')
            .in('session_id', sessionIds)
            .filter('message->>type', 'eq', 'ai')
            .order('created_at', { ascending: false });

          if (messagesData) {
            // Agrupar por session_id e pegar a última mensagem (já filtrado por 'ai')
            for (const msg of messagesData) {
              if (!messagesMap.has(msg.session_id)) {
                const messageObj = msg.message as any;
                if (messageObj?.content) {
                  // O content pode ser string ou array de strings
                  const content = Array.isArray(messageObj.content) 
                    ? messageObj.content.join('\n\n') 
                    : messageObj.content;
                  messagesMap.set(msg.session_id, content);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Não foi possível buscar mensagens de histórico:', e);
        }
      }

      // Enriquecer com dados de contato
      const uniqueIds = data.map((lead: any) => parseInt(lead.unique_id, 10)).filter((id: number) => !isNaN(id));
      let contactsMap: Map<string, { name: string | null; phone: string | null }> = new Map();

      if (uniqueIds.length > 0) {
        try {
          const { data: contactsData } = await supabase
            .from('app_dash_principal')
            .select('id, contato_principal, celular_contato, telefone_comercial_contato')
            .in('id', uniqueIds);

          if (contactsData) {
            for (const contact of contactsData) {
              contactsMap.set(String(contact.id), {
                name: contact.contato_principal,
                phone: contact.celular_contato || contact.telefone_comercial_contato || null,
              });
            }
          }
        } catch (e) {
          console.warn('Não foi possível enriquecer com dados de contato');
        }
      }

      return data.map((lead: any) => {
        const contactInfo = contactsMap.get(lead.unique_id);
        const phone = contactInfo?.phone || null;
        const fuMessage = messagesMap.get(lead.unique_id);

        // Formatar telefone para exibição
        const formatPhoneForDisplay = (p: string | null): string | null => {
          if (!p) return null;
          const cleaned = p.replace(/\D/g, '');
          if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
          }
          if (cleaned.length >= 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
          }
          return p;
        };

        // Resolver nome: prioridade > app_dash nome > first_name > telefone > "Lead sem identificação"
        const resolveName = (): string => {
          if (contactInfo?.name && contactInfo.name.trim() && 
              contactInfo.name.toLowerCase() !== 'null' && 
              contactInfo.name.toLowerCase() !== 'sem nome') {
            return contactInfo.name.trim();
          }
          if (lead.first_name && lead.first_name.trim() && 
              lead.first_name.toLowerCase() !== 'null' &&
              lead.first_name.toLowerCase() !== 'sem nome') {
            return lead.first_name.trim();
          }
          const formattedPhone = formatPhoneForDisplay(phone);
          if (formattedPhone) {
            return formattedPhone;
          }
          return 'Lead sem identificação';
        };

        return {
          session_id: null,
          contact_id: lead.unique_id,
          contact_name: resolveName(),
          contact_phone: phone,
          location_id: lead.location_id,
          location_name: lead.location_name,
          // Mostrar a última mensagem de follow-up enviada
          last_message: fuMessage || `Follow-up ${etapa} enviado (mensagem não disponível)`,
          follow_up_count: lead.follow_up_count || 0,
          last_contact_at: lead.responded_at || lead.created_at,
          is_active: lead.ativo ?? true,
          source: lead.source,
        };
      });
    } catch (err) {
      console.error('Erro ao buscar leads por etapa/status:', err);
      return [];
    }
  },
};

// ============================================
// BATCH UPDATE TYPES
// ============================================

export interface LeadBatchUpdate {
  ativo?: boolean;
  responded?: boolean;
  follow_up_count?: number;
  // Adicionar campos conforme necessidade
}

export interface BatchUpdateResult {
  success: boolean;
  updated: number;
  error?: string;
}

/**
 * Atualiza múltiplos leads em batch
 * @param contactIds - Array de unique_ids dos leads
 * @param updates - Objeto com os campos a atualizar
 */
export async function updateLeadsBatch(
  contactIds: string[],
  updates: LeadBatchUpdate
): Promise<BatchUpdateResult> {
  if (!contactIds || contactIds.length === 0) {
    return { success: false, updated: 0, error: 'Nenhum lead selecionado' };
  }

  try {
    const { data, error } = await supabase
      .from('n8n_schedule_tracking')
      .update({
        ...updates,
        // Nota: tabela não tem updated_at, timestamps são via trigger do banco
      })
      .in('unique_id', contactIds)
      .select('unique_id');

    if (error) {
      console.error('Erro ao atualizar leads em batch:', error);
      return { success: false, updated: 0, error: error.message };
    }

    return { success: true, updated: data?.length || 0 };
  } catch (err) {
    console.error('Erro ao atualizar leads em batch:', err);
    return { 
      success: false, 
      updated: 0, 
      error: err instanceof Error ? err.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Agenda follow-up para múltiplos leads
 * Cria registros na fuu_queue
 */
export async function scheduleFollowUpBatch(
  contactIds: string[],
  locationId: string | null
): Promise<BatchUpdateResult> {
  if (!contactIds || contactIds.length === 0) {
    return { success: false, updated: 0, error: 'Nenhum lead selecionado' };
  }

  try {
    // Primeiro buscar os dados dos leads para ter as infos necessárias
    const { data: leads, error: fetchError } = await supabase
      .from('n8n_schedule_tracking')
      .select('unique_id, location_id, first_name')
      .in('unique_id', contactIds);

    if (fetchError) {
      console.error('Erro ao buscar leads para agendar FU:', fetchError);
      return { success: false, updated: 0, error: fetchError.message };
    }

    if (!leads || leads.length === 0) {
      return { success: false, updated: 0, error: 'Nenhum lead encontrado' };
    }

    // Criar registros na fuu_queue
    const queueRecords = leads.map(lead => {
      // Resolver nome: first_name ou fallback
      const resolveName = (): string => {
        if (lead.first_name && lead.first_name.trim() && 
            lead.first_name.toLowerCase() !== 'null' &&
            lead.first_name.toLowerCase() !== 'sem nome') {
          return lead.first_name.trim();
        }
        return 'Lead sem identificação';
      };
      
      return {
        contact_id: lead.unique_id,
        contact_name: resolveName(),
        location_id: lead.location_id,
        status: 'scheduled',
        scheduled_at: new Date().toISOString(),
        follow_up_type: 'manual_batch',
        created_at: new Date().toISOString(),
      };
    });

    const { data: insertData, error: insertError } = await supabase
      .from('fuu_queue')
      .insert(queueRecords)
      .select('contact_id');

    if (insertError) {
      console.error('Erro ao agendar FU em batch:', insertError);
      return { success: false, updated: 0, error: insertError.message };
    }

    return { success: true, updated: insertData?.length || 0 };
  } catch (err) {
    console.error('Erro ao agendar FU em batch:', err);
    return { 
      success: false, 
      updated: 0, 
      error: err instanceof Error ? err.message : 'Erro desconhecido' 
    };
  }
}

// ============================================
// CONVERSATION MESSAGE TYPES
// ============================================

export interface ConversationMessage {
  id: string;
  session_id: string;
  message: {
    type: 'human' | 'ai';
    content: string;
  };
  created_at: string;
}

/**
 * Busca mensagens de uma conversa pelo session_id (unique_id do lead)
 */
export async function getConversationMessages(sessionId: string): Promise<ConversationMessage[]> {
  if (!sessionId) return [];

  try {
    const { data, error } = await supabase
      .from('n8n_historico_mensagens')
      .select('id, session_id, message, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }

    return (data || []).map(msg => ({
      id: msg.id,
      session_id: msg.session_id,
      message: msg.message as { type: 'human' | 'ai'; content: string },
      created_at: msg.created_at,
    }));
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return [];
  }
}

export default salesOpsDAO;
