import React, { useState } from 'react';
import { Users, Bell, Shield, DollarSign, Plug, LogOut } from 'lucide-react';
import { Button, Card, Badge, Input } from '../UI';
import { ConnectInstagram } from '../settings/ConnectInstagram';
import { useAuth } from '../../contexts/AuthContext';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing' | 'integrations';

export const SettingsView = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
    }
  };

  // Get user info with fallbacks
  const userEmail = user?.email || 'usuario@exemplo.com';
  const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userInitials = userFullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie sua conta e preferências</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSignOut}
          disabled={loading}
          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 space-y-1">
          {[
            { id: 'profile' as const, label: 'Perfil', icon: Users },
            { id: 'integrations' as const, label: 'Integrações', icon: Plug },
            { id: 'notifications' as const, label: 'Notificações', icon: Bell },
            { id: 'security' as const, label: 'Segurança', icon: Shield },
            { id: 'billing' as const, label: 'Plano & Cobrança', icon: DollarSign },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Configurações do Perfil</h3>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {userInitials}
                </div>
                <div>
                  <Button variant="outline" className="text-sm">Alterar Foto</Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JPG, PNG máx 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome Completo</label>
                  <Input defaultValue={userFullName} className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                  <Input defaultValue={userEmail} disabled className="bg-slate-100 dark:bg-slate-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Empresa</label>
                  <Input defaultValue={user?.user_metadata?.company || ''} placeholder="Sua empresa" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Cargo</label>
                  <Input defaultValue={user?.user_metadata?.role || ''} placeholder="Seu cargo" className="bg-white dark:bg-slate-800" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Fuso Horário</label>
                  <select className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                    <option>America/Sao_Paulo (GMT-3)</option>
                    <option>America/New_York (GMT-5)</option>
                    <option>Europe/London (GMT+0)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button>Salvar Alterações</Button>
              </div>
            </Card>
          )}

          {/* Integrations Tab - NEW */}
          {activeTab === 'integrations' && (
            <Card className="p-6">
              <ConnectInstagram />
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Preferências de Notificação</h3>
              <div className="space-y-4">
                {[
                  { label: 'Respostas de leads', desc: 'Receba notificação quando leads respondem', email: true, push: true },
                  { label: 'Lembretes de reunião', desc: 'Lembretes antes de reuniões agendadas', email: true, push: true },
                  { label: 'Cadências finalizadas', desc: 'Quando uma cadência termina para um lead', email: false, push: true },
                  { label: 'Resumo diário', desc: 'Resumo diário das suas atividades', email: true, push: false },
                  { label: 'Relatório semanal', desc: 'Relatório semanal de performance', email: true, push: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={item.email} className="rounded text-blue-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={item.push} className="rounded text-blue-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">Push</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Configurações de Segurança</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Autenticação em Duas Etapas</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline">Ativar</Button>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Alterar Senha</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Última alteração há 30 dias</p>
                  </div>
                  <Button variant="outline">Alterar</Button>
                </div>
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Sessões Ativas</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">2 dispositivos conectados</p>
                  </div>
                  <Button variant="outline">Gerenciar</Button>
                </div>
              </div>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge color="yellow" className="mb-2">PLANO PRO</Badge>
                    <h3 className="text-2xl font-bold mb-1">R$ 297/mês</h3>
                    <p className="text-blue-100">Cobrança mensal • Renova em 15 Dez</p>
                  </div>
                  <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                    Fazer Upgrade
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Uso Este Mês</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Pesquisas LinkedIn', used: 850, limit: 1000 },
                    { label: 'Pesquisas Instagram', used: 320, limit: 500 },
                    { label: 'Créditos de IA', used: 2400, limit: 5000 },
                    { label: 'Membros do Time', used: 3, limit: 5 },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.used} / {item.limit}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${(item.used / item.limit) > 0.8 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${(item.used / item.limit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
