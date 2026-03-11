import React from 'react';
import { TrendingDown } from 'lucide-react';

interface FunnelSummaryBarProps {
  data: {
    totalLeads: number;
    totalResponderam: number;
    totalAgendaram: number;
    totalCompareceram: number;
    totalFecharam: number;
  };
  loading?: boolean;
}

const STAGES = [
  { key: 'totalLeads' as const, label: 'Leads', color: 'from-blue-500/80 to-blue-600/80', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { key: 'totalResponderam' as const, label: 'Contato', color: 'from-cyan-500/80 to-cyan-600/80', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  { key: 'totalAgendaram' as const, label: 'Agendaram', color: 'from-amber-500/80 to-amber-600/80', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { key: 'totalCompareceram' as const, label: 'Compareceram', color: 'from-emerald-500/80 to-emerald-600/80', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { key: 'totalFecharam' as const, label: 'Fecharam', color: 'from-accent-primary/80 to-purple-600/80', bg: 'bg-accent-primary/10', text: 'text-accent-primary' },
];

const WIDTHS = [100, 78, 58, 42, 30];

export function FunnelSummaryBar({ data, loading }: FunnelSummaryBarProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
        <div className="space-y-1.5">
          {WIDTHS.map((w, i) => (
            <div key={i} className="h-8 bg-bg-hover rounded animate-pulse mx-auto" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const baseline = data.totalLeads || 1;
  const finalRate = ((data.totalFecharam / baseline) * 100).toFixed(1);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-text-muted" />
          <span className="text-xs font-medium text-text-muted">Funil de Conversao</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Conversao Final</span>
          <span className="text-sm font-bold text-accent-primary">{finalRate}%</span>
        </div>
      </div>

      <div className="space-y-1">
        {STAGES.map((stage, i) => {
          const value = data[stage.key];
          const pct = i === 0 ? 100 : (value / baseline) * 100;
          const dropFromPrev = i > 0 ? data[STAGES[i - 1].key] - value : 0;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              {/* Barra do funil */}
              <div className="flex-1 flex justify-center">
                <div
                  className={`bg-gradient-to-r ${stage.color} rounded-md h-7 flex items-center justify-between px-3 transition-all duration-500`}
                  style={{ width: `${WIDTHS[i]}%` }}
                >
                  <span className="text-white text-xs font-medium truncate">{stage.label}</span>
                  <span className="text-white text-xs font-bold">{value.toLocaleString()}</span>
                </div>
              </div>

              {/* Percentual */}
              <div className="w-14 text-right flex-shrink-0">
                {i === 0 ? (
                  <span className="text-[10px] text-text-muted">100%</span>
                ) : (
                  <span className={`text-[10px] font-medium ${stage.text}`}>{pct.toFixed(1)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
