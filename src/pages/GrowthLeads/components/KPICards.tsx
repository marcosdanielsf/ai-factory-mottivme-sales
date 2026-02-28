import React from 'react';
import { Users, Mail, MessageCircle, Globe, TrendingUp, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { formatNumber, formatPct } from '../helpers';
import type { GrowthLeadsKPIs } from '../types';

interface KPICardsProps {
  kpis: GrowthLeadsKPIs;
  loading: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-[100px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        title="Total Leads"
        value={formatNumber(kpis.total)}
        icon={Users}
        subtext="Leads scrapeados"
      />
      <MetricCard
        title="Com Email"
        value={formatNumber(kpis.withEmail)}
        icon={Mail}
        subtext={kpis.total > 0 ? formatPct((kpis.withEmail / kpis.total) * 100) : '0%'}
      />
      <MetricCard
        title="Com WhatsApp"
        value={formatNumber(kpis.withWhatsapp)}
        icon={MessageCircle}
        subtext={kpis.total > 0 ? formatPct((kpis.withWhatsapp / kpis.total) * 100) : '0%'}
      />
      <MetricCard
        title="Com Website"
        value={formatNumber(kpis.withWebsite)}
        icon={Globe}
        subtext={kpis.total > 0 ? formatPct((kpis.withWebsite / kpis.total) * 100) : '0%'}
      />
      <MetricCard
        title="Taxa Enrichment"
        value={formatPct(kpis.enrichmentRate)}
        icon={TrendingUp}
        subtext="Com algum contato"
      />
      <MetricCard
        title="Sem Contato"
        value={formatNumber(kpis.noContact)}
        icon={AlertCircle}
        subtext="Sem email/WA/IG/site"
      />
    </div>
  );
};
