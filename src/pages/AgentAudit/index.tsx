import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Search,
  Shield,
  TrendingUp,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { useAgentAudits } from "../../hooks/useAgentAudits";
import { useToast } from "../../hooks/useToast";
import { AuditScoreCard } from "./components/AuditScoreCard";

type FilterStatus = "all" | "healthy" | "warning" | "critical";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "healthy", label: "Healthy" },
];

function SkeletonCard() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-5 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="h-7 w-16 bg-white/10 rounded mb-2" />
      <div className="h-2 w-full bg-white/5 rounded-full" />
      <div className="flex gap-4 mt-3">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  );
}

const AUDIT_COMMAND = `/sl audit-agent\n\nAGENTE: [NOME_DO_AGENTE]\nCONTEXTO: all`;

export function AgentAudit() {
  const navigate = useNavigate();
  const { scorecards, loading, error } = useAgentAudits();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyAuditCommand = useCallback(() => {
    navigator.clipboard.writeText(AUDIT_COMMAND);
    setCopied(true);
    showToast(
      "Comando copiado! Cole no Claude Code para iniciar a auditoria.",
      "success",
    );
    setTimeout(() => setCopied(false), 2000);
  }, [showToast]);

  const filtered = useMemo(() => {
    let list = scorecards;
    if (filter !== "all") list = list.filter((s) => s.healthStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.agentName.toLowerCase().includes(q) ||
          s.locationId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [scorecards, filter, search]);

  // KPIs
  const totalAudits = scorecards.length;
  const avgHealth =
    totalAudits > 0
      ? scorecards.reduce((sum, s) => sum + s.healthScore, 0) / totalAudits
      : 0;
  const criticalCount = scorecards.filter(
    (s) => s.healthStatus === "critical",
  ).length;
  const warningCount = scorecards.filter(
    (s) => s.healthStatus === "warning",
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-primary/10">
            <ClipboardCheck size={22} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Auditoria de Agentes
            </h1>
            <p className="text-text-muted text-sm">
              Scorecard de saude baseado em conversas reais
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyAuditCommand}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          title="Copiar comando para Claude Code"
        >
          <Terminal size={16} />
          <span>Nova Auditoria</span>
          {copied ? (
            <Check size={14} />
          ) : (
            <Copy size={14} className="opacity-60" />
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-accent-primary" />
            <span className="text-text-muted text-xs">Agentes Auditados</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{totalAudits}</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-text-muted text-xs">Health Medio</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {avgHealth.toFixed(0)}
            <span className="text-sm text-text-muted">/100</span>
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-text-muted text-xs">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-text-muted text-xs">Warning</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{warningCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-accent-primary text-white"
                  : "bg-bg-secondary text-text-muted hover:bg-bg-hover"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck
            size={40}
            className="mx-auto text-text-muted mb-3 opacity-30"
          />
          <p className="text-text-muted text-sm">
            {scorecards.length === 0
              ? "Nenhuma auditoria realizada ainda."
              : "Nenhum resultado com os filtros atuais."}
          </p>
          {scorecards.length === 0 && (
            <button
              onClick={handleCopyAuditCommand}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary/50 text-text-muted hover:text-text-primary rounded-lg text-xs transition-colors"
            >
              <Terminal size={14} />
              Copiar comando para iniciar auditoria via Claude Code
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((audit) => (
            <AuditScoreCard
              key={audit.id}
              audit={audit}
              onClick={() => navigate(`/agent-audit/${audit.agentVersionId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
