import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, CheckSquare, FileText, ListChecks, Activity } from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { AiosExpertFramework, AiosExpertChecklist } from '../../types/aios';

function FrameworkCard({ framework }: { framework: AiosExpertFramework }) {
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
      <div className="flex items-start gap-2 mb-2">
        <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-text-primary">{framework.name}</h4>
          {framework.description && (
            <p className="text-xs text-text-muted mt-0.5">{framework.description}</p>
          )}
        </div>
      </div>

      {framework.steps.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Passos</p>
          <ol className="space-y-1">
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
        <div className="mt-3">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">Casos de uso</p>
          <div className="flex flex-wrap gap-1">
            {framework.use_cases.map((uc, i) => (
              <span key={i} className="px-2 py-0.5 bg-bg-secondary border border-border-default rounded text-[10px] text-text-secondary">
                {uc}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistCard({ checklist }: { checklist: AiosExpertChecklist }) {
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks className="w-4 h-4 text-green-400" />
        <h4 className="text-sm font-semibold text-text-primary">{checklist.title}</h4>
        {checklist.category && (
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-green-400/10 text-green-400 rounded-full">
            {checklist.category}
          </span>
        )}
      </div>
      <ul className="space-y-1.5">
        {checklist.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-xs text-text-secondary">
            <CheckSquare className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
            <span>{item.label}</span>
            {item.required && (
              <span className="ml-auto text-[10px] text-red-400 flex-shrink-0">obrigatório</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

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

export function ExpertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: experts, loading } = useAiosExperts();

  const expert = experts.find((e) => e.id === id);

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

      {/* Frameworks */}
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
                <p className="text-xs text-text-secondary font-mono bg-bg-secondary rounded p-2">
                  {sf.content}
                </p>
                {sf.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sf.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-bg-secondary border border-border-default rounded text-text-muted">
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

      {/* Checklists */}
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

      {/* Tasks executadas placeholder */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-muted" />
          Tasks Executadas
        </h2>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-8 text-center">
          <Activity className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            {expert.total_tasks_executed} tasks executadas no total
          </p>
          <p className="text-xs text-text-muted mt-1">
            Histórico detalhado disponível após integração com aios_tasks
          </p>
        </div>
      </section>
    </div>
  );
}
