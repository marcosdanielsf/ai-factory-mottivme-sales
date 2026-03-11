export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatPct = (value: number | null | undefined, decimals = 1): string =>
  value != null ? `${value.toFixed(decimals)}%` : '—';

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('pt-BR').format(value);

export type ScoreColorLevel = 'red' | 'yellow' | 'green' | 'bright-green';

export const getScoreColor = (score: number): ScoreColorLevel => {
  if (score <= 40) return 'red';
  if (score <= 70) return 'yellow';
  if (score <= 85) return 'green';
  return 'bright-green';
};

export const getScoreBgClass = (score: number): string => {
  if (score <= 40) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score <= 70) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (score <= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
  return 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30';
};

export type PotencialLevel = 'alto' | 'medio' | 'baixo' | 'desqualificado';

export interface PotencialConfig {
  label: string;
  dotClass: string;
  textClass: string;
  bgClass: string;
}

export const getPotencialConfig = (potencial: PotencialLevel): PotencialConfig => {
  const configs: Record<PotencialLevel, PotencialConfig> = {
    alto: {
      label: 'Alto',
      dotClass: 'bg-emerald-400',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-400/10',
    },
    medio: {
      label: 'Medio',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-400/10',
    },
    baixo: {
      label: 'Baixo',
      dotClass: 'bg-orange-400',
      textClass: 'text-orange-400',
      bgClass: 'bg-orange-400/10',
    },
    desqualificado: {
      label: 'Desqualif.',
      dotClass: 'bg-red-400',
      textClass: 'text-red-400',
      bgClass: 'bg-red-400/10',
    },
  };
  return configs[potencial] ?? configs.desqualificado;
};

export const GHL_KEYS = new Set([
  'ghl_separator', 'ghl_leads', 'ghl_em_contato',
  'ghl_agendou', 'ghl_compareceu', 'ghl_won',
]);
