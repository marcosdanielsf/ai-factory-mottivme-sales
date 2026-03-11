import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { ScoreGauge } from '../shared/ScoreGauge';
import { PotencialBadge } from '../shared/PotencialBadge';
import { ImpulsionadorBar } from '../shared/ImpulsionadorBar';
import { SearchableSelect } from '../shared/SearchableSelect';
import { formatCurrency, formatPct } from '../../helpers';
import type { LeadScoreRow, ScoreDriver } from '../../types';

interface LeadScoreTabProps {
  rows: LeadScoreRow[];
  loading: boolean;
}

type SortKey = 'gasto' | 'leads' | 'cpl' | 'resp_pct' | 'score';

const SortIcon = ({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) => {
  if (sortKey !== col) return null;
  return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
};

export const LeadScoreTab: React.FC<LeadScoreTabProps> = ({ rows, loading }) => {
  const [filterCampaign, setFilterCampaign] = useState('');
  const [filterAdset, setFilterAdset] = useState('');
  const [filterAd, setFilterAd] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const campaigns = useMemo(() => [...new Set(rows.map(r => r.campaign_name))], [rows]);
  const adsets = useMemo(() => {
    const base = filterCampaign ? rows.filter(r => r.campaign_name === filterCampaign) : rows;
    return [...new Set(base.map(r => r.adset_name))];
  }, [rows, filterCampaign]);
  const ads = useMemo(() => {
    let base = rows;
    if (filterCampaign) base = base.filter(r => r.campaign_name === filterCampaign);
    if (filterAdset) base = base.filter(r => r.adset_name === filterAdset);
    return [...new Set(base.map(r => r.ad_name))];
  }, [rows, filterCampaign, filterAdset]);

  const filtered = useMemo(() => {
    let result = rows;
    if (filterCampaign) result = result.filter(r => r.campaign_name === filterCampaign);
    if (filterAdset) result = result.filter(r => r.adset_name === filterAdset);
    if (filterAd) result = result.filter(r => r.ad_name === filterAd);
    result = [...result].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return result;
  }, [rows, filterCampaign, filterAdset, filterAd, sortKey, sortAsc]);

  const totals = useMemo(() => ({
    gasto: filtered.reduce((s, r) => s + r.gasto, 0),
    leads: filtered.reduce((s, r) => s + r.leads, 0),
    cplMedio: filtered.length > 0
      ? filtered.reduce((s, r) => s + r.cpl, 0) / filtered.length
      : 0,
    respMedio: filtered.length > 0
      ? filtered.reduce((s, r) => s + r.resp_pct, 0) / filtered.length
      : 0,
    scoreMedio: filtered.length > 0
      ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length)
      : 0,
  }), [filtered]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const thClass = 'px-3 py-2 text-left text-xs font-medium text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap select-none';

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <SearchableSelect
          value={filterCampaign}
          onChange={val => { setFilterCampaign(val); setFilterAdset(''); setFilterAd(''); }}
          options={campaigns}
          placeholder="Campanhas"
          allLabel="Todas Campanhas"
        />
        <SearchableSelect
          value={filterAdset}
          onChange={val => { setFilterAdset(val); setFilterAd(''); }}
          options={adsets}
          placeholder="Adsets"
          allLabel="Todos Adsets"
        />
        <SearchableSelect
          value={filterAd}
          onChange={setFilterAd}
          options={ads}
          placeholder="Anuncios"
          allLabel="Todos Anuncios"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Gasto Total', value: formatCurrency(totals.gasto) },
          { label: 'Total Leads', value: String(totals.leads) },
          { label: 'CPL Medio', value: formatCurrency(totals.cplMedio) },
          { label: 'Resp.% Medio', value: formatPct(totals.respMedio) },
          { label: 'Score Medio', value: String(totals.scoreMedio) },
        ].map(card => (
          <div
            key={card.label}
            className="bg-bg-secondary border border-border-default rounded-lg px-3 py-2.5"
          >
            <p className="text-[10px] text-text-muted mb-0.5">{card.label}</p>
            <p className="text-lg font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted w-8" />
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Anuncio</th>
                <th className={thClass} onClick={() => handleSort('gasto')}>
                  <span className="flex items-center gap-1">Gasto (R$) <SortIcon col="gasto" sortKey={sortKey} sortAsc={sortAsc} /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('leads')}>
                  <span className="flex items-center gap-1">Leads <SortIcon col="leads" sortKey={sortKey} sortAsc={sortAsc} /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('cpl')}>
                  <span className="flex items-center gap-1">CPL <SortIcon col="cpl" sortKey={sortKey} sortAsc={sortAsc} /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('resp_pct')}>
                  <span className="flex items-center gap-1">Resp.(%) <SortIcon col="resp_pct" sortKey={sortKey} sortAsc={sortAsc} /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('score')}>
                  <span className="flex items-center gap-1">Score <SortIcon col="score" sortKey={sortKey} sortAsc={sortAsc} /></span>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Potencial</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-text-muted text-sm">
                    Nenhum dado encontrado para os filtros selecionados
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <React.Fragment key={row.ad_id}>
                    <tr
                      className="border-b border-border-default hover:bg-bg-hover transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === row.ad_id ? null : row.ad_id)}
                    >
                      <td className="px-3 py-2.5 text-text-muted">
                        {expandedRow === row.ad_id
                          ? <ChevronUp size={14} />
                          : <ChevronDown size={14} />
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm text-text-primary font-medium max-w-[220px] truncate" title={row.ad_name}>
                          {row.ad_name}
                        </p>
                        <p className="text-[10px] text-text-muted truncate max-w-[220px]">
                          {row.campaign_name} · {row.adset_name}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-text-primary font-medium">
                        {formatCurrency(row.gasto)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-text-secondary">{row.leads}</td>
                      <td className="px-3 py-2.5 text-sm text-text-secondary">{formatCurrency(row.cpl)}</td>
                      <td className="px-3 py-2.5 text-sm text-text-secondary">{formatPct(row.resp_pct)}</td>
                      <td className="px-3 py-2.5">
                        <ScoreGauge score={row.score} />
                      </td>
                      <td className="px-3 py-2.5">
                        <PotencialBadge potencial={row.potencial} />
                      </td>
                    </tr>
                    {expandedRow === row.ad_id && (
                      <tr className="border-b border-border-default bg-bg-hover/40">
                        <td colSpan={8} className="px-6 py-3">
                          <ExpandedDrivers
                            drivers={row.top_drivers}
                            detractors={row.top_detractors}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-3 py-2 border-t border-border-default text-xs text-text-muted">
            {filtered.length} anuncios
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Expanded row: drivers + detractors using single-bar ImpulsionadorBar ─────

interface ExpandedDriversProps {
  drivers: ScoreDriver[];
  detractors: ScoreDriver[];
}

const ExpandedDrivers: React.FC<ExpandedDriversProps> = ({ drivers, detractors }) => {
  const allPositive = drivers.map(d => ({ ...d, isPositive: true }));
  const allNegative = detractors.map(d => ({ ...d, isPositive: false }));
  const combined = [...allPositive, ...allNegative];
  const maxAbs = Math.max(...combined.map(d => Math.abs(d.pct)), 1);

  return (
    <div className="grid grid-cols-2 gap-6 py-1">
      <div>
        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          Impulsionadores
        </p>
        {drivers.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum</p>
        ) : (
          <div className="space-y-2">
            {drivers.map((d, i) => (
              <ImpulsionadorBar
                key={i}
                label={d.label}
                value={d.pct}
                isPositive={true}
                maxValue={maxAbs}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">
          Detratores
        </p>
        {detractors.length === 0 ? (
          <p className="text-xs text-text-muted">Nenhum</p>
        ) : (
          <div className="space-y-2">
            {detractors.map((d, i) => (
              <ImpulsionadorBar
                key={i}
                label={d.label}
                value={d.pct}
                isPositive={false}
                maxValue={maxAbs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
