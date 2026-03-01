/**
 * DecompositionTree — Modal fullscreen para decomposicao IA de metas
 *
 * Fluxo: Input meta → Gerar IA → Arvore editavel → Confirmar e Salvar
 */

import React, { useState, useCallback } from "react";
import {
  X,
  Sparkles,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Zap,
  ListChecks,
  Loader2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import type {
  DecomposeInput,
  DecomposeResult,
  DecomposeOKR,
  DecomposeKeyResult,
  DecomposeFunnel,
  DecomposeAction,
} from "../../lib/goal-decomposer";

// =============================================================
// Props
// =============================================================

interface DecompositionTreeProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: DecomposeInput, result: DecomposeResult) => Promise<void>;
  onDecompose: (input: DecomposeInput) => Promise<DecomposeResult>;
  locationId: string;
  locationName?: string;
  initialTarget?: number;
  initialBusinessModel?: DecomposeInput["business_model"];
  loading?: boolean;
}

// =============================================================
// Constants
// =============================================================

const BUSINESS_MODELS: {
  value: DecomposeInput["business_model"];
  label: string;
}[] = [
  { value: "clinica", label: "Clinica / Saude" },
  { value: "imobiliaria", label: "Imobiliaria" },
  { value: "servicos", label: "Servicos / Consultoria" },
  { value: "saas", label: "SaaS / Produto Digital" },
  { value: "outro", label: "Outro" },
];

const CATEGORY_COLORS: Record<string, string> = {
  growth: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  retention: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  efficiency: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  infrastructure: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  growth: "Crescimento",
  retention: "Retencao",
  efficiency: "Eficiencia",
  infrastructure: "Infraestrutura",
};

const PRIORITY_COLORS: Record<string, string> = {
  p1: "bg-red-500/20 text-red-400",
  p2: "bg-orange-500/20 text-orange-400",
  p3: "bg-blue-500/20 text-blue-400",
  p4: "bg-zinc-500/20 text-zinc-400",
};

// =============================================================
// Sub-components
// =============================================================

function KRRow({
  kr,
  index,
  onChange,
}: {
  kr: DecomposeKeyResult;
  index: number;
  onChange: (
    index: number,
    field: keyof DecomposeKeyResult,
    value: string | number,
  ) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-zinc-800/50 text-sm">
      <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <input
        className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-500"
        value={kr.title}
        onChange={(e) => onChange(index, "title", e.target.value)}
        placeholder="Key Result..."
      />
      <div className="flex items-center gap-1 shrink-0">
        <input
          className="w-16 bg-zinc-700/50 border border-zinc-600 rounded px-1.5 py-0.5 text-right text-xs text-zinc-200 outline-none focus:border-amber-500/50"
          type="number"
          value={kr.target}
          onChange={(e) => onChange(index, "target", Number(e.target.value))}
        />
        <input
          className="w-20 bg-zinc-700/50 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-400 outline-none focus:border-amber-500/50"
          value={kr.unit}
          onChange={(e) => onChange(index, "unit", e.target.value)}
          placeholder="unidade"
        />
      </div>
      {kr.benchmark !== undefined && kr.benchmark > 0 && (
        <span
          className="text-[10px] text-zinc-500 shrink-0"
          title={kr.benchmark_label || "benchmark"}
        >
          <BarChart3 className="w-3 h-3 inline mr-0.5" />
          {kr.benchmark}
        </span>
      )}
    </div>
  );
}

function FunnelRow({ funnel }: { funnel: DecomposeFunnel }) {
  return (
    <div className="flex items-center gap-2 py-1 px-3 text-xs text-zinc-400">
      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
      <span className="capitalize">{funnel.type.replace(/_/g, " ")}</span>
      {funnel.channel && (
        <span className="text-zinc-500">
          ({funnel.channel.replace(/_/g, " ")})
        </span>
      )}
      {funnel.budget && (
        <span className="text-zinc-500">
          R$ {funnel.budget.toLocaleString("pt-BR")}/mes
        </span>
      )}
      <span className="text-zinc-500">
        → {funnel.expected_leads} leads (
        {(funnel.conversion_rate * 100).toFixed(0)}%)
      </span>
    </div>
  );
}

function ActionRow({ action }: { action: DecomposeAction }) {
  return (
    <div className="flex items-center gap-2 py-1 px-3 text-xs">
      <div className="w-3.5 h-3.5 rounded border border-zinc-600 shrink-0" />
      <span
        className={`px-1 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[action.priority] || PRIORITY_COLORS.p3}`}
      >
        {action.priority.toUpperCase()}
      </span>
      <span className="text-zinc-300">{action.title}</span>
    </div>
  );
}

function OKRCard({
  okr,
  okrIndex,
  expanded,
  onToggle,
  onKRChange,
  onTitleChange,
}: {
  okr: DecomposeOKR;
  okrIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onKRChange: (
    okrIdx: number,
    krIdx: number,
    field: keyof DecomposeKeyResult,
    value: string | number,
  ) => void;
  onTitleChange: (okrIdx: number, value: string) => void;
}) {
  const categoryStyle = CATEGORY_COLORS[okr.category] || CATEGORY_COLORS.growth;
  const categoryLabel = CATEGORY_LABELS[okr.category] || okr.category;

  return (
    <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
        )}
        <span className="text-xs font-medium text-zinc-500">
          Q{okr.quarter}
        </span>
        <span className="flex-1 text-sm font-medium text-zinc-200">
          {okr.title}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] border ${categoryStyle}`}
        >
          {categoryLabel}
        </span>
      </button>

      {expanded && (
        <div className="px-2 py-2 space-y-1.5">
          {/* Title edit */}
          <div className="px-3 pb-1">
            <input
              className="w-full bg-transparent border-b border-zinc-700 outline-none text-sm text-zinc-200 pb-1 focus:border-amber-500/50"
              value={okr.title}
              onChange={(e) => onTitleChange(okrIndex, e.target.value)}
            />
            {okr.description && (
              <p className="text-xs text-zinc-500 mt-1">{okr.description}</p>
            )}
          </div>

          {/* Key Results */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Key Results ({okr.key_results.length})
            </span>
            {okr.key_results.map((kr, ki) => (
              <KRRow
                key={ki}
                kr={kr}
                index={ki}
                onChange={(krIdx, field, val) =>
                  onKRChange(okrIndex, krIdx, field, val)
                }
              />
            ))}
          </div>

          {/* Funnels */}
          {okr.funnels?.length > 0 && (
            <div className="space-y-0.5 pt-1">
              <span className="px-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Funis Sugeridos ({okr.funnels.length})
              </span>
              {okr.funnels.map((f, fi) => (
                <FunnelRow key={fi} funnel={f} />
              ))}
            </div>
          )}

          {/* Actions */}
          {okr.actions?.length > 0 && (
            <div className="space-y-0.5 pt-1">
              <span className="px-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Acoes ({okr.actions.length})
              </span>
              {okr.actions.map((a, ai) => (
                <ActionRow key={ai} action={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================
// Main Component
// =============================================================

export function DecompositionTree({
  isOpen,
  onClose,
  onConfirm,
  onDecompose,
  locationId,
  locationName,
  initialTarget,
  initialBusinessModel,
  loading: externalLoading,
}: DecompositionTreeProps) {
  // Input state
  const [annualTarget, setAnnualTarget] = useState(initialTarget || 0);
  const [businessModel, setBusinessModel] = useState<
    DecomposeInput["business_model"]
  >(initialBusinessModel || "servicos");
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true);

  // Result state
  const [result, setResult] = useState<DecomposeResult | null>(null);
  const [expandedOkrs, setExpandedOkrs] = useState<Set<number>>(new Set());
  const [decomposing, setDecomposing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const totalKRs =
    result?.okrs.reduce((sum, o) => sum + o.key_results.length, 0) || 0;
  const totalFunnels =
    result?.okrs.reduce((sum, o) => sum + (o.funnels?.length || 0), 0) || 0;
  const totalActions =
    result?.okrs.reduce((sum, o) => sum + (o.actions?.length || 0), 0) || 0;

  const handleDecompose = useCallback(async () => {
    if (annualTarget <= 0) {
      setError("Informe a meta anual");
      return;
    }
    setDecomposing(true);
    setError(null);

    try {
      const input: DecomposeInput = {
        annual_target: annualTarget,
        business_model: businessModel,
        location_id: locationId,
        location_name: locationName,
      };
      const res = await onDecompose(input);
      setResult(res);
      // Expand first OKR
      setExpandedOkrs(new Set([0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na decomposicao");
    } finally {
      setDecomposing(false);
    }
  }, [annualTarget, businessModel, locationId, locationName, onDecompose]);

  const handleConfirm = useCallback(async () => {
    if (!result) return;
    setConfirming(true);
    setError(null);

    try {
      const input: DecomposeInput = {
        annual_target: annualTarget,
        business_model: businessModel,
        location_id: locationId,
        location_name: locationName,
      };
      await onConfirm(input, result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setConfirming(false);
    }
  }, [
    result,
    annualTarget,
    businessModel,
    locationId,
    locationName,
    onConfirm,
    onClose,
  ]);

  const handleKRChange = useCallback(
    (
      okrIdx: number,
      krIdx: number,
      field: keyof DecomposeKeyResult,
      value: string | number,
    ) => {
      if (!result) return;
      const updated = { ...result };
      const okrs = [...updated.okrs];
      const okr = { ...okrs[okrIdx] };
      const krs = [...okr.key_results];
      krs[krIdx] = { ...krs[krIdx], [field]: value };
      okr.key_results = krs;
      okrs[okrIdx] = okr;
      updated.okrs = okrs;
      setResult(updated);
    },
    [result],
  );

  const handleOKRTitleChange = useCallback(
    (okrIdx: number, value: string) => {
      if (!result) return;
      const updated = { ...result };
      const okrs = [...updated.okrs];
      okrs[okrIdx] = { ...okrs[okrIdx], title: value };
      updated.okrs = okrs;
      setResult(updated);
    },
    [result],
  );

  const toggleOkr = useCallback((index: number) => {
    setExpandedOkrs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (result) setExpandedOkrs(new Set(result.okrs.map((_, i) => i)));
  }, [result]);

  const collapseAll = useCallback(() => {
    setExpandedOkrs(new Set());
  }, []);

  if (!isOpen) return null;

  const isLoading = decomposing || confirming || externalLoading;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-zinc-100">
              Decompor Meta com IA
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Input Section */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-zinc-500 mb-1">
                Meta Anual (R$)
              </label>
              <input
                type="number"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-amber-500/50 text-sm"
                value={annualTarget || ""}
                onChange={(e) => setAnnualTarget(Number(e.target.value))}
                placeholder="2.000.000"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs text-zinc-500 mb-1">
                Modelo de Negocio
              </label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-amber-500/50 text-sm"
                value={businessModel}
                onChange={(e) =>
                  setBusinessModel(
                    e.target.value as DecomposeInput["business_model"],
                  )
                }
              >
                {BUSINESS_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={includeBenchmarks}
                onChange={(e) => setIncludeBenchmarks(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Benchmarks
            </label>
            <button
              onClick={handleDecompose}
              disabled={isLoading || annualTarget <= 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg text-sm transition-colors"
            >
              {decomposing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {result ? "Regerar" : "Gerar Decomposicao"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Loading Skeleton */}
          {decomposing && !result && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-800/50 rounded-xl h-24 border border-zinc-700/30"
                />
              ))}
              <p className="text-xs text-zinc-500 text-center">
                Gerando decomposicao com Gemini Flash...
              </p>
            </div>
          )}

          {/* Result Tree */}
          {result && (
            <>
              {/* Summary Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {result.okrs.length} OKRs
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {totalKRs} KRs
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {totalFunnels} Funis
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    {totalActions} Acoes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAll}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Expandir
                  </button>
                  <span className="text-zinc-700">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Colapsar
                  </button>
                </div>
              </div>

              {/* OKR Cards */}
              <div className="space-y-2">
                {result.okrs.map((okr, oi) => (
                  <OKRCard
                    key={oi}
                    okr={okr}
                    okrIndex={oi}
                    expanded={expandedOkrs.has(oi)}
                    onToggle={() => toggleOkr(oi)}
                    onKRChange={handleKRChange}
                    onTitleChange={handleOKRTitleChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/80">
            <button
              onClick={handleDecompose}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regerar com IA
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {confirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar e Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
