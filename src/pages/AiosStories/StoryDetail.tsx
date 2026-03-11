import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, RefreshCw, DollarSign, Layers, Calendar } from 'lucide-react';
import { useAiosStories } from '../../hooks/aios/useAiosStories';
import { useAiosStoryPhases } from '../../hooks/aios/useAiosStoryPhases';
import { useAiosTasks } from '../../hooks/aios/useAiosTasks';
import { useAiosQaLoops } from '../../hooks/aios/useAiosQaLoops';
import { useAiosAgents } from '../../hooks/aios/useAiosAgents';
import { StoryPhaseProgress } from './components/StoryPhaseProgress';
import { TaskList } from './components/TaskList';
import { QaLoopIndicator } from './components/QaLoopIndicator';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendente', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  in_progress: { label: 'Em Andamento', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  qa: { label: 'Em QA', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  completed: { label: 'Concluido', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  failed: { label: 'Falhou', color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baixa', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
  medium: { label: 'Media', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  high: { label: 'Alta', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  critical: { label: 'Critica', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function AiosStoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stories, loading: storiesLoading } = useAiosStories();
  const { data: phases, loading: phasesLoading } = useAiosStoryPhases(id);
  const { data: tasks } = useAiosTasks({ story_id: id });
  const { data: qaLoops } = useAiosQaLoops(id);
  const { data: agents } = useAiosAgents();

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const story = stories.find((s) => s.id === id);

  function togglePhase(phaseId: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }

  if (storiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="text-text-muted animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/aios/stories')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="text-text-muted">Story nao encontrada.</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.pending;
  const priorityKey = (story as any).priority ?? 'medium';
  const priorityConfig = PRIORITY_CONFIG[priorityKey] ?? PRIORITY_CONFIG.medium;
  const leadAgent = agents.find((a) => a.id === (story as any).assigned_agent_id);

  const progressPct = (story as any).progress ?? 0;
  const totalCost = (story as any).total_cost ?? 0;
  const completedPhases = (story as any).completed_phases ?? 0;
  const totalPhases = (story as any).total_phases ?? phases.length;

  return (
    <div className="flex flex-col min-h-0 p-6 max-w-4xl mx-auto w-full">
      {/* Back button */}
      <button
        onClick={() => navigate('/aios/stories')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors mb-5 w-fit"
      >
        <ArrowLeft size={16} /> Voltar ao Board
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap mb-3">
          <h1 className="text-text-primary text-xl font-bold flex-1 leading-snug">
            {story.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}
            >
              {priorityConfig.label}
            </span>
          </div>
        </div>

        {story.description && (
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            {story.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-text-muted text-xs">Progresso geral</span>
            <span className="text-text-secondary text-xs font-medium">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-text-muted text-xs">
            <Layers size={13} className="shrink-0" />
            <span>{completedPhases}/{totalPhases} fases</span>
          </div>
          {leadAgent && (
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <span className="text-text-secondary">Agente lider:</span>
              <span className="text-text-primary">{leadAgent.name}</span>
            </div>
          )}
          {totalCost > 0 && (
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <DollarSign size={13} className="shrink-0" />
              <span>${totalCost.toFixed(4)}</span>
            </div>
          )}
          {(story as any).started_at && (
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Calendar size={13} className="shrink-0" />
              <span>Iniciado em {formatDate((story as any).started_at)}</span>
            </div>
          )}
          {(story as any).completed_at && (
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Calendar size={13} className="shrink-0" />
              <span>Concluido em {formatDate((story as any).completed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase progress visual */}
      {phases.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 mb-4">
          <h2 className="text-text-secondary text-sm font-semibold mb-3">Linha do Tempo de Fases</h2>
          <StoryPhaseProgress
            phases={phases}
            completedPhases={completedPhases}
            totalPhases={totalPhases}
          />
        </div>
      )}

      {/* Phases with tasks */}
      <div className="bg-bg-secondary border border-border-default rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-text-secondary text-sm font-semibold">Fases</h2>
        </div>

        {phasesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={16} className="text-text-muted animate-spin" />
          </div>
        ) : phases.length === 0 ? (
          <p className="text-text-muted text-sm px-4 py-6 text-center">
            Sem fases definidas para esta story.
          </p>
        ) : (
          <div className="divide-y divide-border-default">
            {phases.map((phase) => {
              const isExpanded = expandedPhases.has(phase.id);
              const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);
              const phaseStatusMap: Record<string, string> = {
                pending: 'text-gray-400',
                in_progress: 'text-blue-400',
                completed: 'text-green-400',
                failed: 'text-red-400',
              };
              const phaseColor = phaseStatusMap[phase.status] ?? 'text-gray-400';

              return (
                <div key={phase.id}>
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
                  >
                    <span className="text-text-muted">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="text-text-muted text-xs w-5 shrink-0">
                      #{phase.phase_order}
                    </span>
                    <span className="text-text-primary text-sm font-medium flex-1">
                      {phase.name}
                    </span>
                    <span className={`text-xs shrink-0 ${phaseColor}`}>
                      {phase.status}
                    </span>
                    <span className="text-text-muted text-xs shrink-0">
                      {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-default bg-bg-tertiary/30">
                      {phase.description && (
                        <p className="text-text-muted text-xs px-4 pt-2 pb-1">
                          {phase.description}
                        </p>
                      )}
                      <TaskList tasks={phaseTasks} agents={agents} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QA Loops */}
      <div className="bg-bg-secondary border border-border-default rounded-lg">
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
          <h2 className="text-text-secondary text-sm font-semibold">Ciclos QA</h2>
          <span className="text-text-muted text-xs">
            {qaLoops.length} ciclo{qaLoops.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4">
          <QaLoopIndicator loops={qaLoops} />
        </div>
      </div>
    </div>
  );
}
