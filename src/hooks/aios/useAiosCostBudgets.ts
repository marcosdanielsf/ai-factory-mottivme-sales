import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// Types from ../../types/aios
interface AiosCostBudget {
  id: string;
  name: string;
  budget_amount: number;
  spent_amount: number;
  period: string;
  alert_threshold: number;
  squad_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateBudgetInput {
  name: string;
  budget_amount: number;
  period?: string;
  alert_threshold?: number;
  squad_id?: string;
  is_active?: boolean;
}

interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
}

interface UseAiosCostBudgetsReturn {
  data: AiosCostBudget[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createBudget: (input: CreateBudgetInput) => Promise<AiosCostBudget | null>;
  updateBudget: (input: UpdateBudgetInput) => Promise<AiosCostBudget | null>;
}

export function useAiosCostBudgets(): UseAiosCostBudgetsReturn {
  const [data, setData] = useState<AiosCostBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('aios_cost_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('[useAiosCostBudgets] Tabela indisponivel:', fetchError.message);
        setData([]);
      } else {
        setData(result ?? []);
      }
    } catch (err: unknown) {
      console.error('[useAiosCostBudgets] Erro:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = useCallback(async (input: CreateBudgetInput): Promise<AiosCostBudget | null> => {
    const { data: result, error: createError } = await supabase
      .from('aios_cost_budgets')
      .insert(input)
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }

    await fetchBudgets();
    return result;
  }, [fetchBudgets]);

  const updateBudget = useCallback(async ({ id, ...input }: UpdateBudgetInput): Promise<AiosCostBudget | null> => {
    const { data: result, error: updateError } = await supabase
      .from('aios_cost_budgets')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    await fetchBudgets();
    return result;
  }, [fetchBudgets]);

  return { data, loading, error, refetch: fetchBudgets, createBudget, updateBudget };
}
