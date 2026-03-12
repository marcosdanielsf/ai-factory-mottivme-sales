import { useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Pencil,
  Zap,
  Calendar,
  MessageCircle,
  Clock,
} from "lucide-react";
import type { ClientHealth } from "../../../hooks/useHealthScore";
import { DIMENSIONS, RISK_CONFIG } from "../types";
import { ScoreGauge } from "./ScoreGauge";
import { DimensionBar } from "./DimensionBar";
import { ManualInputModal } from "./ManualInputModal";

interface ClientCardProps {
  client: ClientHealth;
  rank: number;
  onSaveManualInput: (
    locationId: string,
    dimension: "satisfaction" | "payment",
    score: number,
    notes?: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ClientCard({
  client,
  rank,
  onSaveManualInput,
}: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editDimension, setEditDimension] = useState<
    "satisfaction" | "payment" | null
  >(null);
  const config = RISK_CONFIG[client.risk_level];

  const getDimensionValue = (key: string): number => {
    const map: Record<string, number> = {
      engagement: client.score_engagement,
      scheduling: client.score_scheduling,
      satisfaction: client.score_satisfaction,
      activity: client.score_activity,
      payment: client.score_payment,
    };
    return map[key] ?? 0;
  };

  const timeAgo = client.last_lead_at
    ? formatTimeAgo(new Date(client.last_lead_at))
    : "Sem atividade";

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300 group"
        style={{
          background: `linear-gradient(135deg, ${config.bg}, rgba(15,15,20,0.6))`,
          border: `1px solid ${config.border}`,
          boxShadow: expanded
            ? `0 8px 32px ${config.bg}, inset 0 1px 0 rgba(255,255,255,0.03)`
            : `inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        {/* Pulse indicator for critical */}
        {client.risk_level === "critical" && (
          <div
            className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: config.color,
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
        )}

        {/* Main row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer"
        >
          {/* Rank */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold"
            style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
            }}
          >
            {rank}
          </div>

          {/* Gauge */}
          <div className="shrink-0">
            <ScoreGauge
              score={client.score_overall}
              size={56}
              riskLevel={client.risk_level}
              animated={false}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white/90 truncate">
                {client.agent_name || "Sem nome"}
              </h3>
              {!client.is_active && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase tracking-wider">
                  Inativo
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-white/35">
              <span className="flex items-center gap-1">
                <MessageCircle size={10} />
                {client.total_leads_30d} leads
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {client.leads_scheduled_30d} agend.
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Risk badge */}
          <div
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0"
            style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
            }}
          >
            {config.label}
          </div>

          {/* Expand */}
          <div className="text-white/20">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div
            className="px-4 pb-4 pt-0 space-y-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            {/* Dimension bars */}
            <div className="space-y-2.5 pt-3">
              {DIMENSIONS.map((dim, i) => (
                <div key={dim.key} className="flex items-center gap-1">
                  <div className="flex-1">
                    <DimensionBar
                      config={dim}
                      value={getDimensionValue(dim.key)}
                      delay={i * 80}
                    />
                  </div>
                  {dim.isManual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDimension(dim.key as "satisfaction" | "payment");
                      }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div
              className="grid grid-cols-3 gap-2 pt-2 border-t"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <QuickStat
                icon={<Zap size={12} />}
                label="Responderam"
                value={`${client.leads_responded_30d}/${client.total_leads_30d}`}
                color="#8b5cf6"
              />
              <QuickStat
                icon={<Calendar size={12} />}
                label="Agendaram"
                value={`${client.leads_scheduled_30d}/${client.total_leads_30d}`}
                color="#06b6d4"
              />
              <QuickStat
                icon={<Activity size={12} />}
                label="Ultimos 7d"
                value={`${client.leads_last_7d} leads`}
                color="#10b981"
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual input modal */}
      {editDimension && (
        <ManualInputModal
          locationId={client.location_id}
          dimension={editDimension}
          currentScore={
            editDimension === "satisfaction"
              ? client.score_satisfaction
              : client.score_payment
          }
          clientName={client.agent_name}
          onSave={onSaveManualInput}
          onClose={() => setEditDimension(null)}
        />
      )}
    </>
  );
}

function QuickStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-2.5 text-center"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}15`,
      }}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[9px] text-white/30 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Agora";
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `${days}d atras`;
  return `${Math.floor(days / 7)}sem atras`;
}
