import React, { useState, useEffect } from 'react';
import { useAgents, useAgentVersions } from '../hooks';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { Save, Play, Plus, CheckCircle2, AlertCircle, FileCode, ChevronDown, Bot, Zap, Box, GitBranch, RefreshCw, FileText, MessageSquare, X } from 'lucide-react';
import { AgentVersion, Agent } from './types';
import { AdjustmentsChat } from '../components/AdjustmentsChat';

export const PromptEditor = () => {
  const { showToast } = useToast();
  const { agents, loading: agentsLoading, refetch: refetchAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [showAdjustmentsChat, setShowAdjustmentsChat] = useState(false);
  
  // Set default agent when loaded
  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const { versions, loading: versionsLoading, refetch: refetchVersions } = useAgentVersions(selectedAgentId);
  const [activeVersionId, setActiveVersionId] = useState<string>('');
  const [code, setCode] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'config' | 'modes'>('prompt');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [config, setConfig] = useState('{}');

  const handleRefresh = async () => {
    showToast('Atualizando dados do editor...', 'info');
    await Promise.all([
      refetchAgents(),
      refetchVersions()
    ]);
    showToast('Dados atualizados com sucesso', 'success');
  };

  // Set active version when versions load
  useEffect(() => {
    if (versions.length > 0) {
      // Default to the most recent version (first in list due to sorting)
      if (!activeVersionId || !versions.find((v: AgentVersion) => v.id === activeVersionId)) {
        const latest = versions[0];
        setActiveVersionId(latest.id);
        setCode(latest.system_prompt);
        setConfig(JSON.stringify(latest.hyperpersonalization || {}, null, 2));
        
        const modes = Object.keys(latest.prompts_por_modo || {});
        if (modes.length > 0) {
          setSelectedMode(modes[0]);
        }
      }
    } else {
      setActiveVersionId('');
      setCode('');
      setConfig('{}');
    }
  }, [versions, activeVersionId]);

  const activeVersion = versions.find((v: AgentVersion) => v.id === activeVersionId);

  // Update code when switching versions or tabs
  const handleVersionClick = (version: AgentVersion) => {
    setActiveVersionId(version.id);
    if (activeTab === 'prompt') {
      setCode(version.system_prompt);
    } else if (activeTab === 'modes' && selectedMode) {
      setCode(version.prompts_por_modo?.[selectedMode] || '');
    }
    setConfig(JSON.stringify(version.hyperpersonalization || {}, null, 2));
    setIsDirty(false);
  };

  const handleTabChange = (tab: 'prompt' | 'config' | 'modes') => {
    setActiveTab(tab);
    if (!activeVersion) return;

    if (tab === 'prompt') {
      setCode(activeVersion.system_prompt);
    } else if (tab === 'modes') {
      const modes = Object.keys(activeVersion.prompts_por_modo || {});
      if (modes.length > 0 && !selectedMode) {
        setSelectedMode(modes[0]);
        setCode(activeVersion.prompts_por_modo?.[modes[0]] || '');
      } else if (selectedMode) {
        setCode(activeVersion.prompts_por_modo?.[selectedMode] || '');
      }
    }
  };

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode);
    if (activeVersion) {
      setCode(activeVersion.prompts_por_modo?.[mode] || '');
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsDirty(true);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(e.target.value);
    setIsDirty(true);
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!selectedAgent || !activeVersionId) return;
    
    setIsPublishing(true);
    try {
      // 1. Marcar todas as outras versões deste cliente como inativas
      await supabase
        .from('agent_versions')
        .update({ is_active: false, validation_status: 'archived' })
        .eq('client_id', selectedAgentId)
        .neq('id', activeVersionId);

      // 2. Marcar esta versão como ativa e em produção
      const { error } = await supabase
        .from('agent_versions')
        .update({ 
          is_active: true, 
          validation_status: 'active',
          deployed_at: new Date().toISOString()
        })
        .eq('id', activeVersionId);

      if (error) throw error;
      
      showToast(`Versão ${activeVersion?.version_number || activeVersion?.version} publicada com sucesso!`, 'success');
      refetchVersions();
    } catch (err: any) {
      console.error('Error publishing version:', err);
      showToast('Erro ao publicar versão: ' + err.message, 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAgent || !activeVersionId) return;
    
    setIsSaving(true);
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(config);
      } catch (e) {
        showToast('Erro no JSON de Hiperpersonalização', 'error');
        setIsSaving(false);
        return;
      }

      const updateData: any = {
        hyperpersonalization: parsedConfig,
        updated_at: new Date().toISOString()
      };

      if (activeTab === 'prompt') {
        updateData.system_prompt = code;
      } else if (activeTab === 'modes' && selectedMode) {
        const newModes = { ...(activeVersion?.prompts_por_modo || {}) };
        newModes[selectedMode] = code;
        updateData.prompts_por_modo = newModes;
      }

      const { error } = await supabase
        .from('agent_versions')
        .update(updateData)
        .eq('id', activeVersionId);

      if (error) throw error;
      
      setIsDirty(false);
      showToast('Alterações salvas com sucesso!', 'success');
      refetchVersions();
    } catch (err: any) {
      console.error('Error saving version:', err);
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedAgent || !activeVersion) return;
    
    const currentVersionStr = activeVersion.version_number || activeVersion.version || 'v1.0';
    const nextVersion = `v${(parseFloat(currentVersionStr.replace('v', '')) + 0.1).toFixed(1)}`;
    
    try {
      const { data, error } = await supabase
        .from('agent_versions')
        .insert([{
          client_id: selectedAgentId,
          version_number: nextVersion,
          system_prompt: activeVersion.system_prompt,
          prompts_por_modo: activeVersion.prompts_por_modo,
          hyperpersonalization: activeVersion.hyperpersonalization,
          validation_status: 'draft',
          is_active: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      showToast(`Nova versão ${nextVersion} criada!`, 'success');
      refetchVersions();
      setActiveVersionId(data.id);
    } catch (err: any) {
      showToast('Erro ao criar versão: ' + err.message, 'error');
    }
  };

  const loadFromKnowledgeBase = async () => {
    if (!selectedAgentId) return;
    
    showToast('Buscando dados na Base de Conhecimento...', 'info');
    try {
      const { data, error } = await supabase
        .from('factory_artifacts')
        .select('*')
        .eq('client_id', selectedAgentId)
        .or('type.eq.onboarding_summary,type.eq.persona_doc')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const content = data[0].content;
        // Tentar extrair JSON se existir, senão colocar como string em uma chave
        let newConfig = {};
        try {
          newConfig = JSON.parse(content);
        } catch (e) {
          newConfig = { context_summary: content };
        }
        
        setConfig(JSON.stringify(newConfig, null, 2));
        setIsDirty(true);
        showToast('Dados carregados com sucesso!', 'success');
      } else {
        showToast('Nenhum dado encontrado na Base de Conhecimento para este agente.', 'warning');
      }
    } catch (err: any) {
      showToast('Erro ao carregar dados: ' + err.message, 'error');
    }
  };

  const handleSandbox = () => {
    if (!selectedAgent) return;
    setIsSandboxLoading(true);
    setTimeout(() => {
      setIsSandboxLoading(false);
      alert(`Ambiente de Sandbox inicializado para o agente: ${selectedAgent.name}. Você pode testar as alterações em tempo real agora.`);
    }, 1500);
  };

  const handleApplyAdjustment = async (zone: string, newContent: string) => {
    if (!selectedAgent || !activeVersionId) return;

    try {
      // Criar nova versao com a mudanca
      const currentVersionStr = activeVersion?.version_number || activeVersion?.version || 'v1.0';
      const nextVersion = `v${(parseFloat(currentVersionStr.replace('v', '')) + 0.1).toFixed(1)}`;

      const updateData: any = {
        client_id: selectedAgentId,
        version_number: nextVersion,
        system_prompt: activeVersion?.system_prompt || '',
        prompts_por_modo: activeVersion?.prompts_por_modo || {},
        hyperpersonalization: activeVersion?.hyperpersonalization || {},
        validation_status: 'draft',
        is_active: false,
        change_log: `Ajuste via Chat CS na zona: ${zone}`
      };

      // Aplicar mudanca baseada na zona
      if (zone === 'hyperpersonalization') {
        try {
          const currentConfig = activeVersion?.hyperpersonalization || {};
          updateData.hyperpersonalization = {
            ...currentConfig,
            cs_adjustment: newContent,
            adjusted_at: new Date().toISOString()
          };
        } catch (e) {
          updateData.hyperpersonalization = { cs_adjustment: newContent };
        }
      } else if (zone === 'guardrails' || zone === 'few_shot') {
        // Adicionar ao system prompt
        updateData.system_prompt = `${activeVersion?.system_prompt || ''}\n\n<!-- CS Adjustment (${zone}) -->\n${newContent}`;
      }

      const { data, error } = await supabase
        .from('agent_versions')
        .insert([updateData])
        .select()
        .single();

      if (error) throw error;

      showToast(`Ajuste aplicado! Nova versao ${nextVersion} criada.`, 'success');
      refetchVersions();
      setActiveVersionId(data.id);
    } catch (err: any) {
      showToast('Erro ao aplicar ajuste: ' + err.message, 'error');
      throw err;
    }
  };

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

  const selectedAgent = agents.find((a: Agent) => a.id === selectedAgentId);

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]">
      {/* Studio Header */}
      <div className="h-14 border-b border-border-default flex items-center justify-between px-6 bg-bg-secondary shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-text-primary flex items-center gap-2">
            <Box size={20} className="text-accent-primary" />
            Prompt Studio
          </h1>
          
          <button 
            onClick={handleRefresh}
            disabled={agentsLoading || versionsLoading}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-all active:scale-95 disabled:opacity-50"
            title="Atualizar agentes e versões"
          >
            <RefreshCw size={16} className={(agentsLoading || versionsLoading) ? 'animate-spin' : ''} />
          </button>

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
              onClick={() => handleTabChange('prompt')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'prompt' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              System Prompt
            </button>
            <button 
              onClick={() => handleTabChange('modes')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'modes' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Modos de Operação
            </button>
            <button 
              onClick={() => handleTabChange('config')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'config' ? 'bg-bg-secondary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Hiperpersonalização
            </button>
          </div>

          <div className="h-4 w-px bg-border-default"></div>

          {activeTab === 'modes' && (
            <div className="flex items-center gap-2">
              <select 
                value={selectedMode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="bg-bg-tertiary border border-border-default text-xs rounded px-2 py-1 text-text-primary focus:outline-none"
              >
                {activeVersion?.prompts_por_modo && Object.keys(activeVersion.prompts_por_modo).length > 0 ? (
                  Object.keys(activeVersion.prompts_por_modo).map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))
                ) : (
                  <option value="">Sem modos configurados</option>
                )}
              </select>
            </div>
          )}

          <div className="h-4 w-px bg-border-default"></div>

          <div className="flex items-center gap-2 text-sm text-text-muted">
             <span>Versão:</span>
             <span className="text-text-primary font-mono bg-bg-tertiary px-1.5 py-0.5 rounded border border-border-default">
                {activeVersion ? (activeVersion.version_number || activeVersion.version) : '---'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={() => setShowAdjustmentsChat(!showAdjustmentsChat)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
              showAdjustmentsChat
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:bg-bg-hover'
            }`}
            title="Chat de Ajustes para CS"
           >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Chat CS</span>
          </button>
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
            disabled={!isDirty || isSaving}
            className={`
              flex items-center gap-2 px-4 py-1.5 text-sm rounded transition-colors ml-2
              ${isDirty 
                ? 'bg-text-primary text-bg-primary hover:bg-white/90' 
                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}
            `}
          >
            <Save size={16} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>

          {activeVersion?.status !== 'production' && (
            <button 
              onClick={handlePublish}
              disabled={isPublishing || isDirty}
              className={`
                flex items-center gap-2 px-4 py-1.5 text-sm rounded transition-colors ml-2
                ${!isDirty && !isPublishing
                  ? 'bg-accent-primary text-white hover:bg-accent-primary/90' 
                  : 'bg-bg-tertiary text-text-muted cursor-not-allowed'}
              `}
              title={isDirty ? "Salve as alterações antes de publicar" : "Publicar esta versão em produção"}
            >
              <Zap size={16} className={isPublishing ? 'animate-pulse' : ''} />
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Version List (Left Sidebar) */}
        <div className="w-64 border-r border-border-default bg-bg-secondary flex flex-col">
          <div className="p-3 border-b border-border-default flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Histórico de Versões</span>
            <button 
              onClick={handleCreateVersion}
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

            {versions.map((v: AgentVersion) => (
              <div 
                key={v.id}
                onClick={() => handleVersionClick(v)}
                className={`
                  group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                  ${activeVersionId === v.id ? 'bg-bg-hover' : 'hover:bg-bg-hover'}
                `}
              >
                  <div className={`text-xs ${getStatusColor(v.validation_status || v.status)}`}>
                   {(v.validation_status || v.status) === 'production' || (v.validation_status || v.status) === 'active' ? <CheckCircle2 size={14} /> : 
                    (v.validation_status || v.status) === 'archived' ? <AlertCircle size={14} /> : 
                    <FileCode size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className={`text-sm font-medium ${activeVersionId === v.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {v.version_number || v.version || 'v?'}
                    </div>
                    {v.is_active && (
                       <span className="text-[10px] bg-accent-success/20 text-accent-success px-1.5 py-0.5 rounded border border-accent-success/30">Ativo</span>
                    )}
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
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col items-end pt-4 pr-2 text-text-muted/50 font-mono text-sm select-none z-10">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          {activeTab === 'prompt' || activeTab === 'modes' ? (
            <textarea
              value={code}
              onChange={handlePromptChange}
              spellCheck="false"
              placeholder={!selectedAgentId ? "Selecione um agente para ver o prompt." : "Nenhum prompt carregado."}
              className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-6"
              style={{ tabSize: 2 }}
            />
          ) : (
            <div className="flex-1 flex flex-col relative">
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={loadFromKnowledgeBase}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border-default rounded-md transition-colors shadow-sm"
                  title="Puxar dados do onboarding na Base de Conhecimento"
                >
                  <FileText size={14} />
                  Carregar da Base de Conhecimento
                </button>
              </div>
              <textarea
                 value={config}
                 onChange={handleConfigChange}
                 spellCheck="false"
                 placeholder='{ "config": "value" }'
                 className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 pl-12 resize-none focus:outline-none leading-6"
                 style={{ tabSize: 2 }}
               />
            </div>
          )}
        </div>

        {/* Configuration Sidebar (Right) - Shows Chat or Details */}
        <div className={`${showAdjustmentsChat ? 'w-96' : 'w-72'} border-l border-border-default bg-bg-secondary flex flex-col overflow-hidden transition-all`}>
          {showAdjustmentsChat ? (
            /* Chat de Ajustes */
            <AdjustmentsChat
              agentId={selectedAgentId}
              agentName={selectedAgent?.name || 'Agente'}
              currentPrompt={code}
              onApplyChanges={handleApplyAdjustment}
              onClose={() => setShowAdjustmentsChat(false)}
            />
          ) : (
            /* Detalhes da Versao */
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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                        (activeVersion?.validation_status || activeVersion?.status) === 'production' || (activeVersion?.validation_status || activeVersion?.status) === 'active' ? 'bg-accent-success' : 'bg-accent-warning'
                        }`}></span>
                        <span className="text-sm font-medium capitalize">{activeVersion?.validation_status || activeVersion?.status || 'Draft'}</span>
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

                {activeVersion?.prompts_por_modo && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Modos Especificos</label>
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

                {/* Botao para abrir Chat CS */}
                <button
                  onClick={() => setShowAdjustmentsChat(true)}
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
          )}
        </div>
      </div>
    </div>
  );
};

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
);
