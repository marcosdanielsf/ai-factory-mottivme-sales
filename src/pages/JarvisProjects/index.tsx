import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, X, Bot, Code2, FileText, DollarSign, User, Layers } from 'lucide-react';
import { useJarvisProjects } from '../../hooks/useJarvisProjects';
import type { JarvisProject } from '../../types/jarvis';

const TYPE_ICONS: Record<JarvisProject['type'], React.ReactNode> = {
  coding: <Code2 size={16} className="text-blue-400" />,
  business: <DollarSign size={16} className="text-green-400" />,
  content: <FileText size={16} className="text-purple-400" />,
  financial: <DollarSign size={16} className="text-yellow-400" />,
  personal: <User size={16} className="text-pink-400" />,
  general: <Layers size={16} className="text-zinc-400" />,
};

const TYPE_LABELS: Record<JarvisProject['type'], string> = {
  coding: 'Código',
  business: 'Negócio',
  content: 'Conteúdo',
  financial: 'Financeiro',
  personal: 'Pessoal',
  general: 'Geral',
};

const ALL_TYPES: JarvisProject['type'][] = ['coding', 'business', 'content', 'financial', 'personal', 'general'];

function ProjectCard({ project }: { project: JarvisProject }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/jarvis/projects/${project.slug}`)}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 text-left hover:border-zinc-700 transition-colors w-full"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-800 rounded">
            {TYPE_ICONS[project.type]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{project.name}</h3>
            <span className="text-xs text-zinc-500">{TYPE_LABELS[project.type]}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          project.is_active
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
        }`}>
          {project.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      {project.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.keywords.slice(0, 4).map(kw => (
            <span key={kw} className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
              {kw}
            </span>
          ))}
          {project.keywords.length > 4 && (
            <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded">
              +{project.keywords.length - 4}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: JarvisProject) => void;
}) {
  const { createProject } = useJarvisProjects();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<JarvisProject['type']>('general');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setLoading(true);
    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const project = await createProject({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      type,
      keywords: keywordList,
      permissions: { read: true, write: true, execute: false },
      claude_md: null,
      model_override: null,
      path: null,
      is_active: true,
    });
    setLoading(false);
    if (project) onCreated(project);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">Novo Projeto</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              placeholder="ex: AI Factory"
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/50"
              placeholder="ex: ai-factory"
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    type === t
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {TYPE_ICONS[t]}
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-cyan-500/50"
              rows={2}
              placeholder="Descreva o projeto..."
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Keywords (separadas por vírgula)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              placeholder="ex: jarvis, agente, n8n"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function JarvisProjects() {
  const { projects, loading, error } = useJarvisProjects();
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <FolderKanban size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Projetos JARVIS</h1>
            <p className="text-sm text-zinc-500">{projects.length} projetos</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-colors"
        >
          <Plus size={15} />
          Novo Projeto
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-zinc-600 py-12">Carregando projetos...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-12">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center text-zinc-600 py-12">
          <Bot size={32} className="mx-auto mb-3 opacity-30" />
          <p className="mb-4">Nenhum projeto configurado</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-colors"
          >
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setShowCreate(false);
            navigate(`/jarvis/projects/${p.slug}`);
          }}
        />
      )}
    </div>
  );
}
