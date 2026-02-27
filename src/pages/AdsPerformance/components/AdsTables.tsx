import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '../helpers';
import type { CampanhaMetrics, AdsetMetrics, AdAggregate } from '../types';

interface AdsTablesProps {
  campanhas: CampanhaMetrics[];
  adsets: AdsetMetrics[];
  anuncios: AdAggregate[];
  loading?: boolean;
}

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePageIndex = Math.min(page, totalPages - 1);
  const paged = items.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize);
  const start = items.length > 0 ? safePageIndex * pageSize + 1 : 0;
  const end = Math.min((safePageIndex + 1) * pageSize, items.length);

  return {
    paged,
    page: safePageIndex,
    totalPages,
    start,
    end,
    total: items.length,
    prev: () => setPage(p => Math.max(0, p - 1)),
    next: () => setPage(p => Math.min(totalPages - 1, p + 1)),
  };
}

const thClass = "px-3 py-2 text-left text-xs font-medium text-text-muted whitespace-nowrap";
const tdClass = "px-3 py-2 text-sm text-text-secondary";
const tdBoldClass = "px-3 py-2 text-sm text-text-primary font-medium";

function PaginationFooter({ start, end, total, prev, next, page, totalPages }: {
  start: number; end: number; total: number; prev: () => void; next: () => void; page: number; totalPages: number;
}) {
  return (
    <div className="px-3 py-2 border-t border-border-default flex items-center justify-between text-xs text-text-muted">
      <span>{start} - {end} / {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={prev}
          disabled={page === 0}
          className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={next}
          disabled={page >= totalPages - 1}
          className="p-1 rounded hover:bg-bg-hover disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export const AdsTables: React.FC<AdsTablesProps> = ({ campanhas, adsets, anuncios, loading }) => {
  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }
  const campPag = usePagination(campanhas, 6);
  const adsetPag = usePagination(adsets, 12);
  const adPag = usePagination(anuncios, 6);

  return (
    <div className="space-y-4">
      {/* Tabela 1 — Campanhas */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Campanhas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className={thClass}>Nome</th>
                <th className={thClass}>Alcance</th>
                <th className={thClass}>Cliques</th>
                <th className={thClass}>Reacoes</th>
                <th className={thClass}>Valor Usado</th>
                <th className={thClass}>Cadastros</th>
                <th className={thClass}>Custo/Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {campPag.paged.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-text-muted text-sm">Sem dados</td></tr>
              ) : campPag.paged.map((c) => (
                <tr key={c.campaign_id ?? c.campaign_name} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                  <td className={`${tdBoldClass} max-w-[220px] truncate`} title={c.campaign_name}>{c.campaign_name}</td>
                  <td className={tdClass}>{formatNumber(c.totalReach)}</td>
                  <td className={tdClass}>{formatNumber(c.totalClicks)}</td>
                  <td className={tdClass}>{formatNumber(c.totalReactions)}</td>
                  <td className={tdBoldClass}>{formatCurrency(c.totalSpend)}</td>
                  <td className={tdClass}>{formatNumber(c.totalFormSubmissions)}</td>
                  <td className={tdClass}>{c.custoPorCadastro > 0 ? formatCurrency(c.custoPorCadastro) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campanhas.length > 0 && (
          <PaginationFooter {...campPag} />
        )}
      </div>

      {/* Tabela 2 — Conjuntos de Anuncios */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Conjuntos de Anuncios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className={thClass}>Nome</th>
                <th className={thClass}>Alcance</th>
                <th className={thClass}>Cliques</th>
                <th className={thClass}>Reacoes</th>
                <th className={thClass}>Valor Usado</th>
                <th className={thClass}>Cadastros</th>
                <th className={thClass}>Custo/Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {adsetPag.paged.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-text-muted text-sm">Sem dados</td></tr>
              ) : adsetPag.paged.map((s) => (
                <tr key={s.adset_id ?? s.adset_name} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                  <td className={`${tdBoldClass} max-w-[220px] truncate`} title={s.adset_name}>{s.adset_name}</td>
                  <td className={tdClass}>{formatNumber(s.totalReach)}</td>
                  <td className={tdClass}>{formatNumber(s.totalClicks)}</td>
                  <td className={tdClass}>{formatNumber(s.totalReactions)}</td>
                  <td className={tdBoldClass}>{formatCurrency(s.totalSpend)}</td>
                  <td className={tdClass}>{formatNumber(s.totalFormSubmissions)}</td>
                  <td className={tdClass}>{s.custoPorCadastro > 0 ? formatCurrency(s.custoPorCadastro) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adsets.length > 0 && (
          <PaginationFooter {...adsetPag} />
        )}
      </div>

      {/* Tabela 3 — Anuncios */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Anuncios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className={thClass}>Nome</th>
                <th className={thClass}>Alcance</th>
                <th className={thClass}>Cliques</th>
                <th className={thClass}>Reacoes</th>
                <th className={thClass}>Valor Usado</th>
                <th className={thClass}>Cadastros</th>
                <th className={thClass}>Custo/Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {adPag.paged.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-text-muted text-sm">Sem dados</td></tr>
              ) : adPag.paged.map((a) => (
                <tr key={a.ad_id} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                  <td className={`${tdBoldClass} max-w-[220px] truncate`} title={a.ad_name}>{a.ad_name}</td>
                  <td className={tdClass}>{formatNumber(a.totalReach)}</td>
                  <td className={tdClass}>{formatNumber(a.totalClicks)}</td>
                  <td className={tdClass}>{formatNumber(a.totalReactions)}</td>
                  <td className={tdBoldClass}>{formatCurrency(a.totalSpend)}</td>
                  <td className={tdClass}>{formatNumber(a.totalFormSubmissions)}</td>
                  <td className={tdClass}>{a.custoPorCadastro > 0 ? formatCurrency(a.custoPorCadastro) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {anuncios.length > 0 && (
          <PaginationFooter {...adPag} />
        )}
      </div>
    </div>
  );
};
