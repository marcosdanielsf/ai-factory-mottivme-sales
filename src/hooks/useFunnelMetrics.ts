import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useFunnelMetrics
// Consome as views SQL criadas para o dashboard:
// - dashboard_funnel
// - dashboard_alertas_urgentes
// - dashboard_followup_performance
// - dashboard_resumo_diario
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

export const useFunnelMetrics = (period: Period = '30d') => {
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

      // Buscar dados em paralelo
      const [funnelResult, alertsResult, followupResult] = await Promise.all([
        // 1. Funil de conversão
        supabase
          .from('dashboard_funnel')
          .select('*')
          .gte('data', startDate.toISOString()),

        // 2. Alertas urgentes
        supabase
          .from('dashboard_alertas_urgentes')
          .select('*'),

        // 3. Performance follow-up
        supabase
          .from('dashboard_followup_performance')
          .select('*')
      ]);

      // Processar funil
      const funnelData = processFunnelData(funnelResult.data || []);

      // Processar alertas
      const alertsData = processAlertsData(alertsResult.data || []);

      // Processar performance e engagement
      const { performance, engagement } = processFollowupData(followupResult.data || []);

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
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...state,
    refetch: fetchMetrics
  };
};

// ============================================================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================================================

function processFunnelData(rawData: any[]): FunnelStage[] {
  if (!rawData || rawData.length === 0) {
    return [
      { stage: 'Leads Novos', count: 0, color: '#3b82f6' },
      { stage: 'Responderam', count: 0, color: '#6366f1' },
      { stage: 'Agendaram', count: 0, color: '#8b5cf6' },
      { stage: 'Compareceram', count: 0, color: '#a855f7' },
      { stage: 'Fecharam', count: 0, color: '#22c55e' }
    ];
  }

  // Agregar todos os registros
  const totals = rawData.reduce((acc, row) => ({
    leads_novos: acc.leads_novos + (row.leads_novos || 0),
    responderam: acc.responderam + (row.responderam || 0),
    agendaram: acc.agendaram + (row.agendaram || 0),
    compareceram: acc.compareceram + (row.compareceram || 0),
    fecharam: acc.fecharam + (row.fecharam || 0)
  }), { leads_novos: 0, responderam: 0, agendaram: 0, compareceram: 0, fecharam: 0 });

  return [
    { stage: 'Leads Novos', count: totals.leads_novos, color: '#3b82f6' },
    { stage: 'Responderam', count: totals.responderam, color: '#6366f1' },
    { stage: 'Agendaram', count: totals.agendaram, color: '#8b5cf6' },
    { stage: 'Compareceram', count: totals.compareceram, color: '#a855f7' },
    { stage: 'Fecharam', count: totals.fecharam, color: '#22c55e' }
  ];
}

function processAlertsData(rawData: any[]): UrgentAlerts {
  if (!rawData || rawData.length === 0) {
    return {
      leadsSemResposta24h: 0,
      followupsFalhados: 0,
      leadsEsfriando: 0,
      noShows: 0
    };
  }

  // Agregar alertas de todas as locations
  return rawData.reduce((acc, row) => ({
    leadsSemResposta24h: acc.leadsSemResposta24h + (row.leads_sem_resposta_24h || 0),
    followupsFalhados: acc.followupsFalhados + (row.followups_falhados || 0),
    leadsEsfriando: acc.leadsEsfriando + (row.leads_esfriando || 0),
    noShows: acc.noShows + (row.no_shows || 0)
  }), {
    leadsSemResposta24h: 0,
    followupsFalhados: 0,
    leadsEsfriando: 0,
    noShows: 0
  });
}

function processFollowupData(rawData: any[]): {
  performance: FollowupPerformance[],
  engagement: EngagementMetrics
} {
  if (!rawData || rawData.length === 0) {
    return {
      performance: [],
      engagement: {
        followupsPerLead: 0,
        tentativaQueConverte: '-',
        taxaResposta: 0,
        tempoAteResposta: '-'
      }
    };
  }

  const performance: FollowupPerformance[] = rawData.map(row => ({
    locationId: row.location_id,
    followUpType: row.follow_up_type,
    totalFollowups: row.total_followups || 0,
    pendentes: row.pendentes || 0,
    responderam: row.responderam || 0,
    taxaResposta: row.taxa_resposta || 0,
    mediaTentativasResposta: row.media_tentativas_resposta || 0,
    mediaHorasResposta: row.media_horas_resposta || 0
  }));

  // Calcular métricas de engagement agregadas
  const totals = rawData.reduce((acc, row) => ({
    totalFollowups: acc.totalFollowups + (row.total_followups || 0),
    responderam: acc.responderam + (row.responderam || 0),
    mediaTentativas: acc.mediaTentativas + (row.media_tentativas_resposta || 0),
    mediaHoras: acc.mediaHoras + (row.media_horas_resposta || 0),
    count: acc.count + 1
  }), { totalFollowups: 0, responderam: 0, mediaTentativas: 0, mediaHoras: 0, count: 0 });

  const mediaTentativas = totals.count > 0
    ? (totals.mediaTentativas / totals.count).toFixed(1)
    : '-';
  const mediaHoras = totals.count > 0
    ? (totals.mediaHoras / totals.count).toFixed(1)
    : '-';
  const taxaResposta = totals.totalFollowups > 0
    ? Math.round((totals.responderam / totals.totalFollowups) * 100)
    : 0;

  return {
    performance,
    engagement: {
      followupsPerLead: totals.responderam > 0
        ? Math.round(totals.totalFollowups / totals.responderam * 10) / 10
        : 0,
      tentativaQueConverte: mediaTentativas !== '-' ? `${mediaTentativas}º` : '-',
      taxaResposta,
      tempoAteResposta: mediaHoras !== '-' ? `${mediaHoras}h` : '-'
    }
  };
}

export default useFunnelMetrics;
