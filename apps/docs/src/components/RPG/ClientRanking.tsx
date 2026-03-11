import React from 'react';
import { Client } from '../../types';
import { Trophy, Crown, ChevronRight } from 'lucide-react';

interface ClientRankingProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export const ClientRanking: React.FC<ClientRankingProps> = ({ clients, onSelectClient }) => {
  // Ordenar por faturamento/score
  const sortedClients = [...clients].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  const top3 = sortedClients.slice(0, 3);
  const others = sortedClients.slice(3);

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-10 flex flex-col md:flex-row gap-8 items-start h-full">
      
      {/* Left Sidebar - Rest of Ranking */}
      <div className="w-full md:w-80 flex-shrink-0 animate-in fade-in slide-in-from-left-8 duration-700 h-full">
        <div className="sticky top-0 bg-bg-primary/95 backdrop-blur z-10 py-4 border-b border-border-default md:border-none">
            <h3 className="text-lg font-bold text-text-muted flex items-center gap-2 px-2">
              <div className="w-1 h-6 bg-accent-primary rounded-full"></div>
              Demais Clientes
            </h3>
        </div>
            
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar mt-2">
          {others.length > 0 ? others.map((client, index) => (
              <div 
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-transparent hover:bg-bg-secondary hover:border-border-default transition-all cursor-pointer"
              >
                <span className="text-sm font-bold text-text-muted w-6 text-center">#{index + 4}</span>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border-default group-hover:border-accent-primary/50 transition-colors">
                  <img src={client.avatar} alt={client.nome} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-accent-primary transition-colors">{client.nome}</h4>
                  <p className="text-xs text-text-muted truncate">{client.empresa}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
          )) : (
            <div className="p-4 text-sm text-text-muted italic bg-bg-secondary/30 rounded-lg">
              Nenhum outro cliente no ranking.
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Podium */}
      <div className="flex-1 min-w-0 w-full">
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2 flex items-center justify-center gap-3">
              <Trophy className="text-yellow-500" size={32} />
              Ranking de Performance
            </h2>
            <p className="text-text-muted">Top clientes gerando resultados com I.A.</p>
          </div>

          {/* Podium */}
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-16 h-auto md:h-[400px]">
            {/* 2nd Place */}
            {top3[1] && (
              <div 
                onClick={() => onSelectClient(top3[1])}
                className="w-full md:w-1/3 max-w-[280px] group cursor-pointer animate-in slide-in-from-bottom-12 duration-1000 delay-100 order-2 md:order-1"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-4 relative transition-transform duration-300 group-hover:-translate-y-2">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-300 overflow-hidden shadow-lg">
                      <img src={top3[1].avatar} alt={top3[1].nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-300 text-gray-800 text-xs font-bold px-2 py-1 rounded-full border-2 border-bg-primary">
                      #2
                    </div>
                  </div>
                  
                  <div className="w-full bg-gradient-to-t from-gray-800/50 to-gray-700/30 border-t-4 border-gray-400 rounded-xl md:rounded-t-xl md:rounded-b-none p-6 text-center h-auto md:h-[200px] flex flex-col justify-between backdrop-blur-sm transition-colors group-hover:bg-gray-800/60">
                    <div>
                      <h3 className="font-bold text-lg text-text-primary truncate">{top3[1].nome}</h3>
                      <p className="text-sm text-text-muted truncate">{top3[1].empresa}</p>
                    </div>
                    <div className="mt-4 md:mt-2">
                        <div className="text-xs text-text-muted uppercase tracking-wider">Faturamento</div>
                        <div className="text-xl font-bold text-accent-success">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(top3[1].revenue || 0)}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div 
                onClick={() => onSelectClient(top3[0])}
                className="w-full md:w-1/3 max-w-[320px] group cursor-pointer z-10 animate-in slide-in-from-bottom-12 duration-1000 order-1 md:order-2 mb-8 md:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-6 relative transition-transform duration-300 group-hover:-translate-y-4">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce">
                      <Crown className="text-yellow-400 fill-yellow-400" size={40} />
                    </div>
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                      <img src={top3[0].avatar} alt={top3[0].nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full border-2 border-bg-primary shadow-lg">
                      #1
                    </div>
                  </div>

                  <div className="w-full bg-gradient-to-t from-yellow-900/40 to-yellow-600/20 border-t-4 border-yellow-400 rounded-xl md:rounded-t-xl md:rounded-b-none p-8 text-center h-auto md:h-[240px] flex flex-col justify-between backdrop-blur-md transition-colors group-hover:bg-yellow-900/50 shadow-[0_-10px_40px_rgba(250,204,21,0.1)]">
                    <div>
                      <h3 className="font-bold text-2xl text-text-primary truncate">{top3[0].nome}</h3>
                      <p className="text-base text-yellow-200/80 truncate">{top3[0].empresa}</p>
                    </div>
                    <div className="mt-4">
                        <div className="text-xs text-yellow-200/60 uppercase tracking-wider mb-1">Faturamento Gerado</div>
                        <div className="text-3xl font-bold text-accent-success drop-shadow-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(top3[0].revenue || 0)}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div 
                onClick={() => onSelectClient(top3[2])}
                className="w-full md:w-1/3 max-w-[280px] group cursor-pointer animate-in slide-in-from-bottom-12 duration-1000 delay-200 order-3"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-4 relative transition-transform duration-300 group-hover:-translate-y-2">
                    <div className="w-24 h-24 rounded-full border-4 border-orange-400 overflow-hidden shadow-lg">
                      <img src={top3[2].avatar} alt={top3[2].nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-orange-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-bg-primary">
                      #3
                    </div>
                  </div>
                  
                  <div className="w-full bg-gradient-to-t from-orange-900/30 to-orange-700/20 border-t-4 border-orange-400 rounded-xl md:rounded-t-xl md:rounded-b-none p-6 text-center h-auto md:h-[180px] flex flex-col justify-between backdrop-blur-sm transition-colors group-hover:bg-orange-800/40">
                    <div>
                      <h3 className="font-bold text-lg text-text-primary truncate">{top3[2].nome}</h3>
                      <p className="text-sm text-text-muted truncate">{top3[2].empresa}</p>
                    </div>
                    <div className="mt-4 md:mt-2">
                        <div className="text-xs text-text-muted uppercase tracking-wider">Faturamento</div>
                        <div className="text-xl font-bold text-accent-success">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(top3[2].revenue || 0)}
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
