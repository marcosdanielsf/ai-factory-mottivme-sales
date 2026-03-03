import React, { useState, useMemo } from "react";
import {
  Wrench,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import {
  useAgentToolCalls,
  type ToolCall,
} from "../../hooks/useAgentToolCalls";

// ============================================
// HELPERS
// ============================================

function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return "-";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

function inputPreview(input: Record<string, unknown> | null): string {
  if (!input) return "-";
  const raw = JSON.stringify(input);
  return truncate(raw, 50);
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ label, value, icon, iconBg }: StatCardProps) => (
  <div className="bg-bg-secondary border border-border-default rounded-lg p-3 space-y-1">
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-text-secondary truncate">
        {label}
      </span>
    </div>
    <div className="text-2xl font-bold text-text-primary truncate">{value}</div>
  </div>
);

// ============================================
// MODAL DE DETALHES
// ============================================

interface DetailModalProps {
  call: ToolCall;
  onClose: () => void;
}

const DetailModal = ({ call, onClose }: DetailModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-bg-tertiary flex items-center justify-center">
              <Wrench size={14} className="text-text-secondary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                {call.tool_name}
              </h2>
              <p className="text-xs text-text-muted">
                {formatDateBR(call.called_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {call.success ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle size={11} /> Sucesso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400 border border-red-500/30">
                <XCircle size={11} /> Erro
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-hover rounded-md transition-colors text-text-muted"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Agente", value: call.agent_name || "-" },
              { label: "Versao", value: call.agent_version || "-" },
              {
                label: "Location",
                value: call.location_name || call.location_id || "-",
              },
              { label: "Contact ID", value: call.contact_id || "-" },
              { label: "Execution ID", value: call.execution_id || "-" },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xs text-text-secondary break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
              Input
            </p>
            <pre className="bg-bg-primary border border-border-default rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
              {call.tool_input ? JSON.stringify(call.tool_input, null, 2) : "-"}
            </pre>
          </div>

          {/* Output */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
              Output
            </p>
            <pre className="bg-bg-primary border border-border-default rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
              {call.tool_output || "-"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ToolMonitor = () => {
  const [toolNameFilter, setToolNameFilter] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCall, setSelectedCall] = useState<ToolCall | null>(null);

  const filters = useMemo(
    () => ({
      toolName: toolNameFilter || undefined,
      onlyErrors: onlyErrors || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 200,
    }),
    [toolNameFilter, onlyErrors, dateFrom, dateTo],
  );

  const { calls, loading, error, refetch, stats } = useAgentToolCalls(filters);

  // Extrair tool names unicos para o select
  const allToolNames = useMemo(
    () => Array.from(new Set(calls.map((c) => c.tool_name))).sort(),
    [calls],
  );

  const hasFilters = toolNameFilter || onlyErrors || dateFrom || dateTo;

  const clearFilters = () => {
    setToolNameFilter("");
    setOnlyErrors(false);
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-5">
      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total de Chamadas"
          value={stats.total}
          iconBg="bg-bg-tertiary"
          icon={<Wrench size={13} className="text-text-secondary" />}
        />
        <StatCard
          label="Taxa de Sucesso"
          value={`${stats.successRate}%`}
          iconBg="bg-emerald-500/10"
          icon={<CheckCircle size={13} className="text-emerald-400" />}
        />
        <StatCard
          label="Tool Mais Usada"
          value={stats.topTool}
          iconBg="bg-bg-tertiary"
          icon={<Wrench size={13} className="text-text-secondary" />}
        />
        <StatCard
          label="Contatos Unicos"
          value={stats.uniqueContacts}
          iconBg="bg-bg-tertiary"
          icon={<Filter size={13} className="text-text-secondary" />}
        />
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tool name */}
        <select
          value={toolNameFilter}
          onChange={(e) => setToolNameFilter(e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        >
          <option value="">Todas as tools</option>
          {allToolNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {/* Apenas erros */}
        <label className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border-default rounded-lg cursor-pointer hover:bg-bg-hover transition-colors">
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={(e) => setOnlyErrors(e.target.checked)}
            className="accent-red-500 w-4 h-4"
          />
          <span className="text-sm text-text-secondary">Apenas erros</span>
        </label>

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />

        {/* Date to */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />

        {/* Limpar filtros */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors border border-border-default"
          >
            <X size={13} />
            Limpar
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors border border-border-default disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* TABELA */}
      <div className="border border-border-default rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_2fr_2fr_80px_3fr_3fr_2fr] gap-3 px-4 py-2.5 bg-bg-secondary border-b border-border-default">
          {[
            "Tool",
            "Agente",
            "Contato",
            "Status",
            "Input",
            "Output",
            "Hora",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold text-text-muted uppercase tracking-wide truncate"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-text-muted">
            Carregando...
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-sm text-red-400">
            {error}
          </div>
        ) : calls.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-text-muted">
            Nenhuma chamada encontrada.
          </div>
        ) : (
          <div className="divide-y divide-border-default/50">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="w-full grid grid-cols-[2fr_2fr_2fr_80px_3fr_3fr_2fr] gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors text-left"
              >
                <span className="text-sm text-text-primary truncate font-medium">
                  {call.tool_name}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {call.agent_name || "-"}
                </span>
                <span className="text-sm text-text-muted truncate font-mono text-xs">
                  {call.contact_id ? truncate(call.contact_id, 12) : "-"}
                </span>
                <span>
                  {call.success ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle size={9} /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30">
                      <XCircle size={9} /> Erro
                    </span>
                  )}
                </span>
                <span className="text-xs text-text-muted truncate font-mono">
                  {inputPreview(call.tool_input)}
                </span>
                <span className="text-xs text-text-muted truncate">
                  {truncate(call.tool_output, 50)}
                </span>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatDateBR(call.called_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedCall && (
        <DetailModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
};

export default ToolMonitor;
