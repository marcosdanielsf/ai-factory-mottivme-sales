import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { LeadFilterType } from './LeadsDrawer';

interface FunnelData {
  follow_up_count: number;
  quantidade: number;
  percentual: number;
}

interface FunnelChartProps {
  data: FunnelData[];
  isLoading?: boolean;
  onBarClick?: (filterType: LeadFilterType, title: string) => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const getFilterTypeForFU = (fuCount: number): LeadFilterType => {
  switch (fuCount) {
    case 0: return 'fu_0';
    case 1: return 'fu_1';
    case 2: return 'fu_2';
    case 3: return 'fu_3';
    default: return 'fu_4_plus';
  }
};

const getFULabel = (fuCount: number): string => {
  if (fuCount === 0) return 'Leads Novos (FU 0)';
  if (fuCount >= 4) return `Leads com ${fuCount}+ Follow-ups`;
  return `Leads com ${fuCount} Follow-up${fuCount > 1 ? 's' : ''}`;
};

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: any;
  onClick?: (data: any) => void;
}

const CustomBar: React.FC<CustomBarProps> = ({ x = 0, y = 0, width = 0, height = 0, fill, payload, onClick }) => {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => onClick?.(payload)}
        onMouseEnter={(e) => {
          (e.target as SVGRectElement).style.opacity = '0.8';
          (e.target as SVGRectElement).style.filter = 'brightness(1.2)';
        }}
        onMouseLeave={(e) => {
          (e.target as SVGRectElement).style.opacity = '1';
          (e.target as SVGRectElement).style.filter = 'none';
        }}
      />
    </g>
  );
};

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, isLoading = false, onBarClick }) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
        <div className="h-3 md:h-4 bg-[#333] rounded w-1/3 mb-3 md:mb-4 animate-pulse" />
        <div className="h-48 md:h-64 bg-[#333] rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: `FU ${item.follow_up_count}`,
    value: item.quantidade,
    percentual: item.percentual,
    follow_up_count: item.follow_up_count,
  }));

  const handleBarClick = (data: any) => {
    if (onBarClick && data) {
      const filterType = getFilterTypeForFU(data.follow_up_count);
      const title = getFULabel(data.follow_up_count);
      onBarClick(filterType, title);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 gap-1">
        <h3 className="text-xs md:text-sm font-medium text-gray-400">Distribuição por Etapa de Follow-up</h3>
        {onBarClick && (
          <span className="text-[10px] md:text-xs text-blue-400">Toque para ver detalhes</span>
        )}
      </div>
      <div className="h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" stroke="#666" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number, name: string, props: any) => [
                `${value.toLocaleString()} leads (${props.payload.percentual}%)`,
                'Quantidade',
              ]}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              shape={(props: any) => (
                <CustomBar {...props} onClick={handleBarClick} />
              )}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with clickable items */}
      {onBarClick && (
        <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[#333]">
          {chartData.map((entry, index) => (
            <button
              key={entry.name}
              onClick={() => handleBarClick(entry)}
              className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded hover:bg-[#222] transition-colors"
            >
              <div
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[10px] md:text-xs text-gray-400">
                {entry.name}: {entry.value.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FunnelChart;
