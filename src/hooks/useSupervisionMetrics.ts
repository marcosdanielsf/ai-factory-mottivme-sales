import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SupervisionMetricsData {
  total: number;
  no_response: number;
  by_status: Record<string, number>;
  by_client: Array<{
    client_name: string;
    total: number;
    converted: number;
    lost: number;
  }>;
  lost_reasons: Array<{
    reason: string;
    cnt: number;
  }>;
  by_responsavel: Array<{
    name: string;
    total: number;
    converted: number;
    scheduled: number;
    lost: number;
    no_response: number;
  }>;
}

interface UseSupervisionMetricsParams {
  locationId?: string | null;
  channel?: string | null;
  daysBack?: number | null;
}

interface UseSupervisionMetricsReturn {
  data: SupervisionMetricsData | null;
  loading: boolean;
  error: string | null;
  refetch: (params?: UseSupervisionMetricsParams) => void;
}

export const useSupervisionMetrics = (
  params?: UseSupervisionMetricsParams
): UseSupervisionMetricsReturn => {
  const [data, setData] = useState<SupervisionMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(
    async (overrideParams?: UseSupervisionMetricsParams) => {
      try {
        setLoading(true);
        setError(null);

        const p = overrideParams ?? params ?? {};

        const { data: result, error: rpcError } = await supabase.rpc(
          'get_supervision_metrics',
          {
            p_location_id: p.locationId ?? null,
            p_channel: p.channel ?? null,
            p_days_back: p.daysBack ?? null,
          }
        );

        if (rpcError) throw rpcError;

        setData(result as SupervisionMetricsData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar metricas';
        console.error('[useSupervisionMetrics] Error:', err);
        setError(message);
        // Fallback gracioso: data permanece null para que o componente use calculo client-side
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params?.locationId, params?.channel, params?.daysBack]
  );

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refetch: fetchMetrics };
};
