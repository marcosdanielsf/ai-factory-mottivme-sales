import { PhoneListItem } from '../../hooks/useColdCallCampaigns';
import { DAY_LABELS } from './constants';

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatScheduleDays(days: string[]): string {
  if (!days?.length) return '—';
  return days.map((d) => DAY_LABELS[d] || d).join('-');
}

export function getProgressColor(pct: number): string {
  if (pct >= 70) return 'bg-accent-success';
  if (pct >= 40) return 'bg-accent-warning';
  return 'bg-accent-error';
}

export function parsePhoneList(text: string): PhoneListItem[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const items: PhoneListItem[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts[0]) {
      items.push({
        phone: parts[0],
        name: parts[1] || '',
        context: parts[2] || undefined,
      });
    }
  }

  return items;
}

export function parseCSV(text: string): PhoneListItem[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return parsePhoneList(text);

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('phone') || header.includes('telefone') || header.includes('nome');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  return parsePhoneList(dataLines.join('\n'));
}
