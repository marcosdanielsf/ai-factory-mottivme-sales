import { useEffect, useState, useCallback } from 'react';
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

interface AiosQaLoop {
  loop_index: number;
  executions: AiosAgentExecution[];
  total_tokens: number;
  total_cost: number;
  status: string;
  started_at: string;
  completed_at: string | null;
}

interface UseAiosQaLoopsReturn {
  data: AiosQaLoop[];
  rawExecutions: AiosAgentExecution[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  totalLoops: number;
  failedLoops: number;
}

export function useAiosQaLoops(
  storyId: string | undefined
): UseAiosQaLoopsReturn {
  const [rawExecutions, setRawExecutions] = useState<AiosAgentExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    if (!storyId) {
      setRawExecutions([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: result, error: fetchError } = await supabase
      .from('aios_agent_executions')
      .select('*')
      .eq('story_id', storyId)
      .order('started_at');

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRawExecutions(result ?? []);
    }

    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const qaLoops = buildQaLoops(rawExecutions);

  return {
    data: qaLoops,
    rawExecutions,
    loading,
    error,
    refetch: fetchExecutions,
    totalLoops: qaLoops.length,
    failedLoops: qaLoops.filter(l => l.status === 'failed').length,
  };
}

function buildQaLoops(executions: AiosAgentExecution[]): AiosQaLoop[] {
  if (executions.length === 0) return [];

  const loops: AiosQaLoop[] = [];
  let currentLoop: AiosAgentExecution[] = [];
  let loopIndex = 0;

  for (const execution of executions) {
    currentLoop.push(execution);

    const isQaBoundary =
      execution.status === 'failed' ||
      execution.status === 'completed' ||
      (execution.result && typeof execution.result === 'object' && 'qa_result' in execution.result);

    if (isQaBoundary) {
      const totalTokens = currentLoop.reduce((sum, e) => sum + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0);
      const totalCost = currentLoop.reduce((sum, e) => sum + (e.cost ?? 0), 0);
      const hasFailure = currentLoop.some(e => e.status === 'failed');
      const lastExecution = currentLoop[currentLoop.length - 1];

      loops.push({
        loop_index: loopIndex,
        executions: [...currentLoop],
        total_tokens: totalTokens,
        total_cost: totalCost,
        status: hasFailure ? 'failed' : 'completed',
        started_at: currentLoop[0].started_at,
        completed_at: lastExecution.completed_at,
      });

      loopIndex++;
      currentLoop = [];
    }
  }

  if (currentLoop.length > 0) {
    const totalTokens = currentLoop.reduce((sum, e) => sum + (e.input_tokens ?? 0) + (e.output_tokens ?? 0), 0);
    const totalCost = currentLoop.reduce((sum, e) => sum + (e.cost ?? 0), 0);
    const lastExecution = currentLoop[currentLoop.length - 1];

    loops.push({
      loop_index: loopIndex,
      executions: [...currentLoop],
      total_tokens: totalTokens,
      total_cost: totalCost,
      status: 'in_progress',
      started_at: currentLoop[0].started_at,
      completed_at: lastExecution.completed_at,
    });
  }

  return loops;
}
