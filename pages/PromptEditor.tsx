import React, { useState } from 'react';
import { MOCK_AGENT_VERSIONS } from '../constants';
import { Save, Play, GitBranch, Plus, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';

export const PromptEditor = () => {
  const [activeVersionId, setActiveVersionId] = useState(MOCK_AGENT_VERSIONS[0].id);
  const activeVersion = MOCK_AGENT_VERSIONS.find(v => v.id === activeVersionId) || MOCK_AGENT_VERSIONS[0];
  const [code, setCode] = useState(activeVersion.system_prompt);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    alert('Versão salva como rascunho!');
    setIsDirty(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-accent-success';
      case 'failed': return 'text-accent-error';
      default: return 'text-text-muted';
    }
  };

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
          <div className="flex items-center gap-2 text-sm text-text-muted">
             <span>Editando:</span>
             <span className="text-text-primary font-mono bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
                {activeVersion.version_number}
             </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
            <Play size={16} />
            <span className="hidden sm:inline">Sandbox</span>
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
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Versões</span>
            <button className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {MOCK_AGENT_VERSIONS.map(v => (
              <div 
                key={v.id}
                onClick={() => {
                  setActiveVersionId(v.id);
                  setCode(v.system_prompt);
                }}
                className={`
                  group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                  ${activeVersionId === v.id ? 'bg-bg-hover' : 'hover:bg-bg-hover'}
                `}
              >
                <div className={`text-xs ${getStatusColor(v.validation_status)}`}>
                   {v.validation_status === 'active' ? <CheckCircle2 size={14} /> : 
                    v.validation_status === 'failed' ? <AlertCircle size={14} /> : 
                    <FileCode size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${activeVersionId === v.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {v.version_number}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    Score: {v.validation_score || 'N/A'} • {new Date(v.created_at).toLocaleDateString()}
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
          <textarea
            value={code}
            onChange={handleChange}
            spellCheck="false"
            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-6"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Configuration Sidebar (Right) */}
        <div className="w-72 border-l border-border-default bg-bg-secondary flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-border-default">
            <h3 className="font-medium text-sm mb-1">Configurações de Hiperpersonalização</h3>
            <p className="text-xs text-text-muted">Parâmetros do V3 Engine</p>
          </div>
          
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Tom de Voz</label>
              <select className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none text-text-primary">
                <option>Amigável (Padrão)</option>
                <option>Profissional</option>
                <option>Empático</option>
                <option>Urgente (Sales)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Palavras Proibidas</label>
              <div className="bg-bg-tertiary border border-border-default rounded p-2 text-sm text-text-primary min-h-[80px]">
                {activeVersion.hyperpersonalization_config?.forbidden_words.map(w => (
                  <span key={w} className="inline-block bg-bg-primary border border-border-default px-1.5 py-0.5 rounded text-xs mr-1 mb-1">
                    {w}
                  </span>
                ))}
                <input type="text" placeholder="+ add" className="bg-transparent outline-none text-xs w-16" />
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-border-default">
            <div className="bg-bg-tertiary p-3 rounded text-xs text-text-muted">
              <div className="flex items-center gap-2 mb-1 text-text-secondary font-medium">
                <GitBranch size={12} />
                Origem: Git Repo
              </div>
              <p>Sincronizado via n8n webhook.</p>
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