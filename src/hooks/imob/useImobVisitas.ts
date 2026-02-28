import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface ImobVisita {
  id: string;
  location_id: string;
  imovel_id: string;
  lead_id: string | null;
  data_visita: string;
  status: 'agendada' | 'realizada' | 'cancelada' | 'reagendada';
  feedback: string | null;
  nota_visita: number | null;
  corretor: string | null;
  created_at: string;
}

export interface VisitasFilters {
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface VisitasStats {
  total: number;
  agendadas: number;
  realizadas: number;
  taxa_comparecimento: number;
}

type CreateVisitaInput = Omit<ImobVisita, 'id' | 'created_at'>;
type UpdateVisitaInput = Partial<Omit<ImobVisita, 'id' | 'created_at'>>;

export const useImobVisitas = (locationId?: string | null) => {
  const [visitas, setVisitas] = useState<ImobVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VisitasStats>({ total: 0, agendadas: 0, realizadas: 0, taxa_comparecimento: 0 });

  const fetchVisitas = useCallback(async (filters?: VisitasFilters) => {
    if (!isSupabaseConfigured() || !locationId) {
      setVisitas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('imob_visitas')
        .select('*')
        .eq('location_id', locationId)
        .order('data_visita', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.data_inicio) query = query.gte('data_visita', filters.data_inicio);
      if (filters?.data_fim) query = query.lte('data_visita', filters.data_fim);

      const { data, error: err } = await query;
      if (err) throw new Error(err.message);

      const list = (data || []) as ImobVisita[];
      setVisitas(list);

      const agendadas = list.filter(v => v.status === 'agendada').length;
      const realizadas = list.filter(v => v.status === 'realizada').length;
      const naoCancel = list.filter(v => v.status !== 'cancelada').length;
      const taxa_comparecimento = naoCancel > 0 ? Math.round((realizadas / naoCancel) * 100) : 0;

      setStats({ total: list.length, agendadas, realizadas, taxa_comparecimento });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar visitas';
      setError(msg);
      console.error('[useImobVisitas Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchVisitas();
  }, [fetchVisitas]);

  const createVisita = useCallback(async (input: CreateVisitaInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { data, error: err } = await supabase
      .from('imob_visitas')
      .insert(input)
      .select()
      .single();

    if (err) throw new Error(err.message);
    await fetchVisitas();
    return data as ImobVisita;
  }, [fetchVisitas]);

  const updateVisita = useCallback(async (id: string, updates: UpdateVisitaInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('imob_visitas')
      .update(updates)
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchVisitas();
  }, [fetchVisitas]);

  return {
    visitas,
    loading,
    error,
    stats,
    fetchVisitas,
    createVisita,
    updateVisita,
  };
};
