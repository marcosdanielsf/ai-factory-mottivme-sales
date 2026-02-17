import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosStoryPhase {
  id: string;
  story_id: string;
  name: string;
  description: string | null;
  phase_order: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface UseAiosStoryPhasesReturn {
  data: AiosStoryPhase[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAiosStoryPhases(
  storyId: string | undefined
): UseAiosStoryPhasesReturn {
  const [data, setData] = useState<AiosStoryPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    if (!storyId) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: result, error: fetchError } = await supabase
      .from('aios_story_phases')
      .select('*')
      .eq('story_id', storyId)
      .order('phase_order');

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setData(result ?? []);
    }

    setLoading(false);
  }, [storyId]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  return { data, loading, error, refetch: fetchPhases };
}
