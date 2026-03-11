import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosAgentExecution {
  id: string;
  agent_id: string;
  story_id: string | null;
  task_id: string | null;
  status: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cost: number | null;
  model: string | null;
  error_message: string | null;
  result: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

interface UseAiosAgentExecutionsReturn {
  data: AiosAgentExecution[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAiosAgentExecutions(
  agentId?: string,
  limit = 50
): UseAiosAgentExecutionsReturn {
  const [data, setData] = useState<AiosAgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('aios_agent_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        console.warn('[useAiosAgentExecutions] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      console.error('[useAiosAgentExecutions] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, limit]);

  useEffect(() => {
    if (!agentId) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    fetchExecutions();
  }, [fetchExecutions, agentId]);

  return { data, loading, error, refetch: fetchExecutions };
}
