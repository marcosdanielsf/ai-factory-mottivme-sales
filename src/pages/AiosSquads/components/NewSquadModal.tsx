import { useState } from 'react';
import { X } from 'lucide-react';
import { AiosSquadStrategy, aiosSquadStrategyConfig } from '../../../types/aios';

interface NewSquadModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; strategy: AiosSquadStrategy }) => Promise<void>;
}

export function NewSquadModal({ onClose, onSubmit }: NewSquadModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strategy, setStrategy] = useState<AiosSquadStrategy>('collaborative');
  const [loading, setLoading] = useState(false);

  const selectedStrategyConfig = aiosSquadStrategyConfig[strategy];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), strategy });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-secondary rounded-xl p-6 w-full max-w-md border border-border-default shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">Novo Squad</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Squad de Prospecção"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo deste squad..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary placeholder:text-text-muted resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Estratégia
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as AiosSquadStrategy)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            >
              {(Object.keys(aiosSquadStrategyConfig) as AiosSquadStrategy[]).map((key) => (
                <option key={key} value={key}>
                  {aiosSquadStrategyConfig[key].label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">{selectedStrategyConfig.description}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-border-default rounded-lg text-sm text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
