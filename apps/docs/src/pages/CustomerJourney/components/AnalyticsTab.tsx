import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PipelineMapData } from "../../../types/cjm";

const formatHours = (h: number) => {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${Math.round(h / 24)}d`;
};

interface AnalyticsTabProps {
  pipelines: PipelineMapData[];
}

const AnalyticsTab = ({ pipelines }: AnalyticsTabProps) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    pipelines[0]?.pipeline_id ?? "",
  );

  const selectedPipeline = useMemo(
    () =>
      pipelines.find((p) => p.pipeline_id === selectedPipelineId) ??
      pipelines[0],
    [pipelines, selectedPipelineId],
  );

  const totalLeads = useMemo(
    () =>
      pipelines.reduce(
        (sum, p) => sum + p.stages.reduce((s, st) => s + st.contact_count, 0),
        0,
      ),
    [pipelines],
  );

  const slowestStage = useMemo(() => {
    let max = 0;
    let name = "-";
    for (const p of pipelines) {
      for (const st of p.stages) {
        if (st.avg_hours_in_stage > max) {
          max = st.avg_hours_in_stage;
          name = st.stage_name;
        }
      }
    }
    return { name, hours: max };
  }, [pipelines]);

  const totalBreaches = useMemo(
    () =>
      pipelines.reduce(
        (sum, p) =>
          sum + p.stages.reduce((s, st) => s + st.sla_breach_count, 0),
        0,
      ),
    [pipelines],
  );

  const chartData = useMemo(
    () =>
      (selectedPipeline?.stages ?? []).map((st) => ({
        name: st.stage_name,
        leads: st.contact_count,
        color: st.color ?? "#6366f1",
      })),
    [selectedPipeline],
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-xs text-text-muted">Total Leads Ativos</p>
          <p className="text-2xl font-bold text-text-primary">{totalLeads}</p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-xs text-text-muted">Etapa Mais Lenta</p>
          <p className="text-lg font-bold text-text-primary truncate">
            {slowestStage.name}
          </p>
          <p className="text-xs text-text-muted">
            {formatHours(slowestStage.hours)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-xs text-text-muted">SLA Breaches</p>
          <p className="text-2xl font-bold text-red-400">{totalBreaches}</p>
        </div>
      </div>

      {/* Pipeline selector */}
      <div className="flex flex-wrap gap-2">
        {pipelines.map((p) => (
          <button
            key={p.pipeline_id}
            onClick={() => setSelectedPipelineId(p.pipeline_id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedPipelineId === p.pipeline_id
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {p.pipeline_name}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="p-4 rounded-lg bg-bg-secondary">
          <p className="text-sm font-medium text-text-primary mb-4">
            Leads por Etapa — {selectedPipeline?.pipeline_name}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
            >
              <XAxis
                dataKey="name"
                tick={{
                  fill: "var(--color-text-muted, #9ca3af)",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "var(--color-text-muted, #9ca3af)",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-secondary, #1e1e2e)",
                  border: "1px solid var(--color-border-default, #374151)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [value, "Leads"]}
              />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stage table */}
      <div className="rounded-lg bg-bg-secondary overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-4 py-3 text-left text-xs text-text-muted font-medium">
                Etapa
              </th>
              <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                Leads
              </th>
              <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                Tempo Médio
              </th>
              <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                Breaches
              </th>
              <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                Warnings
              </th>
            </tr>
          </thead>
          <tbody>
            {(selectedPipeline?.stages ?? []).map((st) => (
              <tr
                key={st.current_stage}
                className="border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors"
              >
                <td className="px-4 py-3 text-text-primary flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: st.color ?? "#6366f1" }}
                  />
                  {st.stage_name}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {st.contact_count}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {formatHours(st.avg_hours_in_stage)}
                </td>
                <td className="px-4 py-3 text-right text-red-400">
                  {st.sla_breach_count}
                </td>
                <td className="px-4 py-3 text-right text-amber-400">
                  {st.sla_warning_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTab;
