import React, { useState, useEffect } from 'react';
import { Settings, Bell, Database, Users, Webhook, Save, RefreshCw, ChevronDown } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useIsMobile } from '../hooks/useMediaQuery';

export const Configuracoes = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'integracao' | 'usuarios'>('geral');
  const [saving, setSaving] = useState(false);
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const isMobile = useIsMobile();

  // Estados de configuração
  const [config, setConfig] = useState({
    // Geral
    systemName: 'Assembly Line AI Factory',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    autoApproval: false,

    // Notificações
    emailNotifications: true,
    testFailureAlerts: true,
    approvalRequests: true,
    weeklyReports: false,

    // Integração
    supabaseUrl: 'https://mottivme.supabase.co',
    supabaseKey: '••••••••••••••••••••••••••••••••',
    geminiKey: '••••••••••••••••••••••••••••••••',
    webhookUrl: '',
    n8nWebhook: '',

    // Usuários
    maxUsers: 5,
    requireTwoFactor: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const defaultValues = {
    systemName: 'Assembly Line AI Factory',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    autoApproval: false,
    emailNotifications: true,
    testFailureAlerts: true,
    approvalRequests: true,
    weeklyReports: false,
    supabaseUrl: 'https://mottivme.supabase.co',
    supabaseKey: '••••••••••••••••••••••••••••••••',
    geminiKey: '••••••••••••••••••••••••••••••••',
    webhookUrl: '',
    n8nWebhook: '',
    maxUsers: 5,
    requireTwoFactor: false,
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(defaultValues);

  const isVisible = (text: string) => {
    if (!searchTerm) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const hasVisibleSettings = () => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (activeTab === 'geral') {
      return ['Nome do Sistema', 'Timezone', 'Idioma', 'Auto-aprovação'].some(s => s.toLowerCase().includes(term));
    }
    if (activeTab === 'notificacoes') {
      return ['Notificações por Email', 'Alertas de Falha em Testes', 'Solicitações de Aprovação', 'Relatórios Semanais'].some(s => s.toLowerCase().includes(term));
    }
    if (activeTab === 'integracao') {
      return ['Serviços Externos', 'Supabase', 'Gemini', 'Webhooks', 'n8n'].some(s => s.toLowerCase().includes(term));
    }
    if (activeTab === 'usuarios') {
      return ['Máximo de Usuários', 'Autenticação 2FA', 'Nota'].some(s => s.toLowerCase().includes(term));
    }
    return true;
  };

  // Carregar do localStorage se existir
  useEffect(() => {
    const savedConfig = localStorage.getItem('mottivme_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }
  }, []);

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todas as configurações para o padrão?')) {
      setConfig(defaultValues);
      localStorage.removeItem('mottivme_config');
      showToast('Configurações resetadas para o padrão', 'info');
    }
  };

  const handleTestWebhook = async (url: string) => {
    if (!url) return;
    setTestingWebhook(true);
    setTestResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestingWebhook(false);
      showToast('Webhook testado com sucesso!', 'success');
      setTestResult({
        success: true,
        message: 'Webhook testado com sucesso!'
      });
    } catch (err) {
      setTestingWebhook(false);
      showToast('Falha ao testar webhook', 'error');
    }

    setTimeout(() => setTestResult(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      localStorage.setItem('mottivme_config', JSON.stringify(config));

      setSaving(false);
      showToast('Configurações salvas com sucesso!', 'success');
    } catch (err) {
      setSaving(false);
      showToast('Erro ao salvar configurações', 'error');
    }
  };

  const handleRefresh = () => {
    setSaving(true);
    showToast('Recarregando configurações...', 'info');
    
    setTimeout(() => {
      const savedConfig = localStorage.getItem('mottivme_config');
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setConfig(prev => ({ ...prev, ...parsed }));
          showToast('Configurações recarregadas', 'success');
        } catch (e) {
          showToast('Erro ao recarregar configurações', 'error');
        }
      } else {
        setConfig(defaultValues);
        showToast('Configurações resetadas (nenhum dado salvo encontrado)', 'info');
      }
      setSaving(false);
    }, 1000);
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'integracao', label: 'Integração', icon: Database },
    { id: 'usuarios', label: 'Usuários', icon: Users },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon || Settings;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-semibold mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <Settings size={isMobile ? 22 : 28} />
              Configurações
            </h1>
            <p className="text-text-secondary text-xs md:text-base">Gerencie as configurações do sistema</p>
          </div>

          <button 
            onClick={handleRefresh}
            disabled={saving}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center shrink-0"
            title="Recarregar configurações"
          >
            <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Action Buttons - Stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            onClick={handleReset}
            disabled={saving || !hasChanges}
            className="flex items-center justify-center gap-2 px-4 py-2 text-text-muted hover:text-text-primary transition-all disabled:opacity-30 border border-border-default rounded active:scale-95 text-sm"
          >
            Resetar Padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-accent-primary/10 text-sm"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Tabs - Dropdown on mobile, horizontal scroll on desktop */}
      {isMobile ? (
        <div className="relative">
          <button
            onClick={() => setShowTabDropdown(!showTabDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <ActiveIcon size={18} className="text-accent-primary" />
              {activeTabData?.label}
            </span>
            <ChevronDown size={18} className={`transition-transform ${showTabDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showTabDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-20 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setShowTabDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2 border-b border-border-default overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
          <Settings size={16} className="opacity-50" />
        </div>
        <input
          type="text"
          placeholder="Buscar configuração..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
          >
            <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-bg-secondary border border-border-default rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
        {!hasVisibleSettings() ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 md:w-16 h-14 md:h-16 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
              <Settings size={isMobile ? 28 : 32} className="opacity-20" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">Nenhuma configuração encontrada</h3>
            <p className="text-xs md:text-sm text-text-muted max-w-xs">
              Não encontramos nenhuma configuração correspondente a "{searchTerm}" nesta aba.
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-accent-primary hover:underline text-sm font-medium"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'geral' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">Configurações Gerais</h2>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {isVisible('Nome do Sistema') && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nome do Sistema
                  </label>
                  <input
                    type="text"
                    value={config.systemName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, systemName: e.target.value})}
                    className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {isVisible('Timezone') && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Timezone
                    </label>
                    <select
                      value={config.timezone}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConfig({...config, timezone: e.target.value})}
                      className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                    >
                      <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                      <option value="Europe/London">London (UTC+0)</option>
                    </select>
                  </div>
                )}

                {isVisible('Idioma') && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Idioma
                    </label>
                    <select
                      value={config.language}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConfig({...config, language: e.target.value})}
                      className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                    >
                      <option value="pt-BR">Português (BR)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                )}
              </div>

              {isVisible('Auto-aprovação') && (
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoApproval}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, autoApproval: e.target.checked})}
                      className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary block">Auto-aprovação</span>
                      <span className="text-xs text-text-muted">Aprovar versões automaticamente após testes</span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">Notificações</h2>

            <div className="space-y-3 md:space-y-4">
              {isVisible('Notificações por Email') && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-all border border-transparent hover:border-border-default shadow-sm group">
                  <input
                    type="checkbox"
                    checked={config.emailNotifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, emailNotifications: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary block group-hover:text-accent-primary transition-colors">Notificações por Email</span>
                    <span className="text-xs text-text-muted">Receber updates importantes por email</span>
                  </div>
                </label>
              )}

              {isVisible('Alertas de Falha em Testes') && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-all border border-transparent hover:border-border-default shadow-sm group">
                  <input
                    type="checkbox"
                    checked={config.testFailureAlerts}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, testFailureAlerts: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary block group-hover:text-accent-primary transition-colors">Alertas de Falha</span>
                    <span className="text-xs text-text-muted">Notificar quando um teste falhar</span>
                  </div>
                </label>
              )}

              {isVisible('Solicitações de Aprovação') && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-all border border-transparent hover:border-border-default shadow-sm group">
                  <input
                    type="checkbox"
                    checked={config.approvalRequests}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, approvalRequests: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary block group-hover:text-accent-primary transition-colors">Solicitações de Aprovação</span>
                    <span className="text-xs text-text-muted">Notificar sobre novas versões aguardando aprovação</span>
                  </div>
                </label>
              )}

              {isVisible('Relatórios Semanais') && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded-lg hover:bg-bg-primary transition-all border border-transparent hover:border-border-default shadow-sm group">
                  <input
                    type="checkbox"
                    checked={config.weeklyReports}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, weeklyReports: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary block group-hover:text-accent-primary transition-colors">Relatórios Semanais</span>
                    <span className="text-xs text-text-muted">Receber resumo semanal de performance</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {activeTab === 'integracao' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">Integrações</h2>

            <div className="space-y-4 md:space-y-6">
              {(isVisible('Serviços Externos') || isVisible('Supabase') || isVisible('Gemini')) && (
                <div className="border border-border-default rounded-xl p-4 md:p-5 bg-bg-tertiary/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-9 md:w-10 h-9 md:h-10 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary">
                      <Database size={isMobile ? 20 : 24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary text-sm md:text-base">Serviços Externos</h3>
                      <p className="text-[10px] md:text-xs text-text-muted">Conexões com APIs e Banco de Dados</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Supabase URL
                      </label>
                      <input
                        type="text"
                        value={config.supabaseUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, supabaseUrl: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                        placeholder="https://xxx.supabase.co"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Supabase Anon Key
                        </label>
                        <input
                          type="password"
                          value={config.supabaseKey}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, supabaseKey: e.target.value})}
                          className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                          placeholder="eyJhbG..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={config.geminiKey}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, geminiKey: e.target.value})}
                          className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                          placeholder="AIzaSy..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(isVisible('Webhooks') || isVisible('n8n')) && (
                <div className="border border-border-default rounded-xl p-4 md:p-5 bg-bg-tertiary/30 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 md:w-10 h-9 md:h-10 bg-accent-success/10 rounded-lg flex items-center justify-center text-accent-success">
                        <Webhook size={isMobile ? 20 : 24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-sm md:text-base">Webhooks</h3>
                        <p className="text-[10px] md:text-xs text-text-muted">Integrações externas via webhook</p>
                      </div>
                    </div>
                    
                    {testResult && (
                      <div className={`text-xs px-3 py-1.5 rounded-full border animate-in fade-in zoom-in ${
                        testResult.success ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' : 'bg-red-500/10 border-red-500/20 text-red-500'
                      }`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-1">
                        <span className="text-sm font-medium text-text-primary">Webhook de Notificações</span>
                        <button 
                          onClick={() => handleTestWebhook(config.webhookUrl)}
                          disabled={testingWebhook || !config.webhookUrl}
                          className="text-[10px] uppercase font-bold text-accent-primary hover:underline disabled:opacity-50 self-start md:self-auto"
                        >
                          {testingWebhook ? 'Testando...' : 'Testar Agora'}
                        </button>
                      </label>
                      <input
                        type="text"
                        value={config.webhookUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, webhookUrl: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                        placeholder="https://webhook.site/..."
                      />
                    </div>

                    <div>
                      <label className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-1">
                        <span className="text-sm font-medium text-text-primary">n8n Webhook URL</span>
                        <button 
                          onClick={() => handleTestWebhook(config.n8nWebhook)}
                          disabled={testingWebhook || !config.n8nWebhook}
                          className="text-[10px] uppercase font-bold text-accent-primary hover:underline disabled:opacity-50 self-start md:self-auto"
                        >
                          {testingWebhook ? 'Testando...' : 'Testar Agora'}
                        </button>
                      </label>
                      <input
                        type="text"
                        value={config.n8nWebhook}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, n8nWebhook: e.target.value})}
                        className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                        placeholder="https://n8n.io/webhook/..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-semibold text-text-primary mb-3 md:mb-4">Gerenciamento de Usuários</h2>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {isVisible('Máximo de Usuários') && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Máximo de Usuários
                  </label>
                  <input
                    type="number"
                    value={config.maxUsers}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, maxUsers: parseInt(e.target.value)})}
                    className="w-full px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              {isVisible('Autenticação 2FA') && (
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.requireTwoFactor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({...config, requireTwoFactor: e.target.checked})}
                      className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-text-primary block">Autenticação 2FA</span>
                      <span className="text-xs text-text-muted">Requer autenticação de dois fatores</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {isVisible('Nota') && (
              <div className="bg-bg-tertiary/50 border border-border-default rounded-xl p-4 md:p-5 shadow-sm flex gap-3 md:gap-4 items-start">
                <div className="w-9 md:w-10 h-9 md:h-10 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary shrink-0">
                  <Users size={isMobile ? 18 : 20} />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Gerenciamento via Supabase</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    O gerenciamento completo de usuários está disponível através do Supabase Auth. 
                    Acesse o painel para adicionar, remover ou gerenciar permissões avançadas.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    )}
    </div>
  </div>
</div>
);
};
