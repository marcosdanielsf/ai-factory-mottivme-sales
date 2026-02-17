import { useEffect, useState, useCallback } from 'react';
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

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('aios_tasks')
      .select('*')
      .order('created_at');

    if (filters?.story_id) {
      query = query.eq('story_id', filters.story_id);
    }

    if (filters?.phase_id) {
      query = query.eq('phase_id', filters.phase_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: result, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setData(result ?? []);
    }

    setLoading(false);
  }, [filters?.story_id, filters?.phase_id, filters?.status]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
