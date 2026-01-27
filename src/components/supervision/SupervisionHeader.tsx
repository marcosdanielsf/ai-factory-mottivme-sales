import React, { useState } from 'react';
import { RefreshCw, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { SupervisionFilters, SupervisionStatus, FilterOption } from '../../types/supervision';
import { SupervisionFiltersBar } from './SupervisionFilters';

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
  filterOptions?: {
    locations: FilterOption[];
    channels: FilterOption[];
    etapasFunil: FilterOption[];
    responsaveis: FilterOption[];
  };
  isMobile?: boolean;
}

export const SupervisionHeader: React.FC<SupervisionHeaderProps> = ({
  stats,
  filters,
  onFilterChange,
  onRefresh,
  loading,
  filterOptions,
  isMobile = false,
}) => {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showStatusPills, setShowStatusPills] = useState(!isMobile);

  const statusOptions: { value: SupervisionStatus | 'all'; label: string; shortLabel: string; count: number }[] = [
    { value: 'all', label: 'Todos', shortLabel: 'Todos', count: stats.total },
    { value: 'ai_active', label: 'IA Ativa', shortLabel: 'Ativa', count: stats.aiActive },
    { value: 'ai_paused', label: 'IA Pausada', shortLabel: 'Pausada', count: stats.aiPaused },
    { value: 'scheduled', label: 'Agendados', shortLabel: 'Agend.', count: stats.scheduled },
    { value: 'converted', label: 'Convertidos', shortLabel: 'Conv.', count: stats.converted },
  ];

  // Conta quantos filtros estão ativos
  const activeFiltersCount = [
    filters.status !== 'all',
    filters.locationId,
    filters.channel,
    filters.etapaFunil,
    filters.responsavelId,
    filters.search,
  ].filter(Boolean).length;

  // Status atual selecionado
  const currentStatus = statusOptions.find(s => s.value === filters.status);

  return (
    <div className="bg-bg-secondary border-b border-border-default p-3 md:p-4">
      {/* Header Top Row */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-text-primary truncate">
            {isMobile ? 'Supervisão' : 'Painel de Supervisão'}
          </h1>
          {!isMobile && (
            <p className="text-sm text-text-muted">
              Monitore e gerencie conversas da IA em tempo real
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de filtros - Mobile */}
          {isMobile && (
            <button
              onClick={() => setShowFiltersModal(true)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFiltersCount > 0 
                  ? 'bg-accent-primary/10 text-accent-primary' 
                  : 'bg-bg-hover text-text-secondary hover:bg-border-default'
              }`}
            >
              <Filter size={16} />
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-accent-primary text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-bg-hover hover:bg-border-default rounded-lg text-sm text-text-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {!isMobile && 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Status Pills - Mobile: botão colapsável / Desktop: sempre visível */}
      {isMobile ? (
        <div className="mb-3">
          <button
            onClick={() => setShowStatusPills(!showStatusPills)}
            className="w-full flex items-center justify-between px-3 py-2 bg-bg-hover rounded-lg text-sm"
          >
            <span className="text-text-secondary">
              {currentStatus?.label || 'Todos'} 
              <span className="ml-1 text-text-muted">({currentStatus?.count || stats.total})</span>
            </span>
            {showStatusPills ? (
              <ChevronUp size={16} className="text-text-muted" />
            ) : (
              <ChevronDown size={16} className="text-text-muted" />
            )}
          </button>
          
          {showStatusPills && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onFilterChange({ ...filters, status: option.value });
                    setShowStatusPills(false);
                  }}
                  className={`
                    px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${
                      filters.status === option.value
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-hover text-text-secondary hover:bg-border-default'
                    }
                  `}
                >
                  {option.shortLabel}
                  <span className="ml-1 px-1 py-0.5 rounded-full bg-black/20 text-[10px]">
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
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
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder={isMobile ? "Buscar..." : "Buscar por nome, telefone ou mensagem..."}
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
        />
      </div>

      {/* Filtros Avancados - Desktop apenas */}
      {!isMobile && filterOptions && (
        <SupervisionFiltersBar
          filters={filters}
          onFilterChange={onFilterChange}
          options={filterOptions}
          loading={loading}
        />
      )}

      {/* Modal de Filtros - Mobile */}
      {isMobile && showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-bg-secondary rounded-t-xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-bg-secondary border-b border-border-default p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      onFilterChange({
                        status: 'all',
                        search: '',
                        locationId: undefined,
                        channel: undefined,
                        etapaFunil: undefined,
                        responsavelId: undefined,
                      });
                    }}
                    className="text-sm text-accent-primary"
                  >
                    Limpar
                  </button>
                )}
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="p-2 hover:bg-bg-hover rounded-lg"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm text-text-muted mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onFilterChange({ ...filters, status: option.value })}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          filters.status === option.value
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-hover text-text-secondary'
                        }
                      `}
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros avançados se existirem */}
              {filterOptions && (
                <>
                  {/* Localização */}
                  {filterOptions.locations.length > 0 && (
                    <div>
                      <label className="block text-sm text-text-muted mb-2">Localização</label>
                      <select
                        value={filters.locationId || ''}
                        onChange={(e) => onFilterChange({ ...filters, locationId: e.target.value || undefined })}
                        className="w-full px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">Todas</option>
                        {filterOptions.locations.map((loc) => (
                          <option key={loc.value} value={loc.value}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Canal */}
                  {filterOptions.channels.length > 0 && (
                    <div>
                      <label className="block text-sm text-text-muted mb-2">Canal</label>
                      <select
                        value={filters.channel || ''}
                        onChange={(e) => onFilterChange({ ...filters, channel: e.target.value || undefined })}
                        className="w-full px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">Todos</option>
                        {filterOptions.channels.map((ch) => (
                          <option key={ch.value} value={ch.value}>
                            {ch.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Etapa do Funil */}
                  {filterOptions.etapasFunil.length > 0 && (
                    <div>
                      <label className="block text-sm text-text-muted mb-2">Etapa do Funil</label>
                      <select
                        value={filters.etapaFunil || ''}
                        onChange={(e) => onFilterChange({ ...filters, etapaFunil: e.target.value || undefined })}
                        className="w-full px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">Todas</option>
                        {filterOptions.etapasFunil.map((etapa) => (
                          <option key={etapa.value} value={etapa.value}>
                            {etapa.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Responsável */}
                  {filterOptions.responsaveis.length > 0 && (
                    <div>
                      <label className="block text-sm text-text-muted mb-2">Responsável</label>
                      <select
                        value={filters.responsavelId || ''}
                        onChange={(e) => onFilterChange({ ...filters, responsavelId: e.target.value || undefined })}
                        className="w-full px-3 py-2.5 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">Todos</option>
                        {filterOptions.responsaveis.map((resp) => (
                          <option key={resp.value} value={resp.value}>
                            {resp.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="sticky bottom-0 bg-bg-secondary border-t border-border-default p-4">
              <button
                onClick={() => setShowFiltersModal(false)}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
