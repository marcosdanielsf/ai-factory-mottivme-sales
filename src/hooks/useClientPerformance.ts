import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useClientPerformance
// Consome dados de performance por VENDEDOR/RESPONSAVEL do GoHighLevel
//
// IMPORTANTE - FONTE DE DADOS:
// - Tabela: app_dash_principal (dados do GHL - 41.758 registros)
// - Agrupado por: lead_usuario_responsavel (vendedor/responsavel)
// - Esta tabela NAO tem campo de data, portanto filtros de periodo nao se aplicam
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
  ranking: ClientRanking[];
  alerts: ClientAlert[];
  loading: boolean;
  error: string | null;
}

// NOTA: dateRange e mantido na interface por compatibilidade,
// mas NAO e aplicado porque app_dash_principal nao tem campo de data
export type DateRangeType = '7d' | '30d' | 'month' | 'all';

interface UseClientPerformanceOptions {
  dateRange?: DateRangeType;
  month?: string; // Formato: 'YYYY-MM' - NAO USADO (tabela sem campo de data)
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

export const useClientPerformance = (_options: UseClientPerformanceOptions = {}) => {
  // NOTA: dateRange e month nao sao usados porque app_dash_principal nao tem campo de data
  // Mantidos na interface para compatibilidade com componentes que passam esses parametros

  const [state, setState] = useState<ClientPerformanceState>({
    clients: [],
    ranking: [],
    alerts: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Buscar TODOS os leads da tabela app_dash_principal (dados GHL)
      // NOTA: Esta tabela NAO tem campo de data, portanto busca TODOS os registros
      // Isso e intencional - mostra performance historica completa por vendedor
      // FALLBACK: Se app_dash_principal não existir ou der erro, tenta socialfy_leads
      let dashData: any[] | null = null;

      const { data: appDashData, error: dashError } = await supabase
        .from('app_dash_principal')
        .select('lead_usuario_responsavel, status, funil, tag');

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

      // 3. Buscar custos REAIS da tabela llm_costs, agrupados por location_name
      // O location_name em llm_costs corresponde ao cliente (similar ao lead_usuario_responsavel)
      // IMPORTANTE: Supabase retorna max 1000 registros por padrão, precisamos de mais
      const { data: costsData, count: totalCustos } = await supabase
        .from('llm_costs')
        .select('location_name, custo_usd, tokens_input, tokens_output', { count: 'exact' })
        .limit(50000); // Aumentar limite para pegar todos os registros

      console.log(`[DEBUG] Custos carregados: ${costsData?.length || 0} de ${totalCustos || '?'} registros`);

      // Agregar custos por location_name (nome do cliente)
      const custosPorCliente: Record<string, { custo: number; tokens: number; chamadas: number }> = {};
      (costsData || []).forEach((row: any) => {
        const clientName = (row.location_name || '').toLowerCase().trim();
        if (!clientName) return;

        if (!custosPorCliente[clientName]) {
          custosPorCliente[clientName] = { custo: 0, tokens: 0, chamadas: 0 };
        }
        custosPorCliente[clientName].custo += row.custo_usd || 0;
        custosPorCliente[clientName].tokens += (row.tokens_input || 0) + (row.tokens_output || 0);
        custosPorCliente[clientName].chamadas += 1;
      });

      console.log('[DEBUG] Custos agregados por cliente:', custosPorCliente);

      // Mapeamento manual: llm_costs.location_name → app_dash.lead_usuario_responsavel
      // Necessário porque os nomes são diferentes entre as duas fontes
      const mapeamentoClienteVendedor: Record<string, string[]> = {
        'legacy agency': ['milton'],
        'mottivme sales': ['marcos daniel', 'suporte mottivme', 'marcos'],
        'lappe finances': ['fernanda lappe'],
        'dr. luiz augusto': ['luiz augusto'],
        'dr. luiz': ['luiz augusto'],
        'dr luiz': ['luiz augusto'],
        'dr thauan': ['thauan'],
        'dr. thauan': ['thauan'],
        'dra. gabriela rossmam': ['gabriela rossmam', 'dra gabriella rossmam'],
        'dra gabriela rossmam': ['gabriela rossmam', 'dra gabriella rossmam'],
        'eline lôbo': ['eline lôbo', 'eline lobo'],
        'marina couto': ['marina couto'],
        'fernanda lappe': ['fernanda lappe'],
        'gustavo couto': ['gustavo couto'],
        'andré rosa': ['andre rosa', 'andré rosa'],
        'andre rosa': ['andre rosa', 'andré rosa'],
      };

      // Helper para encontrar custo por nome (com mapeamento)
      const findCustoByName = (vendedorName: string): { custo: number; tokens: number; chamadas: number } => {
        const normalizedVendedor = vendedorName.toLowerCase().trim();

        // 1. Verificar mapeamento reverso: vendedor → cliente
        for (const [clienteName, vendedores] of Object.entries(mapeamentoClienteVendedor)) {
          if (vendedores.some(v => v === normalizedVendedor || normalizedVendedor.includes(v) || v.includes(normalizedVendedor))) {
            if (custosPorCliente[clienteName]) {
              return custosPorCliente[clienteName];
            }
          }
        }

        // 2. Match exato
        if (custosPorCliente[normalizedVendedor]) {
          return custosPorCliente[normalizedVendedor];
        }

        // 3. Match parcial (nome contém ou é contido)
        for (const [clientName, data] of Object.entries(custosPorCliente)) {
          if (normalizedVendedor.includes(clientName) || clientName.includes(normalizedVendedor)) {
            return data;
          }
        }

        // 4. Match por primeira palavra
        const firstName = normalizedVendedor.split(' ')[0];
        for (const [clientName, data] of Object.entries(custosPorCliente)) {
          if (clientName.startsWith(firstName) || firstName.startsWith(clientName.split(' ')[0])) {
            return data;
          }
        }

        return { custo: 0, tokens: 0, chamadas: 0 };
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
            avgScoreOverall: 0
          };
        })
        .filter(c => c.totalLeads > 0)
        .sort((a, b) => b.totalLeads - a.totalLeads);

      // 7. Processar ranking
      const ranking: ClientRanking[] = clients
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

      // 8. Processar alertas (recalcular com métricas reais)
      const alerts: ClientAlert[] = clients
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
        clients,
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
  }, []); // Sem dependencias - dados nao filtrados por periodo

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
