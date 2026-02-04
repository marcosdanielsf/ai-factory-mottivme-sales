import React, { useState } from 'react';
import {
  Send,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  Inbox,
  TrendingUp,
  Zap,
  Calendar,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { useFollowUpMetrics, FollowUpEvent } from '../hooks/useFollowUpMetrics';
import { useToast } from '../hooks/useToast';
import { useIsMobile } from '../hooks/useMediaQuery';

type StatusFilter = 'all' | 'success' | 'failed' | 'pending';
type PeriodFilter = 'today' | '7d' | '30d' | '90d';

const StatusBadge = ({ status, eventType }: { status: string; eventType: string }) => {
  const getStatusConfig = () => {
    if (status === 'failed') {
      return {
        color: 'bg-accent-error/10 text-accent-error border-accent-error/20',
        dot: 'bg-accent-error',
        label: 'Erro',
        icon: XCircle,
      };
    }
    if (status === 'pending') {
      return {
        color: 'bg-accent-warning/10 text-accent-warning border-accent-warning/20',
        dot: 'bg-accent-warning',
        label: 'Pendente',
        icon: Clock,
      };
    }
    if (eventType === 'replied') {
      return {
        color: 'bg-accent-success/10 text-accent-success border-accent-success/20',
        dot: 'bg-accent-success',
        label: 'Respondeu',
        icon: CheckCircle2,
      };
    }
    return {
      color: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
      dot: 'bg-accent-primary',
      label: 'Enviado',
      icon: Send,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color}`}>
      <Icon size={10} />
      {config.label}
    </div>
  );
};

export const FollowUps = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { metrics, events, loading, error, refetch } = useFollowUpMetrics({
    statusFilter,
    periodFilter,
    searchTerm,
  });

  const handleRefresh = async () => {
    showToast('Atualizando dados...', 'info');
    await refetch();
    showToast('Dados atualizados!', 'success');
  };

  const toggleExpand = (id: string) => {
    setExpandedEvent(expandedEvent === id ? null : id);
  };

  // Filtrar eventos localmente para busca
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      event.lead_name?.toLowerCase().includes(term) ||
      event.lead_phone?.includes(term) ||
      event.message_preview?.toLowerCase().includes(term)
    );
  });

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar follow-ups</h2>
        <p className="text-text-muted max-w-md mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Send className="text-accent-primary" size={isMobile ? 20 : 24} />
            Follow-ups
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Acompanhe os follow-ups enviados e suas respostas.
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary cursor-pointer"
          >
            <option value="today">📅 Hoje</option>
            <option value="7d">📅 7 dias</option>
            <option value="30d">📅 30 dias</option>
            <option value="90d">📅 90 dias</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-text-muted hover:text-accent-primary transition-colors bg-bg-secondary border border-border-default rounded-lg"
            title="Atualizar dados"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              showFilters || statusFilter !== 'all'
                ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary border-border-default'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filtros</span>
            {statusFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-2 uppercase tracking-wider font-medium">
                Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'success', label: 'Sucesso' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'failed', label: 'Erro' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as StatusFilter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === option.value
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Enviados"
          value={loading ? '...' : metrics.totalSent.toLocaleString()}
          subtext="Follow-ups enviados"
          icon={Send}
        />
        <MetricCard
          title="Taxa de Resposta"
          value={loading ? '...' : `${metrics.responseRate}%`}
          subtext="Leads que responderam"
          icon={TrendingUp}
          trend={metrics.responseRate > 30 ? '+' : undefined}
          trendDirection={metrics.responseRate > 30 ? 'up' : 'neutral'}
        />
        <MetricCard
          title="Erros"
          value={loading ? '...' : metrics.totalErrors.toLocaleString()}
          subtext="Falhas no envio"
          icon={AlertCircle}
        />
        <MetricCard
          title="Pendentes"
          value={loading ? '...' : metrics.totalPending.toLocaleString()}
          subtext="Aguardando envio"
          icon={Clock}
        />
      </div>

      {/* Insight Banner */}
      {metrics.avgFollowUpsPerLead > 0 && (
        <div className="p-3 md:p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-accent-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium">
                Média de {metrics.avgFollowUpsPerLead} follow-ups por lead
              </p>
              <p className="text-xs text-text-muted mt-1">
                Leads que recebem 2-3 follow-ups têm 67% mais chance de responder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input
            type="text"
            placeholder={isMobile ? 'Buscar...' : 'Buscar por nome, telefone ou mensagem...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-secondary border border-border-default rounded px-3 pl-9 py-2 md:py-1.5 text-sm text-text-primary focus:border-accent-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="border border-border-default rounded-xl bg-bg-secondary overflow-hidden shadow-sm">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border-default bg-bg-tertiary/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <div className="col-span-1">FU #</div>
            <div className="col-span-3">Lead / Contato</div>
            <div className="col-span-4">Mensagem</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Data/Hora</div>
          </div>
        )}

        {loading && events.length === 0 ? (
          <div className={isMobile ? 'space-y-3 p-3' : 'divide-y divide-border-default'}>
            {[...Array(6)].map((_, i) =>
              isMobile ? (
                <div key={i} className="bg-bg-tertiary/30 rounded-lg p-4 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-bg-tertiary rounded w-20" />
                    <div className="h-4 bg-bg-tertiary rounded w-16" />
                  </div>
                  <div className="h-4 bg-bg-tertiary rounded w-32" />
                  <div className="h-3 bg-bg-tertiary rounded w-full" />
                </div>
              ) : (
                <div key={i} className="grid grid-cols-12 gap-4 p-5 animate-pulse">
                  <div className="col-span-1">
                    <div className="h-6 bg-bg-tertiary rounded w-8" />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <div className="h-4 bg-bg-tertiary rounded w-32" />
                    <div className="h-3 bg-bg-tertiary rounded w-24" />
                  </div>
                  <div className="col-span-4">
                    <div className="h-4 bg-bg-tertiary rounded w-full" />
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-bg-tertiary rounded-full w-20" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="h-4 bg-bg-tertiary rounded w-16" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : filteredEvents.length > 0 ? (
          isMobile ? (
            /* Mobile: Cards */
            <div className="divide-y divide-border-default">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 hover:bg-bg-tertiary/50 transition-all"
                  onClick={() => toggleExpand(event.id)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                          #{event.follow_up_number}
                        </span>
                        <span className="text-sm font-bold text-text-primary truncate">
                          {event.lead_name || 'Lead sem nome'}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {event.lead_phone}
                      </span>
                    </div>
                    <StatusBadge status={event.status} eventType={event.event_type} />
                  </div>

                  {/* Preview Message */}
                  <p className="text-xs text-text-secondary truncate italic mb-2">
                    "{event.message_preview || 'Sem prévia disponível'}"
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>
                        {new Date(event.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {expandedEvent === event.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedEvent === event.id && (
                    <div className="mt-3 pt-3 border-t border-border-default space-y-2 animate-in slide-in-from-top-2">
                      <div className="bg-bg-tertiary/50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Mensagem Completa</p>
                        <p className="text-sm text-text-secondary">{event.message_preview || 'Sem conteúdo'}</p>
                      </div>
                      {event.error_message && (
                        <div className="bg-accent-error/5 border border-accent-error/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-accent-error uppercase mb-1">Erro</p>
                          <p className="text-sm text-accent-error">{event.error_message}</p>
                        </div>
                      )}
                      {event.scheduled_for && (
                        <div className="bg-accent-warning/5 border border-accent-warning/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-accent-warning uppercase mb-1">Agendado para</p>
                          <p className="text-sm text-accent-warning">
                            {new Date(event.scheduled_for).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: Table */
            <div className="divide-y divide-border-default">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-bg-tertiary transition-all cursor-pointer group"
                  onClick={() => toggleExpand(event.id)}
                >
                  <div className="col-span-1">
                    <span className="text-sm font-bold text-accent-primary bg-accent-primary/10 px-2 py-1 rounded">
                      #{event.follow_up_number}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                        {event.lead_name || 'Lead sem nome'}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {event.lead_phone}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-bg-tertiary border border-border-default text-text-muted group-hover:text-accent-primary transition-colors">
                        <MessageSquare size={12} />
                      </div>
                      <p className="text-sm text-text-secondary truncate italic">
                        "{event.message_preview || 'Sem prévia'}"
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <StatusBadge status={event.status} eventType={event.event_type} />
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-text-primary">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(event.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {expandedEvent === event.id && (
                    <div className="col-span-12 pt-4 border-t border-border-default mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg-tertiary/50 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-text-muted uppercase mb-2">Mensagem Completa</p>
                          <p className="text-sm text-text-secondary">{event.message_preview || 'Sem conteúdo'}</p>
                        </div>
                        <div className="space-y-2">
                          {event.error_message && (
                            <div className="bg-accent-error/5 border border-accent-error/20 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-accent-error uppercase mb-1">Erro</p>
                              <p className="text-sm text-accent-error">{event.error_message}</p>
                            </div>
                          )}
                          {event.scheduled_for && (
                            <div className="bg-accent-warning/5 border border-accent-warning/20 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-accent-warning uppercase mb-1">Agendado para</p>
                              <p className="text-sm text-accent-warning">
                                {new Date(event.scheduled_for).toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div className="bg-bg-tertiary/50 rounded-lg p-3">
                            <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Lead ID</p>
                            <p className="text-sm text-text-secondary font-mono">{event.lead_id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center">
            <div className="w-14 md:w-16 h-14 md:h-16 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
              <Inbox size={isMobile ? 28 : 32} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-text-primary">Nenhum follow-up encontrado</h3>
            <p className="text-text-muted text-xs md:text-sm max-w-xs mt-1">
              {searchTerm
                ? `Nenhum resultado para "${searchTerm}". Tente outra busca.`
                : 'Os follow-ups aparecerão aqui conforme forem enviados.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-sm text-accent-primary hover:underline font-medium"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
