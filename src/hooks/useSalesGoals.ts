import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ============================================================================
// HOOK: useSalesGoals
// CRUD para metas de vendas + calculo de projecao
// ============================================================================

export interface SalesGoal {
  id: string;
  location_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  goal_leads_social_selling: number;
  goal_leads_trafego: number;
  goal_leads_organico: number;
  goal_leads_total: number;
  goal_responderam: number;
  goal_agendamentos: number;
  goal_comparecimentos: number;
  goal_vendas: number;
  goal_revenue_brl: number;
  ticket_medio_estimado: number;
  goal_conversion_rate: number;
  calc_daily_investment: number;
  calc_cpl: number;
  calc_qualification_rate: number;
  calc_scheduling_rate: number;
  calc_attendance_rate: number;
  calc_conversion_rate: number;
  calc_average_ticket: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalProjection {
  goalTotal: number;
  actualToDate: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  currentDailyRate: number;
  requiredDailyRate: number;
  requiredRateRemaining: number;
  projectedTotal: number;
  projectedPercentOfGoal: number;
  status: 'ahead' | 'on_track' | 'behind' | 'critical';
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface GoalWithProjections {
  goal: SalesGoal;
  projections: {
    leads: GoalProjection;
    leadsSS: GoalProjection;
    leadsTrafego: GoalProjection;
    leadsOrganico: GoalProjection;
    responderam: GoalProjection;
    agendamentos: GoalProjection;
    comparecimentos: GoalProjection;
    vendas: GoalProjection;
  };
}

type CreateGoalInput = Omit<SalesGoal, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by'>;

export function calculateProjection(
  goalValue: number,
  actualValue: number,
  periodStart: string,
  periodEnd: string,
  today?: Date
): GoalProjection {
  const now = today || new Date();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const currentDailyRate = actualValue / daysElapsed;
  const requiredDailyRate = goalValue / totalDays;
  const gap = goalValue - actualValue;
  const requiredRateRemaining = daysRemaining > 0 ? gap / daysRemaining : 0;

  const projectedTotal = Math.round(currentDailyRate * totalDays);
  const projectedPercentOfGoal = goalValue > 0
    ? Math.round((projectedTotal / goalValue) * 100)
    : actualValue > 0 ? 999 : 0;

  let status: GoalProjection['status'];
  if (projectedPercentOfGoal >= 110) status = 'ahead';
  else if (projectedPercentOfGoal >= 90) status = 'on_track';
  else if (projectedPercentOfGoal >= 70) status = 'behind';
  else status = 'critical';

  const periodProgress = daysElapsed / totalDays;
  const confidenceLevel: GoalProjection['confidenceLevel'] =
    periodProgress >= 0.5 ? 'high' :
    periodProgress >= 0.2 ? 'medium' : 'low';

  return {
    goalTotal: goalValue,
    actualToDate: actualValue,
    daysElapsed: Math.min(daysElapsed, totalDays),
    daysRemaining,
    totalDays,
    currentDailyRate: Math.round(currentDailyRate * 10) / 10,
    requiredDailyRate: Math.round(requiredDailyRate * 10) / 10,
    requiredRateRemaining: Math.round(requiredRateRemaining * 10) / 10,
    projectedTotal,
    projectedPercentOfGoal,
    status,
    confidenceLevel,
  };
}

export const useSalesGoals = (locationId?: string | null) => {
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<SalesGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!isSupabaseConfigured() || !locationId) {
      setGoals([]);
      setActiveGoal(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const { data, error: err } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);

      const allGoals = (data || []) as SalesGoal[];
      setGoals(allGoals);

      // Find active goal for current period
      const active = allGoals.find(g =>
        g.is_active &&
        g.period_start <= today &&
        g.period_end >= today
      ) || null;
      setActiveGoal(active);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar metas');
      console.error('[useSalesGoals Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (input: CreateGoalInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    // Deactivate existing goals for this period
    const { error: deactivateErr } = await supabase
      .from('sales_goals')
      .update({ is_active: false })
      .eq('location_id', input.location_id)
      .eq('is_active', true)
      .gte('period_end', input.period_start)
      .lte('period_start', input.period_end);

    if (deactivateErr) console.warn('Erro ao desativar metas antigas:', deactivateErr);

    const { data, error: insertErr } = await supabase
      .from('sales_goals')
      .insert({ ...input, is_active: true })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);
    await fetchGoals();
    return data as SalesGoal;
  }, [fetchGoals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<SalesGoal>) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('sales_goals')
      .update(updates)
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchGoals();
  }, [fetchGoals]);

  const deactivateGoal = useCallback(async (id: string) => {
    await updateGoal(id, { is_active: false });
  }, [updateGoal]);

  return {
    goals,
    activeGoal,
    loading,
    error,
    createGoal,
    updateGoal,
    deactivateGoal,
    refetch: fetchGoals,
  };
};

export default useSalesGoals;
