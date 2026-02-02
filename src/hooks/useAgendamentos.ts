import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Agendamento {
  id: string;
  scheduled_at: string | null;
  status: 'completed' | 'no_show' | 'booked' | string | null;
  fonte_do_lead_bposs: string | null;
  location_id: string | null;
  location_name?: string | null;
  contato_principal: string | null;
  celular_contato: string | null;
  created_at?: string;
}

export interface AgendamentosFilters {
  startDate?: Date;
  endDate?: Date;
  locationId?: string | null;
  origem?: 'trafego' | 'social_selling' | null;
  status?: 'completed' | 'no_show' | 'booked' | null;
  day?: string; // YYYY-MM-DD format for specific day filter
}

interface UseAgendamentosReturn {
  agendamentos: Agendamento[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

// Determina a origem com base no campo fonte_do_lead_bposs
export const getOrigem = (fonte: string | null): 'trafego' | 'social_selling' | null => {
  if (!fonte) return null;
  const lower = fonte.toLowerCase();
  if (lower.includes('tráfego') || lower.includes('trafego')) return 'trafego';
  if (lower.includes('prospecção') || lower.includes('prospeccao') || lower.includes('social')) return 'social_selling';
  return null;
};

export const useAgendamentos = (filters: AgendamentosFilters = {}): UseAgendamentosReturn => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAgendamentos = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('app_dash_principal')
        .select('*', { count: 'exact' })
        .not('scheduled_at', 'is', null);

      // Filtro por período
      if (filters.startDate) {
        query = query.gte('scheduled_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('scheduled_at', filters.endDate.toISOString());
      }

      // Filtro por dia específico
      if (filters.day) {
        const dayStart = new Date(filters.day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(filters.day);
        dayEnd.setHours(23, 59, 59, 999);
        query = query
          .gte('scheduled_at', dayStart.toISOString())
          .lte('scheduled_at', dayEnd.toISOString());
      }

      // Filtro por cliente
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      // Filtro por status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Filtro por origem
      if (filters.origem === 'trafego') {
        query = query.or('fonte_do_lead_bposs.ilike.%tráfego%,fonte_do_lead_bposs.ilike.%trafego%');
      } else if (filters.origem === 'social_selling') {
        query = query.or('fonte_do_lead_bposs.ilike.%prospecção%,fonte_do_lead_bposs.ilike.%prospeccao%,fonte_do_lead_bposs.ilike.%social%');
      }

      // Ordenação
      query = query.order('scheduled_at', { ascending: false });

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching agendamentos:', queryError);
        throw queryError;
      }

      setAgendamentos(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
      console.error('Error fetching agendamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [
    filters.startDate?.getTime(),
    filters.endDate?.getTime(),
    filters.locationId,
    filters.origem,
    filters.status,
    filters.day,
  ]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  return { agendamentos, loading, error, totalCount, refetch: fetchAgendamentos };
};

export default useAgendamentos;
