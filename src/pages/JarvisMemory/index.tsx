import React, { useState, useMemo } from 'react';
import { Brain, Trash2, Edit2, Check, X, Search, Filter } from 'lucide-react';
import { useJarvisMemory } from '../../hooks/useJarvisMemory';
import type { JarvisMemoryItem } from '../../types/jarvis';

const TYPE_COLORS: Record<JarvisMemoryItem['type'], string> = {
  task: 'bg-red-500/20 text-red-400 border-red-500/30',
  preference: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  decision: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fact: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const TYPE_LABELS: Record<JarvisMemoryItem['type'], string> = {
  task: 'Task',
  preference: 'Preferência',
  decision: 'Decisão',
  update: 'Update',
  fact: 'Fato',
};

const ALL_TYPES: JarvisMemoryItem['type'][] = ['task', 'preference', 'decision', 'update', 'fact'];

function MemoryCard({
  memory,
  onDelete,
  onUpdate,
}: {
  memory: JarvisMemoryItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(memory.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (editValue.trim()) {
      onUpdate(memory.id, editValue.trim());
      setEditing(false);
    }
  }

  function handleCancel() {
    setEditValue(memory.content);
    setEditing(false);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[memory.type]}`}>
          {TYPE_LABELS[memory.type]}
        </span>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Edit2 size={13} />
            </button>
          )}
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(memory.id)}
                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs hover:bg-cyan-500/30 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-300 leading-relaxed">{memory.content}</p>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-600 mt-1">
        <div className="flex items-center gap-2">
          <span>{memory.project_slug ?? 'geral'}</span>
          {memory.source === 'auto_extract' && (
            <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-500/60 rounded text-[10px]">auto</span>
          )}
        </div>
        <span>{new Date(memory.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
}

export default function JarvisMemory() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<JarvisMemoryItem['type'] | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<JarvisMemoryItem['type']>('fact');

  const { memories, loading, error, setFilters, createMemory, deleteMemory, updateMemory } = useJarvisMemory();

  function handleTypeFilter(type: JarvisMemoryItem['type'] | undefined) {
    setActiveType(type);
    setFilters({ type, search: search || undefined });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setFilters({ type: activeType, search: value || undefined });
  }

  async function handleCreate() {
    if (!newContent.trim()) return;
    await createMemory(newType, newContent.trim());
    setNewContent('');
    setShowCreateForm(false);
  }

  const { typeCounts, autoCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let auto = 0;
    for (const m of memories) {
      counts[m.type] = (counts[m.type] ?? 0) + 1;
      if (m.source === 'auto_extract') auto++;
    }
    return { typeCounts: counts, autoCount: auto };
  }, [memories]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <Brain size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Memória JARVIS</h1>
            <p className="text-sm text-zinc-500">
              {memories.length} registros
              {autoCount > 0 && (
                <span className="text-cyan-500/50 ml-1">({autoCount} auto)</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-colors"
        >
          + Nova memória
        </button>
      </div>

      {/* Stats por tipo */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {ALL_TYPES.map(type => (
          <button
            key={type}
            onClick={() => handleTypeFilter(activeType === type ? undefined : type)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              activeType === type
                ? TYPE_COLORS[type]
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="text-lg font-bold">{typeCounts[type]}</div>
            <div className="text-xs mt-0.5">{TYPE_LABELS[type]}</div>
          </button>
        ))}
      </div>

      {/* Criar memória */}
      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Nova memória</h3>
          <div className="flex gap-3 mb-3">
            {ALL_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                  newType === t ? TYPE_COLORS[t] : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Conteúdo da memória..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50 mb-3"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-sm hover:bg-cyan-500/30 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar memórias..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
        />
        {activeType && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-zinc-400">
            <Filter size={12} />
            <span>{TYPE_LABELS[activeType]}</span>
            <button onClick={() => handleTypeFilter(undefined)} className="hover:text-white">
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Grid de memórias */}
      {loading ? (
        <div className="text-center text-zinc-600 py-12">Carregando memórias...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">{error}</div>
      ) : memories.length === 0 ? (
        <div className="text-center text-zinc-600 py-12">
          <Brain size={32} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma memória encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map(memory => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onDelete={deleteMemory}
              onUpdate={updateMemory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
