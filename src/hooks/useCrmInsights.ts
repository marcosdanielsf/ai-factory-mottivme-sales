import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CrmInsightLead {
  id: number;
  lead_id: string;
  full_name: string | null;
  fase_jornada: string | null;
  nivel_engajamento: string | null;
  total_mensagens: number | null;
  ultima_analise: string | null;
  resumo_perfil: string | null;
  pontos_dor_principais: string | null;
  estado: string | null;
  cidade: string | null;
  area_atuacao: string | null;
  nivel_renda: string | null;
  capacidade_investimento: string | null;
  created_at: string;
  updated_at: string;
}

interface UseCrmInsightsReturn {
  leads: CrmInsightLead[];
  loading: boolean;
  error: string | null;
  totalLeads: number;
  mediaMensagens: number;
  refetch: () => Promise<void>;
}

export const useCrmInsights = (): UseCrmInsightsReturn => {
  const [leads, setLeads] = useState<CrmInsightLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all decisao/alto leads — normalizing casing client-side
      // because the table has mixed casing (decisao, Decisão, alto, Alto)
      const { data, error: queryError } = await supabase
        .from('crm_leads_insights')
        .select(
          'id, lead_id, full_name, fase_jornada, nivel_engajamento, total_mensagens, ultima_analise, resumo_perfil, pontos_dor_principais, estado, cidade, area_atuacao, nivel_renda, capacidade_investimento, created_at, updated_at'
        )
        .order('total_mensagens', { ascending: false })
        .limit(500);

      if (queryError) throw queryError;

      // Normalize and filter client-side to handle mixed casing (decisao/Decisão, alto/Alto)
      const normalize = (v: string | null) =>
        (v || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      const filtered = (data || []).filter(
        (row: any) =>
          normalize(row.fase_jornada) === 'decisao' &&
          normalize(row.nivel_engajamento) === 'alto'
      );

      setLeads(filtered);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar insights CRM');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalLeads = leads.length;
  const mediaMensagens =
    totalLeads > 0
      ? Math.round(
          leads.reduce((sum, l) => sum + (l.total_mensagens || 0), 0) / totalLeads
        )
      : 0;

  return { leads, loading, error, totalLeads, mediaMensagens, refetch: fetchLeads };
};
