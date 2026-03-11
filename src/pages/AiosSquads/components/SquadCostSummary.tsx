import { DollarSign, TrendingDown, PieChart } from 'lucide-react';

interface SquadCostSummaryProps {
  totalCost: number;
  totalStories: number;
  budgetUsd?: number;
}

function getBudgetColor(pct: number): string {
  if (pct > 80) return 'bg-red-400';
  if (pct > 50) return 'bg-yellow-400';
  return 'bg-green-400';
}

function getBudgetTextColor(pct: number): string {
  if (pct > 80) return 'text-red-400';
  if (pct > 50) return 'text-yellow-400';
  return 'text-green-400';
}

export function SquadCostSummary({ totalCost, totalStories, budgetUsd }: SquadCostSummaryProps) {
  const avgCostPerStory = totalStories > 0 ? totalCost / totalStories : 0;
  const budgetUsedPct = budgetUsd && budgetUsd > 0 ? (totalCost / budgetUsd) * 100 : null;
  const budgetRemaining = budgetUsd ? budgetUsd - totalCost : null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Custos</h2>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <DollarSign className="w-3 h-3" />
            Total gasto
          </span>
          <span className="text-base font-semibold text-text-primary">
            ${totalCost.toFixed(3)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <TrendingDown className="w-3 h-3" />
            Custo médio/story
          </span>
          <span className="text-base font-semibold text-text-primary">
            ${avgCostPerStory.toFixed(3)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <PieChart className="w-3 h-3" />
            Budget restante
          </span>
          <span
            className={`text-base font-semibold ${
              budgetRemaining !== null
                ? getBudgetTextColor(budgetUsedPct ?? 0)
                : 'text-text-muted'
            }`}
          >
            {budgetRemaining !== null ? `$${budgetRemaining.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>

      {budgetUsedPct !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Budget usado</span>
            <span className={getBudgetTextColor(budgetUsedPct)}>
              {budgetUsedPct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBudgetColor(budgetUsedPct)}`}
              style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
