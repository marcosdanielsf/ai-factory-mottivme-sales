import type { CjmSlaStatus } from "../../../types/cjm";
import SlaIndicator from "./SlaIndicator";

interface ClientBadgeProps {
  contactName: string;
  hoursInStage: number;
  slaHours: number | null;
  onClick?: () => void;
}

function computeSlaStatus(
  hours: number,
  slaHours: number | null,
): CjmSlaStatus {
  if (!slaHours) return "ok";
  if (hours > slaHours) return "breach";
  if (hours >= slaHours * 0.8) return "warning";
  return "ok";
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

const ClientBadge = ({
  contactName,
  hoursInStage,
  slaHours,
  onClick,
}: ClientBadgeProps) => {
  const slaStatus = computeSlaStatus(hoursInStage, slaHours);

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg-secondary text-sm hover:bg-bg-tertiary transition-colors ${onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={onClick}
    >
      <SlaIndicator status={slaStatus} />
      <span className="truncate max-w-[120px] text-text-primary">
        {contactName}
      </span>
      <span className="text-text-muted text-xs ml-auto flex-shrink-0">
        {formatDuration(hoursInStage)}
      </span>
    </div>
  );
};

export default ClientBadge;
