import { useState, useMemo } from "react";
import {
  Bot,
  Search,
  SlidersHorizontal,
  Terminal,
  MessageSquare,
} from "lucide-react";
import { useAiosAgents } from "../../hooks/aios/useAiosAgents";
import { AiosAgentStatus } from "../../types/aios";
import { AgentStatusCard } from "./components/AgentStatusCard";

const STATUS_FILTERS: { value: AiosAgentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "idle", label: "Ocioso" },
  { value: "error", label: "Erro" },
  { value: "offline", label: "Offline" },
];

const SOURCE_FILTERS: { value: string; label: string; icon: typeof Bot }[] = [
  { value: "all", label: "Todos", icon: Bot },
  { value: "claude_code", label: "Claude Code", icon: Terminal },
  { value: "ghl_agent", label: "GHL Agents", icon: MessageSquare },
];

function AgentCardSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-bg-tertiary rounded" />
        <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
      </div>
      <div className="h-3 w-full bg-bg-tertiary rounded" />
      <div className="h-3 w-3/4 bg-bg-tertiary rounded" />
      <div className="h-3 w-20 bg-bg-tertiary rounded" />
      <div className="flex gap-3 pt-2 border-t border-border-default">
        <div className="h-3 w-16 bg-bg-tertiary rounded" />
        <div className="h-3 w-16 bg-bg-tertiary rounded" />
      </div>
    </div>
  );
}

export function AiosAgents() {
  const [statusFilter, setStatusFilter] = useState<AiosAgentStatus | "all">(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState("claude_code");
  const [search, setSearch] = useState("");

  const { data: agents, loading } = useAiosAgents();

  const filtered = useMemo(() => {
    let list = agents;

    if (sourceFilter !== "all") {
      list = list.filter((a) => a.agent_source === sourceFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.persona ?? "").toLowerCase().includes(q) ||
          ((a.config?.model as string) ?? "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [agents, statusFilter, sourceFilter, search]);

  const statusCounts = useMemo(() => {
    const sourceFiltered =
      sourceFilter !== "all"
        ? agents.filter((a) => a.agent_source === sourceFilter)
        : agents;
    const counts: Record<string, number> = { all: sourceFiltered.length };
    for (const a of sourceFiltered) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }, [agents, sourceFilter]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length };
    for (const a of agents) {
      counts[a.agent_source] = (counts[a.agent_source] ?? 0) + 1;
    }
    return counts;
  }, [agents]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Agentes AIOS
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading
              ? "..."
              : `${agents.length} agente${agents.length !== 1 ? "s" : ""} registrado${agents.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar agente..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
      </div>

      {/* Source filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {SOURCE_FILTERS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sourceFilter === f.value
                  ? "bg-accent-primary text-white"
                  : "bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-hover border border-border-default"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
              <span
                className={`${sourceFilter === f.value ? "text-white/70" : "text-text-muted"}`}
              >
                {sourceCounts[f.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-text-muted mr-1" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-hover border border-border-default"
            }`}
          >
            {f.label}
            {statusCounts[f.value] !== undefined && (
              <span
                className={`ml-1.5 ${statusFilter === f.value ? "text-white/70" : "text-text-muted"}`}
              >
                {statusCounts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">
            {search || statusFilter !== "all"
              ? "Nenhum agente encontrado com esses filtros"
              : "Nenhum agente registrado"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <AgentStatusCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              persona={agent.persona}
              status={agent.status as AiosAgentStatus}
              model={(agent.config?.model as string) ?? null}
              total_executions={agent.total_executions ?? 0}
              total_cost={Number(agent.total_cost ?? 0)}
              last_active_at={agent.last_active_at ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
