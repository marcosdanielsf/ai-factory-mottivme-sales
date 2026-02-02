import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrigem } from './useAgendamentos';

export interface AgendamentoStats {
  hoje: number;
  semana: number;
  mes: number;
  taxaComparecimento: number; // percentual
  taxaConversao: number; // percentual (agendados / total leads)
  totalLeads: number;
  totalAgendados: number;
  totalCompleted: number;
  totalNoShow: number;
  totalBooked: number;
}

export interface AgendamentosPorDia {
  data: string; // YYYY-MM-DD
  quantidade: number;
}

export interface AgendamentosPorOrigem {
  origem: 'trafego' | 'social_selling';
  quantidade: number;
}

interface UseAgendamentosStatsReturn {
  stats: AgendamentoStats;
  porDia: AgendamentosPorDia[];
  porOrigem: AgendamentosPorOrigem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAgendamentosStats = (
  locationId?: string | null,
  periodDays: number = 30
): UseAgendamentosStatsReturn => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query 1: Agendamentos (com scheduled_at)
      let agendamentosQuery = supabase
        .from('app_dash_principal')
        .select('scheduled_at, status, fonte_do_lead_bposs, location_id')
        .not('scheduled_at', 'is', null);

      if (locationId) {
        agendamentosQuery = agendamentosQuery.eq('location_id', locationId);
      }

      // Query 2: Total de leads (para calcular taxa de conversão)
      let leadsCountQuery = supabase
        .from('app_dash_principal')
        .select('id', { count: 'exact', head: true });

      if (locationId) {
        leadsCountQuery = leadsCountQuery.eq('location_id', locationId);
      }

      // Executar ambas queries em paralelo
      const [agendamentosResult, leadsCountResult] = await Promise.all([
        agendamentosQuery,
        leadsCountQuery,
      ]);

      if (agendamentosResult.error) {
        console.error('Error fetching agendamentos:', agendamentosResult.error);
        throw agendamentosResult.error;
      }

      if (leadsCountResult.error) {
        console.error('Error fetching leads count:', leadsCountResult.error);
        // Não lançar erro, apenas logar - total leads é secundário
      }

      setRawData(agendamentosResult.data || []);
      setTotalLeads(leadsCountResult.count || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
      console.error('Error fetching agendamentos stats:', err);
    } finally {
      setLoading(false);
    }
  }, [locationId, periodDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcular estatísticas a partir dos dados brutos
  const { stats, porDia, porOrigem } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);

    let hoje = 0;
    let semana = 0;
    let mes = 0;
    let totalCompleted = 0;
    let totalNoShow = 0;
    let totalBooked = 0;
    let trafegoCount = 0;
    let socialSellingCount = 0;

    const porDiaMap: Record<string, number> = {};

    // Inicializar últimos 30 dias com 0
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      porDiaMap[dateKey] = 0;
    }

    rawData.forEach((item) => {
      const scheduledAt = new Date(item.scheduled_at);
      const dateKey = scheduledAt.toISOString().split('T')[0];

      // Contagem por dia
      if (porDiaMap[dateKey] !== undefined) {
        porDiaMap[dateKey]++;
      }

      // Contagem por período
      if (scheduledAt >= todayStart && scheduledAt <= todayEnd) {
        hoje++;
      }
      if (scheduledAt >= weekStart) {
        semana++;
      }
      if (scheduledAt >= monthStart) {
        mes++;
      }

      // Contagem por status
      const statusVal = item.status?.toLowerCase();
      if (statusVal === 'completed') {
        totalCompleted++;
      } else if (statusVal === 'no_show') {
        totalNoShow++;
      } else if (statusVal === 'booked') {
        totalBooked++;
      }

      // Contagem por origem
      const origem = getOrigem(item.fonte_do_lead_bposs);
      if (origem === 'trafego') {
        trafegoCount++;
      } else if (origem === 'social_selling') {
        socialSellingCount++;
      }
    });

    // Total de agendados
    const totalAgendados = rawData.length;

    // Taxa de comparecimento (compareceu / (compareceu + não compareceu))
    const totalWithStatus = totalCompleted + totalNoShow;
    const taxaComparecimento = totalWithStatus > 0 
      ? Math.round((totalCompleted / totalWithStatus) * 100) 
      : 0;

    // Taxa de conversão (agendados / total leads)
    const taxaConversao = totalLeads > 0 
      ? Math.round((totalAgendados / totalLeads) * 100) 
      : 0;

    // Converter mapa para array ordenado por data
    const porDiaArr: AgendamentosPorDia[] = Object.entries(porDiaMap)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));

    const porOrigemArr: AgendamentosPorOrigem[] = [
      { origem: 'trafego', quantidade: trafegoCount },
      { origem: 'social_selling', quantidade: socialSellingCount },
    ];

    return {
      stats: {
        hoje,
        semana,
        mes,
        taxaComparecimento,
        taxaConversao,
        totalLeads,
        totalAgendados,
        totalCompleted,
        totalNoShow,
        totalBooked,
      },
      porDia: porDiaArr,
      porOrigem: porOrigemArr,
    };
  }, [rawData, totalLeads]);

  return { stats, porDia, porOrigem, loading, error, refetch: fetchData };
};

export default useAgendamentosStats;
