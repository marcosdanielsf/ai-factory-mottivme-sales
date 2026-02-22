import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, X, Check } from 'lucide-react';
import { SavedFilter, SupervisionFilters } from '../../types/supervision';

interface SavedFiltersPanelProps {
  savedFilters: SavedFilter[];
  currentFilters: SupervisionFilters;
  onApply: (filters: SupervisionFilters) => void;
  onSave: (name: string, filters: SupervisionFilters) => void;
  onDelete: (id: string) => void;
}

export const SavedFiltersPanel: React.FC<SavedFiltersPanelProps> = ({
  savedFilters,
  currentFilters,
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

  return (
    <div className="mt-2 pt-2 border-t border-border-default/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-text-muted text-xs">
          <Bookmark size={12} />
          <span>Filtros Salvos</span>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
        >
          {isCreating ? <X size={12} /> : <Plus size={12} />}
          {isCreating ? 'Cancelar' : 'Salvar Atual'}
        </button>
      </div>

      {/* Create new filter */}
      {isCreating && (
        <div className="flex items-center gap-2 mb-2">
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
            <Check size={14} />
          </button>
        </div>
      )}

      {/* Saved filter list */}
      <div className="flex flex-wrap gap-1.5">
        {savedFilters.map((filter) => (
          <div
            key={filter.id}
            className="group flex items-center gap-1 px-2.5 py-1.5 bg-bg-hover hover:bg-border-default rounded-lg text-xs transition-colors cursor-pointer"
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
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {savedFilters.length === 0 && !isCreating && (
          <span className="text-xs text-text-muted italic">Nenhum filtro salvo</span>
        )}
      </div>
    </div>
  );
};
