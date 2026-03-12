import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumber } from "../helpers";

interface FunnelDay {
  dia: string;
  total_leads: number;
  agendaram: number;
}

interface ClientMonthlyLeadsChartProps {
  data: FunnelDay[];
  loading: boolean;
}

interface MonthBucket {
  month: string;
  label: string;
  leads: number;
  agendamentos: number;
}

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const SkeletonChart = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
    <div className="h-5 w-52 bg-zinc-800 rounded animate-pulse mb-6" />
    <div className="h-[260px] bg-zinc-800/50 rounded-lg animate-pulse" />
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
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ClientMonthlyLeadsChart: React.FC<
  ClientMonthlyLeadsChartProps
> = ({ data, loading }) => {
  if (loading) return <SkeletonChart />;

  const monthlyData = useMemo<MonthBucket[]>(() => {
    const buckets = new Map<string, MonthBucket>();

    for (const day of data) {
      const d = new Date(day.dia + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.leads += Number(day.total_leads) || 0;
        existing.agendamentos += Number(day.agendaram) || 0;
      } else {
        buckets.set(key, {
          month: key,
          label: `${MONTH_NAMES[d.getMonth()]}/${d.getFullYear()}`,
          leads: Number(day.total_leads) || 0,
          agendamentos: Number(day.agendaram) || 0,
        });
      }
    }

    return Array.from(buckets.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }, [data]);

  if (monthlyData.length === 0) return null;

  const maxLeads = Math.max(...monthlyData.map((m) => m.leads));

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-base font-semibold text-white mb-6">
        Leads Gerados por Mes
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={monthlyData}
          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={35}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar
            dataKey="leads"
            name="Leads"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          >
            {monthlyData.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.leads === maxLeads ? "#3b82f6" : "#3b82f680"}
              />
            ))}
          </Bar>
          <Bar
            dataKey="agendamentos"
            name="Agendamentos"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            fill="#8b5cf6"
            fillOpacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
