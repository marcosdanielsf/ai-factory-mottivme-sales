import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  X,
  Building2,
  MessageCircle,
  Users,
  Target,
  Calendar,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { SupervisionFilters as FiltersType, FilterOption } from '../../types/supervision';

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
  placeholder?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  value,
  options,
  onChange,
  placeholder = 'Todos',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
          ${value
            ? 'bg-accent-primary/10 border border-accent-primary text-accent-primary'
            : 'bg-bg-hover border border-transparent text-text-secondary hover:bg-border-default'
          }
        `}
      >
        {icon}
        <span className="hidden sm:inline">{label}:</span>
        <span className="font-medium truncate max-w-[100px]">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* Opcao "Todos" */}
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm
                ${!value ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-secondary hover:bg-bg-hover'}
              `}
            >
              <span>{placeholder}</span>
            </button>

            {/* Separador */}
            <div className="border-t border-border-default my-1" />

            {/* Opcoes */}
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm
                  ${value === option.value
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:bg-bg-hover'
                  }
                `}
              >
                <span className="truncate">{option.label}</span>
                <span className="text-xs text-text-muted ml-2">{option.count}</span>
              </button>
            ))}

            {options.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-text-muted">
                Nenhuma opcao disponivel
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface DateRangePickerProps {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onChange: (from: string | undefined, to: string | undefined) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ dateFrom, dateTo, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasDateFilter = dateFrom || dateTo;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = () => {
    if (!dateFrom && !dateTo) return 'Todas';
    if (dateFrom && dateTo) {
      return `${new Date(dateFrom).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${new Date(dateTo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }
    if (dateFrom) return `A partir de ${new Date(dateFrom).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    return `Ate ${new Date(dateTo!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  };

  const setPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange(from.toISOString().split('T')[0], to.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
          ${hasDateFilter
            ? 'bg-accent-primary/10 border border-accent-primary text-accent-primary'
            : 'bg-bg-hover border border-transparent text-text-secondary hover:bg-border-default'
          }
        `}
      >
        <Calendar size={16} />
        <span className="hidden sm:inline">Periodo:</span>
        <span className="font-medium">{formatDisplayDate()}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 p-3">
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'Hoje', days: 0 },
              { label: '7 dias', days: 7 },
              { label: '30 dias', days: 30 },
              { label: '90 dias', days: 90 },
            ].map((preset) => (
              <button
                key={preset.days}
                onClick={() => setPreset(preset.days)}
                className="px-2 py-1 text-xs bg-bg-hover hover:bg-border-default rounded text-text-secondary"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom dates */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">De</label>
              <input
                type="date"
                value={dateFrom || ''}
                onChange={(e) => onChange(e.target.value || undefined, dateTo)}
                className="w-full px-2 py-1.5 text-sm bg-bg-primary border border-border-default rounded text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Ate</label>
              <input
                type="date"
                value={dateTo || ''}
                onChange={(e) => onChange(dateFrom, e.target.value || undefined)}
                className="w-full px-2 py-1.5 text-sm bg-bg-primary border border-border-default rounded text-text-primary"
              />
            </div>
          </div>

          {/* Limpar */}
          {hasDateFilter && (
            <button
              onClick={() => {
                onChange(undefined, undefined);
                setIsOpen(false);
              }}
              className="w-full py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Limpar datas
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface SupervisionFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
  options: {
    locations: FilterOption[];
    channels: FilterOption[];
    etapasFunil: FilterOption[];
    responsaveis: FilterOption[];
  };
  loading?: boolean;
}

export const SupervisionFiltersBar: React.FC<SupervisionFiltersProps> = ({
  filters,
  onFilterChange,
  options,
  loading,
}) => {
  const activeFiltersCount = [
    filters.locationId,
    filters.channel,
    filters.etapaFunil,
    filters.responsavel,
    filters.dateFrom || filters.dateTo,
    filters.hasQualityIssues,
    filters.noResponse,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFilterChange({
      ...filters,
      locationId: undefined,
      channel: undefined,
      etapaFunil: undefined,
      responsavel: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      hasQualityIssues: undefined,
      noResponse: undefined,
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap py-2">
      {/* Icone de filtros */}
      <div className="flex items-center gap-1 text-text-muted text-sm mr-1">
        <Filter size={14} />
        <span className="hidden sm:inline">Filtros:</span>
      </div>

      {/* Dropdown: Cliente */}
      <FilterDropdown
        label="Cliente"
        icon={<Building2 size={14} />}
        value={filters.locationId || null}
        options={options.locations}
        onChange={(v) => onFilterChange({ ...filters, locationId: v })}
        placeholder="Todos os clientes"
      />

      {/* Dropdown: Canal */}
      <FilterDropdown
        label="Canal"
        icon={<MessageCircle size={14} />}
        value={filters.channel || null}
        options={options.channels}
        onChange={(v) => onFilterChange({ ...filters, channel: v })}
        placeholder="Todos os canais"
      />

      {/* Dropdown: Etapa Funil */}
      {options.etapasFunil.length > 0 && (
        <FilterDropdown
          label="Etapa"
          icon={<Target size={14} />}
          value={filters.etapaFunil || null}
          options={options.etapasFunil}
          onChange={(v) => onFilterChange({ ...filters, etapaFunil: v })}
          placeholder="Todas as etapas"
        />
      )}

      {/* Dropdown: Responsavel */}
      {options.responsaveis.length > 0 && (
        <FilterDropdown
          label="Responsavel"
          icon={<Users size={14} />}
          value={filters.responsavel || null}
          options={options.responsaveis}
          onChange={(v) => onFilterChange({ ...filters, responsavel: v })}
          placeholder="Todos"
        />
      )}

      {/* Date Range */}
      <DateRangePicker
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onChange={(from, to) => onFilterChange({ ...filters, dateFrom: from, dateTo: to })}
      />

      {/* Toggle: Sem Resposta */}
      <button
        onClick={() => onFilterChange({ ...filters, noResponse: !filters.noResponse })}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
          ${filters.noResponse
            ? 'bg-yellow-400/10 border border-yellow-400 text-yellow-400'
            : 'bg-bg-hover border border-transparent text-text-secondary hover:bg-border-default'
          }
        `}
        title="Filtrar conversas aguardando resposta da IA"
      >
        <MessageCircle size={14} />
        <span className="hidden sm:inline">Sem Resposta</span>
      </button>

      {/* Toggle: Com Problemas */}
      <button
        onClick={() => onFilterChange({ ...filters, hasQualityIssues: !filters.hasQualityIssues })}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
          ${filters.hasQualityIssues
            ? 'bg-red-500/10 border border-red-500 text-red-400'
            : 'bg-bg-hover border border-transparent text-text-secondary hover:bg-border-default'
          }
        `}
        title="Filtrar conversas com problemas de qualidade"
      >
        <AlertTriangle size={14} />
        <span className="hidden sm:inline">Problemas</span>
      </button>

      {/* Botao limpar filtros */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={12} />
          Limpar ({activeFiltersCount})
        </button>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="ml-auto">
          <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
