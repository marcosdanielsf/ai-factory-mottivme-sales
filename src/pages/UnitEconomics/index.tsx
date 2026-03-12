import { useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import {
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { MetricCard } from "../../components/MetricCard";
import {
  useUnitEconomicsClients,
  useUnitEconomicsSummary,
  useMRREvolution,
  useMonthlyChurn,
  useRunwayProjection,
} from "../../hooks";

// ========== Helpers ==========

const fmt = {
  brl: (v: number | null | undefined) =>
    v != null
      ? v.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        })
      : "—",
  brlFull: (v: number | null | undefined) =>
    v != null
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—",
  pct: (v: number | null | undefined) => (v != null ? `${v.toFixed(1)}%` : "—"),
  ratio: (v: number | null | undefined) =>
    v != null ? `${v.toFixed(1)}x` : "—",
  num: (v: number | null | undefined) =>
    v != null ? v.toLocaleString("pt-BR") : "—",
  month: (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  },
};

const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  purple: "#a855f7",
  cyan: "#06b6d4",
  muted: "#6b7280",
  grid: "#2d323c",
};

const MARGIN_COLORS = (pct: number) =>
  pct >= 60
    ? COLORS.success
    : pct >= 30
      ? COLORS.primary
      : pct >= 0
        ? COLORS.warning
        : COLORS.error;

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={18} className="text-accent-primary" />}
      <h2 className="text-base font-semibold text-text-primary">{children}</h2>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="animate-spin text-text-muted" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-text-muted">
      <BarChart3 size={32} className="mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ========== Custom Tooltip ==========

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-primary border border-border-default rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p
          key={entry.name || i}
          className="text-sm font-medium"
          style={{ color: entry.color }}
        >
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ========== Main Component ==========

export function UnitEconomics() {
  const { data: summary, loading: loadingSummary } = useUnitEconomicsSummary();
  const { data: clients, loading: loadingClients } = useUnitEconomicsClients();
  const { data: mrrData, loading: loadingMRR } = useMRREvolution();
  const { data: churnData, loading: loadingChurn } = useMonthlyChurn();
  const { data: runway, loading: loadingRunway } = useRunwayProjection();

  const [sortBy, setSortBy] = useState<"margin" | "revenue" | "ltv">("revenue");

  const isLoading =
    loadingSummary ||
    loadingClients ||
    loadingMRR ||
    loadingChurn ||
    loadingRunway;

  // Sorted clients for table
  const sortedClients = useMemo(() => {
    if (!clients.length) return [];
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case "margin":
          return b.margin_pct - a.margin_pct;
        case "ltv":
          return b.ltv_brl - a.ltv_brl;
        default:
          return b.avg_monthly_revenue_brl - a.avg_monthly_revenue_brl;
      }
    });
  }, [clients, sortBy]);

  // Chart data for margin by client (horizontal bar)
  const marginChartData = useMemo(
    () =>
      sortedClients
        .filter((c) => c.is_active)
        .slice(0, 15)
        .map((c) => ({
          name:
            c.location_name?.length > 20
              ? c.location_name.slice(0, 18) + "…"
              : c.location_name,
          margin: c.margin_pct,
          revenue: c.avg_monthly_revenue_brl,
          cost: c.total_cost_brl / Math.max(c.months_active, 1),
        })),
    [sortedClients],
  );

  // MRR chart data
  const mrrChartData = useMemo(
    () =>
      mrrData.map((m) => ({
        month: fmt.month(m.month),
        mrr: m.mrr_brl,
        clients: m.active_clients,
        growth: m.mrr_growth_pct,
        ticket: m.avg_ticket_brl,
      })),
    [mrrData],
  );

  // Churn chart data
  const churnChartData = useMemo(
    () =>
      churnData.map((c) => ({
        month: fmt.month(c.month),
        churned: c.churned_clients,
        rate: c.churn_rate_pct,
        mrrLost: c.churned_mrr_brl,
      })),
    [churnData],
  );

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary">
            Unit Economics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Margem, MRR, churn e runway — visao financeira por cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded">
            {summary?.active_clients ?? 0} clientes ativos
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="MRR"
          value={fmt.brl(summary?.mrr_brl)}
          icon={DollarSign}
          subtext={`ARR ${fmt.brl(summary?.arr_brl)}`}
          trend={summary?.mrr_brl ? "+ativo" : undefined}
          trendDirection="up"
        />
        <MetricCard
          title="Ticket Medio"
          value={fmt.brl(summary?.avg_ticket_brl)}
          icon={Target}
          subtext="por cliente/mes"
        />
        <MetricCard
          title="Margem Media"
          value={fmt.pct(summary?.avg_margin_pct)}
          icon={TrendingUp}
          subtext={`Meta: >30%`}
          trend={
            summary?.avg_margin_pct && summary.avg_margin_pct >= 30
              ? "Meta atingida"
              : "Abaixo da meta"
          }
          trendDirection={
            summary?.avg_margin_pct && summary.avg_margin_pct >= 30
              ? "up"
              : "down"
          }
        />
        <MetricCard
          title="LTV/CAC"
          value={fmt.ratio(summary?.avg_ltv_cac_ratio)}
          icon={Zap}
          subtext="Saudavel: >3x"
          trend={
            summary?.avg_ltv_cac_ratio && summary.avg_ltv_cac_ratio >= 3
              ? "Saudavel"
              : "Atencao"
          }
          trendDirection={
            summary?.avg_ltv_cac_ratio && summary.avg_ltv_cac_ratio >= 3
              ? "up"
              : "down"
          }
        />
        <MetricCard
          title="Churn Rate"
          value={fmt.pct(summary?.churn_rate_pct)}
          icon={AlertTriangle}
          subtext={`${summary?.churned_clients ?? 0} clientes perdidos`}
          trend={
            summary?.churn_rate_pct && summary.churn_rate_pct <= 5
              ? "Saudavel"
              : "Alto"
          }
          trendDirection={
            summary?.churn_rate_pct && summary.churn_rate_pct <= 5
              ? "up"
              : "down"
          }
        />
        <MetricCard
          title="Margem Operacional"
          value={fmt.pct(runway?.operating_margin_pct)}
          icon={PiggyBank}
          subtext={`Free cash: ${fmt.brl(runway?.monthly_free_cash_brl)}/mes`}
        />
      </div>

      {/* Row: MRR Evolution + Runway */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR Evolution - 2/3 */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-4">
          <SectionTitle icon={TrendingUp}>Evolucao MRR</SectionTitle>
          {mrrChartData.length === 0 ? (
            <EmptyState message="Sem dados de MRR ainda" />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mrrChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="mrr"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="clients"
                    orientation="right"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                  />
                  <Tooltip content={<ChartTooltip formatter={fmt.brlFull} />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: COLORS.muted }}
                  />
                  <Area
                    yAxisId="mrr"
                    type="monotone"
                    dataKey="mrr"
                    name="MRR (R$)"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="clients"
                    type="monotone"
                    dataKey="clients"
                    name="Clientes"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.success }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Runway Card - 1/3 */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <SectionTitle icon={ShieldCheck}>Projecao Runway</SectionTitle>
          {!runway ? (
            <EmptyState message="Sem dados de runway" />
          ) : (
            <div className="space-y-4">
              <RunwayGauge
                value={runway.operating_margin_pct}
                label="Margem Operacional"
                target={30}
              />
              <div className="space-y-3">
                <RunwayRow
                  label="Receita Mensal"
                  value={fmt.brl(runway.monthly_revenue_brl)}
                  color="text-accent-success"
                />
                <RunwayRow
                  label="Custo IA"
                  value={fmt.brl(runway.monthly_ai_cost_brl)}
                  color="text-accent-error"
                  negative
                />
                <RunwayRow
                  label="OPEX Estimado (30%)"
                  value={fmt.brl(runway.estimated_opex_brl)}
                  color="text-accent-warning"
                  negative
                />
                <div className="border-t border-border-default pt-3">
                  <RunwayRow
                    label="Free Cash Flow"
                    value={fmt.brl(runway.monthly_free_cash_brl)}
                    color="text-accent-primary"
                    bold
                  />
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Meta 6 meses runway
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {fmt.num(runway.months_to_6mo_runway)} meses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row: Margin by Client + Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Margin by Client */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <SectionTitle icon={BarChart3}>Margem por Cliente</SectionTitle>
          {marginChartData.length === 0 ? (
            <EmptyState message="Sem dados de margem" />
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marginChartData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={COLORS.grid}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: COLORS.muted, fontSize: 10 }}
                    width={130}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(v: number) => `${v.toFixed(1)}%`}
                      />
                    }
                  />
                  <ReferenceLine
                    x={30}
                    stroke={COLORS.warning}
                    strokeDasharray="3 3"
                    label={{
                      value: "Meta 30%",
                      fill: COLORS.warning,
                      fontSize: 10,
                    }}
                  />
                  <Bar
                    dataKey="margin"
                    name="Margem %"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  >
                    {marginChartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={MARGIN_COLORS(entry.margin)}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Churn Analysis */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <SectionTitle icon={TrendingDown}>Churn Mensal</SectionTitle>
          {churnChartData.length === 0 ? (
            <EmptyState message="Sem dados de churn" />
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={churnChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="count"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="rate"
                    orientation="right"
                    tick={{ fill: COLORS.muted, fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    yAxisId="rate"
                    y={5}
                    stroke={COLORS.warning}
                    strokeDasharray="3 3"
                    label={{
                      value: "Meta 5%",
                      fill: COLORS.warning,
                      fontSize: 10,
                    }}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="churned"
                    name="Clientes Perdidos"
                    fill={COLORS.error}
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="rate"
                    name="Churn Rate %"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.warning }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={Users}>Detalhamento por Cliente</SectionTitle>
          <div className="flex gap-1">
            {(["revenue", "margin", "ltv"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  sortBy === key
                    ? "bg-accent-primary text-white"
                    : "bg-bg-tertiary text-text-muted hover:text-text-secondary"
                }`}
              >
                {key === "revenue"
                  ? "Receita"
                  : key === "margin"
                    ? "Margem"
                    : "LTV"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">
                  Cliente
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  Receita/mes
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  Custo/mes
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  Margem
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  LTV
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  CAC
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                  LTV/CAC
                </th>
                <th className="text-center py-2 px-3 text-xs font-medium text-text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => {
                const monthlyCost =
                  client.months_active > 0
                    ? client.total_cost_brl / client.months_active
                    : 0;
                return (
                  <tr
                    key={client.location_id}
                    className="border-b border-border-default/50 hover:bg-bg-tertiary/50 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-text-primary text-sm">
                        {client.location_name}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {client.months_active} meses ativo
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-primary font-medium">
                      {fmt.brl(client.avg_monthly_revenue_brl)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-secondary">
                      {fmt.brl(monthlyCost)}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1 font-medium"
                        style={{ color: MARGIN_COLORS(client.margin_pct) }}
                      >
                        {client.margin_pct >= 30 ? (
                          <ArrowUpRight size={12} />
                        ) : client.margin_pct >= 0 ? (
                          <Minus size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {fmt.pct(client.margin_pct)}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-primary">
                      {fmt.brl(client.ltv_brl)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-secondary">
                      {fmt.brl(client.cac_brl)}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span
                        className={`font-medium ${
                          client.ltv_cac_ratio && client.ltv_cac_ratio >= 3
                            ? "text-accent-success"
                            : "text-accent-warning"
                        }`}
                      >
                        {fmt.ratio(client.ltv_cac_ratio)}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          client.is_active
                            ? "bg-accent-success"
                            : "bg-accent-error"
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedClients.length === 0 && (
            <EmptyState message="Nenhum cliente com dados de billing" />
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Sub-components ==========

function RunwayRow({
  label,
  value,
  color,
  negative,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-xs ${bold ? "text-text-primary font-medium" : "text-text-muted"}`}
      >
        {negative && "(-) "}
        {label}
      </span>
      <span
        className={`text-sm ${bold ? "font-semibold" : "font-medium"} ${color}`}
      >
        {value}
      </span>
    </div>
  );
}

function RunwayGauge({
  value,
  label,
  target,
}: {
  value: number;
  label: string;
  target: number;
}) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const color =
    value >= target
      ? COLORS.success
      : value >= target * 0.7
        ? COLORS.warning
        : COLORS.error;

  return (
    <div className="text-center">
      <div className="relative w-32 h-16 mx-auto overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 120 60" className="w-full h-full">
            <path
              d="M 10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke="#2d323c"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 10 55 A 50 50 0 0 1 110 55"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(clamped / 100) * 157} 157`}
              className="transition-all duration-1000"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className="text-lg font-bold text-text-primary">
            {fmt.pct(value)}
          </span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-1">{label}</p>
      <p className="text-[10px] text-text-muted">Meta: {target}%</p>
    </div>
  );
}
