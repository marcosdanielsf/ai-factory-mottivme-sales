export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const formatDateShort = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
