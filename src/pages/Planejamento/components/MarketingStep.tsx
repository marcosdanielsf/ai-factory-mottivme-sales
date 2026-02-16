import { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronDown } from 'lucide-react';
import type { PlanningState, Currency } from '../types';
import type { ChannelConfig } from '../types';
import { formatCurrency } from '../calculation-engine';
import { NumInput, FieldHelp } from './NumInput';

export function MarketingStep({ marketing, currency, onChange }: {
  marketing: PlanningState['marketing'];
  currency: Currency;
  onChange: (m: PlanningState['marketing']) => void;
}) {
  const [showSubFunnels, setShowSubFunnels] = useState(true);

  const updateChannel = (key: 'socialSelling' | 'trafego' | 'organico', field: keyof ChannelConfig, value: number) => {
    onChange({
      ...marketing,
      channels: {
        ...marketing.channels,
        [key]: { ...marketing.channels[key], [field]: value },
      },
    });
  };

  const updateSubFunnel = (id: string, field: 'pctBudget' | 'cpl' | 'name', value: number | string) => {
    onChange({
      ...marketing,
      trafegoSubFunnels: marketing.trafegoSubFunnels.map(sf =>
        sf.id === id ? { ...sf, [field]: value } : sf
      ),
    });
  };

  const addSubFunnel = () => {
    if (marketing.trafegoSubFunnels.length >= 8) return;
    onChange({
      ...marketing,
      trafegoSubFunnels: [...marketing.trafegoSubFunnels, {
        id: crypto.randomUUID(),
        name: `Funil ${marketing.trafegoSubFunnels.length + 1}`,
        pctBudget: 0,
        cpl: 10,
      }],
    });
  };

  const removeSubFunnel = (id: string) => {
    if (marketing.trafegoSubFunnels.length <= 1) return;
    onChange({
      ...marketing,
      trafegoSubFunnels: marketing.trafegoSubFunnels.filter(sf => sf.id !== id),
    });
  };

  const totalPct = marketing.channels.socialSelling.pctBudget + marketing.channels.trafego.pctBudget + marketing.channels.organico.pctBudget;
  const monthlyBudget = marketing.dailyBudget * 30;
  const trafegoBudget = monthlyBudget * marketing.channels.trafego.pctBudget / 100;
  const subFunnelTotalPct = marketing.trafegoSubFunnels.reduce((s, sf) => s + sf.pctBudget, 0);

  const channels = [
    { key: 'socialSelling' as const, label: 'Social Selling', color: 'pink', desc: 'DM, networking, conteudo' },
    { key: 'trafego' as const, label: 'Trafego Pago', color: 'orange', desc: 'Ads, Meta, Google' },
    { key: 'organico' as const, label: 'Organico', color: 'cyan', desc: 'SEO, indicacao, eventos' },
  ];

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-purple-500/5 rounded-lg border border-purple-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 2: Marketing</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Defina quanto vai investir por dia e como distribuir entre os canais.
          No Trafego Pago, voce pode detalhar os sub-funis (Novo Seguidor, Remarketing, etc).
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
            className="w-28 text-right text-sm font-bold bg-bg-secondary border border-border-default rounded-lg pr-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <input
          type="range"
          value={marketing.dailyBudget}
          onChange={e => onChange({ ...marketing, dailyBudget: parseFloat(e.target.value) })}
          min={10} max={50000} step={10}
          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-500"
          style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((marketing.dailyBudget - 10) / (50000 - 10)) * 100}%, #1f2937 ${((marketing.dailyBudget - 10) / (50000 - 10)) * 100}%, #1f2937 100%)` }}
        />
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>{formatCurrency(10, currency)}/dia</span>
          <span className="text-purple-400 font-semibold">{formatCurrency(monthlyBudget, currency)}/mes</span>
          <span>{formatCurrency(50000, currency)}/dia</span>
        </div>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        {channels.map(({ key, label, color, desc }) => {
          const ch = marketing.channels[key];
          const channelBudget = monthlyBudget * ch.pctBudget / 100;
          const estimatedLeads = key === 'trafego' && marketing.trafegoSubFunnels.length > 0
            ? marketing.trafegoSubFunnels.reduce((total, sf) => {
                const sfInv = channelBudget * sf.pctBudget / 100;
                return total + (sf.cpl > 0 ? Math.floor(sfInv / sf.cpl) : 0);
              }, 0)
            : ch.cpl > 0 ? Math.floor(channelBudget / ch.cpl) : 0;

          return (
            <div key={key} className="bg-bg-primary rounded-lg border border-border-default p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full bg-${color}-400`} />
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <span className="text-[10px] text-text-muted">({desc})</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                    % do Budget
                    <FieldHelp text={`Qual % do investimento total vai pra ${label}. A soma dos 3 canais deve dar 100%.`} />
                  </label>
                  <div className="flex items-center gap-2">
                    <NumInput
                      value={ch.pctBudget}
                      onChange={v => updateChannel(key, 'pctBudget', v)}
                      min={0} max={100}
                      className={`w-20 text-center text-sm bg-bg-secondary border border-${color}-500/30 rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-${color}-500`}
                    />
                    <span className="text-xs text-text-muted">% = {formatCurrency(channelBudget, currency)}/mes</span>
                  </div>
                </div>
                {key !== 'trafego' && (
                  <div>
                    <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                      CPL
                      <FieldHelp text="Custo por Lead — quanto custa em media pra conseguir 1 contato novo nesse canal." />
                    </label>
                    <div className="flex items-center gap-2">
                      <NumInput
                        value={ch.cpl}
                        onChange={v => updateChannel(key, 'cpl', v)}
                        min={0.1} max={500}
                        className={`w-20 text-center text-sm bg-bg-secondary border border-${color}-500/30 rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-${color}-500`}
                      />
                      <span className="text-xs text-text-muted">= ~{estimatedLeads} leads/mes</span>
                    </div>
                  </div>
                )}
                {key === 'trafego' && (
                  <div className="flex items-end">
                    <span className="text-xs text-text-muted">~{estimatedLeads} leads/mes (via sub-funis)</span>
                  </div>
                )}
              </div>

              {/* Sub-funnels for Trafego */}
              {key === 'trafego' && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSubFunnels(!showSubFunnels)}
                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors mb-3"
                  >
                    <ChevronDown size={14} className={`transition-transform ${showSubFunnels ? 'rotate-180' : ''}`} />
                    Sub-funis de Trafego ({marketing.trafegoSubFunnels.length})
                    <FieldHelp text="Divida sua verba de trafego entre diferentes funis. Cada funil tem seu proprio CPL. Ex: Novo Seguidor custa R$1.50, VSL custa R$20." />
                  </button>

                  {showSubFunnels && (
                    <div className="space-y-2 pl-1 border-l-2 border-orange-500/20 ml-1">
                      {marketing.trafegoSubFunnels.map((sf) => {
                        const sfBudget = trafegoBudget * sf.pctBudget / 100;
                        const sfLeads = sf.cpl > 0 ? Math.floor(sfBudget / sf.cpl) : 0;
                        return (
                          <div key={sf.id} className="flex items-center gap-2 pl-3 py-1.5 bg-bg-secondary/50 rounded-lg">
                            <div className="relative group flex-shrink-0 w-28">
                              <input
                                type="text"
                                value={sf.name}
                                onChange={e => updateSubFunnel(sf.id, 'name', e.target.value)}
                                className="w-full text-xs bg-transparent text-text-primary border-b border-dashed border-text-muted/30 focus:border-orange-500 focus:outline-none pr-4"
                              />
                              <Edit3 size={8} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40 group-hover:text-orange-400 pointer-events-none" />
                            </div>
                            <div className="flex items-center gap-1">
                              <NumInput
                                value={sf.pctBudget}
                                onChange={v => updateSubFunnel(sf.id, 'pctBudget', v)}
                                min={0} max={100}
                                className="w-12 text-center text-xs bg-bg-secondary border border-orange-500/20 rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                                className="w-16 text-xs bg-bg-secondary border border-orange-500/20 rounded pr-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <span className="text-[10px] text-text-muted whitespace-nowrap ml-auto">
                              {sfLeads} leads
                            </span>
                            {marketing.trafegoSubFunnels.length > 1 && (
                              <button onClick={() => removeSubFunnel(sf.id)} className="text-text-muted hover:text-red-400 transition-colors p-0.5 flex-shrink-0">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between pl-3 pt-1">
                        <button
                          onClick={addSubFunnel}
                          disabled={marketing.trafegoSubFunnels.length >= 8}
                          className="flex items-center gap-1 text-[10px] text-orange-400 hover:text-orange-300 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={10} /> Adicionar funil
                        </button>
                        <span className={`text-[10px] ${subFunnelTotalPct === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {subFunnelTotalPct}% alocado {subFunnelTotalPct !== 100 && '(ideal: 100%)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total check */}
      <div className={`rounded-lg border p-3 ${totalPct === 100 ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
        <div className="flex justify-between text-xs">
          <span className={totalPct === 100 ? 'text-green-400' : 'text-yellow-400'}>
            Total: {totalPct}% {totalPct !== 100 && '(deve somar 100%)'}
          </span>
          <span className="text-text-muted">
            Investimento mensal: <span className="text-purple-400 font-semibold">{formatCurrency(monthlyBudget, currency)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
