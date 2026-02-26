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
      case 'cpl': return (a.cpl || Infinity) - (b.cpl || Infinity); // lower CPL is better
      default: return 0;
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Sort buttons */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              sortBy === opt.key
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
        <span className="text-[10px] text-[var(--text-muted)] ml-auto">{rows.length} anuncios</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {sorted.map((row, i) => {
          const isSelected = row.ad_id === selectedAdId;
          const potConfig = getPotencialConfig(row.potencial);
          const scoreBg = getScoreBgClass(row.score);

          return (
            <button
              key={row.ad_id}
              onClick={() => onSelect(row.ad_id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/20'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Rank number */}
                <span className={`text-[11px] font-bold mt-0.5 w-5 text-center flex-shrink-0 ${
                  i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[var(--text-muted)]'
                }`}>
                  #{i + 1}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Ad name + score */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate flex-1">
                      {row.ad_name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${scoreBg}`}>
                      {row.score}
                    </span>
                  </div>

                  {/* Campaign */}
                  <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {row.campaign_name}
                  </p>

                  {/* Metrics row */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      <span className="text-[var(--text-muted)]">Leads:</span> <span className="font-semibold">{formatNumber(row.leads)}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      <span className="text-[var(--text-muted)]">CPL:</span> <span className="font-semibold">{row.cpl > 0 ? formatCurrency(row.cpl) : '—'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      <span className="text-[var(--text-muted)]">Gasto:</span> <span className="font-semibold">{formatCurrency(row.gasto)}</span>
                    </span>
                  </div>

                  {/* Potencial bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${potConfig.dotClass}`}
                        style={{ width: `${Math.min(row.score, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-semibold ${potConfig.textClass}`}>
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
