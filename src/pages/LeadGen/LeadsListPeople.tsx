import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { useLeadLists } from '../../hooks/leadgen/useLeadLists';
import LeadTable from './components/LeadTable';
import LeadDetailPanel from './components/LeadDetailPanel';
import StatusBadge from './components/StatusBadge';
import SourceTabs from './components/SourceTabs';
import EnrichmentActions from './components/EnrichmentActions';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type SortField =
  | 'first_name'
  | 'email_address'
  | 'company_name'
  | 'lead_source'
  | 'lead_score'
  | 'status'
  | 'connection_status';

type SortDir = 'asc' | 'desc';

const SOURCE_TABS = ['All', 'Apollo', 'LinkedIn', 'GMaps'] as const;
type SourceTab = (typeof SOURCE_TABS)[number];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const getScoreColor = (score: number | null) => {
  if (score === null || score === undefined) return 'text-text-muted';
  if (score >= 80) return 'text-[#3fb950]';
  if (score >= 50) return 'text-[#d29922]';
  return 'text-[#f85149]';
};

const getSourceBadge = (source: string) => {
  const map: Record<string, string> = {
    Apollo: 'bg-[#5c6bc0]/15 text-[#7986cb] border-[#5c6bc0]/30',
    LinkedIn: 'bg-[#0077b5]/15 text-[#0a8fdb] border-[#0077b5]/30',
    GMaps: 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30',
  };
  return map[source] ?? 'bg-bg-secondary text-text-muted border-border-default';
};

// ═══════════════════════════════════════════════════════════════════════
// COLUMNS CONFIG
// ═══════════════════════════════════════════════════════════════════════

const COLUMNS: { key: SortField; label: string }[] = [
  { key: 'first_name', label: 'Nome' },
  { key: 'email_address', label: 'Email' },
  { key: 'company_name', label: 'Company' },
  { key: 'lead_source', label: 'Source' },
  { key: 'lead_score', label: 'Score' },
  { key: 'status', label: 'Status' },
  { key: 'connection_status', label: 'Connection' },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const LeadsListPeople: React.FC = () => {
  const { leads, loading } = useLeadLists({ type: 'Person' });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<SourceTab>('All');
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedLead, setSelectedLead] = useState<(typeof leads)[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          `${l.first_name ?? ''} ${l.last_name ?? ''}`.toLowerCase().includes(q) ||
          (l.email_address ?? '').toLowerCase().includes(q) ||
          (l.company_name ?? '').toLowerCase().includes(q)
      );
    }

    if (activeTab !== 'All') {
      result = result.filter((l) => l.lead_source === activeTab);
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [leads, searchTerm, activeTab, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-text-muted opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-accent-primary" />
    ) : (
      <ChevronDown size={12} className="text-accent-primary" />
    );
  };

  return (
    <div className="bg-bg-primary min-h-full flex">
      {/* Main content */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${selectedLead ? 'mr-[400px]' : ''}`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
                <Users size={24} className="text-accent-primary" />
                Leads — People
              </h1>
              <p className="text-sm text-text-muted mt-1">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar nome, email ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-muted hover:text-text-primary hover:border-accent-primary/40 transition-all"
              >
                <Filter size={14} />
                Filtros
              </button>
            </div>
          </div>

          {/* Source Tabs */}
          <SourceTabs
            tabs={SOURCE_TABS as unknown as string[]}
            active={activeTab}
            onChange={(tab) => setActiveTab(tab as SourceTab)}
          />

          {/* Table */}
          {loading ? (
            <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-default">
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-border-default animate-pulse">
                      {COLUMNS.map((col) => (
                        <td key={col.key} className="px-4 py-3">
                          <div className="h-4 bg-bg-primary rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-12 text-center">
              <div className="w-14 h-14 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-text-muted" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Nenhum lead encontrado</h3>
              <p className="text-sm text-text-muted">
                {searchTerm || activeTab !== 'All'
                  ? 'Tente ajustar os filtros.'
                  : 'Importe leads para comecar.'}
              </p>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-secondary border-b border-border-default">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <SortIcon field={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const fullName = `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || '—';
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(isSelected ? null : lead)}
                        className={`border-b border-border-default cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
                            : 'hover:bg-bg-primary'
                        }`}
                      >
                        {/* Nome */}
                        <td className="px-4 py-3 text-sm font-medium text-text-primary whitespace-nowrap">
                          {fullName}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {lead.email_address ? (
                            <a
                              href={`mailto:${lead.email_address}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-accent-primary hover:underline"
                            >
                              <Mail size={12} />
                              {lead.email_address}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {lead.company_name ?? '—'}
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3">
                          {lead.lead_source ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getSourceBadge(lead.lead_source)}`}
                            >
                              {lead.lead_source}
                            </span>
                          ) : (
                            <span className="text-sm text-text-muted">—</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3 text-sm font-semibold">
                          <span className={getScoreColor(lead.lead_score)}>
                            {lead.lead_score ?? '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {lead.status ? (
                            <StatusBadge status={lead.status} />
                          ) : (
                            <span className="text-sm text-text-muted">—</span>
                          )}
                        </td>

                        {/* Connection */}
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {lead.connection_status ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedLead && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-bg-secondary border-l border-border-default overflow-y-auto z-30 shadow-xl">
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            enrichmentActions={
              <EnrichmentActions
                leadId={selectedLead.id}
                webhooks={{
                  enrich_record: 'https://cliente-a1.mentorfy.io/webhook/07d99d5f-add8-49db-aabf-726ccceba926',
                  enrich_person: 'https://cliente-a1.mentorfy.io/webhook/b5bdb531-510a-4d02-a206-ecaf36c145b0',
                  enrich_company: 'https://cliente-a1.mentorfy.io/webhook/78ecec2e-4ced-433e-8533-a910dde74356',
                  verify_email: 'https://cliente-a1.mentorfy.io/webhook/50286ab4-8291-4256-a221-a3414d93c44f',
                  enrich_socials: 'https://cliente-a1.mentorfy.io/webhook/4f6df36e-76f2-433e-8169-b77baf2d457f',
                }}
              />
            }
          />
        </div>
      )}
    </div>
  );
};

export default LeadsListPeople;
