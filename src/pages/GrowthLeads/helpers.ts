export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('pt-BR').format(value);

export const formatPct = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

export interface CountryConfig {
  label: string;
  flag: string;
  color: string;
}

export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  BR: { label: 'Brasil', flag: '🇧🇷', color: '#22c55e' },
  MX: { label: 'México', flag: '🇲🇽', color: '#ef4444' },
  CO: { label: 'Colômbia', flag: '🇨🇴', color: '#f59e0b' },
  AR: { label: 'Argentina', flag: '🇦🇷', color: '#3b82f6' },
  CL: { label: 'Chile', flag: '🇨🇱', color: '#8b5cf6' },
  PE: { label: 'Peru', flag: '🇵🇪', color: '#ec4899' },
  VE: { label: 'Venezuela', flag: '🇻🇪', color: '#14b8a6' },
  ES: { label: 'Espanha', flag: '🇪🇸', color: '#f97316' },
  EC: { label: 'Equador', flag: '🇪🇨', color: '#06b6d4' },
  UY: { label: 'Uruguai', flag: '🇺🇾', color: '#6366f1' },
  PY: { label: 'Paraguai', flag: '🇵🇾', color: '#84cc16' },
  BO: { label: 'Bolívia', flag: '🇧🇴', color: '#a855f7' },
  CR: { label: 'Costa Rica', flag: '🇨🇷', color: '#0ea5e9' },
  PA: { label: 'Panamá', flag: '🇵🇦', color: '#d946ef' },
  DO: { label: 'Rep. Dominicana', flag: '🇩🇴', color: '#f43f5e' },
  US: { label: 'EUA', flag: '🇺🇸', color: '#2563eb' },
};

export const getCountryLabel = (code: string): string =>
  COUNTRY_CONFIG[code]?.label ?? code;

export const getCountryFlag = (code: string): string =>
  COUNTRY_CONFIG[code]?.flag ?? '🌐';

export const getCountryColor = (code: string): string =>
  COUNTRY_CONFIG[code]?.color ?? '#6b7280';
