import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    totalLeads: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    loading: true
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [agents, leads] = await Promise.all([
        supabase.from('agents').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true })
      ]);

      setMetrics({
        totalAgents: agents.count || 0,
        totalLeads: leads.count || 0,
        activeCampaigns: agents.count || 0, // Mock for now
        conversionRate: 12.5, // Mock for now
        loading: false
      });
    } catch (e) {
      console.error(e);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  return { metrics };
};
