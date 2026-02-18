import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TaskDaySummary } from '../../../hooks/aios/useAiosTasksExpanded';

interface TaskTimelineChartProps {
  data: TaskDaySummary[];
  loading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 text-sm shadow-lg">
      <p className="text-text-muted mb-1">{label}</p>
      <p className="text-indigo-400 font-semibold">{payload[0]?.value ?? 0} tasks</p>
    </div>
  );
}

export function TaskTimelineChart({ data, loading }: TaskTimelineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 lg:col-span-2">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Tasks por Dia</h3>
      {loading ? (
        <div className="h-52 animate-pulse bg-bg-tertiary rounded" />
      ) : formatted.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-text-muted text-sm">
          Sem dados no periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#tasksGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
