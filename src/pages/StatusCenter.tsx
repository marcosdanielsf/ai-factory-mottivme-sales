import React, { useState, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

// Types
interface PendingInterview {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  recruiter_name: string;
  interview_date: string;
  status: 'pending' | 'compareceu' | 'no_show' | 'sem_interesse';
  created_at: string;
}

// Mock data - será substituído por hook real
const mockInterviews: PendingInterview[] = [
  {
    id: '1',
    lead_id: 'abc123',
    lead_name: 'Kariny Benevenuto',
    lead_phone: '(508) 296-5006',
    recruiter_name: 'Marina Couto',
    interview_date: '2026-02-03T14:00:00',
    status: 'pending',
    created_at: '2026-02-03T10:00:00'
  },
  {
    id: '2',
    lead_id: 'def456',
    lead_name: 'João Silva',
    lead_phone: '(11) 99999-8888',
    recruiter_name: 'Marina Couto',
    interview_date: '2026-02-03T15:00:00',
    status: 'pending',
    created_at: '2026-02-03T11:00:00'
  },
  {
    id: '3',
    lead_id: 'ghi789',
    lead_name: 'Maria Santos',
    lead_phone: '(21) 98765-4321',
    recruiter_name: 'Gustavo Couto',
    interview_date: '2026-02-02T16:00:00',
    status: 'pending',
    created_at: '2026-02-02T12:00:00'
  }
];

// Components
const StatusBadge = ({ status }: { status: PendingInterview['status'] }) => {
  const config = {
    pending: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/20',
      label: 'Pendente' 
    },
    compareceu: { 
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
    sem_interesse: { 
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
      {status === 'compareceu' && <CheckCircle2 size={12} />}
      {status === 'no_show' && <XCircle size={12} />}
      {status === 'sem_interesse' && <Ban size={12} />}
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
  icon: any;
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
  onUpdateStatus 
}: { 
  interview: PendingInterview;
  onUpdateStatus: (id: string, status: PendingInterview['status']) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: PendingInterview['status']) => {
    setIsUpdating(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onUpdateStatus(interview.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(interview.interview_date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-lg">
            {interview.lead_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-lg">{interview.lead_name}</h3>
            <div className="flex items-center gap-3 text-sm text-text-muted mt-0.5">
              <span className="flex items-center gap-1">
                <Phone size={12} />
                {interview.lead_phone}
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
        <span>Recrutador: <span className="text-text-primary font-medium">{interview.recruiter_name}</span></span>
      </div>

      {/* Actions */}
      {interview.status === 'pending' && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border-default">
          <ActionButton
            onClick={() => handleStatusUpdate('compareceu')}
            icon={CheckCircle2}
            label="Compareceu"
            variant="success"
            disabled={isUpdating}
          />
          <ActionButton
            onClick={() => handleStatusUpdate('no_show')}
            icon={XCircle}
            label="No Show"
            variant="danger"
            disabled={isUpdating}
          />
          <ActionButton
            onClick={() => handleStatusUpdate('sem_interesse')}
            icon={Ban}
            label="Sem Interesse"
            variant="neutral"
            disabled={isUpdating}
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
  icon: any;
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
  const [interviews, setInterviews] = useState<PendingInterview[]>(mockInterviews);
  const [filter, setFilter] = useState<'all' | 'pending' | 'compareceu' | 'no_show' | 'sem_interesse'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    compareceu: interviews.filter(i => i.status === 'compareceu').length,
    no_show: interviews.filter(i => i.status === 'no_show').length,
    sem_interesse: interviews.filter(i => i.status === 'sem_interesse').length
  }), [interviews]);

  // Handlers
  const handleUpdateStatus = useCallback((id: string, status: PendingInterview['status']) => {
    setInterviews(prev => prev.map(i => 
      i.id === id ? { ...i, status } : i
    ));

    const messages = {
      compareceu: '✅ Entrevista marcada como realizada!',
      no_show: '❌ Lead marcado como No Show',
      sem_interesse: '🚫 Lead marcado como Sem Interesse'
    };

    showToast(messages[status as keyof typeof messages], 'success');
  }, [showToast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    showToast('Dados atualizados!', 'info');
  };

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
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Pendentes" value={metrics.pending} icon={Clock} color="amber" />
        <MetricCard label="Compareceram" value={metrics.compareceu} icon={CheckCircle2} color="emerald" />
        <MetricCard label="No Show" value={metrics.no_show} icon={XCircle} color="red" />
        <MetricCard label="Sem Interesse" value={metrics.sem_interesse} icon={Ban} color="gray" />
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
          {(['pending', 'compareceu', 'no_show', 'sem_interesse', 'all'] as const).map((f) => {
            const labels = {
              all: 'Todos',
              pending: 'Pendentes',
              compareceu: 'Compareceram',
              no_show: 'No Show',
              sem_interesse: 'Sem Interesse'
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

      {/* Interview Cards */}
      <div className="space-y-4">
        {filteredInterviews.length > 0 ? (
          filteredInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onUpdateStatus={handleUpdateStatus}
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
                  ? '🎉 Todas as entrevistas foram atualizadas!'
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
    </div>
  );
};
