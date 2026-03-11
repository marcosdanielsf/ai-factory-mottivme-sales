import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check, User, Building2 } from 'lucide-react';

// Tipo genérico para opções
export interface SelectOption {
  id: string;
  label: string;
  count?: number;
}

interface SearchableSelectProps {
  options: SelectOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allLabel?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  icon?: 'user' | 'building' | 'none';
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  selectedId,
  onChange,
  placeholder = 'Selecionar',
  allLabel = 'Todos',
  searchPlaceholder = 'Buscar...',
  isLoading = false,
  icon = 'none',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  // Opção selecionada
  const selectedOption = options.find(o => o.id === selectedId);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const IconComponent = icon === 'user' ? User : icon === 'building' ? Building2 : null;

  // Calcular total de itens
  const totalCount = options.reduce((sum, opt) => sum + (opt.count || 0), 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors min-w-[180px] justify-between disabled:opacity-50"
      >
        <div className="flex items-center gap-2 truncate">
          {IconComponent && <IconComponent size={14} />}
          <span className="truncate">
            {isLoading
              ? 'Carregando...'
              : selectedOption
                ? selectedOption.label
                : allLabel
            }
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-border-default">
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-8 py-1.5 bg-bg-tertiary border border-border-default rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-hover rounded transition-colors"
                  >
                    <X size={12} className="text-text-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {/* "Todos" option */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover transition-colors flex items-center justify-between ${
                  !selectedId ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-primary'
                }`}
              >
                <span>{allLabel}</span>
                <div className="flex items-center gap-2">
                  {totalCount > 0 && (
                    <span className="text-xs text-text-muted">
                      ({totalCount.toLocaleString()})
                    </span>
                  )}
                  {!selectedId && <Check size={14} className="text-accent-primary" />}
                </div>
              </button>

              {/* Options */}
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-text-muted text-sm">
                  Nenhum resultado encontrado
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-bg-hover transition-colors flex items-center justify-between ${
                      selectedId === option.id
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {option.count !== undefined && (
                        <span className="text-xs text-text-muted ml-2">
                          ({option.count.toLocaleString()})
                        </span>
                      )}
                      {selectedId === option.id && (
                        <Check size={14} className="text-accent-primary" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchableSelect;
