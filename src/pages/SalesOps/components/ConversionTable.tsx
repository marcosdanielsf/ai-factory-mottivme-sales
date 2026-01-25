import React from 'react';
import type { ConversaoPorEtapa } from '../../../lib/supabase-sales-ops';

interface ConversionTableProps {
  data: ConversaoPorEtapa[];
  isLoading?: boolean;
}

export const ConversionTable: React.FC<ConversionTableProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="h-4 bg-[#333] rounded w-1/3 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-[#333] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const aggregated = data.reduce((acc, row) => {
    const key = row.etapa;
    if (!acc[key]) {
      acc[key] = { etapa: key, ativos: 0, desativados: 0, total: 0 };
    }
    acc[key].ativos += row.ativos_nesta_etapa;
    acc[key].desativados += row.desativados_nesta_etapa;
    acc[key].total += row.total_etapa;
    return acc;
  }, {} as Record<number, { etapa: number; ativos: number; desativados: number; total: number }>);

  const tableData = Object.values(aggregated)
    .sort((a, b) => a.etapa - b.etapa)
    .map((row) => ({
      ...row,
      taxaDesistencia: row.total > 0 ? ((row.desativados / row.total) * 100).toFixed(1) : '0.0',
    }));

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Conversao por Etapa</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Etapa</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Ativos</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Desativados</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Total</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Taxa Desist.</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.etapa} className="border-b border-[#333] hover:bg-[#222] transition-colors">
                <td className="py-3 px-2 text-white">Follow-up {row.etapa}</td>
                <td className="py-3 px-2 text-right text-green-500">{row.ativos.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-red-500">{row.desativados.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-400">{row.total.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    parseFloat(row.taxaDesistencia) > 30 ? 'bg-red-500/20 text-red-500' :
                    parseFloat(row.taxaDesistencia) > 15 ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {row.taxaDesistencia}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConversionTable;
