import type { AnnualCashFlowRow, Currency } from '../../types';
import { formatCurrency } from '../../calculation-engine';
import { NumInput } from '../NumInput';

export function CashFlowTable({ rows, currency, saldoInicial, onSaldoChange }: {
  rows: AnnualCashFlowRow[];
  currency: Currency;
  saldoInicial: number;
  onSaldoChange: (v: number) => void;
}) {
  const fmt = (v: number) => formatCurrency(v, currency);
  const firstPositiveMonth = rows.findIndex(r => r.fluxoAcumulado > 0 && rows[0]?.fluxoAcumulado <= 0);

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Fluxo de Caixa</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Saldo Inicial:</span>
          <NumInput
            value={saldoInicial}
            onChange={onSaldoChange}
            prefix={currency === 'BRL' ? 'R$' : '$'}
            min={0}
            className="w-28 bg-bg-primary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 pl-8"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs">Mes</th>
              <th className="text-right px-3 py-3 text-text-muted font-medium text-xs">Entradas</th>
              <th className="text-right px-3 py-3 text-text-muted font-medium text-xs">Saidas</th>
              <th className="text-right px-3 py-3 text-text-muted font-medium text-xs">Resultado</th>
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isHighlight = i === firstPositiveMonth;
              return (
                <tr
                  key={r.month}
                  className={`border-b border-border-default/50 ${isHighlight ? 'bg-green-500/5' : ''}`}
                >
                  <td className="px-4 py-2.5 font-medium text-text-primary text-xs">{r.label}</td>
                  <td className="text-right px-3 py-2.5 text-green-400 text-xs">{fmt(r.totalEntradas)}</td>
                  <td className="text-right px-3 py-2.5 text-red-400 text-xs">{fmt(r.totalSaidas)}</td>
                  <td className={`text-right px-3 py-2.5 font-semibold text-xs ${r.resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.resultado >= 0 ? '+' : ''}{fmt(r.resultado)}
                  </td>
                  <td className={`text-right px-4 py-2.5 font-bold text-xs ${r.fluxoAcumulado >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {fmt(r.fluxoAcumulado)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td className="px-4 py-3 font-bold text-text-primary text-xs">TOTAL</td>
              <td className="text-right px-3 py-3 text-green-400 font-bold text-xs">
                {fmt(rows.reduce((s, r) => s + r.totalEntradas, 0))}
              </td>
              <td className="text-right px-3 py-3 text-red-400 font-bold text-xs">
                {fmt(rows.reduce((s, r) => s + r.totalSaidas, 0))}
              </td>
              <td className="text-right px-3 py-3 font-bold text-xs text-text-primary">
                {fmt(rows.reduce((s, r) => s + r.resultado, 0))}
              </td>
              <td className="text-right px-4 py-3 font-bold text-xs text-blue-400">
                {rows.length > 0 ? fmt(rows[rows.length - 1].fluxoAcumulado) : fmt(saldoInicial)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
