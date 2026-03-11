import React from 'react';
import { Power, CheckCircle2, GitBranch, MessageSquare } from 'lucide-react';
import type { AgentVersion } from '../../../types';
import { getStatusColor } from '../helpers';

interface VersionDetailsProps {
  activeVersion: AgentVersion | undefined;
  isTogglingActive: boolean;
  onToggleActive: () => void;
  onToggleField: (field: 'is_active' | 'validation_status') => void;
  onShowChat: () => void;
}

export const VersionDetails: React.FC<VersionDetailsProps> = ({
  activeVersion,
  isTogglingActive,
  onToggleActive,
  onToggleField,
  onShowChat,
}) => {
  return (
    <>
      <div className="p-4 border-b border-border-default">
        <h3 className="font-medium text-sm mb-1">Detalhes da Versao</h3>
        <p className="text-xs text-text-muted">Metadados e Configuracoes</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Versao</label>
          <div className="text-sm font-mono text-text-primary bg-bg-tertiary px-3 py-2 rounded border border-border-default flex justify-between items-center">
            <span>{activeVersion?.version_number || activeVersion?.version || 'v?'}</span>
            {activeVersion?.is_active && <span className="text-[10px] text-accent-success font-bold uppercase border border-accent-success/30 px-1 rounded">Ativa</span>}
          </div>
        </div>

         <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Status & Validacao</label>
          <div className="flex flex-col gap-3">
            {/* Toggle Ativar/Desativar */}
            <button
              onClick={onToggleActive}
              disabled={isTogglingActive || !activeVersion}
              className={`
                flex items-center justify-between w-full px-3 py-2.5 rounded-lg border transition-all duration-200
                ${activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                  ? 'bg-accent-success/10 border-accent-success/30 hover:bg-accent-success/20'
                  : 'bg-bg-tertiary border-border-default hover:bg-bg-hover'
                }
                ${isTogglingActive ? 'opacity-70 cursor-wait' : 'cursor-pointer'}
                ${!activeVersion ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={activeVersion?.is_active ? 'Clique para desativar o agente' : 'Clique para ativar o agente'}
            >
              <div className="flex items-center gap-2">
                <Power
                  size={16}
                  className={`${isTogglingActive ? 'animate-pulse' : ''} ${
                    activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                      ? 'text-accent-success'
                      : 'text-text-muted'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                    ? 'text-accent-success'
                    : 'text-text-secondary'
                }`}>
                  {isTogglingActive
                    ? 'Alterando...'
                    : activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                      ? 'Ativo em Produção'
                      : 'Inativo'
                  }
                </span>
              </div>

              {/* Toggle Switch Visual */}
              <div className={`
                relative w-10 h-5 rounded-full transition-colors duration-200
                ${activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                  ? 'bg-accent-success'
                  : 'bg-bg-hover border border-border-default'
                }
              `}>
                <div className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                  ${activeVersion?.is_active && (activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production')
                    ? 'translate-x-5'
                    : 'translate-x-0.5'
                  }
                `}></div>
              </div>
            </button>

            {/* Info: ambos campos precisam estar ativos */}
            <div className="text-[10px] text-text-muted bg-bg-tertiary/50 px-2 py-1.5 rounded flex items-start gap-1.5">
              <span className="shrink-0">ℹ️</span>
              <span>
                Requer <code className="bg-bg-hover px-1 rounded">is_active=TRUE</code> e <code className="bg-bg-hover px-1 rounded">status=active</code> para funcionar no fluxo IA.
              </span>
            </div>

            {/* Status atual dos campos - cada um toggle independente */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onToggleField('is_active')}
                disabled={isTogglingActive || !activeVersion}
                className={`px-2 py-1.5 rounded border text-left cursor-pointer hover:opacity-70 transition-opacity ${
                  activeVersion?.is_active
                    ? 'bg-accent-success/10 border-accent-success/30 text-accent-success'
                    : 'bg-bg-tertiary border-border-default text-text-muted'
                }`}
                title={activeVersion?.is_active ? 'Clique para desativar is_active' : 'Clique para ativar is_active'}
              >
                <div className="text-[10px] opacity-70">is_active</div>
                <div className="font-mono font-medium">{activeVersion?.is_active ? 'TRUE' : 'FALSE'}</div>
              </button>
              <button
                onClick={() => onToggleField('validation_status')}
                disabled={isTogglingActive || !activeVersion}
                className={`px-2 py-1.5 rounded border text-left cursor-pointer hover:opacity-70 transition-opacity ${
                  activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production'
                    ? 'bg-accent-success/10 border-accent-success/30 text-accent-success'
                    : 'bg-bg-tertiary border-border-default text-text-muted'
                }`}
                title={activeVersion?.validation_status === 'active' || activeVersion?.validation_status === 'production' ? 'Clique para desativar status' : 'Clique para ativar status'}
              >
                <div className="text-[10px] opacity-70">status</div>
                <div className="font-mono font-medium">{activeVersion?.validation_status || activeVersion?.status || 'draft'}</div>
              </button>
            </div>

            {activeVersion?.avg_score_overall !== undefined && (
                <div className="text-xs flex justify-between items-center bg-bg-tertiary p-1.5 rounded">
                    <span>Score Geral:</span>
                    <span className={`font-bold ${activeVersion.avg_score_overall >= 7 ? 'text-accent-success' : 'text-accent-warning'}`}>
                        {activeVersion.avg_score_overall}/10
                    </span>
                </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Ciclo de Vida</label>
            <div className="text-xs text-text-secondary space-y-1">
                <div className="flex justify-between">
                    <span>Criado em:</span>
                    <span>{activeVersion?.created_at ? new Date(activeVersion.created_at).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span>Deployed em:</span>
                    <span className={!activeVersion?.deployed_at ? "text-text-muted italic" : ""}>
                        {activeVersion?.deployed_at ? new Date(activeVersion.deployed_at).toLocaleDateString() : 'Nao implantado'}
                    </span>
                </div>
            </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Deployment Notes (Change Log)</label>
          <p className={`text-sm bg-bg-tertiary p-2 rounded border border-border-default min-h-[60px] whitespace-pre-wrap ${!activeVersion?.change_log ? "text-text-muted italic" : "text-text-secondary"}`}>
            {activeVersion?.change_log || 'Nenhuma nota de implantacao registrada.'}
          </p>
        </div>

        {activeVersion?.prompts_by_mode && Object.keys(activeVersion.prompts_by_mode).length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Modos Especificos</label>
            <div className="space-y-1">
              {Object.keys(activeVersion.prompts_by_mode).map(key => (
                <div key={key} className="text-xs bg-bg-tertiary px-2 py-1 rounded flex justify-between">
                  <span>{key}</span>
                  <span className="text-text-muted text-[10px] uppercase">Configurado</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location & Client Info */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Identificadores</label>
          <div className="text-xs text-text-secondary space-y-1">
            <div className="flex justify-between">
              <span>Location ID:</span>
              <span className="font-mono text-[10px] truncate max-w-[120px]" title={activeVersion?.location_id || ''}>
                {activeVersion?.location_id || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Client ID:</span>
              <span className="font-mono text-[10px] truncate max-w-[120px]" title={activeVersion?.client_id || ''}>
                {activeVersion?.client_id || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Botao para abrir Chat CS */}
        <button
          onClick={onShowChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors border border-accent-primary/30"
        >
          <MessageSquare size={18} />
          <span className="font-medium">Abrir Chat de Ajustes</span>
        </button>
      </div>

      <div className="p-4 border-t border-border-default">
        <div className="bg-bg-tertiary p-3 rounded text-xs text-text-muted">
          <div className="flex items-center gap-2 mb-1 text-text-secondary font-medium">
            <GitBranch size={12} />
            Origem: Supabase
          </div>
          <p>ID: {activeVersion?.id}</p>
        </div>
      </div>
    </>
  );
};
