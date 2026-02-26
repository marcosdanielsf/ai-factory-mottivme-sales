import React from 'react';
import { formatNumber, GHL_KEYS } from '../../helpers';
import type { FunnelStep } from '../../types';

interface FunnelVisualProps {
  steps: FunnelStep[];
}

const FB_COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];
const GHL_COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];

export const FunnelVisual: React.FC<FunnelVisualProps> = ({ steps }) => {
  const fbSteps = steps.filter(s => !GHL_KEYS.has(s.key) && s.value > 0);
  const ghlSteps = steps.filter(s => GHL_KEYS.has(s.key) && s.key !== 'ghl_separator' && s.value > 0);

  if (fbSteps.length === 0 && ghlSteps.length === 0) return null;

  const renderFunnel = (items: FunnelStep[], colors: string[], maxVal: number, id: string) => {
    const height = 34;
    const gap = 4;
    const totalHeight = items.length * (height + gap) - gap;
    const svgWidth = 320;

    return (
      <svg width="100%" viewBox={`0 0 ${svgWidth} ${totalHeight}`} className="block">
        <defs>
          {colors.map((color, i) => (
            <linearGradient key={`grad-${id}-${i}`} id={`grad-${id}-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        {items.map((step, i) => {
          const widthPct = maxVal > 0 ? step.value / maxVal : 0;
          const barWidth = Math.max(widthPct * (svgWidth - 120), 12);
          const x = (svgWidth - 120 - barWidth) / 2;
          const y = i * (height + gap);
          const gradIdx = Math.min(i, colors.length - 1);

          const nextWidthPct = i < items.length - 1 && maxVal > 0
            ? items[i + 1].value / maxVal
            : widthPct * 0.7;
          const nextBarWidth = Math.max(nextWidthPct * (svgWidth - 120), 12);
          const nextX = (svgWidth - 120 - nextBarWidth) / 2;

          return (
            <g key={step.key}>
              <polygon
                points={`${x},${y} ${x + barWidth},${y} ${nextX + nextBarWidth},${y + height} ${nextX},${y + height}`}
                fill={`url(#grad-${id}-${gradIdx})`}
              />
              <text
                x={svgWidth - 115}
                y={y + height / 2 + 1}
                fill="var(--color-text-secondary, #9ca3af)"
                fontSize={11}
                fontWeight={500}
                dominantBaseline="middle"
              >
                {step.label}
              </text>
              <text
                x={svgWidth - 8}
                y={y + height / 2 + 1}
                fill="var(--color-text-primary, #f0f2f5)"
                fontSize={13}
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
    <div className="space-y-5">
      {fbSteps.length > 0 && (
        <div>
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-3">
            Facebook Ads
          </div>
          {renderFunnel(fbSteps, FB_COLORS, fbMax, 'fb')}
        </div>
      )}

      {ghlSteps.length > 0 && (
        <div>
          <div className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider mb-3">
            Funil de Vendas
          </div>
          {renderFunnel(ghlSteps, GHL_COLORS, ghlMax, 'ghl')}
        </div>
      )}
    </div>
  );
};
