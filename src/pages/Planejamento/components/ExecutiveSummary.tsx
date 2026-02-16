import { Edit3, PlusCircle } from 'lucide-react';
import type { PlanResults, Currency } from '../types';
import { formatCurrency } from '../calculation-engine';
import { SalesGoal } from '../../../hooks/useSalesGoals';

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

export function ExecutiveSummary({ goal, scenarios, currency, onEdit, onNew }: {
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
