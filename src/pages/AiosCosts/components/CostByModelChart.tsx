import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ModelData {
  model: string;
  cost: number;
  tokens: number;
  percentage: number;
}

interface CostByModelChartProps {
  data: ModelData[];
  loading: boolean;
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': '#6366f1',
  'gpt-4o-mini': '#818cf8',
  'gpt-4': '#4f46e5',
  'claude': '#8b5cf6',
  'claude-3': '#7c3aed',
  'gemini': '#f59e0b',
  'gemini-flash': '#fbbf24',
  'gemini-pro': '#d97706',
  'llama': '#06b6d4',
  'other': '#9ca3af',
};

function getModelColor(model: string): string {
  const key = Object.keys(MODEL_COLORS).find((k) => model.toLowerCase().includes(k));
  return key ? MODEL_COLORS[key] : MODEL_COLORS['other'];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-3 shadow-lg">
      <p className="text-text-primary text-sm font-medium mb-1">{label}</p>
      <p className="text-xs" style={{ color: item.color }}>
        Custo: ${item.value.toFixed(6)}
      </p>
      {item.payload && (
        <>
          <p className="text-text-secondary text-xs">
            Tokens: {item.payload.tokens.toLocaleString('pt-BR')}
          </p>
          <p className="text-text-secondary text-xs">
            Participacao: {item.payload.percentage.toFixed(1)}%
          </p>
        </>
      )}
    </div>
  );
};

export function CostByModelChart({ data, loading }: CostByModelChartProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] animate-pulse" />
    );
  }

  if (!data.length) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-[340px] flex items-center justify-center">
        <p className="text-text-muted text-sm">Sem dados de custo por modelo</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Custo por Modelo LLM</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 80, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${v.toFixed(4)}`}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            stroke="#374151"
          />
          <YAxis
            type="category"
            dataKey="model"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            stroke="#374151"
            width={76}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getModelColor(entry.model)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
