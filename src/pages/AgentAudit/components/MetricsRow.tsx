import { MessageSquare, CalendarCheck, Target, TrendingUp } from 'lucide-react';
import type { AuditMetrics } from '../../../hooks/useAgentAudits';

interface MetricsRowProps {
  metrics: AuditMetrics;
  conversationsCount: number;
  messagesCount: number;
}

function MetricCard({ icon: Icon, label, value, suffix }: { icon: any; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-accent-primary/10">
        <Icon size={18} className="text-accent-primary" />
      </div>
      <div>
        <p className="text-text-muted text-xs">{label}</p>
        <p className="text-text-primary font-semibold text-lg">
          {value}{suffix && <span className="text-sm text-text-muted ml-0.5">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

export function MetricsRow({ metrics, conversationsCount, messagesCount }: MetricsRowProps) {
  const schedulingRate = metrics.scheduling_rate != null ? `${(metrics.scheduling_rate * 100).toFixed(0)}` : '--';
  const qualificationRate = metrics.qualification_rate != null ? `${(metrics.qualification_rate * 100).toFixed(0)}` : '--';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard icon={MessageSquare} label="Conversas" value={conversationsCount} />
      <MetricCard icon={TrendingUp} label="Mensagens" value={messagesCount} />
      <MetricCard icon={CalendarCheck} label="Taxa Agendamento" value={schedulingRate} suffix="%" />
      <MetricCard icon={Target} label="Taxa Qualificacao" value={qualificationRate} suffix="%" />
    </div>
  );
}
