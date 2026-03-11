import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosCostEvent {
  id: string;
  agent_id: string | null;
  story_id: string | null;
  execution_id: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost: number | null;
  event_type: string | null;
  created_at: string;
}

interface UseAiosCostEventsReturn {
  data: AiosCostEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  totalCost: number;
  totalTokens: number;
}

const FETCH_TIMEOUT_MS = 8000;

export function useAiosCostEvents(
  filters?: {
    agent_id?: string;
    story_id?: string;
    date_from?: string;
    date_to?: string;
  }
): UseAiosCostEventsReturn {
  const [data, setData] = useState<AiosCostEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const agentId = filters?.agent_id;
  const storyId = filters?.story_id;
  const dateFrom = filters?.date_from;
  const dateTo = filters?.date_to;

  const fetchCostEvents = useCallback(async () => {
    // Cancelar request anterior se ainda estiver pendente
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    // Timeout para evitar requests pendentes indefinidos
    const timeoutId = setTimeout(() => {
      abortRef.current?.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      let query = supabase
        .from('aios_cost_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      if (storyId) {
        query = query.eq('story_id', storyId);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        // Tabela nao existe ou sem permissao — graceful fallback com dados vazios
        console.warn('[useAiosCostEvents] Tabela indisponivel:', fetchError.message);
        setData([]);
        // Nao setar error pra evitar re-render em cascata
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      // AbortError e esperado — nao logar como erro
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('[useAiosCostEvents] Erro:', err.message);
        setData([]);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [agentId, storyId, dateFrom, dateTo]);

  useEffect(() => {
    // Guard: se nao ha filtros dinamicos, executar apenas uma vez
    if (!agentId && !storyId && !dateFrom && !dateTo) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }

    fetchCostEvents();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchCostEvents, agentId, storyId, dateFrom, dateTo]);

  const totalCost = data.reduce((sum, event) => sum + (event.cost ?? 0), 0);
  const totalTokens = data.reduce(
    (sum, event) => sum + (event.input_tokens ?? 0) + (event.output_tokens ?? 0),
    0
  );

  return { data, loading, error, refetch: fetchCostEvents, totalCost, totalTokens };
}
