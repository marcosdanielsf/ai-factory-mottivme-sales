import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const MAX_LABEL_LENGTH = 60;

function truncate(text: string): string {
  if (text.length <= MAX_LABEL_LENGTH) return text;
  return text.slice(0, MAX_LABEL_LENGTH) + '...';
}

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  allLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  allLabel = 'Todos',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter(opt => opt.toLowerCase().includes(term));
  }, [options, search]);

  const selectedLabel = value
    ? truncate(value)
    : allLabel;

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSearch('');
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={open ? () => { setOpen(false); setSearch(''); } : handleOpen}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors min-w-[140px] max-w-[220px]"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: open ? 'var(--accent-primary)' : 'var(--border-default)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
        title={value || allLabel}
      >
        <span className="flex-1 text-left truncate">{selectedLabel}</span>

        {value ? (
          <X
            size={12}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
            onClick={handleClear}
          />
        ) : (
          <ChevronDown
            size={12}
            className="flex-shrink-0 transition-transform"
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-72 rounded-lg border shadow-xl overflow-hidden"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* Search input */}
          <div
            className="flex items-center gap-2 px-2.5 py-2 border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Buscar ${placeholder.toLowerCase()}...`}
              className="flex-1 bg-transparent text-xs outline-none placeholder-[var(--text-muted)]"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="flex-shrink-0"
              >
                <X size={11} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          {/* Item count */}
          <div
            className="px-2.5 py-1 text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {filtered.length === options.length
              ? `${options.length} itens`
              : `${filtered.length} de ${options.length} itens`}
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="max-h-52 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* "Todos" option */}
            {!search && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className="w-full text-left px-2.5 py-1.5 text-xs transition-colors"
                  style={{
                    background: !value ? 'var(--accent-primary)20' : 'transparent',
                    color: !value ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: !value ? 600 : 400,
                  }}
                >
                  {allLabel}
                </button>
              </li>
            )}

            {filtered.length === 0 ? (
              <li
                className="px-2.5 py-3 text-xs text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                Nenhum resultado para "{search}"
              </li>
            ) : (
              filtered.map(opt => {
                const isSelected = value === opt;
                const label = truncate(opt);
                const needsTooltip = opt.length > MAX_LABEL_LENGTH;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt)}
                      title={needsTooltip ? opt : undefined}
                      className="w-full text-left px-2.5 py-1.5 text-xs transition-colors"
                      style={{
                        background: isSelected ? 'var(--accent-primary)20' : 'transparent',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--bg-hover, rgba(255,255,255,0.05))';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }
                      }}
                    >
                      {label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
