// =============================================
// PROJETOS — Types
// =============================================

export const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#6B7280' },
  { id: 'todo', label: 'A Fazer', color: '#F59E0B' },
  { id: 'doing', label: 'Em Progresso', color: '#3B82F6' },
  { id: 'review', label: 'Revisao', color: '#8B5CF6' },
  { id: 'done', label: 'Concluido', color: '#22C55E' },
] as const;

export type TaskStatus = (typeof KANBAN_COLUMNS)[number]['id'];
export type Priority = 'p1' | 'p2' | 'p3' | 'p4';
export type BusinessSector =
  | 'automations'
  | 'marketing'
  | 'commercial'
  | 'products'
  | 'operations'
  | 'customer_success'
  | 'strategic'
  | 'ai';

export interface ProjectTask {
  id: string;
  project_key: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  status: TaskStatus;
  priority: Priority | null;
  business_sector: BusinessSector | null;
  assigned_to: string | null;
  due_date: string | null;
  time_spent_minutes: number;
  tags: string[];
  external_url: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: ProjectTask[];
}

export interface Project {
  key: string;
  name: string;
  emoji: string;
  color: string;
}

export const PROJECTS: Project[] = [
  { key: 'ai-factory', name: 'AI Factory', emoji: '🏭', color: '#3B82F6' },
  { key: 'socialfy', name: 'Socialfy CRM', emoji: '📱', color: '#22C55E' },
  { key: 'assembly-line', name: 'Assembly Line', emoji: '⚙️', color: '#8B5CF6' },
  { key: 'motive-squad', name: 'MOTIVE SQUAD', emoji: '🤖', color: '#F59E0B' },
  { key: 'agenticOS', name: 'AgenticOS', emoji: '🧠', color: '#EC4899' },
  { key: 'cold-caller', name: 'Cold Caller', emoji: '📞', color: '#EF4444' },
  { key: 'donna-wendy', name: 'Donna Wendy', emoji: '👩‍💼', color: '#F97316' },
  { key: 'mottivme-geral', name: 'MOTTIVME Geral', emoji: '📊', color: '#6B7280' },
];

export const PRIORITY_COLORS: Record<string, string> = {
  p1: '#EF4444',
  p2: '#F59E0B',
  p3: '#3B82F6',
  p4: '#6B7280',
};

export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'P1 - Critica',
  p2: 'P2 - Alta',
  p3: 'P3 - Media',
  p4: 'P4 - Baixa',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  doing: 'Em Progresso',
  review: 'Revisao',
  done: 'Concluido',
};
