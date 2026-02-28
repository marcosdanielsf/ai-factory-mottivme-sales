import React from 'react';
import { Search, X } from 'lucide-react';
import { COUNTRY_CONFIG, getCountryFlag } from '../helpers';
import type { GrowthLeadsFilters, SpecialtyBreakdown } from '../types';

interface FiltersBarProps {
  filters: GrowthLeadsFilters;
  specialties: SpecialtyBreakdown[];
  onUpdateFilters: (partial: Partial<GrowthLeadsFilters>) => void;
  onUpdateSearch: (value: string) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, specialties, onUpdateFilters, onUpdateSearch }) => {
  const toggleCountry = (code: string) => {
    const next = filters.countries.includes(code)
      ? filters.countries.filter(c => c !== code)
      : [...filters.countries, code];
    onUpdateFilters({ countries: next });
  };

  const activeCount = [
    filters.countries.length > 0,
    filters.enrichmentStatus !== 'all',
    !!filters.specialty,
    !!filters.search,
  ].filter(Boolean).length;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar nome, email, cidade..."
            value={filters.search}
            onChange={e => onUpdateSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
          />
        </div>

        {/* Enrichment status */}
        <select
          value={filters.enrichmentStatus}
          onChange={e => onUpdateFilters({ enrichmentStatus: e.target.value as GrowthLeadsFilters['enrichmentStatus'] })}
          className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
        >
          <option value="all">Todos</option>
          <option value="enriched">Com contato</option>
          <option value="no_contact">Sem contato</option>
        </select>

        {/* Specialty */}
        <select
          value={filters.specialty}
          onChange={e => onUpdateFilters({ specialty: e.target.value })}
          className="px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 max-w-[200px]"
        >
          <option value="">Todas especialidades</option>
          {specialties.map(s => (
            <option key={s.specialty} value={s.specialty}>
              {s.specialty} ({s.total})
            </option>
          ))}
        </select>

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={() => {
              onUpdateFilters({ countries: [], enrichmentStatus: 'all', specialty: '' });
              onUpdateSearch('');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-accent-error hover:bg-accent-error/10 rounded-md transition-colors"
          >
            <X size={12} />
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Country chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(COUNTRY_CONFIG).map(([code, config]) => {
          const isActive = filters.countries.includes(code);
          return (
            <button
              key={code}
              onClick={() => toggleCountry(code)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors
                ${isActive
                  ? 'bg-accent-primary/10 border border-accent-primary/40 text-accent-primary'
                  : 'bg-bg-tertiary border border-border-default/50 text-text-secondary hover:border-border-default hover:text-text-primary'}
              `}
            >
              <span>{getCountryFlag(code)}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
