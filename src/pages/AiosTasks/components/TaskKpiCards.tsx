import { CheckSquare, TrendingUp, Bot, Cpu, Leaf } from 'lucide-react';
import { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}

function KpiCard({ icon, iconBg, label, value, sub }: KpiCardProps) {
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
        {sub && (
          <span className="text-xs text-text-muted">{sub}</span>
        )}
      </div>
    </div>
  );
}

interface TaskKpiCardsProps {
  total: number;
  tasksPerDay: number;
  byExecutor: Record<string, number>;
  economiaEstimada: number;
  totalCost: number;
  loading: boolean;
}

export function TaskKpiCards({
  total,
  tasksPerDay,
  byExecutor,
  economiaEstimada,
  totalCost,
  loading,
}: TaskKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        icon={<CheckSquare size={18} className="text-indigo-400" />}
        iconBg="bg-indigo-400/10"
        label="Total Tasks"
        value={total.toLocaleString('pt-BR')}
        sub={`$${totalCost.toFixed(4)} total`}
      />
      <KpiCard
        icon={<TrendingUp size={18} className="text-blue-400" />}
        iconBg="bg-blue-400/10"
        label="Tasks / Dia"
        value={tasksPerDay.toFixed(1)}
        sub="media do periodo"
      />
      <KpiCard
        icon={<Bot size={18} className="text-violet-400" />}
        iconBg="bg-violet-400/10"
        label="By Agent"
        value={(byExecutor['agent'] ?? 0).toLocaleString('pt-BR')}
        sub="execucoes LLM"
      />
      <KpiCard
        icon={<Cpu size={18} className="text-emerald-400" />}
        iconBg="bg-emerald-400/10"
        label="By Worker"
        value={(byExecutor['worker'] ?? 0).toLocaleString('pt-BR')}
        sub="deterministic"
      />
      <KpiCard
        icon={<Leaf size={18} className="text-green-400" />}
        iconBg="bg-green-400/10"
        label="Economia Tokens"
        value={`$${economiaEstimada.toFixed(4)}`}
        sub="worker vs agent"
      />
    </div>
  );
}
