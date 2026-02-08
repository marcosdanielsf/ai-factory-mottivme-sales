import React from 'react';
import { PieChart } from 'lucide-react';

interface CostBreakdownChartProps {
  breakdown: { stt: number; llm: number; tts: number; telephony: number };
  className?: string;
}

export function CostBreakdownChart({
  breakdown,
  className = ''
}: CostBreakdownChartProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  // Fade in animation trigger
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = breakdown.stt + breakdown.llm + breakdown.tts + breakdown.telephony;
  
  // Evitar divisão por zero
  if (total === 0) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <PieChart size={20} className="text-purple-400" />
          Breakdown de Custos
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <PieChart size={48} className="opacity-20 mb-3" />
          <p className="text-sm">Sem dados disponíveis</p>
          <p className="text-xs text-gray-500 mt-1">Aguardando primeiras chamadas</p>
        </div>
      </div>
    );
  }

  // Cores melhoradas para dark theme (mais vibrantes e com melhor contraste)
  const segments = [
    { name: 'STT', value: breakdown.stt, color: '#a78bfa', hoverColor: '#c4b5fd' },      // purple-400 → purple-300
    { name: 'LLM', value: breakdown.llm, color: '#f472b6', hoverColor: '#f9a8d4' },      // pink-400 → pink-300
    { name: 'TTS', value: breakdown.tts, color: '#22d3ee', hoverColor: '#67e8f9' },      // cyan-400 → cyan-300
    { name: 'Telephony', value: breakdown.telephony, color: '#34d399', hoverColor: '#6ee7b7' } // emerald-400 → emerald-300
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
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <PieChart size={20} className="text-purple-400" />
        Breakdown de Custos
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Donut Chart */}
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 240 240" className="drop-shadow-lg">
            {/* Círculo interno para criar efeito donut */}
            <circle cx="120" cy="120" r="50" fill="rgb(0 0 0 / 0.5)" />
            
            {/* Segmentos do gráfico com animação */}
            {segmentsWithAngles.map((segment, index) => (
              <g key={segment.name}>
                <path
                  d={describeArc(120, 120, 100, segment.startAngle, segment.endAngle)}
                  fill={hoveredSegment === segment.name ? segment.hoverColor : segment.color}
                  className="cursor-pointer"
                  style={{
                    filter: hoveredSegment === segment.name 
                      ? `brightness(1.1) drop-shadow(0 0 12px ${segment.color})` 
                      : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                    transformOrigin: '120px 120px',
                    transitionDelay: `${index * 100}ms`
                  }}
                  onMouseEnter={() => setHoveredSegment(segment.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              </g>
            ))}
            
            {/* Círculo central vazio */}
            <circle cx="120" cy="120" r="50" fill="transparent" />
          </svg>
          
          {/* Valor total no centro com tooltip */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hoveredSegment ? (
              <>
                <span className="text-sm text-gray-400">
                  {hoveredSegment}
                </span>
                <span className="text-2xl font-bold text-white">
                  ${segmentsWithAngles.find(s => s.name === hoveredSegment)?.value.toFixed(4)}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {segmentsWithAngles.find(s => s.name === hoveredSegment)?.percentage.toFixed(1)}% do total
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-white">
                  ${total.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 mt-1">Total</span>
              </>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {segmentsWithAngles.map((segment, index) => (
            <div
              key={segment.name}
              className={`
                flex items-center justify-between p-3 rounded-lg
                transition-all duration-200 cursor-pointer
                ${hoveredSegment === segment.name 
                  ? 'bg-white/10 border border-white/20 scale-105' 
                  : 'bg-white/5 border border-white/10'
                }
              `}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms`
              }}
              onMouseEnter={() => setHoveredSegment(segment.name)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full transition-all duration-200"
                  style={{ 
                    backgroundColor: segment.color,
                    boxShadow: hoveredSegment === segment.name ? `0 0 8px ${segment.color}` : 'none'
                  }}
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
