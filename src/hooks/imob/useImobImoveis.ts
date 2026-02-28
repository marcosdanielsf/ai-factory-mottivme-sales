import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface Imovel {
  id: string;
  client_id: string | null;
  location_id: string;
  codigo: string | null;
  titulo: string;
  tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural';
  finalidade: 'venda' | 'aluguel' | 'temporada';
  status: 'disponivel' | 'reservado' | 'vendido' | 'suspenso';
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  condominio: string | null;
  endereco: string | null;
  area_total: number | null;
  area_construida: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas_garagem: number | null;
  valor_venda: number | null;
  valor_aluguel: number | null;
  valor_condominio: number | null;
  aceita_financiamento: boolean;
  aceita_permuta: boolean;
  fotos_urls: string[] | null;
  video_url: string | null;
  tour_360_url: string | null;
  proprietario_nome: string | null;
  proprietario_telefone: string | null;
  destaque: boolean;
  views_count: number;
  leads_count: number;
  created_at: string;
  updated_at: string;
}

export interface ImoveisFilters {
  tipo?: string;
  finalidade?: string;
  status?: string;
  bairro?: string;
  valor_min?: number;
  valor_max?: number;
}

export interface ImoveisStats {
  total: number;
  disponiveis: number;
  vendidos: number;
  valor_medio: number;
}

type CreateImovelInput = Omit<Imovel, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'leads_count'>;
type UpdateImovelInput = Partial<Omit<Imovel, 'id' | 'created_at' | 'updated_at'>>;

export const useImobImoveis = (locationId?: string | null) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ImoveisStats>({ total: 0, disponiveis: 0, vendidos: 0, valor_medio: 0 });

  const fetchImoveis = useCallback(async (filters?: ImoveisFilters) => {
    if (!isSupabaseConfigured() || !locationId) {
      setImoveis([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('imob_imoveis')
        .select('*')
        .eq('location_id', locationId)
        .neq('status', 'suspenso')
        .order('created_at', { ascending: false });

      if (filters?.tipo) query = query.eq('tipo', filters.tipo);
      if (filters?.finalidade) query = query.eq('finalidade', filters.finalidade);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.bairro) query = query.ilike('bairro', `%${filters.bairro}%`);
      if (filters?.valor_min) {
        query = query.or(`valor_venda.gte.${filters.valor_min},valor_aluguel.gte.${filters.valor_min}`);
      }
      if (filters?.valor_max) {
        query = query.or(`valor_venda.lte.${filters.valor_max},valor_aluguel.lte.${filters.valor_max}`);
      }

      const { data, error: err } = await query;
      if (err) throw new Error(err.message);

      const list = (data || []) as Imovel[];
      setImoveis(list);

      const disponiveis = list.filter(i => i.status === 'disponivel').length;
      const vendidos = list.filter(i => i.status === 'vendido').length;
      const comValor = list.filter(i => i.valor_venda || i.valor_aluguel);
      const valor_medio = comValor.length
        ? comValor.reduce((acc, i) => acc + (i.valor_venda || i.valor_aluguel || 0), 0) / comValor.length
        : 0;

      setStats({ total: list.length, disponiveis, vendidos, valor_medio });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar imóveis';
      setError(msg);
      console.error('[useImobImoveis Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchImoveis();
  }, [fetchImoveis]);

  const createImovel = useCallback(async (input: CreateImovelInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { data, error: err } = await supabase
      .from('imob_imoveis')
      .insert(input)
      .select()
      .single();

    if (err) throw new Error(err.message);
    await fetchImoveis();
    return data as Imovel;
  }, [fetchImoveis]);

  const updateImovel = useCallback(async (id: string, updates: UpdateImovelInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('imob_imoveis')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchImoveis();
  }, [fetchImoveis]);

  const deleteImovel = useCallback(async (id: string) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('imob_imoveis')
      .update({ status: 'suspenso', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchImoveis();
  }, [fetchImoveis]);

  return {
    imoveis,
    loading,
    error,
    stats,
    fetchImoveis,
    createImovel,
    updateImovel,
    deleteImovel,
  };
};
