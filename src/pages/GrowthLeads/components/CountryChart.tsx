import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCountryLabel, getCountryFlag, getCountryColor, formatNumber } from '../helpers';
import type { CountryBreakdown } from '../types';

interface CountryChartProps {
  data: CountryBreakdown[];
  loading: boolean;
}

export const CountryChart: React.FC<CountryChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-[350px]" />
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: `${getCountryFlag(d.country)} ${getCountryLabel(d.country)}`,
    enrichmentRate: d.total > 0 ? Math.round((d.enriched / d.total) * 100) : 0,
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Leads por País</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-primary inline-block" />
            Total
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-success inline-block" />
            Enriched
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">Sem dados</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
              }}
              formatter={(value: number, name: string) => [formatNumber(value), name === 'total' ? 'Total' : 'Enriched']}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry) => (
                <Cell key={entry.country} fill={getCountryColor(entry.country)} fillOpacity={0.3} />
              ))}
            </Bar>
            <Bar dataKey="enriched" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry) => (
                <Cell key={entry.country} fill={getCountryColor(entry.country)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
