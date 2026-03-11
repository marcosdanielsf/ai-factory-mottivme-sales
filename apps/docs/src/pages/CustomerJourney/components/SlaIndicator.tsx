import type { CjmSlaStatus } from "../../../types/cjm";

const statusClasses: Record<CjmSlaStatus, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  breach: "bg-red-500 animate-pulse",
};

interface SlaIndicatorProps {
  status: CjmSlaStatus;
}

const SlaIndicator = ({ status }: SlaIndicatorProps) => {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${statusClasses[status]}`}
      title={
        status === "ok"
          ? "Dentro do SLA"
          : status === "warning"
            ? "Proximo do SLA"
            : "SLA violado"
      }
    />
  );
};

export default SlaIndicator;
