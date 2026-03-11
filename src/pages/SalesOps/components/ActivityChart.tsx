import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ActivityData {
  data: string;
  mensagens_enviadas: number;
  leads_contactados: number;
}

interface ActivityChartProps {
  data: ActivityData[];
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
        <div className="h-3 md:h-4 bg-[#333] rounded w-1/3 mb-3 md:mb-4 animate-pulse" />
        <div className="h-48 md:h-64 bg-[#333] rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    mensagens: item.mensagens_enviadas,
    leads: item.leads_contactados,
  }));

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 md:p-6">
      <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-3 md:mb-4">Atividade Diária (30 dias)</h3>
      <div className="h-48 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={10} tickMargin={8} interval="preserveStartEnd" />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="mensagens" stroke="#3b82f6" strokeWidth={2} dot={false} name="Mensagens" />
            <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
