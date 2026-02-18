import React from 'react';
import { EstadoChart, WorkPermitSummary, EstadoMetricsTable } from '../../../../components/charts/LeadSegmentationCharts';

interface SegmentacaoTabProps {
  estados: any[];
  workPermit: any[];
  segmentationTotals: {
    totalLeads: number;
    comEstado: number;
    comWorkPermit: number;
  };
  loadingSegmentation: boolean;
}

export function SegmentacaoTab({
  estados,
  workPermit,
  segmentationTotals,
  loadingSegmentation,
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
          <EstadoChart data={estados} loading={loadingSegmentation} />
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            Work Permit
          </h3>
          <p className="text-[10px] text-text-muted mb-3">
            {segmentationTotals.comWorkPermit} de {segmentationTotals.totalLeads} com info
          </p>
          <WorkPermitSummary data={workPermit} loading={loadingSegmentation} />
        </div>
      </div>

      {estados.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Funil por Estado</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <EstadoMetricsTable data={estados} loading={loadingSegmentation} />
          </div>
        </div>
      )}
    </div>
  );
}
