import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface LeadTableProps<T extends { id?: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRowClick?: (row: T) => void;
  selectedId?: string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export default function LeadTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  searchValue = '',
  onSearchChange,
  onRowClick,
  selectedId,
  emptyMessage = 'Nenhum registro encontrado.',
}: LeadTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="flex flex-col h-full">
      {onSearchChange && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors"
          />
        </div>
      )}

      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden flex-1">
        {loading ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width }}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-default/50">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3">
                      <div className="h-4 bg-bg-tertiary rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      style={{ width: col.width }}
                      className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${
                        col.sortable ? 'cursor-pointer select-none hover:text-text-secondary' : ''
                      }`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortable && (
                          <span className="flex flex-col">
                            <ChevronUp
                              className={`w-3 h-3 -mb-1 ${
                                sortKey === col.key && sortDir === 'asc'
                                  ? 'text-accent-primary'
                                  : 'text-text-muted/40'
                              }`}
                            />
                            <ChevronDown
                              className={`w-3 h-3 ${
                                sortKey === col.key && sortDir === 'desc'
                                  ? 'text-accent-primary'
                                  : 'text-text-muted/40'
                              }`}
                            />
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const rowId = row.id ?? String(idx);
                  const isSelected = selectedId !== undefined && rowId === selectedId;
                  return (
                    <tr
                      key={rowId}
                      onClick={() => onRowClick?.(row)}
                      className={`border-b border-border-default/50 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-accent-primary/10'
                          : idx % 2 === 0
                          ? 'bg-bg-secondary hover:bg-bg-hover'
                          : 'bg-bg-primary hover:bg-bg-hover'
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-4 py-3 text-sm text-text-primary">
                          {col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
