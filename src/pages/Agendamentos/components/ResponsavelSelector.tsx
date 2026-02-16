import React, { useState, useMemo } from 'react';
import { User, ChevronDown, Search } from 'lucide-react';
import type { ResponsavelInfo } from '../../../hooks/useAgendamentosStats';

interface ResponsavelSelectorProps {
  responsaveis: ResponsavelInfo[];
  selectedName: string | null;
  onChange: (name: string | null) => void;
  isLoading?: boolean;
}

export const ResponsavelSelector: React.FC<ResponsavelSelectorProps> = ({
  responsaveis,
  selectedName,
  onChange,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredResponsaveis = useMemo(() => {
    if (!search) return responsaveis;
    const lower = search.toLowerCase();
    return responsaveis.filter((r) => r.name.toLowerCase().includes(lower));
  }, [responsaveis, search]);

  const selectedResponsavel = responsaveis.find((r) => r.name === selectedName);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors min-w-[180px] justify-between disabled:opacity-50"
      >
        <div className="flex items-center gap-2 truncate">
          <User size={14} />
          <span className="truncate">
            {isLoading
              ? 'Carregando...'
              : selectedResponsavel
                ? selectedResponsavel.name
                : 'Todos os responsáveis'}
          </span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
            <div className="p-2 border-b border-border-default">
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar responsável..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-bg-tertiary border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-60">
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover transition-colors flex items-center justify-between ${
                  !selectedName ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-primary'
                }`}
              >
                <span>Todos os responsáveis</span>
                <span className="text-xs text-text-muted">
                  {responsaveis.reduce((sum, r) => sum + r.count, 0)}
                </span>
              </button>

              {filteredResponsaveis.map((responsavel) => (
                <button
                  key={responsavel.name}
                  onClick={() => {
                    onChange(responsavel.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover transition-colors flex items-center justify-between ${
                    selectedName === responsavel.name
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-primary'
                  }`}
                >
                  <span className="truncate">{responsavel.name}</span>
                  <span className="text-xs text-text-muted ml-2">{responsavel.count}</span>
                </button>
              ))}

              {filteredResponsaveis.length === 0 && (
                <div className="px-3 py-4 text-sm text-text-muted text-center">
                  Nenhum responsável encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
