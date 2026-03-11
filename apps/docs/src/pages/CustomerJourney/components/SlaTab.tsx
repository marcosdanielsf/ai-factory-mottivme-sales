import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { useCjmSlaStatus } from "../../../hooks/useCjmSlaStatus";
import SlaIndicator from "./SlaIndicator";
import type { CjmSlaStatus } from "../../../types/cjm";

const formatHoursMinutes = (h: number) => {
  if (h <= 0) return "-";
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const STATUS_LABELS: Record<CjmSlaStatus, string> = {
  ok: "OK",
  warning: "Warning",
  breach: "Breach",
};

type FilterOption = "all" | CjmSlaStatus;

interface SlaTabProps {
  onClientSelect?: (contactId: string) => void;
}

const SlaTab = ({ onClientSelect }: SlaTabProps) => {
  const { slaItems, loading, error } = useCjmSlaStatus(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  const counts = useMemo(
    () => ({
      ok: slaItems.filter((i) => i.sla_status === "ok").length,
      warning: slaItems.filter((i) => i.sla_status === "warning").length,
      breach: slaItems.filter((i) => i.sla_status === "breach").length,
    }),
    [slaItems],
  );

  const filtered = useMemo(
    () =>
      activeFilter === "all"
        ? slaItems
        : slaItems.filter((i) => i.sla_status === activeFilter),
    [slaItems, activeFilter],
  );

  const FILTERS: { key: FilterOption; label: string }[] = [
    { key: "all", label: `Todos (${slaItems.length})` },
    { key: "ok", label: `OK (${counts.ok})` },
    { key: "warning", label: `Warning (${counts.warning})` },
    { key: "breach", label: `Breach (${counts.breach})` },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-bg-secondary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-sm">
        Erro ao carregar SLA: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex gap-4">
        <span className="text-sm text-emerald-400 font-medium">
          {counts.ok} OK
        </span>
        <span className="text-sm text-amber-400 font-medium">
          {counts.warning} Warning
        </span>
        <span className="text-sm text-red-400 font-medium">
          {counts.breach} Breach
        </span>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f.key
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <p>Nenhum item encontrado para este filtro.</p>
        </div>
      ) : (
        <div className="rounded-lg bg-bg-secondary overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-4 py-3 text-left text-xs text-text-muted font-medium">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-medium">
                  Pipeline
                </th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-medium">
                  Etapa
                </th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                  Tempo na Etapa
                </th>
                <th className="px-4 py-3 text-right text-xs text-text-muted font-medium">
                  Atraso
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={`${item.contact_id}-${item.pipeline_id}`}
                  className="border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors"
                >
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {item.contact_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {item.pipeline_name}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {item.stage_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <SlaIndicator status={item.sla_status} />
                      <span
                        className={
                          item.sla_status === "ok"
                            ? "text-emerald-400"
                            : item.sla_status === "warning"
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {STATUS_LABELS[item.sla_status]}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {formatHoursMinutes(item.hours_in_stage)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.hours_overdue > 0 ? (
                      <span className="text-red-400 font-medium">
                        +{formatHoursMinutes(item.hours_overdue)}
                      </span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {onClientSelect && (
                      <button
                        onClick={() => onClientSelect(item.contact_id)}
                        className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-text-primary transition-colors"
                        title="Ver detalhes"
                        aria-label="Ver detalhes do contato"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SlaTab;
