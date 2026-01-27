import React from 'react';
import { Users, UserMinus, TrendingUp, Clock } from 'lucide-react';
import type { LeadFilterType } from './LeadsDrawer';

interface OverviewCardsProps {
  leadsAtivos: number;
  leadsInativos: number;
  mediaFollowUps: number;
  leadsProntos: number;
  isLoading?: boolean;
  onCardClick?: (filterType: LeadFilterType, title: string) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  subtext: string;
  onClick?: () => void;
  clickable?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  subtext, 
  onClick, 
  clickable = false 
}) => (
  <div
    onClick={onClick}
    className={`
      bg-[#1a1a1a] border border-[#333] rounded-lg p-4 transition-all
      ${clickable 
        ? 'cursor-pointer hover:bg-[#222] hover:border-[#444] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' 
        : ''}
    `}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
      <Icon size={16} className={`text-gray-500 ${clickable ? 'group-hover:text-blue-400' : ''}`} />
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    <p className="text-xs text-gray-500 mt-2">
      {subtext}
      {clickable && (
        <span className="ml-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-[#333] rounded w-1/2 mb-3" />
            <div className="h-8 bg-[#333] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Leads Ativos"
        value={leadsAtivos.toLocaleString()}
        icon={Users}
        subtext="Total em follow-up ativo"
        onClick={onCardClick ? () => onCardClick('ativos', 'Leads Ativos') : undefined}
        clickable={!!onCardClick}
      />
      <MetricCard
        title="Leads Inativos"
        value={leadsInativos.toLocaleString()}
        icon={UserMinus}
        subtext="Finalizados ou pausados"
        onClick={onCardClick ? () => onCardClick('inativos', 'Leads Inativos') : undefined}
        clickable={!!onCardClick}
      />
      <MetricCard
        title="Media Follow-ups"
        value={mediaFollowUps.toFixed(1)}
        icon={TrendingUp}
        subtext="Tentativas por lead"
        // Não clicável - é uma métrica calculada
        clickable={false}
      />
      <MetricCard
        title="Prontos para FU"
        value={leadsProntos.toLocaleString()}
        icon={Clock}
        subtext="Aguardando proximo contato"
        onClick={onCardClick ? () => onCardClick('prontos_fu', 'Prontos para Follow-up') : undefined}
        clickable={!!onCardClick}
      />
    </div>
  );
};

export default OverviewCards;
