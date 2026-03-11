import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, FolderKanban, FileText, MessageSquare, Brain } from 'lucide-react';
import { useJarvisProjects } from '../../hooks/useJarvisProjects';
import { useJarvisMemory } from '../../hooks/useJarvisMemory';
import { useJarvisConversations } from '../../hooks/useJarvisConversations';
import type { JarvisProject } from '../../types/jarvis';

type Tab = 'geral' | 'claude_md' | 'conversas' | 'memorias';

const ALL_TYPES: JarvisProject['type'][] = ['coding', 'business', 'content', 'financial', 'personal', 'general'];
const TYPE_LABELS: Record<JarvisProject['type'], string> = {
  coding: 'Código',
  business: 'Negócio',
  content: 'Conteúdo',
  financial: 'Financeiro',
  personal: 'Pessoal',
  general: 'Geral',
};

export default function JarvisProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { projects, loading, updateProject, deleteProject } = useJarvisProjects();
  const { memories } = useJarvisMemory({ project_slug: slug });
  const { conversations } = useJarvisConversations();

  const project = projects.find(p => p.slug === slug) ?? null;

  const [tab, setTab] = useState<Tab>('geral');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<JarvisProject['type']>('general');
  const [path, setPath] = useState('');
  const [keywords, setKeywords] = useState('');
  const [modelOverride, setModelOverride] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [claudeMd, setClaudeMd] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setType(project.type);
      setPath(project.path ?? '');
      setKeywords((project.keywords ?? []).join(', '));
      setModelOverride(project.model_override ?? '');
      setIsActive(project.is_active);
      setClaudeMd(project.claude_md ?? '');
    }
  }, [project]);

  async function handleSaveGeral() {
    if (!project) return;
    setSaving(true);
    await updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || null,
      type,
      path: path.trim() || null,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      model_override: modelOverride.trim() || null,
      is_active: isActive,
    });
    setSaving(false);
  }

  async function handleSaveClaudeMd() {
    if (!project) return;
    setSaving(true);
    await updateProject(project.id, { claude_md: claudeMd || null });
    setSaving(false);
  }

  async function handleDelete() {
    if (!project) return;
    await deleteProject(project.id);
    navigate('/jarvis/projects');
  }

  const projectConversations = conversations.filter(c => c.project_slug === slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-600 flex items-center justify-center">
        Carregando projeto...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-600 flex flex-col items-center justify-center gap-4">
        <p>Projeto não encontrado</p>
        <button onClick={() => navigate('/jarvis/projects')} className="text-cyan-400 hover:underline text-sm">
          Voltar para projetos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jarvis/projects')}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <FolderKanban size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{project.name}</h1>
            <p className="text-sm text-zinc-500">{project.slug}</p>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Confirmar exclusão?</span>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"
            >
              Sim, excluir
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded text-xs hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
            Excluir
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 mb-6 gap-1">
        {([
          { key: 'geral', label: 'Geral', icon: <FolderKanban size={13} /> },
          { key: 'claude_md', label: 'CLAUDE.md', icon: <FileText size={13} /> },
          { key: 'conversas', label: `Conversas (${projectConversations.length})`, icon: <MessageSquare size={13} /> },
          { key: 'memorias', label: `Memórias (${memories.length})`, icon: <Brain size={13} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Geral */}
      {tab === 'geral' && (
        <div className="max-w-2xl flex flex-col gap-5">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    type === t
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Path</label>
            <input
              value={path}
              onChange={e => setPath(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              placeholder="~/Projects/mottivme/..."
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Keywords (vírgula)</label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              placeholder="jarvis, agente, n8n"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Modelo override</label>
            <input
              value={modelOverride}
              onChange={e => setModelOverride(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              placeholder="claude-haiku-4-5-20251001"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActive(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-cyan-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-zinc-300">{isActive ? 'Ativo' : 'Inativo'}</span>
          </div>
          <button
            onClick={handleSaveGeral}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50 self-start"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Tab: CLAUDE.md */}
      {tab === 'claude_md' && (
        <div className="flex gap-4 h-[600px]">
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-xs text-zinc-400">Editor</label>
            <textarea
              value={claudeMd}
              onChange={e => setClaudeMd(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white font-mono resize-none focus:outline-none focus:border-cyan-500/50"
              placeholder="# Projeto JARVIS&#10;&#10;Instruções específicas para este projeto..."
            />
            <button
              onClick={handleSaveClaudeMd}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50 self-start"
            >
              <Save size={14} />
              {saving ? 'Salvando...' : 'Salvar CLAUDE.md'}
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <label className="text-xs text-zinc-400">Preview</label>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 overflow-auto">
              {claudeMd ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">{claudeMd}</pre>
              ) : (
                <span className="text-zinc-600">Escreva no editor para ver o preview...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Conversas */}
      {tab === 'conversas' && (
        <div className="flex flex-col gap-3">
          {projectConversations.length === 0 ? (
            <div className="text-center text-zinc-600 py-12">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma conversa neste projeto</p>
            </div>
          ) : (
            projectConversations.map(conv => (
              <div key={conv.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-300">{conv.title ?? '(sem título)'}</p>
                  <span className="text-xs text-zinc-600">
                    {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Memórias */}
      {tab === 'memorias' && (
        <div className="flex flex-col gap-3">
          {memories.length === 0 ? (
            <div className="text-center text-zinc-600 py-12">
              <Brain size={32} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma memória neste projeto</p>
            </div>
          ) : (
            memories.map(mem => (
              <div key={mem.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-zinc-300">{mem.content}</p>
                  <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded shrink-0">{mem.type}</span>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  {new Date(mem.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
