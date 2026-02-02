import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Usa a VIEW unificada que combina histórico + realtime
const AGENDAMENTOS_VIEW = 'vw_agendamentos_unified';

export interface Agendamento {
  id: string;
  agendamento_data: string | null;
  scheduled_at?: string | null; // alias para compatibilidade
  status: 'completed' | 'no_show' | 'booked' | 'won' | 'lost' | string | null;
  fonte: string | null;
  fonte_do_lead_bposs?: string | null; // alias
  location_id: string | null;
  responsavel_nome: string | null;
  lead_usuario_responsavel?: string | null; // alias
  contato_nome: string | null;
  contato_principal?: string | null; // alias
  contato_telefone: string | null;
  celular_contato?: string | null; // alias
  contato_email: string | null;
  agendamento_tipo: string | null;
  tipo_do_agendamento?: string | null; // alias
  data_criacao?: string;
  source: 'historico' | 'realtime';
}

export interface AgendamentosFilters {
  startDate?: Date;
  endDate?: Date;
  responsavel?: string | null;
  locationId?: string | null;
  origem?: 'trafego' | 'social_selling' | null;
  status?: 'completed' | 'no_show' | 'booked' | null;
  day?: string;
}

interface UseAgendamentosReturn {
  agendamentos: Agendamento[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

// Determina a origem com base no campo fonte
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
        .from(AGENDAMENTOS_VIEW)
        .select('*', { count: 'exact' });

      // Filtro por período
      if (filters.startDate) {
        query = query.gte('agendamento_data', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('agendamento_data', filters.endDate.toISOString());
      }

      // Filtro por dia específico
      if (filters.day) {
        const dayStart = new Date(filters.day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(filters.day);
        dayEnd.setHours(23, 59, 59, 999);
        query = query
          .gte('agendamento_data', dayStart.toISOString())
          .lte('agendamento_data', dayEnd.toISOString());
      }

      // Filtro por responsável
      if (filters.responsavel) {
        query = query.eq('responsavel_nome', filters.responsavel);
      }

      // Filtro por status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Filtro por origem
      if (filters.origem === 'trafego') {
        query = query.or('fonte.ilike.%tráfego%,fonte.ilike.%trafego%');
      } else if (filters.origem === 'social_selling') {
        query = query.or('fonte.ilike.%prospecção%,fonte.ilike.%prospeccao%,fonte.ilike.%social%');
      }

      // Ordenação
      query = query.order('agendamento_data', { ascending: false });

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching agendamentos:', queryError);
        throw queryError;
      }

      // Mapear dados para incluir aliases para compatibilidade
      const mappedData = (data || []).map(item => ({
        ...item,
        scheduled_at: item.agendamento_data,
        fonte_do_lead_bposs: item.fonte,
        lead_usuario_responsavel: item.responsavel_nome,
        contato_principal: item.contato_nome,
        celular_contato: item.contato_telefone,
        tipo_do_agendamento: item.agendamento_tipo,
      }));

      setAgendamentos(mappedData);
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
    filters.responsavel,
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
