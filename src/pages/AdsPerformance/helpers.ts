export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

export const formatDayLabel = (v: string) => {
  const d = new Date(v + 'T12:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
};
