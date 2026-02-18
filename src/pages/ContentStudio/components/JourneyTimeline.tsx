import { useState } from 'react';
import {
  Plus, Send, Eye, CheckCircle, XCircle, Globe, Archive,
  Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { JourneyLogEntry, JourneyAction } from '../../../hooks/useContentJourneyLog';

const ACTION_CONFIG: Record<
  JourneyAction,
  { label: string; dotClass: string; iconClass: string; Icon: typeof Plus }
> = {
  created:   { label: 'Criado',      dotClass: 'bg-blue-500',    iconClass: 'text-blue-400',    Icon: Plus },
  submitted: { label: 'Submetido',   dotClass: 'bg-yellow-500',  iconClass: 'text-yellow-400',  Icon: Send },
  reviewed:  { label: 'Revisado',    dotClass: 'bg-purple-500',  iconClass: 'text-purple-400',  Icon: Eye },
  approved:  { label: 'Aprovado',    dotClass: 'bg-green-500',   iconClass: 'text-green-400',   Icon: CheckCircle },
  rejected:  { label: 'Rejeitado',   dotClass: 'bg-red-500',     iconClass: 'text-red-400',     Icon: XCircle },
  published: { label: 'Publicado',   dotClass: 'bg-emerald-500', iconClass: 'text-emerald-400', Icon: Globe },
  archived:  { label: 'Arquivado',   dotClass: 'bg-gray-500',    iconClass: 'text-gray-400',    Icon: Archive },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimelineEntryProps {
  entry: JourneyLogEntry;
  isLast: boolean;
}

function TimelineEntry({ entry, isLast }: TimelineEntryProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.reviewed;
  const { Icon } = config;

  return (
    <div className="flex gap-3 relative">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border-default" />
      )}

      {/* Dot */}
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${config.dotClass} cursor-pointer`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Icon className="w-3 h-3 text-white" />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-8 top-0 z-20 w-56 bg-bg-primary border border-border-default rounded-lg p-2.5 shadow-lg text-xs space-y-1">
            <p className={`font-medium ${config.iconClass}`}>{config.label}</p>
            {entry.actor_name && (
              <p className="text-text-muted">Por: {entry.actor_name}</p>
            )}
            <p className="text-text-muted">{formatDateTime(entry.created_at)}</p>
            {entry.notes && (
              <p className="text-text-secondary pt-1 border-t border-border-default">{entry.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium ${config.iconClass}`}>{config.label}</span>
          {entry.actor_name && (
            <span className="text-xs text-text-muted truncate">· {entry.actor_name}</span>
          )}
          <span className="text-xs text-text-muted ml-auto flex-shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(entry.created_at)}
          </span>
        </div>
        {entry.notes && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{entry.notes}</p>
        )}
      </div>
    </div>
  );
}

interface JourneyTimelineProps {
  entries: JourneyLogEntry[];
  loading: boolean;
  collapsible?: boolean;
}

export function JourneyTimeline({ entries, loading, collapsible = true }: JourneyTimelineProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-bg-tertiary flex-shrink-0 mt-0.5" />
            <div className="flex-1 pb-4 space-y-1.5">
              <div className="h-3 w-24 bg-bg-tertiary rounded" />
              <div className="h-3 w-40 bg-bg-tertiary rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-text-muted italic">Nenhuma acao registrada ainda.</p>
    );
  }

  const visibleEntries = collapsible && collapsed ? entries.slice(-3) : entries;
  const hiddenCount = entries.length - visibleEntries.length;

  return (
    <div className="space-y-0">
      {collapsible && entries.length > 3 && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary mb-2 transition-colors"
        >
          {collapsed ? (
            <>
              <ChevronDown className="w-3 h-3" />
              Ver todas ({entries.length} acoes, {hiddenCount} ocultas)
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3" />
              Recolher
            </>
          )}
        </button>
      )}

      {visibleEntries.map((entry, idx) => (
        <TimelineEntry
          key={entry.id}
          entry={entry}
          isLast={idx === visibleEntries.length - 1}
        />
      ))}
    </div>
  );
}
