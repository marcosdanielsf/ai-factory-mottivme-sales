import type { AnnualCostRow, Currency } from '../../types';
import { formatCurrency } from '../../calculation-engine';
import { NumInput } from '../NumInput';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function CostsGrid({ rows, onChange, currency }: {
  rows: AnnualCostRow[];
  onChange: (rows: AnnualCostRow[]) => void;
  currency: Currency;
}) {
  const fmt = (v: number) => formatCurrency(v, currency);
  const prefix = currency === 'BRL' ? 'R$' : '$';

  const updateRow = (idx: number, updated: AnnualCostRow) => {
    const next = [...rows];
    // Recalculate total
    let total = 0;
    for (let m = 1; m <= 12; m++) total += updated.monthly[m] ?? 0;
    next[idx] = { ...updated, totalAnual: total };
    onChange(next);
  };

  const toggleMode = (idx: number) => {
    const row = rows[idx];
    if (row.fixedMonthly !== null) {
      // Switch to manual
      updateRow(idx, { ...row, fixedMonthly: null });
    } else {
      // Switch to fixed — use average of current values
      const avg = row.totalAnual > 0 ? Math.round(row.totalAnual / 12) : 0;
      const monthly: Record<number, number> = {};
      for (let m = 1; m <= 12; m++) monthly[m] = avg;
      updateRow(idx, { ...row, fixedMonthly: avg, monthly });
    }
  };

  const handleFixedChange = (idx: number, val: number) => {
    const row = rows[idx];
    const monthly: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = val;
    updateRow(idx, { ...row, fixedMonthly: val, monthly });
  };

  const handleMonthChange = (idx: number, month: number, val: number) => {
    const row = rows[idx];
    const monthly = { ...row.monthly, [month]: val };
    updateRow(idx, { ...row, monthly });
  };

  const grandTotal = rows.reduce((s, r) => s + r.totalAnual, 0);

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Custos Operacionais</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs sticky left-0 bg-bg-secondary z-10 min-w-[180px]">
                Categoria
              </th>
              <th className="text-center px-2 py-3 text-text-muted font-medium text-xs w-20">Modo</th>
              {MONTHS.map(m => (
                <th key={m} className="text-center px-1 py-3 text-text-muted font-medium text-xs min-w-[72px]">
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs min-w-[100px]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border-default/50">
                <td className="px-4 py-2 font-medium text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                  {row.label}
                </td>
                <td className="text-center px-2 py-2">
                  <button
                    onClick={() => toggleMode(idx)}
                    className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                      row.fixedMonthly !== null
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-bg-hover text-text-muted border border-border-default'
                    }`}
                  >
                    {row.fixedMonthly !== null ? 'Fixo' : 'Manual'}
                  </button>
                </td>
                {MONTHS.map((_, mi) => {
                  const m = mi + 1;
                  if (row.fixedMonthly !== null) {
                    // Fixed mode: show single input on first month, readonly on rest
                    if (mi === 0) {
                      return (
                        <td key={m} colSpan={12} className="text-center px-1 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <NumInput
                              value={row.fixedMonthly}
                              onChange={v => handleFixedChange(idx, v)}
                              prefix={prefix}
                              min={0}
                              className="w-24 bg-bg-primary border border-border-default rounded px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500 pl-7"
                            />
                            <span className="text-[10px] text-text-muted">/mes</span>
                          </div>
                        </td>
                      );
                    }
                    return null; // colSpan handled above
                  }
                  return (
                    <td key={m} className="text-center px-1 py-2">
                      <NumInput
                        value={row.monthly[m] ?? 0}
                        onChange={v => handleMonthChange(idx, m, v)}
                        min={0}
                        className="w-16 bg-bg-primary border border-border-default rounded px-1 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  );
                })}
                <td className="text-right px-4 py-2 font-bold text-text-primary text-xs">
                  {fmt(row.totalAnual)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td colSpan={2} className="px-4 py-3 font-bold text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                TOTAL CUSTOS
              </td>
              {MONTHS.map((_, mi) => {
                const m = mi + 1;
                const monthTotal = rows.reduce((s, r) => s + (r.monthly[m] ?? 0), 0);
                return (
                  <td key={m} className="text-center px-1 py-3 text-text-muted font-semibold text-xs">
                    {fmt(monthTotal)}
                  </td>
                );
              })}
              <td className="text-right px-4 py-3 font-bold text-red-400 text-xs">
                {fmt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
