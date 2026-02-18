import { useState, useEffect } from 'react';
import { X, Save, Trash2, CheckCircle2, ExternalLink } from 'lucide-react';
import type { ProjectTask, TaskStatus } from './types';
import {
  KANBAN_COLUMNS,
  PROJECTS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from './types';
import { supabase } from '../../lib/supabase';

// =============================================
// CreateTaskModal
// =============================================

export function CreateTaskModal({
  onClose,
  onTaskCreated,
}: {
  onClose: () => void;
  onTaskCreated: (task: ProjectTask) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog' as TaskStatus,
    priority: 'p3',
    project_key: 'mottivme-geral',
    due_date: '',
    assigned_to: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        project_key: formData.project_key,
      };
      if (formData.description) payload.description = formData.description;
      if (formData.due_date) payload.due_date = formData.due_date;
      if (formData.assigned_to) payload.assigned_to = formData.assigned_to;

      const { data, error } = await supabase
        .from('mottivme_tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      onTaskCreated(data as ProjectTask);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border-default rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-2xl font-bold text-text-primary">Nova Tarefa</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Titulo <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              placeholder="Ex: Implementar dashboard de analytics"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descricao
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 resize-none"
              rows={3}
              placeholder="Detalhes adicionais sobre a tarefa..."
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/50"
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/50"
              >
                <option value="p1">P1 - Critica</option>
                <option value="p2">P2 - Alta</option>
                <option value="p3">P3 - Media</option>
                <option value="p4">P4 - Baixa</option>
              </select>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Projeto
            </label>
            <select
              value={formData.project_key}
              onChange={(e) => setFormData({ ...formData, project_key: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/50"
            >
              {PROJECTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date + Assigned To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Responsavel
              </label>
              <input
                type="text"
                value={formData.assigned_to}
                onChange={(e) =>
                  setFormData({ ...formData, assigned_to: e.target.value })
                }
                className="w-full px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
                placeholder="Nome do responsavel"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-border-default text-text-primary rounded-lg font-medium hover:bg-bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================
// TaskDetailModal
// =============================================

export function TaskDetailModal({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: {
  taskId: string;
  onClose: () => void;
  onTaskUpdated: (task: ProjectTask) => void;
  onTaskDeleted: (id: string) => void;
}) {
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '' as TaskStatus,
    priority: '',
    notes: '',
    project_key: '',
    assigned_to: '',
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('mottivme_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }
      const t = data as ProjectTask;
      setTask(t);
      setEditData({
        title: t.title || '',
        description: t.description || '',
        status: t.status || 'backlog',
        priority: t.priority || 'p3',
        notes: t.notes || '',
        project_key: t.project_key || 'mottivme-geral',
        assigned_to: t.assigned_to || '',
      });
      setLoading(false);
    })();
  }, [taskId]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (editData.title !== task.title) payload.title = editData.title;
      if (editData.description !== (task.description || ''))
        payload.description = editData.description || null;
      if (editData.status !== task.status) payload.status = editData.status;
      if (editData.priority !== (task.priority || ''))
        payload.priority = editData.priority;
      if (editData.notes !== (task.notes || ''))
        payload.notes = editData.notes || null;
      if (editData.project_key !== task.project_key)
        payload.project_key = editData.project_key;
      if (editData.assigned_to !== (task.assigned_to || ''))
        payload.assigned_to = editData.assigned_to || null;

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('mottivme_tasks')
        .update(payload)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      const updated = data as ProjectTask;
      setTask(updated);
      onTaskUpdated(updated);
      setEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('mottivme_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      onTaskDeleted(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const project = task ? PROJECTS.find((p) => p.key === task.project_key) : null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border-default rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !task ? (
          <div className="p-12 text-center text-text-muted">
            Tarefa nao encontrada
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border-default">
              <div className="flex-1 min-w-0 pr-4">
                {editing ? (
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                    className="w-full text-xl font-bold bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-primary/50"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-text-primary">
                    {task.title}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {task.priority && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${PRIORITY_COLORS[task.priority] || '#6B7280'}20`,
                        color: PRIORITY_COLORS[task.priority] || '#6B7280',
                      }}
                    >
                      {PRIORITY_LABELS[task.priority] || task.priority.toUpperCase()}
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded"
                    style={{
                      backgroundColor: `${KANBAN_COLUMNS.find((c) => c.id === task.status)?.color || '#6B7280'}20`,
                      color:
                        KANBAN_COLUMNS.find((c) => c.id === task.status)?.color ||
                        '#6B7280',
                    }}
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                  {project && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${project.color}20`,
                        color: project.color,
                      }}
                    >
                      {project.emoji} {project.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 text-sm border border-border-default text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Edit fields */}
              {editing && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
                    >
                      {KANBAN_COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Prioridade
                    </label>
                    <select
                      value={editData.priority}
                      onChange={(e) =>
                        setEditData({ ...editData, priority: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
                    >
                      <option value="p1">P1 - Critica</option>
                      <option value="p2">P2 - Alta</option>
                      <option value="p3">P3 - Media</option>
                      <option value="p4">P4 - Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Projeto
                    </label>
                    <select
                      value={editData.project_key}
                      onChange={(e) =>
                        setEditData({ ...editData, project_key: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50"
                    >
                      {PROJECTS.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.emoji} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Descricao
                </h3>
                {editing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 resize-none"
                    rows={4}
                    placeholder="Adicionar descricao..."
                  />
                ) : (
                  <p className="text-sm text-text-primary/80 whitespace-pre-wrap">
                    {task.description || (
                      <span className="text-text-muted italic">Sem descricao</span>
                    )}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
                  Notas
                </h3>
                {editing ? (
                  <textarea
                    value={editData.notes}
                    onChange={(e) =>
                      setEditData({ ...editData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 resize-none"
                    rows={3}
                    placeholder="Adicionar notas..."
                  />
                ) : (
                  <p className="text-sm text-text-primary/80 whitespace-pre-wrap">
                    {task.notes || (
                      <span className="text-text-muted italic">Sem notas</span>
                    )}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {task.assigned_to && (
                  <DetailField label="Responsavel" value={task.assigned_to} />
                )}
                {task.due_date && (
                  <DetailField
                    label="Vencimento"
                    value={new Date(task.due_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  />
                )}
                {task.business_sector && (
                  <DetailField
                    label="Setor"
                    value={task.business_sector.replace(/_/g, ' ')}
                  />
                )}
                {task.created_at && (
                  <DetailField
                    label="Criada em"
                    value={new Date(task.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                    Subtarefas ({task.subtasks.length})
                  </h3>
                  <div className="space-y-2">
                    {task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 p-2.5 bg-bg-tertiary border border-border-default rounded-lg"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 flex-shrink-0 ${
                            sub.status === 'done'
                              ? 'text-accent-success'
                              : 'text-text-muted/40'
                          }`}
                        />
                        <span
                          className={`text-sm flex-1 ${
                            sub.status === 'done'
                              ? 'text-text-muted line-through'
                              : 'text-text-primary'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External URL */}
              {task.external_url && (
                <a
                  href={task.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Link externo
                </a>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border-default">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm text-accent-error border border-accent-error/20 rounded-lg hover:bg-accent-error/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm border border-border-default text-text-primary rounded-lg hover:bg-bg-hover transition-colors"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================
// DetailField
// =============================================

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 bg-bg-tertiary border border-border-default rounded-lg">
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}
