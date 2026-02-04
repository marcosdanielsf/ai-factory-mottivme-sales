import React from 'react';
import { salesOpsDAO, type ConversaoPorEtapa } from '../../../lib/supabase-sales-ops';

interface ConversionTableProps {
  data: ConversaoPorEtapa[];
  isLoading?: boolean;
  locationId?: string | null;
  onCellClick?: (filterType: string, title: string) => void;
}

// Componente de célula clicável
const ClickableCell: React.FC<{
  value: number;
  colorClass: string;
  onClick?: () => void;
}> = ({ value, colorClass, onClick }) => {
  if (!onClick || value === 0) {
    return <span className={colorClass}>{value.toLocaleString()}</span>;
  }

  return (
    <button
      onClick={onClick}
      className={`${colorClass} hover:underline hover:brightness-125 transition-all cursor-pointer font-medium`}
      title="Clique para ver os leads"
    >
      {value.toLocaleString()}
    </button>
  );
};

export const ConversionTable: React.FC<ConversionTableProps> = ({ 
  data, 
  isLoading = false,
  locationId,
  onCellClick,
}) => {
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

  // Handler para clique nas células
  const handleCellClick = (etapa: number, status: 'ativos' | 'respondidos' | 'desistentes') => {
    if (!onCellClick) return;
    
    const statusLabels = {
      ativos: 'Ativos',
      respondidos: 'Respondidos',
      desistentes: 'Desistentes',
    };
    
    const filterType = `etapa_${etapa}_${status}`;
    const title = `Follow-up ${etapa} - ${statusLabels[status]}`;
    onCellClick(filterType, title);
  };

  // Formatar custo em USD
  const formatCusto = (custo: CustoPorEtapa | undefined) => {
    if (!custo || custo.custo_medio_por_lead === 0) {
      return <span className="text-gray-600">-</span>;
    }
    return (
      <span className="text-amber-400 font-medium">
        ${custo.custo_medio_por_lead.toFixed(2)}
      </span>
    );
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-xs md:text-sm font-medium text-gray-400">Conversão por Etapa</h3>
        {onCellClick && (
          <span className="text-[10px] text-gray-500 hidden md:inline">
            💡 Clique nos números para ver os leads
          </span>
        )}
      </div>
      
      {/* Mobile: Cards empilhados */}
      <div className="md:hidden space-y-2">
        {tableData.map((row) => (
          <div key={row.etapa} className="bg-[#222] border border-[#333] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">FU {row.etapa}</span>
              <div className="flex gap-1 items-center">
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
              <div 
                className={onCellClick && row.ativos > 0 ? 'cursor-pointer active:scale-95' : ''}
                onClick={() => row.ativos > 0 && handleCellClick(row.etapa, 'ativos')}
              >
                <div className="text-[10px] text-gray-500 mb-0.5">Ativos</div>
                <div className={`text-sm font-medium text-green-500 ${onCellClick && row.ativos > 0 ? 'hover:underline' : ''}`}>
                  {row.ativos.toLocaleString()}
                </div>
              </div>
              <div
                className={onCellClick && row.respondidos > 0 ? 'cursor-pointer active:scale-95' : ''}
                onClick={() => row.respondidos > 0 && handleCellClick(row.etapa, 'respondidos')}
              >
                <div className="text-[10px] text-gray-500 mb-0.5">Respond.</div>
                <div className={`text-sm font-medium text-blue-400 ${onCellClick && row.respondidos > 0 ? 'hover:underline' : ''}`}>
                  {row.respondidos.toLocaleString()}
                </div>
              </div>
              <div
                className={onCellClick && row.desativados > 0 ? 'cursor-pointer active:scale-95' : ''}
                onClick={() => row.desativados > 0 && handleCellClick(row.etapa, 'desistentes')}
              >
                <div className="text-[10px] text-gray-500 mb-0.5">Desist.</div>
                <div className={`text-sm font-medium text-red-500 ${onCellClick && row.desativados > 0 ? 'hover:underline' : ''}`}>
                  {row.desativados.toLocaleString()}
                </div>
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
                <td className="py-3 px-2 text-right">
                  <ClickableCell
                    value={row.ativos}
                    colorClass="text-green-500"
                    onClick={onCellClick && row.ativos > 0 ? () => handleCellClick(row.etapa, 'ativos') : undefined}
                  />
                </td>
                <td className="py-3 px-2 text-right">
                  <ClickableCell
                    value={row.respondidos}
                    colorClass="text-blue-400"
                    onClick={onCellClick && row.respondidos > 0 ? () => handleCellClick(row.etapa, 'respondidos') : undefined}
                  />
                </td>
                <td className="py-3 px-2 text-right">
                  <ClickableCell
                    value={row.desativados}
                    colorClass="text-red-500"
                    onClick={onCellClick && row.desativados > 0 ? () => handleCellClick(row.etapa, 'desistentes') : undefined}
                  />
                </td>
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
