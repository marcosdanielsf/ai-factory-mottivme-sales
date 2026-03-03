import React, { useState, useMemo } from "react";
import {
  Wrench,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Activity,
  Users,
  Bot,
  ChevronDown,
  Clock,
} from "lucide-react";
import {
  useAgentToolCalls,
  type ToolCall,
} from "../../hooks/useAgentToolCalls";

// ============================================
// HELPERS
// ============================================

function formatDateBR(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str: string | null | undefined, maxLen: number): string {
  if (!str) return "-";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

function inputPreview(input: Record<string, unknown> | null): string {
  if (!input) return "-";
  try {
    return truncate(JSON.stringify(input), 60);
  } catch {
    return "-";
  }
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "default" | "green" | "red" | "blue";
}

const StatCard = ({
  label,
  value,
  icon,
  accent = "default",
}: StatCardProps) => {
  const accentMap = {
    default: "bg-bg-tertiary text-text-muted",
    green: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
    blue: "bg-blue-500/10 text-blue-400",
  };
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex items-center gap-4">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accentMap[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted truncate">{label}</p>
        <p className="text-2xl font-bold text-text-primary leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

// ============================================
// FILTRO SELECT
// ============================================

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

const FilterSelect = ({
  value,
  onChange,
  placeholder,
  options,
  icon,
}: FilterSelectProps) => (
  <div className="relative flex items-center">
    {icon && (
      <span className="absolute left-3 text-text-muted pointer-events-none">
        {icon}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none h-9 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary pr-8 ${icon ? "pl-8" : "pl-3"}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown
      size={12}
      className="absolute right-2.5 text-text-muted pointer-events-none"
    />
  </div>
);

// ============================================
// MODAL DE DETALHES
// ============================================

interface DetailModalProps {
  call: ToolCall;
  onClose: () => void;
}

const DetailModal = ({ call, onClose }: DetailModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
            <Wrench size={14} className="text-text-secondary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary font-mono">
              {call.tool_name}
            </h2>
            <p className="text-xs text-text-muted">
              {formatDateBR(call.called_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {call.success ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              <CheckCircle size={11} /> Sucesso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400 border border-red-500/30 font-medium">
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Agente", value: call.agent_name || "-" },
            { label: "Versão", value: call.agent_version || "-" },
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
              <p className="text-xs text-text-secondary break-all font-mono">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
            Input
          </p>
          <pre className="bg-bg-primary border border-border-default rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48">
            {call.tool_input ? JSON.stringify(call.tool_input, null, 2) : "-"}
          </pre>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
            Output
          </p>
          <pre className="bg-bg-primary border border-border-default rounded-lg p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48">
            {call.tool_output || "-"}
          </pre>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

type StatusFilter = "all" | "success" | "error";

export const ToolMonitor = () => {
  const [toolNameFilter, setToolNameFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCall, setSelectedCall] = useState<ToolCall | null>(null);

  const filters = useMemo(
    () => ({
      toolName: toolNameFilter || undefined,
      agentName: agentFilter || undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 300,
    }),
    [toolNameFilter, agentFilter, statusFilter, dateFrom, dateTo],
  );

  const { calls, loading, error, refetch, stats } = useAgentToolCalls(filters);

  const allToolNames = useMemo(
    () =>
      Array.from(new Set(calls.map((c) => c.tool_name)))
        .sort()
        .map((n) => ({ value: n, label: n })),
    [calls],
  );

  const allAgentNames = useMemo(
    () =>
      Array.from(
        new Set(calls.map((c) => c.agent_name).filter(Boolean) as string[]),
      )
        .sort()
        .map((n) => ({ value: n, label: n })),
    [calls],
  );

  const hasFilters =
    toolNameFilter ||
    agentFilter ||
    statusFilter !== "all" ||
    dateFrom ||
    dateTo;

  const clearFilters = () => {
    setToolNameFilter("");
    setAgentFilter("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const errorCount = calls.filter((c) => !c.success).length;

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border-default flex items-center justify-center">
            <Wrench size={16} className="text-text-secondary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary leading-tight">
              Ferramentas IA
            </h1>
            <p className="text-xs text-text-muted">
              Monitoramento de tool calls dos agentes em tempo real
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors border border-border-default disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total de Chamadas"
          value={stats.total}
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Taxa de Sucesso"
          value={`${stats.successRate}%`}
          icon={<CheckCircle size={16} />}
          accent="green"
        />
        <StatCard
          label="Tool Mais Usada"
          value={stats.topTool}
          icon={<Wrench size={16} />}
          accent="blue"
        />
        <StatCard
          label="Contatos Únicos"
          value={stats.uniqueContacts}
          icon={<Users size={16} />}
        />
      </div>

      {/* FILTROS */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Agente */}
          <FilterSelect
            value={agentFilter}
            onChange={setAgentFilter}
            placeholder="Todos os agentes"
            options={allAgentNames}
            icon={<Bot size={13} />}
          />

          {/* Tool */}
          <FilterSelect
            value={toolNameFilter}
            onChange={setToolNameFilter}
            placeholder="Todas as tools"
            options={allToolNames}
            icon={<Wrench size={13} />}
          />

          {/* Status */}
          <div className="flex items-center border border-border-default rounded-lg overflow-hidden h-9">
            {(["all", "success", "error"] as StatusFilter[]).map((s) => {
              const label =
                s === "all"
                  ? "Todos"
                  : s === "success"
                    ? "✓ Sucesso"
                    : "✗ Erro";
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 h-full text-xs font-medium transition-colors ${
                    active
                      ? s === "error"
                        ? "bg-red-500/15 text-red-400"
                        : s === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-bg-tertiary text-text-primary"
                      : "text-text-muted hover:bg-bg-hover"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Datas */}
          <div className="flex items-center gap-1.5 bg-bg-primary border border-border-default rounded-lg px-3 h-9">
            <Clock size={13} className="text-text-muted flex-shrink-0" />
            <span className="text-xs text-text-muted">De</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-sm text-text-primary focus:outline-none w-32"
            />
            <span className="text-xs text-text-muted">até</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-sm text-text-primary focus:outline-none w-32"
            />
          </div>

          {/* Limpar */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-9 px-3 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors border border-border-default"
            >
              <X size={12} />
              Limpar
            </button>
          )}

          {/* Badge erros */}
          {errorCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
              <XCircle size={11} />
              {errorCount} {errorCount === 1 ? "erro" : "erros"}
            </span>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div className="border border-border-default rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_90px_2fr_2fr_1.2fr] gap-3 px-4 py-2.5 bg-bg-secondary border-b border-border-default">
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
              className="text-[10px] font-semibold text-text-muted uppercase tracking-wider truncate"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted">
            <RefreshCw size={14} className="animate-spin" />
            Carregando...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-400">{error}</div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-muted">
            <Wrench size={24} className="opacity-30" />
            <p className="text-sm">Nenhuma chamada encontrada</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-accent-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border-default/40">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="w-full grid grid-cols-[1.5fr_1.5fr_1.5fr_90px_2fr_2fr_1.2fr] gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left group"
              >
                <span className="text-sm text-text-primary truncate font-mono font-medium group-hover:text-accent-primary transition-colors">
                  {call.tool_name}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Bot size={12} className="text-text-muted flex-shrink-0" />
                  <span className="text-sm text-text-secondary truncate">
                    {call.agent_name || "-"}
                  </span>
                </span>
                <span className="text-xs text-text-muted truncate font-mono self-center">
                  {call.contact_id ? truncate(call.contact_id, 14) : "-"}
                </span>
                <span className="self-center">
                  {call.success ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium whitespace-nowrap">
                      <CheckCircle size={9} /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-medium whitespace-nowrap">
                      <XCircle size={9} /> Erro
                    </span>
                  )}
                </span>
                <span className="text-xs text-text-muted truncate font-mono self-center">
                  {inputPreview(call.tool_input)}
                </span>
                <span className="text-xs text-text-muted truncate self-center">
                  {truncate(call.tool_output, 55)}
                </span>
                <span className="text-xs text-text-muted whitespace-nowrap self-center">
                  {formatDateBR(call.called_at)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Footer com contagem */}
        {calls.length > 0 && (
          <div className="px-4 py-2 bg-bg-secondary border-t border-border-default flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {calls.length} registros
            </span>
            {calls.length >= 300 && (
              <span className="text-xs text-text-muted">
                Limite de 300 — use filtros para refinar
              </span>
            )}
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
