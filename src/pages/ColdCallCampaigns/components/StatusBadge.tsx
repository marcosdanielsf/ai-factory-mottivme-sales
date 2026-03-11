import { CampaignStatus } from '../../../hooks/useColdCallCampaigns';
import { STATUS_CONFIG } from '../constants';

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}
