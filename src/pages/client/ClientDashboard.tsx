import React, { useMemo } from 'react';
import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Bot,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Metric Card Component
const MetricCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral',
  color = 'primary'
}: {
  icon: any;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'info';
}) => {
  const colors = {
    primary: 'bg-accent-primary/10 text-accent-primary',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    info: 'bg-blue-500/10 text-blue-400',
  };

  const changeColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-text-muted',
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-muted mt-1">{label}</p>
      </div>
    </div>
  );
};

// Quick Action Card
const QuickAction = ({
  icon: Icon,
  title,
  description,
  to,
  color = 'primary'
}: {
  icon: any;
  title: string;
  description: string;
  to: string;
  color?: string;
}) => {
  const colors: Record<string, string> = {
    primary: 'from-accent-primary to-purple-500',
    success: 'from-emerald-500 to-teal-500',
    warning: 'from-amber-500 to-orange-500',
  };

  return (
    <Link
      to={to}
      className="group flex items-center gap-4 p-5 bg-bg-secondary border border-border-default rounded-xl hover:border-accent-primary/50 transition-all"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      <ArrowRight size={20} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
    </Link>
  );
};

// Recent Activity Item
const ActivityItem = ({
  type,
  message,
  time
}: {
  type: 'lead' | 'appointment' | 'message' | 'agent';
  message: string;
  time: string;
}) => {
  const icons = {
    lead: Users,
    appointment: Calendar,
    message: MessageSquare,
    agent: Bot,
  };

  const colors = {
    lead: 'bg-blue-500/10 text-blue-400',
    appointment: 'bg-emerald-500/10 text-emerald-400',
    message: 'bg-purple-500/10 text-purple-400',
    agent: 'bg-amber-500/10 text-amber-400',
  };

  const Icon = icons[type];

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-bg-tertiary rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${colors[type]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{message}</p>
        <p className="text-xs text-text-muted mt-0.5">{time}</p>
      </div>
    </div>
  );
};

export const ClientDashboard = () => {
  const { user } = useAuth();

  // Mock data - em producao viria do banco
  const metrics = useMemo(() => ({
    totalLeads: 127,
    leadsThisWeek: 23,
    appointments: 8,
    appointmentsThisWeek: 3,
    messages: 342,
    conversionRate: '18%',
  }), []);

  const agentStatus = useMemo(() => ({
    name: 'Maya',
    version: 'v5.2.1',
    status: 'active',
    score: 8.7,
    lastUpdate: '2 dias atras',
  }), []);

  const recentActivity = [
    { type: 'lead' as const, message: 'Novo lead: Maria Silva demonstrou interesse', time: 'Ha 15 min' },
    { type: 'appointment' as const, message: 'Agendamento confirmado para amanha 14h', time: 'Ha 1 hora' },
    { type: 'message' as const, message: 'Conversa encerrada com Joao Santos', time: 'Ha 2 horas' },
    { type: 'agent' as const, message: 'Agente tratou objecao de preco com sucesso', time: 'Ha 3 horas' },
    { type: 'lead' as const, message: 'Lead Carlos Souza entrou no funil', time: 'Ha 4 horas' },
  ];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
          {greeting}, {userName}! 👋
        </h1>
        <p className="text-text-secondary mt-1">
          Aqui esta o resumo do seu agente de vendas
        </p>
      </div>

      {/* Agent Status Banner */}
      <div className="bg-gradient-to-r from-accent-primary/10 via-purple-500/10 to-cyan-500/10 border border-accent-primary/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {agentStatus.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">{agentStatus.name}</h2>
                <span className="text-sm text-text-muted font-mono">{agentStatus.version}</span>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
                  <CheckCircle size={12} />
                  Ativo
                </span>
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                Score: <span className="text-accent-primary font-semibold">{agentStatus.score}/10</span> •
                Atualizado {agentStatus.lastUpdate}
              </p>
            </div>
          </div>
          <Link
            to="/cliente/agente"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <Sparkles size={18} />
            Gerenciar Agente
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Total de Leads"
          value={metrics.totalLeads}
          change={`+${metrics.leadsThisWeek} esta semana`}
          changeType="positive"
          color="info"
        />
        <MetricCard
          icon={Calendar}
          label="Agendamentos"
          value={metrics.appointments}
          change={`+${metrics.appointmentsThisWeek} esta semana`}
          changeType="positive"
          color="success"
        />
        <MetricCard
          icon={MessageSquare}
          label="Mensagens"
          value={metrics.messages}
          color="primary"
        />
        <MetricCard
          icon={TrendingUp}
          label="Taxa de Conversao"
          value={metrics.conversionRate}
          change="+2%"
          changeType="positive"
          color="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Acoes Rapidas</h3>
          <div className="space-y-3">
            <QuickAction
              icon={Bot}
              title="Editar Meu Agente"
              description="Ajuste o comportamento do seu agente de vendas"
              to="/cliente/agente"
              color="primary"
            />
            <QuickAction
              icon={MessageSquare}
              title="Ver Conversas"
              description="Acompanhe as interacoes com seus leads"
              to="/cliente/conversas"
              color="success"
            />
            <QuickAction
              icon={Calendar}
              title="Agendamentos"
              description="Veja os proximos agendamentos"
              to="/cliente/agendamentos"
              color="warning"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Atividade Recente</h3>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4 space-y-1">
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={index}
                type={activity.type}
                message={activity.message}
                time={activity.time}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
