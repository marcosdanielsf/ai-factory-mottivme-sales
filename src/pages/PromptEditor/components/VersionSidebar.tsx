import React from 'react';
import type { AgentVersion } from '../../../types';
import { CheckCircle2, AlertCircle, FileCode, Plus } from 'lucide-react';

interface VersionSidebarProps {
  versions: AgentVersion[];
  activeVersionId: string;
  versionsLoading: boolean;
  onVersionClick: (version: AgentVersion) => void;
  onCreateVersion: () => void;
}

export function VersionSidebar({
  versions,
  activeVersionId,
  versionsLoading,
  onVersionClick,
  onCreateVersion
}: VersionSidebarProps) {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'production':
      case 'active': return 'text-accent-success';
      case 'failed':
      case 'rejected': return 'text-accent-error';
      case 'draft': return 'text-text-muted';
      default: return 'text-accent-warning'; // sandbox / pending_approval
    }
  };

  return (
    <aside className="w-64 border-r border-border-default bg-bg-secondary flex flex-col">
      <div className="p-3 border-b border-border-default flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Histórico de Versões</span>
        <button
          onClick={onCreateVersion}
          className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-colors"
          title="Criar nova versão a partir da atual"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {versionsLoading && (
          <div className="text-center py-4 text-xs text-text-muted">Carregando versões...</div>
        )}

        {!versionsLoading && versions.length === 0 && (
          <div className="text-center py-4 text-xs text-text-muted">Nenhuma versão encontrada para este agente.</div>
        )}

        {/* Ordenar: Ativos primeiro, depois por data */}
        {(() => {
          const sortedVersions = [...versions].sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          const activeVersions = sortedVersions.filter(v => v.is_active);
          const inactiveVersions = sortedVersions.filter(v => !v.is_active);

          return (
            <>
              {/* Seção: Versões Ativas */}
              {activeVersions.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold text-accent-success uppercase tracking-wider px-2 py-1 bg-accent-success/10 rounded mb-1">
                    🟢 Em Produção ({activeVersions.length})
                  </div>
                  {activeVersions.map((v: AgentVersion) => (
                    <div
                      key={v.id}
                      onClick={() => onVersionClick(v)}
                      className={`
                        group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border-l-2 border-accent-success
                        ${activeVersionId === v.id ? 'bg-bg-hover' : 'hover:bg-bg-hover'}
                      `}
                    >
                      <div className="text-xs text-accent-success">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <div className={`text-sm font-medium ${activeVersionId === v.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {v.version_number || v.version || 'v?'}
                          </div>
                          <span className="text-[10px] bg-accent-success/20 text-accent-success px-1.5 py-0.5 rounded border border-accent-success/30">Ativo</span>
                        </div>
                        <div className="text-xs text-text-secondary truncate mt-0.5">
                          {v.clients?.nome || 'Cliente Desconhecido'}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {new Date(v.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Separador */}
              {activeVersions.length > 0 && inactiveVersions.length > 0 && (
                <div className="my-2 border-t border-border-default" />
              )}

              {/* Seção: Histórico */}
              {inactiveVersions.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1 mb-1">
                    📁 Histórico ({inactiveVersions.length})
                  </div>
                  {inactiveVersions.map((v: AgentVersion) => (
                    <div
                      key={v.id}
                      onClick={() => onVersionClick(v)}
                      className={`
                        group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                        ${activeVersionId === v.id ? 'bg-bg-hover' : 'hover:bg-bg-hover'}
                      `}
                    >
                      <div className={`text-xs ${getStatusColor(v.validation_status || v.status)}`}>
                        {(v.validation_status || v.status) === 'archived' ? <AlertCircle size={14} /> : <FileCode size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <div className={`text-sm font-medium ${activeVersionId === v.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {v.version_number || v.version || 'v?'}
                          </div>
                        </div>
                        <div className="text-xs text-text-secondary truncate mt-0.5">
                          {v.clients?.nome || 'Cliente Desconhecido'}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {new Date(v.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          );
        })()}
      </div>
    </aside>
  );
}
