import type { CriativoLead } from '../../hooks/useAgendamentosDashboard';

export const FUNNEL_STAGES: Record<string, { label: string; color: string; bg: string; order: number }> = {
  won: { label: 'Fechou', color: 'text-green-400', bg: 'bg-green-500/20', order: 6 },
  fechou: { label: 'Fechou', color: 'text-green-400', bg: 'bg-green-500/20', order: 6 },
  fechado: { label: 'Fechou', color: 'text-green-400', bg: 'bg-green-500/20', order: 6 },
  completed: { label: 'Compareceu', color: 'text-emerald-400', bg: 'bg-emerald-500/20', order: 5 },
  compareceu: { label: 'Compareceu', color: 'text-emerald-400', bg: 'bg-emerald-500/20', order: 5 },
  no_show: { label: 'No-Show', color: 'text-red-400', bg: 'bg-red-500/20', order: 4 },
  booked: { label: 'Agendou', color: 'text-amber-400', bg: 'bg-amber-500/20', order: 3 },
  agendou: { label: 'Agendou', color: 'text-amber-400', bg: 'bg-amber-500/20', order: 3 },
  agendado: { label: 'Agendou', color: 'text-amber-400', bg: 'bg-amber-500/20', order: 3 },
  confirmado: { label: 'Agendou', color: 'text-amber-400', bg: 'bg-amber-500/20', order: 3 },
  'em contato': { label: 'Em Contato', color: 'text-cyan-400', bg: 'bg-cyan-500/20', order: 2 },
  respondeu: { label: 'Respondeu', color: 'text-purple-400', bg: 'bg-purple-500/20', order: 2 },
  novo: { label: 'Novo', color: 'text-blue-400', bg: 'bg-blue-500/20', order: 1 },
};

export const getLeadStage = (lead: CriativoLead) => {
  const primary = lead.status || lead.etapa_funil;
  if (!primary) return { label: 'Novo', color: 'text-text-muted', bg: 'bg-bg-tertiary', order: 0 };
  const lower = primary.toLowerCase();
  for (const [key, config] of Object.entries(FUNNEL_STAGES)) {
    if (lower.includes(key)) return config;
  }
  return { label: primary, color: 'text-text-muted', bg: 'bg-bg-tertiary', order: 0 };
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Compareceu' },
  won: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ganho' },
  no_show: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Não compareceu' },
  lost: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Perdido' },
  booked: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Agendado' },
};

export const DONUT_COLORS = ['#f97316', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#eab308']; // orange, pink, blue, emerald, violet, yellow
