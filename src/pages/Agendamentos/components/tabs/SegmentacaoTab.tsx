import React from 'react';
import { EstadoChart, WorkPermitSummary, EstadoMetricsTable } from '../../../../components/charts/LeadSegmentationCharts';
import type { EstadoMetrics, WorkPermitMetrics, SegmentationTotals } from '../../../../hooks/useAgendamentosDashboard';

interface SegmentacaoTabProps {
  estados: EstadoMetrics[];
  workPermit: WorkPermitMetrics[];
  segmentationTotals: SegmentationTotals;
  loading: boolean;
}

export function SegmentacaoTab({
  estados,
  workPermit,
  segmentationTotals,
  loading,
}: SegmentacaoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                Leads por Estado
              </h3>
              <p className="text-[10px] text-text-muted">
                {segmentationTotals.comEstado} de {segmentationTotals.totalLeads} com estado informado
              </p>
            </div>
          </div>
          <EstadoChart data={estados} loading={loading} />
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            Work Permit
          </h3>
          <p className="text-[10px] text-text-muted mb-3">
            {segmentationTotals.comWorkPermit} de {segmentationTotals.totalLeads} com info
          </p>
          <WorkPermitSummary data={workPermit} loading={loading} />
        </div>
      </div>

      {estados.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Funil por Estado</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <EstadoMetricsTable data={estados} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}
