import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Agendamento {
  id: string;
  agendamento_data: string | null;
  scheduled_at?: string | null;
  status: 'completed' | 'no_show' | 'booked' | 'won' | 'lost' | string | null;
  fonte: string | null;
  fonte_do_lead_bposs?: string | null;
  location_id: string | null;
  responsavel_nome: string | null;
  lead_usuario_responsavel?: string | null;
  contato_nome: string | null;
  contato_principal?: string | null;
  contato_telefone: string | null;
  celular_contato?: string | null;
  contato_email: string | null;
  agendamento_tipo: string | null;
  tipo_do_agendamento?: string | null;
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

// Mapeia status do GHL (appoinmentStatus) para status do dashboard
function mapGhlStatus(rawPayload: any): string {
  const ghlStatus = rawPayload?.calendar?.appoinmentStatus?.toLowerCase?.() || '';
  if (ghlStatus === 'showed') return 'completed';
  if (ghlStatus === 'noshow' || ghlStatus === 'no_show') return 'no_show';
  if (ghlStatus === 'cancelled') return 'cancelled';
  return 'booked';
}

export const useAgendamentos = (filters: AgendamentosFilters = {}): UseAgendamentosReturn => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .from('appointments_log')
        .select('id, appointment_date, location_name, location_id, contact_name, contact_phone, contact_email, appointment_type, raw_payload, created_at')
        .limit(50000);

      // Filtro por período
      if (filters.startDate) {
        query = query.gte('appointment_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('appointment_date', filters.endDate.toISOString());
      }

      // Filtro por dia específico
      if (filters.day) {
        const dayStart = new Date(filters.day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(filters.day);
        dayEnd.setHours(23, 59, 59, 999);
        query = query
          .gte('appointment_date', dayStart.toISOString())
          .lte('appointment_date', dayEnd.toISOString());
      }

      // Filtro por responsável
      if (filters.responsavel) {
        query = query.eq('location_name', filters.responsavel);
      }

      // Filtro por location (multi-tenancy)
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      // Ordenação
      query = query.order('appointment_date', { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching agendamentos:', queryError);
        throw queryError;
      }

      setRawData(data || []);
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
    filters.locationId,
  ]);

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);

  // Dedup + map + filter client-side
  const { agendamentos, totalCount } = useMemo(() => {
    // Dedup by appointmentId (keep most recent)
    // Skip records without appointmentId — they are phantom/incomplete webhook entries
    const seen = new Map<string, any>();
    for (const item of rawData) {
      const appointmentId = item.raw_payload?.calendar?.appointmentId;
      if (!appointmentId) continue;
      const existing = seen.get(appointmentId);
      if (!existing || (item.created_at && (!existing.created_at || item.created_at > existing.created_at))) {
        seen.set(appointmentId, item);
      }
    }

    // Map to Agendamento interface and filter cancelled
    let mapped: Agendamento[] = [];
    for (const item of seen.values()) {
      const status = mapGhlStatus(item.raw_payload);
      if (status === 'cancelled') continue;

      mapped.push({
        id: item.id,
        agendamento_data: item.appointment_date,
        scheduled_at: item.appointment_date,
        status,
        fonte: null,
        fonte_do_lead_bposs: null,
        location_id: item.location_id,
        responsavel_nome: item.location_name,
        lead_usuario_responsavel: item.location_name,
        contato_nome: item.contact_name,
        contato_principal: item.contact_name,
        contato_telefone: item.contact_phone,
        celular_contato: item.contact_phone,
        contato_email: item.contact_email,
        agendamento_tipo: item.appointment_type,
        tipo_do_agendamento: item.appointment_type,
        data_criacao: item.created_at,
        source: 'realtime',
      });
    }

    // Apply status filter client-side (since status is mapped from raw_payload)
    if (filters.status) {
      mapped = mapped.filter(a => a.status === filters.status);
    }

    return { agendamentos: mapped, totalCount: mapped.length };
  }, [rawData, filters.status]);

  return { agendamentos, loading, error, totalCount, refetch: fetchAgendamentos };
};

export default useAgendamentos;
