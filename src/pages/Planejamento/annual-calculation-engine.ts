import type {
  AnnualProductRow,
  AnnualCostRow,
  AnnualPlanState,
  AnnualCashFlowRow,
  AnnualKPIResults,
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

export function recalcProductRow(row: AnnualProductRow): AnnualProductRow {
  const effectiveTicket = row.ticket - row.maxDiscount;
  let totalQtd = 0;
  let totalAnual = 0;
  let acumulado = 0;
  const monthly: typeof row.monthly = {};

  for (let m = 1; m <= 12; m++) {
    const qtd = row.monthly[m]?.qtd ?? 0;
    const vendasBrl = qtd * effectiveTicket;
    acumulado += vendasBrl;
    totalQtd += qtd;
    totalAnual += vendasBrl;
    monthly[m] = { qtd, vendasBrl, receitaAcumulada: acumulado };
  }

  return { ...row, monthly, totalQtd, totalAnual };
}

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

export function initAnnualState(
  year: number,
  products: Product[],
  currency: Currency
): AnnualPlanState {
  const emptyMonthly: Record<number, { qtd: number; vendasBrl: number; receitaAcumulada: number }> = {};
  for (let m = 1; m <= 12; m++) {
    emptyMonthly[m] = { qtd: 0, vendasBrl: 0, receitaAcumulada: 0 };
  }

  const productRows: AnnualProductRow[] = products.map(p => ({
    productId: p.id,
    productName: p.name,
    ticket: Number(p.ticket),
    maxDiscount: 0,
    monthly: { ...emptyMonthly },
    totalQtd: 0,
    totalAnual: 0,
  }));

  const emptyCostMonthly: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) emptyCostMonthly[m] = 0;

  const costRows: AnnualCostRow[] = DEFAULT_COSTS.map(c => ({
    category: c.category,
    label: c.label,
    fixedMonthly: 0,
    monthly: { ...emptyCostMonthly },
    totalAnual: 0,
  }));

  return { year, currency, productRows, costRows, saldoInicial: 0, isDirty: false };
}

export function serializeAnnualPlan(state: AnnualPlanState): Record<string, any> {
  return {
    annual_plan: {
      version: 1,
      productRows: state.productRows,
      costRows: state.costRows,
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

  if (!saved || saved.version !== 1) {
    return initAnnualState(
      new Date(goal.period_start).getFullYear(),
      products,
      (goal.currency as Currency) || 'BRL'
    );
  }

  const year = new Date(goal.period_start).getFullYear();

  // Merge saved product rows with current products (names/tickets may have changed)
  const productRows: AnnualProductRow[] = products.map(p => {
    const savedRow = (saved.productRows as AnnualProductRow[])?.find(
      sr => sr.productId === p.id
    );
    if (savedRow) {
      return recalcProductRow({
        ...savedRow,
        productName: p.name,
        ticket: Number(p.ticket),
      });
    }
    const emptyMonthly: Record<number, { qtd: number; vendasBrl: number; receitaAcumulada: number }> = {};
    for (let m = 1; m <= 12; m++) emptyMonthly[m] = { qtd: 0, vendasBrl: 0, receitaAcumulada: 0 };
    return { productId: p.id, productName: p.name, ticket: Number(p.ticket), maxDiscount: 0, monthly: emptyMonthly, totalQtd: 0, totalAnual: 0 };
  });

  const costRows: AnnualCostRow[] = (saved.costRows as AnnualCostRow[]) || [];

  return {
    year,
    currency: (goal.currency as Currency) || 'BRL',
    productRows,
    costRows,
    saldoInicial: saved.saldoInicial ?? 0,
    goalId: goal.id,
    isDirty: false,
  };
}
