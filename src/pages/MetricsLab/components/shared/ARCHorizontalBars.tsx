import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { CriativoARC } from '../../types';
import { formatCurrency } from '../../helpers';

interface ARCHorizontalBarsProps {
  criativo: CriativoARC;
}

interface BarConfig {
  label: string;
  tooltip: string;
  getValue: (c: CriativoARC) => number;
  format: (v: number) => string;
  max: number;
  benchmark: number;
  benchmarkLabel: string;
}

const BAR_CONFIGS: BarConfig[] = [
  {
    label: 'CTR',
    tooltip: 'Click-Through Rate: % de pessoas que clicaram no anuncio apos ve-lo. Benchmark: >1.5%',
    getValue: (c) => c.ctr,
    format: (v) => `${v.toFixed(1)}%`,
    max: 6,
    benchmark: 1.5,
    benchmarkLabel: '1.5%',
  },
  {
    label: 'Hook Rate',
    tooltip: 'Taxa de Atencao: % de impressoes que resultaram em 3s+ de visualizacao do video. Mede se o inicio do video prende a atencao. Benchmark: >30%',
    getValue: (c) => c.hook_rate,
    format: (v) => `${v.toFixed(1)}%`,
    max: 60,
    benchmark: 30,
    benchmarkLabel: '30%',
  },
  {
    label: 'Hold Rate',
    tooltip: 'Taxa de Retencao: % de quem viu 3s que assistiu ate 75% do video. Mede se o conteudo mantem o interesse. Benchmark: >2.5%',
    getValue: (c) => c.hold_rate,
    format: (v) => `${v.toFixed(1)}%`,
    max: 6,
    benchmark: 2.5,
    benchmarkLabel: '2.5%',
  },
  {
    label: 'Body Rate',
    tooltip: 'Taxa de Conversao do Criativo: % de quem assistiu 75% que clicou no link externo. Mede se o CTA do video funciona. Benchmark: >2.5%',
    getValue: (c) => c.body_rate,
    format: (v) => `${v.toFixed(1)}%`,
    max: 6,
    benchmark: 2.5,
    benchmarkLabel: '2.5%',
  },
  {
    label: 'Gasto',
    tooltip: 'Valor total investido neste anuncio no periodo selecionado.',
    getValue: (c) => c.gasto,
    format: (v) => formatCurrency(v),
    max: 10000,
    benchmark: 0,
    benchmarkLabel: '',
  },
  {
    label: 'ROAS',
    tooltip: 'Return on Ad Spend: receita gerada dividida pelo gasto. ROAS 2x = para cada R$1 investido, R$2 de receita. Benchmark: >1.5x',
    getValue: (c) => c.roas,
    format: (v) => `${v.toFixed(1)}x`,
    max: 6,
    benchmark: 1.5,
    benchmarkLabel: '1.5x',
  },
  {
    label: 'Vendas',
    tooltip: 'Numero total de conversoes (vendas, agendamentos ou eventos de valor) atribuidas a este anuncio.',
    getValue: (c) => c.vendas,
    format: (v) => String(Math.round(v)),
    max: 20,
    benchmark: 1,
    benchmarkLabel: '1',
  },
];

const MetricTooltip: React.FC<{ text: string; benchmarkLabel: string }> = ({ text, benchmarkLabel }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex">
      <Info
        size={10}
        className="cursor-help opacity-40 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed w-56 shadow-lg border pointer-events-none"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          {text}
          {benchmarkLabel && (
            <span className="block mt-1 text-amber-400 font-medium">
              Meta: {benchmarkLabel}
            </span>
          )}
        </span>
      )}
    </span>
  );
};

export const ARCHorizontalBars: React.FC<ARCHorizontalBarsProps> = ({ criativo }) => {
  return (
    <div className="space-y-2.5">
      {BAR_CONFIGS.map((bar) => {
        const value = bar.getValue(criativo);
        const pct = Math.min((value / bar.max) * 100, 100);
        const benchmarkPct = bar.benchmark > 0
          ? Math.min((bar.benchmark / bar.max) * 100, 100)
          : null;
        const isAboveBenchmark = bar.benchmark === 0 || value >= bar.benchmark;

        return (
          <div key={bar.label}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] text-text-muted flex items-center gap-1">
                {bar.label}
                <MetricTooltip text={bar.tooltip} benchmarkLabel={bar.benchmarkLabel} />
              </span>
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  isAboveBenchmark ? 'text-emerald-400' : 'text-text-secondary'
                }`}
              >
                {bar.format(value)}
              </span>
            </div>
            <div className="relative h-1.5 bg-bg-hover rounded-full overflow-visible">
              {/* Fill bar */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  isAboveBenchmark ? 'bg-emerald-400' : 'bg-bg-hover brightness-150'
                }`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: isAboveBenchmark ? undefined : 'rgba(255,255,255,0.15)',
                }}
              />
              {/* Benchmark marker */}
              {benchmarkPct !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-amber-400/60 rounded-full"
                  style={{ left: `${benchmarkPct}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
