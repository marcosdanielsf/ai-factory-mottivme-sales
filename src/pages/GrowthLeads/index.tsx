import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { useGrowthLeads } from '@/hooks/useGrowthLeads';
import { KPICards } from './components/KPICards';
import { FiltersBar } from './components/FiltersBar';
import { CountryChart } from './components/CountryChart';
import { LeadsTable } from './components/LeadsTable';

export const GrowthLeads: React.FC = () => {
  const {
    kpis, countryBreakdown, specialties, leads,
    totalRows, page, totalPages,
    loading, loadingTable, error,
    filters, sortField, sortAsc,
    setPage, toggleSort, updateFilters, updateSearch, refetch,
  } = useGrowthLeads();

  return (
    <div className="bg-bg-primary min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Database size={20} className="text-accent-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Growth Leads</h1>
              <p className="text-xs text-text-muted">Leads scrapeados multi-pais</p>
            </div>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* KPIs */}
        <KPICards kpis={kpis} loading={loading} />

        {/* Filters */}
        <FiltersBar
          filters={filters}
          specialties={specialties}
          onUpdateFilters={updateFilters}
          onUpdateSearch={updateSearch}
        />

        {/* Chart */}
        <CountryChart data={countryBreakdown} loading={loading} />

        {/* Table */}
        <LeadsTable
          leads={leads}
          loading={loadingTable}
          page={page}
          totalPages={totalPages}
          totalRows={totalRows}
          sortField={sortField}
          sortAsc={sortAsc}
          filters={filters}
          searchTerm={filters.search}
          onPageChange={setPage}
          onToggleSort={toggleSort}
        />
      </div>
    </div>
  );
};

export default GrowthLeads;
