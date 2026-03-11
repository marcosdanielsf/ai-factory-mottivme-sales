import React from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { Priority } from './PriorityBadge';

export type FilterPriority = Priority | 'all';

interface Tenant {
  id: string;
  name: string;
}

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPriority: FilterPriority;
  onPriorityChange: (priority: FilterPriority) => void;
  selectedTenant: string | null;
  onTenantChange: (tenantId: string | null) => void;
  tenants: Tenant[];
  totalCount?: number;
  filteredCount?: number;
}

const priorityOptions: { value: FilterPriority; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: 'bg-slate-600 text-white' },
  { value: 'hot', label: 'Hot', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'warm', label: 'Warm', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'cold', label: 'Cold', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'nurturing', label: 'Nurturing', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  selectedTenant,
  onTenantChange,
  tenants,
  totalCount,
  filteredCount,
}) => {
  const [tenantDropdownOpen, setTenantDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTenantDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTenantName = selectedTenant
    ? tenants.find(t => t.id === selectedTenant)?.name || 'Selecionar'
    : 'Todos os Tenants';

  const clearFilters = () => {
    onSearchChange('');
    onPriorityChange('all');
    onTenantChange(null);
  };

  const hasActiveFilters = searchQuery || selectedPriority !== 'all' || selectedTenant;

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por username ou nome..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5
              bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg
              text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
              transition-all
            "
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Priority Chips */}
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPriorityChange(option.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium border
                transition-all duration-200
                ${selectedPriority === option.value
                  ? option.value === 'all'
                    ? 'bg-slate-600 text-white border-slate-500'
                    : option.color + ' border'
                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Tenant Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
            className="
              flex items-center gap-2 px-3 py-2.5
              bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg
              text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50
              transition-all min-w-[160px]
            "
          >
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-left text-sm truncate">
              {selectedTenantName}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${tenantDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {tenantDropdownOpen && (
            <div className="
              absolute z-50 mt-2 w-full min-w-[200px]
              bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg
              shadow-xl shadow-slate-200/50 dark:shadow-black/20
              py-1 max-h-60 overflow-y-auto
            ">
              <button
                onClick={() => {
                  onTenantChange(null);
                  setTenantDropdownOpen(false);
                }}
                className={`
                  w-full px-4 py-2 text-left text-sm
                  hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors
                  ${selectedTenant === null ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 dark:text-slate-300'}
                `}
              >
                Todos os Tenants
              </button>
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => {
                    onTenantChange(tenant.id);
                    setTenantDropdownOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left text-sm
                    hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors
                    ${selectedTenant === tenant.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-600 dark:text-slate-300'}
                  `}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="
              flex items-center gap-1.5 px-3 py-2
              text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white
              transition-colors
            "
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Results count */}
      {totalCount !== undefined && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>
            {filteredCount !== undefined && filteredCount !== totalCount
              ? `Mostrando ${filteredCount} de ${totalCount} leads`
              : `${totalCount} leads`
            }
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
              Filtros ativos
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadFilters;
