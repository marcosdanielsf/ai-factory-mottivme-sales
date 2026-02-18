import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AiosContextHealth, AiosContextEntityType } from '../../types/aios';

interface UseAiosContextHealthReturn {
  data: AiosContextHealth[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  refreshHealth: () => Promise<void>;
  updateHealthScore: (id: string, score: number, notes?: string) => Promise<boolean>;
  criticalCount: number;
}

export function useAiosContextHealth(
  filterType?: AiosContextEntityType | 'all',
  filterHealth?: 'all' | 'saudavel' | 'atencao' | 'critico'
): UseAiosContextHealthReturn {
  const [data, setData] = useState<AiosContextHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('aios_context_health')
      .select('*')
      .order('health_score', { ascending: true });

    if (filterType && filterType !== 'all') {
      query = query.eq('entity_type', filterType);
    }

    if (filterHealth && filterHealth !== 'all') {
      if (filterHealth === 'saudavel') {
        query = query.gte('health_score', 80);
      } else if (filterHealth === 'atencao') {
        query = query.gte('health_score', 50).lt('health_score', 80);
      } else if (filterHealth === 'critico') {
        query = query.lt('health_score', 50);
      }
    }

    const { data: result, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setData(result ?? []);
    }

    setLoading(false);
  }, [filterType, filterHealth]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // refreshHealth: recalcula scores baseado em dados reais (ex: age of last_updated_at)
  const refreshHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Busca todos os registros para recalcular
    const { data: all, error: fetchError } = await supabase
      .from('aios_context_health')
      .select('*');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const updates: Promise<unknown>[] = [];

    for (const item of all ?? []) {
      const diffHours = (now - new Date(item.last_updated_at).getTime()) / 3600000;
      let newScore = item.health_score;

      // Penalizar scores de entidades sem atualização recente
      if (diffHours > 168) {
        // > 7 dias: penalidade severa
        newScore = Math.max(10, item.health_score - 20);
      } else if (diffHours > 72) {
        // > 3 dias: penalidade moderada
        newScore = Math.max(20, item.health_score - 10);
      } else if (diffHours > 24) {
        // > 1 dia: penalidade leve
        newScore = Math.max(30, item.health_score - 5);
      }

      if (newScore !== item.health_score) {
        updates.push(
          supabase
            .from('aios_context_health')
            .update({ health_score: newScore, last_updated_at: new Date().toISOString() })
            .eq('id', item.id)
        );
      }
    }

    await Promise.all(updates);
    await fetchHealth();
  }, [fetchHealth]);

  const updateHealthScore = useCallback(
    async (id: string, score: number, notes?: string): Promise<boolean> => {
      const clampedScore = Math.min(100, Math.max(0, score));

      const updateData: Record<string, unknown> = {
        health_score: clampedScore,
        last_updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('aios_context_health')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      await fetchHealth();
      return true;
    },
    [fetchHealth]
  );

  const criticalCount = data.filter((d) => d.health_score < 50).length;

  return {
    data,
    loading,
    error,
    refetch: fetchHealth,
    refreshHealth,
    updateHealthScore,
    criticalCount,
  };
}
