import React, { useState, useEffect } from 'react';
import { useAgents, useAgentVersions } from '../src/hooks';
import { Save, Play, GitBranch, Plus, CheckCircle2, AlertCircle, FileCode, ChevronDown, Bot } from 'lucide-react';
import { AgentVersion } from '../types';

export const PromptEditor = () => {
  const { agents, loading: agentsLoading } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  
  // Set default agent when loaded
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const { versions, loading: versionsLoading } = useAgentVersions(selectedAgentId);
  const [activeVersionId, setActiveVersionId] = useState<string>('');
  const [code, setCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set active version when versions load
  useEffect(() => {
    if (versions.length > 0) {
      // Default to the most recent version (first in list due to sorting)
      if (!activeVersionId || !versions.find(v => v.id === activeVersionId)) {
        setActiveVersionId(versions[0].id);
        setCode(versions[0].system_prompt);
      }
    } else {
      setActiveVersionId('');
      setCode('');
    }
  }, [versions, activeVersionId]);

  const [activeTab, setActiveTab] = useState<'prompt' | 'config'>('prompt');
  const [config, setConfig] = useState('{}');

  // Update code when switching versions
  const handleVersionClick = (version: AgentVersion) => {
    setActiveVersionId(version.id);
    setCode(version.system_prompt);
    setConfig(JSON.stringify(version.hyperpersonalization_config || {}, null, 2));
    setIsDirty(false);
  };

  const activeVersion = versions.find(v => v.id === activeVersionId);

  // Update config when activeVersion changes
  useEffect(() => {
    if (activeVersion) {
      setConfig(JSON.stringify(activeVersion.hyperpersonalization_config || {}, null, 2));
    }
  }, [activeVersion]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsDirty(true);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(e.target.value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedAgent || !activeVersionId) return;
    
    setIsSaving(true);
    // Simular salvamento no Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsDirty(false);
    setIsSaving(false);
    alert('Prompt e configurações salvos com sucesso no banco de dados!');
  };

  const handleSandbox = () => {
    if (!selectedAgent) return;
    setIsSandboxLoading(true);
    setTimeout(() => {
      setIsSandboxLoading(false);
      alert(`Ambiente de Sandbox inicializado para o agente: ${selectedAgent.name}. Você pode testar as alterações em tempo real agora.`);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'production': return 'text-accent-success';
      case 'failed': return 'text-accent-error';
      case 'draft': return 'text-text-muted';
      default: return 'text-accent-warning'; // sandbox
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Studio Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-6 bg-bg-secondary shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-text-primary flex items-center gap-2">
            <BoxIcon />
            Prompt Studio
          </h1>
          
          <div className="h-4 w-px bg-border-default"></div>
          
          {/* Agent Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
              className="flex items-center gap-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary px-2 py-1 rounded transition-colors"
            >
              <Bot size={16} />
              {selectedAgent ? selectedAgent.name : 'Selecione um Agente'}
              <ChevronDown size={14} className={`text-text-muted transition-transform ${isAgentMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAgentMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAgentMenuOpen(false)}></div>
                <div className="absolute top-full left-0 mt-1 w-56 bg-bg-secondary border border-border-default rounded shadow-lg z-50 overflow-hidden">
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        setIsAgentMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedAgentId === agent.id 
                        ? 'bg-accent-primary/10 text-accent-primary' 
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                      }`}
                    >
                      {agent.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-border-default"></div>

          {/* Tab Selector */}
          <div className="flex bg-bg-tertiary p-1 rounded-md">
            <button 
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'prompt' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              System Prompt
            </button>
            <button 
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'config' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Hiperpersonalização
            </button>
          </div>

          <div className="h-4 w-px bg-border-default"></div>

          <div className="flex items-center gap-2 text-sm text-text-muted">
             <span>Versão:</span>
             <span className="text-text-primary font-mono bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
                {activeVersion ? activeVersion.version_number : '---'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
            onClick={handleSandbox}
            disabled={isSandboxLoading}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors ${isSandboxLoading ? 'opacity-50 cursor-wait' : ''}`}
           >
            <Play size={16} className={isSandboxLoading ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{isSandboxLoading ? 'Iniciando...' : 'Sandbox'}</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`
              flex items-center gap-2 px-4 py-1.5 text-sm rounded transition-colors ml-2
              ${isDirty 
                ? 'bg-text-primary text-bg-primary hover:bg-white/90' 
                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}
            `}
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Version List (Left Sidebar) */}
        <div className="w-64 border-r border-border-default bg-bg-secondary flex flex-col">
          <div className="p-3 border-b border-border-default flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Histórico de Versões</span>
            <button className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary">
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

            {versions.map(v => (
              <div 
                key={v.id}
                onClick={() => handleVersionClick(v)}
                className={`
                  group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                  ${activeVersionId === v.id ? 'bg-bg-hover' : 'hover:bg-bg-hover'}
                `}
              >
                <div className={`text-xs ${getStatusColor(v.status)}`}>
                   {v.status === 'production' ? <CheckCircle2 size={14} /> : 
                    v.status === 'failed' ? <AlertCircle size={14} /> : 
                    <FileCode size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${activeVersionId === v.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {v.version_number}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                     {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col items-end pt-4 pr-2 text-text-muted/50 font-mono text-sm select-none z-10">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          {activeTab === 'prompt' ? (
            <textarea
              value={code}
              onChange={handlePromptChange}
              spellCheck="false"
              placeholder={!selectedAgentId ? "Selecione um agente para ver o prompt." : "Nenhum prompt carregado."}
              className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-6"
              style={{ tabSize: 2 }}
            />
          ) : (
            <textarea
               value={config}
               onChange={handleConfigChange}
               spellCheck="false"
               placeholder='{ "config": "value" }'
               className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-6"
               style={{ tabSize: 2 }}
             />
          )}
        </div>

        {/* Configuration Sidebar (Right) */}
        <div className="w-72 border-l border-border-default bg-bg-secondary flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-border-default">
            <h3 className="font-medium text-sm mb-1">Detalhes da Versão</h3>
            <p className="text-xs text-text-muted">Metadados e Configurações</p>
          </div>
          
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Versão</label>
              <div className="text-sm font-mono text-text-primary bg-bg-tertiary px-3 py-2 rounded border border-border-default">
                v{activeVersion?.version_number || '1.0.0'}
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Status</label>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeVersion?.status === 'production' ? 'bg-accent-success' : 'bg-accent-warning'
                }`}></span>
                <span className="text-sm font-medium capitalize">{activeVersion?.status || 'Draft'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Change Log</label>
              <p className="text-sm text-text-secondary bg-bg-tertiary p-2 rounded border border-border-default min-h-[60px]">
                {activeVersion?.change_log || 'Sem registro de alterações.'}
              </p>
            </div>
            
            {activeVersion?.prompts_por_modo && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Modos Específicos</label>
                <div className="space-y-1">
                  {Object.keys(activeVersion.prompts_por_modo).map(key => (
                    <div key={key} className="text-xs bg-bg-tertiary px-2 py-1 rounded flex justify-between">
                      <span>{key}</span>
                      <span className="text-text-muted text-[10px] uppercase">Configurado</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto p-4 border-t border-border-default">
            <div className="bg-bg-tertiary p-3 rounded text-xs text-text-muted">
              <div className="flex items-center gap-2 mb-1 text-text-secondary font-medium">
                <GitBranch size={12} />
                Origem: Supabase
              </div>
              <p>ID: {activeVersion?.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
