import React from 'react';
import { RefreshCw, Filter, Search } from 'lucide-react';
import { SupervisionFilters, SupervisionStatus } from '../../types/supervision';

interface SupervisionHeaderProps {
  stats: {
    total: number;
    aiActive: number;
    aiPaused: number;
    scheduled: number;
    converted: number;
  };
  filters: SupervisionFilters;
  onFilterChange: (filters: SupervisionFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const SupervisionHeader: React.FC<SupervisionHeaderProps> = ({
  stats,
  filters,
  onFilterChange,
  onRefresh,
  loading,
}) => {
  const statusOptions: { value: SupervisionStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: stats.total },
    { value: 'ai_active', label: 'IA Ativa', count: stats.aiActive },
    { value: 'ai_paused', label: 'IA Pausada', count: stats.aiPaused },
    { value: 'scheduled', label: 'Agendados', count: stats.scheduled },
    { value: 'converted', label: 'Convertidos', count: stats.converted },
  ];

  return (
    <div className="bg-bg-secondary border-b border-border-default p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Painel de Supervisao</h1>
          <p className="text-sm text-text-muted">
            Monitore e gerencie conversas da IA em tempo real
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-bg-hover hover:bg-border-default rounded-lg text-sm text-text-secondary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Stats Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange({ ...filters, status: option.value })}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${
                filters.status === option.value
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-hover text-text-secondary hover:bg-border-default'
              }
            `}
          >
            {option.label}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou mensagem..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
        />
      </div>
    </div>
  );
};
