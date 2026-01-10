import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useClientPerformance
// Consome as views SQL para performance por cliente:
// - dashboard_performance_cliente
// - dashboard_ranking_clientes
// - dashboard_alertas_cliente
// ============================================================================

export interface ClientPerformance {
  clientId: string;
  agentName: string;
  clienteNome: string;
  clienteEmpresa: string;
  agentStatus: string;
  versionNumber: string;
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
  // Métricas de Custo
  totalTokens: number;
  custoTotalUsd: number;
  totalChamadasIa: number;
  // Métricas de Testes
  totalTestes: number;
  scoreMedio: number;
  ultimoTeste: string | null;
}

export interface ClientRanking {
  clientId: string;
  agentName: string;
  clienteNome: string;
  clienteEmpresa: string;
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
  clientId: string;
  agentName: string;
  clienteNome: string;
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

export const useClientPerformance = () => {
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
      // Buscar dados em paralelo
      const [performanceResult, rankingResult, alertsResult] = await Promise.all([
        // 1. Performance por cliente
        supabase
          .from('dashboard_performance_cliente')
          .select('*'),

        // 2. Ranking de clientes
        supabase
          .from('dashboard_ranking_clientes')
          .select('*'),

        // 3. Alertas por cliente
        supabase
          .from('dashboard_alertas_cliente')
          .select('*')
      ]);

      // Processar performance
      const clients: ClientPerformance[] = (performanceResult.data || []).map((row: any) => ({
        clientId: row.client_id,
        agentName: row.agent_name || 'Sem nome',
        clienteNome: row.cliente_nome || row.agent_name || 'Cliente',
        clienteEmpresa: row.cliente_empresa || '',
        agentStatus: row.agent_status || 'draft',
        versionNumber: row.version_number || '1.0.0',
        isActive: row.is_active || false,
        totalLeads: row.total_leads || 0,
        leadsResponderam: row.leads_responderam || 0,
        leadsAgendaram: row.leads_agendaram || 0,
        leadsCompareceram: row.leads_compareceram || 0,
        leadsFecharam: row.leads_fecharam || 0,
        taxaResposta: row.taxa_resposta || 0,
        taxaAgendamento: row.taxa_agendamento || 0,
        taxaConversaoGeral: row.taxa_conversao_geral || 0,
        totalTokens: row.total_tokens || 0,
        custoTotalUsd: row.custo_total_usd || 0,
        totalChamadasIa: row.total_chamadas_ia || 0,
        totalTestes: row.total_testes || 0,
        scoreMedio: row.score_medio || 0,
        ultimoTeste: row.ultimo_teste || null
      }));

      // Processar ranking
      const ranking: ClientRanking[] = (rankingResult.data || []).map((row: any) => ({
        clientId: row.client_id,
        agentName: row.agent_name || 'Sem nome',
        clienteNome: row.cliente_nome || row.agent_name || 'Cliente',
        clienteEmpresa: row.cliente_empresa || '',
        totalLeads: row.total_leads || 0,
        leadsResponderam: row.leads_responderam || 0,
        leadsFecharam: row.leads_fecharam || 0,
        taxaResposta: row.taxa_resposta || 0,
        taxaConversaoGeral: row.taxa_conversao_geral || 0,
        custoTotalUsd: row.custo_total_usd || 0,
        scoreMedio: row.score_medio || 0,
        rankConversao: row.rank_conversao || 0,
        rankVolume: row.rank_volume || 0,
        rankResposta: row.rank_resposta || 0
      }));

      // Processar alertas
      const alerts: ClientAlert[] = (alertsResult.data || []).map((row: any) => ({
        clientId: row.client_id,
        agentName: row.agent_name || 'Sem nome',
        clienteNome: row.cliente_nome || 'Cliente',
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
  }, []);

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
