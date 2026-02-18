import type {
  AnnualProductRow,
  AnnualCostRow,
  AnnualPlanState,
  AnnualCashFlowRow,
  AnnualKPIResults,
  OutboundChannel,
  InboundConfig,
  InboundFunnelRow,
  InboundSummary,
  Currency,
} from './types';
import type { Product } from '../../hooks/useProducts';
import type { SalesGoal } from '../../hooks/useSalesGoals';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DEFAULT_COSTS: { category: AnnualCostRow['category']; label: string }[] = [
  { category: 'marketing', label: 'Marketing & Trafego' },
  { category: 'operacional', label: 'Operacional' },
  { category: 'ocupacional', label: 'Ocupacional (aluguel, agua, luz)' },
  { category: 'gestao', label: 'Gestao & Software' },
  { category: 'impostos', label: 'Impostos' },
];

const DEFAULT_OUTBOUND_CHANNELS: { id: string; name: string }[] = [
  { id: 'ss_ig', name: 'Social Selling - IG' },
  { id: 'ss_linkedin', name: 'Social Selling - LinkedIn' },
  { id: 'networks', name: 'Networks' },
  { id: 'indicacao', name: 'Programa de indicacao' },
];

const DEFAULT_INBOUND: InboundConfig = {
  taxaPropostaVenda: 50,
  taxaCadastroProposta: 20,
  taxaTrafegoCadastro: 2,
  cpcMedio: 1.83,
  pctOrganicoGarantido: 0,
};

// ============================================================================
// PRODUCT ROW
// ============================================================================

export function recalcProductRow(row: AnnualProductRow): AnnualProductRow {
  const discountMultiplier = 1 - (row.maxDiscountPct / 100);
  const effectiveTicket = row.ticket * discountMultiplier;
  const descontoPerUnit = row.ticket * (row.maxDiscountPct / 100);
  let totalQtd = 0;
  let totalAnual = 0;
  let totalDesconto = 0;
  let acumulado = 0;
  const monthly: typeof row.monthly = {};

  for (let m = 1; m <= 12; m++) {
    const qtd = row.monthly[m]?.qtd ?? 0;
    const vendasBrl = qtd * effectiveTicket;
    const descontoBrl = qtd * descontoPerUnit;
    acumulado += vendasBrl;
    totalQtd += qtd;
    totalAnual += vendasBrl;
    totalDesconto += descontoBrl;
    monthly[m] = { qtd, vendasBrl, descontoBrl, receitaAcumulada: acumulado };
  }

  return { ...row, monthly, totalQtd, totalAnual, totalDesconto };
}

// ============================================================================
// OUTBOUND / INBOUND
// ============================================================================

export function calcInboundFunnel(state: AnnualPlanState): InboundFunnelRow[] {
  const { inboundConfig, outboundChannels, productRows } = state;
  const rows: InboundFunnelRow[] = [];

  for (let m = 1; m <= 12; m++) {
    const vendasOutbound = outboundChannels.reduce((s, ch) => s + (ch.monthly[m] ?? 0), 0);
    const vendasTotalMeta = productRows.reduce((s, pr) => s + (pr.monthly[m]?.qtd ?? 0), 0);
    const vendasInbound = Math.max(0, vendasTotalMeta - vendasOutbound);

    // Reverse funnel: vendas → propostas → cadastros → tráfego
    const taxaPV = inboundConfig.taxaPropostaVenda / 100;
    const taxaCP = inboundConfig.taxaCadastroProposta / 100;
    const taxaTC = inboundConfig.taxaTrafegoCadastro / 100;

    const propostas = taxaPV > 0 ? Math.ceil(vendasInbound / taxaPV) : 0;
    const cadastros = taxaCP > 0 ? Math.ceil(propostas / taxaCP) : 0;
    const necessidadeTrafego = taxaTC > 0 ? Math.ceil(cadastros / taxaTC) : 0;

    rows.push({
      month: m,
      label: MONTH_LABELS[m - 1],
      vendasOutbound,
      vendasInbound,
      propostas,
      cadastros,
      necessidadeTrafego,
    });
  }

  return rows;
}

export function calcInboundSummary(
  funnelRows: InboundFunnelRow[],
  inboundConfig: InboundConfig,
  faturamentoTotal: number
): InboundSummary {
  const trafegoTotal = funnelRows.reduce((s, r) => s + r.necessidadeTrafego, 0);
  const trafegoPago = trafegoTotal * (1 - inboundConfig.pctOrganicoGarantido / 100);
  const investimentoMidia = trafegoPago * inboundConfig.cpcMedio;
  const mediaMensal = investimentoMidia / 12;
  const pctDoFaturamento = faturamentoTotal > 0 ? (investimentoMidia / faturamentoTotal) * 100 : 0;

  return { investimentoMidia, mediaMensal, pctDoFaturamento, trafegoTotal };
}

// ============================================================================
// CASH FLOW
// ============================================================================

export function calcAnnualCashFlow(state: AnnualPlanState): AnnualCashFlowRow[] {
  const rows: AnnualCashFlowRow[] = [];
  let acumulado = state.saldoInicial;

  for (let m = 1; m <= 12; m++) {
    const totalEntradas = state.productRows.reduce(
      (sum, pr) => sum + (pr.monthly[m]?.vendasBrl ?? 0),
      0
    );
    const totalSaidas = state.costRows.reduce(
      (sum, cr) => sum + (cr.monthly[m] ?? 0),
      0
    );
    const resultado = totalEntradas - totalSaidas;
    acumulado += resultado;

    rows.push({
      month: m,
      label: MONTH_LABELS[m - 1],
      totalEntradas,
      totalSaidas,
      resultado,
      fluxoAcumulado: acumulado,
    });
  }

  return rows;
}

// ============================================================================
// KPIs
// ============================================================================

export function calcAnnualKPIs(
  state: AnnualPlanState,
  baselineGoal?: SalesGoal | null
): AnnualKPIResults {
  const contratosTotal = state.productRows.reduce((s, r) => s + r.totalQtd, 0);
  const faturamentoTotal = state.productRows.reduce((s, r) => s + r.totalAnual, 0);
  const custoTotal = state.costRows.reduce((s, r) => s + r.totalAnual, 0);
  const lucroLiquido = faturamentoTotal - custoTotal;
  const ticketMedio = contratosTotal > 0 ? faturamentoTotal / contratosTotal : 0;

  let yoyGrowthPct: number | null = null;
  let baseline: AnnualKPIResults['baseline'] | undefined;

  if (baselineGoal) {
    const bFat = baselineGoal.goal_revenue_brl ?? 0;
    const bContratos = baselineGoal.goal_vendas ?? 0;
    baseline = { contratosTotal: bContratos, faturamentoTotal: bFat };
    if (bFat > 0) {
      yoyGrowthPct = ((faturamentoTotal - bFat) / bFat) * 100;
    }
  }

  return { contratosTotal, ticketMedio, faturamentoTotal, custoTotal, lucroLiquido, yoyGrowthPct, baseline };
}

// ============================================================================
// INIT / SERIALIZE / DESERIALIZE
// ============================================================================

function emptyMonthlyRecord<T>(val: T): Record<number, T> {
  const r: Record<number, T> = {};
  for (let m = 1; m <= 12; m++) r[m] = val;
  return r;
}

export function initAnnualState(
  year: number,
  products: Product[],
  currency: Currency
): AnnualPlanState {
  const productRows: AnnualProductRow[] = products.map(p => ({
    productId: p.id,
    productName: p.name,
    ticket: Number(p.ticket),
    maxDiscountPct: 0,
    monthly: emptyMonthlyRecord({ qtd: 0, vendasBrl: 0, descontoBrl: 0, receitaAcumulada: 0 }),
    totalQtd: 0,
    totalAnual: 0,
    totalDesconto: 0,
  }));

  const costRows: AnnualCostRow[] = DEFAULT_COSTS.map(c => ({
    category: c.category,
    label: c.label,
    fixedMonthly: 0,
    monthly: emptyMonthlyRecord(0),
    totalAnual: 0,
  }));

  const outboundChannels: OutboundChannel[] = DEFAULT_OUTBOUND_CHANNELS.map(ch => ({
    ...ch,
    monthly: emptyMonthlyRecord(0),
    totalAnual: 0,
  }));

  return {
    year,
    currency,
    productRows,
    costRows,
    outboundChannels,
    inboundConfig: { ...DEFAULT_INBOUND },
    saldoInicial: 0,
    isDirty: false,
  };
}

export function serializeAnnualPlan(state: AnnualPlanState): Record<string, any> {
  return {
    annual_plan: {
      version: 2,
      productRows: state.productRows,
      costRows: state.costRows,
      outboundChannels: state.outboundChannels,
      inboundConfig: state.inboundConfig,
      saldoInicial: state.saldoInicial,
    },
  };
}

export function deserializeAnnualPlan(
  goal: SalesGoal,
  products: Product[]
): AnnualPlanState {
  const mkt = goal.marketing_config as any;
  const saved = mkt?.annual_plan;

  if (!saved || (saved.version !== 1 && saved.version !== 2)) {
    return initAnnualState(
      new Date(goal.period_start).getFullYear(),
      products,
      (goal.currency as Currency) || 'BRL'
    );
  }

  const year = new Date(goal.period_start).getFullYear();
  const currency = (goal.currency as Currency) || 'BRL';

  // Merge saved product rows with current products
  const productRows: AnnualProductRow[] = products.map(p => {
    const savedRow = (saved.productRows as AnnualProductRow[])?.find(sr => sr.productId === p.id);
    if (savedRow) {
      // Migrate v1 maxDiscount (value) → v2 maxDiscountPct
      const migrated = {
        ...savedRow,
        productName: p.name,
        ticket: Number(p.ticket),
        maxDiscountPct: savedRow.maxDiscountPct ?? 0,
        totalDesconto: savedRow.totalDesconto ?? 0,
      };
      // Remove legacy field if present
      delete (migrated as any).maxDiscount;
      return recalcProductRow(migrated);
    }
    return {
      productId: p.id,
      productName: p.name,
      ticket: Number(p.ticket),
      maxDiscountPct: 0,
      monthly: emptyMonthlyRecord({ qtd: 0, vendasBrl: 0, descontoBrl: 0, receitaAcumulada: 0 }),
      totalQtd: 0,
      totalAnual: 0,
      totalDesconto: 0,
    };
  });

  const costRows: AnnualCostRow[] = (saved.costRows as AnnualCostRow[])?.length
    ? (saved.costRows as AnnualCostRow[])
    : DEFAULT_COSTS.map(c => ({
        category: c.category,
        label: c.label,
        fixedMonthly: 0,
        monthly: emptyMonthlyRecord(0),
        totalAnual: 0,
      }));

  // v2 fields — fallback to defaults for v1 data
  const outboundChannels: OutboundChannel[] = saved.outboundChannels ||
    DEFAULT_OUTBOUND_CHANNELS.map(ch => ({ ...ch, monthly: emptyMonthlyRecord(0), totalAnual: 0 }));

  const inboundConfig: InboundConfig = saved.inboundConfig || { ...DEFAULT_INBOUND };

  return {
    year,
    currency,
    productRows,
    costRows,
    outboundChannels,
    inboundConfig,
    saldoInicial: saved.saldoInicial ?? 0,
    goalId: goal.id,
    isDirty: false,
  };
}
