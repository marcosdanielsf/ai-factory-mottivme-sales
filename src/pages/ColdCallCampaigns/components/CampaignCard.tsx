import { useState } from 'react';
import { Play, Pause, Square, Trash2, ChevronDown, ChevronUp, Phone, Clock, Calendar, Plus } from 'lucide-react';
import { ColdCallCampaign } from '../../../hooks/useColdCallCampaigns';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { CampaignQueueView } from './CampaignQueueView';
import { formatDate, formatScheduleDays } from '../helpers';

export function CampaignCard({
  campaign,
  onStart,
  onPause,
  onStop,
  onDelete,
  onImportMore,
}: {
  campaign: ColdCallCampaign;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onImportMore: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalProcessed = (campaign.total_completed || 0) + (campaign.total_failed || 0);
  const totalItems = campaign.total_queued || campaign.total_calls || 0;

  return (
    <div
      className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all duration-200 cursor-pointer"
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Header: name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-text-primary truncate">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-text-muted text-sm mt-1 line-clamp-1">{campaign.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {(campaign.status === 'draft' || campaign.status === 'paused') && (
            <button
              onClick={() => onStart(campaign.id)}
              className="p-1.5 rounded-lg text-accent-success hover:bg-accent-success/15 transition-colors"
              title="Iniciar"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => onPause(campaign.id)}
              className="p-1.5 rounded-lg text-accent-warning hover:bg-accent-warning/15 transition-colors"
              title="Pausar"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <button
              onClick={() => onStop(campaign.id)}
              className="p-1.5 rounded-lg text-accent-error hover:bg-accent-error/15 transition-colors"
              title="Parar"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
          {campaign.status === 'draft' && (
            <button
              onClick={() => onDelete(campaign.id)}
              className="p-1.5 rounded-lg text-accent-error hover:bg-accent-error/15 transition-colors"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <ProgressBar completed={totalProcessed} total={totalItems} />
      </div>

      {/* Metrics row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-accent-success">✅ {campaign.total_completed || 0} sucesso</span>
        <span className="text-accent-error">❌ {campaign.total_failed || 0} falha</span>
        <span className="text-text-muted">⏳ {campaign.total_pending || 0} pendente</span>
        {(campaign.total_in_progress || 0) > 0 && (
          <span className="text-accent-primary">📞 {campaign.total_in_progress} em progresso</span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" /> {campaign.rate_limit || 10}/h
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {campaign.schedule_start || '09:00'}-{campaign.schedule_end || '18:00'}{' '}
          {formatScheduleDays(campaign.schedule_days)}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {formatDate(campaign.created_at)}
        </span>
      </div>

      {/* Expanded: queue items */}
      {expanded && (
        <>
          {/* Import more button (only for draft/paused) */}
          {(campaign.status === 'draft' || campaign.status === 'paused') && (
            <div className="mt-4 pt-4 border-t border-border-default" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onImportMore(campaign.id)}
                className="w-full px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/15 hover:border-accent-primary/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Importar Mais Contatos
              </button>
            </div>
          )}

          <CampaignQueueView campaignId={campaign.id} />
        </>
      )}
    </div>
  );
}
