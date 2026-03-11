import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FilterOption } from '../types/supervision';
import { getErrorMessage } from "../lib/getErrorMessage";

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

      // Buscar filter options e ghl_locations em paralelo
      const [filterRes, locationsRes] = await Promise.all([
        supabase.from('vw_filter_options').select('*'),
        supabase.from('ghl_locations').select('location_id, location_name').order('location_name'),
      ]);

      if (filterRes.error) throw filterRes.error;

      // Criar mapa location_id → location_name
      const locationNameMap = new Map<string, string>();
      if (locationsRes.data) {
        locationsRes.data.forEach((loc) => {
          locationNameMap.set(loc.location_id, loc.location_name);
        });
      }

      if (filterRes.data) {
        // Enriquecer locations com nomes da ghl_locations e deduplicar por location_id
        const rawLocations = filterRes.data.filter((o) => o.filter_type === 'location');
        const locationMap = new Map<string, FilterOption>();

        // Primeiro: locations da view (tem count real)
        rawLocations.forEach((loc) => {
          const id = loc.value;
          const existing = locationMap.get(id);
          if (existing) {
            // Somar counts de duplicatas
            existing.count = (existing.count || 0) + (loc.count || 0);
          } else {
            locationMap.set(id, {
              ...loc,
              label: locationNameMap.get(id) || loc.label || id,
            });
          }
        });

        // Segundo: ghl_locations sem conversas (count 0)
        if (locationsRes.data) {
          locationsRes.data.forEach((loc) => {
            if (!locationMap.has(loc.location_id)) {
              locationMap.set(loc.location_id, {
                filter_type: 'location',
                value: loc.location_id,
                label: loc.location_name,
                count: 0,
              });
            }
          });
        }

        const locations = Array.from(locationMap.values());
        const channels = filterRes.data.filter((o) => o.filter_type === 'channel');
        const etapasFunil = filterRes.data.filter((o) => o.filter_type === 'etapa_funil');
        const responsaveis = filterRes.data.filter((o) => o.filter_type === 'responsavel');

        setOptions({
          locations: locations.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
          channels: channels.sort((a, b) => (b.count || 0) - (a.count || 0)),
          etapasFunil: etapasFunil.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
          responsaveis: responsaveis.sort((a, b) => (a.label || '').localeCompare(b.label || '')),
        });
      }
    } catch (err: unknown) {
      console.error('Error fetching filter options:', err);
      setError(getErrorMessage(err) || 'Erro ao carregar opcoes de filtro');

      // Fallback com dados estaticos se a view nao existir
      if (getErrorMessage(err)?.includes('does not exist')) {
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
