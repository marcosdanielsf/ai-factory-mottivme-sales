import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Upload, Database, Save, Plus, Hash, Bot, Wrench, BrainCircuit, Workflow, Users, Calendar, PhoneCall, HelpCircle, ShieldAlert, UserCheck, ChevronDown, Check, Edit2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { AGENT_MODES, AGENT_TOOLS, SYSTEM_PROMPT_TEMPLATE } from '../src/data/agent-config';
import { useAgents, useArtifacts } from '../src/hooks';
import { Agent } from '../types';

type Tab = 'overview' | 'prompt' | 'documentos' | 'adicionar' | 'modes';

const ModeIcon = ({ id }: { id: string }) => {
  switch (id) {
    case 'first_contact': return <Users size={20} className="text-blue-400" />;
    case 'scheduler': return <Calendar size={20} className="text-green-400" />;
    case 'rescheduler': return <Calendar size={20} className="text-yellow-400" />;
    case 'concierge': return <HelpCircle size={20} className="text-purple-400" />;
    case 'customer_success': return <UserCheck size={20} className="text-pink-400" />;
    case 'objection_handler': return <ShieldAlert size={20} className="text-red-400" />;
    case 'followuper': return <PhoneCall size={20} className="text-orange-400" />;
    default: return <Bot size={20} />;
  }
};

export const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [promptCode, setPromptCode] = useState(SYSTEM_PROMPT_TEMPLATE);
  
  // Agent selection state
  const { agents, loading: loadingAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  
  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId) || agents[0], 
    [agents, selectedAgentId]
  );

  // Artifacts State
  const { artifacts, loading: loadingArtifacts, uploadArtifact, deleteArtifact } = useArtifacts(selectedAgent?.id);
  
  // Agent Config State (Legacy/Mock for now)
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [modePrompt, setModePrompt] = useState('');

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setIsAgentDropdownOpen(false);
  };

  const handleModeSelect = (modeId: string) => {
    setSelectedModeId(modeId);
    // Fallback logic for mode prompts
    setModePrompt('');
    setActiveTab('modes');
  };

  const [newArtifact, setNewArtifact] = useState({
    title: '',
    content: '',
    artifact_type: 'knowledge_base'
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddArtifact = async () => {
    if (!selectedAgent) return;
    setIsSyncing(true);
    
    try {
      const { error } = await uploadArtifact({
        ...newArtifact,
        agent_id: selectedAgent.id
      });

      if (!error) {
        setNewArtifact({ title: '', content: '', artifact_type: 'knowledge_base' });
        setActiveTab('documentos');
      }
    } finally {
      // Simulamos um tempo de sincronização para feedback visual
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  const handleSaveModePrompt = async () => {
    // Basic implementation for now
    alert(`Prompt do modo ${selectedModeId} salvo com sucesso! (Simulado)`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* KB Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-6 bg-bg-secondary shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <Database size={18} className="text-text-muted" />
             <h1 className="font-semibold text-text-primary">Base de Conhecimento</h1>
          </div>
          
          <div className="h-4 w-px bg-border-default"></div>

          {/* Agent Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded text-sm hover:border-text-muted transition-colors min-w-[180px]"
            >
              {loadingAgents ? (
                <span className="text-text-muted">Carregando...</span>
              ) : selectedAgent ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-accent-success"></span>
                  <span className="truncate max-w-[140px]">{selectedAgent.name}</span>
                  <ChevronDown size={14} className="ml-auto text-text-muted" />
                </>
              ) : (
                <span className="text-text-muted">Selecione um agente</span>
              )}
            </button>
            
            {isAgentDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-bg-secondary border border-border-default rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                 {agents.map(agent => (
                   <button
                     key={agent.id}
                     onClick={() => handleAgentChange(agent)}
                     className="w-full text-left px-4 py-2 text-sm hover:bg-bg-tertiary flex items-center gap-2"
                   >
                     <div className="w-6 h-6 rounded bg-bg-tertiary flex items-center justify-center text-xs border border-border-default">
                        {agent.name.substring(0, 2).toUpperCase()}
                     </div>
                     <span className={`flex-1 truncate ${selectedAgentId === agent.id ? 'text-accent-primary font-medium' : 'text-text-primary'}`}>
                       {agent.name}
                     </span>
                     {selectedAgentId === agent.id && <Check size={14} className="text-accent-primary" />}
                   </button>
                 ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-border-default"></div>

          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'overview' ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              Visão Geral
            </button>
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
        
        {activeTab === 'modes' && (
           <button 
             onClick={handleSaveModePrompt}
             className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-text-primary text-bg-primary hover:bg-white/90 rounded transition-colors"
           >
            <Save size={14} />
            Salvar Prompt do Modo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-bg-primary flex">
        {activeTab === 'overview' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-10">
              
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Estrutura do Agente: {selectedAgent?.name}</h2>
                  <p className="text-text-secondary">Configuração ativa do fluxo de atendimento inteligente para {selectedAgent?.name}.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-sm text-text-muted">
                  <BrainCircuit size={16} />
                  Modelo: <span className="text-text-primary font-medium">Claude Opus 4.5</span>
                </div>
              </div>

              {/* Modes Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Workflow size={16} />
                  Modos de Operação (Avatares)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AGENT_MODES.map((mode) => (
                    <div 
                      key={mode.id} 
                      onClick={() => handleModeSelect(mode.id)}
                      className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-text-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center border border-border-default group-hover:border-text-muted transition-colors">
                          <ModeIcon id={mode.id} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">{mode.name}</h4>
                          <code className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">{mode.id}</code>
                        </div>
                        <Edit2 size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-text-secondary mb-3 min-h-[40px]">{mode.description}</p>
                      <div className="text-xs text-text-muted font-mono bg-bg-tertiary p-2 rounded truncate border border-border-default">
                        var: {mode.prompt_variable}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools List */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Wrench size={16} />
                  Ferramentas Disponíveis (Tools)
                </h3>
                <div className="bg-bg-secondary border border-border-default rounded-lg divide-y divide-border-default">
                  {AGENT_TOOLS.map((tool) => (
                    <div key={tool.id} className="p-4 flex flex-col md:flex-row gap-4 md:items-start hover:bg-bg-hover transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-medium text-text-primary">{tool.name}</span>
                           <span className="text-xs font-mono text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">{tool.id}</span>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{tool.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {tool.params.split(', ').map((param) => (
                            <span key={param} className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
                              {param}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="md:w-64 text-xs text-text-muted bg-accent-warning/5 border border-accent-warning/10 p-2 rounded">
                        <span className="font-semibold text-accent-warning block mb-1">Uso Recomendado:</span>
                        {tool.usage}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

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

        {activeTab === 'modes' && (
          <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
             <div className="h-10 bg-bg-secondary border-b border-border-default flex items-center px-4 gap-2 text-sm text-text-primary">
                <Workflow size={16} />
                <span className="font-medium">Editando Modo:</span>
                <span className="text-accent-primary">{AGENT_MODES.find(m => m.id === selectedModeId)?.name}</span>
             </div>
             {/* Simple Editor */}
             <div className="absolute left-0 top-10 bottom-0 w-12 border-r border-[#2d2d2d] bg-[#1e1e1e] flex flex-col items-center pt-4 text-text-muted select-none">
                <Hash size={14} />
             </div>
             <textarea 
                value={modePrompt}
                onChange={(e) => setModePrompt(e.target.value)}
                className="absolute top-10 left-0 bottom-0 right-0 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-16 resize-none focus:outline-none leading-relaxed"
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
                    <input 
                      type="text" 
                      value={newArtifact.title}
                      onChange={(e) => setNewArtifact(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none" 
                      placeholder="Ex: Manual de Vendas 2024" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary">Conteúdo (Texto)</label>
                    <textarea 
                      rows={8} 
                      value={newArtifact.content}
                      onChange={(e) => setNewArtifact(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full bg-bg-secondary border border-border-default rounded px-3 py-2 text-sm focus:border-text-muted outline-none resize-none" 
                      placeholder="Cole o texto aqui..." 
                    />
                 </div>
                 <button 
                  onClick={handleAddArtifact}
                  disabled={!newArtifact.title || !newArtifact.content}
                  className="w-full py-2 bg-text-primary text-bg-primary rounded text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   Adicionar à Base
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Documentos Indexados</h2>
                <button 
                  onClick={() => setActiveTab('adicionar')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-default rounded text-xs hover:bg-bg-tertiary transition-colors"
                >
                  <Plus size={14} />
                  Novo Documento
                </button>
              </div>

              {loadingArtifacts ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Carregando documentos...</span>
                </div>
              ) : artifacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {artifacts.map((artifact) => (
                    <div key={artifact.id} className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col hover:border-text-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-accent-primary" />
                          <h4 className="font-medium text-text-primary truncate max-w-[200px]">{artifact.title}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                            <ExternalLink size={14} />
                          </button>
                          <button 
                            onClick={() => deleteArtifact(artifact.id)}
                            className="p-1.5 text-text-muted hover:text-accent-error transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-3 mb-4 flex-1">
                        {artifact.content}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span className="bg-bg-tertiary px-2 py-0.5 rounded border border-border-default">
                          {artifact.artifact_type}
                        </span>
                        <span>{new Date(artifact.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted border border-dashed border-border-default rounded-lg">
                  <FileText size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Nenhum documento encontrado para este agente.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
