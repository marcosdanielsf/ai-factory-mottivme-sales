import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { SparklineCell } from '../shared/SparklineCell';
import { SearchableSelect } from '../shared/SearchableSelect';
import { formatCurrency, formatNumber, formatPct } from '../../helpers';
import type { FunnelAd, FunnelStep } from '../../types';

interface FunilPorAnuncioTabProps {
  funnelAds: FunnelAd[];
  loading: boolean;
}

const CONVERSION_THRESHOLD = 50;
const NO_SHOW_THRESHOLD = 30;

const GHL_KEYS = new Set(['ghl_separator', 'ghl_leads', 'ghl_em_contato', 'ghl_agendou', 'ghl_no_show', 'ghl_won']);

const FunnelStepRow: React.FC<{ step: FunnelStep; isFirst: boolean; maxValue: number; ghlMaxValue: number }> = ({
  step,
  isFirst,
  maxValue,
  ghlMaxValue,
}) => {
  const isGhl = GHL_KEYS.has(step.key);
  const isSeparator = step.key === 'ghl_separator';

  // Separator row
  if (isSeparator) {
    return (
      <div className="relative py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
          <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest px-2">
            Funil GHL (Leads Reais)
          </span>
          <div className="flex-1 border-t border-dashed border-amber-500/30" />
        </div>
      </div>
    );
  }

  const effectiveMax = isGhl ? ghlMaxValue : maxValue;
  const widthPct = effectiveMax > 0 ? (step.value / effectiveMax) * 100 : 0;
  const convOk = step.conversion_rate !== null && step.conversion_rate >= CONVERSION_THRESHOLD;

  // For no-show, invert: lower is better
  const isNoShow = step.key === 'ghl_no_show';
  const convColor = isNoShow
    ? (step.conversion_rate !== null && step.conversion_rate <= NO_SHOW_THRESHOLD ? 'good' : 'bad')
    : (convOk ? 'good' : 'bad');

  const barColor = isGhl ? 'bg-amber-500/30 border-r-2 border-amber-500' : 'bg-accent-primary/30 border-r-2 border-accent-primary';

  return (
    <div className="relative">
      {/* Connector line above (except first) */}
      {!isFirst && (
        <div className="flex justify-center py-0.5">
          <div className={`w-px h-3 ${isGhl ? 'bg-amber-500/20' : 'bg-border-default'}`} />
        </div>
      )}

      <div className="relative flex items-center gap-3 py-2">
        {/* Label */}
        <div className="w-36 flex-shrink-0 text-right">
          <span className={`text-xs ${isGhl ? 'text-amber-300/80 font-medium' : 'text-text-secondary'}`}>{step.label}</span>
        </div>

        {/* Bar + value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Bar */}
            <div className="flex-1 h-6 bg-bg-hover rounded-md overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(widthPct, step.value > 0 ? 2 : 0)}%` }}
              />
            </div>

            {/* Value */}
            <span className={`text-sm font-bold w-20 text-right flex-shrink-0 ${isGhl ? 'text-amber-300' : 'text-text-primary'}`}>
              {formatNumber(step.value)}
            </span>
          </div>
        </div>

        {/* Cost metric */}
        <div className="w-28 flex-shrink-0 text-right">
          {step.cost_metric !== null && step.cost_label ? (
            <span className="text-xs text-text-muted">
              {step.cost_label}: <span className={`font-medium ${isGhl ? 'text-amber-300/70' : 'text-text-secondary'}`}>{formatCurrency(step.cost_metric)}</span>
            </span>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </div>

        {/* Conversion badge */}
        <div className="w-16 flex-shrink-0 text-center">
          {step.conversion_rate !== null ? (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              convColor === 'good'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {formatPct(step.conversion_rate)}
            </span>
          ) : null}
        </div>

        {/* Sparkline trend */}
        <div className="w-16 flex-shrink-0 flex justify-center">
          {step.trend.length > 0 ? (
            <SparklineCell
              data={step.trend}
              color={convColor === 'good' ? '#34d399' : '#f87171'}
            />
          ) : isGhl ? (
            <span className="text-[9px] text-text-muted">—</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const FunilPorAnuncioTab: React.FC<FunilPorAnuncioTabProps> = ({ funnelAds, loading }) => {
  const [selectedAdId, setSelectedAdId] = useState<string>(funnelAds[0]?.ad_id ?? '');

  // Build label options and id<->label maps for SearchableSelect
  const adOptions = useMemo(
    () => funnelAds.map(ad => `${ad.ad_name} — ${ad.campaign_name}`),
    [funnelAds],
  );

  const selectedLabel = useMemo(() => {
    const ad = funnelAds.find(a => a.ad_id === selectedAdId);
    return ad ? `${ad.ad_name} — ${ad.campaign_name}` : (adOptions[0] ?? '');
  }, [funnelAds, selectedAdId, adOptions]);

  const handleAdChange = (label: string) => {
    const ad = funnelAds.find(a => `${a.ad_name} — ${a.campaign_name}` === label);
    if (ad) setSelectedAdId(ad.ad_id);
  };

  const selectedAd = funnelAds.find(a => a.ad_id === selectedAdId) ?? funnelAds[0] ?? null;
  const maxValue = selectedAd ? (selectedAd.steps[0]?.value ?? 1) : 1;
  // GHL steps use their own scale (first GHL data step = ghl_leads)
  const ghlMaxValue = useMemo(() => {
    if (!selectedAd) return 1;
    const ghlLeads = selectedAd.steps.find(s => s.key === 'ghl_leads');
    return ghlLeads?.value ?? 1;
  }, [selectedAd]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (funnelAds.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-8 text-center text-text-muted text-sm">
        Nenhum anuncio disponivel
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ad selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Anuncio:</label>
        <SearchableSelect
          value={selectedLabel}
          onChange={handleAdChange}
          options={adOptions}
          placeholder="Anuncios"
          allLabel={adOptions[0] ?? 'Selecionar'}
        />
      </div>

      {selectedAd && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
          {/* Legend row */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border-default">
            <div className="w-36 flex-shrink-0 text-right text-[10px] text-text-muted font-medium uppercase tracking-wider">Etapa</div>
            <div className="flex-1 text-[10px] text-text-muted font-medium uppercase tracking-wider">Volume</div>
            <div className="w-28 flex-shrink-0 text-right text-[10px] text-text-muted font-medium uppercase tracking-wider">Custo</div>
            <div className="w-16 flex-shrink-0 text-center text-[10px] text-text-muted font-medium uppercase tracking-wider">Conv.%</div>
            <div className="w-16 flex-shrink-0 text-center text-[10px] text-text-muted font-medium uppercase tracking-wider">Trend</div>
          </div>

          {/* Steps */}
          <div>
            {selectedAd.steps.map((step, i) => (
              <FunnelStepRow
                key={step.key}
                step={step}
                isFirst={i === 0}
                maxValue={maxValue}
                ghlMaxValue={ghlMaxValue}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
