import type { SubFunnel } from '../types';
import { calcOverallRate } from '../calculation-engine';
import { NumInput, FieldHelp } from './NumInput';

type RateField = 'qualificationRate' | 'schedulingRate' | 'attendanceRate' | 'conversionRate';

export function SalesStep({ subFunnels, onChange }: {
  subFunnels: SubFunnel[];
  onChange: (sf: SubFunnel[]) => void;
}) {
  const updateRate = (id: string, field: RateField, value: number) => {
    onChange(subFunnels.map(sf =>
      sf.id === id ? { ...sf, [field]: Math.min(100, Math.max(0, value)) } : sf
    ));
  };

  const rateFields: { field: RateField; label: string; shortLabel: string; help: string }[] = [
    { field: 'qualificationRate', label: 'Qualificacao', shortLabel: 'Qualif.', help: 'De cada 100 leads, quantos % respondem e sao qualificados (tem perfil, interesse e poder de compra).' },
    { field: 'schedulingRate', label: 'Agendamento', shortLabel: 'Agend.', help: 'Dos leads qualificados, quantos % aceitam agendar uma reuniao ou call.' },
    { field: 'attendanceRate', label: 'Comparecimento', shortLabel: 'Comp.', help: 'Das calls agendadas, quantas % realmente acontecem (o lead aparece).' },
    { field: 'conversionRate', label: 'Conversao', shortLabel: 'Conv.', help: 'Das calls realizadas, em quantas % o lead fecha a compra.' },
  ];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 3: Funil de Vendas</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Cada sub-funil tem taxas de conversao diferentes. Um lead de Social Selling geralmente converte mais
          que um de trafego pago. Ajuste as taxas baseado na sua experiencia com cada tipo de funil.
        </p>
      </div>

      {/* Conversion rates table */}
      <div className="bg-bg-primary rounded-lg border border-border-default overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left px-3 py-3 text-xs text-text-muted font-medium whitespace-nowrap">Sub-funil</th>
              {rateFields.map(rf => (
                <th key={rf.field} className="text-center px-2 py-3 text-xs text-text-muted font-medium whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    {rf.shortLabel}
                    <FieldHelp text={rf.help} />
                  </div>
                </th>
              ))}
              <th className="text-center px-2 py-3 text-xs text-text-muted font-medium whitespace-nowrap">
                <div className="flex items-center justify-center">
                  Geral
                  <FieldHelp text="Taxa de conversao geral do funil: de lead ate venda. Calculada automaticamente multiplicando todas as etapas." />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {subFunnels.map((sf, i) => {
              const overallRate = calcOverallRate(sf.qualificationRate, sf.schedulingRate, sf.attendanceRate, sf.conversionRate);
              return (
                <tr key={sf.id} className={i < subFunnels.length - 1 ? 'border-b border-border-default' : ''}>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-medium text-text-primary whitespace-nowrap">{sf.name}</span>
                  </td>
                  {rateFields.map(rf => (
                    <td key={rf.field} className="text-center px-2 py-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <NumInput
                          value={sf[rf.field]}
                          onChange={v => updateRate(sf.id, rf.field, v)}
                          min={0} max={100}
                          className="w-14 text-center text-sm bg-bg-secondary border border-border-default rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-text-muted">%</span>
                      </div>
                    </td>
                  ))}
                  <td className="text-center px-2 py-2.5">
                    <span className={`text-sm font-bold ${overallRate >= 3 ? 'text-green-400' : overallRate >= 1 ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {overallRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overall funnel summary */}
      <div className="bg-bg-primary rounded-lg border border-border-default p-4">
        <h5 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Resumo: conversao geral por sub-funil</h5>
        <div className="grid grid-cols-3 gap-3">
          {subFunnels.map(sf => {
            const overallRate = calcOverallRate(sf.qualificationRate, sf.schedulingRate, sf.attendanceRate, sf.conversionRate);
            return (
              <div key={sf.id} className="text-center">
                <span className="text-[10px] text-text-muted">{sf.name}</span>
                <div className={`text-lg font-bold mt-0.5 ${overallRate >= 3 ? 'text-green-400' : overallRate >= 1 ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {overallRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-text-muted">lead → venda</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
