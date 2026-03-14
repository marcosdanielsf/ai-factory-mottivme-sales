import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown } from "lucide-react";
import type { FunnelStep } from "../../../hooks/useFormFlowAnalytics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Interpola entre verde (#22c55e) e vermelho (#ef4444) com base no drop_rate */
function dropColor(dropRate: number): string {
  const t = Math.min(dropRate / 100, 1);
  const r = Math.round(34 + (239 - 34) * t);
  const g = Math.round(197 + (68 - 197) * t);
  const b = Math.round(94 + (68 - 94) * t);
  return `rgb(${r},${g},${b})`;
}

function truncate(text: string, max = 28): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  payload: FunnelStep;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const step = payload[0].payload;
  return (
    <div className="bg-surface-primary border border-border-primary rounded-lg p-3 text-xs shadow-lg min-w-[160px]">
      <p className="font-semibold text-text-primary mb-2 truncate max-w-[200px]">
        {step.field_title}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-text-muted">Visualizações</span>
          <span className="text-text-primary font-medium">{step.views}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-text-muted">Abandonos</span>
          <span className="text-text-primary font-medium">{step.drops}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-border-primary">
          <span className="text-text-muted">Taxa de drop</span>
          <span
            className="font-semibold"
            style={{ color: dropColor(step.drop_rate) }}
          >
            {step.drop_rate}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FunnelChartProps {
  funnelData: FunnelStep[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FunnelChart({ funnelData }: FunnelChartProps) {
  // Empty state
  if (funnelData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center mb-4">
          <TrendingDown size={24} className="text-text-muted" />
        </div>
        <p className="text-base font-medium text-text-primary mb-1">
          Sem dados de funil
        </p>
        <p className="text-sm text-text-muted max-w-xs">
          Os dados de abandono por campo aparecerão aqui quando houver eventos
          de analytics registrados.
        </p>
      </div>
    );
  }

  // No views at all — show the fields but all zeros
  const hasAnyViews = funnelData.some((s) => s.views > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Drop-off por campo — quanto menor a barra, maior o abandono
        </p>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            Baixo drop
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
            Alto drop
          </span>
        </div>
      </div>

      {!hasAnyViews && (
        <div className="bg-surface-secondary border border-border-primary rounded-lg px-4 py-3 text-xs text-text-muted">
          Nenhuma visualizacao de campo registrada ainda. O funil sera
          preenchido conforme os respondentes interagirem com o formulario.
        </div>
      )}

      <ResponsiveContainer
        width="100%"
        height={Math.max(220, funnelData.length * 44)}
      >
        <BarChart
          data={funnelData}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="field_title"
            width={150}
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => truncate(v)}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="views" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {funnelData.map((step) => (
              <Cell key={step.field_id} fill={dropColor(step.drop_rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table below chart */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="pb-2 text-left text-text-muted font-medium">
                Campo
              </th>
              <th className="pb-2 text-right text-text-muted font-medium pr-4">
                Views
              </th>
              <th className="pb-2 text-right text-text-muted font-medium pr-4">
                Drops
              </th>
              <th className="pb-2 text-right text-text-muted font-medium">
                Drop %
              </th>
            </tr>
          </thead>
          <tbody>
            {funnelData.map((step) => (
              <tr
                key={step.field_id}
                className="border-b border-border-primary/50 last:border-0"
              >
                <td className="py-2 text-text-primary max-w-[200px] truncate">
                  {step.field_title}
                </td>
                <td className="py-2 text-right text-text-muted pr-4">
                  {step.views}
                </td>
                <td className="py-2 text-right text-text-muted pr-4">
                  {step.drops}
                </td>
                <td
                  className="py-2 text-right font-semibold"
                  style={{ color: dropColor(step.drop_rate) }}
                >
                  {step.drop_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
