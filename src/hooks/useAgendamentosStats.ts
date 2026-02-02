import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrigem } from './useAgendamentos';

export interface AgendamentoStats {
  hoje: number;
  semana: number;
  mes: number;
  taxaComparecimento: number;
  taxaConversao: number;
  totalLeads: number;
  totalAgendados: number;
  totalCompleted: number;
  totalNoShow: number;
  totalBooked: number;
}

export interface AgendamentosPorDia {
  data: string;
  quantidade: number;
}

export interface AgendamentosPorOrigem {
  origem: 'trafego' | 'social_selling';
  quantidade: number;
}

export interface ResponsavelInfo {
  name: string;
  count: number;
}

interface UseAgendamentosStatsReturn {
  stats: AgendamentoStats;
  porDia: AgendamentosPorDia[];
  porOrigem: AgendamentosPorOrigem[];
  responsaveis: ResponsavelInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Usa a VIEW unificada que combina histórico + realtime
const AGENDAMENTOS_VIEW = 'vw_agendamentos_unified';

export const useAgendamentosStats = (
  responsavel?: string | null,
  periodDays: number = 30
): UseAgendamentosStatsReturn => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [responsaveis, setResponsaveis] = useState<ResponsavelInfo[]>([]);
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

      // Calcular data de início do período
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      startDate.setHours(0, 0, 0, 0);

      // Query 1: Agendamentos da VIEW unificada (com filtro de período)
      let agendamentosQuery = supabase
        .from(AGENDAMENTOS_VIEW)
        .select('agendamento_data, status, fonte, responsavel_nome')
        .gte('agendamento_data', startDate.toISOString());

      if (responsavel) {
        agendamentosQuery = agendamentosQuery.eq('responsavel_nome', responsavel);
      }

      // Query 2: Total de leads no período (para taxa de conversão)
      let leadsCountQuery = supabase
        .from('app_dash_principal')
        .select('id', { count: 'exact', head: true })
        .gte('data_criada', startDate.toISOString());

      if (responsavel) {
        leadsCountQuery = leadsCountQuery.eq('lead_usuario_responsavel', responsavel);
      }

      // Query 3: Lista de responsáveis únicos (de todos os agendamentos na VIEW)
      const responsaveisQuery = supabase
        .from(AGENDAMENTOS_VIEW)
        .select('responsavel_nome')
        .not('responsavel_nome', 'is', null);

      // Executar queries em paralelo
      const [agendamentosResult, leadsCountResult, responsaveisResult] = await Promise.all([
        agendamentosQuery,
        leadsCountQuery,
        responsaveisQuery,
      ]);

      if (agendamentosResult.error) {
        console.error('Error fetching agendamentos:', agendamentosResult.error);
        throw agendamentosResult.error;
      }

      if (leadsCountResult.error) {
        console.error('Error fetching leads count:', leadsCountResult.error);
      }

      setRawData(agendamentosResult.data || []);
      setTotalLeads(leadsCountResult.count || 0);

      // Processar responsáveis únicos com contagem
      if (responsaveisResult.data) {
        const countMap: Record<string, number> = {};
        for (const row of responsaveisResult.data) {
          const name = row.responsavel_nome;
          if (name && name !== 'unknown') {
            countMap[name] = (countMap[name] || 0) + 1;
          }
        }
        const responsaveisList = Object.entries(countMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        setResponsaveis(responsaveisList);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
      console.error('Error fetching agendamentos stats:', err);
    } finally {
      setLoading(false);
    }
  }, [responsavel, periodDays]);

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
      const dateValue = item.agendamento_data;
      if (!dateValue) return;

      const scheduledAt = new Date(dateValue);
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
      if (statusVal === 'completed' || statusVal === 'won') {
        totalCompleted++;
      } else if (statusVal === 'no_show' || statusVal === 'lost') {
        totalNoShow++;
      } else if (statusVal === 'booked') {
        totalBooked++;
      }

      // Contagem por origem
      const origem = getOrigem(item.fonte);
      if (origem === 'trafego') {
        trafegoCount++;
      } else if (origem === 'social_selling') {
        socialSellingCount++;
      }
    });

    // Total de agendados no período
    const totalAgendados = rawData.length;

    // Taxa de comparecimento
    const totalWithStatus = totalCompleted + totalNoShow;
    const taxaComparecimento = totalWithStatus > 0 
      ? Math.round((totalCompleted / totalWithStatus) * 100) 
      : 0;

    // Taxa de conversão
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

  return { stats, porDia, porOrigem, responsaveis, loading, error, refetch: fetchData };
};

export default useAgendamentosStats;
