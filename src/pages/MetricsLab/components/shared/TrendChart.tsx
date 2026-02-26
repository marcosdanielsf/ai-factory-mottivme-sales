import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { FunnelStep } from '../../types';

interface TrendChartProps {
  steps: FunnelStep[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ steps }) => {
  // Find steps with trend data (7 days)
  const impressStep = steps.find(s => s.key === 'impressoes' && s.trend.length > 0);
  const clicksStep = steps.find(s => s.key === 'cliques' && s.trend.length > 0);
  const conversasStep = steps.find(s => s.key === 'conversas' && s.trend.length > 0);

  if (!impressStep && !clicksStep && !conversasStep) return null;

  const len = Math.max(
    impressStep?.trend.length ?? 0,
    clicksStep?.trend.length ?? 0,
    conversasStep?.trend.length ?? 0,
  );

  if (len < 2) return null;

  const data = Array.from({ length: len }, (_, i) => ({
    day: `D${i + 1}`,
    impressoes: impressStep?.trend[i] ?? 0,
    cliques: clicksStep?.trend[i] ?? 0,
    conversas: conversasStep?.trend[i] ?? 0,
  }));

  return (
    <div>
      <div className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2">
        Tendencia (ultimos 7 dias)
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradImpress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCliques" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradConversas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: 'var(--text-muted)' }}
            />
            {impressStep && (
              <Area type="monotone" dataKey="impressoes" stroke="#6366f1" fill="url(#gradImpress)" strokeWidth={1.5} dot={false} />
            )}
            {clicksStep && (
              <Area type="monotone" dataKey="cliques" stroke="#22d3ee" fill="url(#gradCliques)" strokeWidth={1.5} dot={false} />
            )}
            {conversasStep && (
              <Area type="monotone" dataKey="conversas" stroke="#f59e0b" fill="url(#gradConversas)" strokeWidth={1.5} dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {impressStep && (
          <span className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Impressoes
          </span>
        )}
        {clicksStep && (
          <span className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Cliques
          </span>
        )}
        {conversasStep && (
          <span className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Conversas
          </span>
        )}
      </div>
    </div>
  );
};
