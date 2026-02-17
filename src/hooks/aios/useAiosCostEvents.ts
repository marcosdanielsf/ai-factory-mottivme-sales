import { useEffect, useState, useCallback } from 'react';
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

  const fetchCostEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('aios_cost_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id);
    }

    if (filters?.story_id) {
      query = query.eq('story_id', filters.story_id);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data: result, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setData(result ?? []);
    }

    setLoading(false);
  }, [filters?.agent_id, filters?.story_id, filters?.date_from, filters?.date_to]);

  useEffect(() => {
    fetchCostEvents();
  }, [fetchCostEvents]);

  const totalCost = data.reduce((sum, event) => sum + (event.cost ?? 0), 0);
  const totalTokens = data.reduce((sum, event) => sum + (event.input_tokens ?? 0) + (event.output_tokens ?? 0), 0);

  return { data, loading, error, refetch: fetchCostEvents, totalCost, totalTokens };
}
