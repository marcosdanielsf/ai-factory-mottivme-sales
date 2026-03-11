import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PendingRetry {
  id: string;
  call_id: string | null;
  contact_id: string | null;
  location_id: string | null;
  phone: string | null;
  lead_name: string | null;
  status: string;
  outcome: string | null;
  attempt_number: number | null;
  next_action: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

interface UsePendingRetriesReturn {
  retries: PendingRetry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePendingRetries(): UsePendingRetriesReturn {
  const [retries, setRetries] = useState<PendingRetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_pending_retries');

      if (rpcError) {
        console.error('Error fetching pending retries:', rpcError);
        throw rpcError;
      }

      setRetries((data as PendingRetry[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar retentativas pendentes';
      console.error('Error in usePendingRetries:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRetries();
  }, [fetchRetries]);

  return { retries, loading, error, refetch: fetchRetries };
}
