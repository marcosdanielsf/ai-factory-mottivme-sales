import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, Filter, RefreshCw } from 'lucide-react';
import { DateRangePicker } from '../../components/DateRangePicker';
import type { DateRange } from '../../components/DateRangePicker';
import { useAdsPerformance } from '../../hooks/useAdsPerformance';
import { OverviewTab } from './components/tabs/OverviewTab';
import { AdsTables } from './components/AdsTables';
import { FunnelTab } from './components/tabs/FunnelTab';

export const AdsPerformance: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const {
    overview,
    periodDeltas,
    campanhas,
    adsets,
    anuncios,
    accounts,
    porDia,
    funnelData,
    anomalies,
    loading,
    error,
    refetch,
  } = useAdsPerformance(selectedAccount, dateRange);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    return `${dateRange.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${dateRange.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [dateRange]);

  return (
    <div className="bg-bg-primary">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3 size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Ads Performance</h1>
                <p className="text-xs text-text-muted">{dateRangeLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {accounts.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedAccount ?? ''}
                    onChange={(e) => setSelectedAccount(e.target.value || null)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl bg-white/[0.05] text-text-primary border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="">Todas as contas</option>
                    {accounts.map((acc) => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
              )}
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="text-xs px-2 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Content: KPIs + Charts + Tables (single page) */}
      <div className="p-4 md:p-6 space-y-6">
        <OverviewTab
          overview={overview}
          porDia={porDia}
          periodDeltas={periodDeltas}
          loading={loading}
          dateRangeLabel={dateRangeLabel}
        />

        <AdsTables
          campanhas={campanhas}
          adsets={adsets}
          anuncios={anuncios}
          loading={loading}
        />

        {/* Funil de Conversao */}
        <FunnelTab funnelData={funnelData} anomalies={anomalies} loading={loading} />
      </div>
    </div>
  );
};

export default AdsPerformance;
