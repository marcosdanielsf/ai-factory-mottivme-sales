import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarCheck,
  RefreshCw,
  Building2,
  ChevronDown,
  BarChart2,
  Target,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { DateRangePicker, DateRange } from "../../components/DateRangePicker";
import { useAccount } from "../../contexts/AccountContext";
import { useLocations } from "../../hooks/useLocations";
import {
  useGHLSalesDashboard,
  type FunnelMetric,
  type StageMetric,
} from "../../hooks/ghl/useGHLSalesDashboard";

// ============================================================================
// GHL Sales Dashboard
// Pipeline, funil por stage, show rate, tendencia, estagnadas
// ============================================================================

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PIE_COLORS = {
  showed: "#22c55e",
  noShow: "#ef4444",
  cancelled: "#6b7280",
  confirmed: "#3b82f6",
};

// ============================================================================
// Skeleton Loading
// ============================================================================

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-bg-hover rounded ${className ?? ""}`} />
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-24 rounded-xl border border-border-default"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-xl border border-border-default" />
        <Skeleton className="h-72 rounded-xl border border-border-default" />
      </div>
      <Skeleton className="h-64 rounded-xl border border-border-default" />
    </div>
  );
}

// ============================================================================
// KpiCard
// ============================================================================

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "green" | "blue" | "purple" | "orange" | "cyan" | "red";
  subtitle?: string;
}

function KpiCard({ label, value, icon, color, subtitle }: KpiCardProps) {
  const colorMap: Record<string, string> = {
    green: "text-green-400  bg-green-500/10  border-green-500/20",
    blue: "text-blue-400   bg-blue-500/10   border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    cyan: "text-cyan-400   bg-cyan-500/10   border-cyan-500/20",
    red: "text-red-400    bg-red-500/10    border-red-500/20",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-bold">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </div>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

// ============================================================================
// StatusBadge
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    open: { label: "Aberta", bg: "bg-blue-500/20", text: "text-blue-400" },
    won: { label: "Ganha", bg: "bg-green-500/20", text: "text-green-400" },
    lost: { label: "Perdida", bg: "bg-red-500/20", text: "text-red-400" },
    abandoned: {
      label: "Abandonada",
      bg: "bg-gray-500/20",
      text: "text-gray-400",
    },
  };
  const c = map[status] ?? map.open;
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// ============================================================================
// LocationSelector (inline, igual Social Selling)
// ============================================================================

function LocationSelector({
  locations,
  selectedLocationId,
  onChange,
  isLoading,
}: {
  locations: { location_id: string; location_name: string }[];
  selectedLocationId: string | null;
  onChange: (id: string | null) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? locations.filter((l) =>
        l.location_name.toLowerCase().includes(search.toLowerCase()),
      )
    : locations;

  const selected = locations.find((l) => l.location_id === selectedLocationId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-blue-500/50 transition-colors disabled:opacity-50 min-w-[160px]"
      >
        <Building2
          size={14}
          className={selected ? "text-blue-400" : "text-text-muted"}
        />
        <span
          className={`truncate ${selected ? "text-text-primary" : "text-text-muted"}`}
        >
          {selected ? selected.location_name : "Todos os Clientes"}
        </span>
        <ChevronDown
          size={14}
          className={`text-text-muted ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-bg-primary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
              setSearch("");
            }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !selectedLocationId
                ? "bg-blue-500/20 text-blue-400 font-medium"
                : "text-text-primary hover:bg-bg-hover"
            }`}
          >
            Todos os Clientes
          </button>
          <div className="border-t border-border-default max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">
                Nenhum cliente encontrado
              </div>
            ) : (
              filtered.map((loc) => (
                <button
                  key={loc.location_id}
                  onClick={() => {
                    onChange(loc.location_id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedLocationId === loc.location_id
                      ? "bg-blue-500/20 text-blue-400 font-medium"
                      : "text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  {loc.location_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PipelineSelector
// ============================================================================

function PipelineSelector({
  pipelines,
  selectedId,
  onChange,
}: {
  pipelines: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-blue-500/50 transition-colors text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Todos os Pipelines</option>
      {pipelines.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function GHLSalesDashboard() {
  const { selectedAccount, isClientUser } = useAccount();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const effectiveLocationId =
    selectedLocationId || selectedAccount?.location_id || "";

  const effectiveLocationName = useMemo(() => {
    if (selectedLocationId) {
      return (
        locations.find((l) => l.location_id === selectedLocationId)
          ?.location_name ?? selectedLocationId
      );
    }
    if (selectedAccount?.location_id) return selectedAccount.location_name;
    return null;
  }, [selectedLocationId, selectedAccount, locations]);

  const {
    pipelines,
    stageMetrics,
    funnelMetrics,
    kpis,
    showRate,
    stagnatedOpps,
    recentOpps,
    dailyTrend,
    loading,
    error,
    refetch,
  } = useGHLSalesDashboard({
    locationId: effectiveLocationId,
    selectedPipelineId: selectedPipelineId || undefined,
    dateRange,
  });

  // ---- No location selected ----
  if (!effectiveLocationId) {
    return (
      <div className="bg-bg-primary">
        <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
          <div className="px-4 md:px-6 py-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BarChart2 size={20} className="text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">
                    Sales Dashboard (GHL)
                  </h1>
                  <p className="text-xs text-text-muted">
                    Selecione uma location para visualizar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <LocationSelector
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  onChange={setSelectedLocationId}
                  isLoading={locationsLoading}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-[60vh] text-text-muted text-sm">
          Selecione um cliente no filtro acima para carregar o dashboard
        </div>
      </div>
    );
  }

  // ---- Skeleton ----
  if (loading) {
    return (
      <div className="bg-bg-primary">
        {/* Sticky header skeleton */}
        <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div className="bg-bg-primary flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-text-muted text-sm">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ---- Pie data ----
  const pieData = [
    { name: "Compareceu", value: showRate.showed, color: PIE_COLORS.showed },
    { name: "No-Show", value: showRate.noShow, color: PIE_COLORS.noShow },
    {
      name: "Cancelado",
      value: showRate.cancelled,
      color: PIE_COLORS.cancelled,
    },
    {
      name: "Pendente",
      value: showRate.confirmed,
      color: PIE_COLORS.confirmed,
    },
  ].filter((d) => d.value > 0);

  const activePipelineName = selectedPipelineId
    ? (pipelines.find((p) => p.id === selectedPipelineId)?.name ?? "")
    : "";

  const totalOpps = kpis.openCount + kpis.wonCount + kpis.lostCount;

  return (
    <div className="bg-bg-primary">
      {/* ================================================================
          STICKY HEADER
      ================================================================ */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart2 size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">
                  Sales Dashboard (GHL)
                </h1>
                <p className="text-xs text-text-muted">
                  {totalOpps.toLocaleString("pt-BR")} oportunidades no periodo
                  {effectiveLocationName && (
                    <span className="ml-1 text-blue-400 font-medium">
                      | {effectiveLocationName}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isClientUser && (
                <LocationSelector
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  onChange={setSelectedLocationId}
                  isLoading={locationsLoading}
                />
              )}
              <PipelineSelector
                pipelines={pipelines}
                selectedId={selectedPipelineId}
                onChange={(id) => setSelectedPipelineId(id)}
              />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <button
                onClick={refetch}
                disabled={loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw
                  size={16}
                  className={`text-text-muted ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          CONTENT
      ================================================================ */}
      <div className="p-4 md:p-6 space-y-6">
        {/* KPI Cards — 2 colunas mobile, 3 tablet, 6 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            label="Total no Pipeline"
            value={BRL.format(kpis.totalValue)}
            icon={<DollarSign size={18} />}
            color="green"
            subtitle={`${kpis.openCount} abertas`}
          />
          <KpiCard
            label="Oportunidades Abertas"
            value={kpis.openCount}
            icon={<Users size={18} />}
            color="blue"
            subtitle={`de ${totalOpps} totais`}
          />
          <KpiCard
            label="Win Rate"
            value={`${kpis.winRate.toFixed(1)}%`}
            icon={<TrendingUp size={18} />}
            color="purple"
            subtitle={`${kpis.wonCount}W / ${kpis.lostCount}L`}
          />
          <KpiCard
            label="Ciclo Medio"
            value={
              kpis.avgCycleTimeDays > 0
                ? `${kpis.avgCycleTimeDays.toFixed(0)}d`
                : "--"
            }
            icon={<Clock size={18} />}
            color="orange"
            subtitle="desde criacao ate fechamento"
          />
          <KpiCard
            label="Show Rate"
            value={showRate.total > 0 ? `${showRate.rate.toFixed(0)}%` : "--"}
            icon={<CalendarCheck size={18} />}
            color="cyan"
            subtitle={
              showRate.total > 0
                ? `${showRate.showed}/${showRate.total} agendamentos`
                : "sem agendamentos"
            }
          />
          <KpiCard
            label="Estagnadas (>7d)"
            value={kpis.stagnatedCount}
            icon={<AlertTriangle size={18} />}
            color="red"
            subtitle="sem movimentacao"
          />
        </div>

        {/* ================================================================
            Funil por Stage
        ================================================================ */}
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Target size={16} className="text-blue-400" />
              Funil por Stage
              {activePipelineName && (
                <span className="text-text-muted font-normal">
                  — {activePipelineName}
                </span>
              )}
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Distribuicao de oportunidades e valores por etapa do pipeline
            </p>
          </div>

          {stageMetrics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-border-default">
              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left px-6 py-3 text-text-muted font-medium">
                        Stage
                      </th>
                      <th className="text-center px-4 py-3 text-text-muted font-medium">
                        Qtd
                      </th>
                      <th className="text-center px-4 py-3 text-text-muted font-medium">
                        % Total
                      </th>
                      <th className="text-right px-6 py-3 text-text-muted font-medium">
                        Valor
                      </th>
                      {funnelMetrics.length > 0 && (
                        <th className="text-center px-4 py-3 text-text-muted font-medium">
                          Conv. Ant.
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {funnelMetrics.length > 0
                      ? funnelMetrics.map((row: FunnelMetric, i: number) => (
                          <tr
                            key={row.stageId}
                            className="border-b border-border-default hover:bg-bg-hover/50 transition-colors"
                          >
                            <td className="px-6 py-3 text-text-primary font-medium truncate max-w-[160px]">
                              {row.stageName}
                            </td>
                            <td className="text-center px-4 py-3 text-blue-400 font-bold">
                              {row.count.toLocaleString("pt-BR")}
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className="text-xs text-text-muted">
                                {row.percentOfTotal.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right px-6 py-3 text-text-secondary text-xs">
                              {BRL.format(row.totalValue)}
                            </td>
                            <td className="text-center px-4 py-3">
                              {i === 0 || row.conversionFromPrevious == null ? (
                                <span className="text-text-muted text-xs">
                                  —
                                </span>
                              ) : (
                                <span
                                  className={`text-xs font-semibold ${
                                    row.conversionFromPrevious >= 50
                                      ? "text-green-400"
                                      : row.conversionFromPrevious >= 25
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                  }`}
                                >
                                  {row.conversionFromPrevious.toFixed(0)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      : stageMetrics.map((row: StageMetric) => (
                          <tr
                            key={row.stageId}
                            className="border-b border-border-default hover:bg-bg-hover/50 transition-colors"
                          >
                            <td className="px-6 py-3 text-text-primary font-medium truncate max-w-[160px]">
                              {row.stageName}
                            </td>
                            <td className="text-center px-4 py-3 text-blue-400 font-bold">
                              {row.count.toLocaleString("pt-BR")}
                            </td>
                            <td className="text-center px-4 py-3">
                              <span className="text-xs text-text-muted">
                                {row.percentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right px-6 py-3 text-text-secondary text-xs">
                              {BRL.format(row.totalValue)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {/* Chart horizontal */}
              <div className="p-6">
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(240, stageMetrics.length * 44)}
                >
                  <BarChart
                    data={stageMetrics}
                    layout="vertical"
                    margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="stageName"
                      width={120}
                      tick={{ fill: "#d1d5db", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                      formatter={(value: number | string) => [
                        Number(value).toLocaleString("pt-BR"),
                        "Oportunidades",
                      ]}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
              Nenhum dado disponivel para o periodo selecionado
            </div>
          )}
        </div>

        {/* ================================================================
            Charts row: Distribuicao Status + Tendencia Diaria
        ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuicao Status (Pie) */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
              <Award size={16} className="text-purple-400" />
              Distribuicao por Status
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Show rate dos agendamentos no periodo
            </p>

            {showRate.total > 0 ? (
              <>
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-text-primary">
                    {showRate.rate.toFixed(0)}%
                  </span>
                  <p className="text-xs text-text-muted mt-1">
                    Taxa de Comparecimento
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: 8,
                      }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS.showed }}
                    />
                    <span className="text-text-muted">
                      Compareceu:{" "}
                      <strong className="text-text-primary">
                        {showRate.showed}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS.noShow }}
                    />
                    <span className="text-text-muted">
                      No-Show:{" "}
                      <strong className="text-red-400">
                        {showRate.noShow}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS.cancelled }}
                    />
                    <span className="text-text-muted">
                      Cancelado:{" "}
                      <strong className="text-text-primary">
                        {showRate.cancelled}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS.confirmed }}
                    />
                    <span className="text-text-muted">
                      Pendente:{" "}
                      <strong className="text-blue-400">
                        {showRate.confirmed}
                      </strong>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
                Sem agendamentos no periodo
              </div>
            )}
          </div>

          {/* Tendencia Diaria (Line) */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              Tendencia Diaria
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Oportunidades abertas / ganhas / perdidas por dia
            </p>

            {dailyTrend && dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                    labelFormatter={(v: string) => {
                      const d = new Date(v + "T00:00:00");
                      return d.toLocaleDateString("pt-BR");
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="open"
                    name="Abertas"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    name="Ganhas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lost"
                    name="Perdidas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
                Sem dados de tendencia no periodo
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            Oportunidades Estagnadas
        ================================================================ */}
        {stagnatedOpps.length > 0 && (
          <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                Oportunidades Estagnadas
                <span className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {stagnatedOpps.length}
                </span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Sem movimentacao ha mais de 7 dias
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left px-6 py-3 text-text-muted font-medium">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">
                      Stage
                    </th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">
                      Dias Parado
                    </th>
                    <th className="text-right px-6 py-3 text-text-muted font-medium">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stagnatedOpps.slice(0, 15).map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b border-border-default hover:bg-bg-hover/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-text-primary font-medium truncate max-w-[220px]">
                        {opp.name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {opp.stageName}
                      </td>
                      <td className="text-center px-4 py-3">
                        <span
                          className={`text-xs font-bold font-mono ${
                            opp.daysSinceChange > 14
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {opp.daysSinceChange}d
                        </span>
                      </td>
                      <td className="text-right px-6 py-3 text-text-secondary text-xs">
                        {BRL.format(opp.monetaryValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================
            Oportunidades Recentes
        ================================================================ */}
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default">
            <h3 className="text-sm font-semibold text-text-primary">
              Oportunidades Recentes
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Ultimas oportunidades atualizadas no periodo
            </p>
          </div>

          {recentOpps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left px-6 py-3 text-text-muted font-medium">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">
                      Pipeline
                    </th>
                    <th className="text-left px-4 py-3 text-text-muted font-medium">
                      Stage
                    </th>
                    <th className="text-center px-4 py-3 text-text-muted font-medium">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">
                      Valor
                    </th>
                    <th className="text-right px-6 py-3 text-text-muted font-medium">
                      Atualizado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOpps.map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b border-border-default hover:bg-bg-hover/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-text-primary font-medium truncate max-w-[200px]">
                        {opp.name}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs truncate max-w-[120px]">
                        {opp.pipelineName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {opp.stageName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={opp.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary text-xs">
                        {BRL.format(opp.monetaryValue ?? 0)}
                      </td>
                      <td className="px-6 py-3 text-right text-text-muted text-xs">
                        {opp.updatedAt
                          ? new Date(opp.updatedAt).toLocaleDateString("pt-BR")
                          : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[100px] flex items-center justify-center text-text-muted text-sm">
              Nenhuma oportunidade encontrada
            </div>
          )}
        </div>
      </div>
      {/* /Content */}
    </div>
  );
}
