import { useState, useMemo, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { AnnualPlanState, AnnualProductRow, AnnualCostRow, Currency } from '../../types';
import { useProducts } from '../../../../hooks/useProducts';
import { useSalesGoals, SalesGoal } from '../../../../hooks/useSalesGoals';
import {
  initAnnualState,
  calcAnnualCashFlow,
  calcAnnualKPIs,
  serializeAnnualPlan,
  deserializeAnnualPlan,
  recalcProductRow,
} from '../../annual-calculation-engine';
import { YearSelector } from './YearSelector';
import { ProductsGrid } from './ProductsGrid';
import { CostsGrid } from './CostsGrid';
import { CashFlowTable } from './CashFlowTable';
import { AnnualKPIs } from './AnnualKPIs';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

export function AnnualPlanTab({ locationId, currency }: {
  locationId: string | null;
  currency: Currency;
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [state, setState] = useState<AnnualPlanState | null>(null);
  const [saving, setSaving] = useState(false);

  const { products, loading: productsLoading } = useProducts(locationId);
  const { goals, loading: goalsLoading } = useSalesGoals(locationId);

  // Find annual goals
  const annualGoals = useMemo(
    () => goals.filter(g => g.period_type === 'annual'),
    [goals]
  );

  const savedYears = useMemo(
    () => [...new Set(annualGoals.map(g => new Date(g.period_start).getFullYear()))].sort(),
    [annualGoals]
  );

  // Find goal for selected year
  const goalForYear = useMemo(
    () => annualGoals.find(g =>
      g.is_active && new Date(g.period_start).getFullYear() === selectedYear
    ) || annualGoals.find(g => new Date(g.period_start).getFullYear() === selectedYear),
    [annualGoals, selectedYear]
  );

  // Find baseline (previous year)
  const baselineGoal = useMemo(
    () => annualGoals.find(g => new Date(g.period_start).getFullYear() === selectedYear - 1),
    [annualGoals, selectedYear]
  );

  // Init/load state when year, products, or goal changes
  useEffect(() => {
    if (productsLoading || goalsLoading) return;

    if (goalForYear && products.length > 0) {
      setState(deserializeAnnualPlan(goalForYear, products));
    } else if (products.length > 0) {
      setState(initAnnualState(selectedYear, products, currency));
    } else {
      setState(null);
    }
  }, [selectedYear, products, productsLoading, goalForYear, goalsLoading, currency]);

  // Derived calculations
  const cashFlow = useMemo(
    () => state ? calcAnnualCashFlow(state) : [],
    [state]
  );

  const kpis = useMemo(
    () => state ? calcAnnualKPIs(state, baselineGoal) : null,
    [state, baselineGoal]
  );

  // Handlers
  const handleProductChange = useCallback((rows: AnnualProductRow[]) => {
    setState(prev => prev ? { ...prev, productRows: rows, isDirty: true } : prev);
  }, []);

  const handleCostChange = useCallback((rows: AnnualCostRow[]) => {
    setState(prev => prev ? { ...prev, costRows: rows, isDirty: true } : prev);
  }, []);

  const handleSaldoChange = useCallback((v: number) => {
    setState(prev => prev ? { ...prev, saldoInicial: v, isDirty: true } : prev);
  }, []);

  const handleYearChange = useCallback((y: number) => {
    setSelectedYear(y);
  }, []);

  const handleSave = useCallback(async () => {
    if (!state || !locationId || !isSupabaseConfigured()) return;

    setSaving(true);
    try {
      const periodStart = `${state.year}-01-01`;
      const periodEnd = `${state.year}-12-31`;
      const annualPlanData = serializeAnnualPlan(state);

      const goalPayload = {
        location_id: locationId,
        period_type: 'annual',
        period_start: periodStart,
        period_end: periodEnd,
        goal_revenue_brl: kpis?.faturamentoTotal ?? 0,
        goal_vendas: kpis?.contratosTotal ?? 0,
        ticket_medio_estimado: kpis?.ticketMedio ?? 0,
        goal_leads_total: 0,
        goal_leads_social_selling: 0,
        goal_leads_trafego: 0,
        goal_leads_organico: 0,
        goal_responderam: 0,
        goal_agendamentos: 0,
        goal_comparecimentos: 0,
        goal_conversion_rate: 0,
        calc_daily_investment: 0,
        calc_cpl: 0,
        calc_qualification_rate: 0,
        calc_scheduling_rate: 0,
        calc_attendance_rate: 0,
        calc_conversion_rate: 0,
        calc_average_ticket: kpis?.ticketMedio ?? 0,
        products_snapshot: state.productRows,
        marketing_config: annualPlanData,
        currency: state.currency,
        is_active: true,
      };

      // Deactivate only annual goals for this location with overlapping period
      await supabase
        .from('sales_goals')
        .update({ is_active: false })
        .eq('location_id', locationId)
        .eq('is_active', true)
        .eq('period_type', 'annual')
        .gte('period_end', periodStart)
        .lte('period_start', periodEnd);

      const { data, error } = await supabase
        .from('sales_goals')
        .insert(goalPayload)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setState(prev => prev ? { ...prev, goalId: data.id, isDirty: false } : prev);
    } catch (err) {
      console.error('Erro ao salvar plano anual:', err);
    } finally {
      setSaving(false);
    }
  }, [state, locationId, kpis]);

  // Loading
  if (productsLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-text-muted">Carregando dados...</div>
      </div>
    );
  }

  if (!locationId) {
    return (
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-6 text-center">
        <p className="text-sm text-text-muted">Selecione um cliente para visualizar o plano anual.</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-6 text-center">
        <p className="text-sm text-text-muted">Cadastre produtos no wizard mensal primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Year Selector + Save */}
      <div className="flex items-center justify-between">
        <YearSelector year={selectedYear} onChange={handleYearChange} savedYears={savedYears} />
        <button
          onClick={handleSave}
          disabled={!state.isDirty || saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Plano'}
        </button>
      </div>

      {/* Products Grid */}
      <ProductsGrid rows={state.productRows} onChange={handleProductChange} currency={state.currency} />

      {/* Costs Grid */}
      <CostsGrid rows={state.costRows} onChange={handleCostChange} currency={state.currency} />

      {/* Cash Flow */}
      <CashFlowTable
        rows={cashFlow}
        currency={state.currency}
        saldoInicial={state.saldoInicial}
        onSaldoChange={handleSaldoChange}
      />

      {/* KPIs */}
      {kpis && <AnnualKPIs kpis={kpis} currency={state.currency} />}
    </div>
  );
}
