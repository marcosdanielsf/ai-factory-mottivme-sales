import React from 'react';
import { AlertCircle, Loader2, RefreshCw, ExternalLink, Users, MessageSquare, Clock, Flame } from 'lucide-react';
import { useCrmInsights, CrmInsightLead } from '../../hooks/useCrmInsights';

// ─── Error Boundary ──────────────────────────────────────────────────────────

class CrmInsightsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
          <AlertCircle size={32} className="text-rose-400" />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Erro ao renderizar CRM Insights</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            {this.state.error?.message ?? 'Erro desconhecido'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-500/20 text-rose-300 rounded-xl text-sm font-medium hover:bg-rose-500/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

function buildGhlUrl(leadId: string): string | null {
  // GHL contact IDs are alphanumeric strings (not numeric) — numeric IDs are from other sources
  if (!leadId || /^\d+$/.test(leadId)) return null;
  return `https://app.gohighlevel.com/contacts/${leadId}`;
}

function getDisplayName(lead: CrmInsightLead): string {
  if (!lead.full_name || lead.full_name === 'Nome não informado') {
    return `Lead #${lead.lead_id.slice(0, 8)}`;
  }
  return lead.full_name;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, highlight }) => (
  <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
    highlight
      ? 'bg-rose-500/10 border-rose-500/30'
      : 'bg-[var(--bg-secondary)] border-[var(--border-default)]'
  }`}>
    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
      highlight ? 'bg-rose-500/20 text-rose-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
    }`}>
      {icon}
    </div>
    <div>
      <div className={`text-2xl font-bold tabular-nums ${
        highlight ? 'text-rose-400' : 'text-[var(--text-primary)]'
      }`}>
        {value}
      </div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  </div>
);

// ─── Lead Card ───────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: CrmInsightLead;
  rank: number;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, rank }) => {
  const ghlUrl = buildGhlUrl(lead.lead_id);
  const name = getDisplayName(lead);
  const location = [lead.cidade, lead.estado].filter(Boolean).join(', ') || null;

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 flex flex-col gap-3 hover:border-rose-500/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-semibold flex items-center justify-center">
            {rank}
          </span>
          <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Flame size={9} />
            QUENTE
          </span>
          {ghlUrl && (
            <a
              href={ghlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors border border-[var(--border-default)]"
            >
              <ExternalLink size={9} />
              GHL
            </a>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <MessageSquare size={11} className="text-[var(--text-muted)]" />
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">{lead.total_mensagens ?? 0}</span>
          <span className="text-[var(--text-muted)]">msgs</span>
        </div>
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <Clock size={11} className="text-[var(--text-muted)]" />
          <span>{formatDate(lead.ultima_analise)}</span>
        </div>
        {location && (
          <div className="flex items-center gap-1 text-[var(--text-muted)] truncate">
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Profile summary */}
      {lead.resumo_perfil && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
          {lead.resumo_perfil}
        </p>
      )}

      {/* Pain points */}
      {lead.pontos_dor_principais && (
        <div className="rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Dores principais</span>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{lead.pontos_dor_principais}</p>
        </div>
      )}

      {/* Extra tags */}
      <div className="flex flex-wrap gap-1.5">
        {lead.area_atuacao && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-default)]">
            {lead.area_atuacao}
          </span>
        )}
        {lead.capacidade_investimento && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {lead.capacidade_investimento}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CrmInsightsContent: React.FC = () => {
  const { leads, loading, error, totalLeads, mediaMensagens, refetch } = useCrmInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">Carregando leads quentes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
        <AlertCircle size={28} className="text-rose-400" />
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-xl text-sm hover:border-[var(--border-hover)] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Median pipeline time: days since oldest ultima_analise among these leads
  const datesAnalise = leads
    .map(l => l.ultima_analise)
    .filter(Boolean)
    .map(d => new Date(d!).getTime());
  const oldest = datesAnalise.length > 0 ? Math.min(...datesAnalise) : null;
  const diasPipeline = oldest
    ? Math.floor((Date.now() - oldest) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">CRM Insights</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Leads em fase Decisao com alto engajamento — prontos para abordagem direta
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm hover:border-[var(--border-hover)] transition-colors"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Leads quentes"
          value={totalLeads}
          icon={<Users size={18} />}
          highlight
        />
        <StatCard
          label="Media de msgs"
          value={mediaMensagens}
          icon={<MessageSquare size={18} />}
        />
        {diasPipeline !== null && (
          <StatCard
            label="Dias no pipeline"
            value={diasPipeline}
            icon={<Clock size={18} />}
          />
        )}
      </div>

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Flame size={32} className="text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum lead em fase Decisao com engajamento Alto encontrado.
          </p>
        </div>
      )}

      {/* Leads grid */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead, idx) => (
            <LeadCard key={lead.id} lead={lead} rank={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CrmInsights: React.FC = () => (
  <CrmInsightsErrorBoundary>
    <CrmInsightsContent />
  </CrmInsightsErrorBoundary>
);

export default CrmInsights;
