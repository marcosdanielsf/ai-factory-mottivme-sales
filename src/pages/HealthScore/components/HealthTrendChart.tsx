import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { HealthSnapshot } from "../../../hooks/useHealthScore";

interface HealthTrendChartProps {
  data: HealthSnapshot[];
}

export function HealthTrendChart({ data }: HealthTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.02), rgba(15,15,20,0.6))",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p className="text-xs text-white/25">
          Historico disponivel apos snapshots diarios serem coletados
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.snapshot_date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.02), rgba(15,15,20,0.6))",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
        Evolucao do Health Score
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.03)"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
            }}
          />
          <Area
            type="monotone"
            dataKey="score_overall"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#healthGrad)"
            name="Score Geral"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
