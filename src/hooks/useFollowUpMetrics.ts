import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface FollowUpEvent {
  id: string;
  lead_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  event_type: 'sent' | 'delivered' | 'read' | 'replied' | 'error' | 'pending';
  status: 'success' | 'failed' | 'pending';
  message_preview: string | null;
  error_message: string | null;
  follow_up_number: number;
  created_at: string;
  scheduled_for: string | null;
}

export interface FollowUpMetrics {
  totalSent: number;
  totalReplied: number;
  totalErrors: number;
  totalPending: number;
  responseRate: number;
  avgFollowUpsPerLead: number;
}

export interface FollowUpDashboardData {
  lead_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  total_followups: number;
  last_followup_at: string | null;
  response_received: boolean;
  current_status: string;
}

interface UseFollowUpMetricsReturn {
  metrics: FollowUpMetrics;
  events: FollowUpEvent[];
  dashboardData: FollowUpDashboardData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';
type PeriodFilter = 'today' | '7d' | '30d' | '90d';

interface UseFollowUpMetricsParams {
  statusFilter?: StatusFilter;
  periodFilter?: PeriodFilter;
  searchTerm?: string;
}

export const useFollowUpMetrics = (params: UseFollowUpMetricsParams = {}): UseFollowUpMetricsReturn => {
  const { statusFilter = 'all', periodFilter = '30d', searchTerm = '' } = params;

  const [metrics, setMetrics] = useState<FollowUpMetrics>({
    totalSent: 0,
    totalReplied: 0,
    totalErrors: 0,
    totalPending: 0,
    responseRate: 0,
    avgFollowUpsPerLead: 0,
  });
  const [events, setEvents] = useState<FollowUpEvent[]>([]);
  const [dashboardData, setDashboardData] = useState<FollowUpDashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateFilter = useCallback((period: PeriodFilter): string => {
    const now = new Date();
    switch (period) {
      case 'today':
        now.setHours(0, 0, 0, 0);
        return now.toISOString();
      case '7d':
        now.setDate(now.getDate() - 7);
        return now.toISOString();
      case '30d':
        now.setDate(now.getDate() - 30);
        return now.toISOString();
      case '90d':
        now.setDate(now.getDate() - 90);
        return now.toISOString();
      default:
        now.setDate(now.getDate() - 30);
        return now.toISOString();
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Dados mock para desenvolvimento
      setMetrics({
        totalSent: 1247,
        totalReplied: 423,
        totalErrors: 23,
        totalPending: 156,
        responseRate: 33.9,
        avgFollowUpsPerLead: 3.2,
      });
      
      setEvents([
        {
          id: '1',
          lead_id: 'lead-1',
          lead_name: 'João Silva',
          lead_phone: '+5511999887766',
          event_type: 'sent',
          status: 'success',
          message_preview: 'Oi João! Vi que você se interessou pelo nosso produto...',
          error_message: null,
          follow_up_number: 1,
          created_at: new Date().toISOString(),
          scheduled_for: null,
        },
        {
          id: '2',
          lead_id: 'lead-2',
          lead_name: 'Maria Santos',
          lead_phone: '+5511988776655',
          event_type: 'replied',
          status: 'success',
          message_preview: 'Maria, tudo bem? Passando para saber se conseguiu ver...',
          error_message: null,
          follow_up_number: 2,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          scheduled_for: null,
        },
        {
          id: '3',
          lead_id: 'lead-3',
          lead_name: 'Pedro Costa',
          lead_phone: '+5511977665544',
          event_type: 'error',
          status: 'failed',
          message_preview: 'Olá Pedro! Estou entrando em contato...',
          error_message: 'Número não existe no WhatsApp',
          follow_up_number: 1,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          scheduled_for: null,
        },
        {
          id: '4',
          lead_id: 'lead-4',
          lead_name: 'Ana Oliveira',
          lead_phone: '+5511966554433',
          event_type: 'pending',
          status: 'pending',
          message_preview: 'Bom dia Ana! Agendado para envio...',
          error_message: null,
          follow_up_number: 3,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          scheduled_for: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);

      setDashboardData([
        {
          lead_id: 'lead-1',
          lead_name: 'João Silva',
          lead_phone: '+5511999887766',
          total_followups: 3,
          last_followup_at: new Date().toISOString(),
          response_received: false,
          current_status: 'aguardando_resposta',
        },
      ]);

      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateFilter = getDateFilter(periodFilter);

      // Buscar eventos de follow-up
      let eventsQuery = supabase
        .from('fuu_events')
        .select('*')
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        eventsQuery = eventsQuery.eq('status', statusFilter);
      }

      if (searchTerm) {
        eventsQuery = eventsQuery.or(`lead_name.ilike.%${searchTerm}%,lead_phone.ilike.%${searchTerm}%`);
      }

      const { data: eventsData, error: eventsError } = await eventsQuery;

      if (eventsError) {
        console.warn('Tabela fuu_events não existe ou erro:', eventsError.message);
        // Continuar sem eventos - pode ser que a tabela ainda não exista
      }

      // Buscar dados do dashboard (view)
      const { data: dashboardResult, error: dashboardError } = await supabase
        .from('vw_fuu_dashboard')
        .select('*')
        .limit(100);

      if (dashboardError) {
        console.warn('View vw_fuu_dashboard não existe ou erro:', dashboardError.message);
      }

      // Calcular métricas
      const fetchedEvents = eventsData || [];
      const totalSent = fetchedEvents.filter((e: FollowUpEvent) => e.event_type === 'sent' || e.event_type === 'delivered').length;
      const totalReplied = fetchedEvents.filter((e: FollowUpEvent) => e.event_type === 'replied').length;
      const totalErrors = fetchedEvents.filter((e: FollowUpEvent) => e.status === 'failed').length;
      const totalPending = fetchedEvents.filter((e: FollowUpEvent) => e.status === 'pending').length;
      const responseRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

      // Calcular média de follow-ups por lead
      const uniqueLeads = new Set(fetchedEvents.map((e: FollowUpEvent) => e.lead_id)).size;
      const avgFollowUpsPerLead = uniqueLeads > 0 ? fetchedEvents.length / uniqueLeads : 0;

      setMetrics({
        totalSent,
        totalReplied,
        totalErrors,
        totalPending,
        responseRate: Math.round(responseRate * 10) / 10,
        avgFollowUpsPerLead: Math.round(avgFollowUpsPerLead * 10) / 10,
      });

      setEvents(fetchedEvents as FollowUpEvent[]);
      setDashboardData((dashboardResult || []) as FollowUpDashboardData[]);

    } catch (err) {
      console.error('Erro ao buscar métricas de follow-up:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter, searchTerm, getDateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    metrics,
    events,
    dashboardData,
    loading,
    error,
    refetch: fetchData,
  };
};
