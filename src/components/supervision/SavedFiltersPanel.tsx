import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, X, Check } from 'lucide-react';
import { SavedFilter, SupervisionFilters } from '../../types/supervision';

interface SavedFiltersPanelProps {
  savedFilters: SavedFilter[];
  defaultClientFilters: SavedFilter[];
  currentFilters: SupervisionFilters;
  activeLocationId?: string | null;
  onApply: (filters: SupervisionFilters) => void;
  onSave: (name: string, filters: SupervisionFilters) => void;
  onDelete: (id: string) => void;
}

export const SavedFiltersPanel: React.FC<SavedFiltersPanelProps> = ({
  savedFilters,
  defaultClientFilters,
  currentFilters,
  activeLocationId,
  onApply,
  onSave,
  onDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    if (!newName.trim()) return;
    onSave(newName.trim(), currentFilters);
    setNewName('');
    setIsCreating(false);
  };

  const handleClientPillClick = (filter: SavedFilter) => {
    const isActive = activeLocationId === filter.filters.locationId;
    if (isActive) {
      // Toggle off: clear locationId filter
      onApply({ ...currentFilters, locationId: undefined });
    } else {
      onApply(filter.filters);
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-border-default/30 space-y-2">
      {/* Client quick-access pills */}
      {defaultClientFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {defaultClientFilters.map((filter) => {
            const isActive = activeLocationId === filter.filters.locationId;
            return (
              <button
                key={filter.id}
                onClick={() => handleClientPillClick(filter)}
                className={`
                  px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-hover/80 text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }
                `}
              >
                {filter.name}
              </button>
            );
          })}
        </div>
      )}

      {/* User-saved filters section */}
      {(savedFilters.length > 0 || isCreating) && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-text-muted text-xs">
              <Bookmark size={11} />
              <span>Filtros Salvos</span>
            </div>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
            >
              {isCreating ? <X size={11} /> : <Plus size={11} />}
              {isCreating ? 'Cancelar' : 'Salvar Atual'}
            </button>
          </div>

          {isCreating && (
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do filtro..."
                className="flex-1 px-2.5 py-1.5 bg-bg-primary border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={handleSave}
                disabled={!newName.trim()}
                className="p-1.5 bg-accent-primary text-white rounded-lg disabled:opacity-50"
              >
                <Check size={13} />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                className="group flex items-center gap-1 px-2.5 py-1 bg-bg-hover hover:bg-border-default rounded-full text-xs transition-colors cursor-pointer"
              >
                <button
                  onClick={() => onApply(filter.filters)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  {filter.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(filter.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-text-muted transition-all"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show "Salvar Atual" button alone when no saved filters and not creating */}
      {savedFilters.length === 0 && !isCreating && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted italic">Nenhum filtro salvo</span>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
          >
            <Plus size={11} />
            Salvar Atual
          </button>
        </div>
      )}
    </div>
  );
};
