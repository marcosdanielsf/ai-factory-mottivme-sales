import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DashboardMetrics } from '../../types';

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    totalLeads: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Tentar usar a View otimizada vw_dashboard_metrics
      const { data, error } = await supabase
        .from('vw_dashboard_metrics')
        .select('*')
        .single();

      if (error) {
        console.warn('View vw_dashboard_metrics não encontrada, usando fallback:', error);

        // Fallback: usar queries diretas com nomes de tabelas corrigidos
        const [agentsCount, leadsCount] = await Promise.all([
          supabase.from('agent_versions').select('id', { count: 'exact', head: true }),
          supabase.from('ai_factory_leads').select('id', { count: 'exact', head: true })
        ]);

        setMetrics({
          totalAgents: agentsCount.count || 0,
          totalLeads: leadsCount.count || 0,
          activeCampaigns: agentsCount.count || 0,
          conversionRate: 12.5, // Mock rate
          loading: false,
          error: null
        });
        return;
      }

      // Usar dados da View otimizada
      const dashboardData = data as DashboardMetrics;

      setMetrics({
        totalAgents: dashboardData.total_active_agents || 0,
        totalLeads: dashboardData.total_leads || 0,
        activeCampaigns: dashboardData.versions_in_production || 0,
        conversionRate: dashboardData.global_conversion_rate_pct || 0,
        loading: false,
        error: null
      });
    } catch (e: any) {
      console.error('Error in useDashboardMetrics:', e);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: e.message
      }));
    }
  };

  return {
    metrics,
    refetch: fetchMetrics
  };
};
