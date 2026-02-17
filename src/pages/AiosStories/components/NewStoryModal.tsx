import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface CreateStoryInput {
  title: string;
  description?: string;
  status?: string;
  squad_id?: string;
  priority?: string;
}

interface Squad {
  id: string;
  name: string;
}

interface NewStoryModalProps {
  squads?: Squad[];
  onClose: () => void;
  onSubmit: (input: CreateStoryInput) => Promise<unknown>;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Critica' },
];

export function NewStoryModal({ squads = [], onClose, onSubmit }: NewStoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [squadId, setSquadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        squad_id: squadId || undefined,
        status: 'pending',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar story');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md border border-border-default shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary text-base font-semibold">Nova Story</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1">
              Titulo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Implementar autenticacao OAuth"
              required
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1">
              Descricao
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta story..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary placeholder:text-text-muted resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-text-secondary text-xs font-medium mb-1">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Squad */}
          {squads.length > 0 && (
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1">
                Squad
              </label>
              <select
                value={squadId}
                onChange={(e) => setSquadId(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              >
                <option value="">Sem squad</option>
                {squads.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-default text-text-secondary rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
