import { Activity, AlertTriangle, Heart, ShieldCheck, Zap } from "lucide-react";
import type { HealthSummary } from "../../../hooks/useHealthScore";
import { ScoreGauge } from "./ScoreGauge";
import type { RiskLevel } from "../types";

interface SummaryCardsProps {
  summary: HealthSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const avgRisk: RiskLevel =
    summary.avgScore >= 80
      ? "excellent"
      : summary.avgScore >= 60
        ? "healthy"
        : summary.avgScore >= 40
          ? "at_risk"
          : "critical";

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {/* Main gauge card */}
      <div
        className="md:col-span-1 rounded-2xl p-5 flex flex-col items-center justify-center"
        style={{
          background:
            "linear-gradient(145deg, rgba(6,182,212,0.06) 0%, rgba(15,15,20,0.8) 100%)",
          border: "1px solid rgba(6,182,212,0.12)",
        }}
      >
        <ScoreGauge
          score={summary.avgScore}
          size={100}
          riskLevel={avgRisk}
          label="Score Medio"
        />
      </div>

      {/* Status cards */}
      <StatusCard
        icon={<ShieldCheck size={18} />}
        label="Excelentes"
        count={summary.excellent}
        total={summary.totalClients}
        color="#10b981"
      />
      <StatusCard
        icon={<Heart size={18} />}
        label="Saudaveis"
        count={summary.healthy}
        total={summary.totalClients}
        color="#06b6d4"
      />
      <StatusCard
        icon={<AlertTriangle size={18} />}
        label="Em Risco"
        count={summary.atRisk}
        total={summary.totalClients}
        color="#f59e0b"
      />
      <StatusCard
        icon={<Zap size={18} />}
        label="Criticos"
        count={summary.critical}
        total={summary.totalClients}
        color="#ef4444"
      />
    </div>
  );
}

function StatusCard({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col justify-between min-h-[120px] relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${color}08, rgba(15,15,20,0.6))`,
        border: `1px solid ${color}18`,
      }}
    >
      {/* Background number */}
      <div
        className="absolute -right-2 -bottom-4 font-mono text-[72px] font-black leading-none select-none pointer-events-none"
        style={{ color: `${color}06` }}
      >
        {count}
      </div>

      <div className="flex items-center gap-2" style={{ color }}>
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-mono font-bold" style={{ color }}>
            {count}
          </span>
          <span className="text-xs text-white/25">/ {total}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    </div>
  );
}
