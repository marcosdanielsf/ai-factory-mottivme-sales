import React, { useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, ExternalLink, MessageSquare, Clock, Target, ArrowUpRight, ChevronDown, ChevronUp, Zap, Phone } from 'lucide-react';
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
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return '--';
  }
}

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function buildGhlUrl(leadId: string): string | null {
  if (!leadId || /^\d+$/.test(leadId)) return null;
  return `https://app.socialfy.me/contacts/${leadId}`;
}

function getDisplayName(lead: CrmInsightLead): string {
  if (!lead.full_name || lead.full_name === 'Nome nao informado') {
    return `Lead ${lead.lead_id.slice(0, 6)}`;
  }
  return lead.full_name;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

// ─── Heat Bar ────────────────────────────────────────────────────────────────

const HeatBar: React.FC<{ value: number; max: number; size?: 'sm' | 'md' }> = ({ value, max, size = 'sm' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const h = size === 'sm' ? 'h-1.5' : 'h-2';

  // Color based on intensity: low=slate, mid=amber, high=orange, max=rose
  let barColor = 'bg-slate-500/40';
  if (pct > 20) barColor = 'bg-amber-500/60';
  if (pct > 45) barColor = 'bg-orange-500/70';
  if (pct > 70) barColor = 'bg-rose-500/80';

  return (
    <div className={`w-full ${h} rounded-full bg-white/[0.04] overflow-hidden`}>
      <div
        className={`${h} rounded-full ${barColor} transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Staleness Dot ───────────────────────────────────────────────────────────

const StalenessDot: React.FC<{ days: number | null }> = ({ days }) => {
  if (days === null) return null;
  let color = 'bg-emerald-400'; // < 15 days = fresh
  if (days > 15) color = 'bg-amber-400';
  if (days > 30) color = 'bg-orange-400';
  if (days > 45) color = 'bg-rose-400';

  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`}
      title={`${days}d desde ultima analise`}
    />
  );
};

// ─── Spotlight Card (Top 3) ──────────────────────────────────────────────────

interface SpotlightCardProps {
  lead: CrmInsightLead;
  rank: number;
  maxMsgs: number;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ lead, rank, maxMsgs }) => {
  const ghlUrl = buildGhlUrl(lead.lead_id);
  const name = getDisplayName(lead);
  const initials = getInitials(name);
  const location = [lead.cidade, lead.estado].filter(Boolean).join(', ') || null;
  const days = daysAgo(lead.ultima_analise);
  const msgs = lead.total_mensagens ?? 0;

  // Rank accent colors
  const accents: Record<number, { border: string; bg: string; text: string; glow: string }> = {
    1: { border: 'border-orange-500/40', bg: 'bg-orange-500/[0.06]', text: 'text-orange-400', glow: 'shadow-[0_0_20px_-4px_rgba(249,115,22,0.15)]' },
    2: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.04]', text: 'text-amber-400', glow: 'shadow-[0_0_16px_-4px_rgba(245,158,11,0.1)]' },
    3: { border: 'border-yellow-500/25', bg: 'bg-yellow-500/[0.03]', text: 'text-yellow-500', glow: '' },
  };
  const accent = accents[rank] || accents[3];

  return (
    <div className={`group relative rounded-2xl border ${accent.border} ${accent.bg} ${accent.glow} p-5 transition-all duration-300 hover:scale-[1.01]`}>
      {/* Rank badge */}
      <div className={`absolute -top-2.5 -left-1 w-7 h-7 rounded-lg ${accent.text} bg-[var(--bg-primary)] border ${accent.border} flex items-center justify-center text-xs font-black`}>
        {rank}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${accent.bg} border ${accent.border} flex items-center justify-center`}>
          <span className={`text-sm font-bold ${accent.text} tracking-tight`}>{initials}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Name + location */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{name}</h3>
              <StalenessDot days={days} />
            </div>
            {location && (
              <span className="text-[11px] text-[var(--text-muted)]">{location}</span>
            )}
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={11} className="text-[var(--text-muted)]" />
              <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{msgs}</span>
              <span className="text-[10px] text-[var(--text-muted)]">msgs</span>
            </div>
            {days !== null && (
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-[var(--text-muted)]" />
                <span className="text-xs tabular-nums text-[var(--text-secondary)]">{days}d</span>
              </div>
            )}
            {lead.capacidade_investimento && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                lead.capacidade_investimento.toLowerCase() === 'alta'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}>
                {lead.capacidade_investimento}
              </span>
            )}
          </div>

          {/* Heat bar */}
          <HeatBar value={msgs} max={maxMsgs} size="md" />

          {/* Dores */}
          {lead.pontos_dor_principais && (
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 opacity-80">
              {lead.pontos_dor_principais}
            </p>
          )}
        </div>

        {/* CTA */}
        {ghlUrl && (
          <a
            href={ghlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${accent.text} ${accent.bg} border ${accent.border} hover:bg-orange-500/15 transition-all duration-200 group-hover:translate-x-0.5`}
          >
            Abordar
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

// ─── Table Row ───────────────────────────────────────────────────────────────

interface TableRowProps {
  lead: CrmInsightLead;
  rank: number;
  maxMsgs: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const TableRow: React.FC<TableRowProps> = ({ lead, rank, maxMsgs, isExpanded, onToggle }) => {
  const ghlUrl = buildGhlUrl(lead.lead_id);
  const name = getDisplayName(lead);
  const location = [lead.cidade, lead.estado].filter(Boolean).join(', ') || '--';
  const days = daysAgo(lead.ultima_analise);
  const msgs = lead.total_mensagens ?? 0;

  return (
    <>
      <tr
        className="group border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        {/* Rank */}
        <td className="py-3 pl-4 pr-2 w-10">
          <span className="text-xs font-bold tabular-nums text-[var(--text-muted)]">{rank}</span>
        </td>

        {/* Name + staleness */}
        <td className="py-3 pr-3">
          <div className="flex items-center gap-2 min-w-0">
            <StalenessDot days={days} />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">{name}</span>
          </div>
        </td>

        {/* Messages + heat */}
        <td className="py-3 pr-3 w-32">
          <div className="space-y-1">
            <span className="text-xs font-bold tabular-nums text-[var(--text-primary)]">{msgs}</span>
            <HeatBar value={msgs} max={maxMsgs} />
          </div>
        </td>

        {/* Location */}
        <td className="py-3 pr-3 hidden md:table-cell">
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[140px] block">{location}</span>
        </td>

        {/* Investment */}
        <td className="py-3 pr-3 hidden lg:table-cell w-20">
          {lead.capacidade_investimento && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              lead.capacidade_investimento.toLowerCase() === 'alta'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}>
              {lead.capacidade_investimento}
            </span>
          )}
        </td>

        {/* Days */}
        <td className="py-3 pr-3 hidden sm:table-cell w-16">
          <span className="text-xs tabular-nums text-[var(--text-muted)]">
            {days !== null ? `${days}d` : '--'}
          </span>
        </td>

        {/* Actions */}
        <td className="py-3 pr-4 w-24">
          <div className="flex items-center gap-1.5 justify-end">
            {ghlUrl && (
              <a
                href={ghlUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-orange-400/80 bg-orange-500/[0.06] border border-orange-500/15 hover:bg-orange-500/15 hover:border-orange-500/30 transition-all duration-200"
              >
                <ExternalLink size={10} />
                GHL
              </a>
            )}
            <button
              onClick={e => { e.stopPropagation(); onToggle(); }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors"
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {isExpanded && (
        <tr className="border-b border-white/[0.03]">
          <td colSpan={7} className="px-4 py-3 bg-white/[0.01]">
            <div className="pl-8 space-y-2 max-w-2xl">
              {lead.resumo_perfil && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{lead.resumo_perfil}</p>
              )}
              {lead.pontos_dor_principais && (
                <div className="flex items-start gap-2">
                  <Target size={11} className="text-orange-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{lead.pontos_dor_principais}</p>
                </div>
              )}
              {lead.area_atuacao && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-default)]">
                  {lead.area_atuacao}
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CrmInsightsContent: React.FC = () => {
  const { leads, loading, error, totalLeads, mediaMensagens, refetch } = useCrmInsights();
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        <button onClick={refetch} className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-secondary)] rounded-xl text-sm hover:border-[var(--border-hover)] transition-colors">
          Tentar novamente
        </button>
      </div>
    );
  }

  const maxMsgs = leads.reduce((max, l) => Math.max(max, l.total_mensagens ?? 0), 1);
  const top3 = leads.slice(0, 3);
  const rest = leads.slice(3);

  // Dates for pipeline stat
  const datesAnalise = leads.map(l => l.ultima_analise).filter(Boolean).map(d => new Date(d!).getTime());
  const oldest = datesAnalise.length > 0 ? Math.min(...datesAnalise) : null;
  const diasPipeline = oldest ? Math.floor((Date.now() - oldest) / (1000 * 60 * 60 * 24)) : null;

  // Count leads with alta capacidade
  const altaCount = leads.filter(l => l.capacidade_investimento?.toLowerCase() === 'alta').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20 flex items-center justify-center">
              <Zap size={15} className="text-orange-400" />
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Leads Quentes</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 ml-[42px]">
            Fase Decisao, engajamento alto — prontos para abordagem
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[var(--text-muted)] text-xs hover:bg-white/[0.06] hover:text-[var(--text-secondary)] transition-all"
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {/* ── Stats Strip ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 px-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tabular-nums text-orange-400">{totalLeads}</span>
          <span className="text-[11px] text-[var(--text-muted)]">leads</span>
        </div>
        <div className="w-px h-5 bg-white/[0.06]" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tabular-nums text-[var(--text-primary)]">{mediaMensagens}</span>
          <span className="text-[11px] text-[var(--text-muted)]">msgs media</span>
        </div>
        <div className="w-px h-5 bg-white/[0.06]" />
        {diasPipeline !== null && (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tabular-nums text-[var(--text-primary)]">{diasPipeline}</span>
              <span className="text-[11px] text-[var(--text-muted)]">dias pipeline</span>
            </div>
            <div className="w-px h-5 bg-white/[0.06]" />
          </>
        )}
        {altaCount > 0 && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tabular-nums text-emerald-400">{altaCount}</span>
            <span className="text-[11px] text-[var(--text-muted)]">alta capacidade</span>
          </div>
        )}
      </div>

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Target size={32} className="text-[var(--text-muted)] opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum lead em fase Decisao com engajamento Alto.
          </p>
        </div>
      )}

      {/* ── Top 3 Spotlight ────────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Phone size={11} className="text-orange-400/60" />
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Prioridade</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {top3.map((lead, idx) => (
              <SpotlightCard key={lead.id} lead={lead} rank={idx + 1} maxMsgs={maxMsgs} />
            ))}
          </div>
        </div>
      )}

      {/* ── Remaining Leads Table ──────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-2.5 pl-4 pr-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest w-10">#</th>
                <th className="py-2.5 pr-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">Lead</th>
                <th className="py-2.5 pr-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest w-32">Engajamento</th>
                <th className="py-2.5 pr-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest hidden md:table-cell">Local</th>
                <th className="py-2.5 pr-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest hidden lg:table-cell w-20">Invest.</th>
                <th className="py-2.5 pr-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest hidden sm:table-cell w-16">Idade</th>
                <th className="py-2.5 pr-4 w-24" />
              </tr>
            </thead>
            <tbody>
              {rest.map((lead, idx) => (
                <TableRow
                  key={lead.id}
                  lead={lead}
                  rank={idx + 4}
                  maxMsgs={maxMsgs}
                  isExpanded={expandedId === lead.id}
                  onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                />
              ))}
            </tbody>
          </table>
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
