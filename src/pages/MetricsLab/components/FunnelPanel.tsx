import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, getPotencialConfig, getScoreBgClass } from '../helpers';
import type { LeadScoreRow, FunnelAd, FunnelStep } from '../types';

interface FunnelPanelProps {
  scoreRow: LeadScoreRow | null;
  funnelAd: FunnelAd | null;
  arcData?: { hook_rate: number; hold_rate: number; body_rate: number } | null;
}

// ─── ARC Pills ──────────────────────────────────────────────────────────────

const ARCPill: React.FC<{ label: string; value: number; benchmark: number; suffix?: string }> = ({
  label, value, benchmark, suffix = '%',
}) => {
  const pass = value >= benchmark;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium ${
      pass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {pass ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      <span>{label}: {value.toFixed(1)}{suffix}</span>
    </div>
  );
};

// ─── Funnel Step Row ────────────────────────────────────────────────────────

const GHL_KEYS = new Set(['ghl_separator', 'ghl_leads', 'ghl_em_contato', 'ghl_agendou', 'ghl_compareceu', 'ghl_won']);
const GHL_GOOD_THRESHOLD = 25; // 25%+ conversion between GHL steps is good

const StepRow: React.FC<{ step: FunnelStep; isFirst: boolean; maxValue: number; ghlMaxValue: number }> = ({
  step, isFirst, maxValue, ghlMaxValue,
}) => {
  const isGhl = GHL_KEYS.has(step.key);
  const isSeparator = step.key === 'ghl_separator';

  if (isSeparator) {
    return (
      <div className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
          <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest px-2">
            Funil de Vendas
          </span>
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
        </div>
      </div>
    );
  }

  const effectiveMax = isGhl ? ghlMaxValue : maxValue;
  const widthPct = effectiveMax > 0 ? (step.value / effectiveMax) * 100 : 0;

  // Color logic: for GHL steps, any conv > 25% is good. For FB, > 1% CTR is fine
  const convOk = step.conversion_rate !== null && step.conversion_rate >= (isGhl ? GHL_GOOD_THRESHOLD : 1);
  const convColor = convOk ? 'good' : (step.conversion_rate !== null ? 'bad' : 'neutral');

  const barColor = isGhl
    ? 'bg-amber-500/30 border-r-2 border-amber-500'
    : 'bg-[var(--accent-primary)]/30 border-r-2 border-[var(--accent-primary)]';

  return (
    <div>
      {!isFirst && (
        <div className="flex justify-center py-0.5">
          <div className={`w-px h-2 ${isGhl ? 'bg-amber-500/20' : 'bg-[var(--border-default)]'}`} />
        </div>
      )}
      <div className="flex items-center gap-2 py-1.5">
        {/* Label */}
        <div className="w-24 flex-shrink-0 text-right">
          <span className={`text-[11px] ${isGhl ? 'text-amber-300/80 font-medium' : 'text-[var(--text-secondary)]'}`}>
            {step.label}
          </span>
        </div>

        {/* Bar + value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-6 bg-[var(--bg-hover)] rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(widthPct, step.value > 0 ? 3 : 0)}%` }}
              />
            </div>
            <span className={`text-sm font-bold w-16 text-right flex-shrink-0 ${isGhl ? 'text-amber-300' : 'text-[var(--text-primary)]'}`}>
              {formatNumber(step.value)}
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className="w-24 flex-shrink-0 text-right">
          {step.cost_metric !== null && step.cost_label ? (
            <span className="text-[10px] text-[var(--text-muted)]">
              {step.cost_label}: <span className={`font-medium ${isGhl ? 'text-amber-300/70' : 'text-[var(--text-secondary)]'}`}>
                {formatCurrency(step.cost_metric)}
              </span>
            </span>
          ) : null}
        </div>

        {/* Conv % */}
        <div className="w-14 flex-shrink-0 text-center">
          {step.conversion_rate !== null ? (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              convColor === 'good' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--text-muted)]'
            }`}>
              {step.conversion_rate.toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Main Panel ─────────────────────────────────────────────────────────────

export const FunnelPanel: React.FC<FunnelPanelProps> = ({ scoreRow, funnelAd, arcData }) => {
  const maxValue = funnelAd ? (funnelAd.steps[0]?.value ?? 1) : 1;
  const ghlMaxValue = useMemo(() => {
    if (!funnelAd) return 1;
    return funnelAd.steps.find(s => s.key === 'ghl_leads')?.value ?? 1;
  }, [funnelAd]);

  const hasGhl = funnelAd?.steps.some(s => s.key === 'ghl_leads' && s.value > 0);

  if (!scoreRow) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm">
        Selecione um anuncio
      </div>
    );
  }

  const potConfig = getPotencialConfig(scoreRow.potencial);
  const scoreBg = getScoreBgClass(scoreRow.score);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-4 mb-3">
        {/* Name + score */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{scoreRow.ad_name}</h3>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{scoreRow.campaign_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${potConfig.bgClass} ${potConfig.textClass}`}>
              {potConfig.label}
            </span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded border ${scoreBg}`}>
              {scoreRow.score}
            </span>
          </div>
        </div>

        {/* KPI row */}
        <div className="flex flex-wrap gap-4 text-[11px]">
          <div className="text-center">
            <div className="text-[var(--text-muted)]">Gasto</div>
            <div className="font-bold text-[var(--text-primary)]">{formatCurrency(scoreRow.gasto)}</div>
          </div>
          <div className="text-center">
            <div className="text-[var(--text-muted)]">Leads</div>
            <div className="font-bold text-[var(--text-primary)]">{formatNumber(scoreRow.leads)}</div>
          </div>
          <div className="text-center">
            <div className="text-[var(--text-muted)]">CPL</div>
            <div className="font-bold text-[var(--text-primary)]">{scoreRow.cpl > 0 ? formatCurrency(scoreRow.cpl) : '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-[var(--text-muted)]">Resp%</div>
            <div className="font-bold text-[var(--text-primary)]">{scoreRow.resp_pct.toFixed(0)}%</div>
          </div>
        </div>

        {/* ARC pills */}
        {arcData && (arcData.hook_rate > 0 || arcData.hold_rate > 0 || arcData.body_rate > 0) && (
          <div className="flex flex-wrap gap-2 mt-2.5 pt-2.5 border-t border-[var(--border-default)]">
            <ARCPill label="Hook" value={arcData.hook_rate} benchmark={30} />
            <ARCPill label="Hold" value={arcData.hold_rate} benchmark={2.5} />
            <ARCPill label="Body" value={arcData.body_rate} benchmark={2.5} />
          </div>
        )}
      </div>

      {/* Funnel */}
      <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl p-4 overflow-y-auto">
        {/* Column headers */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-default)]">
          <div className="w-24 flex-shrink-0 text-right text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Etapa</div>
          <div className="flex-1 text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Volume</div>
          <div className="w-24 flex-shrink-0 text-right text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Custo</div>
          <div className="w-14 flex-shrink-0 text-center text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Conv%</div>
        </div>

        {/* Steps */}
        {funnelAd ? (
          funnelAd.steps.map((step, i) => (
            <StepRow key={step.key} step={step} isFirst={i === 0} maxValue={maxValue} ghlMaxValue={ghlMaxValue} />
          ))
        ) : (
          <div className="text-center text-[var(--text-muted)] text-sm py-8">
            Sem dados de funil para este anuncio
          </div>
        )}

        {/* No GHL data notice */}
        {funnelAd && !hasGhl && (
          <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-default)] text-center">
            <span className="text-[11px] text-[var(--text-muted)]">
              <Minus size={12} className="inline mr-1" />
              Sem dados de leads GHL para este anuncio
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
