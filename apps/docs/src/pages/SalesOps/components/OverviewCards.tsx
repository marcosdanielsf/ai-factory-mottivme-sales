import React from 'react';
import { Users, UserMinus, TrendingUp, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { LeadFilterType } from './LeadsDrawer';
import type { TrendData } from '../../../lib/supabase-sales-ops';

interface OverviewCardsProps {
  leadsAtivos: number;
  leadsInativos: number;
  mediaFollowUps: number;
  leadsProntos: number;
  isLoading?: boolean;
  onCardClick?: (filterType: LeadFilterType, title: string) => void;
  trends?: TrendData | null;
  periodLabel?: string; // ex: "sem" (semana), "mês"
}

interface TrendBadgeProps {
  value: number;
  periodLabel?: string;
  invertColors?: boolean; // Para métricas onde queda é positiva (ex: inativos)
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ value, periodLabel = 'sem', invertColors = false }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  // Determina cor baseado na tendência
  // Para métricas normais: ↑ = verde, ↓ = vermelho
  // Para métricas invertidas (ex: inativos): ↑ = vermelho, ↓ = verde
  let colorClass = 'text-gray-400 bg-gray-500/10';
  if (isPositive) {
    colorClass = invertColors 
      ? 'text-red-400 bg-red-500/10' 
      : 'text-emerald-400 bg-emerald-500/10';
  } else if (isNegative) {
    colorClass = invertColors 
      ? 'text-emerald-400 bg-emerald-500/10' 
      : 'text-red-400 bg-red-500/10';
  }

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium ${colorClass}`}>
      {isPositive && <ArrowUp size={10} className="md:w-3 md:h-3" />}
      {isNegative && <ArrowDown size={10} className="md:w-3 md:h-3" />}
      {isNeutral && <Minus size={10} className="md:w-3 md:h-3" />}
      {Math.abs(value)}% vs {periodLabel}
    </span>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  subtext: string;
  onClick?: () => void;
  clickable?: boolean;
  trend?: number | null;
  periodLabel?: string;
  invertTrendColors?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  subtext, 
  onClick, 
  clickable = false,
  trend,
  periodLabel = 'sem',
  invertTrendColors = false,
}) => (
  <div
    onClick={onClick}
    className={`
      bg-[#1a1a1a] border border-[#333] rounded-lg p-3 md:p-4 transition-all
      ${clickable 
        ? 'group cursor-pointer hover:bg-[#222] hover:border-[#444] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
        : ''}
    `}
  >
    <div className="flex items-center justify-between mb-1.5 md:mb-2">
      <h3 className="text-xs md:text-sm text-gray-400 font-medium truncate pr-2">{title}</h3>
      <Icon size={14} className={`text-gray-500 flex-shrink-0 md:w-4 md:h-4 ${clickable ? 'group-hover:text-blue-400' : ''}`} />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xl md:text-2xl font-semibold text-white">{value}</span>
      {trend !== undefined && trend !== null && (
        <TrendBadge value={trend} periodLabel={periodLabel} invertColors={invertTrendColors} />
      )}
    </div>
    <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2 truncate">
      {subtext}
      {clickable && (
        <span className="ml-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">
          → ver lista
        </span>
      )}
    </p>
  </div>
);

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  leadsAtivos,
  leadsInativos,
  mediaFollowUps,
  leadsProntos,
  isLoading = false,
  onCardClick,
  trends,
  periodLabel = 'sem',
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 md:p-4 animate-pulse">
            <div className="h-3 md:h-4 bg-[#333] rounded w-1/2 mb-2 md:mb-3" />
            <div className="h-6 md:h-8 bg-[#333] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <MetricCard
        title="Leads Ativos"
        value={leadsAtivos.toLocaleString()}
        icon={Users}
        subtext="Total em follow-up ativo"
        onClick={onCardClick ? () => onCardClick('ativos', 'Leads Ativos') : undefined}
        clickable={!!onCardClick}
        trend={trends?.ativos}
        periodLabel={periodLabel}
      />
      <MetricCard
        title="Leads Inativos"
        value={leadsInativos.toLocaleString()}
        icon={UserMinus}
        subtext="Finalizados ou pausados"
        onClick={onCardClick ? () => onCardClick('inativos', 'Leads Inativos') : undefined}
        clickable={!!onCardClick}
        trend={trends?.inativos}
        periodLabel={periodLabel}
        invertTrendColors={true} // Mais inativos = ruim
      />
      <MetricCard
        title="Media Follow-ups"
        value={mediaFollowUps.toFixed(1)}
        icon={TrendingUp}
        subtext="Tentativas por lead"
        // Não clicável - é uma métrica calculada
        // Sem trend pois é calculada diferente
        clickable={false}
      />
      <MetricCard
        title="Prontos para FU"
        value={leadsProntos.toLocaleString()}
        icon={Clock}
        subtext="Aguardando proximo contato"
        onClick={onCardClick ? () => onCardClick('prontos_fu', 'Prontos para Follow-up') : undefined}
        clickable={!!onCardClick}
        trend={trends?.leadsProntos}
        periodLabel={periodLabel}
      />
    </div>
  );
};

export default OverviewCards;
