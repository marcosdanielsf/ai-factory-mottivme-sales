import { ChevronRight, Loader2, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ContentCampaign } from '../../../hooks/useContentCampaigns';

interface CampaignCardProps {
  campaign: ContentCampaign;
  onClick: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Package; label: string }> = {
  draft: { color: 'bg-gray-500/20 text-gray-400', icon: Package, label: 'Rascunho' },
  generating: { color: 'bg-yellow-500/20 text-yellow-400', icon: Loader2, label: 'Gerando...' },
  review: { color: 'bg-blue-500/20 text-blue-400', icon: Package, label: 'Em Revisao' },
  approved: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle2, label: 'Aprovado' },
  published: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2, label: 'Publicado' },
  error: { color: 'bg-red-500/20 text-red-400', icon: AlertCircle, label: 'Erro' },
};

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const config = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const StatusIcon = config.icon;
  const isGenerating = campaign.status === 'generating';

  const progressPct = campaign.total_pieces > 0
    ? Math.round((campaign.approved_pieces / campaign.total_pieces) * 100)
    : 0;

  return (
    <button
      onClick={() => onClick(campaign.id)}
      className="w-full text-left bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-primary/50 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
              <StatusIcon className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              {config.label}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-primary truncate">{campaign.name}</h3>
          {campaign.briefing.produto && (
            <p className="text-xs text-text-muted mt-0.5 truncate">{campaign.briefing.produto}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
        <span>{campaign.total_pieces} pecas</span>
        <span>{campaign.approved_pieces} aprovadas</span>
        <span>{campaign.published_pieces} publicadas</span>
      </div>

      {/* Progress bar */}
      {campaign.total_pieces > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-text-muted mt-2">
        {new Date(campaign.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </button>
  );
}
