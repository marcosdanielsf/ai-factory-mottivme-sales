import { useState, useMemo, useEffect, useCallback } from 'react';
import { Save, Package, Users, Wallet, BarChart3 } from 'lucide-react';
import type { AnnualPlanState, AnnualProductRow, AnnualCostRow, OutboundChannel, InboundConfig, Currency } from '../../types';
import { useProducts } from '../../../../hooks/useProducts';
import { useSalesGoals } from '../../../../hooks/useSalesGoals';
import {
  initAnnualState,
  calcAnnualCashFlow,
  calcAnnualKPIs,
  calcInboundFunnel,
  calcInboundSummary,
  serializeAnnualPlan,
  deserializeAnnualPlan,
} from '../../annual-calculation-engine';
import { formatCurrency } from '../../calculation-engine';
import { YearSelector } from './YearSelector';
import { ProductsGrid } from './ProductsGrid';
import { CostsGrid } from './CostsGrid';
import { AcquisitionOutbound } from './AcquisitionOutbound';
import { AcquisitionInbound } from './AcquisitionInbound';
import { CashFlowTable } from './CashFlowTable';
import { AnnualKPIs } from './AnnualKPIs';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

type SubTab = 'produtos' | 'aquisicao' | 'custos' | 'resultado';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Package }[] = [
  { key: 'produtos', label: 'Produtos', icon: Package },
  { key: 'aquisicao', label: 'Aquisicao', icon: Users },
  { key: 'custos', label: 'Custos', icon: Wallet },
  { key: 'resultado', label: 'Resultado', icon: BarChart3 },
];

export function AnnualPlanTab({ locationId, currency }: {
  locationId: string | null;
  currency: Currency;
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [state, setState] = useState<AnnualPlanState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('produtos');

  const { products, loading: productsLoading } = useProducts(locationId);
  const { goals, loading: goalsLoading } = useSalesGoals(locationId);

  const annualGoals = useMemo(() => goals.filter(g => g.period_type === 'annual'), [goals]);
  const savedYears = useMemo(() => [...new Set(annualGoals.map(g => new Date(g.period_start).getFullYear()))].sort(), [annualGoals]);

  const goalForYear = useMemo(
    () => annualGoals.find(g => g.is_active && new Date(g.period_start).getFullYear() === selectedYear)
      || annualGoals.find(g => new Date(g.period_start).getFullYear() === selectedYear),
    [annualGoals, selectedYear]
  );

  const baselineGoal = useMemo(
    () => annualGoals.find(g => new Date(g.period_start).getFullYear() === selectedYear - 1),
    [annualGoals, selectedYear]
  );

  useEffect(() => {
    if (productsLoading || goalsLoading) return;
    // Skip re-deserialize if we already loaded this goal
    if (state?.goalId && goalForYear?.id === state.goalId) return;
    if (goalForYear && products.length > 0) {
      setState(deserializeAnnualPlan(goalForYear, products));
    } else if (products.length > 0) {
      setState(initAnnualState(selectedYear, products, currency));
    } else {
      setState(null);
    }
  }, [selectedYear, products, productsLoading, goalForYear, goalsLoading, currency]);

  // Derived
  const cashFlow = useMemo(() => state ? calcAnnualCashFlow(state) : [], [state]);
  const kpis = useMemo(() => state ? calcAnnualKPIs(state, baselineGoal) : null, [state, baselineGoal]);
  const inboundFunnel = useMemo(() => state ? calcInboundFunnel(state) : [], [state]);
  const inboundSummary = useMemo(
    () => state && kpis ? calcInboundSummary(inboundFunnel, state.inboundConfig, kpis.faturamentoTotal) : null,
    [inboundFunnel, state, kpis]
  );

  // Handlers
  const setDirty = useCallback((updater: (prev: AnnualPlanState) => AnnualPlanState) => {
    setState(prev => prev ? { ...updater(prev), isDirty: true } : prev);
  }, []);

  const handleProductChange = useCallback((rows: AnnualProductRow[]) => {
    setDirty(prev => ({ ...prev, productRows: rows }));
  }, [setDirty]);

  const handleCostChange = useCallback((rows: AnnualCostRow[]) => {
    setDirty(prev => ({ ...prev, costRows: rows }));
  }, [setDirty]);

  const handleOutboundChange = useCallback((channels: OutboundChannel[]) => {
    setDirty(prev => ({ ...prev, outboundChannels: channels }));
  }, [setDirty]);

  const handleInboundConfigChange = useCallback((config: InboundConfig) => {
    setDirty(prev => ({ ...prev, inboundConfig: config }));
  }, [setDirty]);

  const handleSaldoChange = useCallback((v: number) => {
    setDirty(prev => ({ ...prev, saldoInicial: v }));
  }, [setDirty]);

  const handleSave = useCallback(async () => {
    if (!state || !locationId || !isSupabaseConfigured()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const periodStart = `${state.year}-01-01`;
      const periodEnd = `${state.year}-12-31`;

      const goalPayload = {
        location_id: locationId,
        period_type: 'annual',
        period_start: periodStart,
        period_end: periodEnd,
        goal_revenue_brl: kpis?.faturamentoTotal ?? 0,
        goal_vendas: kpis?.contratosTotal ?? 0,
        ticket_medio_estimado: kpis?.ticketMedio ?? 0,
        goal_leads_total: inboundSummary?.trafegoTotal ?? 0,
        goal_leads_social_selling: 0,
        goal_leads_trafego: inboundSummary?.trafegoTotal ?? 0,
        goal_leads_organico: 0,
        goal_responderam: 0,
        goal_agendamentos: 0,
        goal_comparecimentos: 0,
        goal_conversion_rate: 0,
        calc_daily_investment: inboundSummary ? inboundSummary.mediaMensal / 30 : 0,
        calc_cpl: state.inboundConfig.cpcMedio,
        calc_qualification_rate: 0,
        calc_scheduling_rate: 0,
        calc_attendance_rate: 0,
        calc_conversion_rate: 0,
        calc_average_ticket: kpis?.ticketMedio ?? 0,
        products_snapshot: state.productRows,
        marketing_config: serializeAnnualPlan(state),
        currency: state.currency,
        is_active: true,
      };

      // Insert first, then deactivate old — if insert fails, old data survives
      const { data, error: insertErr } = await supabase
        .from('sales_goals')
        .insert(goalPayload)
        .select()
        .single();

      if (insertErr) throw new Error(insertErr.message);

      // Safe to deactivate now — new goal already exists
      await supabase
        .from('sales_goals')
        .update({ is_active: false })
        .eq('location_id', locationId)
        .eq('is_active', true)
        .eq('period_type', 'annual')
        .neq('id', data.id)
        .gte('period_end', periodStart)
        .lte('period_start', periodEnd);

      setState(prev => prev ? { ...prev, goalId: data.id, isDirty: false } : prev);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao salvar';
      setSaveError(msg);
      console.error('Erro ao salvar plano anual:', err);
    } finally {
      setSaving(false);
    }
  }, [state, locationId, kpis, inboundSummary]);

  // Loading / empty states
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

  const fmt = (v: number) => formatCurrency(v, state.currency);
  const outboundTotal = state.outboundChannels.reduce((s, ch) => s + ch.totalAnual, 0);
  const inboundTotal = inboundFunnel.reduce((s, r) => s + r.vendasInbound, 0);

  return (
    <div className="space-y-4">
      {/* Header: Year + Save */}
      <div className="flex items-center justify-between">
        <YearSelector year={selectedYear} onChange={setSelectedYear} savedYears={savedYears} />
        <button
          onClick={handleSave}
          disabled={!state.isDirty || saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Plano'}
        </button>
      </div>

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-red-400">{saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-xs text-red-400 hover:text-red-300 ml-4">Fechar</button>
        </div>
      )}

      {/* KPI Strip — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Faturamento', value: fmt(kpis?.faturamentoTotal ?? 0), color: 'text-green-400' },
          { label: 'Contratos', value: String(kpis?.contratosTotal ?? 0), color: 'text-blue-400' },
          { label: 'Ticket Medio', value: fmt(kpis?.ticketMedio ?? 0), color: 'text-blue-400' },
          { label: 'Custos', value: fmt(kpis?.custoTotal ?? 0), color: 'text-red-400' },
          { label: 'Lucro', value: fmt(kpis?.lucroLiquido ?? 0), color: (kpis?.lucroLiquido ?? 0) >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(k => (
          <div key={k.label} className="bg-bg-secondary rounded-lg border border-border-default px-3 py-2">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">{k.label}</div>
            <div className={`text-sm font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-bg-secondary rounded-lg border border-border-default p-0.5">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const active = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-colors flex-1 justify-center ${
                active ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {subTab === 'produtos' && (
        <ProductsGrid rows={state.productRows} onChange={handleProductChange} currency={state.currency} />
      )}

      {subTab === 'aquisicao' && (
        <div className="space-y-6">
          <AcquisitionOutbound channels={state.outboundChannels} onChange={handleOutboundChange} />
          {inboundSummary && (
            <AcquisitionInbound
              config={state.inboundConfig}
              onChange={handleInboundConfigChange}
              funnelRows={inboundFunnel}
              summary={inboundSummary}
              currency={state.currency}
            />
          )}
          {/* Quick summary */}
          <div className="bg-bg-secondary rounded-lg border border-border-default p-4">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Resumo Aquisicao</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-400">{outboundTotal}</div>
                <div className="text-[10px] text-text-muted">Outbound/ano</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400">{inboundTotal}</div>
                <div className="text-[10px] text-text-muted">Inbound/ano</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{outboundTotal + inboundTotal}</div>
                <div className="text-[10px] text-text-muted">Total vendas/ano</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'custos' && (
        <CostsGrid rows={state.costRows} onChange={handleCostChange} currency={state.currency} />
      )}

      {subTab === 'resultado' && (
        <div className="space-y-6">
          <CashFlowTable
            rows={cashFlow}
            currency={state.currency}
            saldoInicial={state.saldoInicial}
            onSaldoChange={handleSaldoChange}
          />
          {kpis && <AnnualKPIs kpis={kpis} currency={state.currency} />}
        </div>
      )}
    </div>
  );
}
