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

      setMetrics({
        totalAgents,
        totalLeads: 0, // TODO: fetch from leads table
        activeCampaigns: activeAgents,
        conversionRate: 0, // TODO: calculate from leads
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
