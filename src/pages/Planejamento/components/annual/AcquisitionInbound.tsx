import type { InboundConfig, InboundFunnelRow, InboundSummary, Currency } from '../../types';
import { formatCurrency } from '../../calculation-engine';
import { NumInput } from '../NumInput';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function AcquisitionInbound({ config, onChange, funnelRows, summary, currency }: {
  config: InboundConfig;
  onChange: (config: InboundConfig) => void;
  funnelRows: InboundFunnelRow[];
  summary: InboundSummary;
  currency: Currency;
}) {
  const fmt = (v: number) => formatCurrency(v, currency);
  const prefix = currency === 'BRL' ? 'R$' : '$';

  const update = (key: keyof InboundConfig, val: number) => {
    onChange({ ...config, [key]: val });
  };

  const inputCls = "w-20 bg-bg-primary border border-border-default rounded px-2 py-1.5 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Projecao Inbound — Taxas de Conversao</h3>
        <p className="text-[10px] text-text-muted mt-0.5">
          Vendas inbound = meta total - outbound. O funil calcula quanto trafego voce precisa.
        </p>
      </div>

      {/* Taxas de conversao */}
      <div className="px-6 py-4 border-b border-border-default">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-primary rounded-lg border border-border-default p-3">
            <div className="text-[10px] text-text-muted mb-2">Proposta → Venda</div>
            <div className="flex items-center gap-1">
              <NumInput value={config.taxaPropostaVenda} onChange={v => update('taxaPropostaVenda', v)} min={0} max={100} className={inputCls} />
              <span className="text-xs text-text-muted">%</span>
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg border border-border-default p-3">
            <div className="text-[10px] text-text-muted mb-2">Cadastro → Proposta</div>
            <div className="flex items-center gap-1">
              <NumInput value={config.taxaCadastroProposta} onChange={v => update('taxaCadastroProposta', v)} min={0} max={100} className={inputCls} />
              <span className="text-xs text-text-muted">%</span>
            </div>
          </div>
          <div className="bg-bg-primary rounded-lg border border-border-default p-3">
            <div className="text-[10px] text-text-muted mb-2">Trafego → Cadastro</div>
            <div className="flex items-center gap-1">
              <NumInput value={config.taxaTrafegoCadastro} onChange={v => update('taxaTrafegoCadastro', v)} min={0} max={100} className={inputCls} />
              <span className="text-xs text-text-muted">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Funil calculado */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-text-muted font-medium text-xs sticky left-0 bg-bg-secondary z-10 min-w-[180px]">
                Etapa
              </th>
              {MONTHS.map(m => (
                <th key={m} className="text-center px-1 py-3 text-text-muted font-medium text-xs min-w-[64px]">
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-text-muted font-medium text-xs min-w-[80px]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Necessidade de trafego', key: 'necessidadeTrafego' as const, color: 'text-amber-400' },
              { label: 'Cadastros', key: 'cadastros' as const, color: 'text-text-secondary' },
              { label: 'Propostas', key: 'propostas' as const, color: 'text-text-secondary' },
              { label: 'Vendas (inbound)', key: 'vendasInbound' as const, color: 'text-green-400' },
            ].map(({ label, key, color }) => {
              const total = funnelRows.reduce((s, r) => s + r[key], 0);
              return (
                <tr key={key} className="border-b border-border-default/50">
                  <td className="px-4 py-2.5 font-medium text-text-primary text-xs sticky left-0 bg-bg-secondary z-10">
                    {label}
                  </td>
                  {funnelRows.map(r => (
                    <td key={r.month} className={`text-center px-1 py-2.5 text-xs ${color}`}>
                      {r[key] > 0 ? r[key].toLocaleString('pt-BR') : '-'}
                    </td>
                  ))}
                  <td className={`text-right px-4 py-2.5 font-bold text-xs ${color}`}>
                    {total > 0 ? total.toLocaleString('pt-BR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Metricas de midia */}
      <div className="px-6 py-4 border-t border-border-default">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-text-muted mb-1">CPC medio</div>
            <div className="flex items-center gap-1">
              <NumInput
                value={config.cpcMedio}
                onChange={v => update('cpcMedio', v)}
                prefix={prefix}
                min={0}
                step={0.01}
                className="w-24 bg-bg-primary border border-border-default rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 pl-7"
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-1">% organico garantido</div>
            <div className="flex items-center gap-1">
              <NumInput
                value={config.pctOrganicoGarantido}
                onChange={v => update('pctOrganicoGarantido', v)}
                min={0}
                max={100}
                className={inputCls}
              />
              <span className="text-xs text-text-muted">%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-1">Investimento em midia</div>
            <div className="text-sm font-bold text-amber-400">{fmt(summary.investimentoMidia)}</div>
            <div className="text-[10px] text-text-muted">{summary.pctDoFaturamento.toFixed(2)}% do faturamento</div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted mb-1">Media mensal</div>
            <div className="text-sm font-bold text-text-primary">{fmt(summary.mediaMensal)}</div>
            <div className="text-[10px] text-text-muted">{summary.trafegoTotal.toLocaleString('pt-BR')} visitas/ano</div>
          </div>
        </div>
      </div>
    </div>
  );
}
