import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useClientPerformance
// Consome dados de performance por VENDEDOR/RESPONSAVEL do GoHighLevel
//
// IMPORTANTE - FONTE DE DADOS:
// - Tabela: app_dash_principal (dados do GHL)
// - Agrupado por: lead_usuario_responsavel (vendedor/responsavel)
// - FILTRO DE DATA: usa campo data_criada (mesma logica de useAgendamentosStats)
//
// DIFERENCA DAS OUTRAS TELAS:
// - Dashboard/Funil/Leads usam: socialfy_leads (prospecção social media)
// - Performance usa: app_dash_principal (vendas GHL)
// - Os numeros SERAO DIFERENTES porque sao fontes distintas (intencional)
//
// STATUS DO FUNIL GHL:
// - new_lead, booked, no_show, completed, qualifying, won, lost
// ============================================================================

export interface ClientPerformance {
  locationId: string;        // Usando lead_usuario_responsavel como "locationId" para compatibilidade
  agentName: string;         // Nome do responsável/cliente
  agentStatus: string;
  version: string;
  isActive: boolean;
  // Métricas de Follow-up (baseadas no status do funil em app_dash_principal)
  totalLeads: number;        // Total de leads
  leadsResponderam: number;  // Leads que não são mais new_lead (avançaram no funil)
  leadsAgendaram: number;    // status = booked
  leadsCompareceram: number; // status = completed ou qualifying
  leadsFecharam: number;     // status = won
  leadsNoShow: number;       // status = no_show
  leadsLost: number;         // status = lost
  taxaResposta: number;
  taxaAgendamento: number;
  taxaConversaoGeral: number;
  // Métricas de Custo (filtrado por período)
  totalTokens: number;
  custoTotalUsd: number;
  totalChamadasIa: number;
  // Métricas de Testes
  totalTestRuns: number;
  lastTestScore: number | null;
  avgScoreOverall: number;
  // Última atividade (para filtro de inativos)
  lastActivity?: string;
}

export interface ClientRanking {
  locationId: string;
  agentName: string;
  totalLeads: number;
  leadsResponderam: number;
  leadsFecharam: number;
  taxaResposta: number;
  taxaConversaoGeral: number;
  custoTotalUsd: number;
  scoreMedio: number;
  rankConversao: number;
  rankVolume: number;
  rankResposta: number;
}

export interface ClientAlert {
  locationId: string;
  agentName: string;
  alertaBaixaResposta: boolean;
  alertaBaixaConversao: boolean;
  alertaCustoSemResultado: boolean;
  alertaScoreBaixo: boolean;
  totalAlertas: number;
}

interface ClientPerformanceState {
  clients: ClientPerformance[];
  allClients: ClientPerformance[]; // Todos os clientes (para dropdown)
  ranking: ClientRanking[];
  alerts: ClientAlert[];
  loading: boolean;
  error: string | null;
}

// DateRange type - compativel com useAgendamentosStats
export type DateRangeType = '7d' | '30d' | 'month' | 'all';

// Interface para range de datas com objetos Date (igual ao useAgendamentosStats)
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface UseClientPerformanceOptions {
  dateRange?: DateRangeType;
  month?: string; // Formato: 'YYYY-MM' para dateRange='month'
  customDateRange?: DateRange; // Range customizado com objetos Date
  clientName?: string; // Filtrar por cliente específico
  showInactive?: boolean; // Mostrar clientes inativos (sem atividade de custo nos últimos 30 dias)
  inactiveDays?: number; // Dias para considerar inativo (padrão: 30)
}

// Interface para métricas agregadas por responsável (cliente)
interface ClientMetrics {
  total: number;
  newLead: number;
  booked: number;
  noShow: number;
  completed: number;
  qualifying: number;
  won: number;
  lost: number;
}

// Helper para calcular data de inicio e fim (igual ao useClientCosts)
const getDateRange = (range: string, month?: string): { start: Date | null; end: Date | null } => {
  const now = new Date();

  switch (range) {
    case '7d':
      now.setDate(now.getDate() - 7);
      return { start: now, end: null };
    case '30d':
      now.setDate(now.getDate() - 30);
      return { start: now, end: null };
    case 'month':
      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
        return { start, end };
      }
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
};

export const useClientPerformance = (options: UseClientPerformanceOptions = {}) => {
  // dateRange e month sao aplicados TANTO aos custos (llm_costs)
  // QUANTO aos leads (app_dash_principal) usando campo data_criada
  const {
    dateRange = '30d',
    month,
    customDateRange,
    clientName,
    showInactive = false,
    inactiveDays = 30
  } = options;

  const [state, setState] = useState<ClientPerformanceState>({
    clients: [],
    allClients: [],
    ranking: [],
    alerts: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Calcular datas do periodo (igual ao useAgendamentosStats)
      let startDate: Date;
      let endDate: Date;

      if (customDateRange?.startDate && customDateRange?.endDate) {
        // Usar range customizado se fornecido
        startDate = customDateRange.startDate;
        endDate = customDateRange.endDate;
      } else {
        // Calcular baseado no dateRange
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        startDate = new Date();
        switch (dateRange) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'month':
            if (month) {
              const [year, monthNum] = month.split('-').map(Number);
              startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
              endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
            } else {
              startDate.setDate(startDate.getDate() - 30);
            }
            break;
          case 'all':
          default:
            startDate = new Date('2020-01-01'); // Data minima para "todos"
            break;
        }
        startDate.setHours(0, 0, 0, 0);
      }

      console.log('[DEBUG] Performance date filter:', {
        dateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // 1. Buscar leads da tabela app_dash_principal COM FILTRO DE DATA
      // Usa campo data_criada (igual ao useAgendamentosStats)
      // FALLBACK: Se app_dash_principal não existir ou der erro, tenta socialfy_leads
      let dashData: any[] | null = null;

      let dashQuery = supabase
        .from('app_dash_principal')
        .select('lead_usuario_responsavel, status, funil, tag, data_criada');

      // Aplicar filtro de data se nao for "all"
      if (dateRange !== 'all') {
        dashQuery = dashQuery
          .gte('data_criada', startDate.toISOString())
          .lte('data_criada', endDate.toISOString());
      }

      const { data: appDashData, error: dashError } = await dashQuery;

      console.log('[DEBUG] app_dash_principal:', {
        success: !dashError,
        count: appDashData?.length || 0,
        error: dashError?.message || null,
        errorCode: dashError?.code || null
      });

      if (dashError) {
        console.warn('app_dash_principal não disponível, tentando dashboard_ranking_clientes:', dashError.message);

        // Fallback 1: tentar dashboard_ranking_clientes (view com dados agregados)
        const { data: rankingData, error: rankingError } = await supabase
          .from('dashboard_ranking_clientes')
          .select('*');

        if (!rankingError && rankingData && rankingData.length > 0) {
          // Usar dados já agregados do ranking
          // Esta view já tem os totais por cliente
          dashData = rankingData.flatMap((row: any) => {
            // Criar registros sintéticos baseados nos totais
            const records = [];
            const clientName = row.agent_name || row.cliente || 'Cliente';

            // Criar registros para cada status baseado nos totais
            for (let i = 0; i < (row.total_leads || 0); i++) {
              let status = 'new_lead';
              if (i < (row.leads_fecharam || row.won || 0)) status = 'won';
              else if (i < (row.leads_fecharam || 0) + (row.leads_responderam || 0)) status = 'completed';
              else if (i < (row.leads_fecharam || 0) + (row.leads_responderam || 0) + (row.leads_agendaram || row.booked || 0)) status = 'booked';

              records.push({
                lead_usuario_responsavel: clientName,
                status: status,
                funil: null,
                tag: null
              });
            }
            return records;
          });
        } else {
          // Fallback 2: usar socialfy_leads
          console.warn('dashboard_ranking_clientes não disponível, usando socialfy_leads');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('socialfy_leads')
            .select('location_id, full_name, status, source');

          if (fallbackError) {
            throw new Error(`Erro ao buscar dados: ${fallbackError.message}`);
          }

          dashData = (fallbackData || []).map((row: any) => ({
            lead_usuario_responsavel: row.location_id || 'PROSPECÇÃO SOCIAL',
            status: row.status,
            funil: row.source,
            tag: null
          }));
        }
      } else {
        dashData = appDashData;
      }

      // 2. Agregar métricas por responsável (cliente)
      // lead_usuario_responsavel = nome do responsável/vendedor/cliente
      const metricsByResponsavel: Record<string, ClientMetrics> = {};

      (dashData || []).forEach((row: any) => {
        const responsavel = row.lead_usuario_responsavel || 'SEM RESPONSÁVEL';

        if (!metricsByResponsavel[responsavel]) {
          metricsByResponsavel[responsavel] = {
            total: 0,
            newLead: 0,
            booked: 0,
            noShow: 0,
            completed: 0,
            qualifying: 0,
            won: 0,
            lost: 0
          };
        }

        const metrics = metricsByResponsavel[responsavel];
        metrics.total++;

        // Mapear status para métricas
        const status = (row.status || '').toLowerCase();
        switch (status) {
          case 'new_lead':
            metrics.newLead++;
            break;
          case 'booked':
            metrics.booked++;
            break;
          case 'no_show':
            metrics.noShow++;
            break;
          case 'completed':
            metrics.completed++;
            break;
          case 'qualifying':
            metrics.qualifying++;
            break;
          case 'won':
            metrics.won++;
            break;
          case 'lost':
            metrics.lost++;
            break;
          // Outros status são contados apenas no total
        }
      });

      // 3. Buscar custos com filtro de período
      // Reutiliza as mesmas datas calculadas acima para leads
      const needsDateFilter = dateRange !== 'all';

      const custosPorCliente: Record<string, { custo: number; tokens: number; chamadas: number; lastActivity?: string }> = {};

      if (!needsDateFilter) {
        // Sem filtro de período: usar view agregada
        const { data: custsAggData, error: custsError } = await supabase
          .from('vw_client_costs_summary')
          .select('location_name, total_cost_usd, total_requests, last_activity');

        if (custsError) {
          console.warn('[DEBUG] View vw_client_costs_summary não disponível:', custsError.message);
        }

        (custsAggData || []).forEach((row: any) => {
          const clientNameKey = (row.location_name || '').toLowerCase().trim();
          if (!clientNameKey) return;

          custosPorCliente[clientNameKey] = {
            custo: row.total_cost_usd || 0,
            tokens: 0,
            chamadas: row.total_requests || 0,
            lastActivity: row.last_activity || null
          };
        });
      } else {
        // Com filtro de período: buscar da tabela llm_costs com paginação
        let allCostsData: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('llm_costs')
            .select('location_name, custo_usd, created_at')
            .gte('created_at', startDate.toISOString());

          if (endDate) {
            query = query.lte('created_at', endDate.toISOString());
          }

          const { data: pageData, error: pageError } = await query
            .range(offset, offset + pageSize - 1);

          if (pageError) {
            console.warn('[DEBUG] Erro ao buscar llm_costs:', pageError.message);
            break;
          }

          if (pageData && pageData.length > 0) {
            allCostsData = [...allCostsData, ...pageData];
            offset += pageSize;
            hasMore = pageData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        // Agregar custos por cliente
        allCostsData.forEach((row: any) => {
          const clientNameKey = (row.location_name || '').toLowerCase().trim();
          if (!clientNameKey) return;

          if (!custosPorCliente[clientNameKey]) {
            custosPorCliente[clientNameKey] = { custo: 0, tokens: 0, chamadas: 0, lastActivity: undefined };
          }

          custosPorCliente[clientNameKey].custo += row.custo_usd || 0;
          custosPorCliente[clientNameKey].chamadas += 1;

          // Atualizar última atividade
          if (!custosPorCliente[clientNameKey].lastActivity ||
              new Date(row.created_at) > new Date(custosPorCliente[clientNameKey].lastActivity!)) {
            custosPorCliente[clientNameKey].lastActivity = row.created_at;
          }
        });

        console.log(`[DEBUG] Custos carregados com filtro ${dateRange}:`, Object.keys(custosPorCliente).length, 'clientes');
      }

      // Buscar última atividade por cliente (para filtro de inativos)
      const { data: lastActivityData } = await supabase
        .from('vw_client_costs_summary')
        .select('location_name, last_activity');

      const lastActivityByClient: Record<string, string> = {};
      (lastActivityData || []).forEach((row: any) => {
        const name = (row.location_name || '').toLowerCase().trim();
        if (name && row.last_activity) {
          lastActivityByClient[name] = row.last_activity;
        }
      });

      console.log('[DEBUG] Custos agregados por cliente (view):', custosPorCliente);

      // Mapeamento manual: llm_costs.location_name → app_dash.lead_usuario_responsavel
      // Necessário porque os nomes são diferentes entre as duas fontes
      // Mapeamento: nome em llm_costs → nome em app_dash_principal (GHL)
      // APENAS para nomes que são DIFERENTES entre as duas fontes
      const mapeamentoClienteVendedor: Record<string, string[]> = {
        'legacy agency': ['milton'],
        'mottivme sales': ['marcos daniel', 'suporte mottivme'],
      };

      // Helper para encontrar custo por nome (com mapeamento)
      const findCustoByName = (vendedorName: string): { custo: number; tokens: number; chamadas: number; lastActivity?: string } => {
        const normalizedVendedor = vendedorName.toLowerCase().trim();

        // 1. PRIORIDADE: Match EXATO primeiro (antes do mapeamento)
        if (custosPorCliente[normalizedVendedor]) {
          return custosPorCliente[normalizedVendedor];
        }

        // 2. Verificar mapeamento: vendedor GHL → cliente llm_costs
        for (const [clienteName, vendedores] of Object.entries(mapeamentoClienteVendedor)) {
          if (vendedores.some(v => v === normalizedVendedor)) {
            if (custosPorCliente[clienteName]) {
              return custosPorCliente[clienteName];
            }
          }
        }

        // 3. Match parcial cuidadoso (apenas se nome contém o outro E tem mais de 5 chars)
        for (const [clientName, data] of Object.entries(custosPorCliente)) {
          // Evitar matches falsos como "lappe" matching "fernanda lappe"
          if (clientName.length > 5 && normalizedVendedor.length > 5) {
            if (normalizedVendedor === clientName ||
                (normalizedVendedor.includes(clientName) && clientName.length > normalizedVendedor.length * 0.6)) {
              return data;
            }
          }
        }

        return { custo: 0, tokens: 0, chamadas: 0, lastActivity: undefined };
      };

      // Helper para encontrar última atividade
      const findLastActivity = (vendedorName: string): string | undefined => {
        const normalizedVendedor = vendedorName.toLowerCase().trim();

        // 1. Match exato primeiro
        if (lastActivityByClient[normalizedVendedor]) {
          return lastActivityByClient[normalizedVendedor];
        }

        // 2. Verificar mapeamento
        for (const [clienteNameKey, vendedores] of Object.entries(mapeamentoClienteVendedor)) {
          if (vendedores.some(v => v === normalizedVendedor)) {
            if (lastActivityByClient[clienteNameKey]) {
              return lastActivityByClient[clienteNameKey];
            }
          }
        }

        return undefined;
      };

      // Log para debug - clientes com custos encontrados
      const clientesComCustos = Object.keys(custosPorCliente);
      if (clientesComCustos.length > 0) {
        console.log('Custos encontrados para clientes:', clientesComCustos);
      }

      // 4. Transformar métricas agregadas em array de ClientPerformance
      const clients: ClientPerformance[] = Object.entries(metricsByResponsavel)
        .map(([responsavel, metrics]) => {
          const totalLeads = metrics.total;

          // Responderam = leads que avançaram do new_lead (booked, completed, qualifying, won, lost, no_show)
          const leadsResponderam = metrics.booked + metrics.completed + metrics.qualifying +
                                   metrics.won + metrics.lost + metrics.noShow;

          // Agendaram = booked + no_show + completed + won (todos que chegaram a agendar)
          const leadsAgendaram = metrics.booked + metrics.noShow + metrics.completed + metrics.won;

          // Compareceram = completed + qualifying + won (não incluímos no_show)
          const leadsCompareceram = metrics.completed + metrics.qualifying + metrics.won;

          // Fecharam = won
          const leadsFecharam = metrics.won;

          // Calcular taxas
          const taxaResposta = totalLeads > 0
            ? Math.round((leadsResponderam / totalLeads) * 1000) / 10
            : 0;
          const taxaAgendamento = totalLeads > 0
            ? Math.round((leadsAgendaram / totalLeads) * 1000) / 10
            : 0;
          const taxaConversaoGeral = totalLeads > 0
            ? Math.round((leadsFecharam / totalLeads) * 1000) / 10
            : 0;

          // Buscar custos REAIS para este cliente (match por nome)
          const custosCliente = findCustoByName(responsavel);

          return {
            locationId: responsavel, // Usando responsável como ID para compatibilidade
            agentName: responsavel,
            agentStatus: 'active',
            version: '1.0.0',
            isActive: true,
            // Métricas de leads e funil
            totalLeads,
            leadsResponderam,
            leadsAgendaram,
            leadsCompareceram,
            leadsFecharam,
            leadsNoShow: metrics.noShow,
            leadsLost: metrics.lost,
            taxaResposta,
            taxaAgendamento,
            taxaConversaoGeral,
            // Custos REAIS da tabela llm_costs (match por nome do cliente)
            totalTokens: custosCliente.tokens,
            custoTotalUsd: custosCliente.custo,
            totalChamadasIa: custosCliente.chamadas,
            // Testes (não disponível nesta fonte)
            totalTestRuns: 0,
            lastTestScore: null,
            avgScoreOverall: 0,
            // Última atividade (para filtro de inativos)
            lastActivity: findLastActivity(responsavel)
          };
        })
        .filter(c => c.totalLeads > 0)
        .sort((a, b) => b.totalLeads - a.totalLeads);

      // Guardar todos os clientes para dropdown
      const allClients = [...clients];

      // Aplicar filtros
      let filteredClients = clients;

      // Filtro por cliente específico
      if (clientName) {
        filteredClients = filteredClients.filter(c =>
          c.agentName.toLowerCase() === clientName.toLowerCase()
        );
      }

      // Filtro de ativos/inativos (baseado em custos de IA)
      // ATIVO = tem custos de IA no período selecionado
      // INATIVO = não tem custos de IA ou custo = $0
      if (!showInactive) {
        const inactiveThreshold = new Date();
        inactiveThreshold.setDate(inactiveThreshold.getDate() - inactiveDays);
        filteredClients = filteredClients.filter(c => {
          // Se não tem custos de IA, é INATIVO
          if (c.custoTotalUsd === 0 || !c.lastActivity) {
            return false; // Não mostrar inativos
          }
          // Se tem custos mas a última atividade é antiga, também é inativo
          return new Date(c.lastActivity) >= inactiveThreshold;
        });
      }

      // Usar filteredClients para o resto do processamento
      const clientsToProcess = filteredClients;

      // 7. Processar ranking (usando clientes filtrados)
      const ranking: ClientRanking[] = clientsToProcess
        .filter(c => c.totalLeads > 0)
        .sort((a, b) => b.taxaConversaoGeral - a.taxaConversaoGeral)
        .map((c, idx) => ({
          locationId: c.locationId,
          agentName: c.agentName,
          totalLeads: c.totalLeads,
          leadsResponderam: c.leadsResponderam,
          leadsFecharam: c.leadsFecharam,
          taxaResposta: c.taxaResposta,
          taxaConversaoGeral: c.taxaConversaoGeral,
          custoTotalUsd: c.custoTotalUsd,
          scoreMedio: c.avgScoreOverall,
          rankConversao: idx + 1,
          rankVolume: 0,
          rankResposta: 0
        }));

      // Recalcular ranks
      const byVolume = [...ranking].sort((a, b) => b.totalLeads - a.totalLeads);
      const byResposta = [...ranking].sort((a, b) => b.taxaResposta - a.taxaResposta);
      ranking.forEach(r => {
        r.rankVolume = byVolume.findIndex(x => x.locationId === r.locationId) + 1;
        r.rankResposta = byResposta.findIndex(x => x.locationId === r.locationId) + 1;
      });

      // 8. Processar alertas (recalcular com métricas reais - usando clientes filtrados)
      const alerts: ClientAlert[] = clientsToProcess
        .filter(c => c.totalLeads > 0)
        .map((c) => {
          const alertaBaixaResposta = c.taxaResposta < 10 && c.totalLeads >= 10;
          const alertaBaixaConversao = c.taxaConversaoGeral < 3 && c.totalLeads >= 10;
          const alertaCustoSemResultado = c.custoTotalUsd > 50 && c.leadsFecharam === 0;
          const alertaScoreBaixo = c.avgScoreOverall > 0 && c.avgScoreOverall < 5;
          const totalAlertas = [alertaBaixaResposta, alertaBaixaConversao, alertaCustoSemResultado, alertaScoreBaixo].filter(Boolean).length;

          return {
            locationId: c.locationId,
            agentName: c.agentName,
            alertaBaixaResposta,
            alertaBaixaConversao,
            alertaCustoSemResultado,
            alertaScoreBaixo,
            totalAlertas
          };
        })
        .filter(a => a.totalAlertas > 0);

      setState({
        clients: clientsToProcess,
        allClients,
        ranking,
        alerts,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erro ao buscar performance por cliente:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar dados'
      }));
    }
  }, [dateRange, month, customDateRange?.startDate?.getTime(), customDateRange?.endDate?.getTime(), clientName, showInactive, inactiveDays]); // Dependências dos filtros

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Métricas agregadas
  const totals = {
    totalClientes: state.clients.length,
    totalLeads: state.clients.reduce((sum, c) => sum + c.totalLeads, 0),
    totalResponderam: state.clients.reduce((sum, c) => sum + c.leadsResponderam, 0),
    totalFecharam: state.clients.reduce((sum, c) => sum + c.leadsFecharam, 0),
    custoTotal: state.clients.reduce((sum, c) => sum + c.custoTotalUsd, 0),
    taxaRespostMedia: state.clients.length > 0
      ? state.clients.reduce((sum, c) => sum + c.taxaResposta, 0) / state.clients.length
      : 0,
    taxaConversaoMedia: state.clients.length > 0
      ? state.clients.reduce((sum, c) => sum + c.taxaConversaoGeral, 0) / state.clients.length
      : 0
  };

  return {
    ...state,
    totals,
    refetch: fetchData
  };
};

export default useClientPerformance;
