import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────

interface DailyMetric {
  date: string;          // ISO or YYYY-MM-DD
  total: number;
  answered: number;
  appointments: number;
}

interface ColdCallChartProps {
  data: DailyMetric[];
  loading?: boolean;
  className?: string;
}

// ─── Skeleton ────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="w-full h-[320px] flex items-end gap-2 px-8 pb-8 pt-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
          <div
            className="w-full bg-white/5 rounded-t animate-pulse"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
          <div className="w-8 h-2.5 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const formattedDate = label
    ? new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : label;

  const labelMap: Record<string, string> = {
    total: 'Total',
    answered: 'Atendidas',
    appointments: 'Agendadas',
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-xl shadow-black/40">
      <p className="text-xs text-text-muted mb-2">{formattedDate}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-text-secondary">{labelMap[entry.name] ?? entry.name}:</span>
          <span className="font-medium text-text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────

export function ColdCallChart({ data, loading, className = '' }: ColdCallChartProps) {
  if (loading) {
    return (
      <div
        className={`bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6 ${className}`}
      >
        <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
        <ChartSkeleton />
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div
      className={`bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6 ${className}`}
    >
      <h3 className="text-sm font-medium text-text-muted mb-4">Ligações por Dia</h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">
          Sem dados para o período selecionado
        </div>
      ) : (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" opacity={0.5} />
              <XAxis
                dataKey="displayDate"
                stroke="#8b949e"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#8b949e"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, color: '#8b949e', paddingTop: 8 }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    total: 'Total',
                    answered: 'Atendidas',
                    appointments: 'Agendadas',
                  };
                  return labels[value] ?? value;
                }}
              />
              <Bar
                dataKey="total"
                fill="#30363d"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="answered"
                fill="#58a6ff"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="appointments"
                fill="#3fb950"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
