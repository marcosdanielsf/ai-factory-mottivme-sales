import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrigem } from './useAgendamentos';

export interface AgendamentoStats {
  hoje: number;
  semana: number;
  mes: number;
  taxaComparecimento: number;
  taxaConversao: number;
  taxaNoShow: number;
  totalLeads: number;
  totalAgendados: number;
  totalCompleted: number;
  totalNoShow: number;
  totalBooked: number;
  totalPendingFeedback: number; // Reunião já aconteceu mas sem feedback
}

export interface AgendamentosPorDia {
  data: string;
  quantidade: number;
  leads?: number; // Leads criados no mesmo dia (para gráfico de criação)
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
  porDia: AgendamentosPorDia[]; // Agendamentos PARA o dia (data do agendamento)
  porDiaCriacao: AgendamentosPorDia[]; // Agendamentos CRIADOS no dia + leads
  porOrigem: AgendamentosPorOrigem[];
  responsaveis: ResponsavelInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Usa a VIEW unificada que combina histórico + realtime
const AGENDAMENTOS_VIEW = 'vw_agendamentos_unified';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export const useAgendamentosStats = (
  responsavel?: string | null,
  dateRange?: DateRange | null
): UseAgendamentosStatsReturn => {
  const [agendamentosCriados, setAgendamentosCriados] = useState<any[]>([]); // Por data_criacao
  const [agendamentosPara, setAgendamentosPara] = useState<any[]>([]); // Por agendamento_data
  const [leadsData, setLeadsData] = useState<any[]>([]); // Leads com data_criada
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

      // Calcular datas do período
      const startDate = dateRange?.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
      
      const endDate = dateRange?.endDate || (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
      })();

      // Query 1: Agendamentos por DATA DE CRIAÇÃO (para gráfico "Criados no dia")
      let agendamentosCriadosQuery = supabase
        .from(AGENDAMENTOS_VIEW)
        .select('data_criacao, status, fonte, responsavel_nome')
        .gte('data_criacao', startDate.toISOString())
        .lte('data_criacao', endDate.toISOString());

      if (responsavel) {
        agendamentosCriadosQuery = agendamentosCriadosQuery.eq('responsavel_nome', responsavel);
      }

      // Query 2: Agendamentos por DATA DO AGENDAMENTO (para gráfico "Para o dia")
      let agendamentosParaQuery = supabase
        .from(AGENDAMENTOS_VIEW)
        .select('agendamento_data, status, fonte, responsavel_nome')
        .gte('agendamento_data', startDate.toISOString())
        .lte('agendamento_data', endDate.toISOString());

      if (responsavel) {
        agendamentosParaQuery = agendamentosParaQuery.eq('responsavel_nome', responsavel);
      }

      // Query 3: Leads do período (com data_criada para agrupar por dia)
      // Nota: Esta query retorna max 1000 registros, usada apenas para gráfico diário
      let leadsQuery = supabase
        .from('app_dash_principal')
        .select('id, data_criada')
        .gte('data_criada', startDate.toISOString())
        .lte('data_criada', endDate.toISOString());

      if (responsavel) {
        leadsQuery = leadsQuery.eq('lead_usuario_responsavel', responsavel);
      }

      // Query 4: Contagem EXATA de leads (sem limite de 1000)
      let leadsCountQuery = supabase
        .from('app_dash_principal')
        .select('*', { count: 'exact', head: true })
        .gte('data_criada', startDate.toISOString())
        .lte('data_criada', endDate.toISOString());

      if (responsavel) {
        leadsCountQuery = leadsCountQuery.eq('lead_usuario_responsavel', responsavel);
      }

      // Query 5: Lista de responsáveis únicos (de todos os agendamentos na VIEW)
      const responsaveisQuery = supabase
        .from(AGENDAMENTOS_VIEW)
        .select('responsavel_nome')
        .not('responsavel_nome', 'is', null);

      // Executar queries em paralelo
      const [agendamentosCriadosResult, agendamentosParaResult, leadsResult, leadsCountResult, responsaveisResult] = await Promise.all([
        agendamentosCriadosQuery,
        agendamentosParaQuery,
        leadsQuery,
        leadsCountQuery,
        responsaveisQuery,
      ]);

      if (agendamentosCriadosResult.error) {
        console.error('Error fetching agendamentos criados:', agendamentosCriadosResult.error);
        throw agendamentosCriadosResult.error;
      }

      if (agendamentosParaResult.error) {
        console.error('Error fetching agendamentos para:', agendamentosParaResult.error);
        throw agendamentosParaResult.error;
      }

      if (leadsResult.error) {
        console.error('Error fetching leads:', leadsResult.error);
      }

      if (leadsCountResult.error) {
        console.error('Error fetching leads count:', leadsCountResult.error);
      }

      setAgendamentosCriados(agendamentosCriadosResult.data || []);
      setAgendamentosPara(agendamentosParaResult.data || []);
      setLeadsData(leadsResult.data || []);
      // Usar contagem exata do Supabase (sem limite de 1000)
      setTotalLeads(leadsCountResult.count ?? leadsResult.data?.length ?? 0);

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
  }, [responsavel, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcular estatísticas a partir dos dados
  const { stats, porDia, porDiaCriacao, porOrigem } = useMemo(() => {
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
    let totalPendingFeedback = 0; // Reunião passou mas sem status definido
    let trafegoCount = 0;
    let socialSellingCount = 0;

    // Mapas para os dois gráficos
    const porDiaMap: Record<string, number> = {}; // Agendamentos PARA o dia
    const porDiaCriacaoMap: Record<string, number> = {}; // Agendamentos CRIADOS no dia
    const leadsPorDiaMap: Record<string, number> = {}; // Leads criados por dia

    // Inicializar todos os dias do período selecionado com 0
    const rangeStart = dateRange?.startDate || monthStart;
    const rangeEnd = dateRange?.endDate || todayEnd;
    const daysDiff = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      porDiaMap[dateKey] = 0;
      porDiaCriacaoMap[dateKey] = 0;
      leadsPorDiaMap[dateKey] = 0;
    }

    // Processar leads por dia
    leadsData.forEach((lead) => {
      const dataCriada = lead.data_criada;
      if (!dataCriada) return;
      const dateKey = new Date(dataCriada).toISOString().split('T')[0];
      if (leadsPorDiaMap[dateKey] !== undefined) {
        leadsPorDiaMap[dateKey]++;
      }
    });

    // Processar agendamentos PARA o dia (por agendamento_data)
    agendamentosPara.forEach((item) => {
      const agendamentoData = item.agendamento_data;
      if (!agendamentoData) return;

      const scheduledAt = new Date(agendamentoData);
      const dateKey = scheduledAt.toISOString().split('T')[0];

      if (porDiaMap[dateKey] !== undefined) {
        porDiaMap[dateKey]++;
      }

      // Contagem por período (apenas datas passadas/presentes)
      if (scheduledAt >= todayStart && scheduledAt <= todayEnd) {
        hoje++;
      }
      if (scheduledAt >= weekStart && scheduledAt <= todayEnd) {
        semana++;
      }
      if (scheduledAt >= monthStart && scheduledAt <= todayEnd) {
        mes++;
      }

      // Contagem por status
      const statusVal = item.status?.toLowerCase();
      const isPast = scheduledAt < now;

      if (statusVal === 'completed' || statusVal === 'won') {
        totalCompleted++;
      } else if (statusVal === 'no_show' || statusVal === 'lost') {
        totalNoShow++;
      } else if (statusVal === 'booked') {
        if (isPast) {
          // Reunião já aconteceu mas ainda está como "booked" - precisa feedback
          totalPendingFeedback++;
        } else {
          // Reunião ainda não aconteceu
          totalBooked++;
        }
      }

      // Contagem por origem
      const origem = getOrigem(item.fonte);
      if (origem === 'trafego') {
        trafegoCount++;
      } else if (origem === 'social_selling') {
        socialSellingCount++;
      }
    });

    // Processar agendamentos CRIADOS no dia (por data_criacao)
    agendamentosCriados.forEach((item) => {
      const dataCriacao = item.data_criacao;
      if (!dataCriacao) return;

      const createdAt = new Date(dataCriacao);
      const dateKey = createdAt.toISOString().split('T')[0];
      
      if (porDiaCriacaoMap[dateKey] !== undefined) {
        porDiaCriacaoMap[dateKey]++;
      }
    });

    // Total de agendados no período (PARA o dia)
    const totalAgendados = agendamentosPara.length;

    // Taxa de comparecimento (dos que temos feedback)
    const totalWithStatus = totalCompleted + totalNoShow;
    const taxaComparecimento = totalWithStatus > 0
      ? Math.round((totalCompleted / totalWithStatus) * 100)
      : 0;

    // Taxa de no-show (dos que temos feedback)
    const taxaNoShow = totalWithStatus > 0
      ? Math.round((totalNoShow / totalWithStatus) * 100)
      : 0;

    // Taxa de conversão
    const taxaConversao = totalLeads > 0
      ? Math.round((totalAgendados / totalLeads) * 100)
      : 0;

    // Converter mapa para array ordenado - Agendamentos PARA o dia
    const porDiaArr: AgendamentosPorDia[] = Object.entries(porDiaMap)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Converter mapa para array ordenado - Agendamentos CRIADOS no dia (com leads)
    const porDiaCriacaoArr: AgendamentosPorDia[] = Object.entries(porDiaCriacaoMap)
      .map(([data, quantidade]) => ({ 
        data, 
        quantidade,
        leads: leadsPorDiaMap[data] || 0
      }))
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
        taxaNoShow,
        totalLeads,
        totalAgendados,
        totalCompleted,
        totalNoShow,
        totalBooked,
        totalPendingFeedback,
      },
      porDia: porDiaArr,
      porDiaCriacao: porDiaCriacaoArr,
      porOrigem: porOrigemArr,
    };
  }, [agendamentosCriados, agendamentosPara, leadsData, totalLeads, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  return { stats, porDia, porDiaCriacao, porOrigem, responsaveis, loading, error, refetch: fetchData };
};

export default useAgendamentosStats;
