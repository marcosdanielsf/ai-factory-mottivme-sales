import React, { useState, useMemo, useCallback } from 'react';
import { Target, TrendingUp, DollarSign, Users, Calendar, CheckCircle, RefreshCw, Building2, ChevronDown, Edit3, PlusCircle, Plus, Trash2, Package, Megaphone, ShoppingCart, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { useAccount } from '../contexts/AccountContext';
import { useLocations } from '../hooks/useLocations';
import { useSalesGoals, calculateProjection, SalesGoal } from '../hooks/useSalesGoals';
import { useSocialSellingFunnel } from '../hooks/useSocialSellingFunnel';
import { useProducts } from '../hooks/useProducts';

// ============================================================================
// Planejamento de Vendas — Wizard 3 Steps
// Step 1: Produtos | Step 2: Marketing | Step 3: Vendas
// Painel de resultado fixo na lateral
// ============================================================================

const STATUS_CONFIG = {
  ahead: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Acima' },
  on_track: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'No ritmo' },
  behind: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Atras' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critico' },
};

// ============================================================================
// Types
// ============================================================================

type Currency = 'BRL' | 'USD';

interface ProductItem {
  id: string;
  name: string;
  ticket: number;
  salesCycleDays: number;
  targetUnits: number;
  orderBumpTicket: number;
  orderBumpRate: number;
  upsellTicket: number;
  upsellRate: number;
}

interface ChannelConfig {
  pctBudget: number;
  cpl: number;
}

interface SubFunnel {
  id: string;
  name: string;
  pctBudget: number;
  cpl: number;
}

interface OriginRates {
  qualificationRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
}

interface PlanningState {
  step: 1 | 2 | 3;
  currency: Currency;
  products: ProductItem[];
  marketing: {
    dailyBudget: number;
    channels: {
      socialSelling: ChannelConfig;
      trafego: ChannelConfig;
      organico: ChannelConfig;
    };
    trafegoSubFunnels: SubFunnel[];
  };
  sales: {
    origins: {
      socialSelling: OriginRates;
      trafego: OriginRates;
      organico: OriginRates;
    };
    mqlsPerSdr: number;
    callsPerCloser: number;
  };
  scenarioConfig: ScenarioConfig;
}

interface ChannelResults {
  leads: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  sales: number;
  revenue: number;
  investment: number;
}

type ScenarioKey = 'pessimista' | 'realista' | 'otimista';

interface ScenarioConfig {
  pessimista: number;
  realista: number;
  otimista: number;
}

interface PlanResults {
  totalInvestment: number;
  totalLeads: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  totalSales: number;
  totalRevenue: number;
  roas: number;
  cac: number;
  sdrCount: number;
  closerCount: number;
  totalOpCost: number;
  netProfit: number;
  byChannel: {
    socialSelling: ChannelResults;
    trafego: ChannelResults;
    organico: ChannelResults;
  };
  byProduct: {
    name: string;
    ticket: number;
    targetUnits: number;
    revenueBase: number;
    revenueBump: number;
    revenueUpsell: number;
    revenue: number;
    estimatedLeads: number;
  }[];
  bySubFunnel: {
    name: string;
    investment: number;
    leads: number;
    cpl: number;
  }[];
}

// ============================================================================
// Shared Input Components
// ============================================================================

function NumInput({ value, onChange, className, prefix, step, min, max, ...rest }: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  prefix?: string;
  step?: number;
  min?: number;
  max?: number;
  [key: string]: any;
}) {
  const [localValue, setLocalValue] = useState(String(value));
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!focused) setLocalValue(String(value));
  }, [value, focused]);

  return (
    <div className="relative">
      {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={focused ? localValue : String(value)}
        onFocus={e => { setFocused(true); setLocalValue(String(value)); e.target.select(); }}
        onChange={e => {
          const raw = e.target.value;
          setLocalValue(raw);
          const parsed = parseFloat(raw);
          if (!isNaN(parsed)) {
            const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
            onChange(clamped);
          }
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = parseFloat(localValue);
          if (isNaN(parsed)) {
            setLocalValue(String(value));
          } else {
            const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
            onChange(clamped);
            setLocalValue(String(clamped));
          }
        }}
        className={`${prefix ? 'pl-8' : ''} ${className || ''}`}
        {...rest}
      />
    </div>
  );
}

function FieldHelp({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-text-muted/50 hover:text-purple-400 transition-colors"
      >
        <HelpCircle size={12} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-bg-secondary border border-border-default rounded-lg shadow-xl text-[10px] text-text-secondary z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-bg-secondary border-r border-b border-border-default rotate-45" />
        </div>
      )}
    </span>
  );
}

// ============================================================================
// Defaults
// ============================================================================

const createDefaultProduct = (): ProductItem => ({
  id: crypto.randomUUID(),
  name: 'Produto Principal',
  ticket: 1000,
  salesCycleDays: 30,
  targetUnits: 10,
  orderBumpTicket: 0,
  orderBumpRate: 0,
  upsellTicket: 0,
  upsellRate: 0,
});

const DEFAULT_SCENARIO_CONFIG: ScenarioConfig = {
  pessimista: 0.7,
  realista: 1.0,
  otimista: 1.3,
};

const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  pessimista: 'Aceitavel',
  realista: 'Realista',
  otimista: 'Otimista',
};

const DEFAULT_SUB_FUNNELS: SubFunnel[] = [
  { id: '1', name: 'Novo Seguidor', pctBudget: 25, cpl: 1.5 },
  { id: '2', name: 'Remarketing', pctBudget: 20, cpl: 12 },
  { id: '3', name: 'Formulario / LP', pctBudget: 25, cpl: 15 },
  { id: '4', name: 'VSL', pctBudget: 15, cpl: 20 },
  { id: '5', name: 'Direct DM', pctBudget: 10, cpl: 5 },
  { id: '6', name: 'Direct WhatsApp', pctBudget: 5, cpl: 8 },
];

const DEFAULT_STATE: PlanningState = {
  step: 1,
  currency: 'BRL',
  products: [createDefaultProduct()],
  marketing: {
    dailyBudget: 333,
    channels: {
      socialSelling: { pctBudget: 30, cpl: 3 },
      trafego: { pctBudget: 50, cpl: 8 },
      organico: { pctBudget: 20, cpl: 1 },
    },
    trafegoSubFunnels: DEFAULT_SUB_FUNNELS,
  },
  sales: {
    origins: {
      socialSelling: { qualificationRate: 60, schedulingRate: 45, attendanceRate: 75, conversionRate: 25 },
      trafego: { qualificationRate: 40, schedulingRate: 35, attendanceRate: 65, conversionRate: 15 },
      organico: { qualificationRate: 55, schedulingRate: 40, attendanceRate: 70, conversionRate: 20 },
    },
    mqlsPerSdr: 150,
    callsPerCloser: 60,
  },
  scenarioConfig: DEFAULT_SCENARIO_CONFIG,
};

// ============================================================================
// Calculation Engine
// ============================================================================

function calculatePlan(state: PlanningState, periodDays = 30, scenarioMultiplier = 1.0): PlanResults {
  const { marketing, sales, products } = state;
  const totalInvestment = marketing.dailyBudget * periodDays;

  const clampRate = (rate: number, mult: number) => Math.min(100, rate * mult);

  const calcChannelLeads = (key: 'socialSelling' | 'trafego' | 'organico', investment: number): number => {
    if (key === 'trafego' && marketing.trafegoSubFunnels.length > 0) {
      return marketing.trafegoSubFunnels.reduce((total, sf) => {
        const sfInvestment = investment * sf.pctBudget / 100;
        return total + (sf.cpl > 0 ? Math.floor(sfInvestment / sf.cpl) : 0);
      }, 0);
    }
    const ch = marketing.channels[key];
    return ch.cpl > 0 ? Math.floor(investment / ch.cpl) : 0;
  };

  const calcProductRevenue = (salesCount: number) => {
    const totalTarget = products.reduce((s, p) => s + p.targetUnits, 0);
    let revenueBase = 0;
    let revenueBump = 0;
    let revenueUpsell = 0;
    products.forEach(p => {
      const pctShare = totalTarget > 0 ? p.targetUnits / totalTarget : 1 / products.length;
      const pSales = salesCount * pctShare;
      revenueBase += pSales * p.ticket;
      revenueBump += pSales * (p.orderBumpRate / 100) * p.orderBumpTicket;
      revenueUpsell += pSales * (p.upsellRate / 100) * p.upsellTicket;
    });
    return { revenueBase, revenueBump, revenueUpsell, total: revenueBase + revenueBump + revenueUpsell };
  };

  const calcChannel = (key: 'socialSelling' | 'trafego' | 'organico'): ChannelResults => {
    const ch = marketing.channels[key];
    const rates = sales.origins[key];
    const investment = totalInvestment * ch.pctBudget / 100;
    const leads = calcChannelLeads(key, investment);
    const mqls = Math.floor(leads * clampRate(rates.qualificationRate, scenarioMultiplier) / 100);
    const scheduledCalls = Math.floor(mqls * clampRate(rates.schedulingRate, scenarioMultiplier) / 100);
    const attendedCalls = Math.floor(scheduledCalls * clampRate(rates.attendanceRate, scenarioMultiplier) / 100);
    const salesCount = Math.floor(attendedCalls * clampRate(rates.conversionRate, scenarioMultiplier) / 100);

    const rev = calcProductRevenue(salesCount);
    return { leads, mqls, scheduledCalls, attendedCalls, sales: salesCount, revenue: rev.total, investment };
  };

  const ss = calcChannel('socialSelling');
  const tr = calcChannel('trafego');
  const org = calcChannel('organico');

  const trafegoBudget = totalInvestment * marketing.channels.trafego.pctBudget / 100;
  const bySubFunnel = marketing.trafegoSubFunnels.map(sf => {
    const sfInvestment = trafegoBudget * sf.pctBudget / 100;
    const sfLeads = sf.cpl > 0 ? Math.floor(sfInvestment / sf.cpl) : 0;
    return { name: sf.name, investment: sfInvestment, leads: sfLeads, cpl: sf.cpl };
  });

  const totalLeads = ss.leads + tr.leads + org.leads;
  const mqls = ss.mqls + tr.mqls + org.mqls;
  const scheduledCalls = ss.scheduledCalls + tr.scheduledCalls + org.scheduledCalls;
  const attendedCalls = ss.attendedCalls + tr.attendedCalls + org.attendedCalls;
  const totalSales = ss.sales + tr.sales + org.sales;
  const totalRevenue = ss.revenue + tr.revenue + org.revenue;

  const sdrCount = Math.ceil(mqls / sales.mqlsPerSdr);
  const closerCount = Math.ceil(attendedCalls / sales.callsPerCloser);
  const totalOpCost = totalInvestment + (sdrCount * 3000) + (closerCount * 5000) + (totalSales * 200) + 500 + 1000;
  const roas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  const cac = totalSales > 0 ? totalOpCost / totalSales : 0;
  const netProfit = totalRevenue - totalOpCost;

  const totalTarget = products.reduce((s, p) => s + p.targetUnits, 0);
  const overallConvRate = totalLeads > 0 ? totalSales / totalLeads : 0;

  const byProduct = products.map(p => {
    const pctShare = totalTarget > 0 ? p.targetUnits / totalTarget : 1 / products.length;
    const estimatedSales = Math.round(totalSales * pctShare);
    const estimatedLeads = overallConvRate > 0 ? Math.round(estimatedSales / overallConvRate) : 0;
    const revenueBase = estimatedSales * p.ticket;
    const revenueBump = estimatedSales * (p.orderBumpRate / 100) * p.orderBumpTicket;
    const revenueUpsell = estimatedSales * (p.upsellRate / 100) * p.upsellTicket;
    return {
      name: p.name,
      ticket: p.ticket,
      targetUnits: p.targetUnits,
      revenueBase,
      revenueBump,
      revenueUpsell,
      revenue: revenueBase + revenueBump + revenueUpsell,
      estimatedLeads,
    };
  });

  return {
    totalInvestment,
    totalLeads,
    mqls,
    scheduledCalls,
    attendedCalls,
    totalSales,
    totalRevenue,
    roas,
    cac,
    sdrCount,
    closerCount,
    totalOpCost,
    netProfit,
    byChannel: { socialSelling: ss, trafego: tr, organico: org },
    byProduct,
    bySubFunnel,
  };
}

// ============================================================================
// Format
// ============================================================================

const formatCurrency = (value: number, currency: Currency = 'BRL') =>
  new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency }).format(value);

// ============================================================================
// Main Component
// ============================================================================

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
    const total = funnelData.socialSelling.leads + funnelData.trafego.leads + funnelData.organico.leads;
    return {
      leads: total,
      leadsSS: funnelData.socialSelling.leads,
      leadsTrafego: funnelData.trafego.leads,
      leadsOrganico: funnelData.organico.leads,
      responderam: funnelData.socialSelling.responderam + funnelData.trafego.responderam + funnelData.organico.responderam,
      agendamentos: funnelData.socialSelling.agendaram + funnelData.trafego.agendaram + funnelData.organico.agendaram,
      comparecimentos: funnelData.socialSelling.compareceram + funnelData.trafego.compareceram + funnelData.organico.compareceram,
      vendas: funnelData.socialSelling.fecharam + funnelData.trafego.fecharam + funnelData.organico.fecharam,
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
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Target size={20} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Planejamento de Vendas</h1>
                <p className="text-xs text-text-muted">
                  {effectiveLocationName && <span className="text-purple-400 font-medium">{effectiveLocationName}</span>}
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
              <TrendingUp size={18} className="text-purple-400" />
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
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'BRL' ? 'bg-purple-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    R$ BRL
                  </button>
                  <button
                    onClick={() => setPlan(p => ({ ...p, currency: 'USD' }))}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'USD' ? 'bg-purple-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
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
                          className="flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                        >
                          <Target size={16} /> Salvar como Meta
                        </button>
                      ) : (
                        <button
                          onClick={() => setPlan(p => ({ ...p, step: Math.min(3, p.step + 1) as 1 | 2 | 3 }))}
                          className="flex items-center gap-1.5 px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors text-sm"
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
          <>
            {showWizard && (
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Progresso vs Meta</h3>
              </div>
            )}

            {!showWizard && <h3 className="text-sm font-semibold text-text-primary mt-2">Progresso vs Meta</h3>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProgressCard label="Leads" projection={projections.leads} />
              <ProgressCard label="Agendamentos" projection={projections.agendamentos} />
              <ProgressCard label="Comparecimentos" projection={projections.comparecimentos} />
              <ProgressCard label="Vendas" projection={projections.vendas} />
            </div>

            {/* Grafico */}
            <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Projecao de Leads</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    labelFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('pt-BR'); }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="meta" name="Meta" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="real" name="Real" stroke="#a855f7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="projecao" name="Projecao" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Detalhamento por Origem */}
            <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-sm font-semibold text-text-primary">Detalhamento por Origem</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left px-6 py-3 text-text-muted font-medium">Etapa</th>
                      <th className="text-center px-3 py-3 text-pink-400 font-medium">SS Meta</th>
                      <th className="text-center px-3 py-3 text-pink-400 font-medium">SS Real</th>
                      <th className="text-center px-3 py-3 text-orange-400 font-medium">Traf Meta</th>
                      <th className="text-center px-3 py-3 text-orange-400 font-medium">Traf Real</th>
                      <th className="text-center px-3 py-3 text-cyan-400 font-medium">Org Meta</th>
                      <th className="text-center px-3 py-3 text-cyan-400 font-medium">Org Real</th>
                      <th className="text-center px-3 py-3 text-text-muted font-medium">Total Meta</th>
                      <th className="text-center px-3 py-3 text-purple-400 font-medium">Total Real</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      {
                        label: 'Leads',
                        metaSS: activeGoal.goal_leads_social_selling, realSS: actualData.leadsSS,
                        metaTr: activeGoal.goal_leads_trafego, realTr: actualData.leadsTrafego,
                        metaOrg: activeGoal.goal_leads_organico, realOrg: actualData.leadsOrganico,
                        metaTotal: activeGoal.goal_leads_total, realTotal: actualData.leads,
                      },
                      {
                        label: 'Responderam',
                        metaSS: Math.round(activeGoal.goal_leads_social_selling * (activeGoal.calc_qualification_rate || 50) / 100),
                        realSS: funnelData.socialSelling.responderam,
                        metaTr: Math.round(activeGoal.goal_leads_trafego * (activeGoal.calc_qualification_rate || 50) / 100),
                        realTr: funnelData.trafego.responderam,
                        metaOrg: Math.round(activeGoal.goal_leads_organico * (activeGoal.calc_qualification_rate || 50) / 100),
                        realOrg: funnelData.organico.responderam,
                        metaTotal: activeGoal.goal_responderam, realTotal: actualData.responderam,
                      },
                      {
                        label: 'Agendaram',
                        metaSS: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                        realSS: funnelData.socialSelling.agendaram,
                        metaTr: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                        realTr: funnelData.trafego.agendaram,
                        metaOrg: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                        realOrg: funnelData.organico.agendaram,
                        metaTotal: activeGoal.goal_agendamentos, realTotal: actualData.agendamentos,
                      },
                      {
                        label: 'Compareceram',
                        metaSS: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                        realSS: funnelData.socialSelling.compareceram,
                        metaTr: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                        realTr: funnelData.trafego.compareceram,
                        metaOrg: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                        realOrg: funnelData.organico.compareceram,
                        metaTotal: activeGoal.goal_comparecimentos, realTotal: actualData.comparecimentos,
                      },
                      {
                        label: 'Vendas',
                        metaSS: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                        realSS: funnelData.socialSelling.fecharam,
                        metaTr: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                        realTr: funnelData.trafego.fecharam,
                        metaOrg: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                        realOrg: funnelData.organico.fecharam,
                        metaTotal: activeGoal.goal_vendas, realTotal: actualData.vendas,
                      },
                    ]).map((row, i) => {
                      const pctTotal = row.metaTotal > 0 ? Math.round((row.realTotal / row.metaTotal) * 100) : 0;
                      return (
                        <tr key={row.label} className={i < 4 ? 'border-b border-border-default' : ''}>
                          <td className="px-6 py-2.5 font-medium text-text-primary text-sm">{row.label}</td>
                          <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaSS}</td>
                          <td className="text-center px-3 py-2.5 text-pink-400 font-bold text-xs">{row.realSS}</td>
                          <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaTr}</td>
                          <td className="text-center px-3 py-2.5 text-orange-400 font-bold text-xs">{row.realTr}</td>
                          <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaOrg}</td>
                          <td className="text-center px-3 py-2.5 text-cyan-400 font-bold text-xs">{row.realOrg}</td>
                          <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaTotal}</td>
                          <td className="text-center px-3 py-2.5 font-bold text-xs">
                            <span className={pctTotal >= 90 ? 'text-green-400' : pctTotal >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                              {row.realTotal} ({pctTotal}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-border-default bg-bg-primary/50">
                      <td className="px-6 py-2.5 font-medium text-text-primary text-sm">Investimento</td>
                      <td colSpan={6}></td>
                      <td colSpan={2} className="text-center px-3 py-2.5 text-purple-400 font-bold text-sm">
                        {formatCurrency(activeGoal.calc_daily_investment * 30, (activeGoal.currency as Currency) || 'BRL')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Wizard Steps Indicator
// ============================================================================

function WizardSteps({ step, onChange }: { step: 1 | 2 | 3; onChange: (s: 1 | 2 | 3) => void }) {
  const steps = [
    { num: 1 as const, label: 'Produtos', icon: Package },
    { num: 2 as const, label: 'Marketing', icon: Megaphone },
    { num: 3 as const, label: 'Vendas', icon: ShoppingCart },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <button
            onClick={() => onChange(s.num)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              step === s.num
                ? 'bg-purple-500 text-white'
                : step > s.num
                  ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                  : 'bg-bg-primary text-text-muted hover:text-text-primary'
            }`}
          >
            <s.icon size={14} />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.num}</span>
          </button>
          {i < 2 && <ChevronRight size={14} className="text-text-muted/50" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// Bump/Upsell Section (collapsible per product)
// ============================================================================

function BumpUpsellSection({ product, currency, onChange }: {
  product: ProductItem;
  currency: Currency;
  onChange: (updates: Partial<ProductItem>) => void;
}) {
  const hasBump = product.orderBumpTicket > 0 || product.orderBumpRate > 0;
  const hasUpsell = product.upsellTicket > 0 || product.upsellRate > 0;
  const [open, setOpen] = useState(hasBump || hasUpsell);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-green-400 hover:text-green-300 font-medium transition-colors uppercase tracking-wider"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        Ofertas adicionais (Order Bump + Upsell)
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
          {/* Order Bump */}
          <div>
            <div className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
              Order Bump
              <FieldHelp text="Oferta complementar mostrada no checkout. Ex: R$ 97 por um e-book bonus. O cliente compra junto com o produto principal." />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-text-muted">Valor</label>
                <NumInput
                  value={product.orderBumpTicket}
                  onChange={v => onChange({ orderBumpTicket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-green-500/20 rounded-lg pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">% que compram</label>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={product.orderBumpRate}
                    onChange={v => onChange({ orderBumpRate: v })}
                    min={0} max={100}
                    className="w-full bg-bg-secondary border border-green-500/20 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-[10px] text-text-muted">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upsell */}
          <div>
            <div className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
              Upsell
              <FieldHelp text="Oferta premium pos-compra. Ex: R$ 497 por mentoria individual. Oferecida depois que o cliente ja comprou o produto principal." />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-text-muted">Valor</label>
                <NumInput
                  value={product.upsellTicket}
                  onChange={v => onChange({ upsellTicket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-green-500/20 rounded-lg pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">% que compram</label>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={product.upsellRate}
                    onChange={v => onChange({ upsellRate: v })}
                    min={0} max={100}
                    className="w-full bg-bg-secondary border border-green-500/20 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-[10px] text-text-muted">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step 1: Produtos
// ============================================================================

function ProductsStep({ products, currency, onChange }: {
  products: ProductItem[];
  currency: Currency;
  onChange: (products: ProductItem[]) => void;
}) {
  const addProduct = () => {
    if (products.length >= 5) return;
    onChange([...products, { id: crypto.randomUUID(), name: `Produto ${products.length + 1}`, ticket: 1000, salesCycleDays: 30, targetUnits: 5, orderBumpTicket: 0, orderBumpRate: 0, upsellTicket: 0, upsellRate: 0 }]);
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    onChange(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProduct = (id: string) => {
    if (products.length <= 1) return;
    onChange(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Intro explicativo */}
      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 1: Seus Produtos</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Cadastre cada produto ou servico que voce vende. Pra cada um, defina o preco (ticket),
          quanto tempo leva pra fechar uma venda, e quantas vendas quer fazer por mes.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{products.length} de 5 produtos</span>
        <button
          onClick={addProduct}
          disabled={products.length >= 5}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors disabled:opacity-30"
        >
          <Plus size={14} /> Adicionar Produto
        </button>
      </div>

      <div className="space-y-3">
        {products.map((product, idx) => (
          <div key={product.id} className="bg-bg-primary rounded-lg border border-border-default p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                <div className="relative group">
                  <input
                    type="text"
                    value={product.name}
                    onChange={e => updateProduct(product.id, { name: e.target.value })}
                    onFocus={e => e.target.select()}
                    className="bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-dashed border-text-muted/30 focus:border-purple-500 transition-colors pr-6"
                    placeholder="Ex: Mentoria Premium"
                  />
                  <Edit3 size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40 group-hover:text-purple-400 transition-colors pointer-events-none" />
                </div>
              </div>
              {products.length > 1 && (
                <button onClick={() => removeProduct(product.id)} className="text-text-muted hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Preco de venda
                  <FieldHelp text="Quanto o cliente paga pelo produto. Ex: R$ 997 para um curso, R$ 2.497 para uma mentoria." />
                </label>
                <NumInput
                  value={product.ticket}
                  onChange={v => updateProduct(product.id, { ticket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Tempo p/ vender
                  <FieldHelp text="Em media, quantos dias leva desde o primeiro contato ate o cliente fechar a compra. Ex: 7 dias pra produto barato, 30-60 dias pra high ticket." />
                </label>
                <div className="relative">
                  <NumInput
                    value={product.salesCycleDays}
                    onChange={v => updateProduct(product.id, { salesCycleDays: Math.round(v) })}
                    min={1}
                    max={365}
                    className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">dias</span>
                </div>
              </div>
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Meta vendas/mes
                  <FieldHelp text="Quantas unidades desse produto voce quer vender por mes. A calculadora vai projetar os leads e investimento necessarios." />
                </label>
                <NumInput
                  value={product.targetUnits}
                  onChange={v => updateProduct(product.id, { targetUnits: Math.round(v) })}
                  min={0}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Order Bump + Upsell */}
            <BumpUpsellSection product={product} currency={currency} onChange={updates => updateProduct(product.id, updates)} />

            <div className="mt-2 text-xs text-text-muted">
              Receita projetada: <span className="text-purple-400 font-semibold">
                {formatCurrency(
                  product.ticket * product.targetUnits
                  + product.targetUnits * (product.orderBumpRate / 100) * product.orderBumpTicket
                  + product.targetUnits * (product.upsellRate / 100) * product.upsellTicket,
                  currency
                )}
              </span>/mes
              {(product.orderBumpTicket > 0 || product.upsellTicket > 0) && (
                <span className="text-green-400 ml-1">
                  (+{formatCurrency(
                    product.targetUnits * (product.orderBumpRate / 100) * product.orderBumpTicket
                    + product.targetUnits * (product.upsellRate / 100) * product.upsellTicket,
                    currency
                  )} extras)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-3">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Total produtos: {products.length}/5</span>
          <span className="text-purple-400 font-semibold">
            Receita total: {formatCurrency(products.reduce((s, p) => s + p.ticket * p.targetUnits, 0), currency)}/mes
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step 2: Marketing
// ============================================================================

function MarketingStep({ marketing, currency, onChange }: {
  marketing: PlanningState['marketing'];
  currency: Currency;
  onChange: (m: PlanningState['marketing']) => void;
}) {
  const [showSubFunnels, setShowSubFunnels] = useState(true);

  const updateChannel = (key: 'socialSelling' | 'trafego' | 'organico', field: keyof ChannelConfig, value: number) => {
    onChange({
      ...marketing,
      channels: {
        ...marketing.channels,
        [key]: { ...marketing.channels[key], [field]: value },
      },
    });
  };

  const updateSubFunnel = (id: string, field: 'pctBudget' | 'cpl' | 'name', value: number | string) => {
    onChange({
      ...marketing,
      trafegoSubFunnels: marketing.trafegoSubFunnels.map(sf =>
        sf.id === id ? { ...sf, [field]: value } : sf
      ),
    });
  };

  const addSubFunnel = () => {
    if (marketing.trafegoSubFunnels.length >= 8) return;
    onChange({
      ...marketing,
      trafegoSubFunnels: [...marketing.trafegoSubFunnels, {
        id: crypto.randomUUID(),
        name: `Funil ${marketing.trafegoSubFunnels.length + 1}`,
        pctBudget: 0,
        cpl: 10,
      }],
    });
  };

  const removeSubFunnel = (id: string) => {
    if (marketing.trafegoSubFunnels.length <= 1) return;
    onChange({
      ...marketing,
      trafegoSubFunnels: marketing.trafegoSubFunnels.filter(sf => sf.id !== id),
    });
  };

  const totalPct = marketing.channels.socialSelling.pctBudget + marketing.channels.trafego.pctBudget + marketing.channels.organico.pctBudget;
  const monthlyBudget = marketing.dailyBudget * 30;
  const trafegoBudget = monthlyBudget * marketing.channels.trafego.pctBudget / 100;
  const subFunnelTotalPct = marketing.trafegoSubFunnels.reduce((s, sf) => s + sf.pctBudget, 0);

  const channels = [
    { key: 'socialSelling' as const, label: 'Social Selling', color: 'pink', desc: 'DM, networking, conteudo' },
    { key: 'trafego' as const, label: 'Trafego Pago', color: 'orange', desc: 'Ads, Meta, Google' },
    { key: 'organico' as const, label: 'Organico', color: 'cyan', desc: 'SEO, indicacao, eventos' },
  ];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 2: Marketing</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Defina quanto vai investir por dia e como distribuir entre os canais.
          No Trafego Pago, voce pode detalhar os sub-funis (Novo Seguidor, Remarketing, etc).
        </p>
      </div>

      {/* Daily Budget */}
      <div className="bg-bg-primary rounded-lg border border-border-default p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-xs font-medium text-text-muted">
            Investimento por dia (total)
            <FieldHelp text="Quanto voce investe por dia em todas as acoes de marketing somadas. Inclui ads, ferramentas de prospecao, etc." />
          </label>
          <NumInput
            value={marketing.dailyBudget}
            onChange={v => onChange({ ...marketing, dailyBudget: v })}
            prefix={currency === 'BRL' ? 'R$' : '$'}
            min={0}
            max={50000}
            className="w-28 text-right text-sm font-bold bg-bg-secondary border border-border-default rounded-lg pr-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <input
          type="range"
          value={marketing.dailyBudget}
          onChange={e => onChange({ ...marketing, dailyBudget: parseFloat(e.target.value) })}
          min={10} max={50000} step={10}
          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-500"
          style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((marketing.dailyBudget - 10) / (50000 - 10)) * 100}%, #1f2937 ${((marketing.dailyBudget - 10) / (50000 - 10)) * 100}%, #1f2937 100%)` }}
        />
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>{formatCurrency(10, currency)}/dia</span>
          <span className="text-purple-400 font-semibold">{formatCurrency(monthlyBudget, currency)}/mes</span>
          <span>{formatCurrency(50000, currency)}/dia</span>
        </div>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        {channels.map(({ key, label, color, desc }) => {
          const ch = marketing.channels[key];
          const channelBudget = monthlyBudget * ch.pctBudget / 100;
          const estimatedLeads = key === 'trafego' && marketing.trafegoSubFunnels.length > 0
            ? marketing.trafegoSubFunnels.reduce((total, sf) => {
                const sfInv = channelBudget * sf.pctBudget / 100;
                return total + (sf.cpl > 0 ? Math.floor(sfInv / sf.cpl) : 0);
              }, 0)
            : ch.cpl > 0 ? Math.floor(channelBudget / ch.cpl) : 0;

          return (
            <div key={key} className="bg-bg-primary rounded-lg border border-border-default p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full bg-${color}-400`} />
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <span className="text-[10px] text-text-muted">({desc})</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                    % do Budget
                    <FieldHelp text={`Qual % do investimento total vai pra ${label}. A soma dos 3 canais deve dar 100%.`} />
                  </label>
                  <div className="flex items-center gap-2">
                    <NumInput
                      value={ch.pctBudget}
                      onChange={v => updateChannel(key, 'pctBudget', v)}
                      min={0} max={100}
                      className={`w-20 text-center text-sm bg-bg-secondary border border-${color}-500/30 rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-${color}-500`}
                    />
                    <span className="text-xs text-text-muted">% = {formatCurrency(channelBudget, currency)}/mes</span>
                  </div>
                </div>
                {key !== 'trafego' && (
                  <div>
                    <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                      CPL
                      <FieldHelp text="Custo por Lead — quanto custa em media pra conseguir 1 contato novo nesse canal." />
                    </label>
                    <div className="flex items-center gap-2">
                      <NumInput
                        value={ch.cpl}
                        onChange={v => updateChannel(key, 'cpl', v)}
                        min={0.1} max={500}
                        className={`w-20 text-center text-sm bg-bg-secondary border border-${color}-500/30 rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-${color}-500`}
                      />
                      <span className="text-xs text-text-muted">= ~{estimatedLeads} leads/mes</span>
                    </div>
                  </div>
                )}
                {key === 'trafego' && (
                  <div className="flex items-end">
                    <span className="text-xs text-text-muted">~{estimatedLeads} leads/mes (via sub-funis)</span>
                  </div>
                )}
              </div>

              {/* Sub-funnels for Trafego */}
              {key === 'trafego' && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSubFunnels(!showSubFunnels)}
                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors mb-3"
                  >
                    <ChevronDown size={14} className={`transition-transform ${showSubFunnels ? 'rotate-180' : ''}`} />
                    Sub-funis de Trafego ({marketing.trafegoSubFunnels.length})
                    <FieldHelp text="Divida sua verba de trafego entre diferentes funis. Cada funil tem seu proprio CPL. Ex: Novo Seguidor custa R$1.50, VSL custa R$20." />
                  </button>

                  {showSubFunnels && (
                    <div className="space-y-2 pl-1 border-l-2 border-orange-500/20 ml-1">
                      {marketing.trafegoSubFunnels.map((sf) => {
                        const sfBudget = trafegoBudget * sf.pctBudget / 100;
                        const sfLeads = sf.cpl > 0 ? Math.floor(sfBudget / sf.cpl) : 0;
                        return (
                          <div key={sf.id} className="flex items-center gap-2 pl-3 py-1.5 bg-bg-secondary/50 rounded-lg">
                            <div className="relative group flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={sf.name}
                                onChange={e => updateSubFunnel(sf.id, 'name', e.target.value)}
                                className="w-full text-xs bg-transparent text-text-primary border-b border-dashed border-text-muted/30 focus:border-orange-500 focus:outline-none pr-4"
                              />
                              <Edit3 size={8} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40 group-hover:text-orange-400 pointer-events-none" />
                            </div>
                            <div className="flex items-center gap-1">
                              <NumInput
                                value={sf.pctBudget}
                                onChange={v => updateSubFunnel(sf.id, 'pctBudget', v)}
                                min={0} max={100}
                                className="w-12 text-center text-xs bg-bg-secondary border border-orange-500/20 rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <span className="text-[10px] text-text-muted">%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-text-muted">CPL</span>
                              <NumInput
                                value={sf.cpl}
                                onChange={v => updateSubFunnel(sf.id, 'cpl', v)}
                                min={0.1} max={500}
                                prefix={currency === 'BRL' ? 'R$' : '$'}
                                className="w-16 text-xs bg-bg-secondary border border-orange-500/20 rounded pr-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <span className="text-[10px] text-text-muted whitespace-nowrap ml-auto">
                              {sfLeads} leads
                            </span>
                            {marketing.trafegoSubFunnels.length > 1 && (
                              <button onClick={() => removeSubFunnel(sf.id)} className="text-text-muted hover:text-red-400 transition-colors p-0.5 flex-shrink-0">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between pl-3 pt-1">
                        <button
                          onClick={addSubFunnel}
                          disabled={marketing.trafegoSubFunnels.length >= 8}
                          className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={10} /> Adicionar funil
                        </button>
                        <span className={`text-[10px] ${subFunnelTotalPct === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {subFunnelTotalPct}% alocado {subFunnelTotalPct !== 100 && '(ideal: 100%)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total check */}
      <div className={`rounded-lg border p-3 ${totalPct === 100 ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        <div className="flex justify-between text-xs">
          <span className={totalPct === 100 ? 'text-green-400' : 'text-yellow-400'}>
            Total: {totalPct}% {totalPct !== 100 && '(deve somar 100%)'}
          </span>
          <span className="text-text-muted">
            Investimento mensal: <span className="text-purple-400 font-semibold">{formatCurrency(monthlyBudget, currency)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step 3: Vendas
// ============================================================================

function SalesStep({ sales, onChange }: {
  sales: PlanningState['sales'];
  onChange: (s: PlanningState['sales']) => void;
}) {
  const updateOrigin = (key: 'socialSelling' | 'trafego' | 'organico', field: keyof OriginRates, value: number) => {
    onChange({
      ...sales,
      origins: {
        ...sales.origins,
        [key]: { ...sales.origins[key], [field]: Math.min(100, Math.max(0, value)) },
      },
    });
  };

  const channels = [
    { key: 'socialSelling' as const, label: 'Social Selling', color: 'pink' },
    { key: 'trafego' as const, label: 'Trafego Pago', color: 'orange' },
    { key: 'organico' as const, label: 'Organico', color: 'cyan' },
  ];

  const rateFields: { field: keyof OriginRates; label: string; desc: string; help: string }[] = [
    { field: 'qualificationRate', label: 'Qualificacao', desc: 'Lead → MQL', help: 'De cada 100 leads, quantos % respondem e sao qualificados (tem perfil, interesse e poder de compra).' },
    { field: 'schedulingRate', label: 'Agendamento', desc: 'MQL → Call agendada', help: 'Dos leads qualificados, quantos % aceitam agendar uma reuniao ou call.' },
    { field: 'attendanceRate', label: 'Comparecimento', desc: 'Agendada → Realizada', help: 'Das calls agendadas, quantas % realmente acontecem (o lead aparece).' },
    { field: 'conversionRate', label: 'Conversao', desc: 'Realizada → Venda', help: 'Das calls realizadas, em quantas % o lead fecha a compra.' },
  ];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 3: Funil de Vendas</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Cada canal tem taxas de conversao diferentes. Um lead de Social Selling geralmente converte mais
          que um de trafego pago, porque ja teve relacionamento. Ajuste as taxas baseado na sua experiencia.
        </p>
      </div>

      {/* Conversion rates table */}
      <div className="bg-bg-primary rounded-lg border border-border-default overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Etapa do funil</th>
              {channels.map(ch => (
                <th key={ch.key} className={`text-center px-3 py-3 text-xs text-${ch.color}-400 font-medium`}>
                  {ch.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rateFields.map((rf, i) => (
              <tr key={rf.field} className={i < rateFields.length - 1 ? 'border-b border-border-default' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center text-xs font-medium text-text-primary">
                    {rf.label}
                    <FieldHelp text={rf.help} />
                  </div>
                  <div className="text-[10px] text-text-muted">{rf.desc}</div>
                </td>
                {channels.map(ch => (
                  <td key={ch.key} className="text-center px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <NumInput
                        value={sales.origins[ch.key][rf.field]}
                        onChange={v => updateOrigin(ch.key, rf.field, v)}
                        min={0} max={100}
                        className={`w-16 text-center text-sm bg-bg-secondary border border-${ch.color}-500/30 rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-${ch.color}-500`}
                      />
                      <span className="text-[10px] text-text-muted">%</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Capacity */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Capacidade do Time</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-primary rounded-lg border border-border-default p-4">
            <label className="flex items-center text-xs text-text-muted mb-1">
              MQLs por SDR/mes
              <FieldHelp text="Quantos leads qualificados 1 SDR (pre-vendedor) consegue atender por mes. Padrao: 150 contatos/mes." />
            </label>
            <NumInput
              value={sales.mqlsPerSdr}
              onChange={v => onChange({ ...sales, mqlsPerSdr: Math.round(v) })}
              min={1}
              className="w-full text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="bg-bg-primary rounded-lg border border-border-default p-4">
            <label className="flex items-center text-xs text-text-muted mb-1">
              Calls por Closer/mes
              <FieldHelp text="Quantas calls de venda 1 Closer (vendedor) consegue fazer por mes. Padrao: 60 calls/mes (3/dia)." />
            </label>
            <NumInput
              value={sales.callsPerCloser}
              onChange={v => onChange({ ...sales, callsPerCloser: Math.round(v) })}
              min={1}
              className="w-full text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Conversion funnel overview per channel */}
      <div className="bg-bg-primary rounded-lg border border-border-default p-4">
        <h5 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Conversao geral do funil (lead ate venda)</h5>
        <div className="grid grid-cols-3 gap-3">
          {channels.map(ch => {
            const o = sales.origins[ch.key];
            const overallRate = (o.qualificationRate / 100) * (o.schedulingRate / 100) * (o.attendanceRate / 100) * (o.conversionRate / 100) * 100;
            return (
              <div key={ch.key} className="text-center">
                <span className={`text-xs text-${ch.color}-400 font-medium`}>{ch.label}</span>
                <div className={`text-lg font-bold text-${ch.color}-400 mt-1`}>{overallRate.toFixed(1)}%</div>
                <div className="text-[10px] text-text-muted">lead → venda</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Results Sidebar
// ============================================================================

function ResultsSidebar({ results, scenarios, activeScenario, onScenarioChange, currency, products }: {
  results: PlanResults;
  scenarios: Record<ScenarioKey, PlanResults>;
  activeScenario: ScenarioKey;
  onScenarioChange: (s: ScenarioKey) => void;
  currency: Currency;
  products: ProductItem[];
}) {
  const r = results;

  return (
    <div className="lg:w-80 shrink-0 px-6 py-5 bg-bg-primary/30">
      {/* Scenario Toggle */}
      <div className="flex items-center gap-1 mb-4 bg-bg-secondary rounded-lg p-0.5 border border-border-default">
        {(['pessimista', 'realista', 'otimista'] as ScenarioKey[]).map(key => (
          <button
            key={key}
            onClick={() => onScenarioChange(key)}
            className={`flex-1 px-2 py-1.5 text-[10px] font-semibold rounded-md transition-all ${
              activeScenario === key
                ? key === 'pessimista' ? 'bg-yellow-500/20 text-yellow-400 shadow-sm'
                : key === 'realista' ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-green-500/20 text-green-400 shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {SCENARIO_LABELS[key]}
          </button>
        ))}
      </div>

      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Projecao 30 dias</h4>

      <div className="space-y-2">
        <SidebarMetric label="Investimento" value={formatCurrency(r.totalInvestment, currency)} icon={<DollarSign size={14} />} color="purple" />
        <SidebarMetric label="Total Leads" value={r.totalLeads.toLocaleString()} icon={<Users size={14} />} />
        <SidebarMetric label="MQLs" value={r.mqls.toLocaleString()} />
        <SidebarMetric label="Calls Agendadas" value={r.scheduledCalls.toLocaleString()} icon={<Calendar size={14} />} />
        <SidebarMetric label="Calls Realizadas" value={r.attendedCalls.toLocaleString()} />

        <div className="border-t border-border-default my-3" />

        <SidebarMetric label="Vendas" value={r.totalSales.toLocaleString()} icon={<CheckCircle size={14} />} color="purple" bold />
        <SidebarMetric label="Faturamento" value={formatCurrency(r.totalRevenue, currency)} icon={<DollarSign size={14} />} color="green" bold />

        <div className="border-t border-border-default my-3" />

        <SidebarMetric label="ROAS" value={`${r.roas.toFixed(1)}x`} />
        <SidebarMetric label="CAC" value={formatCurrency(r.cac, currency)} />
        <SidebarMetric label="SDRs" value={String(r.sdrCount)} />
        <SidebarMetric label="Closers" value={String(r.closerCount)} />
        <SidebarMetric
          label="Lucro Liquido"
          value={formatCurrency(r.netProfit, currency)}
          color={r.netProfit >= 0 ? 'green' : 'red'}
          bold
        />
      </div>

      {/* Scenario comparison mini-table */}
      <div className="mt-4 pt-3 border-t border-border-default">
        <h5 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Cenarios</h5>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-1"></th>
              <th className="text-center py-1 text-yellow-400">Aceit.</th>
              <th className="text-center py-1 text-purple-400">Real.</th>
              <th className="text-center py-1 text-green-400">Otim.</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr>
              <td className="py-0.5">Vendas</td>
              <td className="text-center">{scenarios.pessimista.totalSales}</td>
              <td className="text-center font-bold text-purple-400">{scenarios.realista.totalSales}</td>
              <td className="text-center">{scenarios.otimista.totalSales}</td>
            </tr>
            <tr>
              <td className="py-0.5">Receita</td>
              <td className="text-center">{formatCurrency(scenarios.pessimista.totalRevenue, currency).replace(/\s/g, '')}</td>
              <td className="text-center font-bold text-purple-400">{formatCurrency(scenarios.realista.totalRevenue, currency).replace(/\s/g, '')}</td>
              <td className="text-center">{formatCurrency(scenarios.otimista.totalRevenue, currency).replace(/\s/g, '')}</td>
            </tr>
            <tr>
              <td className="py-0.5">ROAS</td>
              <td className="text-center">{scenarios.pessimista.roas.toFixed(1)}x</td>
              <td className="text-center font-bold text-purple-400">{scenarios.realista.roas.toFixed(1)}x</td>
              <td className="text-center">{scenarios.otimista.roas.toFixed(1)}x</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* By channel */}
      <div className="mt-3 pt-3 border-t border-border-default">
        <h5 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Por Canal</h5>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-1"></th>
              <th className="text-center py-1 text-pink-400">SS</th>
              <th className="text-center py-1 text-orange-400">Traf</th>
              <th className="text-center py-1 text-cyan-400">Org</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr><td className="py-0.5">Leads</td><td className="text-center">{r.byChannel.socialSelling.leads}</td><td className="text-center">{r.byChannel.trafego.leads}</td><td className="text-center">{r.byChannel.organico.leads}</td></tr>
            <tr><td className="py-0.5">MQLs</td><td className="text-center">{r.byChannel.socialSelling.mqls}</td><td className="text-center">{r.byChannel.trafego.mqls}</td><td className="text-center">{r.byChannel.organico.mqls}</td></tr>
            <tr><td className="py-0.5">Agend.</td><td className="text-center">{r.byChannel.socialSelling.scheduledCalls}</td><td className="text-center">{r.byChannel.trafego.scheduledCalls}</td><td className="text-center">{r.byChannel.organico.scheduledCalls}</td></tr>
            <tr className="font-bold"><td className="py-0.5">Vendas</td><td className="text-center text-pink-400">{r.byChannel.socialSelling.sales}</td><td className="text-center text-orange-400">{r.byChannel.trafego.sales}</td><td className="text-center text-cyan-400">{r.byChannel.organico.sales}</td></tr>
          </tbody>
        </table>
      </div>

      {/* By sub-funnel */}
      {r.bySubFunnel.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-default">
          <h5 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Sub-funis Trafego</h5>
          <div className="space-y-1">
            {r.bySubFunnel.map((sf, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary truncate mr-2">{sf.name}</span>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-text-muted">{sf.leads} leads</span>
                  <span className="text-orange-400 font-semibold">{formatCurrency(sf.investment, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By product */}
      {r.byProduct.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-default">
          <h5 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Por Produto</h5>
          <div className="space-y-2">
            {r.byProduct.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary truncate mr-2">{p.name}</span>
                  <span className="text-purple-400 font-semibold whitespace-nowrap">{formatCurrency(p.revenue, currency)}</span>
                </div>
                {(p.revenueBump > 0 || p.revenueUpsell > 0) && (
                  <div className="flex gap-2 ml-2 text-[10px] text-text-muted">
                    {p.revenueBump > 0 && <span className="text-green-400">+bump {formatCurrency(p.revenueBump, currency)}</span>}
                    {p.revenueUpsell > 0 && <span className="text-green-400">+upsell {formatCurrency(p.revenueUpsell, currency)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarMetric({ label, value, icon, color, bold }: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'purple';
  bold?: boolean;
}) {
  const colorClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'purple' ? 'text-purple-400' : 'text-text-primary';

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span className="text-[11px] text-text-muted">{label}</span>
      </div>
      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${colorClass}`}>{value}</span>
    </div>
  );
}

// ============================================================================
// Executive Summary (post-save view)
// ============================================================================

function ExecutiveSummary({ goal, scenarios, currency, onEdit, onNew }: {
  goal: SalesGoal;
  scenarios: { pessimista: PlanResults; realista: PlanResults; otimista: PlanResults } | null;
  currency: Currency;
  onEdit: () => void;
  onNew: () => void;
}) {
  const r = scenarios?.realista;
  if (!r) return null;

  const p = scenarios.pessimista;
  const o = scenarios.otimista;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Resumo do Planejamento</h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            {new Date(goal.period_start).toLocaleDateString('pt-BR')} - {new Date(goal.period_end).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-3 py-1.5 text-xs bg-bg-hover hover:bg-bg-primary border border-border-default text-text-primary rounded-lg font-medium transition-colors flex items-center gap-1.5">
            <Edit3 size={12} /> Editar
          </button>
          <button onClick={onNew} className="px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg font-medium transition-colors flex items-center gap-1.5">
            <PlusCircle size={12} /> Nova Meta
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Investimento" value={formatCurrency(r.totalInvestment, currency)} sub={`${formatCurrency(goal.calc_daily_investment, currency)}/dia`} color="purple" />
        <KpiCard label="Vendas" value={String(r.totalSales)} sub={`${r.totalLeads} leads → ${r.totalSales} vendas`} color="purple" />
        <KpiCard label="Faturamento" value={formatCurrency(r.totalRevenue, currency)} sub={`ROAS ${r.roas.toFixed(1)}x`} color="green" />
        <KpiCard label="Lucro Liquido" value={formatCurrency(r.netProfit, currency)} sub={`CAC ${formatCurrency(r.cac, currency)}`} color={r.netProfit >= 0 ? 'green' : 'red'} />
      </div>

      {/* Scenarios + Funnel + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scenario Table */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Cenarios</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2 text-xs text-text-muted font-medium"></th>
                <th className="text-center py-2 text-xs text-yellow-400 font-medium">Aceitavel</th>
                <th className="text-center py-2 text-xs text-purple-400 font-medium">Realista</th>
                <th className="text-center py-2 text-xs text-green-400 font-medium">Otimista</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-default/50">
                <td className="py-2 text-xs text-text-muted">Vendas</td>
                <td className="text-center text-xs text-text-secondary">{p.totalSales}</td>
                <td className="text-center text-xs font-bold text-purple-400">{r.totalSales}</td>
                <td className="text-center text-xs text-text-secondary">{o.totalSales}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="py-2 text-xs text-text-muted">Faturamento</td>
                <td className="text-center text-xs text-text-secondary">{formatCurrency(p.totalRevenue, currency)}</td>
                <td className="text-center text-xs font-bold text-purple-400">{formatCurrency(r.totalRevenue, currency)}</td>
                <td className="text-center text-xs text-text-secondary">{formatCurrency(o.totalRevenue, currency)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="py-2 text-xs text-text-muted">ROAS</td>
                <td className="text-center text-xs text-text-secondary">{p.roas.toFixed(1)}x</td>
                <td className="text-center text-xs font-bold text-purple-400">{r.roas.toFixed(1)}x</td>
                <td className="text-center text-xs text-text-secondary">{o.roas.toFixed(1)}x</td>
              </tr>
              <tr>
                <td className="py-2 text-xs text-text-muted">Lucro</td>
                <td className={`text-center text-xs ${p.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(p.netProfit, currency)}</td>
                <td className={`text-center text-xs font-bold ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(r.netProfit, currency)}</td>
                <td className={`text-center text-xs ${o.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(o.netProfit, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Funnel Visual */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Funil de Vendas</h4>
          <div className="space-y-2">
            {[
              { label: 'Leads', value: r.totalLeads, maxValue: r.totalLeads },
              { label: 'MQLs', value: r.mqls, maxValue: r.totalLeads },
              { label: 'Agendados', value: r.scheduledCalls, maxValue: r.totalLeads },
              { label: 'Realizados', value: r.attendedCalls, maxValue: r.totalLeads },
              { label: 'Vendas', value: r.totalSales, maxValue: r.totalLeads },
            ].map((item, i) => {
              const pct = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="text-text-primary font-semibold">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-bg-primary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {r.totalLeads > 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                Conversao geral: <span className="text-purple-400 font-semibold">{((r.totalSales / r.totalLeads) * 100).toFixed(2)}%</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Products Breakdown */}
      {r.byProduct.length > 0 && (
        <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Produtos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {r.byProduct.map((bp, i) => (
              <div key={i} className="bg-bg-primary rounded-lg border border-border-default p-3">
                <div className="text-xs font-medium text-text-primary mb-1">{bp.name}</div>
                <div className="text-lg font-bold text-purple-400">{formatCurrency(bp.revenue, currency)}</div>
                <div className="text-[10px] text-text-muted mt-1">
                  {bp.targetUnits} vendas x {formatCurrency(bp.ticket, currency)}
                </div>
                {(bp.revenueBump > 0 || bp.revenueUpsell > 0) && (
                  <div className="mt-1 space-y-0.5">
                    {bp.revenueBump > 0 && (
                      <div className="text-[10px] text-green-400">+ Bump: {formatCurrency(bp.revenueBump, currency)}</div>
                    )}
                    {bp.revenueUpsell > 0 && (
                      <div className="text-[10px] text-green-400">+ Upsell: {formatCurrency(bp.revenueUpsell, currency)}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border-default flex justify-between text-xs">
            <span className="text-text-muted">Total</span>
            <span className="text-purple-400 font-bold">{formatCurrency(r.totalRevenue, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub: string;
  color: 'purple' | 'green' | 'red';
}) {
  const accent = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-purple-400';
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] text-text-muted mt-1">{sub}</div>
    </div>
  );
}

// ============================================================================
// Auxiliary Components (kept from original)
// ============================================================================

function ProgressCard({ label, projection }: {
  label: string;
  projection: any;
}) {
  const status = STATUS_CONFIG[projection.status as keyof typeof STATUS_CONFIG];
  const progress = Math.min(100, Math.round((projection.actualToDate / projection.goalTotal) * 100));

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">
        {projection.actualToDate} <span className="text-sm text-text-muted">/ {projection.goalTotal}</span>
      </div>
      <div className="w-full bg-bg-primary rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            projection.status === 'ahead' ? 'bg-emerald-500' :
            projection.status === 'on_track' ? 'bg-green-500' :
            projection.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">
        Projecao: {projection.projectedTotal} ({projection.projectedPercentOfGoal}%)
      </p>
    </div>
  );
}

function LocationSelector({ locations, selectedLocationId, onChange, isLoading }: {
  locations: { location_id: string; location_name: string }[];
  selectedLocationId: string | null;
  onChange: (id: string | null) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const selected = locations.find(l => l.location_id === selectedLocationId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-purple-500/50 transition-colors disabled:opacity-50 min-w-[160px]"
      >
        <Building2 size={14} className={selected ? 'text-purple-400' : 'text-text-muted'} />
        <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.location_name : 'Todos os Clientes'}
        </span>
        <ChevronDown size={14} className={`text-text-muted ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-bg-primary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !selectedLocationId ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-text-primary hover:bg-bg-hover'
            }`}
          >
            Todos os Clientes
          </button>
          <div className="border-t border-border-default max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">Nenhum cliente encontrado</div>
            ) : (
              filtered.map(loc => (
                <button
                  key={loc.location_id}
                  onClick={() => { onChange(loc.location_id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedLocationId === loc.location_id
                      ? 'bg-purple-500/20 text-purple-400 font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {loc.location_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Planejamento;
