import React from 'react';
import { Clock, CheckCircle, XCircle, Ban, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePendingInterviews } from '../hooks/usePendingInterviews';

/**
 * Widget resumido da Central de Status para o Dashboard
 */
export const StatusWidget = () => {
  const { interviews, metrics, loading, updateStatus } = usePendingInterviews();

  const statusCards = [
    { 
      label: 'Pendentes', 
      value: metrics.pending, 
      icon: Clock, 
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
    },
    { 
      label: 'Compareceram', 
      value: metrics.compareceu, 
      icon: CheckCircle, 
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    },
    { 
      label: 'No Show', 
      value: metrics.no_show, 
      icon: XCircle, 
      color: 'text-red-400 bg-red-500/10 border-red-500/20' 
    },
    { 
      label: 'Sem Interesse', 
      value: metrics.sem_interesse, 
      icon: Ban, 
      color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' 
    },
  ];

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-bg-tertiary rounded w-32 animate-pulse" />
          <div className="h-4 bg-bg-tertiary rounded w-20 animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-bg-tertiary rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Filtrar apenas pendentes (status pending ou sent)
  const pendingInterviews = interviews.filter(i => i.status === 'pending' || i.status === 'sent');

  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          📋 Central de Status
        </h3>
        <Link 
          to="/status" 
          className="text-xs text-accent-primary hover:underline flex items-center gap-1"
        >
          Ver tudo <ChevronRight size={12} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {statusCards.map((card) => (
          <div 
            key={card.label}
            className={`flex items-center gap-2 p-3 rounded-lg border ${card.color}`}
          >
            <card.icon size={18} />
            <div>
              <div className="text-lg font-bold text-text-primary">{card.value}</div>
              <div className="text-[10px] text-text-muted">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista resumida de pendentes */}
      {pendingInterviews.length > 0 && (
        <div className="border-t border-border-default pt-3">
          <p className="text-xs text-text-muted mb-2">Próximas entrevistas pendentes:</p>
          <div className="space-y-2">
            {pendingInterviews
              .slice(0, 3)
              .map((interview) => (
                <div 
                  key={interview.id}
                  className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold">
                      {interview.lead_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{interview.lead_name || 'Sem nome'}</p>
                      <p className="text-[10px] text-text-muted">
                        {formatDate(interview.interview_date)} às {formatTime(interview.interview_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(interview.id, 'realizada')}
                      className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                      title="Compareceu"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={() => updateStatus(interview.id, 'no_show')}
                      className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="No Show"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {pendingInterviews.length > 3 && (
            <Link 
              to="/status" 
              className="block text-center text-xs text-accent-primary hover:underline mt-2"
            >
              +{pendingInterviews.length - 3} mais pendentes
            </Link>
          )}
        </div>
      )}

      {/* Mensagem quando não há pendentes */}
      {pendingInterviews.length === 0 && (
        <div className="border-t border-border-default pt-3 text-center">
          <p className="text-xs text-text-muted">✅ Nenhuma entrevista pendente</p>
        </div>
      )}
    </div>
  );
};

export default StatusWidget;
