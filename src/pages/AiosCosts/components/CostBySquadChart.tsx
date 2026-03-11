import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SquadData {
  squad_name: string;
  cost: number;
}

interface CostBySquadChartProps {
  data: SquadData[];
  loading: boolean;
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 shadow-lg">
      <p className="text-text-primary text-sm font-medium mb-1">{item.name}</p>
      <p className="text-xs" style={{ color: item.payload?.fill ?? '#6366f1' }}>
        Custo: ${(item.value as number).toFixed(6)}
      </p>
    </div>
  );
};

export function CostBySquadChart({ data, loading }: CostBySquadChartProps) {
  const total = data.reduce((sum, d) => sum + d.cost, 0);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] animate-pulse" />
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] flex items-center justify-center">
        <p className="text-text-muted text-sm">Sem dados de custo por squad</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Custo por Squad</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data as any[]}
              dataKey="cost"
              nameKey="squad_name"
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label overlay */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-text-muted text-xs">Total</p>
          <p className="text-text-primary text-sm font-bold">${total.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}
