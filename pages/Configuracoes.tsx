import React, { useState, useEffect } from 'react';
import { Settings, Bell, Database, Key, Users, Webhook, Save, RefreshCw, CheckCircle } from 'lucide-react';

export const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'integracao' | 'usuarios'>('geral');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    webhookUrl: '',
    n8nWebhook: '',

    // Usuários
    maxUsers: 5,
    requireTwoFactor: false,
  });

  // Carregar do localStorage se existir
  useEffect(() => {
    const savedConfig = localStorage.getItem('mottivme_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // Simular save
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Persistir no localStorage
    localStorage.setItem('mottivme_config', JSON.stringify(config));

    setSaving(false);
    setShowSuccess(true);
    
    // Esconder mensagem de sucesso após 3 segundos
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'integracao', label: 'Integração', icon: Database },
    { id: 'usuarios', label: 'Usuários', icon: Users },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
            <Settings size={28} />
            Configurações
          </h1>
          <p className="text-text-secondary">Gerencie as configurações do sistema</p>
        </div>

        <div className="flex items-center gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 text-accent-success text-sm animate-in fade-in slide-in-from-right-4">
              <CheckCircle size={16} />
              Configurações salvas!
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Configurações Gerais</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nome do Sistema
                </label>
                <input
                  type="text"
                  value={config.systemName}
                  onChange={(e) => setConfig({...config, systemName: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Timezone
                </label>
                <select
                  value={config.timezone}
                  onChange={(e) => setConfig({...config, timezone: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                >
                  <option value="America/Sao_Paulo">Brasília (UTC-3)</option>
                  <option value="America/New_York">New York (UTC-5)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Idioma
                </label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig({...config, language: e.target.value})}
                  className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoApproval}
                    onChange={(e) => setConfig({...config, autoApproval: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary block">Auto-aprovação</span>
                    <span className="text-xs text-text-muted">Aprovar versões automaticamente após testes</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Notificações</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={config.emailNotifications}
                  onChange={(e) => setConfig({...config, emailNotifications: e.target.checked})}
                  className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-text-primary block">Notificações por Email</span>
                  <span className="text-xs text-text-muted">Receber updates importantes por email</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={config.testFailureAlerts}
                  onChange={(e) => setConfig({...config, testFailureAlerts: e.target.checked})}
                  className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-text-primary block">Alertas de Falha em Testes</span>
                  <span className="text-xs text-text-muted">Notificar quando um teste falhar</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={config.approvalRequests}
                  onChange={(e) => setConfig({...config, approvalRequests: e.target.checked})}
                  className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-text-primary block">Solicitações de Aprovação</span>
                  <span className="text-xs text-text-muted">Notificar sobre novas versões aguardando aprovação</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-tertiary rounded hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={config.weeklyReports}
                  onChange={(e) => setConfig({...config, weeklyReports: e.target.checked})}
                  className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-text-primary block">Relatórios Semanais</span>
                  <span className="text-xs text-text-muted">Receber resumo semanal de performance</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'integracao' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Integrações</h2>

            <div className="space-y-6">
              <div className="border border-border-default rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="text-accent-primary" size={24} />
                  <div>
                    <h3 className="font-medium text-text-primary">Supabase</h3>
                    <p className="text-xs text-text-muted">Banco de dados e autenticação</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Supabase URL
                    </label>
                    <input
                      type="text"
                      value={config.supabaseUrl}
                      onChange={(e) => setConfig({...config, supabaseUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="https://xxx.supabase.co"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Anon Key
                    </label>
                    <input
                      type="password"
                      value={config.supabaseKey}
                      className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                      disabled
                    />
                    <p className="text-xs text-text-muted mt-1">Configure via variáveis de ambiente</p>
                  </div>
                </div>
              </div>

              <div className="border border-border-default rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Webhook className="text-accent-success" size={24} />
                  <div>
                    <h3 className="font-medium text-text-primary">Webhooks</h3>
                    <p className="text-xs text-text-muted">Integrações externas via webhook</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Webhook de Notificações
                    </label>
                    <input
                      type="text"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="https://webhook.site/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      n8n Webhook URL
                    </label>
                    <input
                      type="text"
                      value={config.n8nWebhook}
                      onChange={(e) => setConfig({...config, n8nWebhook: e.target.value})}
                      className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="https://n8n.io/webhook/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Gerenciamento de Usuários</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Máximo de Usuários
                </label>
                <input
                  type="number"
                  value={config.maxUsers}
                  onChange={(e) => setConfig({...config, maxUsers: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.requireTwoFactor}
                    onChange={(e) => setConfig({...config, requireTwoFactor: e.target.checked})}
                    className="w-4 h-4 text-accent-primary rounded border-border-default focus:ring-accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary block">Autenticação 2FA</span>
                    <span className="text-xs text-text-muted">Requer autenticação de dois fatores</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
              <p className="text-sm text-text-muted">
                <strong className="text-text-primary">Nota:</strong> O gerenciamento completo de usuários está disponível através do Supabase Auth.
                Acesse o painel do Supabase para adicionar, remover ou gerenciar permissões de usuários.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
