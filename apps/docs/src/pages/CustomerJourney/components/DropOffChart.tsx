import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useCjmDropOff } from "../../../hooks/useCjmDropOff";

interface DropOffChartProps {
  pipelineId?: string;
}

const getBarColor = (rate: number) => {
  if (rate < 20) return "#22c55e";
  if (rate <= 40) return "#f59e0b";
  return "#ef4444";
};

interface TooltipPayloadEntry {
  payload?: {
    stage_name: string;
    drop_off_rate: number;
    total_dropped: number;
    total_entered: number;
  };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d) return null;
  return (
    <div
      style={{
        background: "var(--color-bg-secondary, #1e1e2e)",
        border: "1px solid var(--color-border-default, #374151)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--color-text-primary, #f9fafb)",
      }}
    >
      <p className="font-medium mb-1">{d.stage_name}</p>
      <p>{d.drop_off_rate.toFixed(1)}% abandono</p>
      <p style={{ color: "var(--color-text-muted, #9ca3af)" }}>
        {d.total_dropped} perdidos de {d.total_entered}
      </p>
    </div>
  );
};

const DropOffChart = ({ pipelineId }: DropOffChartProps) => {
  const { rows, loading, error } = useCjmDropOff(pipelineId);

  if (loading) {
    return (
      <div className="h-[220px] rounded-lg bg-bg-secondary animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="h-20 flex items-center justify-center rounded-lg bg-bg-secondary text-red-400 text-sm">
        Erro ao carregar taxa de abandono: {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center rounded-lg bg-bg-secondary text-text-muted text-sm">
        Nenhum dado de abandono disponivel para este pipeline.
      </div>
    );
  }

  const chartData = rows.map((r) => ({
    stage_name: r.stage_name,
    drop_off_rate: r.drop_off_rate,
    total_dropped: r.total_dropped,
    total_entered: r.total_entered,
  }));

  return (
    <div className="p-4 rounded-lg bg-bg-secondary">
      <div className="flex items-center gap-4 mb-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          Baixo (&lt;20%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" />
          Medio (20-40%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Alto (&gt;40%)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: "var(--color-text-muted, #9ca3af)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="stage_name"
            width={110}
            tick={{ fill: "var(--color-text-muted, #9ca3af)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="drop_off_rate" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry.drop_off_rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DropOffChart;
