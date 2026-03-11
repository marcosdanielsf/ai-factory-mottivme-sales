import type { OutboundChannel } from '../../types';
import { NumInput } from '../NumInput';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AcquisitionOutbound({ channels, onChange }: {
  channels: OutboundChannel[];
  onChange: (channels: OutboundChannel[]) => void;
}) {
  const handleChange = (idx: number, month: number, val: number) => {
    const ch = channels[idx];
    const monthly = { ...ch.monthly, [month]: val };
    let totalAnual = 0;
    for (let m = 1; m <= 12; m++) totalAnual += monthly[m] ?? 0;
    const next = [...channels];
    next[idx] = { ...ch, monthly, totalAnual };
    onChange(next);
  };

  // Totais por mes
  const monthTotals: Record<number, number> = {};
  for (let m = 1; m <= 12; m++) {
    monthTotals[m] = channels.reduce((s, ch) => s + (ch.monthly[m] ?? 0), 0);
  }
  const grandTotal = channels.reduce((s, ch) => s + ch.totalAnual, 0);

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Projecao de Aquisicao — Outbound</h3>
        <p className="text-[10px] text-text-muted mt-0.5">Quantidade de vendas esperadas por canal outbound por mes.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs sticky left-0 bg-bg-secondary z-10 min-w-[180px]">
                Canal
              </th>
              {MONTHS.map(m => (
                <th key={m} className="text-center px-1 py-3 text-text-muted font-medium text-xs min-w-[64px]">
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs min-w-[72px]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, idx) => (
              <tr key={ch.id} className="border-b border-border-default/50">
                <td className="px-4 py-2 font-medium text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                  {ch.name}
                </td>
                {MONTHS.map((_, mi) => {
                  const m = mi + 1;
                  return (
                    <td key={m} className="text-center px-1 py-1.5">
                      <NumInput
                        value={ch.monthly[m] ?? 0}
                        onChange={v => handleChange(idx, m, v)}
                        min={0}
                        className="w-14 bg-bg-primary border border-border-default rounded px-1 py-1 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  );
                })}
                <td className="text-right px-4 py-2 font-bold text-blue-400 text-xs">
                  {ch.totalAnual}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td className="px-4 py-3 font-bold text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                Total Outbound
              </td>
              {MONTHS.map((_, mi) => {
                const m = mi + 1;
                return (
                  <td key={m} className="text-center px-1 py-3 text-blue-400 font-semibold text-xs">
                    {monthTotals[m] || '-'}
                  </td>
                );
              })}
              <td className="text-right px-4 py-3 font-bold text-blue-400 text-xs">
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
