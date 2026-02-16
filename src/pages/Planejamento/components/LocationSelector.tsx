import React, { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';

export function LocationSelector({ locations, selectedLocationId, onChange, isLoading }: {
  locations: { location_id: string; location_name: string }[];
  selectedLocationId: string | null;
  onChange: (id: string | null) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? locations.filter(l => l.location_name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  const selected = locations.find(l => l.location_id === selectedLocationId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg hover:border-purple-500/50 transition-colors disabled:opacity-50 min-w-[160px]"
      >
        <Building2 size={14} className={selected ? 'text-purple-400' : 'text-text-muted'} />
        <span className={`truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected ? selected.location_name : 'Todos os Clientes'}
        </span>
        <ChevronDown size={14} className={`text-text-muted ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-bg-primary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
              !selectedLocationId ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-text-primary hover:bg-bg-hover'
            }`}
          >
            Todos os Clientes
          </button>
          <div className="border-t border-border-default max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">Nenhum cliente encontrado</div>
            ) : (
              filtered.map(loc => (
                <button
                  key={loc.location_id}
                  onClick={() => { onChange(loc.location_id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedLocationId === loc.location_id
                      ? 'bg-purple-500/20 text-purple-400 font-medium'
                      : 'text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {loc.location_name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
