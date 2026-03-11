import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  CriativoMetrics,
  OrigemMetrics,
} from "../../hooks/useAgendamentosDashboard";

// ============================================================================
// CHART: CriativoPerformanceChart
// Visualiza performance de leads por criativo (utm_content)
// Mostra funil: leads → responderam → agendaram → compareceram → fecharam
// ============================================================================

interface CriativoPerformanceChartProps {
  data: CriativoMetrics[];
  loading?: boolean;
}

interface OrigemPerformanceChartProps {
  data: OrigemMetrics[];
  loading?: boolean;
}

const COLORS = {
  leads: "#3b82f6", // Blue
  responderam: "#8b5cf6", // Purple
  agendaram: "#f59e0b", // Amber
  compareceram: "#10b981", // Emerald
  fecharam: "#22c55e", // Green
};

const ORIGEM_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

// Trunca nome do criativo para exibição
function truncateName(name: string, maxLength: number = 25): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + "...";
}

// Tooltip customizado
interface TooltipEntry {
  name?: string;
  value?: string | number;
  color?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 shadow-lg">
      <p className="text-text-primary font-medium text-sm mb-2">{label}</p>
      {payload.map((entry: TooltipEntry, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// Chart principal: Por Criativo (Funil)
export function CriativoPerformanceChart({
  data,
  loading,
}: CriativoPerformanceChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-text-muted">
        <div className="text-center">
          <p className="text-sm">Nenhum dado de criativo disponível</p>
          <p className="text-xs mt-1">
            UTM tracking ainda não populado para este período
          </p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.slice(0, 8).map((item) => ({
    name: truncateName(item.criativo),
    fullName: item.criativo,
    leads: item.leads,
    responderam: item.responderam,
    agendaram: item.agendaram,
    compareceram: item.compareceram,
    fecharam: item.fecharam,
    taxaConversao: item.taxaConversao,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            fontSize={10}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="rect"
            iconSize={10}
            wrapperStyle={{ fontSize: "11px" }}
          />
          <Bar
            dataKey="leads"
            name="Leads"
            fill={COLORS.leads}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="responderam"
            name="Responderam"
            fill={COLORS.responderam}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="agendaram"
            name="Agendaram"
            fill={COLORS.agendaram}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="compareceram"
            name="Compareceram"
            fill={COLORS.compareceram}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="fecharam"
            name="Fecharam"
            fill={COLORS.fecharam}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart secundário: Por Origem (session_source)
export function OrigemPerformanceChart({
  data,
  loading,
}: OrigemPerformanceChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center text-text-muted">
        <p className="text-sm">Nenhum dado de origem disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            type="number"
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="origem"
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="leads"
            name="Leads"
            radius={[0, 4, 4, 0]}
            maxBarSize={30}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ORIGEM_COLORS[index % ORIGEM_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Tabela de métricas detalhadas
interface CriativoMetricsTableProps {
  data: CriativoMetrics[];
  loading?: boolean;
  onCriativoClick?: (criativo: string) => void;
}

export function CriativoMetricsTable({
  data,
  loading,
  onCriativoClick,
}: CriativoMetricsTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-bg-tertiary rounded" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p className="text-sm">Sem dados de criativos para exibir</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-2 px-2 text-text-muted font-medium">
              Criativo
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Leads
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Resp.
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Agend.
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Comp.
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Fech.
            </th>
            <th className="text-right py-2 px-2 text-text-muted font-medium">
              Conv%
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={index}
              onClick={() => onCriativoClick?.(item.criativo)}
              className={`border-b border-border-default/50 hover:bg-bg-tertiary transition-colors ${onCriativoClick ? "cursor-pointer" : ""}`}
            >
              <td className="py-2 px-2 text-text-primary" title={item.criativo}>
                <span className="truncate block max-w-[200px]">
                  {item.criativo}
                </span>
                {item.adId && (
                  <span className="text-xs text-text-muted">
                    ad: {item.adId.slice(-8)}
                  </span>
                )}
              </td>
              <td className="text-right py-2 px-2 text-text-primary font-medium">
                {item.leads}
              </td>
              <td className="text-right py-2 px-2 text-purple-400">
                {item.responderam}
              </td>
              <td className="text-right py-2 px-2 text-amber-400">
                {item.agendaram}
              </td>
              <td className="text-right py-2 px-2 text-emerald-400">
                {item.compareceram}
              </td>
              <td className="text-right py-2 px-2 text-green-400">
                {item.fecharam}
              </td>
              <td className="text-right py-2 px-2">
                <span
                  className={`font-medium ${item.taxaConversao > 10 ? "text-green-400" : item.taxaConversao > 5 ? "text-amber-400" : "text-text-muted"}`}
                >
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

export default CriativoPerformanceChart;
