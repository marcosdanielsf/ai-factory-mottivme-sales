import React, { useState } from 'react';
import { Search, FileText, Upload, Database, Save, Plus, Hash } from 'lucide-react';
import { MOCK_AGENT_VERSION } from '../constants';

type Tab = 'prompt' | 'documentos' | 'adicionar';

export const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState<Tab>('prompt');
  const [promptCode, setPromptCode] = useState(MOCK_AGENT_VERSION.system_prompt);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* KB Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-6 bg-bg-secondary">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <Database size={18} className="text-text-muted" />
             <h1 className="font-semibold text-text-primary">Base de Conhecimento</h1>
          </div>
          <div className="h-4 w-px bg-border-default"></div>
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'prompt' ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Prompt System
            </button>
             <button 
              onClick={() => setActiveTab('documentos')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'documentos' ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Documentos
            </button>
             <button 
              onClick={() => setActiveTab('adicionar')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'adicionar' ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              + Adicionar
            </button>
          </div>
        </div>
        
        {activeTab === 'prompt' && (
           <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-text-primary text-bg-primary hover:bg-white/90 rounded transition-colors">
            <Save size={14} />
            Salvar Alterações
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-bg-primary flex">
        {activeTab === 'prompt' && (
          <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
             {/* Simple Editor */}
             <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-[#2d2d2d] bg-[#1e1e1e] flex flex-col items-center pt-4 text-text-muted select-none">
                <Hash size={14} />
             </div>
             <textarea 
                value={promptCode}
                onChange={(e) => setPromptCode(e.target.value)}
                className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-16 resize-none focus:outline-none leading-relaxed"
                spellCheck="false"
             />
          </div>
        )}

        {activeTab === 'adicionar' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-2">Adicionar Novo Documento</h2>
                <p className="text-text-secondary text-sm">Upload de manuais, PDFs ou arquivos de texto para o contexto do agente.</p>
              </div>

              <div className="border border-dashed border-border-default rounded-lg p-12 flex flex-col items-center justify-center bg-bg-secondary hover:bg-bg-hover transition-colors cursor-pointer">
                <Upload size={24} className="text-text-muted mb-3" />
                <span className="text-sm font-medium">Clique para fazer upload</span>
                <span className="text-xs text-text-muted mt-1">TXT, PDF, MD, DOCX</span>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Título</label>
                    <input type="text" className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none" placeholder="Ex: Manual de Vendas 2024" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Conteúdo (Texto)</label>
                    <textarea rows={8} className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none resize-none" placeholder="Cole o texto aqui..." />
                 </div>
                 <button className="w-full py-2 bg-bg-hover border border-border-default rounded text-sm font-medium hover:text-text-primary hover:border-text-muted transition-colors">
                   Adicionar à Base
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
           <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
              <FileText size={32} className="mb-2 opacity-20" />
              <p className="text-sm">Nenhum documento indexado.</p>
           </div>
        )}
      </div>
    </div>
  );
};