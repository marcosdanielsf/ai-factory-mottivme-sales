import React from 'react';
import type { ConversaoPorEtapa } from '../../../lib/supabase-sales-ops';

interface ConversionTableProps {
  data: ConversaoPorEtapa[];
  isLoading?: boolean;
}

export const ConversionTable: React.FC<ConversionTableProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
        <div className="h-3 md:h-4 bg-[#333] rounded w-1/3 mb-3 md:mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 md:h-10 bg-[#333] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const aggregated = data.reduce((acc, row) => {
    const key = row.etapa;
    if (!acc[key]) {
      acc[key] = { etapa: key, ativos: 0, respondidos: 0, desativados: 0, total: 0 };
    }
    acc[key].ativos += row.ativos_nesta_etapa;
    acc[key].respondidos += row.respondidos_nesta_etapa || 0;
    acc[key].desativados += row.desativados_nesta_etapa;
    acc[key].total += row.total_etapa;
    return acc;
  }, {} as Record<number, { etapa: number; ativos: number; respondidos: number; desativados: number; total: number }>);

  const tableData = Object.values(aggregated)
    .sort((a, b) => a.etapa - b.etapa)
    .map((row) => ({
      ...row,
      taxaResposta: row.total > 0 ? ((row.respondidos / row.total) * 100).toFixed(1) : '0.0',
      taxaDesistencia: row.total > 0 ? ((row.desativados / row.total) * 100).toFixed(1) : '0.0',
    }));

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
      <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-3 md:mb-4">Conversão por Etapa</h3>
      
      {/* Mobile: Cards empilhados */}
      <div className="md:hidden space-y-2">
        {tableData.map((row) => (
          <div key={row.etapa} className="bg-[#222] border border-[#333] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">FU {row.etapa}</span>
              <div className="flex gap-1">
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  parseFloat(row.taxaResposta) > 20 ? 'bg-blue-500/20 text-blue-400' :
                  parseFloat(row.taxaResposta) > 10 ? 'bg-blue-500/10 text-blue-300' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {row.taxaResposta}% resp.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Ativos</div>
                <div className="text-sm font-medium text-green-500">{row.ativos.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Respond.</div>
                <div className="text-sm font-medium text-blue-400">{row.respondidos.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Desist.</div>
                <div className="text-sm font-medium text-red-500">{row.desativados.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">Total</div>
                <div className="text-sm font-medium text-gray-400">{row.total.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Tabela normal */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left py-3 px-2 text-gray-400 font-medium">Etapa</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Ativos</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Respondidos</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Desistentes</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Total</th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium">Taxa Resp.</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.etapa} className="border-b border-[#333] hover:bg-[#222] transition-colors">
                <td className="py-3 px-2 text-white">Follow-up {row.etapa}</td>
                <td className="py-3 px-2 text-right text-green-500">{row.ativos.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-blue-400">{row.respondidos.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-red-500">{row.desativados.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-400">{row.total.toLocaleString()}</td>
                <td className="py-3 px-2 text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    parseFloat(row.taxaResposta) > 20 ? 'bg-blue-500/20 text-blue-400' :
                    parseFloat(row.taxaResposta) > 10 ? 'bg-blue-500/10 text-blue-300' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {row.taxaResposta}%
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
