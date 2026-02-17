import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface AgentData {
  agent_name: string;
  cost: number;
}

interface CostByAgentChartProps {
  data: AgentData[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 shadow-lg">
      <p className="text-text-primary text-sm font-medium mb-1">{label}</p>
      <p className="text-xs" style={{ color: '#6366f1' }}>
        Custo: ${payload[0].value.toFixed(6)}
      </p>
    </div>
  );
};

export function CostByAgentChart({ data, loading }: CostByAgentChartProps) {
  const top10 = [...data].sort((a, b) => b.cost - a.cost).slice(0, 10);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] animate-pulse" />
    );
  }

  if (!top10.length) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] flex items-center justify-center">
        <p className="text-text-muted text-sm">Sem dados de custo por agente</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Top 10 Agentes por Custo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={top10}
          margin={{ top: 0, right: 16, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="agent_name"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            stroke="#374151"
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(4)}`}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            stroke="#374151"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
