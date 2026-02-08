import React from 'react';

interface CostDailyTableProps {
  daily: Array<{ date: string; calls: number; cost: number; avg_cost: number }>;
  className?: string;
}

export function CostDailyTable({
  daily,
  className = ''
}: CostDailyTableProps) {
  // Ordenar por data decrescente (mais recente primeiro)
  const sortedDaily = [...daily].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">
        Custos Diários
      </h3>

      {sortedDaily.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          Sem dados disponíveis
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
                  Custo Total
                </th>
                <th className="text-right text-sm font-medium text-gray-400 pb-3">
                  Custo Médio
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDaily.map((row, index) => (
                <tr
                  key={row.date}
                  className={`
                    border-b border-white/10 last:border-b-0
                    hover:bg-white/[0.07] transition-colors duration-150
                    ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}
                  `}
                >
                  <td className="py-3 pr-4 text-sm text-white">
                    {formatDate(row.date)}
                  </td>
                  <td className="py-3 pr-4 text-sm text-white text-right font-medium">
                    {row.calls}
                  </td>
                  <td className="py-3 pr-4 text-sm text-white text-right font-semibold">
                    {formatCurrency(row.cost)}
                  </td>
                  <td className="py-3 text-sm text-gray-400 text-right">
                    {formatCurrency(row.avg_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totais/Resumo */}
      {sortedDaily.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Total Chamadas</p>
            <p className="text-xl font-bold text-white">
              {sortedDaily.reduce((sum, row) => sum + row.calls, 0)}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Custo Total</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(sortedDaily.reduce((sum, row) => sum + row.cost, 0))}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Média Geral</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(
                sortedDaily.reduce((sum, row) => sum + row.cost, 0) / 
                sortedDaily.reduce((sum, row) => sum + row.calls, 0)
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
