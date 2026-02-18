import type { AnnualKPIResults, Currency } from '../../types';
import { formatCurrency } from '../../calculation-engine';
import { KpiCard } from './KpiCard';

export function AnnualKPIs({ kpis, currency }: {
  kpis: AnnualKPIResults;
  currency: Currency;
}) {
  const fmt = (v: number) => formatCurrency(v, currency);
  const yoyLabel = kpis.yoyGrowthPct !== null
    ? `${kpis.yoyGrowthPct >= 0 ? '+' : ''}${kpis.yoyGrowthPct.toFixed(0)}% vs ano anterior`
    : 'Sem baseline anterior';

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Resumo Anual</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Contratos"
          value={String(kpis.contratosTotal)}
          sub={kpis.baseline ? `Baseline: ${kpis.baseline.contratosTotal}` : 'Total anual'}
          color="blue"
        />
        <KpiCard
          label="Ticket Medio"
          value={fmt(kpis.ticketMedio)}
          sub="Receita / contratos"
          color="blue"
        />
        <KpiCard
          label="Faturamento"
          value={fmt(kpis.faturamentoTotal)}
          sub={yoyLabel}
          color="green"
        />
        <KpiCard
          label="Lucro Liquido"
          value={fmt(kpis.lucroLiquido)}
          sub={`Custos: ${fmt(kpis.custoTotal)}`}
          color={kpis.lucroLiquido >= 0 ? 'green' : 'red'}
        />
      </div>

      {kpis.yoyGrowthPct !== null && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            kpis.yoyGrowthPct >= 0
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {kpis.yoyGrowthPct >= 0 ? '+' : ''}{kpis.yoyGrowthPct.toFixed(0)}% YoY
          </span>
          {kpis.baseline && (
            <span className="text-[10px] text-text-muted">
              {fmt(kpis.baseline.faturamentoTotal)} → {fmt(kpis.faturamentoTotal)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
