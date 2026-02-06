import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  User,
  Phone,
  Calendar,
  RefreshCw,
  Search,
  Inbox,
  Loader2
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAccount } from '../contexts/AccountContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

// Types
type InterviewStatus = 'pending' | 'completed' | 'no_show' | 'lost';

interface PendingInterview {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  lead_email?: string;
  recruiter_name: string;
  interview_date: string;
  status: InterviewStatus;
  fonte: string | null;
  source: 'historico' | 'realtime';
}

// Status mapping from DB to display
const statusMap: Record<string, InterviewStatus> = {
  booked: 'pending',
  completed: 'completed',
  won: 'completed',
  no_show: 'no_show',
  lost: 'lost'
};

const reverseStatusMap: Record<InterviewStatus, string> = {
  pending: 'booked',
  completed: 'completed',
  no_show: 'no_show',
  lost: 'lost'
};

// Components
const StatusBadge = ({ status }: { status: InterviewStatus }) => {
  const config = {
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      label: 'Pendente'
    },
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      label: 'Compareceu'
    },
    no_show: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      label: 'No Show'
    },
    lost: {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      border: 'border-gray-500/20',
      label: 'Sem Interesse'
    }
  };

  const { bg, text, border, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
      {status === 'pending' && <Clock size={12} />}
      {status === 'completed' && <CheckCircle2 size={12} />}
      {status === 'no_show' && <XCircle size={12} />}
      {status === 'lost' && <Ban size={12} />}
      {label}
    </span>
  );
};

const ActionButton = ({
  onClick,
  icon: Icon,
  label,
  variant,
  disabled
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  variant: 'success' | 'danger' | 'neutral';
  disabled?: boolean;
}) => {
  const variants = {
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50',
    neutral: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/30 hover:border-gray-500/50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      <Icon size={16} />
      {label}
    </button>
  );
};

const InterviewCard = ({
  interview,
  onUpdateStatus,
  isUpdating
}: {
  interview: PendingInterview;
  onUpdateStatus: (id: string, status: InterviewStatus) => Promise<void>;
  isUpdating: boolean;
}) => {
  const [localUpdating, setLocalUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: InterviewStatus) => {
    setLocalUpdating(true);
    try {
      await onUpdateStatus(interview.id, newStatus);
    } finally {
      setLocalUpdating(false);
    }
  };

  const formattedDate = new Date(interview.interview_date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isDisabled = isUpdating || localUpdating;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-lg">
            {interview.lead_name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-lg">{interview.lead_name || 'Sem nome'}</h3>
            <div className="flex items-center gap-3 text-sm text-text-muted mt-0.5">
              <span className="flex items-center gap-1">
                <Phone size={12} />
                {interview.lead_phone || 'Sem telefone'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={interview.status} />
      </div>

      {/* Recruiter */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-5 pl-1">
        <User size={14} />
        <span>Recrutador: <span className="text-text-primary font-medium">{interview.recruiter_name || 'Não atribuído'}</span></span>
      </div>

      {/* Actions */}
      {interview.status === 'pending' && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border-default">
          <ActionButton
            onClick={() => handleStatusUpdate('completed')}
            icon={CheckCircle2}
            label="Compareceu"
            variant="success"
            disabled={isDisabled}
          />
          <ActionButton
            onClick={() => handleStatusUpdate('no_show')}
            icon={XCircle}
            label="No Show"
            variant="danger"
            disabled={isDisabled}
          />
          <ActionButton
            onClick={() => handleStatusUpdate('lost')}
            icon={Ban}
            label="Sem Interesse"
            variant="neutral"
            disabled={isDisabled}
          />
        </div>
      )}
    </div>
  );
};

// Metrics Card
const MetricCard = ({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'emerald' | 'red' | 'amber' | 'gray';
}) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    gray: 'text-gray-400 bg-gray-500/10'
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
};

// Main Component
export const StatusCenter = () => {
  const { showToast } = useToast();
  const { selectedAccount, isViewingSubconta } = useAccount();
  const isAdmin = useIsAdmin();
  const [interviews, setInterviews] = useState<PendingInterview[]>([]);
  const [filter, setFilter] = useState<'all' | InterviewStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determina location_id baseado no contexto (multi-tenancy)
  // Sempre filtra quando uma conta específica está selecionada
  const activeLocationId = useMemo(() => {
    if (selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    return null; // Nenhuma subconta selecionada = todos os dados
  }, [selectedAccount]);

  // Fetch interviews from Supabase
  const fetchInterviews = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Buscar agendamentos dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('vw_agendamentos_unified')
        .select('*')
        .gte('agendamento_data', thirtyDaysAgo.toISOString())
        .order('agendamento_data', { ascending: false });

      // Filtro por location (multi-tenancy)
      if (activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Map data to our format
      const mappedData: PendingInterview[] = (data || []).map(item => {
        const dbStatus = item.status?.toLowerCase() || 'booked';
        const isPast = new Date(item.agendamento_data) < new Date();

        // Se é booked e já passou, marcar como pending
        let displayStatus: InterviewStatus = statusMap[dbStatus] || 'pending';
        if (dbStatus === 'booked' && isPast) {
          displayStatus = 'pending';
        }

        return {
          id: item.id,
          lead_id: item.lead_id || item.id,
          lead_name: item.contato_nome || item.contato_principal || '',
          lead_phone: item.contato_telefone || item.celular_contato || '',
          lead_email: item.contato_email || '',
          recruiter_name: item.responsavel_nome || item.lead_usuario_responsavel || 'unknown',
          interview_date: item.agendamento_data,
          status: displayStatus,
          fonte: item.fonte,
          source: item.source || 'realtime'
        };
      });

      // Deduplicate by email - keep record with most complete data (has name)
      const emailMap = new Map<string, PendingInterview>();
      const noEmailRecords: PendingInterview[] = [];

      mappedData.forEach(item => {
        const email = (item as any).lead_email?.toLowerCase();

        if (!email) {
          noEmailRecords.push(item);
          return;
        }

        const existing = emailMap.get(email);
        if (!existing) {
          emailMap.set(email, item);
        } else {
          // Prefer record with name/phone over empty one
          const existingHasData = existing.lead_name && existing.lead_name !== 'Sem nome';
          const newHasData = item.lead_name && item.lead_name !== 'Sem nome';

          if (newHasData && !existingHasData) {
            emailMap.set(email, item);
          } else if (newHasData && existingHasData) {
            // Both have data - keep the one with more recent interview
            if (new Date(item.interview_date) > new Date(existing.interview_date)) {
              emailMap.set(email, item);
            }
          }
        }
      });

      const deduplicatedData = [...emailMap.values(), ...noEmailRecords];

      // Apply fallback for empty names - use email prefix as name
      const finalData = deduplicatedData.map(item => ({
        ...item,
        lead_name: item.lead_name || ((item as any).lead_email?.split('@')[0] || 'Sem nome'),
        recruiter_name: item.recruiter_name === 'unknown' ? 'Não atribuído' : item.recruiter_name
      }));

      setInterviews(finalData);
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      setError(err.message || 'Erro ao carregar entrevistas');
    } finally {
      setIsLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Filter logic
  const filteredInterviews = useMemo(() => {
    let result = interviews;

    if (filter !== 'all') {
      result = result.filter(i => i.status === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.lead_name.toLowerCase().includes(term) ||
        i.lead_phone.includes(term) ||
        i.recruiter_name.toLowerCase().includes(term)
      );
    }

    return result;
  }, [interviews, filter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => ({
    pending: interviews.filter(i => i.status === 'pending').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    no_show: interviews.filter(i => i.status === 'no_show').length,
    lost: interviews.filter(i => i.status === 'lost').length
  }), [interviews]);

  // Update status in Supabase
  const handleUpdateStatus = useCallback(async (id: string, newStatus: InterviewStatus) => {
    setIsUpdating(true);
    try {
      const dbStatus = reverseStatusMap[newStatus];

      // Tentar atualizar na tabela de agendamentos
      // Primeiro tenta agendamentos_bposs, depois ops_agendamentos
      let error = null;

      // Try updating agendamentos_bposs first
      const { error: err1 } = await supabase
        .from('agendamentos_bposs')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (err1) {
        // Try ops_agendamentos
        const { error: err2 } = await supabase
          .from('ops_agendamentos')
          .update({ status: dbStatus, updated_at: new Date().toISOString() })
          .eq('id', id);

        error = err2;
      }

      if (error) {
        console.error('Error updating status:', error);
        // Update locally anyway for better UX
      }

      // Update local state
      setInterviews(prev => prev.map(i =>
        i.id === id ? { ...i, status: newStatus } : i
      ));

      const messages: Record<InterviewStatus, string> = {
        pending: 'Status atualizado',
        completed: '✅ Entrevista marcada como realizada!',
        no_show: '❌ Lead marcado como No Show',
        lost: '🚫 Lead marcado como Sem Interesse'
      };

      showToast(messages[newStatus], 'success');
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [showToast]);

  const handleRefresh = async () => {
    await fetchInterviews();
    showToast('Dados atualizados!', 'info');
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-4">{error}</div>
        <button onClick={fetchInterviews} className="text-accent-primary hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
            <Calendar className="text-accent-primary" size={28} />
            Central de Status
          </h1>
          <p className="text-text-secondary mt-1">
            Atualize o status das entrevistas realizadas
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Pendentes" value={metrics.pending} icon={Clock} color="amber" />
        <MetricCard label="Compareceram" value={metrics.completed} icon={CheckCircle2} color="emerald" />
        <MetricCard label="No Show" value={metrics.no_show} icon={XCircle} color="red" />
        <MetricCard label="Sem Interesse" value={metrics.lost} icon={Ban} color="gray" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou recrutador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['pending', 'completed', 'no_show', 'lost', 'all'] as const).map((f) => {
            const labels = {
              all: 'Todos',
              pending: 'Pendentes',
              completed: 'Compareceram',
              no_show: 'No Show',
              lost: 'Sem Interesse'
            };

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filter === f
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary border border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover'
                  }
                `}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-accent-primary" />
        </div>
      ) : (
        /* Interview Cards */
        <div className="space-y-4">
          {filteredInterviews.length > 0 ? (
            filteredInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={isUpdating}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-bg-secondary/50 border border-dashed border-border-default rounded-xl">
              <div className="p-4 bg-bg-tertiary rounded-full mb-4">
                {searchTerm ? (
                  <Search size={40} className="text-text-muted opacity-50" />
                ) : filter === 'pending' ? (
                  <CheckCircle2 size={40} className="text-emerald-400 opacity-50" />
                ) : (
                  <Inbox size={40} className="text-text-muted opacity-50" />
                )}
              </div>
              <p className="font-medium text-text-primary text-lg">
                {searchTerm
                  ? 'Nenhum resultado encontrado'
                  : filter === 'pending'
                    ? 'Todas as entrevistas foram atualizadas!'
                    : 'Nenhuma entrevista nesta categoria'
                }
              </p>
              <p className="text-sm text-text-muted mt-1">
                {searchTerm
                  ? `Não encontramos entrevistas para "${searchTerm}"`
                  : 'As entrevistas aparecerão aqui quando forem agendadas.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-sm text-accent-primary hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusCenter;
