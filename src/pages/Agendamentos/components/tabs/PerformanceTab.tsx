import React from 'react';
import { MessageCircle, UserX, AlertCircle } from 'lucide-react';
import { MetricCard } from '../../../../components/MetricCard';
import { CriativoMetricsTable } from '../../../../components/charts/CriativoPerformanceChart';
import { LeadsUtmTable } from '../LeadsUtmTable';
import type { MetricType } from '../../types';
import type { FunnelMetrics, AgendaMetrics, CriativoMetrics, CriativoLead } from '../../../../hooks/useAgendamentosDashboard';

interface PerformanceTabProps {
  funnel: FunnelMetrics;
  agenda: AgendaMetrics;
  criativos: CriativoMetrics[];
  leads: CriativoLead[];
  loading: boolean;
  locationId: string | null;
  onCardClick: (metric: MetricType) => void;
  onCriativoClick: (criativo: string) => void;
}

export function PerformanceTab({
  funnel,
  agenda,
  criativos,
  leads,
  loading,
  locationId,
  onCardClick,
  onCriativoClick,
}: PerformanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          title="Responderam"
          value={funnel.totalResponderam}
          icon={MessageCircle}
          subtext={`${funnel.totalLeads > 0 ? Math.round((funnel.totalResponderam / funnel.totalLeads) * 100) : 0}% dos leads`}
          clickable
        />
        <MetricCard
          title="No-Show"
          value={agenda.totalNoShow}
          icon={UserX}
          subtext={`${agenda.taxaNoShow}% dos resolvidos`}
          onClick={() => onCardClick('noshow')}
          clickable
        />
        <MetricCard
          title="Aguardando"
          value={agenda.totalBooked + agenda.totalPendingFeedback}
          icon={AlertCircle}
          subtext={`${agenda.totalBooked} futuros · ${agenda.totalPendingFeedback} s/ feedback`}
          onClick={() => onCardClick('pendentes')}
          clickable
        />
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Funil por Criativo</h3>
        <p className="text-[10px] text-text-muted mb-3">utm_content do Meta Ads · Clique para ver os leads</p>
        <div className="max-h-[500px] overflow-y-auto">
          <CriativoMetricsTable data={criativos} loading={loading} onCriativoClick={onCriativoClick} />
        </div>
      </div>

      <LeadsUtmTable leads={leads} loading={loading} locationId={locationId} />
    </div>
  );
}
