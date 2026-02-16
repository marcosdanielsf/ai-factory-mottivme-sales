import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ArrowUpDown,
  Trophy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useProspectorAnalytics } from '../hooks/useProspector';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';

// ═══════════════════════════════════════════════════════════════════════
// CHART COLORS
// ═══════════════════════════════════════════════════════════════════════

const COLORS = {
  primary: '#58a6ff',
  secondary: '#a371f7',
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
  muted: '#8b949e',
};

const PIE_COLORS = ['#58a6ff', '#a371f7', '#3fb950', '#d29922'];

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-lg">
        <p className="text-xs text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════
// PERFORMANCE TABLE
// ═══════════════════════════════════════════════════════════════════════

interface PerformanceTableProps {
  data: Array<{
    template_name: string;
    channel: string;
    vertical: string;
    sent: number;
    replied: number;
    reply_rate: number;
    conversion_rate: number;
  }>;
}

const PerformanceTable = ({ data }: PerformanceTableProps) => {
  const [sortKey, setSortKey] = useState<string>('reply_rate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey as keyof typeof a];
    const bVal = b[sortKey as keyof typeof b];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const topPerformer = sortedData[0];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1117] border-b border-[#30363d]">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">
                Template
              </th>
              <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">
                Canal
              </th>
              <th className="text-left p-3 text-xs font-semibold text-[#8b949e] uppercase">
                Vertical
              </th>
              <th
                className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('sent')}
              >
                <div className="flex items-center justify-end gap-1">
                  Enviadas
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('replied')}
              >
                <div className="flex items-center justify-end gap-1">
                  Respondidas
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('reply_rate')}
              >
                <div className="flex items-center justify-end gap-1">
                  Reply Rate
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th
                className="text-right p-3 text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('conversion_rate')}
              >
                <div className="flex items-center justify-end gap-1">
                  Conversão
                  <ArrowUpDown size={12} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const isTopPerformer = row === topPerformer;
              return (
                <tr
                  key={index}
                  className={`border-b border-[#30363d] last:border-0 hover:bg-[#0d1117] transition-colors ${
                    isTopPerformer ? 'bg-[#3fb950]/5' : ''
                  }`}
                >
                  <td className="p-3 text-white">
                    <div className="flex items-center gap-2">
                      {isTopPerformer && (
                        <Trophy size={14} className="text-[#d29922]" title="Top Performer" />
                      )}
                      {row.template_name}
                    </div>
                  </td>
                  <td className="p-3 text-[#8b949e] capitalize">{row.channel}</td>
                  <td className="p-3 text-[#8b949e] capitalize">{row.vertical}</td>
                  <td className="p-3 text-right text-white">{row.sent}</td>
                  <td className="p-3 text-right text-[#3fb950]">{row.replied}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`font-semibold ${
                        row.reply_rate >= 20
                          ? 'text-[#3fb950]'
                          : row.reply_rate >= 10
                          ? 'text-[#d29922]'
                          : 'text-[#f85149]'
                      }`}
                    >
                      {row.reply_rate}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`font-semibold ${
                        row.conversion_rate >= 8
                          ? 'text-[#a371f7]'
                          : row.conversion_rate >= 5
                          ? 'text-[#58a6ff]'
                          : 'text-[#8b949e]'
                      }`}
                    >
                      {row.conversion_rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ProspectorAnalytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const { analyticsData, templatePerformance, loading } = useProspectorAnalytics(undefined, dateRange);

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/prospector')}
              className="text-xs text-[#58a6ff] hover:underline mb-2"
            >
              ← Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <BarChart3 size={26} className="text-[#58a6ff]" />
              Analytics de Prospecção
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Performance detalhada das campanhas
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-[#0d1117] rounded w-1/4 mb-4" />
                <div className="h-64 bg-[#0d1117] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Line Chart: DMs enviadas vs respostas */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#58a6ff]" />
                DMs Enviadas vs Respostas (últimos 30 dias)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyDMs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#8b949e" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    name="Enviadas"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="replies"
                    name="Respostas"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reply rate por canal */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Reply Rate por Canal</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.replyRateByChannel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="channel" stroke="#8b949e" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#8b949e" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name="Reply Rate (%)" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reply rate por vertical */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Reply Rate por Vertical</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.replyRateByVertical}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="vertical" stroke="#8b949e" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#8b949e" style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name="Reply Rate (%)" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Leads por stage */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Distribuição de Leads por Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.leadsByStage}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#8b949e' }}
                  >
                    {analyticsData.leadsByStage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap simulado (melhores horários) */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Melhor Horário de Envio</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {analyticsData.bestHours.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#0d1117] border border-[#30363d] rounded-lg hover:border-[#58a6ff]/40 transition-colors"
                  >
                    <p className="text-xs text-[#8b949e] mb-1">{item.day}</p>
                    <p className="text-lg font-semibold text-white mb-1">{item.hour}h</p>
                    <p className="text-xs text-[#3fb950]">{item.rate}% reply</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Table */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Performance por Template</h3>
              <PerformanceTable data={templatePerformance} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProspectorAnalytics;
