import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, ExternalLink } from 'lucide-react';
import { useAgentAudits, useAgentAuditHistory } from '../../hooks/useAgentAudits';
import { AgentPerformanceRadar } from '../../components/charts/AgentPerformanceRadar';
import { ScoreAreaChart } from '../../components/charts/ScoreAreaChart';
import { FindingsTable } from './components/FindingsTable';
import { MetricsRow } from './components/MetricsRow';

const DIMENSION_LABELS: Record<string, string> = {
  tool_calls: 'Tool Calls',
  phase_flow: 'Fluxo de Fase',
  compliance: 'Compliance',
  hallucination: 'Alucinacao',
  escalation: 'Escalacao',
  conversion: 'Conversao',
  anti_repetition: 'Anti-Repeticao',
  mode_correctness: 'Modo Correto',
};

export function AgentAuditDetail() {
  const { agentVersionId } = useParams<{ agentVersionId: string }>();
  const navigate = useNavigate();
  const { scorecards, loading: loadingScorecards } = useAgentAudits();
  const { history, loading: loadingHistory } = useAgentAuditHistory(agentVersionId);

  const audit = scorecards.find(s => s.agentVersionId === agentVersionId);
  const loading = loadingScorecards || loadingHistory;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />)}
        </div>
        <div className="h-[350px] bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/agent-audit')} className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-4 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-center py-16">
          <ClipboardCheck size={40} className="mx-auto text-text-muted mb-3 opacity-30" />
          <p className="text-text-muted text-sm">Auditoria nao encontrada para este agente.</p>
        </div>
      </div>
    );
  }

  // Radar data from scores
  const radarData = Object.entries(audit.scores).map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key] || key,
    score: Number(value) || 0,
    fullMark: 10,
  }));

  // History chart data
  const historyData = history.map(h => ({
    date: h.auditedAt,
    score: h.healthScore / 10, // Normalize 0-100 to 0-10 for ScoreAreaChart
  }));

  // Recommendations sorted by priority
  const sortedRecs = [...(audit.recommendations || [])].sort((a, b) => {
    const order: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  const statusColor = audit.healthStatus === 'healthy' ? 'text-emerald-400' : audit.healthStatus === 'warning' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/agent-audit')} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
            <ArrowLeft size={18} className="text-text-muted" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {audit.agentName}
              <span className="text-sm font-normal text-text-muted">{audit.agentVersion}</span>
            </h1>
            <p className="text-text-muted text-sm">
              Auditoria de {new Date(audit.auditedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' '}&middot;{' '}
              <span className={`font-medium ${statusColor}`}>
                {audit.healthScore.toFixed(0)}/100 ({audit.healthStatus})
              </span>
            </p>
          </div>
        </div>
        {audit.agentVersionId && (
          <a
            href={`/#/agents?version=${audit.agentVersionId}`}
            className="flex items-center gap-1.5 text-xs text-accent-primary hover:underline"
          >
            Ver Agente <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Metrics Row */}
      <MetricsRow
        metrics={audit.metrics}
        conversationsCount={audit.conversationsCount}
        messagesCount={audit.messagesCount}
      />

      {/* Charts: Radar + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Radar 8 Dimensoes</h2>
          {radarData.length > 0 ? (
            <AgentPerformanceRadar data={radarData} agentName={audit.agentName} />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-text-muted text-sm">Sem dados de scores</div>
          )}
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Evolucao Health Score</h2>
          {historyData.length > 1 ? (
            <ScoreAreaChart data={historyData} title="Health Score" />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-text-muted text-sm">
              {historyData.length === 1 ? 'Apenas 1 auditoria — grafico aparece a partir da 2a' : 'Sem historico'}
            </div>
          )}
        </div>
      </div>

      {/* Findings */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Achados ({audit.findings.length})
        </h2>
        <FindingsTable findings={audit.findings} />
      </div>

      {/* Recommendations */}
      {sortedRecs.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Recomendacoes</h2>
          <div className="space-y-2">
            {sortedRecs.map((rec, idx) => {
              const prioColor = rec.priority === 'P0' ? 'text-red-400 bg-red-500/10' : rec.priority === 'P1' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10';
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${prioColor}`}>{rec.priority}</span>
                  <div>
                    <p className="text-sm text-text-primary">{rec.action}</p>
                    <p className="text-xs text-text-muted mt-0.5">{rec.expected_impact}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {audit.notes && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Notas</h2>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{audit.notes}</p>
        </div>
      )}
    </div>
  );
}
