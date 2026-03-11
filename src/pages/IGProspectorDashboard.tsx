import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  Filter,
  MessageCircle,
  DollarSign,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Flame,
  Send,
  TrendingUp,
  ChevronRight,
  Clock,
  Heart,
  Mail,
  Calendar,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DateRangePicker, DateRange } from "../components/DateRangePicker";
import {
  useIGProspectorData,
  useIGLeadList,
  useIGLeadTimeline,
  type IGLeadListItem,
} from "../hooks/useIGProspectorData";
import { useAccountData } from "../hooks/useAccountData";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// ============================================================================
// Labels amigaveis para stages do funil
// ============================================================================
const STAGE_LABELS: Record<string, string> = {
  prospected: "Prospectado",
  warming: "Aquecendo",
  warm: "Aquecido",
  dm_ready: "Pronto p/ DM",
  first_contact: "Contatado",
  replied: "Respondeu",
  won: "Agendado",
  already_active: "Ja Ativo",
  lost: "Perdido",
};

const STAGE_COLORS: Record<string, string> = {
  prospected: "#8b949e",
  warming: "#d29922",
  warm: "#d29922",
  dm_ready: "#58a6ff",
  first_contact: "#58a6ff",
  replied: "#3fb950",
  won: "#3fb950",
  already_active: "#8b949e",
  lost: "#f85149",
};

// ============================================================================
// 6 buckets canonicos do funil visual (DASH-02)
// Mapeia stages da view para buckets de exibicao
// ============================================================================
const FUNNEL_BUCKETS = [
  { key: "sync", label: "Sincronizados", stages: ["prospected"] },
  { key: "warming", label: "Aquecendo", stages: ["warming", "warm"] },
  { key: "dm_ready", label: "Prontos p/ DM", stages: ["dm_ready"] },
  { key: "contacted", label: "Contatados", stages: ["first_contact"] },
  { key: "replied", label: "Responderam", stages: ["replied"] },
  { key: "won", label: "Agendados", stages: ["won"] },
];

// ============================================================================
// Opcoes do dropdown de filtro por stage (FILT-03)
// ============================================================================
const STAGE_OPTIONS = [
  { value: "", label: "Todos os stages" },
  { value: "prospected", label: "Prospectado" },
  { value: "warming", label: "Aquecendo" },
  { value: "dm_ready", label: "Pronto p/ DM" },
  { value: "first_contact", label: "Contatado" },
  { value: "replied", label: "Respondeu" },
  { value: "won", label: "Agendado" },
];

interface LocationOption {
  location_id: string;
  location_name: string;
}

// ============================================================================
// IGProspectorDashboard
// Dashboard de prospecção Instagram — consome exclusivamente useIGProspectorData
// Exibe: KPI cards, funil de conversao visual, reply rate, custo por lead
// Filtros: conta (admin), periodo (DateRangePicker), stage (dropdown)
// Auto-refresh a cada 30s (DASH-03)
// ============================================================================

export default function IGProspectorDashboard() {
  const { isAdmin, isViewingSubconta } = useAccountData();
  const showClientSelector = isAdmin && !isViewingSubconta;

  // Selector state — undefined = dont override (use context), null = all, string = specific
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locations, setLocations] = useState<LocationOption[]>([]);

  // FILT-02 — Filtro de periodo
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // FILT-03 — Filtro de stage ('' = todos)
  const [stageFilter, setStageFilter] = useState<string>("");

  // locationId to name map for display
  const locationNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      map[loc.location_id] = loc.location_name;
    }
    return map;
  }, [locations]);

  // Fetch available locations — try location_name_map first, fallback to prospector_campaigns
  useEffect(() => {
    if (!showClientSelector) return;
    if (!isSupabaseConfigured()) return;

    const fetchLocations = async () => {
      // Usar prospector_campaigns direto — mostra cada ig_account como opcao
      // Sem dedup por location_id (instituto.abadisantos e drthauansantos compartilham location)
      const { data: campData, error: campErr } = await supabase
        .from("prospector_campaigns")
        .select("location_id, ig_account")
        .not("location_id", "is", null)
        .not("ig_account", "is", null)
        .order("ig_account");

      if (campErr) {
        console.error(
          "[IGProspectorDashboard] campaigns query error:",
          campErr,
        );
        return;
      }

      const options: LocationOption[] = (campData ?? [])
        .filter(
          (row: Record<string, unknown>) => row.ig_account && row.location_id,
        )
        .map((row: Record<string, unknown>) => ({
          location_id: String(row.location_id),
          location_name: String(row.ig_account),
        }));
      setLocations(options);
    };

    fetchLocations();
  }, [showClientSelector]);

  // Pass override: empty string = no override (fall back to context), non-empty = filter
  const locationIdOverride = showClientSelector
    ? selectedLocationId === ""
      ? null
      : selectedLocationId
    : undefined;

  // Normalizar dateRange — null se nenhuma data selecionada
  const effectiveDateRange =
    dateRange.startDate || dateRange.endDate ? dateRange : null;

  // Normalizar stageFilter — null se vazio
  const effectiveStageFilter = stageFilter || null;

  const {
    funnelStages,
    replyRates,
    costPerLead,
    leadsByMonth,
    loading,
    error,
    refetch,
  } = useIGProspectorData(
    locationIdOverride,
    effectiveDateRange,
    effectiveStageFilter,
  );

  // LEAD-01 — Lista paginada de leads
  const [leadPage, setLeadPage] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<IGLeadListItem | null>(null);

  const {
    leads,
    total: leadsTotal,
    loading: leadsLoading,
    refetch: leadsRefetch,
  } = useIGLeadList(
    locationIdOverride ?? null,
    effectiveStageFilter,
    effectiveDateRange,
    leadPage,
  );

  // LEAD-02/03 — Timeline do lead selecionado
  const { events: timelineEvents, loading: timelineLoading } =
    useIGLeadTimeline(selectedLeadId, selectedLead?.scheduled_at);

  // Sincronizar selectedLead quando selectedLeadId muda
  React.useEffect(() => {
    if (!selectedLeadId) {
      setSelectedLead(null);
      return;
    }
    const found = leads.find((l) => l.lead_id === selectedLeadId);
    if (found) setSelectedLead(found);
  }, [selectedLeadId, leads]);

  // Reset leadPage quando filtros mudam
  React.useEffect(() => {
    setLeadPage(0);
  }, [locationIdOverride, effectiveStageFilter, effectiveDateRange]);

  // ============================================================================
  // Computed — KPI cards (DASH-01)
  // ============================================================================
  const totalLeads = funnelStages.reduce((sum, s) => sum + s.count, 0);

  const warming = funnelStages
    .filter((s) => s.stage === "warming" || s.stage === "warm")
    .reduce((sum, s) => sum + s.count, 0);

  const totalDmsSent = replyRates.reduce((sum, r) => sum + r.total_dms_sent, 0);
  const totalReplies = replyRates.reduce((sum, r) => sum + r.total_replied, 0);

  // Whether we are showing all clients (admin, no filter selected)
  const showingAllClients = showClientSelector && selectedLocationId === "";

  // Handler para limpar todos os filtros
  const handleClearFilters = () => {
    setDateRange({ startDate: null, endDate: null });
    setStageFilter("");
  };

  const hasActiveFilters =
    dateRange.startDate || dateRange.endDate || stageFilter;

  // ============================================================================
  // Loading state
  // ============================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#8b949e]">
          <Loader2 className="h-8 w-8 animate-spin text-[#58a6ff]" />
          <span className="text-sm">
            Carregando dados do Instagram Prospector...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6">
      {/* -------------------------------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">
            Instagram Prospector — Dashboard
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Visao consolidada de funil, replies e custo por lead
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* DASH-03 — Badge de auto-refresh */}
          <span className="inline-flex items-center gap-1.5 text-xs bg-[#161b22] border border-[#30363d] text-[#8b949e] px-3 py-1.5 rounded-full">
            <RefreshCw className="h-3 w-3" />
            Auto 30s
          </span>
          <button
            onClick={refetch}
            className="flex items-center gap-2 text-sm bg-[#161b22] border border-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] hover:border-[#58a6ff] px-3 py-2 rounded-lg transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Barra de filtros — FILT-01 (conta) + FILT-02 (periodo) + FILT-03 (stage) */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
        {/* FILT-01 — Filtro de conta (admin only) */}
        {showClientSelector && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#8b949e] flex-shrink-0" />
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#58a6ff] transition-colors"
            >
              <option value="">Todos os clientes</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* FILT-02 — Filtro de periodo */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* FILT-03 — Filtro de stage */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#58a6ff] transition-colors"
        >
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Limpar filtros — so aparece se algum filtro ativo */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-[#8b949e] hover:text-[#f85149] border border-[#30363d] hover:border-[#f85149] px-3 py-2 rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Error banner */}
      {/* -------------------------------------------------------------------- */}
      {error && (
        <div className="flex items-start gap-3 bg-[#161b22] border border-[#f85149] text-[#f85149] rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Erro ao carregar dados</p>
            <p className="text-xs mt-1 text-[#ffa198]">{error}</p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DASH-01 — 4 KPI cards */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total de Leads",
            value: totalLeads,
            icon: Users,
            color: "#58a6ff",
          },
          {
            label: "Aquecendo",
            value: warming,
            icon: Flame,
            color: "#d29922",
          },
          {
            label: "DMs Enviados",
            value: totalDmsSent,
            icon: Send,
            color: "#58a6ff",
          },
          {
            label: "Replies",
            value: totalReplies,
            icon: MessageCircle,
            color: "#3fb950",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#8b949e]">{label}</span>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="text-3xl font-bold font-mono" style={{ color }}>
              {value.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* DASH-02 — Funil visual com 6 stages canonicos */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Funil de Conversao
          </h2>
          <span className="text-xs text-[#8b949e]">
            ({totalLeads.toLocaleString("pt-BR")} leads)
          </span>
        </div>

        {funnelStages.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <Filter className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de funil</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerao quando houver leads na view vw_lead_funnel_e2e
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            {FUNNEL_BUCKETS.map((bucket, idx) => {
              const count = funnelStages
                .filter((s) => bucket.stages.includes(s.stage))
                .reduce((sum, s) => sum + s.count, 0);

              // Percentual em relacao ao total geral
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

              // Taxa de conversao em relacao ao bucket imediatamente anterior
              const prevBucketCount =
                idx === 0
                  ? totalLeads
                  : funnelStages
                      .filter((s) =>
                        FUNNEL_BUCKETS[idx - 1].stages.includes(s.stage),
                      )
                      .reduce((sum, s) => sum + s.count, 0);
              const convRate =
                prevBucketCount > 0 ? (count / prevBucketCount) * 100 : 0;

              const isLast = idx === FUNNEL_BUCKETS.length - 1;
              const color = ["replied", "won"].includes(bucket.key)
                ? "#3fb950"
                : "#58a6ff";

              return (
                <div
                  key={bucket.key}
                  className={`px-5 py-4 ${!isLast ? "border-b border-[#21262d]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#8b949e] w-6 text-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-[#c9d1d9]">
                        {bucket.label}
                      </span>
                      {idx > 0 && convRate > 0 && (
                        <span className="text-[10px] text-[#8b949e]">
                          {convRate.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <span
                      className="text-lg font-bold font-mono"
                      style={{ color }}
                    >
                      {count.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Secao 2: Reply Rate — METR-01 */}
      {/* KPI agregado + tabela detalhada por mes/abordagem */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Reply Rate por Abordagem
          </h2>
          {replyRates.length > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({replyRates.length} registro{replyRates.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {replyRates.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <MessageCircle className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de reply rate</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerao quando houver DMs enviados em
              vw_reply_rate_by_account
            </p>
          </div>
        ) : (
          (() => {
            // Agregado: soma total_replied / soma total_dms_sent * 100
            const aggDmsSent = replyRates.reduce(
              (sum, r) => sum + r.total_dms_sent,
              0,
            );
            const aggReplied = replyRates.reduce(
              (sum, r) => sum + r.total_replied,
              0,
            );
            const aggRate =
              aggDmsSent > 0 ? (aggReplied / aggDmsSent) * 100 : 0;
            const aggRateColor =
              aggRate >= 15 ? "#3fb950" : aggRate >= 8 ? "#d29922" : "#f85149";

            return (
              <div>
                {/* KPI destacado — Reply Rate agregado */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 mb-4 flex items-center gap-6">
                  <div>
                    <p className="text-xs text-[#8b949e] mb-1">
                      Reply Rate (periodo filtrado)
                    </p>
                    <p
                      className="text-5xl font-bold font-mono"
                      style={{ color: aggRateColor }}
                    >
                      {aggRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-[#6e7681] mt-1">
                      {aggReplied.toLocaleString("pt-BR")} replies /{" "}
                      {aggDmsSent.toLocaleString("pt-BR")} DMs enviados
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(aggRate, 100)}%`,
                          backgroundColor: aggRateColor,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#6e7681] mt-1">
                      <span>0%</span>
                      <span className="text-[#d29922]">8%</span>
                      <span className="text-[#3fb950]">15%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Tabela detalhada por mes/abordagem */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#30363d] text-[#8b949e]">
                        <th className="text-left px-4 py-3 font-medium">Mes</th>
                        <th className="text-left px-4 py-3 font-medium">
                          Abordagem
                        </th>
                        {showingAllClients && (
                          <th className="text-left px-4 py-3 font-medium">
                            Cliente
                          </th>
                        )}
                        <th className="text-right px-4 py-3 font-medium">
                          DMs Enviados
                        </th>
                        <th className="text-right px-4 py-3 font-medium">
                          Replies
                        </th>
                        <th className="text-right px-4 py-3 font-medium">
                          Reply Rate
                        </th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                          Agendados
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {replyRates.map((row, idx) => {
                        const rateNum = row.reply_rate_pct;
                        const rateColor =
                          rateNum >= 15
                            ? "#3fb950"
                            : rateNum >= 8
                              ? "#d29922"
                              : "#f85149";
                        const clientName =
                          showingAllClients && row.location_id
                            ? (locationNameMap[row.location_id] ??
                              row.location_id)
                            : null;

                        return (
                          <tr
                            key={`${row.approach_type}-${row.month}-${idx}`}
                            className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d] transition-colors"
                          >
                            <td className="px-4 py-3 text-[#c9d1d9] font-mono text-xs">
                              {row.month}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  row.approach_type === "warm"
                                    ? "bg-[#d29922]/15 text-[#d29922]"
                                    : "bg-[#58a6ff]/15 text-[#58a6ff]"
                                }`}
                              >
                                {row.approach_type === "warm" ? "Warm" : "Cold"}
                              </span>
                            </td>
                            {showingAllClients && (
                              <td className="px-4 py-3 text-[#8b949e] text-xs">
                                {clientName ? (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                    {clientName}
                                  </span>
                                ) : (
                                  <span className="text-[#6e7681]">—</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right font-mono text-[#c9d1d9]">
                              {row.total_dms_sent.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#c9d1d9]">
                              {row.total_replied.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className="font-bold font-mono"
                                style={{ color: rateColor }}
                              >
                                {rateNum.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#8b949e] hidden md:table-cell">
                              {row.total_scheduled.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Secao 3: Evolucao Historica — METR-03 */}
      {/* Grafico de linha: volume de leads contatados e reply rate por mes */}
      {/* -------------------------------------------------------------------- */}
      {(() => {
        // Coletar todos os meses unicos de leadsByMonth e replyRates
        const allMonths = Array.from(
          new Set([
            ...leadsByMonth.map((l) => l.month),
            ...replyRates.map((r) => r.month),
          ]),
        ).sort();

        // Para cada mes: leads = contagem de leadsByMonth; replyRate = media ponderada de reply_rate_pct
        const chartData = allMonths.map((month) => {
          const lbm = leadsByMonth.find((l) => l.month === month);
          const ratesThisMonth = replyRates.filter((r) => r.month === month);
          const totalDms = ratesThisMonth.reduce(
            (sum, r) => sum + r.total_dms_sent,
            0,
          );
          const totalReplied = ratesThisMonth.reduce(
            (sum, r) => sum + r.total_replied,
            0,
          );
          const replyRate =
            totalDms > 0
              ? parseFloat(((totalReplied / totalDms) * 100).toFixed(1))
              : 0;
          return {
            month,
            leads: lbm?.count ?? 0,
            replyRate,
          };
        });

        return (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#58a6ff]" />
              <h2 className="text-lg font-semibold text-[#f0f6fc]">
                Evolucao Historica
              </h2>
              {chartData.length > 0 && (
                <span className="text-xs text-[#8b949e] ml-1">
                  ({chartData.length} mes{chartData.length !== 1 ? "es" : ""})
                </span>
              )}
            </div>

            {chartData.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
                <TrendingUp className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
                <p className="text-[#8b949e] text-sm">Sem dados historicos</p>
                <p className="text-[#6e7681] text-xs mt-1">
                  O grafico aparecera quando houver leads com first_contact_at
                  preenchido
                </p>
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#21262d"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#8b949e", fontSize: 11 }}
                      axisLine={{ stroke: "#30363d" }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "#8b949e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#8b949e", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161b22",
                        border: "1px solid #30363d",
                        borderRadius: "6px",
                        color: "#c9d1d9",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#8b949e", marginBottom: 4 }}
                      formatter={(value: number, name: string) => {
                        if (name === "replyRate")
                          return [`${value}%`, "Reply Rate"];
                        return [
                          value.toLocaleString("pt-BR"),
                          "Leads Contatados",
                        ];
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 12,
                        color: "#8b949e",
                        paddingTop: 12,
                      }}
                      formatter={(value: string) =>
                        value === "leads"
                          ? "Leads Contatados"
                          : "Reply Rate (%)"
                      }
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="leads"
                      stroke="#58a6ff"
                      strokeWidth={2}
                      dot={{ fill: "#58a6ff", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="replyRate"
                      stroke="#3fb950"
                      strokeWidth={2}
                      dot={{ fill: "#3fb950", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        );
      })()}

      {/* -------------------------------------------------------------------- */}
      {/* Secao 5: Lista de Leads — LEAD-01 */}
      {/* Lista paginada (20/pagina) ordenada por atividade mais recente */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">Leads</h2>
          <span className="text-xs text-[#8b949e] ml-1">
            ({leadsTotal.toLocaleString("pt-BR")} total)
          </span>
          <button
            onClick={leadsRefetch}
            className="ml-auto flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d] hover:border-[#58a6ff] px-2.5 py-1 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </button>
        </div>

        {leadsLoading ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#58a6ff] mx-auto mb-2" />
            <p className="text-[#8b949e] text-sm">Carregando leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <Users className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Nenhum lead encontrado</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Ajuste os filtros ou aguarde novos leads entrarem no pipeline
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            {/* Cabecalho da tabela */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-[#30363d] text-xs text-[#8b949e] font-medium">
              <span>Usuario</span>
              <span className="text-right">Stage</span>
              <span className="text-right hidden sm:block">Score</span>
              <span className="text-right hidden md:block">Ultima Acao</span>
              <span></span>
            </div>

            {/* Linhas de lead */}
            {leads.map((lead) => {
              // Ultima acao = GREATEST de first_contact_at, replied_at, scheduled_at
              const dates = [
                lead.first_contact_at,
                lead.replied_at,
                lead.scheduled_at,
              ]
                .filter(Boolean)
                .map((d) => new Date(d!).getTime());
              const lastActionTs = dates.length > 0 ? Math.max(...dates) : null;
              const lastActionLabel = lastActionTs
                ? (() => {
                    const diffMs = Date.now() - lastActionTs;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return "Hoje";
                    if (diffDays === 1) return "Ontem";
                    if (diffDays < 30) return `${diffDays}d atras`;
                    const diffMonths = Math.floor(diffDays / 30);
                    return `${diffMonths}m atras`;
                  })()
                : "—";

              const stageColor = STAGE_COLORS[lead.funnel_stage] ?? "#8b949e";
              const stageLabel =
                STAGE_LABELS[lead.funnel_stage] ?? lead.funnel_stage;

              // Score: barra de 0–100
              const scoreColor =
                lead.lead_score >= 70
                  ? "#3fb950"
                  : lead.lead_score >= 40
                    ? "#d29922"
                    : "#8b949e";

              return (
                <div
                  key={lead.lead_id}
                  onClick={() => setSelectedLeadId(lead.lead_id)}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-[#21262d] last:border-0 hover:bg-[#21262d] cursor-pointer transition-colors"
                >
                  {/* Username */}
                  <div className="min-w-0">
                    <span className="text-sm text-[#c9d1d9] font-medium truncate block">
                      @{lead.instagram_username}
                    </span>
                    {showingAllClients && lead.location_id && (
                      <span className="text-xs text-[#6e7681]">
                        {locationNameMap[lead.location_id] ?? lead.location_id}
                      </span>
                    )}
                  </div>

                  {/* Stage badge */}
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: stageColor + "22",
                      color: stageColor,
                    }}
                  >
                    {stageLabel}
                  </span>

                  {/* Score */}
                  <div className="hidden sm:flex items-center gap-2 w-20 justify-end">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: scoreColor }}
                    >
                      {lead.lead_score}
                    </span>
                    <div className="w-10 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(lead.lead_score, 100)}%`,
                          backgroundColor: scoreColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Ultima acao */}
                  <span className="hidden md:block text-xs text-[#8b949e] whitespace-nowrap text-right">
                    {lastActionLabel}
                  </span>

                  {/* Seta para abrir timeline */}
                  <ChevronRight className="h-4 w-4 text-[#30363d] group-hover:text-[#58a6ff] flex-shrink-0" />
                </div>
              );
            })}

            {/* Paginacao */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#30363d] text-xs text-[#8b949e]">
              <span>
                {leadPage * 20 + 1}–{Math.min((leadPage + 1) * 20, leadsTotal)}{" "}
                de {leadsTotal.toLocaleString("pt-BR")} leads
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeadPage((p) => Math.max(0, p - 1))}
                  disabled={leadPage === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#30363d] disabled:opacity-40 hover:not-disabled:border-[#58a6ff] hover:not-disabled:text-[#c9d1d9] transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setLeadPage((p) => ((p + 1) * 20 < leadsTotal ? p + 1 : p))
                  }
                  disabled={(leadPage + 1) * 20 >= leadsTotal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#30363d] disabled:opacity-40 hover:not-disabled:border-[#58a6ff] hover:not-disabled:text-[#c9d1d9] transition-colors"
                >
                  Proximo
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Modal de Timeline — LEAD-02, LEAD-03 */}
      {/* Overlay fixo com panel lateral direito */}
      {/* -------------------------------------------------------------------- */}
      {selectedLeadId && (
        <>
          {/* Overlay escuro */}
          <div
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setSelectedLeadId(null)}
          />

          {/* Panel lateral direito */}
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#161b22] border-l border-[#30363d] overflow-y-auto p-6 z-50">
            {/* Header do modal */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-[#f0f6fc]">
                  @{selectedLead?.instagram_username ?? selectedLeadId}
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Timeline de acoes
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Resumo do lead */}
            {selectedLead && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 mb-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6e7681] block mb-1">Stage</span>
                  <span
                    className="font-medium px-2 py-0.5 rounded-full text-[10px]"
                    style={{
                      backgroundColor:
                        (STAGE_COLORS[selectedLead.funnel_stage] ?? "#8b949e") +
                        "22",
                      color:
                        STAGE_COLORS[selectedLead.funnel_stage] ?? "#8b949e",
                    }}
                  >
                    {STAGE_LABELS[selectedLead.funnel_stage] ??
                      selectedLead.funnel_stage}
                  </span>
                </div>
                <div>
                  <span className="text-[#6e7681] block mb-1">Lead Score</span>
                  <span className="font-mono font-bold text-[#58a6ff]">
                    {selectedLead.lead_score}
                  </span>
                </div>
                <div>
                  <span className="text-[#6e7681] block mb-1">
                    Primeiro contato
                  </span>
                  <span className="text-[#c9d1d9]">
                    {selectedLead.first_contact_at
                      ? new Date(
                          selectedLead.first_contact_at,
                        ).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[#6e7681] block mb-1">Respondeu</span>
                  <span className="text-[#c9d1d9]">
                    {selectedLead.replied_at
                      ? new Date(selectedLead.replied_at).toLocaleDateString(
                          "pt-BR",
                        )
                      : "—"}
                  </span>
                </div>
                {selectedLead.scheduled_at && (
                  <div className="col-span-2">
                    <span className="text-[#6e7681] block mb-1">
                      Agendado para
                    </span>
                    <span className="text-[#3fb950] font-medium">
                      {new Date(selectedLead.scheduled_at).toLocaleString(
                        "pt-BR",
                        { dateStyle: "medium", timeStyle: "short" },
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline de eventos */}
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide mb-4">
                Historico de Interacoes
              </h4>

              {timelineLoading ? (
                <div className="flex items-center gap-2 text-[#8b949e] text-sm py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando timeline...
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                  <p className="text-[#8b949e] text-sm">
                    Nenhuma interacao registrada
                  </p>
                  <p className="text-[#6e7681] text-xs mt-1">
                    As acoes aparecerão conforme o warm-up avança
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Linha conectora vertical */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[#30363d]" />

                  <div className="space-y-4">
                    {timelineEvents.map((event, idx) => {
                      // Icone por tipo de evento
                      const iconMap: Record<string, React.ReactElement> = {
                        like: <Heart className="h-3.5 w-3.5 text-[#f85149]" />,
                        comment: (
                          <MessageCircle className="h-3.5 w-3.5 text-[#58a6ff]" />
                        ),
                        reply: (
                          <MessageCircle className="h-3.5 w-3.5 text-[#3fb950]" />
                        ),
                        story_reply: (
                          <Clock className="h-3.5 w-3.5 text-[#d29922]" />
                        ),
                        story_view: (
                          <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
                        ),
                        dm: <Mail className="h-3.5 w-3.5 text-[#58a6ff]" />,
                        followup: (
                          <Mail className="h-3.5 w-3.5 text-[#d29922]" />
                        ),
                        scheduled: (
                          <Calendar className="h-3.5 w-3.5 text-[#3fb950]" />
                        ),
                      };

                      // Label traduzido
                      const labelMap: Record<string, string> = {
                        like: "Curtida",
                        comment: "Comentario",
                        story_reply: "Story Reply",
                        story_view: "Story Visualizado",
                        dm: "DM enviado",
                        followup: "Follow-up",
                        reply: "Resposta recebida",
                        scheduled: "Agendamento confirmado",
                      };

                      // Cor do circulo do icone
                      const bgMap: Record<string, string> = {
                        like: "#f85149",
                        comment: "#58a6ff",
                        reply: "#3fb950",
                        story_reply: "#d29922",
                        story_view: "#8b949e",
                        dm: "#58a6ff",
                        followup: "#d29922",
                        scheduled: "#3fb950",
                      };

                      const bg = bgMap[event.event_type] ?? "#8b949e";
                      const icon = iconMap[event.event_type] ?? (
                        <Clock className="h-3.5 w-3.5 text-[#8b949e]" />
                      );
                      const label =
                        labelMap[event.event_type] ?? event.event_type;

                      // Formatar timestamp
                      const ts = event.timestamp
                        ? new Date(event.timestamp).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      return (
                        <div
                          key={`${event.id}-${idx}`}
                          className="flex gap-4 relative"
                        >
                          {/* Circulo com icone */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                            style={{
                              backgroundColor: bg + "22",
                              border: `1px solid ${bg}44`,
                            }}
                          >
                            {icon}
                          </div>

                          {/* Conteudo do evento */}
                          <div className="flex-1 pb-4 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-[#c9d1d9]">
                                {label}
                              </span>
                              <span className="text-xs text-[#6e7681] whitespace-nowrap flex-shrink-0">
                                {ts}
                              </span>
                            </div>
                            {event.notes && (
                              <p className="text-xs text-[#8b949e] mt-1 line-clamp-2">
                                {event.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Secao 4: Custo por Lead e Agendamento — METR-02 */}
      {/* 2 KPI cards (ultimo mes) + tabela detalhada por mes */}
      {/* -------------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Custo por Lead e Agendamento
          </h2>
          {costPerLead.length > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({costPerLead.length} mes{costPerLead.length !== 1 ? "es" : ""})
            </span>
          )}
        </div>

        {costPerLead.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
            <DollarSign className="h-10 w-10 text-[#30363d] mx-auto mb-3" />
            <p className="text-[#8b949e] text-sm">Sem dados de custo</p>
            <p className="text-[#6e7681] text-xs mt-1">
              Os dados aparecerao quando houver custos registrados em
              vw_cost_per_lead. Os custos sao calculados com base nas chamadas
              de IA do prospector.
            </p>
          </div>
        ) : (
          (() => {
            // Usar o ultimo mes disponivel como valor principal dos KPI cards
            const latestRow = costPerLead[costPerLead.length - 1];
            const fmtUsd = (val: number) =>
              val > 0 ? `$${val.toFixed(4)}` : "--";

            return (
              <div>
                {/* 2 KPI cards side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#8b949e]">
                        Custo / Lead Respondido
                      </span>
                      <DollarSign className="h-4 w-4 text-[#3fb950]" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-[#3fb950]">
                      {fmtUsd(latestRow.cost_per_lead_replied_usd)}
                    </p>
                    <p className="text-[10px] text-[#6e7681] mt-1">
                      Ultimo mes: {latestRow.month}
                    </p>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#8b949e]">
                        Custo / Agendamento
                      </span>
                      <DollarSign className="h-4 w-4 text-[#58a6ff]" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-[#58a6ff]">
                      {fmtUsd(latestRow.cost_per_scheduled_usd)}
                    </p>
                    <p className="text-[10px] text-[#6e7681] mt-1">
                      Ultimo mes: {latestRow.month}
                    </p>
                  </div>
                </div>

                {/* Tabela detalhada por mes */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#30363d] text-[#8b949e]">
                        <th className="text-left px-4 py-3 font-medium">Mes</th>
                        {showingAllClients && (
                          <th className="text-left px-4 py-3 font-medium">
                            Cliente
                          </th>
                        )}
                        <th className="text-right px-4 py-3 font-medium">
                          Contatados
                        </th>
                        <th className="text-right px-4 py-3 font-medium">
                          Responderam
                        </th>
                        <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">
                          Agendamentos
                        </th>
                        <th className="text-right px-4 py-3 font-medium">
                          Custo/Lead
                        </th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                          Custo/Agend
                        </th>
                        <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">
                          Custo Total IA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {costPerLead.map((row, idx) => {
                        const clientName =
                          showingAllClients && row.location_id
                            ? (locationNameMap[row.location_id] ??
                              row.location_id)
                            : null;
                        return (
                          <tr
                            key={`${row.month}-${idx}`}
                            className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d] transition-colors"
                          >
                            <td className="px-4 py-3 text-[#c9d1d9] font-mono text-xs">
                              {row.month}
                            </td>
                            {showingAllClients && (
                              <td className="px-4 py-3 text-[#8b949e] text-xs">
                                {clientName ? (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 flex-shrink-0" />
                                    {clientName}
                                  </span>
                                ) : (
                                  <span className="text-[#6e7681]">—</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right font-mono text-[#c9d1d9]">
                              {row.leads_contacted.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#c9d1d9]">
                              {row.leads_replied.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#c9d1d9] hidden sm:table-cell">
                              {row.leads_scheduled.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-[#3fb950] font-semibold">
                                {fmtUsd(row.cost_per_lead_replied_usd)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#58a6ff] hidden md:table-cell">
                              {fmtUsd(row.cost_per_scheduled_usd)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[#8b949e] hidden lg:table-cell">
                              {row.total_ai_cost_usd > 0
                                ? `$${row.total_ai_cost_usd.toFixed(2)}`
                                : "--"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        )}
      </section>
    </div>
  );
}
