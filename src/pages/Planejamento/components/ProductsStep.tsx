import { Plus, Edit3, Trash2 } from 'lucide-react';
import type { ProductItem, Currency } from '../types';
import { formatCurrency } from '../calculation-engine';
import { NumInput, FieldHelp } from './NumInput';
import { BumpUpsellSection } from './BumpUpsellSection';

export function ProductsStep({ products, currency, onChange }: {
  products: ProductItem[];
  currency: Currency;
  onChange: (products: ProductItem[]) => void;
}) {
  const addProduct = () => {
    if (products.length >= 5) return;
    onChange([...products, { id: crypto.randomUUID(), name: `Produto ${products.length + 1}`, ticket: 1000, salesCycleDays: 30, targetUnits: 5, orderBumpTicket: 0, orderBumpRate: 0, upsellTicket: 0, upsellRate: 0 }]);
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    onChange(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeProduct = (id: string) => {
    if (products.length <= 1) return;
    onChange(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Intro explicativo */}
      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4">
        <h4 className="text-sm font-semibold text-text-primary mb-1">Passo 1: Seus Produtos</h4>
        <p className="text-xs text-text-muted leading-relaxed">
          Cadastre cada produto ou servico que voce vende. Pra cada um, defina o preco (ticket),
          quanto tempo leva pra fechar uma venda, e quantas vendas quer fazer por mes.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{products.length} de 5 produtos</span>
        <button
          onClick={addProduct}
          disabled={products.length >= 5}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg font-medium transition-colors disabled:opacity-30"
        >
          <Plus size={14} /> Adicionar Produto
        </button>
      </div>

      <div className="space-y-3">
        {products.map((product, idx) => (
          <div key={product.id} className="bg-bg-primary rounded-lg border border-border-default p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                <div className="relative group">
                  <input
                    type="text"
                    value={product.name}
                    onChange={e => updateProduct(product.id, { name: e.target.value })}
                    onFocus={e => e.target.select()}
                    className="bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-dashed border-text-muted/30 focus:border-blue-500 transition-colors pr-6"
                    placeholder="Ex: Mentoria Premium"
                  />
                  <Edit3 size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted/40 group-hover:text-blue-400 transition-colors pointer-events-none" />
                </div>
              </div>
              {products.length > 1 && (
                <button onClick={() => removeProduct(product.id)} className="text-text-muted hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Preco de venda
                  <FieldHelp text="Quanto o cliente paga pelo produto. Ex: R$ 997 para um curso, R$ 2.497 para uma mentoria." />
                </label>
                <NumInput
                  value={product.ticket}
                  onChange={v => updateProduct(product.id, { ticket: v })}
                  prefix={currency === 'BRL' ? 'R$' : '$'}
                  min={0}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Tempo p/ vender
                  <FieldHelp text="Em media, quantos dias leva desde o primeiro contato ate o cliente fechar a compra. Ex: 7 dias pra produto barato, 30-60 dias pra high ticket." />
                </label>
                <div className="relative">
                  <NumInput
                    value={product.salesCycleDays}
                    onChange={v => updateProduct(product.id, { salesCycleDays: Math.round(v) })}
                    min={1}
                    max={365}
                    className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">dias</span>
                </div>
              </div>
              <div>
                <label className="flex items-center text-[10px] text-text-muted mb-1 uppercase tracking-wider">
                  Meta vendas/mes
                  <FieldHelp text="Quantas unidades desse produto voce quer vender por mes. A calculadora vai projetar os leads e investimento necessarios." />
                </label>
                <NumInput
                  value={product.targetUnits}
                  onChange={v => updateProduct(product.id, { targetUnits: Math.round(v) })}
                  min={0}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Order Bump + Upsell */}
            <BumpUpsellSection product={product} currency={currency} onChange={updates => updateProduct(product.id, updates)} />

            <div className="mt-2 text-xs text-text-muted">
              Receita projetada: <span className="text-blue-400 font-semibold">
                {formatCurrency(
                  product.ticket * product.targetUnits
                  + product.targetUnits * (product.orderBumpRate / 100) * product.orderBumpTicket
                  + product.targetUnits * (product.upsellRate / 100) * product.upsellTicket,
                  currency
                )}
              </span>/mes
              {(product.orderBumpTicket > 0 || product.upsellTicket > 0) && (
                <span className="text-green-400 ml-1">
                  (+{formatCurrency(
                    product.targetUnits * (product.orderBumpRate / 100) * product.orderBumpTicket
                    + product.targetUnits * (product.upsellRate / 100) * product.upsellTicket,
                    currency
                  )} extras)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-3">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Total produtos: {products.length}/5</span>
          <span className="text-blue-400 font-semibold">
            Receita total: {formatCurrency(products.reduce((s, p) => s + p.ticket * p.targetUnits, 0), currency)}/mes
          </span>
        </div>
      </div>
    </div>
  );
}
