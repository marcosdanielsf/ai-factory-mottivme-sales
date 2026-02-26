import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { formatCurrency, formatNumber, getPotencialConfig, getScoreBgClass } from '../helpers';
import type { LeadScoreRow } from '../types';

type SortKey = 'score' | 'leads' | 'gasto' | 'cpl';

interface AdRankingListProps {
  rows: LeadScoreRow[];
  selectedAdId: string;
  onSelect: (adId: string) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'score', label: 'Score', icon: Target },
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'gasto', label: 'Gasto', icon: DollarSign },
  { key: 'cpl', label: 'CPL', icon: TrendingUp },
];

export const AdRankingList: React.FC<AdRankingListProps> = ({ rows, selectedAdId, onSelect }) => {
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const sorted = [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.score - a.score;
      case 'leads': return b.leads - a.leads;
      case 'gasto': return b.gasto - a.gasto;
      case 'cpl': return (a.cpl || Infinity) - (b.cpl || Infinity);
      default: return 0;
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Sort toggle bar */}
      <div className="flex items-center gap-0.5 p-1 bg-white/[0.03] rounded-xl mb-3">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 ${
              sortBy === opt.key
                ? 'bg-violet-500/15 text-violet-300 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'
            }`}
          >
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-[11px] text-[var(--text-secondary)] mb-2 px-1">
        <span className="font-semibold text-[var(--text-primary)]">{rows.length}</span> anuncios
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {sorted.map((row, i) => {
          const isSelected = row.ad_id === selectedAdId;
          const potConfig = getPotencialConfig(row.potencial);
          const scoreBg = getScoreBgClass(row.score);

          return (
            <button
              key={row.ad_id}
              onClick={() => onSelect(row.ad_id)}
              className={`group w-full text-left rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-violet-500/[0.08] ring-1 ring-violet-500/25'
                  : 'bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
              style={{
                animationDelay: `${Math.min(i * 25, 300)}ms`,
                animation: 'fadeIn 0.3s ease-out both',
              }}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Rank badge */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  i === 0 ? 'bg-amber-400/15 text-amber-300'
                  : i === 1 ? 'bg-slate-300/10 text-slate-300'
                  : i === 2 ? 'bg-orange-400/15 text-orange-300'
                  : 'bg-white/[0.04] text-[var(--text-secondary)]'
                }`}>
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Ad name + score */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate flex-1 leading-tight">
                      {row.ad_name}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${scoreBg}`}>
                      {row.score}
                    </span>
                  </div>

                  {/* Campaign */}
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mb-2">
                    {row.campaign_name}
                  </p>

                  {/* Metrics + potencial */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                      {formatNumber(row.leads)} <span className="text-[var(--text-secondary)] font-normal">leads</span>
                    </span>
                    <span className="text-white/10">|</span>
                    <span className="text-[var(--text-primary)] font-medium tabular-nums">
                      {row.cpl > 0 ? formatCurrency(row.cpl) : '—'} <span className="text-[var(--text-secondary)] font-normal">CPL</span>
                    </span>
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${potConfig.bgClass} ${potConfig.textClass}`}>
                      {potConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
