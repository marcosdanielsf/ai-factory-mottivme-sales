/**
 * Metas & OKRs — Dashboard de acompanhamento de metas decompostas
 *
 * Hero: Meta anual com progress ring
 * Cards por trimestre com OKRs expandiveis
 * KR progress bars com status colorido
 * Funis com toggle ativo/inativo
 * Acoes com checkbox
 */

import React, { useState, useMemo } from "react";
import {
  Target,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAccount } from "../../contexts/AccountContext";
import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useLocations } from "../../hooks/useLocations";
import { useGoalDecomposition } from "../../hooks/useGoalDecomposition";
import { DecompositionTree } from "../../components/GoalDecomposer/DecompositionTree";
import { LocationSelector } from "../Planejamento/components/LocationSelector";

// =============================================================
// Constants
// =============================================================

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  no_data: { color: "text-zinc-500", bg: "bg-zinc-700", label: "Sem dados" },
  behind: { color: "text-red-400", bg: "bg-red-500", label: "Atrasado" },
  on_track: {
    color: "text-amber-400",
    bg: "bg-amber-500",
    label: "No caminho",
  },
  ahead: {
    color: "text-emerald-400",
    bg: "bg-emerald-500",
    label: "Adiantado",
  },
  achieved: {
    color: "text-emerald-300",
    bg: "bg-emerald-400",
    label: "Atingido",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  growth: "border-l-emerald-500",
  retention: "border-l-blue-500",
  efficiency: "border-l-amber-500",
  infrastructure: "border-l-purple-500",
};

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

// =============================================================
// Progress Ring
// =============================================================

function ProgressRing({
  progress,
  size = 120,
}: {
  progress: number;
  size?: number;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const color =
    progress >= 80
      ? "#34d399"
      : progress >= 50
        ? "#fbbf24"
        : progress > 0
          ? "#f87171"
          : "#52525b";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#27272a"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-zinc-100">{progress}%</span>
      </div>
    </div>
  );
}

// =============================================================
// KR Progress Bar
// =============================================================

function KRProgressBar({
  kr,
  onUpdate,
}: {
  kr: {
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    unit: string;
    progress_percentage: number;
    status: string;
    benchmark_value: number | null;
    benchmark_label: string | null;
  };
  onUpdate: (krId: string, value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(kr.current_value));
  const statusCfg = STATUS_CONFIG[kr.status] || STATUS_CONFIG.no_data;

  const handleSave = () => {
    const num = Number(editValue);
    if (!isNaN(num) && num >= 0) {
      onUpdate(kr.id, num);
    }
    setEditing(false);
  };

  return (
    <div className="px-4 py-2.5 hover:bg-zinc-800/30 transition-colors rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-zinc-300 flex-1">{kr.title}</span>
        <div className="flex items-center gap-2 text-xs shrink-0">
          {editing ? (
            <input
              autoFocus
              className="w-16 bg-zinc-700 border border-amber-500/50 rounded px-1.5 py-0.5 text-right text-xs text-zinc-200 outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          ) : (
            <button
              onClick={() => {
                setEditValue(String(kr.current_value));
                setEditing(true);
              }}
              className="text-zinc-400 hover:text-amber-400 transition-colors tabular-nums"
              title="Clique para editar"
            >
              {kr.current_value}/{kr.target_value} {kr.unit}
            </button>
          )}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCfg.color} bg-opacity-20`}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusCfg.bg}`}
          style={{ width: `${Math.min(100, kr.progress_percentage)}%` }}
        />
      </div>
      {kr.benchmark_value != null && kr.benchmark_value > 0 && (
        <p className="text-[10px] text-zinc-600 mt-0.5">
          Benchmark: {kr.benchmark_value} {kr.unit} ({kr.benchmark_label})
        </p>
      )}
    </div>
  );
}

// =============================================================
// Main Page
// =============================================================

export function Metas() {
  const { selectedAccount, isViewingSubconta } = useAccount();
  const isAdmin = useIsAdmin();
  const { locations, loading: locationsLoading } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );

  const locationId = selectedLocationId || selectedAccount?.location_id || null;
  const locationName = useMemo(() => {
    if (selectedLocationId) {
      return (
        locations.find((l) => l.location_id === selectedLocationId)
          ?.location_name || selectedLocationId
      );
    }
    if (selectedAccount?.location_id) return selectedAccount.location_name;
    return null;
  }, [selectedLocationId, selectedAccount, locations]);

  const {
    decomposition,
    okrs,
    loading,
    error,
    decompose,
    confirmDecomposition,
    updateKeyResult,
    toggleFunnel,
    updateAction,
    deleteDecomposition,
  } = useGoalDecomposition(locationId);

  const [showDecomposer, setShowDecomposer] = useState(false);
  const [expandedQuarters, setExpandedQuarters] = useState<Set<number>>(() => {
    const q = getCurrentQuarter();
    return new Set([q]);
  });

  // Group OKRs by quarter
  const okrsByQuarter = useMemo(() => {
    const map = new Map<number, typeof okrs>();
    for (const okr of okrs) {
      const list = map.get(okr.quarter) || [];
      list.push(okr);
      map.set(okr.quarter, list);
    }
    return map;
  }, [okrs]);

  // Computed stats
  const totalKRs = okrs.reduce((s, o) => s + (o.key_results?.length || 0), 0);
  const achievedKRs = okrs.reduce(
    (s, o) => s + (o.key_results?.filter((kr) => kr.is_achieved).length || 0),
    0,
  );
  const totalActions = okrs.reduce((s, o) => s + (o.actions?.length || 0), 0);
  const doneActions = okrs.reduce(
    (s, o) => s + (o.actions?.filter((a) => a.status === "done").length || 0),
    0,
  );

  const toggleQuarter = (q: number) => {
    setExpandedQuarters((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  };

  // Empty state — no account selected
  if (!locationId) {
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Metas & OKRs
          </h1>
          {isAdmin && !isViewingSubconta && (
            <LocationSelector
              locations={locations}
              selectedLocationId={selectedLocationId}
              onChange={setSelectedLocationId}
              isLoading={locationsLoading}
            />
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <Target className="w-8 h-8 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-zinc-200">
              Selecione uma conta
            </h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              {isAdmin && !isViewingSubconta
                ? "Use o seletor acima ou clique em uma subconta no menu lateral para ver as metas."
                : "Selecione uma conta para ver as metas."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !decomposition && !showDecomposer) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-zinc-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando metas...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Metas & OKRs
          {locationName && (
            <span className="text-sm font-normal text-zinc-500">
              — {locationName}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && !isViewingSubconta && (
            <LocationSelector
              locations={locations}
              selectedLocationId={selectedLocationId}
              onChange={setSelectedLocationId}
              isLoading={locationsLoading}
            />
          )}
          <button
            onClick={() => setShowDecomposer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {decomposition ? "Redecompor Meta" : "Decompor Meta com IA"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* No decomposition yet */}
      {!decomposition && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-medium text-zinc-200">
              Nenhuma meta definida
            </h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              Defina sua meta anual de faturamento e a IA vai decompor em OKRs
              trimestrais, indicadores mensuraveis, funis de aquisicao e acoes
              concretas.
            </p>
          </div>
          <button
            onClick={() => setShowDecomposer(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Decompor Meta com IA
          </button>
        </div>
      )}

      {/* Dashboard */}
      {decomposition && (
        <>
          {/* Hero Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-6">
              <ProgressRing progress={decomposition.progress_percentage} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-100">
                    Meta {decomposition.year}
                  </h2>
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">
                    {decomposition.business_model}
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {formatCurrency(decomposition.annual_target)}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{okrs.length} OKRs</span>
                  <span>
                    {achievedKRs}/{totalKRs} KRs atingidos
                  </span>
                  <span>
                    {doneActions}/{totalActions} acoes concluidas
                  </span>
                </div>
              </div>
              <button
                onClick={deleteDecomposition}
                className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
                title="Excluir decomposicao"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quarters */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((q) => {
              const quarterOkrs = okrsByQuarter.get(q) || [];
              if (quarterOkrs.length === 0) return null;

              const isCurrentQ = q === getCurrentQuarter();
              const expanded = expandedQuarters.has(q);
              const avgProgress = Math.round(
                quarterOkrs.reduce((s, o) => s + o.progress_percentage, 0) /
                  quarterOkrs.length,
              );

              return (
                <div
                  key={q}
                  className="border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Quarter Header */}
                  <button
                    onClick={() => toggleQuarter(q)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                    <span
                      className={`text-sm font-semibold ${isCurrentQ ? "text-amber-400" : "text-zinc-300"}`}
                    >
                      {QUARTER_LABELS[q - 1]}
                    </span>
                    {isCurrentQ && (
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded">
                        Atual
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="text-xs text-zinc-500">
                      {quarterOkrs.length} OKRs
                    </span>
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-8 text-right">
                      {avgProgress}%
                    </span>
                  </button>

                  {/* OKRs */}
                  {expanded && (
                    <div className="divide-y divide-zinc-800/50">
                      {quarterOkrs.map((okr) => (
                        <div
                          key={okr.id}
                          className={`border-l-2 ${CATEGORY_COLORS[okr.category || ""] || "border-l-zinc-700"}`}
                        >
                          {/* OKR Title */}
                          <div className="px-4 py-2.5 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="text-sm font-medium text-zinc-200 flex-1">
                              {okr.title}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {okr.progress_percentage}%
                            </span>
                          </div>

                          {/* Key Results */}
                          {okr.key_results?.map((kr) => (
                            <KRProgressBar
                              key={kr.id}
                              kr={kr}
                              onUpdate={updateKeyResult}
                            />
                          ))}

                          {/* Funnels */}
                          {okr.funnels && okr.funnels.length > 0 && (
                            <div className="px-4 py-2 space-y-1">
                              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                                Funis
                              </span>
                              {okr.funnels.map((f) => (
                                <div
                                  key={f.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <button
                                    onClick={() =>
                                      toggleFunnel(f.id, !f.is_active)
                                    }
                                    className={`w-3.5 h-3.5 rounded-sm border transition-colors ${
                                      f.is_active
                                        ? "bg-amber-500 border-amber-500"
                                        : "border-zinc-600 hover:border-zinc-500"
                                    }`}
                                  >
                                    {f.is_active && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                    )}
                                  </button>
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span
                                    className={
                                      f.is_active
                                        ? "text-zinc-300"
                                        : "text-zinc-500"
                                    }
                                  >
                                    {f.funnel_type.replace(/_/g, " ")}
                                    {f.channel &&
                                      ` (${f.channel.replace(/_/g, " ")})`}
                                  </span>
                                  {f.suggested_budget && (
                                    <span className="text-zinc-600">
                                      R${" "}
                                      {f.suggested_budget.toLocaleString(
                                        "pt-BR",
                                      )}
                                      /mes
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          {okr.actions && okr.actions.length > 0 && (
                            <div className="px-4 py-2 space-y-1">
                              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                                Acoes
                              </span>
                              {okr.actions.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <button
                                    onClick={() =>
                                      updateAction(
                                        a.id,
                                        a.status === "done"
                                          ? "pending"
                                          : "done",
                                      )
                                    }
                                    className="shrink-0"
                                  >
                                    {a.status === "done" ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : a.status === "in_progress" ? (
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-zinc-600" />
                                    )}
                                  </button>
                                  <span
                                    className={
                                      a.status === "done"
                                        ? "text-zinc-500 line-through"
                                        : "text-zinc-300"
                                    }
                                  >
                                    {a.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Decomposer Modal */}
      <DecompositionTree
        isOpen={showDecomposer}
        onClose={() => setShowDecomposer(false)}
        onDecompose={decompose}
        onConfirm={confirmDecomposition}
        locationId={locationId || ""}
        locationName={locationName || selectedAccount?.location_name}
        initialTarget={decomposition?.annual_target}
        initialBusinessModel={decomposition?.business_model as any}
        loading={loading}
      />
    </div>
  );
}
