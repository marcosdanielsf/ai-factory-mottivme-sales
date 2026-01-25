import React from 'react';
import { Users, UserMinus, TrendingUp, Clock } from 'lucide-react';

interface OverviewCardsProps {
  leadsAtivos: number;
  leadsInativos: number;
  mediaFollowUps: number;
  leadsProntos: number;
  isLoading?: boolean;
}

const MetricCard = ({ title, value, icon: Icon, subtext }: { title: string; value: string | number; icon: any; subtext: string }) => (
  <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:bg-[#222] transition-colors">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm text-gray-400 font-medium">{title}</h3>
      <Icon size={16} className="text-gray-500" />
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
    <p className="text-xs text-gray-500 mt-2">{subtext}</p>
  </div>
);

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  leadsAtivos,
  leadsInativos,
  mediaFollowUps,
  leadsProntos,
  isLoading = false,
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
      />
      <MetricCard
        title="Leads Inativos"
        value={leadsInativos.toLocaleString()}
        icon={UserMinus}
        subtext="Finalizados ou pausados"
      />
      <MetricCard
        title="Media Follow-ups"
        value={mediaFollowUps.toFixed(1)}
        icon={TrendingUp}
        subtext="Tentativas por lead"
      />
      <MetricCard
        title="Prontos para FU"
        value={leadsProntos.toLocaleString()}
        icon={Clock}
        subtext="Aguardando proximo contato"
      />
    </div>
  );
};

export default OverviewCards;
