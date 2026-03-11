export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

export const formatDayLabel = (v: string) => {
  const d = new Date(v + 'T12:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export const formatPct = (value: number, decimals = 2) =>
  `${value.toFixed(decimals)}%`;

export const calcConnectRate = (conversas: number, clicks: number): number =>
  clicks > 0 ? (conversas / clicks) * 100 : 0;

export const calcDelta = (current: number, previous: number): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

export const formatDelta = (delta: number | null): string => {
  if (delta === null) return '-';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
};

export const deltaDirection = (delta: number | null, invertColor = false): 'up' | 'down' | 'neutral' => {
  if (delta === null || delta === 0) return 'neutral';
  const isUp = delta > 0;
  if (invertColor) return isUp ? 'down' : 'up';
  return isUp ? 'up' : 'down';
};
