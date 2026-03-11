import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface ImobLeadPerfil {
  id: string;
  location_id: string;
  lead_id: string | null;
  contact_id: string | null;
  tipo_interesse: string | null;
  bairros_interesse: string[] | null;
  faixa_valor_min: number | null;
  faixa_valor_max: number | null;
  quartos_min: number | null;
  aceita_financiamento: boolean | null;
  urgencia: string | null;
  score_match: number | null;
  observacoes: string | null;
  created_at: string;
}

type UpdateLeadPerfilInput = Partial<Omit<ImobLeadPerfil, 'id' | 'created_at'>>;

export const useImobLeads = (locationId?: string | null) => {
  const [leads, setLeads] = useState<ImobLeadPerfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!isSupabaseConfigured() || !locationId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('imob_leads_perfil')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setLeads((data || []) as ImobLeadPerfil[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar leads';
      setError(msg);
      console.error('[useImobLeads Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadPerfil = useCallback(async (id: string, updates: UpdateLeadPerfilInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('imob_leads_perfil')
      .update(updates)
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    updateLeadPerfil,
  };
};
