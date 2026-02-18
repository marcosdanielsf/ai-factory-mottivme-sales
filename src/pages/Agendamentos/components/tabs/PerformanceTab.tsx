import React from 'react';
import { MessageCircle, UserX, AlertCircle } from 'lucide-react';
import { MetricCard } from '../../../../components/MetricCard';
import { CriativoMetricsTable } from '../../../../components/charts/CriativoPerformanceChart';
import { LeadsUtmTable } from '../LeadsUtmTable';
import type { MetricType } from '../../types';

interface PerformanceTabProps {
  stats: {
    totalNoShow: number;
    taxaNoShow: number;
    totalBooked: number;
    totalPendingFeedback: number;
  };
  criativoTotals: {
    totalLeads: number;
    totalResponderam: number;
  };
  criativos: any[];
  criativoLeads: any[];
  loadingCriativos: boolean;
  locationId: string | null;
  onCardClick: (metric: MetricType) => void;
  onCriativoClick: (criativo: string) => void;
}

export function PerformanceTab({
  stats,
  criativoTotals,
  criativos,
  criativoLeads,
  loadingCriativos,
  locationId,
  onCardClick,
  onCriativoClick,
}: PerformanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          title="Responderam"
          value={criativoTotals.totalResponderam}
          icon={MessageCircle}
          subtext={`${criativoTotals.totalLeads > 0 ? Math.round((criativoTotals.totalResponderam / criativoTotals.totalLeads) * 100) : 0}% dos leads`}
          clickable
        />
        <MetricCard
          title="No-Show"
          value={stats.totalNoShow}
          icon={UserX}
          subtext={`${stats.taxaNoShow}% dos resolvidos`}
          onClick={() => onCardClick('noshow')}
          clickable
        />
        <MetricCard
          title="Aguardando"
          value={stats.totalBooked + stats.totalPendingFeedback}
          icon={AlertCircle}
          subtext={`${stats.totalBooked} futuros · ${stats.totalPendingFeedback} s/ feedback`}
          onClick={() => onCardClick('pendentes')}
          clickable
        />
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Funil por Criativo</h3>
        <p className="text-[10px] text-text-muted mb-3">utm_content do Meta Ads · Clique para ver os leads</p>
        <div className="max-h-[500px] overflow-y-auto">
          <CriativoMetricsTable data={criativos} loading={loadingCriativos} onCriativoClick={onCriativoClick} />
        </div>
      </div>

      <LeadsUtmTable leads={criativoLeads} loading={loadingCriativos} locationId={locationId} />
    </div>
  );
}
