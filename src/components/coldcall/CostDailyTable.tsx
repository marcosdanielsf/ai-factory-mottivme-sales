import React, { useState } from 'react';
import { Calendar, TrendingUp, MousePointer } from 'lucide-react';
import { DailyCallsDrilldown } from './DailyCallsDrilldown';

interface CostDailyTableProps {
  daily: Array<{ date: string; calls: number; cost: number; avg_cost: number }>;
  className?: string;
}

// Taxa de conversão USD → BRL (fixo)
const USD_TO_BRL = 5.50;

export function CostDailyTable({
  daily,
  className = ''
}: CostDailyTableProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // Ordenar por data decrescente (mais recente primeiro)
  const sortedDaily = [...daily].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calcular custo médio geral para highlight
  const avgCost = sortedDaily.length > 0 
    ? sortedDaily.reduce((sum, row) => sum + row.cost, 0) / sortedDaily.length 
    : 0;

  // Formatar data para exibição (ex: 08/02/2026)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatar valores monetários
  const formatUSD = (value: number) => `$${value.toFixed(4)}`;
  const formatBRL = (value: number) => `R$${(value * USD_TO_BRL).toFixed(2)}`;

  return (
    <>
      <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-purple-400" />
          Custos Diários
          <span className="text-xs text-gray-400 font-normal ml-2 flex items-center gap-1">
            <MousePointer size={12} />
            Clique em um dia para ver detalhes
          </span>
        </h3>

      {sortedDaily.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <Calendar size={48} className="opacity-20 mb-3" />
          <p className="text-sm font-medium">Nenhuma chamada registrada ainda</p>
          <p className="text-xs text-gray-500 mt-1">Os custos aparecerão aqui após as primeiras ligações</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-gray-400 pb-3 pr-4">
                  Data
                </th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3 pr-4">
                  Chamadas
                </th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3 pr-4">
                  USD
                </th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3 pr-4">
                  BRL
                </th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">
                  Média
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDaily.map((row, index) => {
                const isAboveAverage = row.cost > avgCost;
                
                return (
                  <tr
                    key={row.date}
                    onClick={() => setSelectedDate(row.date)}
                    className={`
                      border-b border-white/10 last:border-b-0
                      hover:bg-white/[0.07] transition-all duration-200
                      cursor-pointer
                      ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}
                      ${isAboveAverage ? 'bg-yellow-500/5 border-l-2 border-l-yellow-500/40' : ''}
                      ${selectedDate === row.date ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}
                    `}
                  >
                    <td className="py-3 pr-4 text-sm text-white">
                      <div className="flex items-center gap-2">
                        {formatDate(row.date)}
                        {isAboveAverage && (
                          <TrendingUp size={14} className="text-yellow-500" title="Custo acima da média" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-white text-right font-medium">
                      {row.calls}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white text-right font-semibold">
                      {formatUSD(row.cost)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-emerald-400 text-right font-medium">
                      {formatBRL(row.cost)}
                    </td>
                    <td className="py-3 text-sm text-gray-400 text-right">
                      {formatUSD(row.avg_cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Totais/Resumo */}
      {sortedDaily.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all">
            <p className="text-xs text-gray-400 mb-1">Total Chamadas</p>
            <p className="text-xl font-bold text-white">
              {sortedDaily.reduce((sum, row) => sum + row.calls, 0)}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all">
            <p className="text-xs text-gray-400 mb-1">Custo Total (USD)</p>
            <p className="text-xl font-bold text-white">
              {formatUSD(sortedDaily.reduce((sum, row) => sum + row.cost, 0))}
            </p>
            <p className="text-xs text-emerald-400 mt-1">
              {formatBRL(sortedDaily.reduce((sum, row) => sum + row.cost, 0))}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all">
            <p className="text-xs text-gray-400 mb-1">Média Geral</p>
            <p className="text-xl font-bold text-white">
              {formatUSD(
                sortedDaily.reduce((sum, row) => sum + row.cost, 0) / 
                sortedDaily.reduce((sum, row) => sum + row.calls, 0)
              )}
            </p>
          </div>
        </div>
      )}
      </div>

      {/* Drill-down Modal */}
      <DailyCallsDrilldown
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
      />
    </>
  );
}
