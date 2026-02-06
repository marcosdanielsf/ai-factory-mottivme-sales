import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { EstadoMetrics, WorkPermitMetrics } from '../../hooks/useLeadSegmentation';
import { MapPin, Shield } from 'lucide-react';

// ============================================================================
// CHARTS: LeadSegmentationCharts
// Visualiza segmentação de leads por Estado e Work Permit
// ============================================================================

interface EstadoChartProps {
  data: EstadoMetrics[];
  loading?: boolean;
}

interface WorkPermitChartProps {
  data: WorkPermitMetrics[];
  loading?: boolean;
}

const STATE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

const WORK_PERMIT_COLORS: Record<string, string> = {
  'Com Work Permit': '#10b981',
  'Sem Work Permit': '#ef4444',
  'Não informado': '#6b7280',
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 shadow-lg text-xs">
      <p className="text-text-primary font-medium mb-1">{label || payload[0]?.name}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-text-secondary">
          {entry.dataKey === 'totalLeads' && `Total: ${entry.value}`}
          {entry.dataKey === 'convertidos' && `Fechados (Won): ${entry.value}`}
          {entry.dataKey === 'perdidos' && `Perdidos (Lost): ${entry.value}`}
          {entry.dataKey === 'taxaConversao' && `Conversão: ${entry.value}%`}
        </p>
      ))}
    </div>
  );
};

// Chart: Leads por Estado (Horizontal Bar)
export function EstadoChart({ data, loading }: EstadoChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center text-text-muted">
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado de estado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} />
          <YAxis
            type="category"
            dataKey="estado"
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            width={85}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalLeads" name="Leads" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={STATE_COLORS[index % STATE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart: Work Permit (Pie)
export function WorkPermitChart({ data, loading }: WorkPermitChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-text-muted">
        <div className="text-center">
          <Shield size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado de work permit</p>
        </div>
      </div>
    );
  }

  const pieData = data.map((item) => ({
    name: item.status,
    value: item.totalLeads,
    color: WORK_PERMIT_COLORS[item.status] || '#6b7280',
  }));

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              fontSize: '11px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-text-primary text-[10px]">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Table: Estado Metrics com funil
interface EstadoTableProps {
  data: EstadoMetrics[];
  loading?: boolean;
}

export function EstadoMetricsTable({ data, loading }: EstadoTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-bg-tertiary rounded" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-6 text-text-muted">
        <p className="text-sm">Sem dados de estado para exibir</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-2 px-1 text-text-muted font-medium">Estado</th>
            <th className="text-right py-2 px-1 text-text-muted font-medium">Leads</th>
            <th className="text-right py-2 px-1 text-text-muted font-medium">Won</th>
            <th className="text-right py-2 px-1 text-text-muted font-medium">Lost</th>
            <th className="text-right py-2 px-1 text-text-muted font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              className="border-b border-border-default/50 hover:bg-bg-tertiary transition-colors"
            >
              <td className="py-1.5 px-1 text-text-primary font-medium">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATE_COLORS[index % STATE_COLORS.length] }}
                  />
                  {item.estado}
                </div>
              </td>
              <td className="text-right py-1.5 px-1 text-text-secondary">{item.totalLeads}</td>
              <td className="text-right py-1.5 px-1 text-emerald-400">{item.convertidos}</td>
              <td className="text-right py-1.5 px-1 text-red-400">{item.perdidos}</td>
              <td className="text-right py-1.5 px-1">
                <span className={`font-medium ${
                  item.taxaConversao >= 20 ? 'text-emerald-400' :
                  item.taxaConversao >= 10 ? 'text-amber-400' : 'text-text-muted'
                }`}>
                  {item.taxaConversao}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Card de resumo Work Permit
interface WorkPermitSummaryProps {
  data: WorkPermitMetrics[];
  loading?: boolean;
}

export function WorkPermitSummary({ data, loading }: WorkPermitSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-12 bg-bg-tertiary rounded" />
        <div className="h-12 bg-bg-tertiary rounded" />
      </div>
    );
  }

  const comPermit = data.find((d) => d.status === 'Com Work Permit');
  const semPermit = data.find((d) => d.status === 'Sem Work Permit');
  const naoInformado = data.find((d) => d.status === 'Não informado');

  return (
    <div className="space-y-2">
      {/* Com Work Permit */}
      <div className="flex items-center justify-between p-2 bg-emerald-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-xs text-text-primary">Com Work Permit</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-emerald-400">{comPermit?.totalLeads || 0}</span>
          {comPermit && comPermit.taxaConversao > 0 && (
            <span className="text-[10px] text-text-muted ml-1">({comPermit.taxaConversao}% conv)</span>
          )}
        </div>
      </div>

      {/* Sem Work Permit */}
      <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-red-400" />
          <span className="text-xs text-text-primary">Sem Work Permit</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-red-400">{semPermit?.totalLeads || 0}</span>
          {semPermit && semPermit.taxaConversao > 0 && (
            <span className="text-[10px] text-text-muted ml-1">({semPermit.taxaConversao}% conv)</span>
          )}
        </div>
      </div>

      {/* Não informado */}
      <div className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-text-muted" />
          <span className="text-xs text-text-secondary">Não informado</span>
        </div>
        <span className="text-sm text-text-muted">{naoInformado?.totalLeads || 0}</span>
      </div>
    </div>
  );
}

export default EstadoChart;
