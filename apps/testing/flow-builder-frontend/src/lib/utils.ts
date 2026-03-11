import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const NODE_COLORS = {
  mode: '#3B82F6',
  etapa: '#10B981',
  mensagem: '#8B5CF6',
  script: '#F59E0B',
  decisao: '#EAB308',
  simulacao: '#EC4899',
} as const;

export const NODE_ICONS = {
  mode: '🎯',
  etapa: '📝',
  mensagem: '💬',
  script: '🎬',
  decisao: '🔀',
  simulacao: '🧪',
} as const;

export const NODE_LABELS = {
  mode: 'Mode',
  etapa: 'Etapa',
  mensagem: 'Mensagem',
  script: 'Script',
  decisao: 'Decisão',
  simulacao: 'Simulação',
} as const;
