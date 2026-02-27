import React, { useState } from 'react';
import {
  DollarSign, Briefcase, Clock, Users, Stethoscope, HelpCircle,
  Plus, Check, X, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { useKnowledgeBase, type KBCategory } from '../../../hooks/useKnowledgeBase';
import { useToast } from '../../../hooks/useToast';

interface Props {
  locationId: string;
}

const CATEGORY_META: Record<KBCategory, { icon: React.ElementType; label: string }> = {
  precos: { icon: DollarSign, label: 'Precos e Pagamento' },
  servicos: { icon: Briefcase, label: 'Servicos Oferecidos' },
  horarios: { icon: Clock, label: 'Horarios de Atendimento' },
  equipe: { icon: Users, label: 'Equipe' },
  procedimentos: { icon: Stethoscope, label: 'Procedimentos' },
  faq: { icon: HelpCircle, label: 'Perguntas Frequentes' },
};

export const BrandKnowledgeBase: React.FC<Props> = ({ locationId }) => {
  const { grouped, loading, createItem, updateItem, toggleActive } = useKnowledgeBase(locationId);
  const { showToast } = useToast();

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add modal state
  const [addCategory, setAddCategory] = useState<KBCategory | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    setSaving(true);
    const ok = await updateItem(id, editValue.trim());
    setSaving(false);
    if (ok) {
      showToast('Valor atualizado', 'success');
      cancelEdit();
    } else {
      showToast('Erro ao atualizar', 'error');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const ok = await toggleActive(id, !current);
    if (ok) {
      showToast(!current ? 'Item ativado' : 'Item desativado', 'success');
    } else {
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleAdd = async () => {
    if (!addCategory || !newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    const ok = await createItem(addCategory, newKey.trim(), newValue.trim());
    setSaving(false);
    if (ok) {
      showToast('Item adicionado', 'success');
      setAddCategory(null);
      setNewKey('');
      setNewValue('');
    } else {
      showToast('Erro ao adicionar (chave duplicada?)', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Dados do seu negocio usados pelo agente IA nas conversas. Edite para manter sempre atualizado.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grouped.map(({ category, items }) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;

          return (
            <div
              key={category}
              className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-accent-primary" />
                  <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
                  <span className="text-xs text-text-muted">({items.length})</span>
                </div>
                <button
                  onClick={() => {
                    setAddCategory(category);
                    setNewKey('');
                    setNewValue('');
                  }}
                  className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-accent-primary transition-colors"
                  title="Adicionar item"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-border-default">
                {items.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-text-muted">
                    Nenhum dado nesta categoria
                  </div>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`px-4 py-2.5 flex items-start gap-2 group ${
                      !item.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggle(item.id, item.is_active)}
                      className="mt-0.5 flex-shrink-0 text-text-muted hover:text-accent-primary transition-colors"
                      title={item.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Key */}
                    <span className="text-xs font-medium text-text-secondary min-w-[120px] flex-shrink-0 mt-0.5">
                      {item.key}
                    </span>

                    {/* Value (editable) */}
                    {editingId === item.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="flex-1 text-xs bg-bg-tertiary border border-accent-primary/50 rounded px-2 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                        <button
                          onClick={() => saveEdit(item.id)}
                          disabled={saving}
                          className="p-1 text-accent-success hover:bg-bg-tertiary rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-accent-error hover:bg-bg-tertiary rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(item.id, item.value)}
                        className="flex-1 text-left text-xs text-text-primary cursor-pointer hover:bg-bg-tertiary rounded px-1 py-0.5 -mx-1 transition-colors"
                        title="Clique para editar"
                      >
                        {item.value}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {addCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="kb-add-title">
          <div className="bg-bg-secondary border border-border-default rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 id="kb-add-title" className="text-sm font-semibold text-text-primary">
              Adicionar em {CATEGORY_META[addCategory].label}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Chave (ex: consulta_valor)</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="nome_do_campo"
                  className="w-full text-sm bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Valor</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Ex: R$ 350,00"
                  rows={3}
                  className="w-full text-sm bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddCategory(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newKey.trim() || !newValue.trim()}
                className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
