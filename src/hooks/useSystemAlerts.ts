import { useState, useEffect, useCallback } from 'react';
import { MOCK_ALERTS } from '../constants';

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  timestamp: string;
  message: string;
  client_name?: string;
}

export const useSystemAlerts = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real scenario, we would fetch from Supabase here:
      // const { data, error } = await supabase.from('system_alerts').select('*').order('created_at', { ascending: false });
      // if (error) throw error;
      // setAlerts(data);
      
      // Simulating a delay to match the UI feel of other pages
      await new Promise(resolve => setTimeout(resolve, 800));
      setAlerts(MOCK_ALERTS as SystemAlert[]);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAllAsRead = useCallback(async () => {
    // In a real scenario, we would update the database:
    // await supabase.from('system_alerts').delete().neq('id', '');
    setAlerts([]);
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    // In a real scenario, we would update the database:
    // await supabase.from('system_alerts').delete().eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return { 
    alerts, 
    loading, 
    error, 
    refetch: fetchAlerts,
    markAllAsRead,
    deleteAlert
  };
};
