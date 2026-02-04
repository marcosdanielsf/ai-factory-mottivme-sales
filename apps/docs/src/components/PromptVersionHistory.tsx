import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Eye,
  Clock,
  CheckCircle2,
  GitBranch,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Diff,
  Copy,
  Check,
  User,
  Bot
} from 'lucide-react';

interface PromptVersion {
  id: string;
  version_number: string;
  agent_id: string;
  agent_name: string;
  system_prompt: string;
  status: 'draft' | 'active' | 'archived' | 'reverted';
  created_at: string;
  created_by: string;
  change_summary?: string;
  change_source: 'manual' | 'reflection' | 'cs_chat' | 'rollback';
  score_at_time?: number;
  is_current: boolean;
  parent_version_id?: string;
}

interface PromptVersionHistoryProps {
  agentId: string;
  agentName: string;
  versions: PromptVersion[];
  currentVersionId: string;
  onRevert: (versionId: string) => Promise<void>;
  onPreview: (version: PromptVersion) => void;
  onCompare: (versionA: PromptVersion, versionB: PromptVersion) => void;
}

const SOURCE_CONFIG = {
  manual: { label: 'Edicao Manual', icon: User, color: 'text-blue-400' },
  reflection: { label: 'Reflection Loop', icon: Bot, color: 'text-purple-400' },
  cs_chat: { label: 'Chat CS', icon: Bot, color: 'text-green-400' },
  rollback: { label: 'Rollback', icon: RotateCcw, color: 'text-yellow-400' },
};

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  active: { label: 'Ativo', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  archived: { label: 'Arquivado', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  reverted: { label: 'Revertido', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export const PromptVersionHistory: React.FC<PromptVersionHistoryProps> = ({
  agentId,
  agentName,
  versions,
  currentVersionId,
  onRevert,
  onPreview,
  onCompare,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmRevert, setShowConfirmRevert] = useState<string | null>(null);

  const sortedVersions = [...versions].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleRevert = async (versionId: string) => {
    setRevertingId(versionId);
    try {
      await onRevert(versionId);
      setShowConfirmRevert(null);
    } finally {
      setRevertingId(null);
    }
  };

  const handleCopy = async (prompt: string, versionId: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(versionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCompareSelect = (version: PromptVersion) => {
    if (!selectedForCompare) {
      setSelectedForCompare(version.id);
    } else if (selectedForCompare === version.id) {
      setSelectedForCompare(null);
    } else {
      const versionA = versions.find(v => v.id === selectedForCompare);
      if (versionA) {
        onCompare(versionA, version);
      }
      setSelectedForCompare(null);
    }
  };

  const currentVersion = versions.find(v => v.id === currentVersionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <History className="text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Historico de Versoes</h3>
            <p className="text-xs text-text-muted">{agentName} - {versions.length} versoes</p>
          </div>
        </div>

        {selectedForCompare && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg text-sm">
            <Diff size={16} />
            Selecione outra versao para comparar
            <button
              onClick={() => setSelectedForCompare(null)}
              className="ml-2 hover:text-white"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Current Version Highlight */}
      {currentVersion && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-400" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">Versao Atual: {currentVersion.version_number}</span>
                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded">Em Producao</span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Desde {new Date(currentVersion.created_at).toLocaleDateString('pt-BR')}
                {currentVersion.score_at_time && ` - Score: ${currentVersion.score_at_time.toFixed(1)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border-default" />

        <div className="space-y-4">
          {sortedVersions.map((version, index) => {
            const sourceConfig = SOURCE_CONFIG[version.change_source];
            const statusConfig = STATUS_CONFIG[version.status];
            const SourceIcon = sourceConfig.icon;
            const isExpanded = expandedId === version.id;
            const isCurrent = version.id === currentVersionId;
            const isSelectedForCompare = selectedForCompare === version.id;

            return (
              <div
                key={version.id}
                className={`relative pl-16 ${isSelectedForCompare ? 'ring-2 ring-accent-primary rounded-lg' : ''}`}
              >
                {/* Timeline Node */}
                <div
                  className={`absolute left-4 w-4 h-4 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-green-500 border-green-400'
                      : version.status === 'reverted'
                      ? 'bg-red-500/50 border-red-400'
                      : 'bg-bg-tertiary border-border-default'
                  }`}
                />

                {/* Version Card */}
                <div
                  className={`bg-bg-secondary border rounded-lg overflow-hidden transition-colors ${
                    isCurrent ? 'border-green-500/50' : 'border-border-default hover:border-border-hover'
                  }`}
                >
                  {/* Main Row */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Version Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-medium text-text-primary">
                            {version.version_number}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${sourceConfig.color}`}>
                            <SourceIcon size={12} />
                            {sourceConfig.label}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded">
                              ATUAL
                            </span>
                          )}
                        </div>

                        {version.change_summary && (
                          <p className="text-sm text-text-secondary mb-2">{version.change_summary}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(version.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {version.created_by}
                          </span>
                          {version.parent_version_id && (
                            <span className="flex items-center gap-1">
                              <GitBranch size={12} />
                              Baseado em {versions.find(v => v.id === version.parent_version_id)?.version_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      {version.score_at_time !== undefined && (
                        <div className="text-right shrink-0">
                          <div className={`text-xl font-bold ${
                            version.score_at_time >= 8 ? 'text-green-400' :
                            version.score_at_time >= 6 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {version.score_at_time.toFixed(1)}
                          </div>
                          <div className="text-xs text-text-muted">Score</div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCompareSelect(version)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSelectedForCompare
                              ? 'bg-accent-primary text-white'
                              : 'hover:bg-bg-tertiary text-text-muted'
                          }`}
                          title="Comparar com outra versao"
                        >
                          <Diff size={16} />
                        </button>

                        <button
                          onClick={() => onPreview(version)}
                          className="p-2 hover:bg-bg-tertiary text-text-muted rounded-lg transition-colors"
                          title="Visualizar prompt"
                        >
                          <Eye size={16} />
                        </button>

                        {!isCurrent && version.status !== 'reverted' && (
                          <button
                            onClick={() => setShowConfirmRevert(version.id)}
                            className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"
                            title="Reverter para esta versao"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : version.id)}
                          className="p-2 hover:bg-bg-tertiary text-text-muted rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border-default">
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-medium text-text-muted uppercase">System Prompt</h5>
                          <button
                            onClick={() => handleCopy(version.system_prompt, version.id)}
                            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                          >
                            {copiedId === version.id ? (
                              <>
                                <Check size={12} className="text-green-400" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                Copiar
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-bg-tertiary rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                            {version.system_prompt.substring(0, 1000)}
                            {version.system_prompt.length > 1000 && (
                              <span className="text-text-muted">... ({version.system_prompt.length - 1000} caracteres restantes)</span>
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm Revert Modal */}
      {showConfirmRevert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Confirmar Reversao</h3>
            </div>

            <p className="text-sm text-text-secondary mb-4">
              Voce esta prestes a reverter o prompt para a versao{' '}
              <strong>{versions.find(v => v.id === showConfirmRevert)?.version_number}</strong>.
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-400">
                Esta acao criara uma nova versao baseada na versao selecionada. A versao atual sera arquivada.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmRevert(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRevert(showConfirmRevert)}
                disabled={revertingId === showConfirmRevert}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={16} className={revertingId === showConfirmRevert ? 'animate-spin' : ''} />
                {revertingId === showConfirmRevert ? 'Revertendo...' : 'Confirmar Reversao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
