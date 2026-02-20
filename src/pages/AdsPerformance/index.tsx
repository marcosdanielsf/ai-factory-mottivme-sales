import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Layers, RefreshCw } from 'lucide-react';
import { DateRangePicker } from '../../components/DateRangePicker';
import type { DateRange } from '../../components/DateRangePicker';
import { useAdsPerformance } from '../../hooks/useAdsPerformance';
import { useAccount } from '../../contexts/AccountContext';
import { OverviewTab } from './components/tabs/OverviewTab';
import { CriativosTab } from './components/tabs/CriativosTab';
import { CampanhasTab } from './components/tabs/CampanhasTab';

type TabKey = 'overview' | 'criativos' | 'campanhas';

const TABS: { id: TabKey; label: string; icon: React.FC<{ className?: string; size?: number }> }[] = [
  { id: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { id: 'criativos', label: 'Criativos', icon: TrendingUp },
  { id: 'campanhas', label: 'Campanhas', icon: Layers },
];

export const AdsPerformance: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const { selectedAccount } = useAccount();
  const locationId = useMemo(() => selectedAccount?.location_id ?? null, [selectedAccount]);

  const {
    overview,
    campanhas,
    criativos,
    porDia,
    adsWithLeads,
    loading,
    error,
    refetch,
  } = useAdsPerformance(dateRange, locationId);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    return `${dateRange.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${dateRange.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [dateRange]);

  return (
    <div className="bg-bg-primary">
      {/* Sticky Header + Tabs */}
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

        {/* Tab Bar */}
        <div className="px-4 md:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
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

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {tab === 'overview' && (
          <OverviewTab overview={overview} porDia={porDia} campanhas={campanhas} loading={loading} dateRangeLabel={dateRangeLabel} />
        )}
        {tab === 'criativos' && (
          <CriativosTab criativos={criativos} adsWithLeads={adsWithLeads} loading={loading} />
        )}
        {tab === 'campanhas' && (
          <CampanhasTab campanhas={campanhas} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default AdsPerformance;
