import React, { useState } from 'react';
import { Check, Copy, Palette } from 'lucide-react';
import type { ColorEntry } from '../../../types/brand';
import { useToast } from '../../../hooks/useToast';

interface BrandColorsProps {
  colors: ColorEntry[];
  primaryColor: string;
}

export const BrandColors: React.FC<BrandColorsProps> = ({ colors, primaryColor }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { showToast } = useToast();

  if (!colors || colors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <Palette size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Paleta de cores nao configurada.</p>
      </div>
    );
  }

  const copyColor = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      showToast(`Cor ${value} copiada!`, 'success');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      showToast('Falha ao copiar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary color highlight */}
      <div className="rounded-xl border border-border-default bg-bg-secondary p-6">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Cor Principal</p>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-xl shadow-lg"
            style={{ backgroundColor: primaryColor }}
          />
          <div>
            <p className="text-lg font-mono font-semibold text-text-primary">{primaryColor}</p>
            <button
              onClick={() => copyColor(primaryColor, -1)}
              className="mt-1 text-xs text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1"
            >
              {copiedIndex === -1 ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === -1 ? 'Copiado!' : 'Copiar HEX'}
            </button>
          </div>
        </div>
      </div>

      {/* All colors grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden hover:border-accent-primary/30 transition-all"
          >
            <div
              className="h-24 w-full"
              style={{ backgroundColor: color.hex }}
            />
            <div className="p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">{color.name}</p>
              <div className="space-y-1">
                {[
                  { label: 'HEX', value: color.hex },
                  { label: 'RGB', value: color.rgb },
                  { label: 'HSL', value: color.hsl },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => copyColor(value, i * 10 + ['HEX', 'RGB', 'HSL'].indexOf(label))}
                    className="w-full flex items-center justify-between text-xs group"
                  >
                    <span className="text-text-muted">{label}</span>
                    <span className="font-mono text-text-secondary group-hover:text-accent-primary transition-colors flex items-center gap-1">
                      {value}
                      {copiedIndex === i * 10 + ['HEX', 'RGB', 'HSL'].indexOf(label) ? (
                        <Check size={10} className="text-green-400" />
                      ) : (
                        <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
