import React, { useState, useCallback, useMemo } from 'react';
import type { HeatmapRow } from '../../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
// day_of_week: 0=domingo, 6=sabado — reorder to Mon-Sun display
// Display row index 0 = Seg (dow=1), ..., row 5 = Sab (dow=6), row 6 = Dom (dow=0)
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const LABEL_HOURS = new Set([0, 6, 12, 18, 23]);

export type HeatmapMetric = 'leads' | 'agendamentos' | 'conversao';

interface HeatmapChartProps {
  data: HeatmapRow[];
  metric: HeatmapMetric;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  x: number;
  y: number;
  row: HeatmapRow;
}

const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
  const { x, y, row } = data;
  const dayName = DAYS[DOW_ORDER.indexOf(row.day_of_week)];
  const hour = `${String(row.hour_of_day).padStart(2, '0')}h`;

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div
        style={{
          background: '#1a1d24',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: 140,
        }}
      >
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>
          {dayName} &middot; {hour}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TooltipRow label="Leads" value={row.total_leads} color="#818cf8" />
          <TooltipRow label="Agendou" value={row.leads_agendou} color="#fbbf24" />
          <TooltipRow
            label="Conversao"
            value={row.conversion_rate}
            color="#34d399"
            suffix="%"
            decimals={1}
          />
        </div>
      </div>
    </div>
  );
};

const TooltipRow: React.FC<{
  label: string;
  value: number;
  color: string;
  suffix?: string;
  decimals?: number;
}> = ({ label, value, color, suffix = '', decimals = 0 }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 700, color, tabularNums: true } as React.CSSProperties}>
      {(value ?? 0).toFixed(decimals)}{suffix}
    </span>
  </div>
);

// ─── Cell intensity calculation ───────────────────────────────────────────────

function getIntensity(value: number, max: number): number {
  if (max === 0 || value === 0) return 0;
  // Square root scale: compresses high values, surfaces subtle differences
  return Math.sqrt(value / max);
}

// Violet-500 RGB: 139, 92, 246
function cellColor(intensity: number): string {
  if (intensity === 0) return 'rgba(139, 92, 246, 0)';
  // 0.0-0.15: faint ghost
  // 0.15-0.5: violet/20 to violet/60
  // 0.5-1.0: violet/60 to violet full
  const alpha = intensity < 0.15
    ? intensity * 0.8
    : intensity < 0.5
    ? 0.12 + (intensity - 0.15) * 1.4
    : 0.61 + (intensity - 0.5) * 0.78;
  return `rgba(139, 92, 246, ${Math.min(alpha, 1).toFixed(3)})`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, metric }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Build lookup map: key = `${dow}-${hour}` — memoized on data change only
  const lookup = useMemo(() => {
    const map = new Map<string, HeatmapRow>();
    for (const row of data) {
      map.set(`${row.day_of_week}-${row.hour_of_day}`, row);
    }
    return map;
  }, [data]);

  const getMetricValue = useCallback((row: HeatmapRow): number => {
    if (metric === 'leads') return row.total_leads;
    if (metric === 'agendamentos') return row.leads_agendou;
    return row.conversion_rate;
  }, [metric]);

  // Compute max value for the selected metric — memoized on data + metric
  const maxValue = useMemo(() => data.reduce((acc, row) => {
    return Math.max(acc, getMetricValue(row));
  }, 0), [data, getMetricValue]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, row: HeatmapRow) => {
      setTooltip({ x: e.clientX, y: e.clientY, row });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const CELL_SIZE = 20;
  const GAP = 2;

  return (
    <div className="relative">
      {/* Hour labels row */}
      <div className="flex" style={{ marginLeft: 36, marginBottom: 4 }}>
        {HOURS.map(h => (
          <div
            key={h}
            style={{ width: CELL_SIZE, marginRight: GAP, flexShrink: 0 }}
            className="text-center"
          >
            {LABEL_HOURS.has(h) ? (
              <span style={{ fontSize: 9, color: 'var(--text-secondary, #6b7280)' }}>
                {h}h
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {DOW_ORDER.map((dow, rowIndex) => (
        <div key={dow} className="flex items-center" style={{ marginBottom: GAP }}>
          {/* Day label */}
          <div
            style={{
              width: 30,
              flexShrink: 0,
              fontSize: 10,
              color: 'var(--text-secondary, #6b7280)',
              textAlign: 'right',
              paddingRight: 6,
              lineHeight: `${CELL_SIZE}px`,
            }}
          >
            {DAYS[rowIndex]}
          </div>

          {/* Cells */}
          {HOURS.map(hour => {
            const row = lookup.get(`${dow}-${hour}`);
            const value = row ? getMetricValue(row) : 0;
            const intensity = getIntensity(value, maxValue);
            const bg = cellColor(intensity);

            return (
              <div
                key={hour}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  marginRight: GAP,
                  borderRadius: 3,
                  backgroundColor: intensity === 0 ? 'rgba(255,255,255,0.03)' : bg,
                  flexShrink: 0,
                  cursor: row ? 'default' : 'default',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={row ? (e) => handleMouseEnter(e, row) : undefined}
                onMouseMove={row ? handleMouseMove : undefined}
                onMouseLeave={row ? handleMouseLeave : undefined}
              />
            );
          })}
        </div>
      ))}

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-3" style={{ marginLeft: 36 }}>
        <span style={{ fontSize: 9, color: 'var(--text-secondary, #6b7280)' }}>Baixo</span>
        <div
          style={{
            width: 80,
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(to right, rgba(139,92,246,0.05), rgba(139,92,246,0.3), rgba(139,92,246,1))',
          }}
        />
        <span style={{ fontSize: 9, color: 'var(--text-secondary, #6b7280)' }}>Alto</span>
      </div>

      {/* Tooltip */}
      {tooltip && <Tooltip data={tooltip} />}
    </div>
  );
};
