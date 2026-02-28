import { Shield, AlertTriangle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import type { AgentAuditScorecard } from '../../../hooks/useAgentAudits';

interface AuditScoreCardProps {
  audit: AgentAuditScorecard;
  onClick: () => void;
}

const statusConfig = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle, label: 'Healthy' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, label: 'Warning' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle, label: 'Critical' },
};

function HealthBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AuditScoreCard({ audit, onClick }: AuditScoreCardProps) {
  const cfg = statusConfig[audit.healthStatus] || statusConfig.critical;
  const StatusIcon = cfg.icon;
  const criticalCount = audit.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
  const auditDate = new Date(audit.auditedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-bg-secondary border ${cfg.border} rounded-xl p-5 hover:bg-bg-hover transition-all duration-200 group`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-accent-primary transition-colors">
            {audit.agentName}
          </h3>
          <p className="text-text-muted text-xs mt-0.5">{audit.agentVersion}</p>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
          <StatusIcon size={12} />
          {cfg.label}
        </span>
      </div>

      {/* Health Score */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-bold ${cfg.color}`}>{audit.healthScore.toFixed(0)}</span>
        <span className="text-text-muted text-xs">/100</span>
        {audit.trendHealth != null && (
          <span className="text-text-muted text-xs ml-auto">
            trend: {audit.trendHealth.toFixed(0)}
          </span>
        )}
      </div>
      <HealthBar score={audit.healthScore} />

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {audit.conversationsCount} conversas
        </span>
        {criticalCount > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <Shield size={12} />
            {criticalCount} achados
          </span>
        )}
        <span className="ml-auto">{auditDate}</span>
      </div>
    </button>
  );
}
