import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  Filter,
  MessageCircle,
  DollarSign,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";
import { useIGProspectorData } from "../hooks/useIGProspectorData";
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

interface LocationOption {
  location_id: string;
  location_name: string;
}

// ============================================================================
// IGProspectorDashboard
// Dashboard de prospecção Instagram — consome exclusivamente useIGProspectorData
// Exibe: funil de leads, reply rate por abordagem/mes, custo por lead
// ============================================================================

export default function IGProspectorDashboard() {
  const { isAdmin, isViewingSubconta } = useAccountData();
  const showClientSelector = isAdmin && !isViewingSubconta;

  // Selector state — undefined = dont override (use context), null = all, string = specific
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locations, setLocations] = useState<LocationOption[]>([]);

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
      // Try location_name_map first (has friendly names)
      const { data: nameMapData, error: nameMapErr } = await supabase
        .from("location_name_map")
        .select("location_id, location_name")
        .order("location_name");

      if (!nameMapErr && nameMapData && nameMapData.length > 0) {
        setLocations(
          nameMapData.map((row: Record<string, unknown>) => ({
            location_id: String(row.location_id ?? ""),
            location_name: String(row.location_name ?? ""),
          })),
        );
        return;
      }

      // Fallback: get distinct locations from prospector_campaigns
      const { data: campData, error: campErr } = await supabase
        .from("prospector_campaigns")
        .select("location_id, ig_account")
        .not("location_id", "is", null);

      if (campErr) {
        console.error(
          "[IGProspectorDashboard] campaigns query error:",
          campErr,
        );
        return;
      }

      // Deduplicate by location_id
      const seen = new Set<string>();
      const unique: LocationOption[] = [];
      for (const row of campData ?? []) {
        const lid = String((row as Record<string, unknown>).location_id ?? "");
        if (lid && !seen.has(lid)) {
          seen.add(lid);
          unique.push({
            location_id: lid,
            location_name: String(
              (row as Record<string, unknown>).ig_account ?? lid,
            ),
          });
        }
      }
      unique.sort((a, b) => a.location_name.localeCompare(b.location_name));
      setLocations(unique);
    };

    fetchLocations();
  }, [showClientSelector]);

  // Pass override: empty string = no override (fall back to context), non-empty = filter
  const locationIdOverride = showClientSelector
    ? selectedLocationId === ""
      ? null
      : selectedLocationId
    : undefined;

  const { funnelStages, replyRates, costPerLead, loading, error, refetch } =
    useIGProspectorData(locationIdOverride);

  // Total de leads no funil
  const totalLeads = funnelStages.reduce((sum, s) => sum + s.count, 0);

  // Whether we are showing all clients (admin, no filter selected)
  const showingAllClients = showClientSelector && selectedLocationId === "";

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">
            Instagram Prospector — Dashboard
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Visao consolidada de funil, replies e custo por lead
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Client selector — only for admin in admin mode */}
          {showClientSelector && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#8b949e]" />
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#58a6ff] transition-colors"
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
          <span className="inline-flex items-center gap-1.5 text-xs bg-[#161b22] border border-[#30363d] text-[#3fb950] px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            Dados em tempo real
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

      {/* Error banner */}
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
      {/* Secao 1: Funil de Leads */}
      {/* -------------------------------------------------------------------- */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Funil de Leads
          </h2>
          {totalLeads > 0 && (
            <span className="text-xs text-[#8b949e] ml-1">
              ({totalLeads.toLocaleString("pt-BR")} leads total)
            </span>
          )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {funnelStages.map((s) => {
              const pct = totalLeads > 0 ? (s.count / totalLeads) * 100 : 0;
              const color = STAGE_COLORS[s.stage] ?? "#8b949e";
              return (
                <div
                  key={s.stage}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  <p className="text-xs text-[#8b949e] mb-1">
                    {STAGE_LABELS[s.stage] ?? s.stage}
                  </p>
                  <p className="text-2xl font-bold font-mono" style={{ color }}>
                    {s.count.toLocaleString("pt-BR")}
                  </p>
                  <div className="mt-2 h-1 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6e7681] mt-1">
                    {pct.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Secao 2: Reply Rate por Abordagem */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  ? locationNameMap[row.location_id]
                  : null;

              return (
                <div
                  key={`${row.approach_type}-${row.month}-${idx}`}
                  className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-[#8b949e] mb-0.5">Abordagem</p>
                      <p className="text-sm font-medium text-[#58a6ff]">
                        {row.approach_type === "warm" ? "Warm" : "Cold"}
                      </p>
                      <p className="text-[10px] text-[#6e7681] mt-0.5">
                        {row.month}
                      </p>
                      {clientName && (
                        <p className="text-[10px] text-[#8b949e] mt-0.5 flex items-center gap-1">
                          <Building2 className="h-2.5 w-2.5" />
                          {clientName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8b949e] mb-0.5">
                        Reply Rate
                      </p>
                      <p
                        className="text-xl font-bold"
                        style={{ color: rateColor }}
                      >
                        {rateNum.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-[#8b949e]">
                    <span>
                      DMs:{" "}
                      <span className="text-[#c9d1d9] font-mono">
                        {row.total_dms_sent.toLocaleString("pt-BR")}
                      </span>
                    </span>
                    <span>
                      Replies:{" "}
                      <span className="text-[#c9d1d9] font-mono">
                        {row.total_replied.toLocaleString("pt-BR")}
                      </span>
                    </span>
                    <span>
                      Agend:{" "}
                      <span className="text-[#c9d1d9] font-mono">
                        {row.total_scheduled.toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(rateNum, 100)}%`,
                        backgroundColor: rateColor,
                      }}
                    />
                  </div>
                  {row.avg_time_to_reply_hours > 0 && (
                    <p className="text-[10px] text-[#6e7681] mt-1">
                      Tempo medio de resposta:{" "}
                      {row.avg_time_to_reply_hours.toFixed(1)}h
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* Secao 3: Custo por Lead */}
      {/* -------------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#58a6ff]" />
          <h2 className="text-lg font-semibold text-[#f0f6fc]">
            Custo por Lead
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
              vw_cost_per_lead
            </p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e]">
                  <th className="text-left px-4 py-3 font-medium">Mes</th>
                  {showingAllClients && (
                    <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  )}
                  <th className="text-right px-4 py-3 font-medium">
                    Contatados
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Responderam
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Custo/Lead
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                    Custo Total IA
                  </th>
                </tr>
              </thead>
              <tbody>
                {costPerLead.map((row, idx) => {
                  const clientName =
                    showingAllClients && row.location_id
                      ? (locationNameMap[row.location_id] ?? row.location_id)
                      : null;
                  return (
                    <tr
                      key={`${row.month}-${idx}`}
                      className="border-b border-[#21262d] last:border-0 hover:bg-[#21262d] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#c9d1d9]">{row.month}</td>
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
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-[#3fb950] font-semibold">
                          ${row.cost_per_lead_contacted_usd.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#8b949e] hidden md:table-cell">
                        ${row.total_ai_cost_usd.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
