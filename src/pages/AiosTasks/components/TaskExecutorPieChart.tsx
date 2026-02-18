import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutorDistribution } from '../../../hooks/aios/useAiosTasksExpanded';

interface TaskExecutorPieChartProps {
  data: ExecutorDistribution[];
  loading: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ExecutorDistribution;
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 text-sm shadow-lg">
      <p className="text-text-primary font-semibold mb-1">{item.label}</p>
      <p className="text-text-muted">{item.count} tasks</p>
      <p className="text-text-muted">${item.cost.toFixed(4)} custo</p>
    </div>
  );
}

export function TaskExecutorPieChart({ data, loading }: TaskExecutorPieChartProps) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Distribuicao por Executor</h3>
      {loading ? (
        <div className="h-52 animate-pulse bg-bg-tertiary rounded" />
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-text-muted text-sm">
          Sem dados no periodo
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="count"
              nameKey="label"
            >
              {data.map((entry) => (
                <Cell key={entry.executor_type} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-text-secondary text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
