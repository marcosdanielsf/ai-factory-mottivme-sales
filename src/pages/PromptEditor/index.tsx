import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAgents, useAgentVersions } from '../../hooks';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { Sparkles, Code, Shield, Brain, Target, Briefcase, FileText } from 'lucide-react';
import { AgentVersion, Agent } from '../../types';
import { PromptEngineerChat } from '../../components/PromptEngineerChat';
import { EditorHeader } from './components/EditorHeader';
import { VersionSidebar } from './components/VersionSidebar';
import { VersionDetails } from './components/VersionDetails';

export const PromptEditor: React.FC = () => {
  const { showToast } = useToast();
  const { agents, loading: agentsLoading, refetch: refetchAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const agentSearchInputRef = useRef<HTMLInputElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);
  const [showAdjustmentsChat, setShowAdjustmentsChat] = useState(false);

  // Filtered agents based on search
  const filteredAgents = useMemo(() => {
    if (!agentSearchTerm.trim()) return agents;
    const term = agentSearchTerm.toLowerCase();
    return agents.filter((a: Agent) => a.name.toLowerCase().includes(term));
  }, [agents, agentSearchTerm]);

  // Focus search input when agent menu opens
  useEffect(() => {
    if (isAgentMenuOpen && agentSearchInputRef.current) {
      setTimeout(() => agentSearchInputRef.current?.focus(), 50);
    }
    if (!isAgentMenuOpen) setAgentSearchTerm('');
  }, [isAgentMenuOpen]);

  // Close agent menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
    };
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAgentMenuOpen]);

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
  const [activeTab, setActiveTab] = useState<'prompt' | 'config' | 'modes' | 'tools' | 'compliance' | 'personality' | 'qualification' | 'business'>('prompt');
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

  const handleTabChange = (tab: 'prompt' | 'config' | 'modes' | 'tools' | 'compliance' | 'personality' | 'qualification' | 'business') => {
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
    } else if (tab === 'tools') {
      setConfig(JSON.stringify(activeVersion.tools_config || {}, null, 2));
    } else if (tab === 'compliance') {
      setConfig(JSON.stringify(activeVersion.compliance_rules || {}, null, 2));
    } else if (tab === 'personality') {
      setConfig(JSON.stringify(activeVersion.personality_config || {}, null, 2));
    } else if (tab === 'qualification') {
      setConfig(JSON.stringify(activeVersion.qualification_config || {}, null, 2));
    } else if (tab === 'business') {
      setConfig(JSON.stringify(activeVersion.business_config || {}, null, 2));
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
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const handleToggleActive = async () => {
    if (!activeVersionId || !activeVersion) return;

    setIsTogglingActive(true);
    try {
      const newIsActive = !activeVersion.is_active;
      const newStatus = newIsActive ? 'active' : 'inactive';

      // Se estamos ativando, precisamos desativar outras versões deste cliente
      if (newIsActive) {
        await supabase
          .from('agent_versions')
          .update({ is_active: false, validation_status: 'inactive' })
          .eq('client_id', selectedAgentId)
          .neq('id', activeVersionId);
      }

      const { error } = await supabase
        .from('agent_versions')
        .update({
          is_active: newIsActive,
          validation_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeVersionId);

      if (error) throw error;

      showToast(
        newIsActive
          ? `✅ Agente ativado! Versão ${activeVersion?.version_number || activeVersion?.version} agora está em produção.`
          : `⏸️ Agente desativado. Versão ${activeVersion?.version_number || activeVersion?.version} pausada.`,
        newIsActive ? 'success' : 'info'
      );
      refetchVersions();
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      showToast('Erro ao alterar status: ' + err.message, 'error');
    } finally {
      setIsTogglingActive(false);
    }
  };

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

  const handleApplyAdjustment = async (zone: string, newContent: any, fieldPath?: string) => {
    if (!selectedAgent || !activeVersionId) return;

    try {
      // Criar nova versao com a mudanca
      const currentVersionStr = activeVersion?.version_number || activeVersion?.version || 'v1.0';
      const nextVersion = `v${(parseFloat(currentVersionStr.replace('v', '')) + 0.1).toFixed(1)}`;

      // Copiar dados atuais
      const updateData: any = {
        client_id: selectedAgentId,
        version_number: nextVersion,
        system_prompt: activeVersion?.system_prompt || '',
        prompts_by_mode: activeVersion?.prompts_by_mode || {},
        hyperpersonalization: activeVersion?.hyperpersonalization || {},
        compliance_rules: activeVersion?.compliance_rules || {},
        personality_config: activeVersion?.personality_config || {},
        business_config: activeVersion?.business_config || {},
        tools_config: activeVersion?.tools_config || {},
        validation_status: 'draft',
        is_active: false,
        change_log: `[Engenheiro de Prompts] Ajuste em ${zone}${fieldPath ? ` (${fieldPath})` : ''}`
      };

      // Aplicar mudanca baseada na zona
      switch (zone) {
        case 'system_prompt':
          // Se tem fieldPath, adicionar na seção específica
          if (fieldPath && fieldPath !== 'system_prompt') {
            const sectionTag = fieldPath.replace('system_prompt.', '');
            const sectionRegex = new RegExp(`(<${sectionTag}>)([\\s\\S]*?)(<\\/${sectionTag}>)`);
            if (sectionRegex.test(updateData.system_prompt)) {
              // Adicionar ao final da seção existente
              updateData.system_prompt = updateData.system_prompt.replace(
                sectionRegex,
                `$1$2\n\n${newContent}\n$3`
              );
            } else {
              // Seção não existe, adicionar ao final
              updateData.system_prompt += `\n\n<${sectionTag}>\n${newContent}\n</${sectionTag}>`;
            }
          } else {
            // Adicionar ao final do prompt
            updateData.system_prompt += `\n\n<!-- Engenheiro de Prompts -->\n${newContent}`;
          }
          break;

        case 'compliance_rules':
          const currentCompliance = { ...(activeVersion?.compliance_rules || {}) };
          if (fieldPath?.includes('.')) {
            const [, subField] = fieldPath.split('.');
            if (Array.isArray(currentCompliance[subField])) {
              currentCompliance[subField] = [...currentCompliance[subField], newContent];
            } else {
              currentCompliance[subField] = newContent;
            }
          } else {
            currentCompliance.adjustments = currentCompliance.adjustments || [];
            currentCompliance.adjustments.push({ content: newContent, timestamp: new Date().toISOString() });
          }
          updateData.compliance_rules = currentCompliance;
          break;

        case 'personality_config':
          const currentPersonality = { ...(activeVersion?.personality_config || {}) };
          if (fieldPath?.includes('.')) {
            const pathParts = fieldPath.split('.');
            let target = currentPersonality;
            for (let i = 1; i < pathParts.length - 1; i++) {
              target[pathParts[i]] = target[pathParts[i]] || {};
              target = target[pathParts[i]];
            }
            target[pathParts[pathParts.length - 1]] = newContent;
          } else {
            Object.assign(currentPersonality, typeof newContent === 'object' ? newContent : { tom_voz: newContent });
          }
          updateData.personality_config = currentPersonality;
          break;

        case 'business_config':
          const currentBusiness = { ...(activeVersion?.business_config || {}) };
          if (fieldPath?.includes('.')) {
            const pathParts = fieldPath.split('.');
            let target = currentBusiness;
            for (let i = 1; i < pathParts.length - 1; i++) {
              target[pathParts[i]] = target[pathParts[i]] || {};
              target = target[pathParts[i]];
            }
            target[pathParts[pathParts.length - 1]] = newContent;
          } else {
            Object.assign(currentBusiness, typeof newContent === 'object' ? newContent : {});
          }
          updateData.business_config = currentBusiness;
          break;

        case 'tools_config':
          const currentTools = { ...(activeVersion?.tools_config || {}) };
          if (fieldPath?.includes('.')) {
            const pathParts = fieldPath.split('.');
            let target = currentTools;
            for (let i = 1; i < pathParts.length - 1; i++) {
              target[pathParts[i]] = target[pathParts[i]] || {};
              target = target[pathParts[i]];
            }
            target[pathParts[pathParts.length - 1]] = newContent;
          } else {
            Object.assign(currentTools, typeof newContent === 'object' ? newContent : {});
          }
          updateData.tools_config = currentTools;
          break;

        case 'hyperpersonalization':
          const currentHyper = { ...(activeVersion?.hyperpersonalization || {}) };
          if (fieldPath?.includes('.')) {
            const pathParts = fieldPath.split('.');
            let target = currentHyper;
            for (let i = 1; i < pathParts.length - 1; i++) {
              target[pathParts[i]] = target[pathParts[i]] || {};
              target = target[pathParts[i]];
            }
            target[pathParts[pathParts.length - 1]] = newContent;
          } else {
            Object.assign(currentHyper, typeof newContent === 'object' ? newContent : {});
          }
          updateData.hyperpersonalization = currentHyper;
          break;

        case 'prompts_by_mode':
          const currentModes = { ...(activeVersion?.prompts_by_mode || {}) };
          if (fieldPath?.includes('.')) {
            const modeName = fieldPath.split('.')[1];
            currentModes[modeName] = newContent;
          } else {
            Object.assign(currentModes, typeof newContent === 'object' ? newContent : {});
          }
          updateData.prompts_by_mode = currentModes;
          break;

        default:
          // Fallback: adicionar ao system prompt
          updateData.system_prompt += `\n\n<!-- Ajuste (${zone}) -->\n${newContent}`;
      }

      const { data, error } = await supabase
        .from('agent_versions')
        .insert([updateData])
        .select()
        .single();

      if (error) throw error;

      showToast(`✅ Ajuste aplicado! Nova versão ${nextVersion} criada.`, 'success');
      refetchVersions();
      setActiveVersionId(data.id);
    } catch (err: any) {
      showToast('❌ Erro ao aplicar ajuste: ' + err.message, 'error');
      throw err;
    }
  };

  const selectedAgent = agents.find((a: Agent) => a.id === selectedAgentId);

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* Studio Header */}
      <EditorHeader
        selectedAgent={selectedAgent}
        isAgentMenuOpen={isAgentMenuOpen}
        agentSearchTerm={agentSearchTerm}
        agentsLoading={agentsLoading || versionsLoading}
        filteredAgents={filteredAgents}
        agentSearchInputRef={agentSearchInputRef}
        agentMenuRef={agentMenuRef}
        onAgentMenuToggle={() => setIsAgentMenuOpen(prev => !prev)}
        onAgentSearchChange={setAgentSearchTerm}
        onAgentSelect={(id) => { setSelectedAgentId(id); setIsAgentMenuOpen(false); }}
        activeTab={activeTab}
        selectedMode={selectedMode}
        activeVersion={activeVersion}
        onTabChange={handleTabChange}
        onModeChange={handleModeChange}
        isDirty={isDirty}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isSandboxLoading={isSandboxLoading}
        showAdjustmentsChat={showAdjustmentsChat}
        onSave={handleSave}
        onPublish={handlePublish}
        onSandbox={handleSandbox}
        onRefresh={handleRefresh}
        onToggleChat={() => setShowAdjustmentsChat(prev => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Version List (Left Sidebar) */}
        <VersionSidebar
          versions={versions}
          activeVersionId={activeVersionId}
          versionsLoading={versionsLoading}
          onVersionClick={handleVersionClick}
          onCreateVersion={handleCreateVersion}
        />

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
              {/* Header com nome da config ativa */}
              <div className="absolute top-4 left-14 z-20 flex items-center gap-2">
                {activeTab === 'config' && <span className="text-xs text-blue-400 font-medium flex items-center gap-1"><Sparkles size={12} /> Hiperpersonalização</span>}
                {activeTab === 'tools' && <span className="text-xs text-blue-400 font-medium flex items-center gap-1"><Code size={12} /> Tools Config</span>}
                {activeTab === 'compliance' && <span className="text-xs text-red-400 font-medium flex items-center gap-1"><Shield size={12} /> Compliance Rules</span>}
                {activeTab === 'personality' && <span className="text-xs text-blue-400 font-medium flex items-center gap-1"><Brain size={12} /> Personality Config</span>}
                {activeTab === 'qualification' && <span className="text-xs text-green-400 font-medium flex items-center gap-1"><Target size={12} /> Qualification Config</span>}
                {activeTab === 'business' && <span className="text-xs text-orange-400 font-medium flex items-center gap-1"><Briefcase size={12} /> Business Config</span>}
              </div>
              <div className="absolute top-4 right-4 z-20">
                {activeTab === 'config' && (
                  <button
                    onClick={loadFromKnowledgeBase}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border-default rounded-md transition-colors shadow-sm"
                    title="Puxar dados do onboarding na Base de Conhecimento"
                  >
                    <FileText size={14} />
                    Carregar da Base de Conhecimento
                  </button>
                )}
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
            /* Engenheiro de Prompts */
            <PromptEngineerChat
              agentId={selectedAgentId}
              agentName={selectedAgent?.name || 'Agente'}
              currentPrompt={code}
              currentConfigs={{
                hyperpersonalization: activeVersion?.hyperpersonalization,
                compliance_rules: activeVersion?.compliance_rules,
                personality_config: activeVersion?.personality_config,
                business_config: activeVersion?.business_config,
                tools_config: activeVersion?.tools_config,
                prompts_by_mode: activeVersion?.prompts_by_mode,
              }}
              onApplyChanges={handleApplyAdjustment}
              onClose={() => setShowAdjustmentsChat(false)}
            />
          ) : (
            /* Detalhes da Versao */
            <VersionDetails
              activeVersion={activeVersion}
              isTogglingActive={isTogglingActive}
              onToggleActive={handleToggleActive}
              onShowChat={() => setShowAdjustmentsChat(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
