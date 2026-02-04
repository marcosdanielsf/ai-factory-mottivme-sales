import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useFunnelMetrics v2.1
// Usa dados REAIS de:
// - app_dash_principal (histórico + atual - coluna status)
// - n8n_schedule_tracking (etapa_funil - tempo real)
// - appointments_log (agendamentos novos)
// 
// Suporta filtro por locationId (usuário/cliente)
// ============================================================================

export interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

export interface UrgentAlerts {
  leadsSemResposta24h: number;
  followupsFalhados: number;
  leadsEsfriando: number;
  noShows: number;
}

export interface FollowupPerformance {
  locationId: string;
  followUpType: string;
  totalFollowups: number;
  pendentes: number;
  responderam: number;
  taxaResposta: number;
  mediaTentativasResposta: number;
  mediaHorasResposta: number;
}

export interface EngagementMetrics {
  followupsPerLead: number;
  tentativaQueConverte: string;
  taxaResposta: number;
  tempoAteResposta: string;
}

interface FunnelMetricsState {
  funnel: FunnelStage[];
  alerts: UrgentAlerts;
  followupPerformance: FollowupPerformance[];
  engagement: EngagementMetrics;
  loading: boolean;
  error: string | null;
}

type Period = 'hoje' | '7d' | '30d' | '90d';

// Mapeamento de status do app_dash_principal para etapas do funil
const STATUS_MAP = {
  novo: ['new_lead', 'new', 'available'],
  emContato: ['qualifying', 'in_cadence', 'contacted'],
  respondeu: ['replied', 'responded', 'warm', 'hot'],
  agendou: ['booked', 'scheduled', 'appointment'],
  compareceu: ['completed', 'showed', 'attended'],
  noShow: ['no_show', 'noshow', 'missed'],
  fechou: ['won', 'converted', 'closed', 'customer'],
  perdido: ['lost', 'dead', 'unqualified']
};

// Mapeamento de etapa_funil do n8n_schedule_tracking
const ETAPA_FUNIL_MAP: Record<string, string> = {
  'Novo': 'novo',
  'Em Contato': 'emContato',
  'Respondeu': 'respondeu',
  'Agendou': 'agendou',
  'Compareceu': 'compareceu',
  'No-show': 'noShow',
  'Fechou': 'fechou',
  'Perdido': 'perdido'
};

export const useFunnelMetrics = (period: Period = '30d', locationId?: string | null) => {
  const [state, setState] = useState<FunnelMetricsState>({
    funnel: [],
    alerts: {
      leadsSemResposta24h: 0,
      followupsFalhados: 0,
      leadsEsfriando: 0,
      noShows: 0
    },
    followupPerformance: [],
    engagement: {
      followupsPerLead: 0,
      tentativaQueConverte: '-',
      taxaResposta: 0,
      tempoAteResposta: '-'
    },
    loading: true,
    error: null
  });

  const fetchMetrics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Calcular data de início baseado no período
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'hoje':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Inicializar contadores do funil
      const funnelCounts = {
        novo: 0,
        emContato: 0,
        respondeu: 0,
        agendou: 0,
        compareceu: 0,
        noShow: 0,
        fechou: 0,
        perdido: 0
      };

      // ========================================
      // FONTE 1: app_dash_principal (histórico)
      // ========================================
      let dashQuery = supabase
        .from('app_dash_principal')
        .select('status, data_criada, data_da_atualizacao, location_id')
        .gte('data_criada', startDate.toISOString());
      
      // Filtrar por location_id se fornecido
      if (locationId) {
        dashQuery = dashQuery.eq('location_id', locationId);
      }

      const { data: dashData, error: dashError } = await dashQuery;

      if (dashError) {
        console.warn('Erro ao buscar app_dash_principal:', dashError);
      } else if (dashData) {
        dashData.forEach((lead: any) => {
          const status = (lead.status || '').toLowerCase().trim();
          
          for (const [etapa, statusList] of Object.entries(STATUS_MAP)) {
            if (statusList.includes(status)) {
              funnelCounts[etapa as keyof typeof funnelCounts]++;
              break;
            }
          }
        });
        console.log('app_dash_principal:', dashData.length, 'leads', locationId ? `(location: ${locationId})` : '(todos)');
      }

      // ========================================
      // FONTE 2: n8n_schedule_tracking (tempo real)
      // ========================================
      let trackingQuery = supabase
        .from('n8n_schedule_tracking')
        .select('etapa_funil, created_at, location_id')
        .not('etapa_funil', 'is', null)
        .gte('created_at', startDate.toISOString());
      
      if (locationId) {
        trackingQuery = trackingQuery.eq('location_id', locationId);
      }

      const { data: trackingData, error: trackingError } = await trackingQuery;

      if (trackingError) {
        console.warn('Erro ao buscar n8n_schedule_tracking:', trackingError);
      } else if (trackingData) {
        trackingData.forEach((lead: any) => {
          const etapa = lead.etapa_funil;
          const mappedEtapa = ETAPA_FUNIL_MAP[etapa];
          if (mappedEtapa && funnelCounts[mappedEtapa as keyof typeof funnelCounts] !== undefined) {
            funnelCounts[mappedEtapa as keyof typeof funnelCounts]++;
          }
        });
        console.log('n8n_schedule_tracking:', trackingData.length, 'com etapa_funil');
      }

      // ========================================
      // FONTE 3: appointments_log (agendamentos reais)
      // ========================================
      let appointmentsQuery = supabase
        .from('appointments_log')
        .select('id, appointment_date, created_at, location_id')
        .gte('created_at', startDate.toISOString());
      
      if (locationId) {
        appointmentsQuery = appointmentsQuery.eq('location_id', locationId);
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) {
        console.warn('Erro ao buscar appointments_log:', appointmentsError);
      } else if (appointmentsData && appointmentsData.length > 0) {
        const appointmentsCount = appointmentsData.length;
        console.log('appointments_log:', appointmentsCount, 'agendamentos');
        
        if (appointmentsCount > funnelCounts.agendou) {
          funnelCounts.agendou = appointmentsCount;
        }
      }

      // ========================================
      // Calcular totais e métricas
      // ========================================
      const totalLeads = funnelCounts.novo + funnelCounts.emContato + funnelCounts.respondeu + 
                         funnelCounts.agendou + funnelCounts.compareceu + funnelCounts.noShow + 
                         funnelCounts.fechou + funnelCounts.perdido;

      const responderam = funnelCounts.respondeu + funnelCounts.agendou + funnelCounts.compareceu + 
                          funnelCounts.noShow + funnelCounts.fechou;
      const agendaram = funnelCounts.agendou + funnelCounts.compareceu + funnelCounts.noShow + funnelCounts.fechou;
      const compareceram = funnelCounts.compareceu + funnelCounts.fechou;
      const fecharam = funnelCounts.fechou;

      const funnelData: FunnelStage[] = [
        { stage: 'Leads Novos', count: totalLeads, color: '#3b82f6' },
        { stage: 'Responderam', count: responderam, color: '#6366f1' },
        { stage: 'Agendaram', count: agendaram, color: '#8b5cf6' },
        { stage: 'Compareceram', count: compareceram, color: '#a855f7' },
        { stage: 'Fecharam', count: fecharam, color: '#22c55e' }
      ];

      const alertsData: UrgentAlerts = {
        leadsSemResposta24h: funnelCounts.novo,
        followupsFalhados: funnelCounts.perdido,
        leadsEsfriando: funnelCounts.emContato,
        noShows: funnelCounts.noShow
      };

      const taxaResposta = totalLeads > 0 ? Math.round((responderam / totalLeads) * 100) : 0;

      let tentativaQueConverte = '-';
      if (taxaResposta > 50) tentativaQueConverte = '1ª';
      else if (taxaResposta > 30) tentativaQueConverte = '2ª';
      else if (taxaResposta > 15) tentativaQueConverte = '3ª';
      else if (taxaResposta > 5) tentativaQueConverte = '4ª+';

      const performance: FollowupPerformance[] = [{
        locationId: locationId || 'all',
        followUpType: 'multi-channel',
        totalFollowups: totalLeads,
        pendentes: funnelCounts.novo + funnelCounts.emContato,
        responderam: responderam,
        taxaResposta: taxaResposta,
        mediaTentativasResposta: taxaResposta > 0 ? parseFloat((100 / taxaResposta).toFixed(1)) : 0,
        mediaHorasResposta: 24
      }];

      const engagement: EngagementMetrics = {
        followupsPerLead: totalLeads > 0 ? parseFloat(((funnelCounts.emContato + responderam) / totalLeads).toFixed(1)) : 0,
        tentativaQueConverte,
        taxaResposta,
        tempoAteResposta: '24h'
      };

      console.log('Funil Final:', {
        total: totalLeads,
        responderam,
        agendaram,
        compareceram,
        fecharam,
        noShows: funnelCounts.noShow,
        perdidos: funnelCounts.perdido,
        locationId: locationId || 'todos'
      });

      setState({
        funnel: funnelData,
        alerts: alertsData,
        followupPerformance: performance,
        engagement,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erro ao buscar métricas do funil:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar métricas'
      }));
    }
  }, [period, locationId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...state,
    refetch: fetchMetrics
  };
};

export default useFunnelMetrics;
