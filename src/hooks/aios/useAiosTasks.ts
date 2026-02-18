import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosTask {
  id: string;
  story_id: string;
  phase_id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_agent_id: string | null;
  result: Record<string, unknown> | null;
  cost: number;
  completed_at: string | null;
  created_at: string;
}

interface CreateTaskInput {
  title: string;
  story_id?: string;
  phase_id?: string;
  description?: string;
  status?: string;
  assigned_agent_id?: string;
}

interface UseAiosTasksReturn {
  data: AiosTask[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTask: (input: CreateTaskInput) => Promise<AiosTask | null>;
  updateTaskStatus: (id: string, status: string) => Promise<AiosTask | null>;
}

export function useAiosTasks(
  filters?: { story_id?: string; phase_id?: string; status?: string }
): UseAiosTasksReturn {
  const [data, setData] = useState<AiosTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const storyId = filters?.story_id;
  const phaseId = filters?.phase_id;
  const statusFilter = filters?.status;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('aios_tasks')
        .select('*')
        .order('created_at');

      if (storyId) {
        query = query.eq('story_id', storyId);
      }

      if (phaseId) {
        query = query.eq('phase_id', phaseId);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        console.warn('[useAiosTasks] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      console.error('[useAiosTasks] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [storyId, phaseId, statusFilter]);

  useEffect(() => {
    if (!storyId && !phaseId && !statusFilter) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    fetchTasks();
  }, [fetchTasks, storyId, phaseId, statusFilter]);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<AiosTask | null> => {
    const { data: result, error: createError } = await supabase
      .from('aios_tasks')
      .insert(input)
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    await fetchTasks();
    return result;
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (id: string, status: string): Promise<AiosTask | null> => {
    const { data: result, error: updateError } = await supabase
      .from('aios_tasks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetchTasks();
    return result;
  }, [fetchTasks]);

  return { data, loading, error, refetch: fetchTasks, createTask, updateTaskStatus };
}
