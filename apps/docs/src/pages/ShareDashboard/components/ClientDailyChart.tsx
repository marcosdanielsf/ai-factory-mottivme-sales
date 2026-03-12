import React from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDateShort } from "../helpers";

interface FunnelDay {
  dia: string;
  gasto: number;
  mensagens: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  impressoes: number;
  cliques: number;
}

interface ClientDailyChartProps {
  data: FunnelDay[];
  loading: boolean;
}

const SkeletonChart = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
    <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
    <div className="h-[300px] bg-zinc-800/50 rounded-lg animate-pulse" />
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-zinc-400 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-300">{entry.name}:</span>
          <span className="text-white font-medium">
            {entry.name === "Investimento"
              ? formatCurrency(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ClientDailyChart: React.FC<ClientDailyChartProps> = ({
  data,
  loading,
}) => {
  if (loading) return <SkeletonChart />;

  const chartData = [...data]
    .sort((a, b) => a.dia.localeCompare(b.dia))
    .map((d) => ({
      ...d,
      diaFormatted: formatDateShort(d.dia),
    }));

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-base font-semibold text-white mb-6">
        Evolucao Diaria
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="diaFormatted"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#a1a1aa",
              paddingTop: "16px",
            }}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="gasto"
            name="Investimento"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="mensagens"
            name="Leads"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="agendaram"
            name="Agendamentos"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
