import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { FunnelStep } from '../../types';

interface TrendChartProps {
  steps: FunnelStep[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ steps }) => {
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
      <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-3">
        Tendencia (7 dias)
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradImpress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCliques" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradConversas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #9ca3af)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(26, 29, 36, 0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: 'var(--color-text-secondary, #9ca3af)', marginBottom: 4 }}
              itemStyle={{ color: 'var(--color-text-primary, #f0f2f5)' }}
            />
            {impressStep && (
              <Area type="monotone" dataKey="impressoes" stroke="#818cf8" fill="url(#gradImpress)" strokeWidth={2} dot={false} />
            )}
            {clicksStep && (
              <Area type="monotone" dataKey="cliques" stroke="#38bdf8" fill="url(#gradCliques)" strokeWidth={2} dot={false} />
            )}
            {conversasStep && (
              <Area type="monotone" dataKey="conversas" stroke="#fbbf24" fill="url(#gradConversas)" strokeWidth={2} dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {impressStep && (
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Impressoes
          </span>
        )}
        {clicksStep && (
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />Cliques
          </span>
        )}
        {conversasStep && (
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Conversas
          </span>
        )}
      </div>
    </div>
  );
};
