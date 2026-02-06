import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const MetricCard = ({
  title,
  value,
  change,
  changeType,
  icon: Icon
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: any;
}) => (
  <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-accent-primary/10 rounded-lg">
        <Icon size={20} className="text-accent-primary" />
      </div>
      <span className={`flex items-center gap-1 text-sm font-medium ${
        changeType === 'positive' ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {change}
      </span>
    </div>
    <p className="text-3xl font-bold text-text-primary">{value}</p>
    <p className="text-sm text-text-muted mt-1">{title}</p>
  </div>
);

const ProgressBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const ClientMetricas = () => {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
          <BarChart3 className="text-accent-primary" size={28} />
          Metricas
        </h1>
        <p className="text-text-secondary mt-1">
          Acompanhe o desempenho do seu agente de vendas
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Leads este mes"
          value="127"
          change="+23%"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Agendamentos"
          value="34"
          change="+12%"
          changeType="positive"
          icon={Calendar}
        />
        <MetricCard
          title="Taxa de resposta"
          value="89%"
          change="+5%"
          changeType="positive"
          icon={MessageSquare}
        />
        <MetricCard
          title="Conversao"
          value="18%"
          change="-2%"
          changeType="negative"
          icon={Target}
        />
      </div>

      {/* Performance Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Funil de Conversao */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Funil de Conversao</h3>
          <div className="space-y-4">
            <ProgressBar label="Leads recebidos" value={127} max={127} color="bg-blue-500" />
            <ProgressBar label="Responderam" value={113} max={127} color="bg-cyan-500" />
            <ProgressBar label="Qualificados" value={78} max={127} color="bg-purple-500" />
            <ProgressBar label="Agendados" value={34} max={127} color="bg-amber-500" />
            <ProgressBar label="Compareceram" value={28} max={127} color="bg-emerald-500" />
          </div>
        </div>

        {/* Score do Agente */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Score do Agente</h3>
          <div className="space-y-4">
            <ProgressBar label="Tom de voz" value={9} max={10} color="bg-emerald-500" />
            <ProgressBar label="Engajamento" value={8} max={10} color="bg-emerald-500" />
            <ProgressBar label="Tratamento de objecoes" value={7} max={10} color="bg-amber-500" />
            <ProgressBar label="Qualificacao" value={8} max={10} color="bg-emerald-500" />
            <ProgressBar label="Fechamento" value={7} max={10} color="bg-amber-500" />
          </div>
          <div className="mt-6 pt-6 border-t border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Score Geral</span>
              <span className="text-2xl font-bold text-emerald-400">8.7/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Evolucao Mensal</h3>
        <div className="h-64 flex items-center justify-center text-text-muted">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
            <p>Grafico de evolucao em breve</p>
          </div>
        </div>
      </div>
    </div>
  );
};
