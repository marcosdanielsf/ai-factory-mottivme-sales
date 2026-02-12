import React from 'react';

interface SalesFunnelChartProps {
  data: {
    totalLeads: number;
    totalResponderam: number;
    totalAgendaram: number;
    totalCompareceram: number;
    totalFecharam: number;
  };
  loading?: boolean;
}

// Larguras visuais fixas pra GARANTIR formato de funil (cada nivel menor que o anterior)
const FUNNEL_WIDTHS = [100, 75, 55, 40, 28];

const STAGE_CONFIG = [
  { key: 'totalLeads', label: 'Total de Leads', color: '#4b5563', border: '#6b7280' },
  { key: 'totalResponderam', label: 'Em Contato', color: '#6b7280', border: '#9ca3af' },
  { key: 'totalAgendaram', label: 'Agendaram', color: '#92702a', border: '#d4a853' },
  { key: 'totalCompareceram', label: 'Compareceram', color: '#8b7a2f', border: '#c9a84c' },
  { key: 'totalFecharam', label: 'Fecharam', color: '#7a6520', border: '#a88b3a' },
] as const;

export function SalesFunnelChart({ data, loading }: SalesFunnelChartProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
        <div className="h-4 bg-bg-hover rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-2">
          {FUNNEL_WIDTHS.map((w, i) => (
            <div key={i} className="h-12 bg-bg-hover rounded-lg animate-pulse" style={{ width: `${w}%`, margin: '0 auto' }} />
          ))}
        </div>
      </div>
    );
  }

  const baselineTotal = data.totalLeads || 1;

  const stages = STAGE_CONFIG.map((config, index) => {
    const value = data[config.key];
    const percentage = index === 0 ? 100 : (value / baselineTotal) * 100;
    return {
      ...config,
      value,
      percentage,
      visualWidth: FUNNEL_WIDTHS[index],
    };
  });

  return (
    <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Funil de Conversao</h3>
        <p className="text-xs text-text-muted">Taxa de conversao em cada etapa do processo</p>
      </div>

      <div className="space-y-1.5">
        {stages.map((stage, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Barra */}
            <div
              className="rounded-lg transition-all duration-300 hover:brightness-110 cursor-default"
              style={{
                width: `${stage.visualWidth}%`,
                backgroundColor: stage.color,
                borderLeft: `3px solid ${stage.border}`,
                borderRight: `3px solid ${stage.border}`,
                height: '44px',
              }}
            >
              <div className="h-full px-4 flex items-center justify-between text-white">
                <span className="font-medium text-sm">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{stage.value.toLocaleString()}</span>
                  <span className="text-xs opacity-80">{stage.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Seta entre niveis */}
            {index < stages.length - 1 && (
              <div className="text-text-muted text-[10px] opacity-40 leading-none py-0.5">▼</div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between text-xs">
        <span className="text-text-muted">Taxa de Conversao Final</span>
        <div className="text-right">
          <span className="text-accent-primary font-bold">
            {((data.totalFecharam / baselineTotal) * 100).toFixed(2)}%
          </span>
          <span className="text-text-muted ml-2">
            {data.totalFecharam} de {data.totalLeads.toLocaleString()} leads
          </span>
        </div>
      </div>
    </div>
  );
}

export default SalesFunnelChart;
