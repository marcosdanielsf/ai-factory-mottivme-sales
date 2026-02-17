import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useAiosSquads } from '../../hooks/aios/useAiosSquads';
import { useAiosStories } from '../../hooks/aios/useAiosStories';
import { useAiosCostBudgets } from '../../hooks/aios/useAiosCostBudgets';
import {
  AiosSquadStrategy,
  AiosSquadMemberRole,
  AiosStoryStatus,
  AiosPriority,
  aiosSquadStrategyConfig,
} from '../../types/aios';
import { SquadMemberList } from './components/SquadMemberList';
import { SquadStoryList } from './components/SquadStoryList';
import { SquadCostSummary } from './components/SquadCostSummary';
import { AddAgentModal } from './components/AddAgentModal';

interface SquadMemberAgent {
  id: string;
  name: string;
  status: string;
  config: Record<string, unknown> | null;
}

interface SquadMember {
  id: string;
  squad_id: string;
  agent_id: string;
  role: AiosSquadMemberRole;
  joined_at: string;
  aios_agents: SquadMemberAgent;
}

interface RawSquad {
  id: string;
  name: string;
  description: string | null;
  strategy: AiosSquadStrategy;
  is_active: boolean;
  aios_squad_members: SquadMember[];
}

interface RawStory {
  id: string;
  title: string;
  status: AiosStoryStatus;
  priority: AiosPriority;
  progress: number;
  total_cost: number;
  squad_id: string | null;
}

export function AiosSquadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rawSquads, loading: squadsLoading, addMember, removeMember } = useAiosSquads();
  const { data: rawStories, loading: storiesLoading } = useAiosStories(
    id ? { squad_id: id } : undefined
  );
  const { data: budgets } = useAiosCostBudgets();
  const [showAddAgent, setShowAddAgent] = useState(false);

  const squads = rawSquads as unknown as RawSquad[];
  const stories = rawStories as unknown as RawStory[];

  const squad = useMemo(
    () => squads.find((s) => s.id === id) ?? null,
    [squads, id]
  );

  const squadBudget = useMemo(
    () => budgets.find((b) => b.squad_id === id && b.is_active) ?? null,
    [budgets, id]
  );

  const existingAgentIds = useMemo(
    () => squad?.aios_squad_members.map((m) => m.agent_id) ?? [],
    [squad]
  );

  if (squadsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-secondary rounded w-1/3" />
          <div className="h-48 bg-bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-muted">Squad não encontrado</p>
        <button
          onClick={() => navigate('/aios/squads')}
          className="mt-3 text-xs text-accent-primary hover:underline"
        >
          Voltar para Squads
        </button>
      </div>
    );
  }

  const strategyConfig = aiosSquadStrategyConfig[squad.strategy];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/aios/squads')}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-text-primary truncate">{squad.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-medium flex-shrink-0">
              {strategyConfig.label}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                squad.is_active
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-gray-500 bg-gray-500/10'
              }`}
            >
              {squad.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {squad.description && (
            <p className="text-sm text-text-muted mt-0.5">{squad.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowAddAgent(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Agente
        </button>
      </div>

      <SquadCostSummary
        totalCost={0}
        totalStories={stories.length}
        budgetUsd={squadBudget?.budget_amount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SquadMemberList
          squadId={squad.id}
          members={squad.aios_squad_members ?? []}
          onRemoveMember={removeMember}
        />

        {storiesLoading ? (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-40" />
        ) : (
          <SquadStoryList stories={stories} />
        )}
      </div>

      {showAddAgent && (
        <AddAgentModal
          squadId={squad.id}
          existingAgentIds={existingAgentIds}
          onClose={() => setShowAddAgent(false)}
          onSubmit={addMember}
        />
      )}
    </div>
  );
}
