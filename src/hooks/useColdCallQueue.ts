import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────

export type QueueItemStatus = 'pending' | 'calling' | 'completed' | 'failed' | 'retry';

export interface ColdCallQueueItem {
  id: string;
  campaign_id: string;
  phone_number: string;
  lead_name: string | null;
  lead_context: string | null;
  status: QueueItemStatus;
  attempt: number;
  max_attempts: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  call_log_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface QueueStats {
  pending: number;
  calling: number;
  completed: number;
  failed: number;
  retry: number;
  total: number;
}

interface UseColdCallQueueReturn {
  queue: ColdCallQueueItem[];
  loading: boolean;
  error: string | null;
  stats: QueueStats;
  refetch: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useColdCallQueue(campaignId?: string): UseColdCallQueueReturn {
  const [queue, setQueue] = useState<ColdCallQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!campaignId) {
      setQueue([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('cold_call_queue')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (queryError) {
        console.error('Error fetching queue:', queryError);
        throw queryError;
      }

      setQueue((data as ColdCallQueueItem[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fila';
      console.error('Error in useColdCallQueue:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const stats = useMemo<QueueStats>(() => {
    const s: QueueStats = { pending: 0, calling: 0, completed: 0, failed: 0, retry: 0, total: queue.length };
    for (const item of queue) {
      if (item.status in s) {
        s[item.status as keyof Omit<QueueStats, 'total'>]++;
      }
    }
    return s;
  }, [queue]);

  return { queue, loading, error, stats, refetch: fetchQueue };
}
