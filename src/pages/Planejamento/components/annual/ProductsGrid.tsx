import React from 'react';
import type { AnnualProductRow, Currency } from '../../types';
import { formatCurrency } from '../../calculation-engine';
import { recalcProductRow } from '../../annual-calculation-engine';
import { NumInput } from '../NumInput';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function ProductsGrid({ rows, onChange, currency }: {
  rows: AnnualProductRow[];
  onChange: (rows: AnnualProductRow[]) => void;
  currency: Currency;
}) {
  const fmt = (v: number) => formatCurrency(v, currency);

  const updateRow = (idx: number, updates: Partial<AnnualProductRow>) => {
    const row = { ...rows[idx], ...updates };
    const next = [...rows];
    next[idx] = recalcProductRow(row);
    onChange(next);
  };

  const handleQtdChange = (productIdx: number, month: number, qtd: number) => {
    const row = rows[productIdx];
    const updatedMonthly = {
      ...row.monthly,
      [month]: { ...row.monthly[month], qtd },
    };
    updateRow(productIdx, { monthly: updatedMonthly });
  };

  const handleDiscountChange = (productIdx: number, pct: number) => {
    updateRow(productIdx, { maxDiscountPct: pct });
  };

  // Totais por mes
  const monthTotals: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    monthTotals[m] = rows.reduce((s, r) => s + (r.monthly[m]?.vendasBrl ?? 0), 0);
  }
  const grandTotal = rows.reduce((s, r) => s + r.totalAnual, 0);

  if (rows.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border-default p-8 text-center">
        <p className="text-sm text-text-muted">
          Nenhum produto cadastrado. Adicione produtos no wizard mensal primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Produtos &times; 12 Meses</h3>
        <p className="text-[10px] text-text-muted mt-0.5">Edite a quantidade de vendas por mes. Receita calcula automaticamente.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs sticky left-0 bg-bg-secondary z-10 min-w-[160px]">
                Produto
              </th>
              <th className="text-right px-2 py-3 text-text-muted font-medium text-xs min-w-[80px]">
                Preco
              </th>
              {MONTHS.map(m => (
                <th key={m} className="text-center px-1 py-3 text-text-muted font-medium text-xs min-w-[64px]">
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs min-w-[72px]">
                QTD
              </th>
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs min-w-[100px]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <React.Fragment key={row.productId}>
                {/* Linha QTD editavel */}
                <tr className="border-b border-border-default/30">
                  <td className="px-4 py-2 font-medium text-text-primary text-xs sticky left-0 bg-bg-secondary z-10" rowSpan={3}>
                    <div>{row.productName}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-text-muted">Desc:</span>
                      <NumInput
                        value={row.maxDiscountPct}
                        onChange={v => handleDiscountChange(idx, v)}
                        min={0}
                        max={100}
                        className="w-12 bg-bg-primary border border-border-default rounded px-1 py-0.5 text-[10px] text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-text-muted">%</span>
                    </div>
                  </td>
                  <td className="text-right px-2 py-2 text-text-secondary text-xs" rowSpan={1}>
                    {fmt(row.ticket)}
                  </td>
                  {MONTHS.map((_, mi) => {
                    const m = mi + 1;
                    return (
                      <td key={m} className="text-center px-1 py-1.5">
                        <NumInput
                          value={row.monthly[m]?.qtd ?? 0}
                          onChange={v => handleQtdChange(idx, m, v)}
                          min={0}
                          className="w-14 bg-bg-primary border border-border-default rounded px-1 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    );
                  })}
                  <td className="text-right px-4 py-2 font-bold text-blue-400 text-xs">
                    {row.totalQtd}
                  </td>
                  <td className="text-right px-4 py-2 font-bold text-blue-400 text-xs" rowSpan={3}>
                    {fmt(row.totalAnual)}
                  </td>
                </tr>
                {/* Linha Desconto Max R$ readonly */}
                {row.maxDiscountPct > 0 && (
                  <tr className="border-b border-border-default/20">
                    <td className="text-right px-2 py-1 text-[10px] text-yellow-400/70">
                      -{row.maxDiscountPct}%
                    </td>
                    {MONTHS.map((_, mi) => {
                      const m = mi + 1;
                      const desc = row.monthly[m]?.descontoBrl ?? 0;
                      return (
                        <td key={m} className="text-center px-1 py-0.5 text-[10px] text-yellow-400/70">
                          {desc > 0 ? `-${fmt(desc)}` : '-'}
                        </td>
                      );
                    })}
                    <td className="text-right px-4 py-0.5 text-[10px] text-yellow-400/70">
                      {row.totalDesconto > 0 ? `-${fmt(row.totalDesconto)}` : ''}
                    </td>
                  </tr>
                )}
                {/* Linha vendas R$ readonly */}
                <tr className="border-b border-border-default/50">
                  <td className="text-right px-2 py-1 text-[10px] text-text-muted">
                    Vendas
                  </td>
                  {MONTHS.map((_, mi) => {
                    const m = mi + 1;
                    const val = row.monthly[m]?.vendasBrl ?? 0;
                    return (
                      <td key={m} className="text-center px-1 py-1 text-[10px] text-text-muted">
                        {val > 0 ? fmt(val) : '-'}
                      </td>
                    );
                  })}
                  <td className="text-right px-4 py-1 text-[10px] text-text-muted">
                    {/* empty — totalAnual rowspan */}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-default">
              <td className="px-4 py-3 font-bold text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                TOTAL MES
              </td>
              <td className="px-2 py-3"></td>
              {MONTHS.map((_, mi) => {
                const m = mi + 1;
                return (
                  <td key={m} className="text-center px-1 py-3 text-green-400 font-semibold text-xs">
                    {monthTotals[m] > 0 ? fmt(monthTotals[m]) : '-'}
                  </td>
                );
              })}
              <td className="text-right px-4 py-3 font-bold text-text-primary text-xs">
                {rows.reduce((s, r) => s + r.totalQtd, 0)}
              </td>
              <td className="text-right px-4 py-3 font-bold text-green-400 text-xs">
                {fmt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
