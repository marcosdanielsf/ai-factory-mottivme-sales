import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Budget {
  id: string;
  name: string;
  budget_amount: number;
  spent_amount: number;
  alert_threshold: number | null;
  is_active: boolean;
}

interface CostBudgetAlertProps {
  budgets: Budget[];
  totalCost: number;
}

function getAlertLevel(pct: number): 'safe' | 'warning' | 'danger' {
  if (pct >= 80) return 'danger';
  if (pct >= 50) return 'warning';
  return 'safe';
}

const alertConfig = {
  safe: {
    border: 'border-green-400/30',
    bg: 'bg-green-400/5',
    bar: 'bg-green-400',
    text: 'text-green-400',
    icon: <CheckCircle size={16} className="text-green-400" />,
  },
  warning: {
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    bar: 'bg-amber-400',
    text: 'text-amber-400',
    icon: <AlertTriangle size={16} className="text-amber-400" />,
  },
  danger: {
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    bar: 'bg-red-400',
    text: 'text-red-400',
    icon: <XCircle size={16} className="text-red-400" />,
  },
};

export function CostBudgetAlert({ budgets, totalCost }: CostBudgetAlertProps) {
  const activeBudgets = budgets.filter((b) => b.is_active);

  if (!activeBudgets.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {activeBudgets.map((budget) => {
        const pct = Math.min((totalCost / budget.budget_amount) * 100, 100);
        const level = getAlertLevel(pct);
        const cfg = alertConfig[level];
        const remaining = Math.max(budget.budget_amount - totalCost, 0);

        return (
          <div
            key={budget.id}
            className={`border ${cfg.border} ${cfg.bg} rounded-lg p-4 flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cfg.icon}
                <span className="text-text-primary text-sm font-medium">{budget.name}</span>
              </div>
              <span className={`text-xs font-semibold ${cfg.text}`}>
                {pct.toFixed(1)}% utilizado
              </span>
            </div>

            <div className="w-full bg-bg-hover rounded-full h-2">
              <div
                className={`${cfg.bar} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>
                Gasto: <span className="text-text-secondary">${totalCost.toFixed(4)}</span>
                {' / '}
                <span className="text-text-secondary">${budget.budget_amount.toFixed(2)}</span>
              </span>
              <span>
                Restante:{' '}
                <span className={`font-medium ${cfg.text}`}>${remaining.toFixed(4)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
