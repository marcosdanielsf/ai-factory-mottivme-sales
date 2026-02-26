import React, { useState, useMemo } from 'react';
import { ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { ARCRadarChart } from '../shared/ARCRadarChart';
import { ARCHorizontalBars } from '../shared/ARCHorizontalBars';
import { SearchableSelect } from '../shared/SearchableSelect';
import { formatCurrency } from '../../helpers';
import type { CriativoARC } from '../../types';

interface CriativosARCTabProps {
  criativos: CriativoARC[];
  loading: boolean;
}

export const CriativosARCTab: React.FC<CriativosARCTabProps> = ({ criativos, loading }) => {
  const [filterCampaign, setFilterCampaign] = useState('');

  const campaigns = useMemo(() => [...new Set(criativos.map(c => c.campaign_name))], [criativos]);

  const filtered = useMemo(() => {
    if (!filterCampaign) return criativos;
    return criativos.filter(c => c.campaign_name === filterCampaign);
  }, [criativos, filterCampaign]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        <SearchableSelect
          value={filterCampaign}
          onChange={setFilterCampaign}
          options={campaigns}
          placeholder="Campanhas"
          allLabel="Todas Campanhas"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-8 text-center text-text-muted text-sm">
          Nenhum criativo encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(criativo => (
            <div
              key={criativo.ad_id}
              className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate" title={criativo.ad_name}>
                    {criativo.ad_name}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 truncate">{criativo.campaign_name}</p>
                </div>
                {criativo.ad_url && (
                  <a
                    href={criativo.ad_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] text-accent-primary hover:opacity-80 transition-opacity border border-accent-primary/30 rounded px-1.5 py-0.5"
                  >
                    <ExternalLink size={10} />
                    Ver anuncio
                  </a>
                )}
              </div>

              {/* Radar + Bars */}
              <div className="px-4">
                <ARCRadarChart
                  hookRate={criativo.hook_rate}
                  holdRate={criativo.hold_rate}
                  bodyRate={criativo.body_rate}
                />
                <ARCHorizontalBars criativo={criativo} />
              </div>

              {/* Benchmark pills footer */}
              <div className="px-4 py-3 mt-2 border-t border-border-default flex flex-wrap gap-2">
                <BenchmarkPill label="Atencao" met={criativo.benchmark_atencao} />
                <BenchmarkPill label="Retencao" met={criativo.benchmark_retencao} />
                <BenchmarkPill label="Conversao" met={criativo.benchmark_conversao} />
                <div className="ml-auto flex items-center gap-3 text-[10px] text-text-muted">
                  <span>Gasto: <span className="text-text-primary font-medium">{formatCurrency(criativo.gasto)}</span></span>
                  <span>ROAS: <span className="text-emerald-400 font-medium">{criativo.roas.toFixed(1)}x</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BenchmarkPill: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
    met
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'bg-red-500/10 text-red-400 border border-red-500/20'
  }`}>
    {met
      ? <CheckCircle size={10} />
      : <XCircle size={10} />
    }
    {label}
  </span>
);
