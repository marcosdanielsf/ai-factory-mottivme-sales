import { CampaignStatus } from '../../hooks/useColdCallCampaigns';

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Concluída' },
];

export const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-text-muted', bg: 'bg-bg-tertiary' },
  active: { label: 'Ativa', color: 'text-accent-success', bg: 'bg-accent-success/15' },
  paused: { label: 'Pausada', color: 'text-accent-warning', bg: 'bg-accent-warning/15' },
  completed: { label: 'Concluída', color: 'text-accent-primary', bg: 'bg-accent-primary/15' },
};

export const DAY_LABELS: Record<string, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

export const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const QUEUE_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pendente', icon: '⏳', color: 'text-text-muted' },
  calling: { label: 'Ligando', icon: '📞', color: 'text-accent-primary' },
  completed: { label: 'Concluído', icon: '✅', color: 'text-accent-success' },
  failed: { label: 'Falha', icon: '❌', color: 'text-accent-error' },
  retry: { label: 'Retry', icon: '🔄', color: 'text-accent-warning' },
};
