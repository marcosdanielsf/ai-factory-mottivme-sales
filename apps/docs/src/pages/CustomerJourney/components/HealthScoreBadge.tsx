import { useState } from "react";

interface HealthScoreBadgeProps {
  score: number | null;
}

function getBadgeStyle(score: number | null): {
  bg: string;
  text: string;
  label: string;
} {
  if (score === null) {
    return {
      bg: "bg-gray-500/20",
      text: "text-gray-400",
      label: "—",
    };
  }
  if (score >= 80) {
    return {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      label: String(score),
    };
  }
  if (score >= 50) {
    return {
      bg: "bg-amber-500/20",
      text: "text-amber-400",
      label: String(score),
    };
  }
  return {
    bg: "bg-red-500/20",
    text: "text-red-400",
    label: String(score),
  };
}

const HealthScoreBadge = ({ score }: HealthScoreBadgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { bg, text, label } = getBadgeStyle(score);
  const tooltipText =
    score !== null ? `Health Score: ${score}/100` : "Dados limitados";

  return (
    <span className="relative inline-flex flex-shrink-0">
      <span
        className={`inline-flex items-center justify-center text-xs px-1.5 py-0.5 rounded font-medium ${bg} ${text}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {label}
      </span>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs rounded bg-bg-primary border border-border-default text-text-primary whitespace-nowrap z-10 shadow-lg pointer-events-none">
          {tooltipText}
        </span>
      )}
    </span>
  );
};

export default HealthScoreBadge;
