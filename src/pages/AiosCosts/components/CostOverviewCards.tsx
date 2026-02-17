import { ReactNode } from 'react';
import { DollarSign, TrendingUp, Zap, PiggyBank } from 'lucide-react';

interface CostOverviewCardsProps {
  totalCost: number;
  totalTokens: number;
  totalEvents: number;
  budgetRemaining: number;
  loading: boolean;
}

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  iconBg: string;
}

function KpiCard({ icon, label, value, change, changePositive, iconBg }: KpiCardProps) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-text-primary text-2xl font-bold">{value}</span>
        {change && (
          <span className={`text-xs font-medium ${changePositive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

export function CostOverviewCards({
  totalCost,
  totalTokens,
  totalEvents,
  budgetRemaining,
  loading,
}: CostOverviewCardsProps) {
  const avgCostPerEvent = totalEvents > 0 ? totalCost / totalEvents : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={<DollarSign size={18} className="text-indigo-400" />}
        iconBg="bg-indigo-400/10"
        label="Total Gasto"
        value={`$${totalCost.toFixed(4)}`}
      />
      <KpiCard
        icon={<TrendingUp size={18} className="text-green-400" />}
        iconBg="bg-green-400/10"
        label="Custo Medio por Evento"
        value={`$${avgCostPerEvent.toFixed(6)}`}
      />
      <KpiCard
        icon={<Zap size={18} className="text-amber-400" />}
        iconBg="bg-amber-400/10"
        label="Total Tokens"
        value={totalTokens.toLocaleString('pt-BR')}
      />
      <KpiCard
        icon={<PiggyBank size={18} className="text-violet-400" />}
        iconBg="bg-violet-400/10"
        label="Budget Restante"
        value={budgetRemaining >= 0 ? `$${budgetRemaining.toFixed(2)}` : 'N/A'}
        changePositive={budgetRemaining >= 0}
      />
    </div>
  );
}
