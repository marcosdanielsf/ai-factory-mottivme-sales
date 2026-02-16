import React from 'react';
import { Package, Megaphone, ShoppingCart, ChevronRight } from 'lucide-react';

export function WizardSteps({ step, onChange }: { step: 1 | 2 | 3; onChange: (s: 1 | 2 | 3) => void }) {
  const steps = [
    { num: 1 as const, label: 'Produtos', icon: Package },
    { num: 2 as const, label: 'Marketing', icon: Megaphone },
    { num: 3 as const, label: 'Vendas', icon: ShoppingCart },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <button
            onClick={() => onChange(s.num)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              step === s.num
                ? 'bg-purple-500 text-white'
                : step > s.num
                  ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                  : 'bg-bg-primary text-text-muted hover:text-text-primary'
            }`}
          >
            <s.icon size={14} />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.num}</span>
          </button>
          {i < 2 && <ChevronRight size={14} className="text-text-muted/50" />}
        </React.Fragment>
      ))}
    </div>
  );
}
