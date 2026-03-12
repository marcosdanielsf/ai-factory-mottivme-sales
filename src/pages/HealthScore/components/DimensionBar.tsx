import type { DimensionConfig } from "../types";

interface DimensionBarProps {
  config: DimensionConfig;
  value: number;
  delay?: number;
}

export function DimensionBar({ config, value, delay = 0 }: DimensionBarProps) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-24 shrink-0">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
        <span className="text-[10px] text-white/25 ml-1.5">
          {config.weight}%
        </span>
      </div>

      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden relative">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 flex">
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className="absolute top-0 bottom-0 w-px bg-white/[0.06]"
              style={{ left: `${tick}%` }}
            />
          ))}
        </div>
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${value}%`,
            backgroundColor: config.color,
            opacity: 0.85,
            transition: `width 1s ease-out ${delay}ms`,
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
              animation: "shimmer 2s ease-in-out infinite",
              animationDelay: `${delay + 1000}ms`,
            }}
          />
        </div>
      </div>

      <span
        className="w-10 text-right font-mono text-sm font-bold tabular-nums"
        style={{ color: config.color }}
      >
        {Math.round(value)}
      </span>

      {config.isManual && (
        <span className="text-[9px] text-white/20 uppercase tracking-widest">
          manual
        </span>
      )}
    </div>
  );
}
