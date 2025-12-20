import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_AGENT_VERSION } from '../constants';
import { Save, Play, History, GitBranch } from 'lucide-react';

export const PromptEditor = () => {
  const { id } = useParams();
  const [code, setCode] = useState(MOCK_AGENT_VERSION.system_prompt);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    alert('Prompt salvo e enviado para aprovação!');
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Editor Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-6 bg-bg-secondary">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-text-primary">✏️ Editor de Prompt</h1>
          <span className="text-xs px-2 py-1 bg-accent-success/10 text-accent-success rounded border border-accent-success/20">
            {MOCK_AGENT_VERSION.versao} (Ativo)
          </span>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
            <History size={16} />
            <span className="hidden sm:inline">Histórico</span>
          </button>
           <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors">
            <Play size={16} />
            <span className="hidden sm:inline">Testar</span>
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
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
          {/* Line Numbers Simulation (Visual only for this demo) */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col items-end pt-4 pr-2 text-text-muted/50 font-mono text-sm select-none z-10">
            {Array.from({ length: 20 }).map((_, i) => (
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
        <div className="w-80 border-l border-border-default bg-bg-secondary flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-border-default">
            <h3 className="font-medium text-sm mb-1">Configurações</h3>
            <p className="text-xs text-text-muted">Parâmetros adicionais do modelo</p>
          </div>
          
          <div className="p-4 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Modelo</label>
              <select className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none text-text-primary">
                <option>GPT-4o</option>
                <option>Claude 3.5 Sonnet</option>
                <option>Gemini 1.5 Pro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Temperatura</label>
              <div className="flex items-center gap-4">
                <input type="range" min="0" max="1" step="0.1" className="flex-1 accent-text-primary h-1 bg-bg-tertiary rounded-lg appearance-none cursor-pointer" />
                <span className="text-sm font-mono text-text-muted">0.7</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Tools Habilitadas</label>
              <div className="space-y-2">
                {['calendar_api', 'crm_lookup', 'send_whatsapp'].map(tool => (
                  <label key={tool} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                    <input type="checkbox" defaultChecked className="rounded border-border-default bg-bg-tertiary accent-text-primary" />
                    {tool}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-border-default">
            <div className="bg-bg-tertiary p-3 rounded text-xs text-text-muted">
              <div className="flex items-center gap-2 mb-1 text-text-secondary font-medium">
                <GitBranch size={12} />
                Versão Base: v2.0
              </div>
              <p>Última alteração feita por Marcos há 2 dias.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};