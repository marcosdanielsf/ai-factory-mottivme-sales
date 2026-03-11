import React, { useMemo, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Minus, Clock } from 'lucide-react';
import { formatCurrency, formatNumber, getPotencialConfig, getScoreBgClass } from '../helpers';
import type { LeadScoreRow, FunnelAd, FunnelStep, FunnelLead, HeatmapRow, ConversionTimeStats } from '../types';
import { FunnelVisual } from './shared/FunnelVisual';
import { TrendChart } from './shared/TrendChart';
import { HeatmapChart, type HeatmapMetric } from './shared/HeatmapChart';
import { FunnelLeadsDrawer } from './FunnelLeadsDrawer';

interface FunnelPanelProps {
  scoreRow: LeadScoreRow | null;
  funnelAd: FunnelAd | null;
  arcData?: { hook_rate: number; hold_rate: number; body_rate: number } | null;
  heatmapData?: HeatmapRow[];
  conversionTime?: ConversionTimeStats | null;
  fetchFunnelLeads?: (adId: string) => Promise<FunnelLead[]>;
  locationId?: string | null;
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
      <span className="opacity-70">{(value ?? 0).toFixed(1)}{suffix}</span>
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
                <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{(m.value ?? 0).toFixed(1)}%</span>
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

const CLICKABLE_GHL_KEYS = new Set(['ghl_leads', 'ghl_em_contato', 'ghl_agendou', 'ghl_compareceu', 'ghl_won']);

const StepRow: React.FC<{
  step: FunnelStep; isFirst: boolean; maxValue: number; ghlMaxValue: number;
  onClick?: () => void;
}> = ({
  step, isFirst, maxValue, ghlMaxValue, onClick,
}) => {
  const isGhl = GHL_KEYS.has(step.key);
  const isSeparator = step.key === 'ghl_separator';
  const isClickable = CLICKABLE_GHL_KEYS.has(step.key) && step.value > 0 && !!onClick;

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
      <div
        className={`flex items-center gap-3 py-1.5 rounded-lg px-1 -mx-1 ${
          isClickable ? 'cursor-pointer hover:bg-white/[0.04] transition-colors' : ''
        }`}
        onClick={isClickable ? onClick : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick?.(); } : undefined}
      >
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
              {(step.conversion_rate ?? 0).toFixed(1)}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Conversion Time Section ─────────────────────────────────────────────────

function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

interface ConvTimePillProps {
  label: string;
  hours: number | null;
  thresholdGood: number;
  thresholdBad: number;
}

const ConvTimePill: React.FC<ConvTimePillProps> = ({ label, hours, thresholdGood, thresholdBad }) => {
  const color =
    hours === null
      ? 'bg-white/[0.04] text-[var(--text-secondary)]'
      : hours <= thresholdGood
      ? 'bg-emerald-500/10 text-emerald-300'
      : hours <= thresholdBad
      ? 'bg-amber-500/10 text-amber-300'
      : 'bg-rose-500/10 text-rose-300';

  return (
    <div className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl ${color}`}>
      <Clock size={12} className="opacity-60" />
      <span className="text-[11px] font-semibold tabular-nums">{formatHours(hours)}</span>
      <span className="text-[10px] opacity-70 whitespace-nowrap">{label}</span>
    </div>
  );
};

const ConversionTimeSection: React.FC<{ data: ConversionTimeStats }> = ({ data }) => (
  <div className="bg-white/[0.03] rounded-2xl p-4 mb-4">
    <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-3">
      Tempo de Conversao
    </div>
    <div className="flex items-stretch gap-2">
      <ConvTimePill
        label="Contato"
        hours={data.avg_hours_to_contact}
        thresholdGood={4}
        thresholdBad={24}
      />
      <ConvTimePill
        label="Agendamento"
        hours={data.avg_hours_to_schedule}
        thresholdGood={48}
        thresholdBad={120}
      />
      <ConvTimePill
        label="Fechamento"
        hours={data.avg_hours_to_won}
        thresholdGood={168}
        thresholdBad={336}
      />
      {(data.conversion_rate_schedule !== null || data.conversion_rate_won !== null) && (
        <div className="flex-1 flex flex-col justify-center gap-1.5 pl-3 border-l border-white/[0.06]">
          {data.conversion_rate_schedule !== null && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Taxa agendamento</span>
              <span className="text-[12px] font-bold text-[var(--text-primary)] tabular-nums">
                {(data.conversion_rate_schedule ?? 0).toFixed(1)}%
              </span>
            </div>
          )}
          {data.conversion_rate_won !== null && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Taxa fechamento</span>
              <span className="text-[12px] font-bold text-[var(--text-primary)] tabular-nums">
                {(data.conversion_rate_won ?? 0).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

// ─── Main Panel ─────────────────────────────────────────────────────────────

export const FunnelPanel: React.FC<FunnelPanelProps> = ({ scoreRow, funnelAd, arcData, heatmapData = [], conversionTime, fetchFunnelLeads, locationId }) => {
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('leads');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStepKey, setDrawerStepKey] = useState('');
  const [drawerLeads, setDrawerLeads] = useState<FunnelLead[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const fetchVersionRef = useRef(0);

  const handleStepClick = useCallback(async (stepKey: string) => {
    if (!funnelAd || !fetchFunnelLeads) return;
    const version = ++fetchVersionRef.current;
    setDrawerStepKey(stepKey);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerLeads([]);
    try {
      const leads = await fetchFunnelLeads(funnelAd.ad_id);
      if (fetchVersionRef.current !== version) return;
      setDrawerLeads(leads);
    } catch (err) {
      if (fetchVersionRef.current !== version) return;
      console.warn('[FunnelPanel] Erro ao buscar leads:', err);
    } finally {
      if (fetchVersionRef.current === version) {
        setDrawerLoading(false);
      }
    }
  }, [funnelAd, fetchFunnelLeads]);

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
        {(() => {
          const kpis = [
            { label: 'Gasto', value: formatCurrency(scoreRow.gasto) },
            { label: 'Leads', value: formatNumber(scoreRow.leads) },
            { label: 'CPL', value: scoreRow.cpl > 0 ? formatCurrency(scoreRow.cpl) : '—' },
            { label: 'Resp%', value: `${(scoreRow.resp_pct ?? 0).toFixed(0)}%` },
          ];
          const wonValue = (funnelAd as { won_value?: number } | null)?.won_value ?? 0;
          if (funnelAd && wonValue > 0) {
            const roas = scoreRow.gasto > 0 ? (wonValue / scoreRow.gasto).toFixed(1) + 'x' : '—';
            kpis.push({ label: 'ROAS', value: roas });
            kpis.push({ label: 'Receita', value: formatCurrency(wonValue) });
          }
          const gridCols = kpis.length > 4 ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-4';
          return (
            <div className={`grid ${gridCols} gap-3`}>
              {kpis.map(kpi => (
                <div key={kpi.label} className="bg-white/[0.03] rounded-xl px-3 py-2.5 text-center">
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-0.5">{kpi.label}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{kpi.value}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ARC pills */}
        {arcData && (arcData.hook_rate > 0 || arcData.hold_rate > 0 || arcData.body_rate > 0) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.05]">
            <ARCPill label="Hook" value={arcData.hook_rate} benchmark={30} />
            <ARCPill label="Hold" value={arcData.hold_rate} benchmark={2.5} />
            <ARCPill label="Body" value={arcData.body_rate} benchmark={2.5} />
          </div>
        )}

        {/* Badge de confianca — atribuicao inferida */}
        {funnelAd && funnelAd.attribution_level === 'unattributed_inferred' ? (
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.05]">
            <span className="text-[11px] text-orange-300/80 bg-orange-500/10 px-2 py-0.5 rounded-md font-medium">
              Paid (nao rastreado)
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              leads via agente IA sem UTM — atribuicao inferida
            </span>
          </div>
        ) : funnelAd && funnelAd.inferred_leads && funnelAd.inferred_leads > 0 ? (
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.05]">
            <span className="text-[11px] text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
              ~{funnelAd.inferred_leads} leads atribuidos por campanha
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              (inferido — sem UTM de anuncio)
            </span>
          </div>
        ) : null}
      </div>

      {/* Conversion Time */}
      {conversionTime && <ConversionTimeSection data={conversionTime} />}

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
            <StepRow
              key={step.key}
              step={step}
              isFirst={i === 0}
              maxValue={maxValue}
              ghlMaxValue={ghlMaxValue}
              onClick={fetchFunnelLeads ? () => handleStepClick(step.key) : undefined}
            />
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

      {/* Heatmap de Horarios */}
      {heatmapData.length > 0 && (
        <div className="bg-white/[0.03] rounded-2xl p-5 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-violet-400 opacity-70" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Horarios de Pico
              </span>
            </div>
            {/* Metric toggle */}
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
              {(['leads', 'agendamentos', 'conversao'] as HeatmapMetric[]).map((m) => {
                const labels: Record<HeatmapMetric, string> = {
                  leads: 'Leads',
                  agendamentos: 'Agendou',
                  conversao: 'Conv%',
                };
                return (
                  <button
                    key={m}
                    onClick={() => setHeatmapMetric(m)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-150 ${
                      heatmapMetric === m
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          <div className="overflow-x-auto">
            <HeatmapChart data={heatmapData} metric={heatmapMetric} />
          </div>
        </div>
      )}

      {/* Drawer de leads do step */}
      <FunnelLeadsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        stepKey={drawerStepKey}
        adName={scoreRow?.ad_name ?? ''}
        leads={drawerLeads}
        loading={drawerLoading}
        locationId={locationId ?? null}
      />
    </div>
  );
};
