import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, ChevronDown, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';
import { useAccount } from '../../contexts/AccountContext';
import { useLocations } from '../../hooks/useLocations';
import { useSalesGoals, calculateProjection, SalesGoal } from '../../hooks/useSalesGoals';
import { useSocialSellingFunnel } from '../../hooks/useSocialSellingFunnel';
import { useProducts } from '../../hooks/useProducts';

import type { PlanningState, ScenarioKey, Currency, ProductItem, PlanResults, ScenarioConfig } from './types';
import { DEFAULT_STATE, DEFAULT_SUB_FUNNELS, createDefaultProduct, DEFAULT_SCENARIO_CONFIG } from './constants';
import { calculatePlan, formatCurrency } from './calculation-engine';

import { LocationSelector } from './components/LocationSelector';
import { WizardSteps } from './components/WizardSteps';
import { ProductsStep } from './components/ProductsStep';
import { MarketingStep } from './components/MarketingStep';
import { SalesStep } from './components/SalesStep';
import { ResultsSidebar } from './components/ResultsSidebar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { ProgressSection } from './components/ProgressSection';

export function Planejamento() {
  const { selectedAccount } = useAccount();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  });

  const [plan, setPlan] = useState<PlanningState>(DEFAULT_STATE);
  const [showWizard, setShowWizard] = useState(false);

  const effectiveLocationId = selectedLocationId || selectedAccount?.location_id || null;
  const effectiveLocationName = useMemo(() => {
    if (selectedLocationId) {
      return locations.find(l => l.location_id === selectedLocationId)?.location_name || selectedLocationId;
    }
    if (selectedAccount?.location_id) return selectedAccount.location_name;
    return null;
  }, [selectedLocationId, selectedAccount, locations]);

  const { goals, activeGoal, loading: goalsLoading, createGoal, refetch } = useSalesGoals(effectiveLocationId);
  const funnelData = useSocialSellingFunnel(dateRange, effectiveLocationId);
  const { products: savedProducts, createProduct, updateProduct: updateSavedProduct } = useProducts(effectiveLocationId);

  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('realista');

  const scenarios = useMemo(() => ({
    pessimista: calculatePlan(plan, 30, plan.scenarioConfig.pessimista),
    realista: calculatePlan(plan, 30, plan.scenarioConfig.realista),
    otimista: calculatePlan(plan, 30, plan.scenarioConfig.otimista),
  }), [plan]);

  const results = scenarios[activeScenario];

  // Load saved products into wizard when available
  React.useEffect(() => {
    if (savedProducts.length > 0 && plan.products.length === 1 && plan.products[0].name === 'Produto Principal') {
      setPlan(p => ({
        ...p,
        products: savedProducts.map(sp => ({
          id: sp.id,
          name: sp.name,
          ticket: Number(sp.ticket),
          salesCycleDays: sp.sales_cycle_days,
          targetUnits: sp.target_units,
          orderBumpTicket: 0,
          orderBumpRate: 0,
          upsellTicket: 0,
          upsellRate: 0,
        })),
      }));
    }
  }, [savedProducts]);

  // Auto-expand wizard if no active goal
  React.useEffect(() => {
    if (!effectiveLocationId || (!goalsLoading && !activeGoal)) {
      setShowWizard(true);
    }
  }, [goalsLoading, activeGoal, effectiveLocationId]);

  const handleSaveGoal = async () => {
    if (!effectiveLocationId || !dateRange.startDate || !dateRange.endDate) return;

    try {
      // Persist products to Supabase
      for (const p of plan.products) {
        const existing = savedProducts.find(sp => sp.id === p.id);
        if (existing) {
          await updateSavedProduct(p.id, {
            name: p.name,
            ticket: p.ticket,
            sales_cycle_days: p.salesCycleDays,
            target_units: p.targetUnits,
          });
        } else {
          await createProduct({
            location_id: effectiveLocationId,
            name: p.name,
            ticket: p.ticket,
            sales_cycle_days: p.salesCycleDays,
            target_units: p.targetUnits,
          });
        }
      }

      // Compute weighted CPL for trafego from sub-funnels
      const weightedCpl = plan.marketing.trafegoSubFunnels.length > 0
        ? plan.marketing.trafegoSubFunnels.reduce((s, sf) => s + sf.cpl * sf.pctBudget / 100, 0)
        : plan.marketing.channels.trafego.cpl;

      const r = results;
      const newGoal: Omit<SalesGoal, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by'> = {
        location_id: effectiveLocationId,
        period_type: 'monthly',
        period_start: dateRange.startDate.toISOString().split('T')[0],
        period_end: dateRange.endDate.toISOString().split('T')[0],
        goal_leads_total: r.totalLeads,
        goal_leads_social_selling: r.byChannel.socialSelling.leads,
        goal_leads_trafego: r.byChannel.trafego.leads,
        goal_leads_organico: r.byChannel.organico.leads,
        goal_responderam: r.mqls,
        goal_agendamentos: r.scheduledCalls,
        goal_comparecimentos: r.attendedCalls,
        goal_vendas: r.totalSales,
        goal_revenue_brl: r.totalRevenue,
        ticket_medio_estimado: plan.products.length > 0
          ? plan.products.reduce((s, p) => s + p.ticket, 0) / plan.products.length
          : 1000,
        goal_conversion_rate: r.totalLeads > 0 ? Math.round((r.totalSales / r.totalLeads) * 100) : 0,
        calc_daily_investment: plan.marketing.dailyBudget,
        calc_cpl: weightedCpl,
        calc_qualification_rate: plan.sales.origins.trafego.qualificationRate,
        calc_scheduling_rate: plan.sales.origins.trafego.schedulingRate,
        calc_attendance_rate: plan.sales.origins.trafego.attendanceRate,
        calc_conversion_rate: plan.sales.origins.trafego.conversionRate,
        calc_average_ticket: plan.products[0]?.ticket || 1000,
        products_snapshot: plan.products,
        marketing_config: {
          ...plan.marketing,
          scenarioConfig: plan.scenarioConfig,
          scenarioResults: {
            pessimista: { totalSales: scenarios.pessimista.totalSales, totalRevenue: scenarios.pessimista.totalRevenue, roas: scenarios.pessimista.roas, netProfit: scenarios.pessimista.netProfit },
            realista: { totalSales: scenarios.realista.totalSales, totalRevenue: scenarios.realista.totalRevenue, roas: scenarios.realista.roas, netProfit: scenarios.realista.netProfit },
            otimista: { totalSales: scenarios.otimista.totalSales, totalRevenue: scenarios.otimista.totalRevenue, roas: scenarios.otimista.roas, netProfit: scenarios.otimista.netProfit },
          },
        },
        currency: plan.currency,
      };

      await createGoal(newGoal);
      setShowWizard(false);
      setActiveScenario('realista');
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    }
  };

  const handleEditGoal = () => {
    if (activeGoal) {
      // Restore state from saved goal
      const mkt = (activeGoal.marketing_config && typeof activeGoal.marketing_config === 'object' && 'dailyBudget' in activeGoal.marketing_config)
        ? activeGoal.marketing_config as PlanningState['marketing']
        : DEFAULT_STATE.marketing;

      const prods = Array.isArray(activeGoal.products_snapshot) && activeGoal.products_snapshot.length > 0
        ? activeGoal.products_snapshot as ProductItem[]
        : [{ ...createDefaultProduct(), ticket: activeGoal.calc_average_ticket }];

      const mergedMkt = { ...DEFAULT_STATE.marketing, ...mkt };
      if (!mergedMkt.trafegoSubFunnels || mergedMkt.trafegoSubFunnels.length === 0) {
        mergedMkt.trafegoSubFunnels = DEFAULT_SUB_FUNNELS;
      }

      const savedScenario = (activeGoal.marketing_config as any)?.scenarioConfig as ScenarioConfig | undefined;

      // Ensure products have bump/upsell fields
      const normalizedProds = prods.map(p => ({
        ...p,
        orderBumpTicket: p.orderBumpTicket ?? 0,
        orderBumpRate: p.orderBumpRate ?? 0,
        upsellTicket: p.upsellTicket ?? 0,
        upsellRate: p.upsellRate ?? 0,
      }));

      setPlan(prev => ({
        ...prev,
        step: 1,
        currency: (activeGoal.currency as Currency) || 'BRL',
        products: normalizedProds,
        marketing: mergedMkt,
        scenarioConfig: savedScenario || DEFAULT_SCENARIO_CONFIG,
      }));
    }
    setShowWizard(true);
  };

  // Rebuild scenarios from saved goal for Executive Summary
  const savedScenarios = useMemo(() => {
    if (!activeGoal) return null;
    const mktConfig = activeGoal.marketing_config as any;

    // If we have saved scenario results, rebuild PlanResults-like objects
    if (mktConfig?.scenarioResults) {
      const sr = mktConfig.scenarioResults;
      const buildFromSaved = (s: any): PlanResults => ({
        ...scenarios.realista, // base structure
        totalSales: s.totalSales ?? 0,
        totalRevenue: s.totalRevenue ?? 0,
        roas: s.roas ?? 0,
        netProfit: s.netProfit ?? 0,
      });
      return {
        pessimista: buildFromSaved(sr.pessimista),
        realista: buildFromSaved(sr.realista),
        otimista: buildFromSaved(sr.otimista),
      };
    }

    // Fallback: rebuild from current plan state
    return scenarios;
  }, [activeGoal, scenarios]);

  // Actual data from funnel
  const actualData = useMemo(() => {
    const total = funnelData.socialSelling.leads + funnelData.trafego.leads + funnelData.whatsappDireto.leads + funnelData.organico.leads;
    return {
      leads: total,
      leadsSS: funnelData.socialSelling.leads,
      leadsTrafego: funnelData.trafego.leads,
      leadsOrganico: funnelData.whatsappDireto.leads + funnelData.organico.leads,
      responderam: funnelData.socialSelling.responderam + funnelData.trafego.responderam + funnelData.whatsappDireto.responderam + funnelData.organico.responderam,
      agendamentos: funnelData.socialSelling.agendaram + funnelData.trafego.agendaram + funnelData.whatsappDireto.agendaram + funnelData.organico.agendaram,
      comparecimentos: funnelData.socialSelling.compareceram + funnelData.trafego.compareceram + funnelData.whatsappDireto.compareceram + funnelData.organico.compareceram,
      vendas: funnelData.socialSelling.fecharam + funnelData.trafego.fecharam + funnelData.whatsappDireto.fecharam + funnelData.organico.fecharam,
    };
  }, [funnelData]);

  // Projections
  const projections = useMemo(() => {
    if (!activeGoal || !dateRange.startDate || !dateRange.endDate) return null;
    return {
      leads: calculateProjection(activeGoal.goal_leads_total, actualData.leads, activeGoal.period_start, activeGoal.period_end),
      leadsSS: calculateProjection(activeGoal.goal_leads_social_selling, actualData.leadsSS, activeGoal.period_start, activeGoal.period_end),
      leadsTrafego: calculateProjection(activeGoal.goal_leads_trafego, actualData.leadsTrafego, activeGoal.period_start, activeGoal.period_end),
      leadsOrganico: calculateProjection(activeGoal.goal_leads_organico, actualData.leadsOrganico, activeGoal.period_start, activeGoal.period_end),
      responderam: calculateProjection(activeGoal.goal_responderam, actualData.responderam, activeGoal.period_start, activeGoal.period_end),
      agendamentos: calculateProjection(activeGoal.goal_agendamentos, actualData.agendamentos, activeGoal.period_start, activeGoal.period_end),
      comparecimentos: calculateProjection(activeGoal.goal_comparecimentos, actualData.comparecimentos, activeGoal.period_start, activeGoal.period_end),
      vendas: calculateProjection(activeGoal.goal_vendas, actualData.vendas, activeGoal.period_start, activeGoal.period_end),
    };
  }, [activeGoal, actualData, dateRange]);

  // Chart data
  const chartData = useMemo(() => {
    if (!activeGoal || !projections) return [];
    const start = new Date(activeGoal.period_start);
    const totalDays = projections.leads.totalDays;
    const daysElapsed = projections.leads.daysElapsed;
    const dailyTrend = funnelData.dailyTrend || [];
    const dailyAccum: Record<string, number> = {};
    let cumulative = 0;
    dailyTrend.forEach(d => {
      cumulative += d.socialSelling + d.trafego + d.organico;
      dailyAccum[d.date] = cumulative;
    });
    const data: any[] = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const goalAccum = Math.round((activeGoal.goal_leads_total / totalDays) * (i + 1));
      const realAccum = dailyAccum[dateKey] || (i < daysElapsed ? actualData.leads : null);
      const projection = i >= daysElapsed ? Math.round(actualData.leads + (projections.leads.currentDailyRate * (i - daysElapsed + 1))) : null;
      data.push({ date: dateKey, meta: goalAccum, real: realAccum, projecao: projection });
    }
    return data;
  }, [activeGoal, projections, funnelData.dailyTrend, actualData.leads]);

  return (
    <div className="bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Planejamento de Vendas</h1>
                <p className="text-xs text-text-muted">
                  {effectiveLocationName && <span className="text-blue-400 font-medium">{effectiveLocationName}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LocationSelector locations={locations} selectedLocationId={selectedLocationId} onChange={setSelectedLocationId} isLoading={locationsLoading} />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <button
                onClick={() => { refetch(); funnelData.refetch(); }}
                disabled={goalsLoading || funnelData.loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${goalsLoading || funnelData.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Wizard Toggle */}
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <button
            onClick={() => setShowWizard(!showWizard)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-text-primary">Planejamento de Metas</h3>
              {!showWizard && results.totalRevenue > 0 && (
                <span className="text-xs text-text-muted ml-2">
                  {formatCurrency(results.totalRevenue, plan.currency)} projetado
                </span>
              )}
            </div>
            <ChevronDown size={18} className={`text-text-muted transition-transform ${showWizard ? 'rotate-180' : ''}`} />
          </button>

          {showWizard && (
            <div className="border-t border-border-default">
              {/* Currency Toggle + Wizard Steps */}
              <div className="px-6 py-3 flex items-center justify-between border-b border-border-default bg-bg-primary/50">
                <WizardSteps step={plan.step} onChange={s => setPlan(p => ({ ...p, step: s }))} />
                <div className="flex items-center bg-bg-primary rounded-lg border border-border-default p-0.5">
                  <button
                    onClick={() => setPlan(p => ({ ...p, currency: 'BRL' }))}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'BRL' ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    R$ BRL
                  </button>
                  <button
                    onClick={() => setPlan(p => ({ ...p, currency: 'USD' }))}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'USD' ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              {/* Wizard Content + Results Sidebar */}
              <div className="flex flex-col lg:flex-row">
                {/* Left: Wizard Steps */}
                <div className="flex-1 px-6 py-5 lg:border-r border-border-default min-w-0">
                  {plan.step === 1 && (
                    <ProductsStep
                      products={plan.products}
                      currency={plan.currency}
                      onChange={products => setPlan(p => ({ ...p, products }))}
                    />
                  )}
                  {plan.step === 2 && (
                    <MarketingStep
                      marketing={plan.marketing}
                      currency={plan.currency}
                      onChange={marketing => setPlan(p => ({ ...p, marketing }))}
                    />
                  )}
                  {plan.step === 3 && (
                    <SalesStep
                      sales={plan.sales}
                      onChange={sales => setPlan(p => ({ ...p, sales }))}
                    />
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
                    <button
                      onClick={() => setPlan(p => ({ ...p, step: Math.max(1, p.step - 1) as 1 | 2 | 3 }))}
                      disabled={plan.step === 1}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>

                    <div className="flex items-center gap-2">
                      {plan.step === 3 ? (
                        <button
                          onClick={handleSaveGoal}
                          disabled={!effectiveLocationId}
                          className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          <Target size={16} /> Salvar como Meta
                        </button>
                      ) : (
                        <button
                          onClick={() => setPlan(p => ({ ...p, step: Math.min(3, p.step + 1) as 1 | 2 | 3 }))}
                          className="flex items-center gap-1.5 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          Proximo <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {!effectiveLocationId && plan.step === 3 && (
                    <p className="text-xs text-yellow-400 mt-2">Selecione um cliente para salvar a meta</p>
                  )}
                </div>

                {/* Right: Results Sidebar */}
                <ResultsSidebar results={results} scenarios={scenarios} activeScenario={activeScenario} onScenarioChange={setActiveScenario} currency={plan.currency} products={plan.products} />
              </div>
            </div>
          )}
        </div>

        {/* Executive Summary + Progresso vs Meta */}
        {activeGoal && !showWizard && (
          <ExecutiveSummary
            goal={activeGoal}
            scenarios={savedScenarios}
            currency={(activeGoal.currency as Currency) || 'BRL'}
            onEdit={handleEditGoal}
            onNew={() => { setPlan(DEFAULT_STATE); setShowWizard(true); }}
          />
        )}

        {activeGoal && projections && (
          <ProgressSection
            activeGoal={activeGoal}
            projections={projections}
            chartData={chartData}
            funnelData={funnelData}
            actualData={actualData}
            currency={(activeGoal.currency as Currency) || 'BRL'}
            showWizard={showWizard}
          />
        )}
      </div>
    </div>
  );
}

export default Planejamento;
