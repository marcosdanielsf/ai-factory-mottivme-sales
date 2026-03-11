import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Brain, CheckSquare, FileText, ListChecks,
  Activity, ChevronDown, ChevronRight, Square, CheckSquare2,
} from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { AiosExpertFramework, AiosExpertChecklist } from '../../types/aios';

// =====================================================
// Framework Card — expansível
// =====================================================

function FrameworkCard({ framework }: { framework: AiosExpertFramework }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg overflow-hidden">
      {/* Header clicável */}
      <button
        className="w-full flex items-start gap-2 p-4 text-left hover:bg-bg-hover/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">{framework.name}</h4>
          {framework.description && !expanded && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{framework.description}</p>
          )}
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
          : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
        }
      </button>

      {/* Conteúdo expansível */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-default pt-3">
          {framework.description && (
            <p className="text-xs text-text-secondary leading-relaxed">{framework.description}</p>
          )}

          {framework.steps.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Passos</p>
              <ol className="space-y-1.5">
                {framework.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {framework.use_cases.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Casos de uso</p>
              <div className="flex flex-wrap gap-1">
                {framework.use_cases.map((uc, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-bg-secondary border border-border-default rounded text-[10px] text-text-secondary"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Checklist Card — itens com toggle
// =====================================================

function ChecklistCard({ checklist }: { checklist: AiosExpertChecklist }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(true);

  const completedCount = checklist.items.filter((i) => checked[i.id]).length;
  const totalCount = checklist.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-bg-hover/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <ListChecks className="w-4 h-4 text-green-400 flex-shrink-0" />
        <h4 className="text-sm font-semibold text-text-primary flex-1 truncate">{checklist.title}</h4>
        <span className="text-xs text-text-muted mr-1">{completedCount}/{totalCount}</span>
        {checklist.category && (
          <span className="text-[10px] px-2 py-0.5 bg-green-400/10 text-green-400 rounded-full flex-shrink-0">
            {checklist.category}
          </span>
        )}
        {expanded
          ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
        }
      </button>

      {/* Progress bar */}
      {expanded && totalCount > 0 && (
        <div className="px-4">
          <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      {expanded && (
        <ul className="px-4 pb-4 pt-3 space-y-2 border-t border-border-default mt-3">
          {checklist.items.map((item) => {
            const isChecked = !!checked[item.id];
            return (
              <li
                key={item.id}
                className="flex items-start gap-2 cursor-pointer group"
                onClick={() => toggle(item.id)}
              >
                {isChecked
                  ? <CheckSquare2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-text-muted group-hover:text-text-secondary flex-shrink-0 mt-0.5 transition-colors" />
                }
                <span className={`text-xs transition-colors leading-relaxed ${isChecked ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                  {item.label}
                </span>
                {item.required && !isChecked && (
                  <span className="ml-auto text-[10px] text-red-400 flex-shrink-0 mt-0.5">obrigatório</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// =====================================================
// Tasks placeholder com status visual
// =====================================================

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface MockTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  in_progress: { label: 'Em andamento', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  completed: { label: 'Concluída', color: 'text-green-400', bg: 'bg-green-400/10' },
  failed: { label: 'Falhou', color: 'text-red-400', bg: 'bg-red-400/10' },
};

function TaskRow({ task }: { task: MockTask }) {
  const cfg = TASK_STATUS_CONFIG[task.status];
  return (
    <div className="flex items-start gap-3 p-3 bg-bg-tertiary border border-border-default rounded-lg">
      <Activity className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-text-muted mt-0.5">{task.description}</p>
        )}
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${cfg.color} ${cfg.bg}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function buildTypicalTasks(expertName: string): MockTask[] {
  return [
    {
      id: 'task-1',
      title: `Analisar copy com framework de ${expertName}`,
      description: 'Revisar headline, abertura e CTA conforme os princípios do expert.',
      status: 'completed',
    },
    {
      id: 'task-2',
      title: 'Gerar variações de headline',
      description: 'Produzir 5 opções de headline para teste A/B.',
      status: 'in_progress',
    },
    {
      id: 'task-3',
      title: 'Executar checklist de qualidade',
      description: 'Verificar todos os itens obrigatórios antes de publicar.',
      status: 'pending',
    },
  ];
}

// =====================================================
// Helpers
// =====================================================

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-cyan-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// =====================================================
// Page
// =====================================================

export function ExpertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: experts, loading } = useAiosExperts();

  const expert = experts.find((e) => e.id === id);
  const typicalTasks = expert ? buildTypicalTasks(expert.name) : [];

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-bg-tertiary rounded" />
        <div className="h-24 bg-bg-tertiary rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-bg-tertiary rounded-lg" />
          <div className="h-40 bg-bg-tertiary rounded-lg" />
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/aios/experts')}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <p className="text-text-muted">Expert não encontrado.</p>
      </div>
    );
  }

  const avatarColor = getAvatarColor(expert.id);

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/aios/experts')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Experts
      </button>

      {/* Hero */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
        <div className="flex items-start gap-4">
          {expert.avatar_url ? (
            <img
              src={expert.avatar_url}
              alt={expert.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xl font-bold ${avatarColor}`}
            >
              {getInitials(expert.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-text-primary">{expert.name}</h1>
            <p className="text-sm text-text-muted">{expert.expertise}</p>
            {expert.bio && (
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">{expert.bio}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-default">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{expert.frameworks.length}</p>
            <p className="text-xs text-text-muted">Frameworks</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{expert.checklists.length}</p>
            <p className="text-xs text-text-muted">Checklists</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{expert.total_tasks_executed}</p>
            <p className="text-xs text-text-muted">Tasks Executadas</p>
          </div>
        </div>
      </div>

      {/* Frameworks expansíveis */}
      {expert.frameworks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Frameworks ({expert.frameworks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expert.frameworks.map((fw) => (
              <FrameworkCard key={fw.id} framework={fw} />
            ))}
          </div>
        </section>
      )}

      {/* Swipe Files */}
      {expert.swipe_files.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            Swipe Files ({expert.swipe_files.length})
          </h2>
          <div className="space-y-3">
            {expert.swipe_files.map((sf) => (
              <div key={sf.id} className="bg-bg-tertiary border border-border-default rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-text-primary">{sf.title}</h4>
                  {sf.category && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded-full">
                      {sf.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary font-mono bg-bg-secondary rounded p-2 whitespace-pre-wrap">
                  {sf.content}
                </p>
                {sf.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sf.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-bg-secondary border border-border-default rounded text-text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Checklists com toggle */}
      {expert.checklists.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-green-400" />
            Checklists ({expert.checklists.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expert.checklists.map((cl) => (
              <ChecklistCard key={cl.id} checklist={cl} />
            ))}
          </div>
        </section>
      )}

      {/* Tasks com status */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-muted" />
          Tasks Típicas
        </h2>
        <div className="space-y-2">
          {typicalTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
        {expert.total_tasks_executed > 0 && (
          <p className="text-xs text-text-muted mt-3 text-center">
            {expert.total_tasks_executed} tasks executadas no total · Histórico detalhado via aios_tasks
          </p>
        )}
      </section>
    </div>
  );
}
