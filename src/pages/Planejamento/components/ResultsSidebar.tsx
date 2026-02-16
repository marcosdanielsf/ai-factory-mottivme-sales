import React from 'react';
import { DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import type { PlanResults, ScenarioKey, Currency, ProductItem } from '../types';
import { SCENARIO_LABELS } from '../constants';
import { formatCurrency } from '../calculation-engine';

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

export function ResultsSidebar({ results, scenarios, activeScenario, onScenarioChange, currency, products }: {
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
