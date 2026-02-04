import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardMetricsState {
  totalAgents: number;
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  averageScore: number;
  testsRun: number;
  passRate: number;
  loading: boolean;
  error: string | null;
}

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsState>({
    totalAgents: 0,
    totalLeads: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    averageScore: 0,
    testsRun: 0,
    passRate: 0,
    loading: true,
    error: null
  });

  const fetchMetrics = useCallback(async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true, error: null }));

      // Buscar agentes diretamente da tabela agent_versions
      const { data: agents, error: agentsError } = await supabase
        .from('agent_versions')
        .select('id, last_test_score, validation_score, total_test_runs, is_active');

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        throw agentsError;
      }

      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.is_active).length || 0;

      // Calcular score médio
      const scores = agents
        ?.map(a => a.last_test_score || a.validation_score)
        .filter((s): s is number => s !== null && s > 0) || [];

      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      // Total de testes
      const testsRun = agents?.reduce((sum, a) => sum + (a.total_test_runs || 0), 0) || 0;

      // Pass rate (agentes com score >= 8)
      const passRate = scores.length > 0
        ? Math.round((scores.filter(s => s >= 8).length / scores.length) * 100)
        : 0;

      // Buscar total de leads e conversão da view dashboard_ranking_clientes
      // Esta view já tem os totais agregados por cliente (fonte: app_dash_principal)
      let totalLeads = 0;
      let convertedLeads = 0;
      let conversionRate = 0;

      const { data: rankingData, error: rankingError } = await supabase
        .from('dashboard_ranking_clientes')
        .select('total_leads, leads_fecharam, taxa_conversao_geral');

      if (!rankingError && rankingData && rankingData.length > 0) {
        // Somar totais de todos os clientes
        totalLeads = rankingData.reduce((sum, row) => sum + (row.total_leads || 0), 0);
        convertedLeads = rankingData.reduce((sum, row) => sum + (row.leads_fecharam || 0), 0);
        conversionRate = totalLeads > 0
          ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1))
          : 0;
        console.log('Dashboard metrics from ranking:', { totalLeads, convertedLeads, conversionRate });
      } else {
        // Fallback: usar socialfy_leads
        console.warn('dashboard_ranking_clientes não disponível, usando socialfy_leads');
        const { count: leadsCount } = await supabase
          .from('socialfy_leads')
          .select('*', { count: 'exact', head: true });

        const { count: converted } = await supabase
          .from('socialfy_leads')
          .select('*', { count: 'exact', head: true })
          .in('status', ['call_booked', 'scheduled', 'proposal', 'won', 'closed']);

        totalLeads = leadsCount || 0;
        convertedLeads = converted || 0;
        conversionRate = (totalLeads && convertedLeads)
          ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1))
          : 0;
      }

      setMetrics({
        totalAgents,
        totalLeads: totalLeads || 0,
        activeCampaigns: activeAgents,
        conversionRate,
        averageScore,
        testsRun,
        passRate,
        loading: false,
        error: null
      });

    } catch (e: any) {
      console.error('Error in useDashboardMetrics:', e);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: e.message || 'Erro ao carregar métricas'
      }));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    refetch: fetchMetrics
  };
};
