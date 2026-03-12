import { useId, useMemo } from "react";
import type { RiskLevel } from "../types";
import { RISK_CONFIG } from "../types";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  riskLevel: RiskLevel;
  label?: string;
  animated?: boolean;
}

export function ScoreGauge({
  score,
  size = 120,
  riskLevel,
  label,
  animated = true,
}: ScoreGaugeProps) {
  const filterId = useId();
  const config = RISK_CONFIG[riskLevel];
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useMemo(
    () => circumference - (score / 100) * circumference,
    [circumference, score],
  );

  return (
    <div className="relative flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        className={animated ? "gauge-animate" : ""}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="6"
        />
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${filterId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter={`url(#glow-${filterId})`}
          style={{
            transition: animated ? "stroke-dashoffset 1.2s ease-out" : "none",
          }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          dominantBaseline="central"
          fill={config.color}
          fontSize={size * 0.28}
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
        >
          {Math.round(score)}
        </text>
        <text
          x={size / 2}
          y={size / 2 + size * 0.16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.4)"
          fontSize={size * 0.09}
          fontWeight="500"
          letterSpacing="0.05em"
        >
          /100
        </text>
      </svg>
      {label && (
        <span
          className="text-[11px] font-medium tracking-wide uppercase"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
