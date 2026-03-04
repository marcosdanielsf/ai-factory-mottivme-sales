import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Smile,
  Building2,
  Monitor,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  DollarSign,
  Scale,
  Dumbbell,
  Sparkles,
  Car,
  Shield,
  Globe,
  Wrench,
  Check,
  X,
} from "lucide-react";
import { SEGMENT_BENCHMARKS, type SegmentKey } from "../constants";

interface SegmentSelectorProps {
  selectedSegment: string | null;
  onApplyBenchmarks: (segment: string) => void;
  onClear: () => void;
}

const SEGMENT_ICONS: Record<SegmentKey, React.ReactNode> = {
  healthcare: <Heart size={14} />,
  dental: <Smile size={14} />,
  real_estate: <Building2 size={14} />,
  saas: <Monitor size={14} />,
  professional_services: <Briefcase size={14} />,
  education: <GraduationCap size={14} />,
  ecommerce: <ShoppingCart size={14} />,
  financial_services: <DollarSign size={14} />,
  legal: <Scale size={14} />,
  fitness: <Dumbbell size={14} />,
  beauty: <Sparkles size={14} />,
  automotive: <Car size={14} />,
  insurance: <Shield size={14} />,
  b2b_general: <Globe size={14} />,
  home_services: <Wrench size={14} />,
};

const SEGMENT_KEYS = Object.keys(SEGMENT_BENCHMARKS) as SegmentKey[];

export function SegmentSelector({
  selectedSegment,
  onApplyBenchmarks,
  onClear,
}: SegmentSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<SegmentKey | null>(null);

  const selectedBenchmark = selectedSegment
    ? SEGMENT_BENCHMARKS[selectedSegment as SegmentKey]
    : null;
  const previewBenchmark = hoveredSegment
    ? SEGMENT_BENCHMARKS[hoveredSegment]
    : selectedBenchmark;
  const previewKey = hoveredSegment ?? (selectedSegment as SegmentKey | null);

  return (
    <div className="mb-5 rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-text-primary">
            Benchmarks por Segmento
          </span>
          {selectedBenchmark ? (
            <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-medium">
              {SEGMENT_ICONS[selectedSegment as SegmentKey]}
              {selectedBenchmark.label}
            </span>
          ) : (
            <span className="text-xs text-text-muted">
              — Selecione seu segmento para auto-preencher
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedBenchmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-red-400 transition-colors"
              title="Limpar segmento"
            >
              <X size={12} />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border-default">
          {/* Segment grid */}
          <div className="p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 mb-4">
              {SEGMENT_KEYS.map((key) => {
                const bm = SEGMENT_BENCHMARKS[key];
                const isSelected = selectedSegment === key;
                return (
                  <button
                    key={key}
                    onMouseEnter={() => setHoveredSegment(key)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => {
                      onApplyBenchmarks(key);
                    }}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-border-default bg-bg-primary hover:border-blue-500/50 hover:bg-bg-hover text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={
                        isSelected ? "text-blue-400" : "text-text-muted"
                      }
                    >
                      {SEGMENT_ICONS[key]}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">
                      {bm.label}
                    </span>
                    {isSelected && (
                      <Check size={10} className="text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preview card */}
            {previewBenchmark && previewKey && (
              <div className="rounded-lg border border-border-default bg-bg-primary p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">
                      {SEGMENT_ICONS[previewKey]}
                    </span>
                    <span className="text-sm font-semibold text-text-primary">
                      {previewBenchmark.label}
                    </span>
                    {selectedSegment === previewKey && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">
                        Aplicado
                      </span>
                    )}
                  </div>
                  {selectedSegment !== previewKey && (
                    <button
                      onClick={() => onApplyBenchmarks(previewKey)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Check size={12} /> Aplicar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-bg-secondary rounded-lg p-2.5">
                    <p className="text-[10px] text-text-muted mb-0.5">
                      CPL Medio
                    </p>
                    <p className="text-sm font-bold text-text-primary">
                      R$ {previewBenchmark.cplAvg}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Google R${previewBenchmark.cplGoogle} / Meta R$
                      {previewBenchmark.cplMeta}
                    </p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-2.5">
                    <p className="text-[10px] text-text-muted mb-0.5">
                      Ticket Medio
                    </p>
                    <p className="text-sm font-bold text-text-primary">
                      R$ {previewBenchmark.ticketAvg.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Ciclo {previewBenchmark.salesCycleDays}d
                    </p>
                  </div>
                  <div className="bg-bg-secondary rounded-lg p-2.5 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-text-muted mb-1">
                      Taxas do Funil
                    </p>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-muted">Qualificacao</span>
                        <span className="text-text-primary font-medium">
                          {previewBenchmark.qualificationRate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-muted">Agendamento</span>
                        <span className="text-text-primary font-medium">
                          {previewBenchmark.schedulingRate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-muted">Comparecimento</span>
                        <span className="text-text-primary font-medium">
                          {previewBenchmark.attendanceRate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-muted">Conversao</span>
                        <span className="text-emerald-400 font-semibold">
                          {previewBenchmark.conversionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 px-3 py-2 bg-bg-secondary rounded-lg">
                  <p className="text-[10px] text-text-muted">
                    Funil Recomendado
                  </p>
                  <p className="text-xs text-blue-400 font-medium">
                    {previewBenchmark.bestFunnel}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
