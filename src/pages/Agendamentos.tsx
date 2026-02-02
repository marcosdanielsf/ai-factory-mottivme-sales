import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  X,
  Phone,
  User,
  Clock,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CalendarRange,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  MessageCircle,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAgendamentos, getOrigem, type Agendamento, type AgendamentosFilters } from '../hooks/useAgendamentos';
import { useAgendamentosStats } from '../hooks/useAgendamentosStats';
import { PeriodFilter } from './SalesOps/components/PeriodFilter';
import { ClientSelector } from './SalesOps/components/ClientSelector';
import { salesOpsDAO, type ClientInfo } from '../lib/supabase-sales-ops';

// ==========================================
// TYPES
// ==========================================
type MetricType = 'hoje' | 'semana' | 'mes' | 'comparecimento' | 'conversao' | 'leads';
type OrigemType = 'trafego' | 'social_selling' | null;

// ==========================================
// RATE HEALTH HELPERS
// ==========================================
// Taxa de Conversão: <20% crítico, 25% mínimo, 30% média, 35%+ ideal
const getConversaoHealth = (rate: number): { color: string; label: string; bgClass: string } => {
  if (rate >= 35) return { color: 'text-emerald-400', label: 'Ideal', bgClass: 'bg-emerald-500/10' };
  if (rate >= 30) return { color: 'text-green-400', label: 'Bom', bgClass: 'bg-green-500/10' };
  if (rate >= 25) return { color: 'text-yellow-400', label: 'Mínimo', bgClass: 'bg-yellow-500/10' };
  if (rate >= 20) return { color: 'text-orange-400', label: 'Baixo', bgClass: 'bg-orange-500/10' };
  return { color: 'text-red-400', label: 'Crítico', bgClass: 'bg-red-500/10' };
};

// Taxa de Comparecimento: <50% crítico, 50%+ OK
const getComparecimentoHealth = (rate: number): { color: string; label: string; bgClass: string } => {
  if (rate >= 70) return { color: 'text-emerald-400', label: 'Excelente', bgClass: 'bg-emerald-500/10' };
  if (rate >= 50) return { color: 'text-green-400', label: 'OK', bgClass: 'bg-green-500/10' };
  return { color: 'text-red-400', label: 'Crítico', bgClass: 'bg-red-500/10' };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return 'Sem telefone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

const formatDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// ==========================================
// METRIC CARD COMPONENT
// ==========================================
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  suffix?: string;
  trend?: number;
  onClick?: () => void;
  isActive?: boolean;
  color?: string;
  healthLabel?: string;
  healthColor?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  suffix = '',
  trend,
  onClick,
  isActive,
  color = 'blue',
  healthLabel,
  healthColor,
  subtitle,
}) => {
  const colorClasses: Record<string, { bg: string; icon: string; active: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', active: 'ring-blue-500' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', active: 'ring-green-500' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', active: 'ring-orange-500' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', active: 'ring-purple-500' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', active: 'ring-red-500' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', active: 'ring-yellow-500' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', active: 'ring-emerald-500' },
    gray: { bg: 'bg-gray-500/10', icon: 'text-gray-400', active: 'ring-gray-500' },
  };
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6 cursor-pointer hover:bg-bg-hover transition-all ${
        isActive ? `ring-2 ${colors.active}` : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <span className={colors.icon}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-text-primary mb-1">
        {value}
        {suffix && <span className="text-lg text-text-muted ml-1">{suffix}</span>}
        {healthLabel && (
          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${healthColor || 'text-gray-400'} bg-current/10`}>
            {healthLabel}
          </span>
        )}
      </p>
      <p className="text-sm text-text-muted">{title}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
    </div>
  );
};

// ==========================================
// LEAD DETAIL MODAL
// ==========================================
interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Agendamento | null;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead }) => {
  if (!isOpen || !lead) return null;

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Compareceu' },
    no_show: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Não compareceu' },
    booked: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Agendado' },
  };

  const status = lead.status?.toLowerCase() || 'booked';
  const statusConfig = statusColors[status] || statusColors.booked;
  const origem = getOrigem(lead.fonte_do_lead_bposs);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl max-w-md w-full shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
            <h3 className="text-lg font-semibold text-text-primary">Detalhes do Agendamento</h3>
            <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-lg transition-colors">
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Nome */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <User size={24} className="text-accent-primary" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-lg">
                  {lead.contato_principal || 'Sem nome'}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">Telefone</p>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-text-secondary" />
                  <span className="text-sm text-text-primary">{formatPhone(lead.celular_contato)}</span>
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">Data/Hora</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-secondary" />
                  <span className="text-sm text-text-primary">{formatDate(lead.scheduled_at)}</span>
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">Origem</p>
                <span className={`text-sm ${origem === 'trafego' ? 'text-orange-400' : 'text-pink-400'}`}>
                  {origem === 'trafego' ? '📣 Tráfego Pago' : '🤝 Social Selling'}
                </span>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">Fonte</p>
                <span className="text-sm text-text-primary truncate">
                  {lead.fonte_do_lead_bposs || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-default flex gap-3">
            {lead.celular_contato && (
              <button
                onClick={() => {
                  const cleaned = (lead.celular_contato || '').replace(/\D/g, '');
                  window.open(`https://wa.me/${cleaned}`, '_blank');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-hover hover:bg-bg-tertiary text-text-primary text-sm rounded-lg transition-colors border border-border-default"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </>
  );
};

// ==========================================
// LEADS DRAWER
// ==========================================
interface LeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filters: AgendamentosFilters;
}

const LeadsDrawer: React.FC<LeadsDrawerProps> = ({ isOpen, onClose, title, filters }) => {
  const { agendamentos, loading, error, totalCount } = useAgendamentos(filters);
  const [selectedLead, setSelectedLead] = useState<Agendamento | null>(null);

  if (!isOpen) return null;

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Compareceu' },
    no_show: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Não compareceu' },
    booked: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Agendado' },
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-bg-secondary border-l border-border-default z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-default">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <p className="text-sm text-text-muted">
              {loading ? 'Carregando...' : `${totalCount} agendamentos`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-bg-tertiary rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-bg-hover rounded w-3/4 mb-3" />
                  <div className="h-3 bg-bg-hover rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle size={48} className="mx-auto text-red-400 mb-4" />
              <p className="text-text-muted">{error}</p>
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck size={48} className="mx-auto text-text-muted mb-4" />
              <p className="text-text-muted">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentos.map((lead) => {
                const status = lead.status?.toLowerCase() || 'booked';
                const statusConfig = statusColors[status] || statusColors.booked;
                const origem = getOrigem(lead.fonte_do_lead_bposs);

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-bg-tertiary border border-border-default rounded-lg p-4 cursor-pointer hover:bg-bg-hover transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          <User size={18} className="text-accent-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {lead.contato_principal || 'Sem nome'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted ml-13">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(lead.scheduled_at)}</span>
                      </div>
                      {origem && (
                        <span className={origem === 'trafego' ? 'text-orange-400' : 'text-pink-400'}>
                          {origem === 'trafego' ? '📣 Tráfego' : '🤝 Social'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={selectedLead !== null}
        onClose={() => setSelectedLead(null)}
        lead={selectedLead}
      />

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export const Agendamentos: React.FC = () => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedOrigem, setSelectedOrigem] = useState<OrigemType>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerFilters, setDrawerFilters] = useState<AgendamentosFilters>({});
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await salesOpsDAO.getClients();
        setClients(data);
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const { stats, porDia, porOrigem, loading, error, refetch } = useAgendamentosStats(
    selectedLocationId,
    periodDays
  );

  // Gerar filtros para drawer baseado no estado atual
  const buildFilters = useCallback((): AgendamentosFilters => {
    const filters: AgendamentosFilters = {
      locationId: selectedLocationId,
    };

    if (selectedOrigem) {
      filters.origem = selectedOrigem;
    }

    if (selectedDay) {
      filters.day = selectedDay;
    }

    return filters;
  }, [selectedLocationId, selectedOrigem, selectedDay]);

  // Handlers para clicks
  const handleCardClick = useCallback((metric: MetricType) => {
    const now = new Date();
    const filters = buildFilters();

    setActiveMetric(metric);

    if (metric === 'hoje') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      filters.startDate = today;
      filters.endDate = todayEnd;
      setDrawerTitle('Agendamentos Hoje');
    } else if (metric === 'semana') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filters.startDate = weekAgo;
      filters.endDate = now;
      setDrawerTitle('Agendamentos da Semana');
    } else if (metric === 'mes') {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      filters.startDate = monthAgo;
      filters.endDate = now;
      setDrawerTitle('Agendamentos do Mês');
    } else if (metric === 'comparecimento') {
      filters.status = 'completed';
      setDrawerTitle('Comparecimentos');
    }

    setDrawerFilters(filters);
    setDrawerOpen(true);
  }, [buildFilters]);

  const handleBarClick = useCallback((data: any) => {
    if (!data?.data) return;
    const day = data.data;
    setSelectedDay(day);
    setActiveMetric(null);

    const filters = buildFilters();
    filters.day = day;
    setDrawerFilters(filters);
    setDrawerTitle(`Agendamentos em ${formatDayLabel(day)}`);
    setDrawerOpen(true);
  }, [buildFilters]);

  const handlePieClick = useCallback((data: any) => {
    if (!data?.origem) return;
    const origem = data.origem as OrigemType;
    setSelectedOrigem(origem);
    setActiveMetric(null);

    const filters = buildFilters();
    filters.origem = origem;
    setDrawerFilters(filters);
    setDrawerTitle(origem === 'trafego' ? '📣 Tráfego Pago' : '🤝 Social Selling');
    setDrawerOpen(true);
  }, [buildFilters]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveMetric(null);
    setSelectedDay(null);
  }, []);

  // Dados do gráfico de donut
  const donutData = useMemo(() => {
    return porOrigem.map((item) => ({
      name: item.origem === 'trafego' ? 'Tráfego Pago' : 'Social Selling',
      value: item.quantidade,
      origem: item.origem,
    }));
  }, [porOrigem]);

  const DONUT_COLORS = ['#f97316', '#ec4899']; // orange, pink

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border-default rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-text-primary">{formatDayLabel(label)}</p>
          <p className="text-sm text-accent-primary">{payload[0].value} agendamentos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary">
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CalendarCheck size={20} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">Dashboard de Agendamentos</h1>
                <p className="text-sm text-text-muted">Acompanhe seus agendamentos e taxas de comparecimento</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <PeriodFilter selected={periodDays} onChange={setPeriodDays} />
              <ClientSelector 
                clients={clients}
                selectedId={selectedLocationId}
                onChange={setSelectedLocationId}
                isLoading={clientsLoading}
              />
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Metric Cards - Row 1: Volumes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Leads"
            value={stats.totalLeads.toLocaleString()}
            icon={<User size={20} />}
            color="gray"
            onClick={() => handleCardClick('leads')}
            isActive={activeMetric === 'leads'}
          />
          <MetricCard
            title="Total Agendados"
            value={stats.totalAgendados.toLocaleString()}
            icon={<CalendarCheck size={20} />}
            color="blue"
            onClick={() => handleCardClick('mes')}
            isActive={activeMetric === 'mes'}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={stats.taxaConversao}
            suffix="%"
            icon={<TrendingUp size={20} />}
            color={stats.taxaConversao >= 35 ? 'emerald' : stats.taxaConversao >= 25 ? 'green' : stats.taxaConversao >= 20 ? 'yellow' : 'red'}
            healthLabel={getConversaoHealth(stats.taxaConversao).label}
            healthColor={getConversaoHealth(stats.taxaConversao).color}
            subtitle="Meta: 25-35%"
            onClick={() => handleCardClick('conversao')}
            isActive={activeMetric === 'conversao'}
          />
          <MetricCard
            title="Taxa de Comparecimento"
            value={stats.taxaComparecimento}
            suffix="%"
            icon={<CheckCircle size={20} />}
            color={stats.taxaComparecimento >= 50 ? 'green' : 'red'}
            healthLabel={getComparecimentoHealth(stats.taxaComparecimento).label}
            healthColor={getComparecimentoHealth(stats.taxaComparecimento).color}
            subtitle="Meta: ≥50%"
            onClick={() => handleCardClick('comparecimento')}
            isActive={activeMetric === 'comparecimento'}
          />
        </div>

        {/* Metric Cards - Row 2: Por Período */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Agendamentos Hoje"
            value={stats.hoje}
            icon={<CalendarDays size={20} />}
            color="blue"
            onClick={() => handleCardClick('hoje')}
            isActive={activeMetric === 'hoje'}
          />
          <MetricCard
            title="Últimos 7 dias"
            value={stats.semana}
            icon={<CalendarRange size={20} />}
            color="purple"
            onClick={() => handleCardClick('semana')}
            isActive={activeMetric === 'semana'}
          />
          <MetricCard
            title="Últimos 30 dias"
            value={stats.mes}
            icon={<Calendar size={20} />}
            color="orange"
            onClick={() => handleCardClick('mes')}
            isActive={activeMetric === 'mes'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart - Agendamentos por Dia */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Agendamentos por Dia (últimos 30 dias)
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-text-muted" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="data"
                    tickFormatter={formatDayLabel}
                    tick={{ fontSize: 10, fill: '#888' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="quantidade"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={handleBarClick}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut Chart - Origem */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Origem dos Leads</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-text-muted" />
              </div>
            ) : donutData.every((d) => d.value === 0) ? (
              <div className="h-64 flex flex-col items-center justify-center text-text-muted">
                <CalendarCheck size={48} className="mb-4 opacity-50" />
                <p>Sem dados de origem</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={handlePieClick}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-text-primary text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/20 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.totalCompleted}</p>
            <p className="text-sm text-text-muted">Compareceram</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 mx-auto mb-3 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.totalNoShow}</p>
            <p className="text-sm text-text-muted">Não Compareceram</p>
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 mx-auto mb-3 flex items-center justify-center">
              <Calendar size={20} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.totalBooked}</p>
            <p className="text-sm text-text-muted">Pendentes</p>
          </div>
        </div>
      </div>

      {/* Leads Drawer */}
      <LeadsDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={drawerTitle}
        filters={drawerFilters}
      />
    </div>
  );
};

export default Agendamentos;
