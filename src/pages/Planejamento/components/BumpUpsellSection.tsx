import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProductItem, Currency } from '../types';
import { NumInput, FieldHelp } from './NumInput';

export function BumpUpsellSection({ product, currency, onChange }: {
  product: ProductItem;
  currency: Currency;
  onChange: (updates: Partial<ProductItem>) => void;
}) {
  const hasBump = product.orderBumpTicket > 0 || product.orderBumpRate > 0;
  const hasUpsell = product.upsellTicket > 0 || product.upsellRate > 0;
  const [open, setOpen] = useState(hasBump || hasUpsell);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-green-400 hover:text-green-300 font-medium transition-colors uppercase tracking-wider"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        Ofertas adicionais (Order Bump + Upsell)
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-2 gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
          {/* Order Bump */}
          <div>
            <div className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
              Order Bump
              <FieldHelp text="Oferta complementar mostrada no checkout. Ex: R$ 97 por um e-book bonus. O cliente compra junto com o produto principal." />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-text-muted">Valor</label>
                <NumInput
                  value={product.orderBumpTicket}
                  onChange={v => onChange({ orderBumpTicket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-green-500/20 rounded-lg pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">% que compram</label>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={product.orderBumpRate}
                    onChange={v => onChange({ orderBumpRate: v })}
                    min={0} max={100}
                    className="w-full bg-bg-secondary border border-green-500/20 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-[10px] text-text-muted">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upsell */}
          <div>
            <div className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
              Upsell
              <FieldHelp text="Oferta premium pos-compra. Ex: R$ 497 por mentoria individual. Oferecida depois que o cliente ja comprou o produto principal." />
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-text-muted">Valor</label>
                <NumInput
                  value={product.upsellTicket}
                  onChange={v => onChange({ upsellTicket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-green-500/20 rounded-lg pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">% que compram</label>
                <div className="flex items-center gap-1">
                  <NumInput
                    value={product.upsellRate}
                    onChange={v => onChange({ upsellRate: v })}
                    min={0} max={100}
                    className="w-full bg-bg-secondary border border-green-500/20 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-[10px] text-text-muted">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
