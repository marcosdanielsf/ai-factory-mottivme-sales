import React, { useState } from 'react';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';
import { DateRangePicker } from '../../components/DateRangePicker';
import type { DateRange } from '../../components/DateRangePicker';
import { useAdsPerformance } from '../../hooks/useAdsPerformance';
import { useAccount } from '../../contexts/AccountContext';
import { OverviewTab } from './components/tabs/OverviewTab';
import { CriativosTab } from './components/tabs/CriativosTab';
import { CampanhasTab } from './components/tabs/CampanhasTab';

type TabKey = 'overview' | 'criativos' | 'campanhas';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { key: 'criativos', label: 'Criativos', icon: TrendingUp },
  { key: 'campanhas', label: 'Campanhas', icon: Layers },
];

export const AdsPerformance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d; })(),
    endDate: (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })(),
  });

  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id || null;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Ads Performance</h1>
          <p className="text-sm text-text-muted mt-1">
            Metricas de Facebook Ads por campanha, criativo e UTM
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refetch} className="text-xs px-2 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary border border-border-default rounded-lg p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeTab === key
                ? 'bg-accent-primary/10 text-accent-primary font-medium'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab overview={overview} porDia={porDia} campanhas={campanhas} loading={loading} />
      )}
      {activeTab === 'criativos' && (
        <CriativosTab criativos={criativos} adsWithLeads={adsWithLeads} loading={loading} />
      )}
      {activeTab === 'campanhas' && (
        <CampanhasTab campanhas={campanhas} loading={loading} />
      )}
    </div>
  );
};

export default AdsPerformance;
