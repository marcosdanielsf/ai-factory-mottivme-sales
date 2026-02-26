import React from 'react';
import { formatNumber } from '../../helpers';
import type { FunnelStep } from '../../types';

interface FunnelVisualProps {
  steps: FunnelStep[];
}

const GHL_KEYS = new Set(['ghl_separator', 'ghl_leads', 'ghl_em_contato', 'ghl_agendou', 'ghl_compareceu', 'ghl_won']);

const FB_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
const GHL_COLORS = ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'];

export const FunnelVisual: React.FC<FunnelVisualProps> = ({ steps }) => {
  // Split into FB and GHL steps, skip separator and zero-value
  const fbSteps = steps.filter(s => !GHL_KEYS.has(s.key) && s.value > 0);
  const ghlSteps = steps.filter(s => GHL_KEYS.has(s.key) && s.key !== 'ghl_separator' && s.value > 0);

  if (fbSteps.length === 0 && ghlSteps.length === 0) return null;

  const renderFunnel = (items: FunnelStep[], colors: string[], maxVal: number) => {
    const height = 32;
    const gap = 3;
    const totalHeight = items.length * (height + gap) - gap;
    const svgWidth = 320;

    return (
      <svg width="100%" viewBox={`0 0 ${svgWidth} ${totalHeight}`} className="block">
        {items.map((step, i) => {
          const widthPct = maxVal > 0 ? step.value / maxVal : 0;
          const barWidth = Math.max(widthPct * (svgWidth - 120), 8);
          const x = (svgWidth - 120 - barWidth) / 2;
          const y = i * (height + gap);
          const color = colors[Math.min(i, colors.length - 1)];

          // Trapezoid: wider top, narrower bottom
          const nextWidthPct = i < items.length - 1 && maxVal > 0
            ? items[i + 1].value / maxVal
            : widthPct * 0.7;
          const nextBarWidth = Math.max(nextWidthPct * (svgWidth - 120), 8);
          const nextX = (svgWidth - 120 - nextBarWidth) / 2;

          return (
            <g key={step.key}>
              <polygon
                points={`${x},${y} ${x + barWidth},${y} ${nextX + nextBarWidth},${y + height} ${nextX},${y + height}`}
                fill={color}
                opacity={0.85}
                rx={4}
              />
              {/* Label */}
              <text
                x={svgWidth - 115}
                y={y + height / 2 + 1}
                fill="var(--text-secondary)"
                fontSize={11}
                dominantBaseline="middle"
              >
                {step.label}
              </text>
              {/* Value */}
              <text
                x={svgWidth - 8}
                y={y + height / 2 + 1}
                fill="var(--text-primary)"
                fontSize={12}
                fontWeight={700}
                dominantBaseline="middle"
                textAnchor="end"
              >
                {formatNumber(step.value)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const fbMax = fbSteps.length > 0 ? fbSteps[0].value : 1;
  const ghlMax = ghlSteps.length > 0 ? ghlSteps[0].value : 1;

  return (
    <div className="space-y-4">
      {/* FB Funnel */}
      {fbSteps.length > 0 && (
        <div>
          <div className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-2">
            Facebook Ads
          </div>
          {renderFunnel(fbSteps, FB_COLORS, fbMax)}
        </div>
      )}

      {/* GHL Funnel */}
      {ghlSteps.length > 0 && (
        <div>
          <div className="text-[10px] text-amber-400/80 font-medium uppercase tracking-wider mb-2">
            Funil de Vendas
          </div>
          {renderFunnel(ghlSteps, GHL_COLORS, ghlMax)}
        </div>
      )}
    </div>
  );
};
