import React, { useState, useMemo, useCallback } from "react";
import {
  RefreshCw,
  Search,
  ChevronDown,
  ExternalLink,
  Download,
} from "lucide-react";
import type { CriativoLead } from "../../../hooks/useAgendamentosDashboard";
import { formatDate, formatPhone } from "../helpers";
import { getLeadStage, FUNNEL_STAGES } from "../constants";

interface LeadsUtmTableProps {
  leads: CriativoLead[];
  loading: boolean;
  locationId: string | null;
}

export const LeadsUtmTable: React.FC<LeadsUtmTableProps> = ({
  leads,
  loading,
  locationId,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<
    "created_at" | "first_name" | "status"
  >("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => {
        const name = [l.first_name, l.last_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const email = ((l as any).email || "").toLowerCase();
        const phone = (l.phone || "").toLowerCase();
        const utm = (l.utm_content || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          utm.includes(q)
        );
      });
    }

    if (statusFilter) {
      result = result.filter((l) => getLeadStage(l).label === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "created_at") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortCol === "first_name") {
        cmp = (a.first_name || "").localeCompare(b.first_name || "");
      } else if (sortCol === "status") {
        cmp = getLeadStage(a).order - getLeadStage(b).order;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [leads, search, statusFilter, sortCol, sortAsc]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportLeadsCsv = useCallback(() => {
    if (filtered.length === 0) return;

    const headers = [
      "Nome",
      "Sobrenome",
      "Email",
      "Telefone",
      "Origem",
      "Location",
      "UTM Content",
      "UTM Source",
      "UTM Campaign",
      "Ad ID",
      "Session Source",
      "Respondeu",
      "Status",
      "Etapa Funil",
      "Work Permit",
      "Data",
    ];

    const rows = filtered.map((lead) => {
      const stage = getLeadStage(lead);
      const email = (lead as any).email || "";
      const responded =
        lead.responded === true || (lead.responded as unknown) === "true"
          ? "Sim"
          : "Não";

      return [
        lead.first_name || "",
        lead.last_name || "",
        email,
        lead.phone || "",
        lead.source || "",
        lead.location_name || "",
        lead.utm_content || "",
        lead.utm_source || "",
        lead.utm_campaign || "",
        lead.ad_id || "",
        lead.session_source || "",
        responded,
        stage.label,
        lead.etapa_funil || "",
        lead.work_permit || "",
        formatDate(lead.created_at),
      ].map((field) => {
        const escaped = String(field).replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-utm-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filtered]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const label = getLeadStage(l).label;
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    <ChevronDown
      size={12}
      className={`inline ml-0.5 transition-transform ${sortCol === col ? "text-accent-primary" : "text-text-muted"} ${sortCol === col && sortAsc ? "rotate-180" : ""}`}
    />
  );

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="h-32 flex items-center justify-center">
          <RefreshCw size={20} className="animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  if (leads.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Leads x UTM (Individual)
          </h3>
          <p className="text-[10px] text-text-muted">
            {filtered.length} leads · Cada linha = 1 lead com seus dados de UTM
            e funil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLeadsCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-hover hover:bg-bg-tertiary border border-border-default rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Exportar CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Buscar nome, email, tel, UTM..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-7 pr-3 py-1.5 text-xs bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted w-60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => {
            setStatusFilter(null);
            setPage(0);
          }}
          className={`text-[11px] px-2 py-0.5 rounded-full transition-all ${!statusFilter ? "bg-accent-primary text-white" : "bg-bg-tertiary text-text-muted hover:text-text-primary"}`}
        >
          Todos ({leads.length})
        </button>
        {Object.entries(statusCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([label, count]) => {
            const stageStyle = Object.values(FUNNEL_STAGES).find(
              (s) => s.label === label,
            );
            const isActive = statusFilter === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setStatusFilter(isActive ? null : label);
                  setPage(0);
                }}
                className={`text-[11px] px-2 py-0.5 rounded-full transition-all ${isActive ? "ring-2 ring-white/40" : ""} ${stageStyle?.bg || "bg-bg-tertiary"} ${stageStyle?.color || "text-text-muted"}`}
              >
                {count} {label}
              </button>
            );
          })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-default text-text-muted">
              <th
                className="text-left py-2 px-2 font-medium cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("first_name")}
              >
                Nome <SortIcon col="first_name" />
              </th>
              <th className="text-left py-2 px-2 font-medium">Email</th>
              <th className="text-left py-2 px-2 font-medium">Telefone</th>
              <th className="text-left py-2 px-2 font-medium">UTM Content</th>
              <th className="text-left py-2 px-2 font-medium">UTM Campaign</th>
              <th
                className="text-left py-2 px-2 font-medium cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("status")}
              >
                Status <SortIcon col="status" />
              </th>
              <th className="text-left py-2 px-2 font-medium">Estado</th>
              <th className="text-left py-2 px-2 font-medium">Work Permit</th>
              <th className="text-left py-2 px-2 font-medium">Origem</th>
              <th
                className="text-left py-2 px-2 font-medium cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("created_at")}
              >
                Data <SortIcon col="created_at" />
              </th>
              <th className="text-left py-2 px-2 font-medium">CRM</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((lead) => {
              const stage = getLeadStage(lead);
              const fullName =
                [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
                "—";
              const email = (lead as any).email || "";
              const ghlUrl =
                locationId && lead.contact_id
                  ? `https://app.gohighlevel.com/v2/location/${locationId}/contacts/${lead.contact_id}`
                  : null;
              return (
                <tr
                  key={lead.id}
                  className="border-b border-border-default/50 hover:bg-bg-hover/50 transition-colors"
                >
                  <td className="py-2 px-2 text-text-primary font-medium max-w-[140px] truncate">
                    {fullName}
                  </td>
                  <td className="py-2 px-2 text-text-secondary max-w-[180px] truncate">
                    {email || "—"}
                  </td>
                  <td className="py-2 px-2 text-text-secondary whitespace-nowrap">
                    {lead.phone ? formatPhone(lead.phone) : "—"}
                  </td>
                  <td
                    className="py-2 px-2 max-w-[160px] truncate"
                    title={lead.utm_content || ""}
                  >
                    {lead.utm_content ? (
                      <span className="text-blue-400">{lead.utm_content}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td
                    className="py-2 px-2 text-text-muted max-w-[140px] truncate"
                    title={lead.utm_campaign || ""}
                  >
                    {lead.utm_campaign || "—"}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${stage.bg} ${stage.color}`}
                    >
                      {stage.label}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-text-secondary">
                    {lead.state || "—"}
                  </td>
                  <td className="py-2 px-2">
                    {lead.work_permit ? (
                      (() => {
                        const wp = lead.work_permit.toLowerCase();
                        if (
                          wp.includes("possui") ||
                          wp === "sim" ||
                          wp === "yes" ||
                          wp === "true"
                        ) {
                          return (
                            <span className="text-emerald-400 text-[10px] font-medium">
                              Sim
                            </span>
                          );
                        }
                        if (
                          wp.includes("não") ||
                          wp.includes("nao") ||
                          wp === "no" ||
                          wp === "false"
                        ) {
                          return (
                            <span className="text-red-400 text-[10px] font-medium">
                              Não
                            </span>
                          );
                        }
                        return (
                          <span className="text-text-muted text-[10px]">
                            {lead.work_permit}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-text-muted">
                    {lead.session_source || "—"}
                  </td>
                  <td className="py-2 px-2 text-text-muted whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="py-2 px-2">
                    {ghlUrl ? (
                      <a
                        href={ghlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                        title="Abrir no GHL"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
          <span>
            Pg {page + 1} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 rounded bg-bg-tertiary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 rounded bg-bg-tertiary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
