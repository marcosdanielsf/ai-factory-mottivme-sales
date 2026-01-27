import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FilterOption } from '../types/supervision';

interface FilterOptionsState {
  locations: FilterOption[];
  channels: FilterOption[];
  etapasFunil: FilterOption[];
  responsaveis: FilterOption[];
}

interface UseFilterOptionsReturn {
  options: FilterOptionsState;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFilterOptions = (): UseFilterOptionsReturn => {
  const [options, setOptions] = useState<FilterOptionsState>({
    locations: [],
    channels: [],
    etapasFunil: [],
    responsaveis: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('vw_filter_options')
        .select('*');

      if (fetchError) throw fetchError;

      if (data) {
        const locations = data.filter((o) => o.filter_type === 'location');
        const channels = data.filter((o) => o.filter_type === 'channel');
        const etapasFunil = data.filter((o) => o.filter_type === 'etapa_funil');
        const responsaveis = data.filter((o) => o.filter_type === 'responsavel');

        setOptions({
          locations: locations.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
          channels: channels.sort((a, b) => (b.count || 0) - (a.count || 0)),
          etapasFunil: etapasFunil.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
          responsaveis: responsaveis.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
        });
      }
    } catch (err: any) {
      console.error('Error fetching filter options:', err);
      setError(err.message || 'Erro ao carregar opcoes de filtro');

      // Fallback com dados estaticos se a view nao existir
      if (err.message?.includes('does not exist')) {
        setOptions(getMockOptions());
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions,
  };
};

// Mock data para desenvolvimento
function getMockOptions(): FilterOptionsState {
  return {
    locations: [
      { filter_type: 'location', value: 'loc-1', label: 'Marina Couto', count: 45 },
      { filter_type: 'location', value: 'loc-2', label: 'Dr. Luiz Augusto', count: 32 },
      { filter_type: 'location', value: 'loc-3', label: 'Lappe Finances', count: 28 },
      { filter_type: 'location', value: 'loc-4', label: 'Instituto Amar', count: 21 },
      { filter_type: 'location', value: 'loc-5', label: 'Clinic Pro', count: 18 },
    ],
    channels: [
      { filter_type: 'channel', value: 'instagram', label: 'Instagram', count: 120 },
      { filter_type: 'channel', value: 'whatsapp', label: 'WhatsApp', count: 85 },
      { filter_type: 'channel', value: 'sms', label: 'SMS', count: 15 },
    ],
    etapasFunil: [
      { filter_type: 'etapa_funil', value: 'novo', label: 'Novo', count: 45 },
      { filter_type: 'etapa_funil', value: 'qualificado', label: 'Qualificado', count: 30 },
      { filter_type: 'etapa_funil', value: 'proposta', label: 'Proposta', count: 18 },
      { filter_type: 'etapa_funil', value: 'negociacao', label: 'Negociacao', count: 12 },
      { filter_type: 'etapa_funil', value: 'fechado', label: 'Fechado', count: 8 },
    ],
    responsaveis: [
      { filter_type: 'responsavel', value: 'maria', label: 'Maria Silva', count: 35 },
      { filter_type: 'responsavel', value: 'joao', label: 'Joao Santos', count: 28 },
      { filter_type: 'responsavel', value: 'ana', label: 'Ana Paula', count: 22 },
    ],
  };
}
