import { Plus, Edit3, Trash2 } from 'lucide-react';
import type { PlanningState, Currency, SubFunnel } from '../types';
import { formatCurrency, calcSubFunnelLeads } from '../calculation-engine';
import { NumInput, FieldHelp } from './NumInput';

export function MarketingStep({ marketing, currency, onChange }: {
  marketing: PlanningState['marketing'];
  currency: Currency;
  onChange: (m: PlanningState['marketing']) => void;
}) {
  const updateSubFunnel = (id: string, field: keyof SubFunnel, value: number | string) => {
    onChange({
      ...marketing,
      subFunnels: marketing.subFunnels.map(sf =>
        sf.id === id ? { ...sf, [field]: value } : sf
      ),
    });
  };

  const addSubFunnel = () => {
    if (marketing.subFunnels.length >= 12) return;
    onChange({
      ...marketing,
      subFunnels: [...marketing.subFunnels, {
        id: crypto.randomUUID(),
        name: `Funil ${marketing.subFunnels.length + 1}`,
        pctBudget: 0,
        cpl: 10,
        qualificationRate: 40,
        schedulingRate: 35,
        attendanceRate: 65,
        conversionRate: 15,
      }],
    });
  };

  const removeSubFunnel = (id: string) => {
    if (marketing.subFunnels.length <= 1) return;
    onChange({
      ...marketing,
      subFunnels: marketing.subFunnels.filter(sf => sf.id !== id),
    });
  };

  const monthlyBudget = marketing.dailyBudget * 30;
  const subFunnelTotalPct = marketing.subFunnels.reduce((s, sf) => s + sf.pctBudget, 0);

  // Log scale for slider (10-50000 range is too wide for linear)
  const SLIDER_MIN = 10;
  const SLIDER_MAX = 50000;
  const logMin = Math.log(SLIDER_MIN);
  const logMax = Math.log(SLIDER_MAX);
  const valueToSlider = (val: number) => ((Math.log(Math.max(val, SLIDER_MIN)) - logMin) / (logMax - logMin)) * 1000;
  const sliderToValue = (pos: number) => Math.round(Math.exp(logMin + (pos / 1000) * (logMax - logMin)));

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 2: Marketing</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Defina quanto vai investir por dia e como distribuir entre os sub-funis.
          Cada sub-funil tem seu proprio CPL e percentual do budget.
        </p>
      </div>

      {/* Daily Budget */}
      <div className="bg-bg-primary rounded-lg border border-border-default p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center text-xs font-medium text-text-muted">
            Investimento por dia (total)
            <FieldHelp text="Quanto voce investe por dia em todas as acoes de marketing somadas. Inclui ads, ferramentas de prospecao, etc." />
          </label>
          <NumInput
            value={marketing.dailyBudget}
            onChange={v => onChange({ ...marketing, dailyBudget: v })}
            prefix={currency === 'BRL' ? 'R$' : '$'}
            min={0}
            max={50000}
            className="w-28 text-right text-sm font-bold bg-bg-secondary border border-border-default rounded-lg pr-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <input
          type="range"
          value={valueToSlider(marketing.dailyBudget)}
          onChange={e => onChange({ ...marketing, dailyBudget: sliderToValue(parseFloat(e.target.value)) })}
          min={0} max={1000} step={1}
          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-blue-500"
          style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${valueToSlider(marketing.dailyBudget) / 10}%, #1f2937 ${valueToSlider(marketing.dailyBudget) / 10}%, #1f2937 100%)` }}
        />
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>{formatCurrency(10, currency)}/dia</span>
          <span className="text-blue-400 font-semibold">{formatCurrency(monthlyBudget, currency)}/mes</span>
          <span>{formatCurrency(50000, currency)}/dia</span>
        </div>
      </div>

      {/* Sub-funnels */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sub-funis</h4>
          <span className={`text-[10px] font-medium ${subFunnelTotalPct === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
            {subFunnelTotalPct}% alocado {subFunnelTotalPct !== 100 && '(ideal: 100%)'}
          </span>
        </div>

        {marketing.subFunnels.map((sf) => {
          const sfBudget = monthlyBudget * sf.pctBudget / 100;
          const sfLeads = calcSubFunnelLeads(sfBudget, sf.cpl);
          return (
            <div key={sf.id} className="bg-bg-primary rounded-lg border border-border-default p-3">
              <div className="flex items-center gap-2">
                <div className="relative group flex-shrink-0 w-32">
                  <input
                    type="text"
                    value={sf.name}
                    onChange={e => updateSubFunnel(sf.id, 'name', e.target.value)}
                    className="w-full text-xs font-medium bg-transparent text-text-primary border-b border-dashed border-text-muted/30 focus:border-blue-500 focus:outline-none pr-4 py-0.5"
                  />
                  <Edit3 size={8} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40 group-hover:text-blue-400 pointer-events-none" />
                </div>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={sf.pctBudget}
                    onChange={v => updateSubFunnel(sf.id, 'pctBudget', v)}
                    min={0} max={100}
                    className="w-12 text-center text-xs bg-bg-secondary border border-blue-500/20 rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-text-muted">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-muted">CPL</span>
                  <NumInput
                    value={sf.cpl}
                    onChange={v => updateSubFunnel(sf.id, 'cpl', v)}
                    min={0.1} max={500}
                    prefix={currency === 'BRL' ? 'R$' : '$'}
                    className="w-16 text-xs bg-bg-secondary border border-blue-500/20 rounded pr-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap ml-auto">
                  {sfLeads} leads · {formatCurrency(sfBudget, currency)}
                </span>
                {marketing.subFunnels.length > 1 && (
                  <button onClick={() => removeSubFunnel(sf.id)} className="text-text-muted hover:text-red-400 transition-colors p-0.5 flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={addSubFunnel}
          disabled={marketing.subFunnels.length >= 12}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors mt-2"
        >
          <Plus size={12} /> Adicionar funil
        </button>
      </div>

      {/* Total check */}
      <div className={`rounded-lg border p-3 ${subFunnelTotalPct === 100 ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        <div className="flex justify-between text-xs">
          <span className={subFunnelTotalPct === 100 ? 'text-green-400' : 'text-yellow-400'}>
            Total: {subFunnelTotalPct}% {subFunnelTotalPct !== 100 && '(deve somar 100%)'}
          </span>
          <span className="text-text-muted">
            Investimento mensal: <span className="text-blue-400 font-semibold">{formatCurrency(monthlyBudget, currency)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
