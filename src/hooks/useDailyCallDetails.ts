import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ColdCallLog } from './useColdCalls';

interface UseDailyCallDetailsReturn {
  calls: ColdCallLog[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar detalhes das chamadas de um dia específico
 * @param date - Data no formato "YYYY-MM-DD" (ex: "2026-02-08")
 */
export function useDailyCallDetails(date: string | null): UseDailyCallDetailsReturn {
  const [calls, setCalls] = useState<ColdCallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyCalls = useCallback(async () => {
    if (!date) {
      setCalls([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construir range do dia (00:00 até 23:59) no timezone America/Sao_Paulo
      const startOfDay = `${date}T00:00:00-03:00`;
      const endOfDay = `${date}T23:59:59.999-03:00`;

      const { data, error: queryError } = await supabase
        .from('cold_call_logs')
        .select('*')
        .gte('started_at', startOfDay)
        .lte('started_at', endOfDay)
        .order('started_at', { ascending: true });

      if (queryError) {
        console.error('Error fetching daily call details:', queryError);
        throw queryError;
      }

      setCalls((data as ColdCallLog[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhes do dia';
      console.error('Error in useDailyCallDetails:', err);
      setError(message);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDailyCalls();
  }, [fetchDailyCalls]);

  return { calls, loading, error, refetch: fetchDailyCalls };
}
