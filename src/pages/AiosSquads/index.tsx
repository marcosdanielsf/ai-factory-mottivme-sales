import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAiosSquads } from '../../hooks/aios/useAiosSquads';
import { AiosSquadStrategy } from '../../types/aios';
import { SquadCard } from './components/SquadCard';
import { NewSquadModal } from './components/NewSquadModal';

interface SquadMemberAgent {
  id: string;
  name: string;
  status: string;
}

interface SquadMember {
  id: string;
  agent_id: string;
  aios_agents: SquadMemberAgent;
}

export function AiosSquads() {
  const { data: rawSquads, loading, error, createSquad } = useAiosSquads();
  const [showModal, setShowModal] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const squads = rawSquads as unknown as Array<{
    id: string;
    name: string;
    description: string | null;
    strategy: AiosSquadStrategy;
    is_active: boolean;
    aios_squad_members: SquadMember[];
  }>;

  const filtered = squads.filter((s) => {
    if (filterActive === 'active') return s.is_active;
    if (filterActive === 'inactive') return !s.is_active;
    return true;
  });

  const handleCreate = async (data: { name: string; description: string; strategy: AiosSquadStrategy }) => {
    await createSquad(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Squads AIOS</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Squad
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilterActive(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterActive === opt
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary border border-border-default text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {opt === 'all' ? 'Todos' : opt === 'active' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
        <span className="text-xs text-text-muted ml-1">{filtered.length} squad(s)</span>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-44"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-muted">Nenhum squad encontrado</p>
          <p className="text-xs text-text-muted mt-1">
            Crie um squad para organizar seus agentes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((squad) => (
            <SquadCard
              key={squad.id}
              id={squad.id}
              name={squad.name}
              description={squad.description}
              strategy={squad.strategy}
              is_active={squad.is_active}
              members={squad.aios_squad_members ?? []}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NewSquadModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
