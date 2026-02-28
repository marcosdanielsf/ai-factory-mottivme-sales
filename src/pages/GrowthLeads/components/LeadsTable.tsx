import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink, Download, Columns3 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sanitizeSearch, type SortableField } from '@/hooks/useGrowthLeads';
import { getCountryFlag, getCountryLabel, formatNumber } from '../helpers';
import type { GrowthLead, GrowthLeadsFilters } from '../types';

interface LeadsTableProps {
  leads: GrowthLead[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  sortField: SortableField;
  sortAsc: boolean;
  filters: GrowthLeadsFilters;
  searchTerm: string;
  onPageChange: (page: number) => void;
  onToggleSort: (field: SortableField) => void;
}

const thClass = 'px-2 py-1.5 text-left text-[11px] font-medium text-text-muted whitespace-nowrap cursor-pointer hover:text-text-primary transition-colors select-none';
const tdClass = 'px-2 py-1 text-xs text-text-secondary whitespace-nowrap';

type ColumnKey = 'name' | 'country' | 'region' | 'company' | 'title' | 'source_channel' | 'contacts' | 'created_at';

const ALL_COLUMNS: { key: ColumnKey; label: string; sortField?: SortableField }[] = [
  { key: 'name', label: 'Nome', sortField: 'name' },
  { key: 'country', label: 'País', sortField: 'country' },
  { key: 'region', label: 'Região', sortField: 'region' },
  { key: 'company', label: 'Empresa', sortField: 'company' },
  { key: 'title', label: 'Especialidade', sortField: 'title' },
  { key: 'source_channel', label: 'Fonte', sortField: 'source_channel' },
  { key: 'contacts', label: 'Contatos' },
  { key: 'created_at', label: 'Data', sortField: 'created_at' },
];

const DEFAULT_VISIBLE: ColumnKey[] = ['name', 'country', 'title', 'contacts', 'created_at'];

const SortIcon: React.FC<{ field: string; sortField: string; sortAsc: boolean }> = ({ field, sortField, sortAsc }) => {
  if (field !== sortField) return null;
  return sortAsc ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />;
};

const ContactBadge: React.FC<{ value: string | null; label: string; color: string }> = ({ value, label, color }) => {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {label}
    </span>
  );
};

const safeLinkHref = (url: string): string => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch { return '#'; }
};

const displayValue = (val: unknown): string => {
  if (val == null) return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const NullCell = () => <span className="text-text-muted/40">—</span>;

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads, loading, page, totalPages, totalRows, sortField, sortAsc, filters, searchTerm, onPageChange, onToggleSort,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => new Set(DEFAULT_VISIBLE));
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colMenuOpen]);

  const toggleCol = (key: ColumnKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 3) return prev; // min 3 columns
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const activeCols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));
  const totalColSpan = activeCols.length + 1; // +1 for expand column

  const EXPORT_HEADERS = ['name','phone','email','whatsapp','instagram_username','linkedin_url','company','region','country','title','source_channel','created_at'] as const;

  const handleExport = useCallback(async () => {
    if (!isSupabaseConfigured() || exporting) return;
    setExporting(true);
    try {
      let query = supabase
        .from('growth_leads')
        .select(EXPORT_HEADERS.join(','))
        .order('created_at', { ascending: false })
        .limit(5000);

      if (filters.countries.length > 0) query = query.in('country', filters.countries);
      if (filters.regions.length > 0) query = query.in('region', filters.regions);
      if (filters.dateRange.startDate) query = query.gte('created_at', filters.dateRange.startDate.toISOString());
      if (filters.dateRange.endDate) query = query.lte('created_at', filters.dateRange.endDate.toISOString());
      if (searchTerm) {
        const safe = sanitizeSearch(searchTerm);
        if (safe) query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%,title.ilike.%${safe}%`);
      }
      if (filters.enrichmentStatus === 'enriched') {
        query = query.or('email.not.is.null,whatsapp.not.is.null,instagram_username.not.is.null');
      } else if (filters.enrichmentStatus === 'no_contact') {
        query = query.is('email', null).is('whatsapp', null).is('instagram_username', null).is('linkedin_url', null);
      }
      if (filters.specialty) query = query.eq('title', filters.specialty);

      const { data, error: qErr } = await query;
      if (qErr) throw new Error(qErr.message);
      if (!data || data.length === 0) return;

      const csv = [
        EXPORT_HEADERS.join(','),
        ...data.map(row => EXPORT_HEADERS.map(h => {
          const val = (row as Record<string, unknown>)[h];
          const str = val == null ? '' : String(val);
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth_leads_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export error silently handled
    } finally {
      setExporting(false);
    }
  }, [filters, searchTerm, exporting]);

  const renderCell = (lead: GrowthLead, col: ColumnKey) => {
    switch (col) {
      case 'name':
        return <td key={col} className={`${tdClass} font-medium text-text-primary max-w-[180px] truncate`}>{lead.name}</td>;
      case 'country':
        return <td key={col} className={tdClass}><span title={getCountryLabel(lead.country)}>{getCountryFlag(lead.country)} {lead.country}</span></td>;
      case 'region':
        return <td key={col} className={`${tdClass} max-w-[100px] truncate`}>{lead.region ? lead.region : <NullCell />}</td>;
      case 'company':
        return <td key={col} className={`${tdClass} max-w-[130px] truncate`}>{lead.company ? lead.company : <NullCell />}</td>;
      case 'title':
        return <td key={col} className={`${tdClass} max-w-[160px] truncate`}>{lead.title ? lead.title : <NullCell />}</td>;
      case 'source_channel':
        return (
          <td key={col} className={tdClass}>
            {lead.source_channel ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400">
                {lead.source_channel}
              </span>
            ) : <NullCell />}
          </td>
        );
      case 'contacts':
        return (
          <td key={col} className={tdClass}>
            <div className="flex flex-wrap gap-1">
              <ContactBadge value={lead.email} label="Email" color="bg-blue-500/10 text-blue-400" />
              <ContactBadge value={lead.whatsapp} label="WA" color="bg-green-500/10 text-green-400" />
              {lead.instagram_username && (
                <a
                  href={`https://instagram.com/${lead.instagram_username.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors"
                >
                  IG <ExternalLink size={8} />
                </a>
              )}
              {lead.linkedin_url && (
                <a
                  href={safeLinkHref(lead.linkedin_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 transition-colors"
                >
                  LI <ExternalLink size={8} />
                </a>
              )}
            </div>
          </td>
        );
      case 'created_at':
        return <td key={col} className={tdClass}>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>;
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border-default flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Leads <span className="text-text-muted font-normal">({formatNumber(totalRows)})</span>
        </h3>
        <div className="flex items-center gap-2">
          {/* Column toggle */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setColMenuOpen(!colMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-tertiary border border-border-default rounded-md transition-colors"
              title="Colunas visíveis"
            >
              <Columns3 size={12} />
              Colunas ({visibleCols.size})
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 py-1">
                {ALL_COLUMNS.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover cursor-pointer text-xs text-text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.key)}
                      onChange={() => toggleCol(col.key)}
                      className="rounded border-border-default accent-accent-primary"
                    />
                    {col.label}
                  </label>
                ))}
                <div className="border-t border-border-default mt-1 pt-1 px-3 py-1">
                  <button
                    onClick={() => setVisibleCols(new Set(ALL_COLUMNS.map(c => c.key)))}
                    className="text-[10px] text-accent-primary hover:underline mr-3"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setVisibleCols(new Set(DEFAULT_VISIBLE))}
                    className="text-[10px] text-text-muted hover:underline"
                  >
                    Padrão
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-tertiary border border-border-default rounded-md hover:border-border-default transition-colors disabled:opacity-50"
          >
            <Download size={12} />
            {exporting ? 'Exportando...' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-tertiary/50">
            <tr>
              {activeCols.map(col => (
                <th
                  key={col.key}
                  className={thClass}
                  onClick={col.sortField ? () => onToggleSort(col.sortField!) : undefined}
                  style={!col.sortField ? { cursor: 'default' } : undefined}
                >
                  {col.label}
                  {col.sortField && <SortIcon field={col.sortField} sortField={sortField} sortAsc={sortAsc} />}
                </th>
              ))}
              <th className="px-2 py-1.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: totalColSpan }).map((_, j) => (
                    <td key={j} className={tdClass}><div className="h-3 bg-bg-tertiary rounded animate-pulse w-16" /></td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={totalColSpan} className="px-3 py-8 text-center text-text-muted text-sm">Sem leads para os filtros selecionados</td>
              </tr>
            ) : (
              leads.map(lead => (
                <React.Fragment key={lead.id}>
                  <tr className="hover:bg-bg-hover transition-colors border-b border-border-default/50">
                    {activeCols.map(col => renderCell(lead, col.key))}
                    <td className="px-2 py-1">
                      {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
                        <button
                          onClick={() => setExpandedRow(expandedRow === lead.id ? null : lead.id)}
                          className="p-1 hover:bg-bg-tertiary rounded transition-colors text-text-muted"
                        >
                          <ChevronDown size={14} className={`transition-transform ${expandedRow === lead.id ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRow === lead.id && lead.custom_fields && (
                    <tr className="bg-bg-tertiary/30">
                      <td colSpan={totalColSpan} className="px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {Object.entries(lead.custom_fields).map(([key, val]) => (
                            <div key={key}>
                              <span className="text-text-muted">{key}: </span>
                              <span className="text-text-secondary">{displayValue(val)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-2 border-t border-border-default flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Página {page + 1} de {formatNumber(totalPages)} ({formatNumber(totalRows)} leads)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-1.5 hover:bg-bg-hover rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 hover:bg-bg-hover rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
