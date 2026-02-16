import React from 'react';
import type { Agent, AgentVersion } from '../../../types';
import {
  FileText,
  GitBranch,
  Sparkles,
  Code,
  Shield,
  Brain,
  Target,
  Briefcase,
  Save,
  Play,
  Zap,
  MessageSquare,
  RefreshCw,
  Building2,
  Search,
  ChevronDown,
  X,
  Box
} from 'lucide-react';

interface EditorHeaderProps {
  // Agent state
  selectedAgent: Agent | undefined;
  isAgentMenuOpen: boolean;
  agentSearchTerm: string;
  agentsLoading: boolean;
  filteredAgents: Agent[];
  agentSearchInputRef: React.RefObject<HTMLInputElement | null>;
  agentMenuRef: React.RefObject<HTMLDivElement | null>;
  onAgentMenuToggle: () => void;
  onAgentSearchChange: (term: string) => void;
  onAgentSelect: (id: string) => void;
  // Tab state
  activeTab: string;
  selectedMode: string;
  activeVersion: AgentVersion | undefined;
  onTabChange: (tab: string) => void;
  onModeChange: (mode: string) => void;
  // Actions
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isSandboxLoading: boolean;
  showAdjustmentsChat: boolean;
  onSave: () => void;
  onPublish: () => void;
  onSandbox: () => void;
  onRefresh: () => void;
  onToggleChat: () => void;
}

export function EditorHeader({
  // Agent state
  selectedAgent,
  isAgentMenuOpen,
  agentSearchTerm,
  agentsLoading,
  filteredAgents,
  agentSearchInputRef,
  agentMenuRef,
  onAgentMenuToggle,
  onAgentSearchChange,
  onAgentSelect,
  // Tab state
  activeTab,
  selectedMode,
  activeVersion,
  onTabChange,
  onModeChange,
  // Actions
  isDirty,
  isSaving,
  isPublishing,
  isSandboxLoading,
  showAdjustmentsChat,
  onSave,
  onPublish,
  onSandbox,
  onRefresh,
  onToggleChat
}: EditorHeaderProps) {
  return (
    <header className="h-12 border-b border-border-default flex items-center justify-between px-4 bg-bg-secondary shrink-0">
      {/* Esquerda: Identidade + Agente */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <Box size={18} className="text-accent-primary" />
          <h1 className="font-semibold text-sm text-text-primary whitespace-nowrap">Prompt Studio</h1>
        </div>

        <button
          onClick={onRefresh}
          disabled={agentsLoading}
          className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-all active:scale-95 disabled:opacity-50 shrink-0"
          title="Atualizar agentes e versões"
        >
          <RefreshCw size={14} className={agentsLoading ? 'animate-spin' : ''} />
        </button>

        {/* Agent Selector - Dropdown rico com busca */}
        <div className="relative shrink-0" ref={agentMenuRef}>
          <button
            onClick={onAgentMenuToggle}
            className="flex items-center gap-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary pl-3 pr-2 py-1 rounded-md border border-border-default hover:border-text-muted/30 transition-all"
          >
            <Building2 size={14} className="text-accent-primary shrink-0" />
            <span className="truncate max-w-[180px]">{selectedAgent ? selectedAgent.name : 'Selecione'}</span>
            <ChevronDown size={12} className={`text-text-muted transition-transform duration-200 shrink-0 ${isAgentMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAgentMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border-default bg-bg-primary/50">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    ref={agentSearchInputRef}
                    type="text"
                    value={agentSearchTerm}
                    onChange={(e) => onAgentSearchChange(e.target.value)}
                    placeholder="Procurar por uma subconta..."
                    className="w-full bg-bg-tertiary border border-border-default rounded-md pl-8 pr-8 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  />
                  {agentSearchTerm && (
                    <button
                      onClick={() => onAgentSearchChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-bg-hover rounded transition-colors"
                    >
                      <X size={12} className="text-text-muted" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de agentes */}
              <div className="max-h-[320px] overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-bg-primary/30">
                  {agentSearchTerm ? 'Resultados' : 'Todas as Contas'}
                </div>

                {filteredAgents.length === 0 ? (
                  <div className="px-3 py-6 text-center text-text-muted text-sm">
                    Nenhuma subconta encontrada
                  </div>
                ) : (
                  filteredAgents.map((agent: Agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        onAgentSelect(agent.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all ${
                        selectedAgent?.id === agent.id
                          ? 'bg-accent-primary/10'
                          : 'hover:bg-bg-tertiary'
                      }`}
                    >
                      <Building2 size={14} className={`shrink-0 ${selectedAgent?.id === agent.id ? 'text-accent-primary' : 'text-text-muted'}`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm truncate ${selectedAgent?.id === agent.id ? 'text-accent-primary font-medium' : 'text-text-primary'}`}>
                          {agent.name}
                        </div>
                        {agent.agentName && agent.agentName !== agent.name && (
                          <div className="text-[11px] text-text-muted truncate">
                            {agent.agentName}
                          </div>
                        )}
                      </div>
                      {agent.is_active && (
                        <span className="text-[9px] bg-accent-success/20 text-accent-success px-1 py-0.5 rounded shrink-0">●</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Centro: Tabs unificadas */}
      <div className="flex items-center gap-3">
        <div className="flex bg-bg-tertiary p-0.5 rounded-md">
          <button
            onClick={() => onTabChange('prompt')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'prompt' ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="System Prompt"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={() => onTabChange('modes')}
            className={`px-2 py-1 text-xs rounded transition-colors flex items-center ${activeTab === 'modes' ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:text-text-secondary'}`}
            title={activeVersion?.prompts_por_modo && Object.keys(activeVersion.prompts_por_modo).length > 0
              ? `${Object.keys(activeVersion.prompts_por_modo).length} modo(s)`
              : 'Modos'}
          >
            <GitBranch size={14} />
            {activeVersion?.prompts_por_modo && Object.keys(activeVersion.prompts_por_modo).length > 0 && (
              <span className="ml-0.5 text-[8px] bg-blue-500/30 text-blue-300 px-1 rounded">
                {Object.keys(activeVersion.prompts_por_modo).length}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('config')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'config' ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Hiperpersonalização"
          >
            <Sparkles size={14} />
          </button>

          <div className="w-px h-4 bg-border-default mx-0.5 self-center"></div>

          <button
            onClick={() => onTabChange('tools')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'tools' ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Tools Config"
          >
            <Code size={14} />
          </button>
          <button
            onClick={() => onTabChange('compliance')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'compliance' ? 'bg-red-500/20 text-red-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Compliance Rules"
          >
            <Shield size={14} />
          </button>
          <button
            onClick={() => onTabChange('personality')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'personality' ? 'bg-blue-500/20 text-blue-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Personality Config"
          >
            <Brain size={14} />
          </button>
          <button
            onClick={() => onTabChange('qualification')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'qualification' ? 'bg-green-500/20 text-green-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Qualification Config"
          >
            <Target size={14} />
          </button>
          <button
            onClick={() => onTabChange('business')}
            className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === 'business' ? 'bg-orange-500/20 text-orange-400' : 'text-text-muted hover:text-text-secondary'}`}
            title="Business Config"
          >
            <Briefcase size={14} />
          </button>
        </div>

        {activeTab === 'modes' && (
          <select
            value={selectedMode}
            onChange={(e) => onModeChange(e.target.value)}
            className="bg-bg-tertiary border border-border-default text-xs rounded px-2 py-1 text-text-primary focus:outline-none"
          >
            {activeVersion?.prompts_por_modo && Object.keys(activeVersion.prompts_por_modo).length > 0 ? (
              Object.keys(activeVersion.prompts_por_modo).map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))
            ) : (
              <option value="">Sem modos</option>
            )}
          </select>
        )}

        <span className="text-text-primary font-mono text-xs bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
          {activeVersion ? (activeVersion.version_number || activeVersion.version) : '---'}
        </span>
      </div>

      {/* Direita: Ações */}
      <div className="flex items-center gap-1.5 shrink-0">
         <button
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
            showAdjustmentsChat
              ? 'bg-accent-primary text-white'
              : 'text-text-secondary hover:bg-bg-hover'
          }`}
          title="Chat de Ajustes para CS"
         >
          <MessageSquare size={14} />
          <span className="hidden sm:inline text-xs">Chat CS</span>
        </button>
         <button
          onClick={onSandbox}
          disabled={isSandboxLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-hover rounded transition-colors ${isSandboxLoading ? 'opacity-50 cursor-wait' : ''}`}
         >
          <Play size={14} className={isSandboxLoading ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline">{isSandboxLoading ? '...' : 'Sandbox'}</span>
        </button>
        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={`
            flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors
            ${isDirty
              ? 'bg-text-primary text-bg-primary hover:bg-white/90'
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}
          `}
        >
          <Save size={14} className={isSaving ? 'animate-spin' : ''} />
          {isSaving ? '...' : 'Salvar'}
        </button>

        {activeVersion?.status !== 'production' && (
          <button
            onClick={onPublish}
            disabled={isPublishing || isDirty}
            className={`
              flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors
              ${!isDirty && !isPublishing
                ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}
            `}
            title={isDirty ? "Salve antes de publicar" : "Publicar em produção"}
          >
            <Zap size={14} className={isPublishing ? 'animate-pulse' : ''} />
            {isPublishing ? '...' : 'Publicar'}
          </button>
        )}
      </div>
    </header>
  );
}
