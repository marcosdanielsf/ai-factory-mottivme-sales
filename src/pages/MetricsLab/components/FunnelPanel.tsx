import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, getPotencialConfig, getScoreBgClass } from '../helpers';
import type { LeadScoreRow, FunnelAd, FunnelStep } from '../types';
import { FunnelVisual } from './shared/FunnelVisual';
import { TrendChart } from './shared/TrendChart';

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
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
      pass ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
    }`}>
      {pass ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      <span className="font-semibold">{label}</span>
      <span className="opacity-70">{value.toFixed(1)}{suffix}</span>
    </div>
  );
};

// ─── Conversion Summary ─────────────────────────────────────────────────────

const ConversionSummary: React.FC<{ steps: FunnelStep[] }> = ({ steps }) => {
  const metrics: { label: string; value: number; color: string }[] = [];

  const impressions = steps.find(s => s.key === 'impressoes')?.value ?? 0;
  const clicks = steps.find(s => s.key === 'cliques')?.value ?? 0;
  const conversas = steps.find(s => s.key === 'conversas')?.value ?? 0;
  const leads = steps.find(s => s.key === 'ghl_leads')?.value ?? 0;
  const respondeu = steps.find(s => s.key === 'ghl_em_contato')?.value ?? 0;
  const agendou = steps.find(s => s.key === 'ghl_agendou')?.value ?? 0;
  const compareceu = steps.find(s => s.key === 'ghl_compareceu')?.value ?? 0;

  if (impressions > 0 && clicks > 0) {
    metrics.push({ label: 'CTR', value: (clicks / impressions) * 100, color: '#818cf8' });
  }
  if (clicks > 0 && conversas > 0) {
    metrics.push({ label: 'Click → Conv', value: (conversas / clicks) * 100, color: '#38bdf8' });
  }
  if (leads > 0 && respondeu > 0) {
    metrics.push({ label: 'Resposta', value: (respondeu / leads) * 100, color: '#fbbf24' });
  }
  if (respondeu > 0 && agendou > 0) {
    metrics.push({ label: 'Agendamento', value: (agendou / respondeu) * 100, color: '#34d399' });
  }
  if (agendou > 0 && compareceu > 0) {
    metrics.push({ label: 'Comparecimento', value: (compareceu / agendou) * 100, color: '#a78bfa' });
  }

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-xs">
        Dados insuficientes
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-4">
        Taxas de Conversao
      </div>
      <div className="space-y-3.5">
        {metrics.map(m => {
          const capped = Math.min(m.value, 100);
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[var(--text-secondary)]">{m.label}</span>
                <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{m.value.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${capped}%`, backgroundColor: m.color, opacity: 0.7 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Funnel Step Row ────────────────────────────────────────────────────────

const GHL_KEYS = new Set(['ghl_separator', 'ghl_leads', 'ghl_em_contato', 'ghl_agendou', 'ghl_compareceu', 'ghl_won']);
const GHL_GOOD_THRESHOLD = 25;

const StepRow: React.FC<{ step: FunnelStep; isFirst: boolean; maxValue: number; ghlMaxValue: number }> = ({
  step, isFirst, maxValue, ghlMaxValue,
}) => {
  const isGhl = GHL_KEYS.has(step.key);
  const isSeparator = step.key === 'ghl_separator';

  if (isSeparator) {
    return (
      <div className="py-3 my-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-dashed border-amber-500/20" />
          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-[0.15em] px-2">
            Funil de Vendas
          </span>
          <div className="flex-1 border-t border-dashed border-amber-500/20" />
        </div>
      </div>
    );
  }

  const effectiveMax = isGhl ? ghlMaxValue : maxValue;
  const widthPct = effectiveMax > 0 ? (step.value / effectiveMax) * 100 : 0;

  const convOk = step.conversion_rate !== null && step.conversion_rate >= (isGhl ? GHL_GOOD_THRESHOLD : 1);
  const convColor = convOk ? 'good' : (step.conversion_rate !== null ? 'bad' : 'neutral');

  return (
    <div>
      {!isFirst && (
        <div className="flex justify-center py-0.5">
          <div className={`w-px h-2 ${isGhl ? 'bg-amber-500/15' : 'bg-white/[0.06]'}`} />
        </div>
      )}
      <div className="flex items-center gap-3 py-1.5">
        {/* Label */}
        <div className="w-24 flex-shrink-0 text-right">
          <span className={`text-[12px] ${isGhl ? 'text-amber-300 font-medium' : 'text-[var(--text-secondary)]'}`}>
            {step.label}
          </span>
        </div>

        {/* Bar + value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-7 bg-white/[0.03] rounded-lg overflow-hidden">
              <div
                className={`h-full rounded-lg transition-all duration-500 ${
                  isGhl
                    ? 'bg-gradient-to-r from-amber-500/35 to-amber-500/10'
                    : 'bg-gradient-to-r from-violet-500/35 to-violet-500/10'
                }`}
                style={{ width: `${Math.max(widthPct, step.value > 0 ? 3 : 0)}%` }}
              />
            </div>
            <span className={`text-[13px] font-bold w-16 text-right flex-shrink-0 tabular-nums ${
              isGhl ? 'text-amber-200' : 'text-[var(--text-primary)]'
            }`}>
              {formatNumber(step.value)}
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className="w-24 flex-shrink-0 text-right">
          {step.cost_metric !== null && step.cost_label ? (
            <span className="text-[11px] text-[var(--text-secondary)]">
              {step.cost_label}: <span className={`font-semibold ${isGhl ? 'text-amber-200/80' : 'text-[var(--text-primary)]'}`}>
                {formatCurrency(step.cost_metric)}
              </span>
            </span>
          ) : null}
        </div>

        {/* Conv % */}
        <div className="w-14 flex-shrink-0 text-center">
          {step.conversion_rate !== null ? (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              convColor === 'good'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-white/[0.04] text-[var(--text-secondary)]'
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
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">
        Selecione um anuncio na lista
      </div>
    );
  }

  const potConfig = getPotencialConfig(scoreRow.potencial);
  const scoreBg = getScoreBgClass(scoreRow.score);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white/[0.03] rounded-2xl p-5 mb-4 relative overflow-hidden">
        {/* Accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Name + score */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">{scoreRow.ad_name}</h3>
            <p className="text-[12px] text-[var(--text-secondary)] truncate mt-1">{scoreRow.campaign_name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${potConfig.bgClass} ${potConfig.textClass}`}>
              {potConfig.label}
            </span>
            <span className={`text-base font-bold px-3 py-1 rounded-lg ${scoreBg}`}>
              {scoreRow.score}
            </span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Gasto', value: formatCurrency(scoreRow.gasto) },
            { label: 'Leads', value: formatNumber(scoreRow.leads) },
            { label: 'CPL', value: scoreRow.cpl > 0 ? formatCurrency(scoreRow.cpl) : '—' },
            { label: 'Resp%', value: `${scoreRow.resp_pct.toFixed(0)}%` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-0.5">{kpi.label}</div>
              <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* ARC pills */}
        {arcData && (arcData.hook_rate > 0 || arcData.hold_rate > 0 || arcData.body_rate > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.05]">
            <ARCPill label="Hook" value={arcData.hook_rate} benchmark={30} />
            <ARCPill label="Hold" value={arcData.hold_rate} benchmark={2.5} />
            <ARCPill label="Body" value={arcData.body_rate} benchmark={2.5} />
          </div>
        )}
      </div>

      {/* Charts */}
      {funnelAd && funnelAd.steps.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
          <div className="bg-white/[0.03] rounded-2xl p-5">
            <FunnelVisual steps={funnelAd.steps} />
          </div>
          <div className="bg-white/[0.03] rounded-2xl p-5">
            <TrendChart steps={funnelAd.steps} />
            <ConversionSummary steps={funnelAd.steps} />
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="flex-1 bg-white/[0.03] rounded-2xl p-5 overflow-y-auto">
        {/* Column headers */}
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/[0.05]">
          <div className="w-24 flex-shrink-0 text-right text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Etapa</div>
          <div className="flex-1 text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Volume</div>
          <div className="w-24 flex-shrink-0 text-right text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Custo</div>
          <div className="w-14 flex-shrink-0 text-center text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Conv%</div>
        </div>

        {/* Steps */}
        {funnelAd ? (
          funnelAd.steps.map((step, i) => (
            <StepRow key={step.key} step={step} isFirst={i === 0} maxValue={maxValue} ghlMaxValue={ghlMaxValue} />
          ))
        ) : (
          <div className="text-center text-[var(--text-secondary)] text-sm py-8">
            Sem dados de funil para este anuncio
          </div>
        )}

        {/* No GHL data notice */}
        {funnelAd && !hasGhl && (
          <div className="mt-4 pt-3 border-t border-dashed border-white/[0.06] text-center">
            <span className="text-[12px] text-[var(--text-secondary)]">
              <Minus size={12} className="inline mr-1 opacity-50" />
              Sem dados de leads GHL para este anuncio
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
