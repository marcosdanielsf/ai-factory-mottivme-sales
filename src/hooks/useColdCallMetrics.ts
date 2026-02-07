import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ColdCallDailyData {
  date: string;
  totalCalls: number;
  answered: number;
  scheduled: number;
  avgDuration: number;
}

export interface ColdCallMetricsAggregated {
  totalCalls: number;
  answered: number;
  connected: number;
  scheduled: number;
  avgDuration: number;
  conversionRate: number;
  dailyData: ColdCallDailyData[];
}

interface ColdCallMetricRow {
  location_id: string | null;
  // View columns are in Portuguese
  dia: string;
  total_chamadas: number;
  agendamentos: number;
  interessados: number;
  nao_atenderam: number;
  recusaram: number;
  caixa_postal: number;
  erros: number;
  taxa_agendamento_pct: number;
  duracao_media_seg: number;
}

export interface ColdCallMetricsFilters {
  locationId?: string;
  dateRange?: { from: Date; to: Date };
}

interface UseColdCallMetricsReturn {
  metrics: ColdCallMetricsAggregated;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_METRICS: ColdCallMetricsAggregated = {
  totalCalls: 0,
  answered: 0,
  connected: 0,
  scheduled: 0,
  avgDuration: 0,
  conversionRate: 0,
  dailyData: [],
};

export function useColdCallMetrics(filters?: ColdCallMetricsFilters): UseColdCallMetricsReturn {
  const [metrics, setMetrics] = useState<ColdCallMetricsAggregated>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cold_call_metrics')
        .select('*')
        .order('dia', { ascending: true });

      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      if (filters?.dateRange?.from) {
        query = query.gte('dia', filters.dateRange.from.toISOString().split('T')[0]);
      }

      if (filters?.dateRange?.to) {
        query = query.lte('dia', filters.dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching cold call metrics:', queryError);
        throw queryError;
      }

      const rows = (data as ColdCallMetricRow[]) || [];

      // Agregar totais
      let totalCalls = 0;
      let totalAnswered = 0;
      let totalConnected = 0;
      let totalScheduled = 0;
      let durationSum = 0;
      let durationCount = 0;

      const dailyData: ColdCallDailyData[] = rows.map((row) => {
        totalCalls += row.total_chamadas || 0;
        totalAnswered += (row.total_chamadas || 0) - (row.nao_atenderam || 0) - (row.erros || 0);
        totalConnected += (row.total_chamadas || 0) - (row.nao_atenderam || 0);
        totalScheduled += row.agendamentos || 0;

        if (row.duracao_media_seg > 0) {
          durationSum += row.duracao_media_seg * (row.total_chamadas || 1);
          durationCount += row.total_chamadas || 1;
        }

        return {
          date: row.dia,
          totalCalls: row.total_chamadas || 0,
          answered: (row.total_chamadas || 0) - (row.nao_atenderam || 0),
          scheduled: row.agendamentos || 0,
          avgDuration: row.duracao_media_seg || 0,
        };
      });

      const avgDuration = durationCount > 0
        ? Math.round(durationSum / durationCount)
        : 0;

      const conversionRate = totalCalls > 0
        ? parseFloat(((totalScheduled / totalCalls) * 100).toFixed(1))
        : 0;

      setMetrics({
        totalCalls,
        answered: totalAnswered,
        connected: totalConnected,
        scheduled: totalScheduled,
        avgDuration,
        conversionRate,
        dailyData,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar métricas de cold call';
      console.error('Error in useColdCallMetrics:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.locationId,
    filters?.dateRange?.from?.getTime(),
    filters?.dateRange?.to?.getTime(),
  ]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
