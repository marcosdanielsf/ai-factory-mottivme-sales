import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../helpers';
import type { SpecialtyBreakdown } from '../types';

interface SpecialtiesChartProps {
  data: SpecialtyBreakdown[];
  loading: boolean;
}

export const SpecialtiesChart: React.FC<SpecialtiesChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-[350px]" />
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: d.specialty.length > 25 ? d.specialty.slice(0, 22) + '...' : d.specialty,
    fullLabel: d.specialty,
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">Top 15 Especialidades</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-primary/30 inline-block" />
            Total
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-success inline-block" />
            Com Email
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
              width={140}
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
              formatter={(value: number, name: string) => [formatNumber(value), name === 'total' ? 'Total' : 'Com Email']}
              labelFormatter={(label: string, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullLabel ?? label;
              }}
            />
            <Bar dataKey="total" fill="var(--color-accent-primary)" fillOpacity={0.3} radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="with_email" fill="var(--color-accent-success)" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
