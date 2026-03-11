import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type ColdCallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'no_answer';
export type ColdCallOutcome = 'agendou' | 'interessado' | 'nao_atendeu' | 'recusou' | 'caixa_postal' | 'erro';

export interface ColdCallLog {
  id: string;
  call_id: string | null;
  contact_id: string | null;
  location_id: string | null;
  phone: string | null;
  lead_name: string | null;
  status: ColdCallStatus;
  outcome: ColdCallOutcome | null;
  duration_seconds: number | null;
  transcript: string | null;
  prompt_used: string | null;
  attempt_number: number | null;
  next_action: string | null;
  cost_usd: number | null;
  cost_breakdown: Record<string, unknown> | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ColdCallFilters {
  status?: string;
  outcome?: string;
  dateRange?: { from: Date; to: Date };
  locationId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface UseColdCallsReturn {
  calls: ColdCallLog[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

export function useColdCalls(filters?: ColdCallFilters): UseColdCallsReturn {
  const [calls, setCalls] = useState<ColdCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;

      let query = supabase
        .from('cold_call_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filtros dinâmicos
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.outcome) {
        query = query.eq('outcome', filters.outcome);
      }

      if (filters?.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      if (filters?.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString());
      }

      if (filters?.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString());
      }

      if (filters?.search) {
        query = query.or(
          `lead_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,call_id.ilike.%${filters.search}%`
        );
      }

      // Paginação
      query = query.range(offset, offset + limit - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching cold calls:', queryError);
        throw queryError;
      }

      setCalls((data as ColdCallLog[]) || []);
      setTotal(count ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cold calls';
      console.error('Error in useColdCalls:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    filters?.status,
    filters?.outcome,
    filters?.locationId,
    filters?.dateRange?.from?.getTime(),
    filters?.dateRange?.to?.getTime(),
    filters?.search,
    filters?.limit,
    filters?.offset,
  ]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return { calls, loading, error, total, refetch: fetchCalls };
}
