import React from 'react';
import { Clock, CheckCircle, XCircle, Ban, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePendingInterviews } from '../hooks/usePendingInterviews';

/**
 * Widget resumido da Central de Status para o Dashboard
 */
export const StatusWidget = () => {
  const { interviews, stats, loading, updateStatus } = usePendingInterviews();

  const statusCards = [
    { 
      label: 'Pendentes', 
      value: stats.pending, 
      icon: Clock, 
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
    },
    { 
      label: 'Compareceram', 
      value: stats.completed, 
      icon: CheckCircle, 
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    },
    { 
      label: 'No Show', 
      value: stats.noShow, 
      icon: XCircle, 
      color: 'text-red-400 bg-red-500/10 border-red-500/20' 
    },
    { 
      label: 'Sem Interesse', 
      value: stats.notInterested, 
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
      {stats.pending > 0 && (
        <div className="border-t border-border-default pt-3">
          <p className="text-xs text-text-muted mb-2">Próximas entrevistas pendentes:</p>
          <div className="space-y-2">
            {interviews
              .filter(i => i.status === 'pending')
              .slice(0, 3)
              .map((interview) => (
                <div 
                  key={interview.id}
                  className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary text-xs font-bold">
                      {interview.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{interview.name}</p>
                      <p className="text-[10px] text-text-muted">
                        {interview.scheduled_date} às {interview.scheduled_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(interview.id, 'completed')}
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
          {stats.pending > 3 && (
            <Link 
              to="/status" 
              className="block text-center text-xs text-accent-primary hover:underline mt-2"
            >
              +{stats.pending - 3} mais pendentes
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusWidget;
