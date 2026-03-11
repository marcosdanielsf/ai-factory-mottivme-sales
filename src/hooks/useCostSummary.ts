import { useEffect, useState, useCallback } from 'react';

export interface CostBreakdown {
  stt: number;
  llm: number;
  tts: number;
  telephony: number;
}

export interface CostDaily {
  date: string;
  calls: number;
  cost: number;
  avg_cost: number;
}

export interface CostSummary {
  period_days: number;
  total_calls: number;
  total_cost: number;
  avg_cost_per_call: number;
  breakdown: CostBreakdown;
  daily: CostDaily[];
}

interface UseCostSummaryReturn {
  data: CostSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCostSummary(days: number = 30): UseCostSummaryReturn {
  const [data, setData] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCostSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_PIPECAT_API_URL || '/cold-call-api';

      const url = `${baseUrl}/costs/summary?days=${days}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result as CostSummary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar resumo de custos';
      console.error('Error in useCostSummary:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchCostSummary();

    // Auto-refresh a cada 60s
    const interval = setInterval(() => {
      fetchCostSummary();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchCostSummary]);

  return { data, loading, error, refetch: fetchCostSummary };
}
