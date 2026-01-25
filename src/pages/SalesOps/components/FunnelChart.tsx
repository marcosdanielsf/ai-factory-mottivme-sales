import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FunnelData {
  follow_up_count: number;
  quantidade: number;
  percentual: number;
}

interface FunnelChartProps {
  data: FunnelData[];
  isLoading?: boolean;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
        <div className="h-4 bg-[#333] rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-64 bg-[#333] rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: `FU ${item.follow_up_count}`,
    value: item.quantidade,
    percentual: item.percentual,
  }));

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Distribuicao por Etapa de Follow-up</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FunnelChart;
