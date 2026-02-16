import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Edit,
  Copy,
  Archive,
  Eye,
  Instagram,
  Linkedin,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  Check,
  X,
} from 'lucide-react';
import { useProspectorTemplates, DMTemplate, ProspectorChannel } from '../hooks/useProspector';

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'instagram':
      return <Instagram size={16} className="text-[#e1306c]" />;
    case 'linkedin':
      return <Linkedin size={16} className="text-[#0077b5]" />;
    case 'whatsapp':
      return <MessageCircle size={16} className="text-[#25d366]" />;
    default:
      return <MessageSquare size={16} />;
  }
};

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    warm_up: 'Warm-up',
    first_contact: 'Primeiro Contato',
    follow_up: 'Follow-up',
    breakup: 'Breakup',
  };
  return labels[stage] || stage;
};

const getVerticalColor = (vertical: string) => {
  switch (vertical) {
    case 'clinicas':
      return 'text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/20';
    case 'coaches':
      return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
    case 'infoprodutores':
      return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

// Exemplo de lead para preview
const MOCK_LEAD = {
  nome: 'Dr. João Silva',
  nicho: 'estética',
  cidade: 'São Paulo',
  bio_highlight: '3 clínicas premium em SP',
  post_recente: 'harmonização facial',
  seguidores: '15.2k',
  resultado_case: 'Dr. Maria Costa aumentou agendamentos em 40%',
};

const renderPreview = (template: string, lead = MOCK_LEAD) => {
  let preview = template;
  Object.entries(lead).forEach(([key, value]) => {
    preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return preview;
};

const highlightVariables = (text: string) => {
  return text.split(/(\{[^}]+\})/).map((part, i) => {
    if (part.match(/\{[^}]+\}/)) {
      return (
        <span key={i} className="text-[#58a6ff] bg-[#58a6ff]/10 px-1 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
};

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface TemplateCardProps {
  template: DMTemplate;
  onEdit: (template: DMTemplate) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onPreview: (template: DMTemplate) => void;
}

const TemplateCard = ({ template, onEdit, onDuplicate, onArchive, onPreview }: TemplateCardProps) => {
  const replyRateColor = template.reply_rate >= 20 ? 'text-[#3fb950]' : template.reply_rate >= 10 ? 'text-[#d29922]' : 'text-[#f85149]';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-white">{template.name}</h3>
            {!template.is_active && (
              <span className="text-[10px] text-[#f85149] bg-[#f85149]/10 px-2 py-0.5 rounded-full border border-[#f85149]/20">
                Arquivado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getVerticalColor(template.vertical)}`}>
              {template.vertical}
            </span>
            <span className="text-[10px] text-[#8b949e]">
              {getStageLabel(template.stage)}
            </span>
            {template.variant && (
              <span className="text-[10px] text-[#8b949e] bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                Variante {template.variant}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="p-1.5 rounded bg-[#0d1117] border border-[#30363d]">
            {getChannelIcon(template.channel)}
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className="mb-3 p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs text-[#8b949e] line-clamp-3">
        {highlightVariables(template.content)}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[#30363d]">
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Enviadas</p>
          <p className="text-sm font-semibold text-white">{template.times_sent}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Respostas</p>
          <p className="text-sm font-semibold text-white">{template.times_replied}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Reply Rate</p>
          <p className={`text-sm font-semibold ${replyRateColor} flex items-center gap-1`}>
            {template.reply_rate}%
            {template.reply_rate >= 15 && <TrendingUp size={12} />}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(template)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors"
        >
          <Eye size={12} />
          Preview
        </button>
        <button
          onClick={() => onEdit(template)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors"
        >
          <Edit size={12} />
        </button>
        <button
          onClick={() => onDuplicate(template.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={() => onArchive(template.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#f85149]/10 border border-[#30363d] hover:border-[#f85149]/40 text-[#8b949e] hover:text-[#f85149] rounded text-xs font-medium transition-colors"
        >
          <Archive size={12} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════

interface PreviewModalProps {
  template: DMTemplate | null;
  onClose: () => void;
}

const PreviewModal = ({ template, onClose }: PreviewModalProps) => {
  if (!template) return null;

  const preview = renderPreview(template.content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
            <p className="text-xs text-[#8b949e] mt-1">Preview com dados de exemplo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template original */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#58a6ff]" />
              Template Original
            </h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 text-sm text-[#8b949e]">
              {highlightVariables(template.content)}
            </div>
          </div>

          {/* Preview renderizado */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Eye size={16} className="text-[#3fb950]" />
              Preview Renderizado
            </h4>
            <div className="bg-[#0d1117] border border-[#3fb950]/30 rounded-lg p-4 text-sm text-white whitespace-pre-wrap">
              {preview}
            </div>
          </div>

          {/* Variáveis usadas */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Variáveis Usadas</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MOCK_LEAD).map((key) => {
                if (template.content.includes(`{${key}}`)) {
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#58a6ff]/10 border border-[#58a6ff]/20 text-[#58a6ff] rounded text-xs"
                    >
                      <Check size={12} />
                      {key}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#0d1117] border border-[#30363d] rounded-lg">
            <div>
              <p className="text-xs text-[#8b949e] mb-1">Enviadas</p>
              <p className="text-lg font-semibold text-white">{template.times_sent}</p>
            </div>
            <div>
              <p className="text-xs text-[#8b949e] mb-1">Respostas</p>
              <p className="text-lg font-semibold text-[#3fb950]">{template.times_replied}</p>
            </div>
            <div>
              <p className="text-xs text-[#8b949e] mb-1">Reply Rate</p>
              <p className="text-lg font-semibold text-[#a371f7]">{template.reply_rate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ProspectorTemplates = () => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<ProspectorChannel | 'all'>('all');
  const { templates, loading, deleteTemplate } = useProspectorTemplates(
    activeChannel === 'all' ? undefined : activeChannel
  );

  const [previewTemplate, setPreviewTemplate] = useState<DMTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DMTemplate | null>(null);

  const channels: Array<{ value: ProspectorChannel | 'all'; label: string; icon: React.ReactNode }> = [
    { value: 'all', label: 'Todos', icon: <FileText size={16} /> },
    { value: 'instagram', label: 'Instagram', icon: <Instagram size={16} className="text-[#e1306c]" /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} className="text-[#0077b5]" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} className="text-[#25d366]" /> },
  ];

  const filteredTemplates = useMemo(() => {
    if (activeChannel === 'all') return templates;
    return templates.filter(t => t.channel === activeChannel);
  }, [templates, activeChannel]);

  const handleEdit = (template: DMTemplate) => {
    setEditingTemplate(template);
    // TODO: Abrir modal de edição
    console.log('Editing template:', template);
  };

  const handleDuplicate = (id: string) => {
    console.log('Duplicating template:', id);
    // TODO: Implementar duplicação
  };

  const handleArchive = async (id: string) => {
    if (confirm('Tem certeza que deseja arquivar este template?')) {
      await deleteTemplate(id);
    }
  };

  const handlePreview = (template: DMTemplate) => {
    setPreviewTemplate(template);
  };

  // Variáveis disponíveis
  const availableVariables = [
    { key: 'nome', desc: 'Nome do lead' },
    { key: 'nicho', desc: 'Nicho de atuação' },
    { key: 'cidade', desc: 'Cidade do lead' },
    { key: 'bio_highlight', desc: 'Destaque da bio' },
    { key: 'post_recente', desc: 'Tema do post recente' },
    { key: 'seguidores', desc: 'Número de seguidores' },
    { key: 'resultado_case', desc: 'Case de sucesso' },
  ];

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/prospector')}
              className="text-xs text-[#58a6ff] hover:underline mb-2"
            >
              ← Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <FileText size={26} className="text-[#58a6ff]" />
              Templates de DM
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Gerencie suas mensagens de prospecção
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Novo Template
          </button>
        </div>

        {/* Channel tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {channels.map((channel) => (
            <button
              key={channel.value}
              onClick={() => setActiveChannel(channel.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeChannel === channel.value
                  ? 'bg-[#58a6ff] text-white'
                  : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#58a6ff]/40'
              }`}
            >
              {channel.icon}
              {channel.label}
            </button>
          ))}
        </div>

        {/* Variables helper */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Variáveis Disponíveis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {availableVariables.map((variable) => (
              <button
                key={variable.key}
                className="flex flex-col items-start p-2 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 rounded text-left transition-colors group"
                title={`Clique para copiar {${variable.key}}`}
                onClick={() => {
                  navigator.clipboard.writeText(`{${variable.key}}`);
                }}
              >
                <span className="text-xs font-mono text-[#58a6ff] group-hover:text-[#58a6ff]">
                  {`{${variable.key}}`}
                </span>
                <span className="text-[10px] text-[#8b949e] mt-0.5">{variable.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#0d1117] rounded w-3/4 mb-3" />
                <div className="h-3 bg-[#0d1117] rounded w-1/2 mb-4" />
                <div className="h-20 bg-[#0d1117] rounded mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="h-8 bg-[#0d1117] rounded" />
                  <div className="h-8 bg-[#0d1117] rounded" />
                  <div className="h-8 bg-[#0d1117] rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-[#0d1117] rounded" />
                  <div className="h-8 w-16 bg-[#0d1117] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-[#58a6ff]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum template encontrado</h3>
            <p className="text-sm text-[#8b949e] mb-4">
              Crie seu primeiro template para começar a prospectar
            </p>
            <button className="px-6 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors">
              Criar Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
    </div>
  );
};

export default ProspectorTemplates;
