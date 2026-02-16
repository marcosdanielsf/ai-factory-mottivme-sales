import type { PlanningState, OriginRates } from '../types';
import { NumInput, FieldHelp } from './NumInput';

export function SalesStep({ sales, onChange }: {
  sales: PlanningState['sales'];
  onChange: (s: PlanningState['sales']) => void;
}) {
  const updateOrigin = (key: 'socialSelling' | 'trafego' | 'organico', field: keyof OriginRates, value: number) => {
    onChange({
      ...sales,
      origins: {
        ...sales.origins,
        [key]: { ...sales.origins[key], [field]: Math.min(100, Math.max(0, value)) },
      },
    });
  };

  const channels = [
    { key: 'socialSelling' as const, label: 'Social Selling', color: 'blue' },
    { key: 'trafego' as const, label: 'Trafego Pago', color: 'amber' },
    { key: 'organico' as const, label: 'Organico', color: 'emerald' },
  ];

  const rateFields: { field: keyof OriginRates; label: string; desc: string; help: string }[] = [
    { field: 'qualificationRate', label: 'Qualificacao', desc: 'Lead → MQL', help: 'De cada 100 leads, quantos % respondem e sao qualificados (tem perfil, interesse e poder de compra).' },
    { field: 'schedulingRate', label: 'Agendamento', desc: 'MQL → Call agendada', help: 'Dos leads qualificados, quantos % aceitam agendar uma reuniao ou call.' },
    { field: 'attendanceRate', label: 'Comparecimento', desc: 'Agendada → Realizada', help: 'Das calls agendadas, quantas % realmente acontecem (o lead aparece).' },
    { field: 'conversionRate', label: 'Conversao', desc: 'Realizada → Venda', help: 'Das calls realizadas, em quantas % o lead fecha a compra.' },
  ];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 3: Funil de Vendas</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Cada canal tem taxas de conversao diferentes. Um lead de Social Selling geralmente converte mais
          que um de trafego pago, porque ja teve relacionamento. Ajuste as taxas baseado na sua experiencia.
        </p>
      </div>

      {/* Conversion rates table */}
      <div className="bg-bg-primary rounded-lg border border-border-default overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-4 py-3 text-xs text-text-muted font-medium">Etapa do funil</th>
              {channels.map(ch => (
                <th key={ch.key} className={`text-center px-3 py-3 text-xs text-${ch.color}-400 font-medium`}>
                  {ch.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rateFields.map((rf, i) => (
              <tr key={rf.field} className={i < rateFields.length - 1 ? 'border-b border-border-default' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center text-xs font-medium text-text-primary">
                    {rf.label}
                    <FieldHelp text={rf.help} />
                  </div>
                  <div className="text-[10px] text-text-muted">{rf.desc}</div>
                </td>
                {channels.map(ch => (
                  <td key={ch.key} className="text-center px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <NumInput
                        value={sales.origins[ch.key][rf.field]}
                        onChange={v => updateOrigin(ch.key, rf.field, v)}
                        min={0} max={100}
                        className={`w-16 text-center text-sm bg-bg-secondary border border-${ch.color}-500/30 rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-${ch.color}-500`}
                      />
                      <span className="text-[10px] text-text-muted">%</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Capacity */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Capacidade do Time</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-primary rounded-lg border border-border-default p-4">
            <label className="flex items-center text-xs text-text-muted mb-1">
              MQLs por SDR/mes
              <FieldHelp text="Quantos leads qualificados 1 SDR (pre-vendedor) consegue atender por mes. Padrao: 150 contatos/mes." />
            </label>
            <NumInput
              value={sales.mqlsPerSdr}
              onChange={v => onChange({ ...sales, mqlsPerSdr: Math.round(v) })}
              min={1}
              className="w-full text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="bg-bg-primary rounded-lg border border-border-default p-4">
            <label className="flex items-center text-xs text-text-muted mb-1">
              Calls por Closer/mes
              <FieldHelp text="Quantas calls de venda 1 Closer (vendedor) consegue fazer por mes. Padrao: 60 calls/mes (3/dia)." />
            </label>
            <NumInput
              value={sales.callsPerCloser}
              onChange={v => onChange({ ...sales, callsPerCloser: Math.round(v) })}
              min={1}
              className="w-full text-sm bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Conversion funnel overview per channel */}
      <div className="bg-bg-primary rounded-lg border border-border-default p-4">
        <h5 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Conversao geral do funil (lead ate venda)</h5>
        <div className="grid grid-cols-3 gap-3">
          {channels.map(ch => {
            const o = sales.origins[ch.key];
            const overallRate = (o.qualificationRate / 100) * (o.schedulingRate / 100) * (o.attendanceRate / 100) * (o.conversionRate / 100) * 100;
            return (
              <div key={ch.key} className="text-center">
                <span className={`text-xs text-${ch.color}-400 font-medium`}>{ch.label}</span>
                <div className={`text-lg font-bold text-${ch.color}-400 mt-1`}>{overallRate.toFixed(1)}%</div>
                <div className="text-[10px] text-text-muted">lead → venda</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
