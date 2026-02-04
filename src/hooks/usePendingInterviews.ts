import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingInterview {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string | null;
  recruiter_name: string;
  recruiter_phone: string;
  interview_date: string;
  status: 'pending' | 'sent' | 'clicked' | 'expired';
  click_action: 'realizada' | 'no_show' | 'sem_interesse' | null;
  location_id: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  clicked_at: string | null;
}

interface UsePendingInterviewsReturn {
  interviews: PendingInterview[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (id: string, action: 'realizada' | 'no_show' | 'sem_interesse') => Promise<boolean>;
  metrics: {
    pending: number;
    compareceu: number;
    no_show: number;
    sem_interesse: number;
    total: number;
  };
}

export const usePendingInterviews = (locationId?: string): UsePendingInterviewsReturn => {
  const [interviews, setInterviews] = useState<PendingInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('notification_queue')
        .select('*')
        .order('interview_date', { ascending: false });

      // Filtrar por location se especificado
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInterviews(data || []);
    } catch (err) {
      console.error('Erro ao buscar entrevistas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Atualizar status
  const updateStatus = useCallback(async (
    id: string, 
    action: 'realizada' | 'no_show' | 'sem_interesse'
  ): Promise<boolean> => {
    try {
      // 1. Atualizar no Supabase
      const { error: updateError } = await supabase
        .from('notification_queue')
        .update({
          status: 'clicked',
          click_action: action,
          clicked_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Encontrar o interview para pegar dados do GHL
      const interview = interviews.find(i => i.id === id);
      if (!interview) throw new Error('Entrevista não encontrada');

      // 3. Chamar webhook para atualizar GHL
      const webhookResponse = await fetch('https://cliente-a1.mentorfy.io/webhook/status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: id,
          lead_id: interview.lead_id,
          lead_name: interview.lead_name,
          location_id: interview.location_id,
          api_key: interview.api_key,
          action: action,
          timestamp: new Date().toISOString()
        })
      });

      if (!webhookResponse.ok) {
        console.warn('Webhook retornou erro, mas Supabase foi atualizado');
      }

      // 4. Atualizar estado local
      setInterviews(prev => prev.map(i => 
        i.id === id 
          ? { ...i, status: 'clicked' as const, click_action: action, clicked_at: new Date().toISOString() }
          : i
      ));

      return true;
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      return false;
    }
  }, [interviews]);

  // Calcular métricas
  const metrics = {
    pending: interviews.filter(i => i.status === 'pending' || i.status === 'sent').length,
    compareceu: interviews.filter(i => i.click_action === 'realizada').length,
    no_show: interviews.filter(i => i.click_action === 'no_show').length,
    sem_interesse: interviews.filter(i => i.click_action === 'sem_interesse').length,
    total: interviews.length
  };

  // Fetch inicial
  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notification_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_queue',
          filter: locationId ? `location_id=eq.${locationId}` : undefined
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchInterviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, fetchInterviews]);

  return {
    interviews,
    loading,
    error,
    refetch: fetchInterviews,
    updateStatus,
    metrics
  };
};
