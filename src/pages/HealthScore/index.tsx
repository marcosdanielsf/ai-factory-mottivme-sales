import { useState, useMemo } from "react";
import {
  HeartPulse,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { useHealthScore } from "../../hooks/useHealthScore";
import { SummaryCards } from "./components/SummaryCards";
import { ClientCard } from "./components/ClientCard";
import { HealthTrendChart } from "./components/HealthTrendChart";
import type { RiskLevel } from "./types";
import { RISK_CONFIG } from "./types";

// ─── CSS Keyframes (injected once) ──────────────────────────────────────────

const styleId = "health-score-keyframes";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes ecg-line {
      0% { stroke-dashoffset: 1000; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .health-fade-up {
      animation: fade-up 0.5s ease-out both;
    }
    .health-fade-up-1 { animation-delay: 0.05s; }
    .health-fade-up-2 { animation-delay: 0.1s; }
    .health-fade-up-3 { animation-delay: 0.15s; }
  `;
  document.head.appendChild(style);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function HealthScore() {
  const {
    clients,
    summary,
    history,
    loading,
    error,
    refresh,
    saveManualInput,
  } = useHealthScore();
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");

  const filteredClients = useMemo(() => {
    let result = clients;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.agent_name?.toLowerCase().includes(q) ||
          c.location_id.toLowerCase().includes(q),
      );
    }

    if (filterRisk !== "all") {
      result = result.filter((c) => c.risk_level === filterRisk);
    }

    return result;
  }, [clients, search, filterRisk]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
        <span className="text-sm text-white/30">
          Carregando sinais vitais...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
        <AlertCircle size={28} className="text-rose-400" />
        <p className="text-sm text-white/50 max-w-md">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-cyan-500/10 text-cyan-300 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between health-fade-up">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            <HeartPulse size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white/90 tracking-tight">
              Health Score
            </h1>
            <p className="text-[11px] text-white/30 tracking-wide">
              Monitoramento de saude dos clientes MOTTIVME
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          className="p-2.5 rounded-xl text-white/30 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all cursor-pointer"
          title="Atualizar dados"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ECG decorative line */}
      <div className="h-px relative overflow-hidden">
        <svg
          width="100%"
          height="2"
          className="absolute inset-0"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="1"
            x2="100%"
            y2="1"
            stroke="rgba(6,182,212,0.15)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Summary */}
      <div className="health-fade-up health-fade-up-1">
        <SummaryCards summary={summary} />
      </div>

      {/* Trend chart */}
      <div className="health-fade-up health-fade-up-2">
        <HealthTrendChart data={history} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 health-fade-up health-fade-up-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Search size={14} className="text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-transparent text-sm text-white/70 placeholder-white/20 outline-none w-full"
          />
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-white/20" />
          <button
            onClick={() => setFilterRisk("all")}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              filterRisk === "all"
                ? "bg-white/10 text-white/70"
                : "text-white/25 hover:text-white/40"
            }`}
          >
            Todos
          </button>
          {(
            Object.entries(RISK_CONFIG) as [
              RiskLevel,
              (typeof RISK_CONFIG)[RiskLevel],
            ][]
          ).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterRisk(key)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                background:
                  filterRisk === key ? `${cfg.color}15` : "transparent",
                color:
                  filterRisk === key ? cfg.color : "rgba(255,255,255,0.25)",
                border:
                  filterRisk === key
                    ? `1px solid ${cfg.color}30`
                    : "1px solid transparent",
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      <div className="space-y-2.5">
        {filteredClients.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-sm text-white/30">
              {search || filterRisk !== "all"
                ? "Nenhum cliente encontrado com esses filtros"
                : "Nenhum cliente com agente ativo"}
            </p>
          </div>
        ) : (
          filteredClients.map((client, i) => (
            <div
              key={client.location_id}
              className="health-fade-up"
              style={{ animationDelay: `${0.2 + i * 0.04}s` }}
            >
              <ClientCard
                client={client}
                rank={i + 1}
                onSaveManualInput={saveManualInput}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-white/15 tracking-wider uppercase">
          Health Score v1.0 — Pesos: Agendamento 30% · Engajamento 25% ·
          Satisfacao 20% · Atividade 15% · Pagamento 10%
        </p>
      </div>
    </div>
  );
}
