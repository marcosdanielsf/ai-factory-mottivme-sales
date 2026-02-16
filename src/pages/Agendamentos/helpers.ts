// Rate health helpers
export const getConversaoHealth = (rate: number): { color: string; label: string; bgClass: string } => {
  if (rate >= 35) return { color: 'text-emerald-400', label: 'Ideal', bgClass: 'bg-emerald-500/10' };
  if (rate >= 30) return { color: 'text-green-400', label: 'Bom', bgClass: 'bg-green-500/10' };
  if (rate >= 25) return { color: 'text-yellow-400', label: 'Mínimo', bgClass: 'bg-yellow-500/10' };
  if (rate >= 20) return { color: 'text-orange-400', label: 'Baixo', bgClass: 'bg-orange-500/10' };
  return { color: 'text-red-400', label: 'Crítico', bgClass: 'bg-red-500/10' };
};

export const getComparecimentoHealth = (rate: number): { color: string; label: string; bgClass: string } => {
  if (rate >= 70) return { color: 'text-emerald-400', label: 'Excelente', bgClass: 'bg-emerald-500/10' };
  if (rate >= 50) return { color: 'text-green-400', label: 'OK', bgClass: 'bg-green-500/10' };
  return { color: 'text-red-400', label: 'Crítico', bgClass: 'bg-red-500/10' };
};

export const getNoShowHealth = (rate: number): { color: string; label: string; bgClass: string } => {
  if (rate <= 20) return { color: 'text-emerald-400', label: 'Bom', bgClass: 'bg-emerald-500/10' };
  if (rate <= 30) return { color: 'text-yellow-400', label: 'Atenção', bgClass: 'bg-yellow-500/10' };
  return { color: 'text-red-400', label: 'Crítico', bgClass: 'bg-red-500/10' };
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPhone = (phone: string | null): string => {
  if (!phone) return 'Sem telefone';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

export const formatDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
