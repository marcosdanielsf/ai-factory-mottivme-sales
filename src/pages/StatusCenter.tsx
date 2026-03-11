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
  Loader2,
  Trophy
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAccount } from '../contexts/AccountContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useAuth } from '../contexts/AuthContext';
import { ghlClient } from '../services/ghl/ghlClient';
import { getErrorMessage } from "../lib/getErrorMessage";

// Types
type InterviewStatus = 'pending' | 'completed' | 'no_show' | 'lost' | 'converted';

// Mapeamento status -> tag GHL
const STATUS_TAG_MAP: Record<InterviewStatus, string | null> = {
  pending: null,
  completed: 'compareceu',
  no_show: 'no-show',
  converted: 'converteu',
  lost: 'sem-interesse',
};

// Statuses que devem atualizar oportunidade no GHL
const STATUS_OPP_MAP: Record<string, string> = {
  converted: 'won',
  lost: 'lost',
};

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
  contact_id: string | null;
  location_id: string | null;
}

// Status mapping from DB to display
const statusMap: Record<string, InterviewStatus> = {
  booked: 'pending',
  completed: 'completed',
  won: 'completed',
  no_show: 'no_show',
  lost: 'lost',
  converted: 'converted'
};

const reverseStatusMap: Record<InterviewStatus, string> = {
  pending: 'booked',
  completed: 'completed',
  no_show: 'no_show',
  lost: 'lost',
  converted: 'converted'
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
    },
    converted: {
      bg: 'bg-amber-400/10',
      text: 'text-amber-300',
      border: 'border-amber-400/20',
      label: 'Converteu'
    }
  };

  const { bg, text, border, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
      {status === 'pending' && <Clock size={12} />}
      {status === 'completed' && <CheckCircle2 size={12} />}
      {status === 'no_show' && <XCircle size={12} />}
      {status === 'lost' && <Ban size={12} />}
      {status === 'converted' && <Trophy size={12} />}
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
  variant: 'success' | 'danger' | 'neutral' | 'gold';
  disabled?: boolean;
}) => {
  const variants = {
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50',
    neutral: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/30 hover:border-gray-500/50',
    gold: 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30 hover:border-amber-400/50'
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
  onUpdateStatus: (id: string, status: InterviewStatus, contactId?: string | null) => Promise<void>;
  isUpdating: boolean;
}) => {
  const [localUpdating, setLocalUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: InterviewStatus) => {
    setLocalUpdating(true);
    try {
      await onUpdateStatus(interview.id, newStatus, interview.contact_id);
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

      {/* Actions — sempre mostra botoes (permite corrigir status) */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-border-default">
        {interview.status !== 'completed' && (
          <ActionButton
            onClick={() => handleStatusUpdate('completed')}
            icon={CheckCircle2}
            label="Compareceu"
            variant="success"
            disabled={isDisabled}
          />
        )}
        {interview.status !== 'no_show' && (
          <ActionButton
            onClick={() => handleStatusUpdate('no_show')}
            icon={XCircle}
            label="No Show"
            variant="danger"
            disabled={isDisabled}
          />
        )}
        {interview.status !== 'lost' && (
          <ActionButton
            onClick={() => handleStatusUpdate('lost')}
            icon={Ban}
            label="Sem Interesse"
            variant="neutral"
            disabled={isDisabled}
          />
        )}
        {interview.status !== 'converted' && (
          <ActionButton
            onClick={() => handleStatusUpdate('converted')}
            icon={Trophy}
            label="Converteu"
            variant="gold"
            disabled={isDisabled}
          />
        )}
      </div>
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
  color: 'emerald' | 'red' | 'amber' | 'gray' | 'blue';
}) => {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    gray: 'text-gray-400 bg-gray-500/10',
    blue: 'text-blue-400 bg-blue-500/10'
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
  const { session } = useAuth();
  const isAdmin = useIsAdmin();
  const [interviews, setInterviews] = useState<PendingInterview[]>([]);
  const [filter, setFilter] = useState<'all' | InterviewStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determina location_id baseado no contexto (multi-tenancy)
  const activeLocationId = useMemo(() => {
    if (selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    return null;
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

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('appointments_log')
        .select('id, appointment_date, location_name, location_id, contact_name, contact_phone, contact_email, appointment_type, raw_payload, created_at, manual_status')
        .gte('appointment_date', thirtyDaysAgo.toISOString())
        .order('appointment_date', { ascending: false })
        .limit(5000);

      if (activeLocationId) {
        query = query.eq('location_id', activeLocationId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Dedup by appointmentId (keep most recent)
      const seen = new Map<string, any>();
      for (const item of (data || [])) {
        const appointmentId = item.raw_payload?.calendar?.appointmentId;
        if (!appointmentId) continue;
        const existing = seen.get(appointmentId);
        if (!existing || (item.created_at && (!existing.created_at || item.created_at > existing.created_at))) {
          seen.set(appointmentId, item);
        }
      }

      // Map GHL status to dashboard status
      const mapStatus = (rawPayload: any): string => {
        const ghlStatus = rawPayload?.calendar?.appoinmentStatus?.toLowerCase?.() || '';
        if (ghlStatus === 'showed') return 'completed';
        if (ghlStatus === 'noshow' || ghlStatus === 'no_show') return 'no_show';
        if (ghlStatus === 'cancelled') return 'cancelled';
        return 'booked';
      };

      // Map to PendingInterview format
      const mappedData: PendingInterview[] = [];
      for (const item of seen.values()) {
        // Priority: manual_status > GHL webhook status
        const effectiveStatus = item.manual_status || mapStatus(item.raw_payload);
        if (effectiveStatus === 'cancelled') continue;

        const isPast = new Date(item.appointment_date) < new Date();
        let displayStatus: InterviewStatus = statusMap[effectiveStatus] || 'pending';
        if (effectiveStatus === 'booked' && isPast) {
          displayStatus = 'pending';
        }

        mappedData.push({
          id: item.id,
          lead_id: item.id,
          lead_name: item.contact_name || '',
          lead_phone: item.contact_phone || '',
          lead_email: item.contact_email || '',
          recruiter_name: item.location_name || 'unknown',
          interview_date: item.appointment_date,
          status: displayStatus,
          fonte: null,
          source: 'realtime',
          contact_id: item.raw_payload?.contact_id || null,
          location_id: item.location_id || null
        });
      }

      // Apply fallback for empty names
      const finalData = mappedData.map(item => ({
        ...item,
        lead_name: item.lead_name || ((item as any).lead_email?.split('@')[0] || 'Sem nome'),
        recruiter_name: item.recruiter_name === 'unknown' ? 'Não atribuído' : item.recruiter_name
      }));

      setInterviews(finalData);
    } catch (err: unknown) {
      console.error('Error fetching interviews:', err);
      setError(getErrorMessage(err) || 'Erro ao carregar entrevistas');
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
    lost: interviews.filter(i => i.status === 'lost').length,
    converted: interviews.filter(i => i.status === 'converted').length
  }), [interviews]);

  // Sync status to GHL (fire-and-forget, non-blocking)
  const syncToGHL = useCallback(async (contactId: string, locationId: string, newStatus: InterviewStatus) => {
    const token = session?.access_token;
    if (!token || !contactId) return;

    try {
      // 1. Add tag (passa locationId pro backend buscar PIT do cliente)
      const tag = STATUS_TAG_MAP[newStatus];
      if (tag) {
        await ghlClient.addContactTags(contactId, [tag], token, locationId);
      }

      // 2. Update opportunity status (won/lost) if applicable
      const oppStatus = STATUS_OPP_MAP[newStatus];
      if (oppStatus) {
        const opp = await ghlClient.findOpportunityByContact(locationId, contactId, token);
        if (opp) {
          await ghlClient.updateOpportunity(opp.id, { status: oppStatus, locationId }, token);
        }
      }

      console.log(`[GHL Sync] ${newStatus} → tag:${tag || '-'}, opp:${oppStatus || '-'}`);
    } catch (err) {
      console.warn('[GHL Sync] Failed (non-blocking):', err);
    }
  }, [session?.access_token]);

  // Update status in Supabase + sync to GHL
  const handleUpdateStatus = useCallback(async (id: string, newStatus: InterviewStatus, contactId?: string | null) => {
    setIsUpdating(true);
    try {
      const dbStatus = reverseStatusMap[newStatus];

      // Persist to appointments_log.manual_status
      const { error } = await supabase
        .from('appointments_log')
        .update({ manual_status: dbStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating manual_status:', error);
      }

      // If converted, also update n8n_schedule_tracking.etapa_funil
      if (newStatus === 'converted' && contactId) {
        const { error: trackingError } = await supabase
          .from('n8n_schedule_tracking')
          .update({ etapa_funil: 'Fechou' })
          .eq('unique_id', contactId);

        if (trackingError) {
          console.error('Error updating etapa_funil:', trackingError);
        }
      }

      // Sync to GHL in background (tag + opportunity update)
      const interview = interviews.find(i => i.id === id);
      const locId = interview?.location_id || activeLocationId;
      if (contactId && locId && newStatus !== 'pending') {
        syncToGHL(contactId, locId, newStatus);
      }

      // Update local state
      setInterviews(prev => prev.map(i =>
        i.id === id ? { ...i, status: newStatus } : i
      ));

      const messages: Record<InterviewStatus, string> = {
        pending: 'Status atualizado',
        completed: '✅ Compareceu — tag adicionada no GHL!',
        no_show: '❌ No Show — tag adicionada no GHL',
        lost: '🚫 Sem Interesse — oportunidade marcada como perdida',
        converted: '🏆 Converteu — oportunidade marcada como ganha!'
      };

      showToast(messages[newStatus], 'success');
    } catch (err: unknown) {
      console.error('Error updating status:', err);
      showToast('Erro ao atualizar status', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [showToast, interviews, activeLocationId, syncToGHL]);

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Pendentes" value={metrics.pending} icon={Clock} color="amber" />
        <MetricCard label="Compareceram" value={metrics.completed} icon={CheckCircle2} color="emerald" />
        <MetricCard label="No Show" value={metrics.no_show} icon={XCircle} color="red" />
        <MetricCard label="Sem Interesse" value={metrics.lost} icon={Ban} color="gray" />
        <MetricCard label="Converteram" value={metrics.converted} icon={Trophy} color="blue" />
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
          {(['pending', 'completed', 'no_show', 'lost', 'converted', 'all'] as const).map((f) => {
            const labels = {
              all: 'Todos',
              pending: 'Pendentes',
              completed: 'Compareceram',
              no_show: 'No Show',
              lost: 'Sem Interesse',
              converted: 'Converteram'
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
