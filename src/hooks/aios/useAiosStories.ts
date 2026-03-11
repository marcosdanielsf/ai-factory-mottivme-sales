import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosStory {
  id: string;
  title: string;
  description: string | null;
  status: string;
  squad_id: string | null;
  priority: string | null;
  assigned_agent_id: string | null;
  progress: number;
  total_phases: number;
  completed_phases: number;
  total_cost: number;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface CreateStoryInput {
  title: string;
  description?: string;
  status?: string;
  squad_id?: string;
  priority?: string;
  assigned_agent_id?: string;
}

interface UpdateStoryInput extends Partial<CreateStoryInput> {
  id: string;
}

interface UseAiosStoriesReturn {
  data: AiosStory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createStory: (input: CreateStoryInput) => Promise<AiosStory | null>;
  updateStory: (input: UpdateStoryInput) => Promise<AiosStory | null>;
  updateStoryStatus: (id: string, status: string) => Promise<AiosStory | null>;
}

export function useAiosStories(
  filters?: { status?: string; squad_id?: string }
): UseAiosStoriesReturn {
  const [data, setData] = useState<AiosStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const statusFilter = filters?.status;
  const squadFilter = filters?.squad_id;

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('aios_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (squadFilter) {
        query = query.eq('squad_id', squadFilter);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        console.warn('[useAiosStories] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      console.error('[useAiosStories] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, squadFilter]);

  useEffect(() => {
    if (!statusFilter && !squadFilter) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    fetchStories();
  }, [fetchStories, statusFilter, squadFilter]);

  const createStory = useCallback(async (input: CreateStoryInput): Promise<AiosStory | null> => {
    const { data: result, error: createError } = await supabase
      .from('aios_stories')
      .insert(input)
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    await fetchStories();
    return result;
  }, [fetchStories]);

  const updateStory = useCallback(async ({ id, ...input }: UpdateStoryInput): Promise<AiosStory | null> => {
    const { data: result, error: updateError } = await supabase
      .from('aios_stories')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetchStories();
    return result;
  }, [fetchStories]);

  const updateStoryStatus = useCallback(async (id: string, status: string): Promise<AiosStory | null> => {
    const { data: result, error: updateError } = await supabase
      .from('aios_stories')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetchStories();
    return result;
  }, [fetchStories]);

  return { data, loading, error, refetch: fetchStories, createStory, updateStory, updateStoryStatus };
}
