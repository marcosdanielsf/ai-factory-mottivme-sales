import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface CostEvent {
  id: string;
  agent_id: string | null;
  model: string | null;
  event_type: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost: number | null;
  created_at: string;
}

interface AgentMap {
  [agentId: string]: string;
}

interface CostTableProps {
  data: CostEvent[];
  agentMap?: AgentMap;
  loading: boolean;
  pageSize?: number;
}

type SortKey = 'cost' | 'created_at';
type SortDir = 'asc' | 'desc';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={12} className="text-text-muted opacity-40" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-indigo-400" />
    : <ChevronDown size={12} className="text-indigo-400" />;
}

export function CostTable({ data, agentMap = {}, loading, pageSize = 20 }: CostTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const sorted = [...data].sort((a, b) => {
    if (sortKey === 'cost') {
      const diff = (a.cost ?? 0) - (b.cost ?? 0);
      return sortDir === 'asc' ? diff : -diff;
    }
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortDir === 'asc' ? diff : -diff;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-64 animate-pulse" />
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border-default">
        <h3 className="text-text-primary text-sm font-semibold">
          Eventos de Custo ({data.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border-default">
              <th
                className="text-left px-4 py-3 text-text-muted font-medium cursor-pointer hover:text-text-secondary select-none"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Data
                  <SortIcon active={sortKey === 'created_at'} dir={sortDir} />
                </div>
              </th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">Agente</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">Modelo</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">Tipo</th>
              <th className="text-right px-4 py-3 text-text-muted font-medium">Tokens In</th>
              <th className="text-right px-4 py-3 text-text-muted font-medium">Tokens Out</th>
              <th
                className="text-right px-4 py-3 text-text-muted font-medium cursor-pointer hover:text-text-secondary select-none"
                onClick={() => handleSort('cost')}
              >
                <div className="flex items-center justify-end gap-1">
                  Custo
                  <SortIcon active={sortKey === 'cost'} dir={sortDir} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {!paged.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">
                  Nenhum evento encontrado
                </td>
              </tr>
            ) : (
              paged.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border-default/50 hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {formatDate(event.created_at)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-xs">
                    {event.agent_id
                      ? agentMap[event.agent_id] ?? event.agent_id.slice(0, 8) + '…'
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {event.model ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-400">
                      {event.event_type ?? 'other'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary text-xs">
                    {(event.input_tokens ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary text-xs">
                    {(event.output_tokens ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary text-xs font-medium">
                    ${(event.cost ?? 0).toFixed(6)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border-default flex items-center justify-between">
          <span className="text-text-muted text-xs">
            Pagina {page + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
