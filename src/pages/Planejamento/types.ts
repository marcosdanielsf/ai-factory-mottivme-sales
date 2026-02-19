export type Currency = 'BRL' | 'USD';

export interface ProductItem {
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

export interface SubFunnel {
  id: string;
  name: string;
  pctBudget: number;
  cpl: number;
  qualificationRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
}

export interface PlanningState {
  step: 1 | 2 | 3;
  currency: Currency;
  products: ProductItem[];
  marketing: {
    dailyBudget: number;
    subFunnels: SubFunnel[];
  };
  scenarioConfig: ScenarioConfig;
}

export interface SubFunnelResults {
  id: string;
  name: string;
  investment: number;
  leads: number;
  cpl: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  sales: number;
  revenue: number;
  overallRate: number;
}

export type ScenarioKey = 'pessimista' | 'realista' | 'otimista';

export interface ScenarioConfig {
  pessimista: number;
  realista: number;
  otimista: number;
}

export interface PlanResults {
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
  bySubFunnel: SubFunnelResults[];
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
}

// ============================================================================
// ANNUAL PLAN TYPES
// ============================================================================

export interface AnnualProductRow {
  productId: string;
  productName: string;
  ticket: number;
  maxDiscountPct: number;
  monthly: Record<number, { qtd: number; vendasBrl: number; descontoBrl: number; receitaAcumulada: number }>;
  totalQtd: number;
  totalAnual: number;
  totalDesconto: number;
}

export type CostCategory = 'marketing' | 'operacional' | 'ocupacional' | 'gestao' | 'impostos';

export interface AnnualCostRow {
  category: CostCategory;
  label: string;
  fixedMonthly: number | null;
  monthly: Record<number, number>;
  totalAnual: number;
}

export interface OutboundChannel {
  id: string;
  name: string;
  monthly: Record<number, number>;
  totalAnual: number;
}

export interface InboundConfig {
  taxaPropostaVenda: number;
  taxaCadastroProposta: number;
  taxaTrafegoCadastro: number;
  cpcMedio: number;
  pctOrganicoGarantido: number;
}

export interface InboundFunnelRow {
  month: number;
  label: string;
  vendasOutbound: number;
  vendasInbound: number;
  propostas: number;
  cadastros: number;
  necessidadeTrafego: number;
}

export interface InboundSummary {
  investimentoMidia: number;
  mediaMensal: number;
  pctDoFaturamento: number;
  trafegoTotal: number;
}

export interface AnnualPlanState {
  year: number;
  currency: Currency;
  productRows: AnnualProductRow[];
  costRows: AnnualCostRow[];
  outboundChannels: OutboundChannel[];
  inboundConfig: InboundConfig;
  saldoInicial: number;
  goalId?: string;
  isDirty: boolean;
}

export interface AnnualCashFlowRow {
  month: number;
  label: string;
  totalEntradas: number;
  totalSaidas: number;
  resultado: number;
  fluxoAcumulado: number;
}

export interface AnnualKPIResults {
  contratosTotal: number;
  ticketMedio: number;
  faturamentoTotal: number;
  custoTotal: number;
  lucroLiquido: number;
  yoyGrowthPct: number | null;
  baseline?: { contratosTotal: number; faturamentoTotal: number };
}
