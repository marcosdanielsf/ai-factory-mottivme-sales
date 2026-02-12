import React from 'react';

// ============================================================================
// COMPONENT: SalesFunnelChart
// Visualiza funil de conversao com barras horizontais decrescentes
// Design: barras centralizadas, gradiente gold, sem bibliotecas externas
// ============================================================================

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

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export function SalesFunnelChart({ data, loading }: SalesFunnelChartProps) {
  if (loading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
        <div className="h-4 bg-bg-hover rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-bg-hover rounded animate-pulse" style={{ width: `${100 - i * 10}%`, margin: '0 auto' }} />
          ))}
        </div>
      </div>
    );
  }

  // Calcular percentuais relativos ao total de leads (referencia = 100%)
  const baselineTotal = data.totalLeads || 1; // Evita divisão por zero
  const stages: FunnelStage[] = [
    {
      label: 'Total de Leads',
      value: data.totalLeads,
      percentage: 100,
      color: '#6b7280', // gray-500
    },
    {
      label: 'Responderam',
      value: data.totalResponderam,
      percentage: (data.totalResponderam / baselineTotal) * 100,
      color: '#9ca3af', // gray-400
    },
    {
      label: 'Agendaram',
      value: data.totalAgendaram,
      percentage: (data.totalAgendaram / baselineTotal) * 100,
      color: '#d4a853', // gold
    },
    {
      label: 'Compareceram',
      value: data.totalCompareceram,
      percentage: (data.totalCompareceram / baselineTotal) * 100,
      color: '#c9a84c', // gold accent
    },
    {
      label: 'Fecharam',
      value: data.totalFecharam,
      percentage: (data.totalFecharam / baselineTotal) * 100,
      color: '#a88b3a', // gold dark
    },
  ];

  return (
    <div className="bg-bg-secondary rounded-xl p-6 border border-border-default">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Funil de Conversão</h3>
        <p className="text-xs text-text-muted">Taxa de conversão em cada etapa do processo</p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          // Width minimo de 15% para visibilidade, mas proporcional ao percentual
          const barWidth = Math.max(stage.percentage, 15);

          return (
            <div key={index} className="relative">
              {/* Barra centralizada */}
              <div
                className="mx-auto rounded-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: stage.color,
                  height: '48px',
                  minWidth: '120px',
                }}
              >
                {/* Conteúdo interno da barra */}
                <div className="h-full px-4 flex items-center justify-between text-white">
                  <span className="font-medium text-sm truncate">{stage.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold">{stage.value.toLocaleString()}</span>
                    <span className="text-xs opacity-90">
                      {stage.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador de conversão (seta para próximo estágio) */}
              {index < stages.length - 1 && (
                <div className="flex items-center justify-center mt-1 mb-1">
                  <div className="text-text-muted text-xs opacity-50">↓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer com taxa de conversão final */}
      <div className="mt-6 pt-4 border-t border-border-default">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Taxa de Conversão Final</span>
          <span className="text-accent-primary font-semibold">
            {baselineTotal > 0 ? ((data.totalFecharam / baselineTotal) * 100).toFixed(2) : '0.00'}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-text-muted">Lead → Fechamento</span>
          <span className="text-text-secondary">
            {data.totalFecharam} de {data.totalLeads} leads
          </span>
        </div>
      </div>
    </div>
  );
}

export default SalesFunnelChart;
