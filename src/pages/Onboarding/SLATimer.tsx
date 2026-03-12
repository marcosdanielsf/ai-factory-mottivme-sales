import { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { OnboardingStatus } from "./types";

interface SLATimerProps {
  sla_deadline: string | null;
  status: OnboardingStatus;
  size?: "sm" | "md" | "lg";
}

function getTimeRemaining(deadline: string): {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { totalMs: diff, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { totalMs: diff, hours, minutes, seconds, isExpired: false };
}

function getTimerColor(
  hours: number,
  isExpired: boolean,
  status: OnboardingStatus,
): { text: string; bg: string; border: string } {
  if (status === "concluido") {
    return {
      text: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
    };
  }
  if (status === "cancelado") {
    return {
      text: "text-text-muted",
      bg: "bg-bg-tertiary",
      border: "border-border-default",
    };
  }
  if (isExpired) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    };
  }
  if (hours < 6) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
    };
  }
  if (hours < 12) {
    return {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
    };
  }
  if (hours < 24) {
    return {
      text: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
    };
  }
  return {
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  };
}

export function SLATimer({ sla_deadline, status, size = "md" }: SLATimerProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // No deadline
  if (!sla_deadline) {
    return (
      <span className="text-xs text-text-muted flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Sem SLA
      </span>
    );
  }

  // Completed status
  if (status === "concluido") {
    const deadline = new Date(sla_deadline).getTime();
    const completedOnTime = Date.now() <= deadline;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
          completedOnTime
            ? "text-green-400 bg-green-500/10 border-green-500/30"
            : "text-red-400 bg-red-500/10 border-red-500/30"
        }`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {completedOnTime ? "No prazo" : "Atrasado"}
      </span>
    );
  }

  // Cancelled
  if (status === "cancelado") {
    return (
      <span className="text-xs text-text-muted flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Cancelado
      </span>
    );
  }

  const { hours, minutes, isExpired } = getTimeRemaining(sla_deadline);
  // tick is used only to trigger re-render
  void tick;
  const colors = getTimerColor(hours, isExpired, status);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (isExpired) {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full border animate-pulse ${sizeClasses[size]} ${colors.text} ${colors.bg} ${colors.border}`}
      >
        <AlertTriangle className={iconSize[size]} />
        ATRASADO
      </span>
    );
  }

  const display = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${colors.text} ${colors.bg} ${colors.border}`}
    >
      <Clock className={iconSize[size]} />
      {display}
    </span>
  );
}
