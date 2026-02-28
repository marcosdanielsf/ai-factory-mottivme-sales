import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, XCircle, Info, AlertOctagon } from 'lucide-react';
import type { AuditFinding } from '../../../hooks/useAgentAudits';

interface FindingsTableProps {
  findings: AuditFinding[];
}

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critical' },
  high: { icon: AlertOctagon, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'High' },
  medium: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Low' },
};

export function FindingsTable({ findings }: FindingsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!findings.length) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        Nenhum achado registrado nesta auditoria.
      </div>
    );
  }

  const sorted = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  return (
    <div className="space-y-2">
      {sorted.map((finding, idx) => {
        const cfg = severityConfig[finding.severity] || severityConfig.low;
        const Icon = cfg.icon;
        const findingKey = `${finding.severity}-${finding.dimension}-${idx}`;
        const isExpanded = expandedId === findingKey;

        return (
          <div key={findingKey} className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : findingKey)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-bg-hover transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />}
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color} shrink-0`}>
                <Icon size={12} />
                {cfg.label}
              </span>
              <span className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                {finding.dimension}
              </span>
              <span className="text-sm text-text-primary truncate">{finding.title}</span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-3 space-y-2 border-t border-border-default">
                <div className="pt-3">
                  <p className="text-xs text-text-muted mb-1">Evidencia</p>
                  <p className="text-sm text-text-secondary bg-white/5 rounded p-2 font-mono text-xs leading-relaxed">
                    {finding.evidence}
                  </p>
                </div>
                {finding.recommendation && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Recomendacao</p>
                    <p className="text-sm text-accent-primary">{finding.recommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
