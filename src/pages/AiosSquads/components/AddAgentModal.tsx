import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { AiosSquadMemberRole } from '../../../types/aios';
import { useAiosAgents } from '../../../hooks/aios/useAiosAgents';

interface AddAgentModalProps {
  squadId: string;
  existingAgentIds: string[];
  onClose: () => void;
  onSubmit: (squadId: string, agentId: string, role: AiosSquadMemberRole) => Promise<boolean>;
}

const ROLE_OPTIONS: { value: AiosSquadMemberRole; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'member', label: 'Membro' },
  { value: 'observer', label: 'Observer' },
];

const AGENT_STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400',
  idle: 'bg-gray-400',
  error: 'bg-red-400',
  offline: 'bg-gray-600',
};

export function AddAgentModal({ squadId, existingAgentIds, onClose, onSubmit }: AddAgentModalProps) {
  const { data: agents, loading } = useAiosAgents();
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [role, setRole] = useState<AiosSquadMemberRole>('member');
  const [submitting, setSubmitting] = useState(false);

  const availableAgents = useMemo(() => {
    return agents.filter(
      (a) =>
        !existingAgentIds.includes(a.id) &&
        a.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [agents, existingAgentIds, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setSubmitting(true);
    try {
      const success = await onSubmit(squadId, selectedAgentId, role);
      if (success) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md border border-border-default shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">Adicionar Agente</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agente..."
              className="w-full pl-8 pr-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border-default bg-bg-tertiary p-1">
            {loading ? (
              <p className="text-xs text-text-muted text-center py-4">Carregando...</p>
            ) : availableAgents.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                {agents.length === 0 ? 'Nenhum agente encontrado' : 'Todos os agentes já estão no squad'}
              </p>
            ) : (
              availableAgents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    selectedAgentId === agent.id
                      ? 'bg-accent-primary/10 border border-accent-primary/30'
                      : 'hover:bg-bg-hover border border-transparent'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      AGENT_STATUS_DOT[agent.status] ?? 'bg-gray-400'
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary font-medium truncate block">
                      {agent.name}
                    </span>
                    {agent.config?.model && (
                      <span className="text-xs text-text-muted font-mono">{String(agent.config.model)}</span>
                    )}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      agent.status === 'active'
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-gray-400 bg-gray-400/10'
                    }`}
                  >
                    {agent.status}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AiosSquadMemberRole)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-border-default rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedAgentId}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
