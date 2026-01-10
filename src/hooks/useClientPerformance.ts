import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useClientPerformance
// Consome dados de performance por cliente com filtro de período
// - Leads: da view dashboard_performance_cliente
// - Custos: diretamente da llm_costs (com filtro de data)
// ============================================================================

export interface ClientPerformance {
  locationId: string;
  agentName: string;
  agentStatus: string;
  version: string;
  isActive: boolean;
  // Métricas de Follow-up
  totalLeads: number;
  leadsResponderam: number;
  leadsAgendaram: number;
  leadsCompareceram: number;
  leadsFecharam: number;
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

export type DateRangeType = '7d' | '30d' | 'month' | 'all';

interface UseClientPerformanceOptions {
  dateRange?: DateRangeType;
  month?: string; // Formato: 'YYYY-MM'
}

// Helper para calcular range de datas
const getDateRange = (range: DateRangeType, month?: string): { start: Date | null; end: Date | null } => {
  const now = new Date();

  switch (range) {
    case '7d':
      const start7d = new Date(now);
      start7d.setDate(start7d.getDate() - 7);
      return { start: start7d, end: null };
    case '30d':
      const start30d = new Date(now);
      start30d.setDate(start30d.getDate() - 30);
      return { start: start30d, end: null };
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
  const { dateRange = '30d', month } = options;

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
      // 1. Buscar dados da view de performance (leads, taxas, etc)
      const [performanceResult, alertsResult] = await Promise.all([
        supabase.from('dashboard_performance_cliente').select('*'),
        supabase.from('dashboard_alertas_cliente').select('*')
      ]);

      // 2. Buscar custos diretamente da llm_costs com filtro de data
      let costsQuery = supabase
        .from('llm_costs')
        .select('location_id, custo_usd, tokens_input, tokens_output');

      const { start, end } = getDateRange(dateRange, month);
      if (start) {
        costsQuery = costsQuery.gte('created_at', start.toISOString());
      }
      if (end) {
        costsQuery = costsQuery.lte('created_at', end.toISOString());
      }

      const costsResult = await costsQuery;

      // Agregar custos por location_id
      const costsByLocation: Record<string, { custo: number; tokens: number; chamadas: number }> = {};
      (costsResult.data || []).forEach((row: any) => {
        const lid = row.location_id || 'unknown';
        if (!costsByLocation[lid]) {
          costsByLocation[lid] = { custo: 0, tokens: 0, chamadas: 0 };
        }
        costsByLocation[lid].custo += row.custo_usd || 0;
        costsByLocation[lid].tokens += (row.tokens_input || 0) + (row.tokens_output || 0);
        costsByLocation[lid].chamadas += 1;
      });

      // Processar performance combinando dados da view + custos filtrados
      const clients: ClientPerformance[] = (performanceResult.data || []).map((row: any) => {
        const locationCosts = costsByLocation[row.location_id] || { custo: 0, tokens: 0, chamadas: 0 };
        return {
          locationId: row.location_id,
          agentName: row.agent_name || 'Sem nome',
          agentStatus: row.agent_status || 'draft',
          version: row.version || '1.0.0',
          isActive: row.is_active || false,
          totalLeads: row.total_leads || 0,
          leadsResponderam: row.leads_responderam || 0,
          leadsAgendaram: row.leads_agendaram || 0,
          leadsCompareceram: row.leads_compareceram || 0,
          leadsFecharam: row.leads_fecharam || 0,
          taxaResposta: row.taxa_resposta || 0,
          taxaAgendamento: row.taxa_agendamento || 0,
          taxaConversaoGeral: row.taxa_conversao_geral || 0,
          // Custos do período selecionado
          totalTokens: locationCosts.tokens,
          custoTotalUsd: locationCosts.custo,
          totalChamadasIa: locationCosts.chamadas,
          // Testes
          totalTestRuns: row.total_test_runs || 0,
          lastTestScore: row.last_test_score || null,
          avgScoreOverall: row.avg_score_overall || 0
        };
      });

      // Processar ranking (recalcular com custos do período)
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

      // Processar alertas
      const alerts: ClientAlert[] = (alertsResult.data || []).map((row: any) => ({
        locationId: row.location_id,
        agentName: row.agent_name || 'Sem nome',
        alertaBaixaResposta: row.alerta_baixa_resposta || false,
        alertaBaixaConversao: row.alerta_baixa_conversao || false,
        alertaCustoSemResultado: row.alerta_custo_sem_resultado || false,
        alertaScoreBaixo: row.alerta_score_baixo || false,
        totalAlertas: row.total_alertas || 0
      }));

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
  }, [dateRange, month]);

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
