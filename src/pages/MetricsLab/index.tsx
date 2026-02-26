import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FlaskConical, ChevronDown, AlertCircle, Loader2, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react';
import { AdRankingList } from './components/AdRankingList';
import { FunnelPanel } from './components/FunnelPanel';
import { useMetricsLab } from '../../hooks/useMetricsLab';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';
import type { PeriodDeltas, AnomalyRow, LeadScoreRow, FunnelAd } from './types';

// ─── Delta Badge ─────────────────────────────────────────────────────────────

interface DeltaBadgeProps {
  value: number | null;
  label: string;
  /** true = higher is better (clicks, leads, impressions); false = lower is better (spend, cpl) */
  higherIsBetter?: boolean;
}

const DeltaBadge: React.FC<DeltaBadgeProps> = ({ value, label, higherIsBetter = true }) => {
  if (value == null) return null;
  const positive = value >= 0;
  const good = higherIsBetter ? positive : !positive;
  const formatted = `${positive ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tabular-nums ${
      good
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'bg-rose-500/10 text-rose-400'
    }`}>
      {positive
        ? <TrendingUp size={9} className="flex-shrink-0" />
        : <TrendingDown size={9} className="flex-shrink-0" />}
      <span>{label} {formatted}</span>
    </div>
  );
};

// ─── Delta Row ───────────────────────────────────────────────────────────────

const PeriodDeltasRow: React.FC<{ deltas: PeriodDeltas }> = ({ deltas }) => {
  const badges: { value: number | null; label: string; higherIsBetter: boolean }[] = [
    { value: deltas.spend_delta,       label: 'Gasto',      higherIsBetter: false },
    { value: deltas.impressions_delta, label: 'Impress.',   higherIsBetter: true  },
    { value: deltas.clicks_delta,      label: 'Cliques',    higherIsBetter: true  },
    { value: deltas.ctr_delta,         label: 'CTR',        higherIsBetter: true  },
    { value: deltas.leads_delta,       label: 'Leads',      higherIsBetter: true  },
    { value: deltas.cpl_delta,         label: 'CPL',        higherIsBetter: false },
  ].filter(b => b.value !== null);

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-[var(--text-secondary)] opacity-60">vs periodo anterior</span>
      {badges.map(b => (
        <DeltaBadge key={b.label} value={b.value} label={b.label} higherIsBetter={b.higherIsBetter} />
      ))}
    </div>
  );
};

// ─── Anomaly Banner ───────────────────────────────────────────────────────────

const AnomalyBanner: React.FC<{ anomalies: AnomalyRow[] }> = ({ anomalies }) => {
  const [expanded, setExpanded] = useState(false);
  const count = anomalies.length;
  if (count === 0) return null;

  const worstCpl = anomalies.reduce(
    (worst, a) => (a.cpl_delta_pct > worst ? a.cpl_delta_pct : worst),
    0,
  );
  const isCritical = worstCpl > 50;

  return (
    <div className={`mx-4 md:mx-6 my-2 rounded-xl overflow-hidden border ${
      isCritical ? 'border-rose-500/20 bg-rose-500/[0.06]' : 'border-amber-500/20 bg-amber-500/[0.06]'
    }`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <AlertTriangle size={13} className={isCritical ? 'text-rose-400' : 'text-amber-400'} />
        <span className={`text-[12px] font-semibold ${isCritical ? 'text-rose-300' : 'text-amber-300'}`}>
          {count} {count === 1 ? 'anuncio com anomalia' : 'anuncios com anomalia'}
        </span>
        <ChevronDown
          size={13}
          className={`ml-auto transition-transform text-[var(--text-secondary)] ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-3 pb-3 pt-2 space-y-2">
          {anomalies.map(a => (
            <div key={a.ad_id} className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-secondary)] truncate flex-1 min-w-0">
                {a.ad_name}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.cpl_delta_pct !== 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                    a.cpl_delta_pct > 0 ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}>
                    CPL {a.cpl_delta_pct > 0 ? '+' : ''}{a.cpl_delta_pct.toFixed(0)}%
                  </span>
                )}
                {a.ctr_delta_pct !== 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                    a.ctr_delta_pct < 0 ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}>
                    CTR {a.ctr_delta_pct > 0 ? '+' : ''}{a.ctr_delta_pct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Export helpers ───────────────────────────────────────────────────────────

function buildExportRows(
  leadScoreRows: LeadScoreRow[],
  funnelAds: FunnelAd[],
): Array<{
  ad_name: string;
  campaign_name: string;
  score: number;
  potencial: string;
  leads: number;
  gasto: string;
  cpl: string;
  won_value: string;
  roas: string;
}> {
  const funnelMap = new Map(funnelAds.map(f => [f.ad_id, f]));
  return leadScoreRows.map(row => {
    const funnel = funnelMap.get(row.ad_id);
    const wonValue = funnel?.won_value ?? 0;
    const roas = row.gasto > 0 && wonValue > 0 ? wonValue / row.gasto : 0;
    return {
      ad_name: row.ad_name,
      campaign_name: row.campaign_name,
      score: row.score,
      potencial: row.potencial,
      leads: row.leads,
      gasto: row.gasto.toFixed(2),
      cpl: row.cpl.toFixed(2),
      won_value: wonValue.toFixed(2),
      roas: roas > 0 ? roas.toFixed(2) : '—',
    };
  });
}

function exportCSV(leadScoreRows: LeadScoreRow[], funnelAds: FunnelAd[]): void {
  const rows = buildExportRows(leadScoreRows, funnelAds);
  const headers = ['Anuncio', 'Campanha', 'Score', 'Potencial', 'Leads', 'Gasto (R$)', 'CPL (R$)', 'Receita (R$)', 'ROAS'];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r =>
      [r.ad_name, r.campaign_name, r.score, r.potencial, r.leads, r.gasto, r.cpl, r.won_value, r.roas]
        .map(escape)
        .join(','),
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `metrics-lab-export-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportPDF(leadScoreRows: LeadScoreRow[], funnelAds: FunnelAd[]): void {
  const rows = buildExportRows(leadScoreRows, funnelAds);
  const date = new Date().toLocaleDateString('pt-BR');

  const potencialBadge = (p: string) => {
    const map: Record<string, string> = {
      alto: '#10b981',
      medio: '#f59e0b',
      baixo: '#f97316',
      desqualificado: '#6b7280',
    };
    return `<span style="background:${map[p] ?? '#6b7280'}22;color:${map[p] ?? '#6b7280'};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${p}</span>`;
  };

  const tableRows = rows
    .map(
      (r, i) => `
      <tr style="background:${i % 2 === 0 ? '#0d0f14' : '#111318'}">
        <td style="padding:8px 12px;color:#e2e8f0;font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.ad_name}</td>
        <td style="padding:8px 12px;color:#94a3b8;font-size:11px;">${r.campaign_name}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;color:#a78bfa;">${r.score}</td>
        <td style="padding:8px 12px;text-align:center;">${potencialBadge(r.potencial)}</td>
        <td style="padding:8px 12px;text-align:right;color:#e2e8f0;">${r.leads}</td>
        <td style="padding:8px 12px;text-align:right;color:#e2e8f0;">R$ ${r.gasto}</td>
        <td style="padding:8px 12px;text-align:right;color:#e2e8f0;">R$ ${r.cpl}</td>
        <td style="padding:8px 12px;text-align:right;color:#34d399;">R$ ${r.won_value}</td>
        <td style="padding:8px 12px;text-align:right;color:#60a5fa;">${r.roas}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Metrics Lab Export — ${date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #080a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e2e8f0; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; color: #a78bfa; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #1a1d24; }
    th { padding: 10px 12px; text-align: left; color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1e2330; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    tr { border-bottom: 1px solid #1a1d24; }
    @media print {
      body { background: #fff; color: #1e293b; padding: 16px; }
      table { font-size: 10px; }
    }
  </style>
</head>
<body>
  <h1>Metrics Lab</h1>
  <p class="meta">Ranking de Anuncios — Exportado em ${date} (${rows.length} anuncios)</p>
  <table>
    <thead>
      <tr>
        <th>Anuncio</th>
        <th>Campanha</th>
        <th class="center">Score</th>
        <th class="center">Potencial</th>
        <th class="right">Leads</th>
        <th class="right">Gasto</th>
        <th class="right">CPL</th>
        <th class="right">Receita</th>
        <th class="right">ROAS</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MetricsLab: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const {
    leadScoreRows,
    criativosARC,
    funnelAds,
    heatmapData,
    loading,
    error,
    accounts,
    unattributedCount,
    periodDeltas,
    conversionTimeMap,
    anomalies,
  } = useMetricsLab(selectedAccount, dateRange);

  // Auto-select first ad when data loads
  useEffect(() => {
    if (leadScoreRows.length > 0 && !selectedAdId) {
      setSelectedAdId(leadScoreRows[0].ad_id);
    }
  }, [leadScoreRows, selectedAdId]);

  // Reset selection when account changes
  useEffect(() => {
    setSelectedAdId('');
  }, [selectedAccount]);

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportOpen]);

  // Find selected data
  const selectedScore = useMemo(
    () => leadScoreRows.find(r => r.ad_id === selectedAdId) ?? null,
    [leadScoreRows, selectedAdId],
  );

  const selectedFunnel = useMemo(
    () => funnelAds.find(f => f.ad_id === selectedAdId) ?? null,
    [funnelAds, selectedAdId],
  );

  const selectedARC = useMemo(() => {
    const arc = criativosARC.find(c => c.ad_id === selectedAdId);
    return arc ? { hook_rate: arc.hook_rate, hold_rate: arc.hold_rate, body_rate: arc.body_rate } : null;
  }, [criativosARC, selectedAdId]);

  const selectedConversionTime = useMemo(
    () => (conversionTimeMap && selectedAdId ? conversionTimeMap.get(selectedAdId) ?? null : null),
    [conversionTimeMap, selectedAdId],
  );

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-lg">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)]">Metrics Lab</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-[var(--text-secondary)]">Ranking de anuncios + funil completo</p>
                  {unattributedCount > 0 && (
                    <span className="text-[11px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
                      {unattributedCount.toLocaleString('pt-BR')} leads sem UTM
                    </span>
                  )}
                </div>
                {periodDeltas && !loading && (
                  <div className="mt-1">
                    <PeriodDeltasRow deltas={periodDeltas} />
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {accounts.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedAccount ?? ''}
                    onChange={(e) => setSelectedAccount(e.target.value || null)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl bg-white/[0.05] text-[var(--text-primary)] border-0 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
                  >
                    <option value="">Todas as contas</option>
                    {accounts.map((acc) => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                  />
                </div>
              )}

              {/* Export button */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setExportOpen(prev => !prev)}
                  disabled={loading || leadScoreRows.length === 0}
                  className="flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-3 py-2 text-[12px] text-[var(--text-primary)] transition-colors"
                >
                  <Download size={13} />
                  <span>Export</span>
                  <ChevronDown size={11} className={`text-[var(--text-secondary)] transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
                </button>

                {exportOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#1a1d24] border border-white/[0.08] shadow-xl rounded-xl overflow-hidden min-w-[120px]">
                    <button
                      onClick={() => { exportCSV(leadScoreRows, funnelAds); setExportOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <Download size={12} className="text-emerald-400" />
                      CSV
                    </button>
                    <div className="h-px bg-white/[0.06]" />
                    <button
                      onClick={() => { exportPDF(leadScoreRows, funnelAds); setExportOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <Download size={12} className="text-violet-400" />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Subtle bottom gradient instead of border */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Anomaly banner */}
        {!loading && anomalies.length > 0 && (
          <AnomalyBanner anomalies={anomalies} />
        )}

        {/* Error banner */}
        {error && (
          <div className="mx-4 md:mx-6 my-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-300 text-xs">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>Erro ao carregar dados reais — exibindo dados de exemplo. ({error})</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--text-secondary)] text-sm">
          <Loader2 size={16} className="animate-spin text-violet-400" />
          <span>Carregando dados...</span>
        </div>
      )}

      {/* Two-zone layout */}
      {!loading && (
        <div className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
            {/* Left: Ranking */}
            <div className="lg:col-span-4 xl:col-span-4">
              <AdRankingList
                rows={leadScoreRows}
                selectedAdId={selectedAdId}
                onSelect={setSelectedAdId}
                funnelAds={funnelAds}
              />
            </div>

            {/* Right: Funnel */}
            <div className="lg:col-span-8 xl:col-span-8">
              <FunnelPanel
                scoreRow={selectedScore}
                funnelAd={selectedFunnel}
                arcData={selectedARC}
                heatmapData={heatmapData}
                conversionTime={selectedConversionTime}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsLab;
