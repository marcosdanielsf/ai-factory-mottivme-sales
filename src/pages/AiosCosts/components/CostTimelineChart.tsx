import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface TimelineDataPoint {
  date: string;
  cost: number;
}

interface CostTimelineChartProps {
  data: TimelineDataPoint[];
  budgetPerDay?: number;
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 shadow-lg">
      <p className="text-text-primary text-sm font-medium mb-1">{label}</p>
      <p className="text-xs text-indigo-400">
        Custo: ${payload[0].value.toFixed(6)}
      </p>
    </div>
  );
};

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

export function CostTimelineChart({ data, budgetPerDay, loading }: CostTimelineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDateLabel(d.date),
  }));

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] animate-pulse" />
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] flex items-center justify-center">
        <p className="text-text-muted text-sm">Sem dados de timeline</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Custo ao Longo do Tempo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            stroke="#374151"
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(4)}`}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            stroke="#374151"
          />
          <Tooltip content={<CustomTooltip />} />
          {budgetPerDay !== undefined && (
            <ReferenceLine
              y={budgetPerDay}
              stroke="#ef4444"
              strokeDasharray="6 3"
              label={{ value: 'Budget/dia', fill: '#ef4444', fontSize: 11, position: 'right' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#costGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
