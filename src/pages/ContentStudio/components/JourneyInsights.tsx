import { RefreshCw, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import type { JourneyInsightsSummary } from '../../../hooks/useContentJourneyLog';

interface JourneyInsightsProps {
  insights: JourneyInsightsSummary;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function JourneyInsights({ insights }: JourneyInsightsProps) {
  if (insights.totalActions === 0) return null;

  const items = [
    {
      icon: RefreshCw,
      iconClass: 'text-purple-400',
      value: insights.reviews,
      label: `revisao${insights.reviews !== 1 ? 'es' : ''}`,
      show: insights.reviews > 0,
    },
    {
      icon: XCircle,
      iconClass: 'text-red-400',
      value: insights.rejections,
      label: `rejeicao${insights.rejections !== 1 ? 'es' : ''}`,
      show: insights.rejections > 0,
    },
    {
      icon: CheckCircle,
      iconClass: 'text-green-400',
      value: insights.approvals,
      label: `aprovacao${insights.approvals !== 1 ? 'es' : ''}`,
      show: insights.approvals > 0,
    },
    {
      icon: Eye,
      iconClass: 'text-text-muted',
      value: insights.totalActions,
      label: 'acoes totais',
      show: true,
    },
  ].filter(i => i.show);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <span key={idx} className="flex items-center gap-1 text-xs text-text-muted">
            <Icon className={`w-3 h-3 ${item.iconClass}`} />
            <span className="text-text-secondary font-medium">{item.value}</span>
            {item.label}
          </span>
        );
      })}

      {insights.avgTimeBetweenActionsHours !== null && (
        <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
          <Clock className="w-3 h-3" />
          tempo medio entre acoes:{' '}
          <span className="text-text-secondary font-medium">
            {formatHours(insights.avgTimeBetweenActionsHours)}
          </span>
        </span>
      )}
    </div>
  );
}
