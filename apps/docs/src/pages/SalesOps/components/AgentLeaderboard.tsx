import React, { useEffect, useState } from 'react';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import { salesOpsDAO, type AgentPerformance } from '../../../lib/supabase-sales-ops';

interface AgentLeaderboardProps {
  locationId: string | null;
  isLoading?: boolean;
}

const getMedal = (position: number): string => {
  switch (position) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `${position}º`;
  }
};

const getProgressColor = (taxa: number): string => {
  if (taxa >= 80) return 'bg-green-500';
  if (taxa >= 60) return 'bg-yellow-500';
  if (taxa >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({ locationId, isLoading: parentLoading }) => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgentPerformance = async () => {
      setIsLoading(true);
      try {
        const data = await salesOpsDAO.getAgentPerformance(locationId ?? undefined);
        // Filtrar agentes sem nome e ordenar por total de leads (volume)
        const filteredData = data
          .filter(a => a.agente_ia && a.agente_ia !== 'Sem Agente' && a.agente_ia !== 'NULL' && a.total_leads >= 1)
          .sort((a, b) => b.total_leads - a.total_leads);
        setAgents(filteredData);
      } catch (error) {
        console.error('Erro ao carregar performance dos agentes:', error);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentPerformance();
  }, [locationId]);

  const loading = isLoading || parentLoading;

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="font-semibold text-white">🏆 Taxa de Resposta por Agente</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-[#333] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="font-semibold text-white">🏆 Taxa de Resposta por Agente</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p>Nenhum agente encontrado</p>
        </div>
      </div>
    );
  }

  // Calcular totais
  const totalLeads = agents.reduce((sum, a) => sum + a.total_leads, 0);
  const totalRespondidos = agents.reduce((sum, a) => sum + a.respondidos, 0);
  const taxaGeral = totalLeads > 0 ? Math.round((totalRespondidos / totalLeads) * 100) : 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="font-semibold text-white">🏆 Taxa de Resposta por Agente</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp size={12} />
          <span>Geral: <strong className={taxaGeral >= 80 ? 'text-green-400' : taxaGeral >= 60 ? 'text-yellow-400' : 'text-red-400'}>{taxaGeral}%</strong></span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {agents.map((agent, index) => {
          const position = index + 1;
          const isTop3 = position <= 3;
          const taxa = agent.taxa_conversao;
          
          return (
            <div
              key={agent.agente_ia}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors
                ${isTop3 ? 'bg-[#222] border border-[#444]' : 'bg-[#1a1a1a]'}
                hover:bg-[#2a2a2a]
              `}
            >
              {/* Position */}
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0
                ${position === 1 ? 'bg-yellow-500/20 text-yellow-500' : ''}
                ${position === 2 ? 'bg-gray-300/20 text-gray-400' : ''}
                ${position === 3 ? 'bg-orange-500/20 text-orange-500' : ''}
                ${position > 3 ? 'bg-[#333] text-gray-500' : ''}
              `}>
                {getMedal(position)}
              </div>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-medium truncate text-sm ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                    {agent.agente_ia}
                  </span>
                  <span className={`text-sm font-bold ${
                    taxa >= 80 ? 'text-green-400' : 
                    taxa >= 60 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {taxa.toFixed(0)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(taxa)}`}
                      style={{ width: `${taxa}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">
                    {agent.respondidos}/{agent.total_leads}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#333]">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Total: <strong className="text-gray-300">{totalRespondidos}/{totalLeads} responderam</strong></span>
        </div>
      </div>
    </div>
  );
};

export default AgentLeaderboard;
