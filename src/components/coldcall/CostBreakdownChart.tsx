import React from 'react';

interface CostBreakdownChartProps {
  breakdown: { stt: number; llm: number; tts: number; telephony: number };
  className?: string;
}

export function CostBreakdownChart({
  breakdown,
  className = ''
}: CostBreakdownChartProps) {
  const total = breakdown.stt + breakdown.llm + breakdown.tts + breakdown.telephony;
  
  // Evitar divisão por zero
  if (total === 0) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-6">
          Breakdown de Custos
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          Sem dados disponíveis
        </div>
      </div>
    );
  }

  const segments = [
    { name: 'STT', value: breakdown.stt, color: '#8b5cf6', hoverColor: '#a78bfa' },
    { name: 'LLM', value: breakdown.llm, color: '#ec4899', hoverColor: '#f472b6' },
    { name: 'TTS', value: breakdown.tts, color: '#06b6d4', hoverColor: '#22d3ee' },
    { name: 'Telephony', value: breakdown.telephony, color: '#10b981', hoverColor: '#34d399' }
  ];

  // Calcular ângulos para cada segmento
  let currentAngle = -90; // Começar do topo
  const segmentsWithAngles = segments.map(segment => {
    const percentage = (segment.value / total) * 100;
    const angle = (segment.value / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    
    return {
      ...segment,
      percentage,
      startAngle: start,
      endAngle: end
    };
  });

  // Função para calcular path do arco SVG
  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">
        Breakdown de Custos
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 240 240" className="drop-shadow-lg">
            {/* Círculo interno para criar efeito donut */}
            <circle cx="120" cy="120" r="50" fill="rgb(0 0 0 / 0.5)" />
            
            {/* Segmentos do gráfico */}
            {segmentsWithAngles.map((segment) => (
              <g key={segment.name}>
                <path
                  d={describeArc(120, 120, 100, segment.startAngle, segment.endAngle)}
                  fill={hoveredSegment === segment.name ? segment.hoverColor : segment.color}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(segment.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{
                    filter: hoveredSegment === segment.name 
                      ? 'brightness(1.2) drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' 
                      : 'none'
                  }}
                />
              </g>
            ))}
            
            {/* Círculo central vazio */}
            <circle cx="120" cy="120" r="50" fill="transparent" />
          </svg>
          
          {/* Valor total no centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">
              ${total.toFixed(4)}
            </span>
            <span className="text-xs text-gray-400 mt-1">Total</span>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {segmentsWithAngles.map((segment) => (
            <div
              key={segment.name}
              className={`
                flex items-center justify-between p-3 rounded-lg
                transition-all duration-200 cursor-pointer
                ${hoveredSegment === segment.name 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-white/5 border border-white/10'
                }
              `}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-white font-medium">
                  {segment.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-white">
                  ${segment.value.toFixed(4)}
                </span>
                <span className="text-xs text-gray-400">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
