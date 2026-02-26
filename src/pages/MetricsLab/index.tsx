import React, { useState, useEffect, useMemo } from 'react';
import { FlaskConical, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { AdRankingList } from './components/AdRankingList';
import { FunnelPanel } from './components/FunnelPanel';
import { useMetricsLab } from '../../hooks/useMetricsLab';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';

export const MetricsLab: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const { leadScoreRows, criativosARC, funnelAds, loading, error, accounts, unattributedCount } =
    useMetricsLab(selectedAccount, dateRange);

  // Auto-select first ad when data loads
  useEffect(() => {
    if (leadScoreRows.length > 0 && !selectedAdId) {
      setSelectedAdId(leadScoreRows[0].ad_id);
    }
  }, [leadScoreRows, selectedAdId]);

  // Reset selection when account changes
  useEffect(() => {
    setSelectedAdId('');
  }, [selectedAccount]);

  // Find selected data
  const selectedScore = useMemo(
    () => leadScoreRows.find(r => r.ad_id === selectedAdId) ?? null,
    [leadScoreRows, selectedAdId],
  );

  const selectedFunnel = useMemo(
    () => funnelAds.find(f => f.ad_id === selectedAdId) ?? null,
    [funnelAds, selectedAdId],
  );

  const selectedARC = useMemo(() => {
    const arc = criativosARC.find(c => c.ad_id === selectedAdId);
    return arc ? { hook_rate: arc.hook_rate, hold_rate: arc.hold_rate, body_rate: arc.body_rate } : null;
  }, [criativosARC, selectedAdId]);

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-lg">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)]">Metrics Lab</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-[var(--text-secondary)]">Ranking de anuncios + funil completo</p>
                  {unattributedCount > 0 && (
                    <span className="text-[11px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
                      {unattributedCount.toLocaleString('pt-BR')} leads sem UTM
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {accounts.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedAccount ?? ''}
                    onChange={(e) => setSelectedAccount(e.target.value || null)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl bg-white/[0.05] text-[var(--text-primary)] border-0 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
                  >
                    <option value="">Todas as contas</option>
                    {accounts.map((acc) => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Subtle bottom gradient instead of border */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Error banner */}
        {error && (
          <div className="mx-4 md:mx-6 my-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-300 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>Erro ao carregar dados reais — exibindo dados de exemplo. ({error})</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--text-secondary)] text-sm">
          <Loader2 size={16} className="animate-spin text-violet-400" />
          <span>Carregando dados...</span>
        </div>
      )}

      {/* Two-zone layout */}
      {!loading && (
        <div className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
            {/* Left: Ranking */}
            <div className="lg:col-span-4 xl:col-span-4">
              <AdRankingList
                rows={leadScoreRows}
                selectedAdId={selectedAdId}
                onSelect={setSelectedAdId}
              />
            </div>

            {/* Right: Funnel */}
            <div className="lg:col-span-8 xl:col-span-8">
              <FunnelPanel
                scoreRow={selectedScore}
                funnelAd={selectedFunnel}
                arcData={selectedARC}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsLab;
