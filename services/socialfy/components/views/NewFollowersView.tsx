import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Instagram,
  ExternalLink,
  AlertCircle,
  Plus,
  Settings,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Target,
  Zap,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  useNewFollowers,
  useMonitoredAccounts,
  useOutreachActions,
  useRateLimitStatus,
  OutreachStatus,
  NewFollower,
  AccountSummary,
} from '../../hooks/useNewFollowers';

export const NewFollowersView = () => {
  const { showToast } = useToast();

  // State
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<OutreachStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [selectedFollower, setSelectedFollower] = useState<NewFollower | null>(null);
  const [selectedFollowers, setSelectedFollowers] = useState<Set<string>>(new Set());
  const [outreachMessage, setOutreachMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [configAccount, setConfigAccount] = useState<AccountSummary | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const itemsPerPage = 10;

  // Templates de mensagem pre-definidos
  const messageTemplates = [
    {
      id: 'welcome_hot',
      name: 'Boas-vindas HOT',
      category: 'hot',
      message: `Oi {{nome}}! 👋

Vi que você começou a me seguir e adorei! Pelo seu perfil percebi que você trabalha com {{area}}.

Tenho ajudado profissionais como você a {{beneficio}}. Quer trocar uma ideia rápida sobre isso?`,
    },
    {
      id: 'welcome_warm',
      name: 'Boas-vindas WARM',
      category: 'warm',
      message: `Oi {{nome}}! 👋

Obrigado por me seguir! Vi seu perfil e achei bem interessante.

Trabalho com {{area}} e talvez possa te ajudar de alguma forma. Posso te mandar um material gratuito sobre isso?`,
    },
    {
      id: 'curiosity',
      name: 'Curiosidade',
      category: 'neutral',
      message: `Oi {{nome}}!

Obrigado por me seguir! 🙌 Fiquei curioso pra saber como me encontrou.

Trabalhando com algo relacionado a {{area}}?`,
    },
    {
      id: 'value_first',
      name: 'Valor Primeiro',
      category: 'hot',
      message: `Ei {{nome}}! 👋

Vi que você começou a me seguir e quero te dar algo de valor logo de cara!

Tenho um {{recurso}} que ajudou muita gente a {{beneficio}}. Quer que eu te envie?`,
    },
    {
      id: 'simple',
      name: 'Simples e Direto',
      category: 'neutral',
      message: `Oi {{nome}}! Obrigado por seguir! 🙌

Qualquer dúvida sobre {{area}}, só chamar!`,
    },
  ];

  // Funcao para aplicar template com variaveis
  const applyTemplate = (template: string, follower?: NewFollower | null) => {
    let msg = template;
    const nome = follower?.follower_full_name?.split(' ')[0] || follower?.follower_username || 'amigo(a)';
    msg = msg.replace(/\{\{nome\}\}/g, nome);
    msg = msg.replace(/\{\{username\}\}/g, follower?.follower_username || '');
    msg = msg.replace(/\{\{area\}\}/g, '[sua área]');
    msg = msg.replace(/\{\{beneficio\}\}/g, '[benefício]');
    msg = msg.replace(/\{\{recurso\}\}/g, '[recurso]');
    return msg;
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hooks
  const { accounts, loading: loadingAccounts, refetch: refetchAccounts, addAccount, updateAccount, deleteAccount } = useMonitoredAccounts();
  const { followers, totalCount, loading: loadingFollowers, error, refetch: refetchFollowers } = useNewFollowers({
    accountId: selectedAccountId,
    status: statusFilter,
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: itemsPerPage,
  });
  const { sendOutreach, skipFollower, bulkSendOutreach, bulkSkipFollowers, loading: actionLoading, lastError: outreachError } = useOutreachActions();
  const { status: rateLimitStatus, loading: rateLimitLoading } = useRateLimitStatus();

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handlers
  const handleRefresh = async () => {
    await Promise.all([refetchAccounts(), refetchFollowers()]);
    showToast({ type: 'info', message: 'Dados atualizados' });
  };

  const handleAddAccount = async () => {
    if (!newUsername.trim()) return;

    const defaultTenantId = '00000000-0000-0000-0000-000000000000';
    const result = await addAccount(newUsername, defaultTenantId);

    if (result) {
      showToast({ type: 'success', message: `Conta @${newUsername} adicionada` });
      setNewUsername('');
      setShowAddModal(false);
    } else {
      showToast({ type: 'error', message: 'Erro ao adicionar conta' });
    }
  };

  const handleToggleOutreach = async (account: AccountSummary) => {
    const result = await updateAccount(account.id, {
      outreach_enabled: !account.outreach_enabled,
    });

    if (result) {
      showToast({
        type: 'info',
        message: account.outreach_enabled ? 'Outreach desativado' : 'Outreach ativado',
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!configAccount) return;

    const result = await updateAccount(configAccount.id, {
      outreach_min_icp_score: configAccount.outreach_min_icp_score,
      outreach_daily_limit: configAccount.outreach_daily_limit,
      outreach_enabled: configAccount.outreach_enabled,
    });

    if (result) {
      showToast({ type: 'success', message: 'Configuracoes salvas' });
      setShowConfigModal(false);
      setConfigAccount(null);
    } else {
      showToast({ type: 'error', message: 'Erro ao salvar configuracoes' });
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) return;

    const result = await deleteAccount(id);
    if (result) {
      showToast({ type: 'info', message: 'Conta removida' });
      if (selectedAccountId === id) {
        setSelectedAccountId(undefined);
      }
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedFollower || !outreachMessage.trim()) return;

    const result = await sendOutreach(selectedFollower.id, outreachMessage);
    if (result) {
      showToast({ type: 'success', message: `DM enviada para @${selectedFollower.follower_username}` });
      setShowOutreachModal(false);
      setSelectedFollower(null);
      setOutreachMessage('');
      refetchFollowers();
    } else {
      // Mostrar erro especifico da API
      const errorMsg = outreachError || 'Erro ao enviar DM';
      showToast({ type: 'error', message: errorMsg });
    }
  };

  const handleSkipFollower = async (followerId: string) => {
    const result = await skipFollower(followerId);
    if (result) {
      showToast({ type: 'info', message: 'Seguidor ignorado' });
      refetchFollowers();
    }
  };

  const handleBulkOutreach = async () => {
    if (selectedFollowers.size === 0 || !outreachMessage.trim()) return;

    const count = await bulkSendOutreach(Array.from(selectedFollowers), outreachMessage);
    if (count > 0) {
      showToast({ type: 'success', message: `DMs iniciadas para ${count} seguidores (processando em background)` });
      setSelectedFollowers(new Set());
      setOutreachMessage('');
      refetchFollowers();
    } else {
      const errorMsg = outreachError || 'Erro ao enviar DMs em massa';
      showToast({ type: 'error', message: errorMsg });
    }
  };

  const handleBulkSkip = async () => {
    if (selectedFollowers.size === 0) return;

    const count = await bulkSkipFollowers(Array.from(selectedFollowers));
    if (count > 0) {
      showToast({ type: 'info', message: `${count} seguidores ignorados` });
      setSelectedFollowers(new Set());
      refetchFollowers();
    }
  };

  const toggleFollowerSelection = (id: string) => {
    const newSet = new Set(selectedFollowers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFollowers(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedFollowers.size === followers.length) {
      setSelectedFollowers(new Set());
    } else {
      setSelectedFollowers(new Set(followers.map((f) => f.id)));
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Pendente', icon: <Clock size={10} /> },
      sent: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Enviado', icon: <Send size={10} /> },
      responded: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Respondeu', icon: <CheckCircle2 size={10} /> },
      skipped: { bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'Ignorado', icon: <XCircle size={10} /> },
      failed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Falhou', icon: <AlertCircle size={10} /> },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`text-[9px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} border border-current/20 font-bold uppercase tracking-wider flex items-center gap-1`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  // ICP Score badge
  const getIcpBadge = (score?: number) => {
    if (score === undefined || score === null) {
      return <span className="text-xs text-slate-400 dark:text-slate-500">-</span>;
    }

    let color = 'text-red-500 bg-red-500/10';
    if (score >= 80) color = 'text-green-500 bg-green-500/10';
    else if (score >= 60) color = 'text-yellow-500 bg-yellow-500/10';

    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
        {score}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <UserPlus size={28} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Novos Seguidores</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Detecte e aborde novos seguidores automaticamente.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={16} />
            Adicionar Conta
          </button>
          <button
            onClick={handleRefresh}
            disabled={loadingAccounts || loadingFollowers}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={loadingAccounts || loadingFollowers ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <p className="text-red-500 font-medium">Erro ao carregar dados</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button onClick={handleRefresh} className="ml-auto text-red-500 hover:underline text-sm">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Rate Limit Indicator */}
      {rateLimitStatus && !rateLimitLoading && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} />
              Limite Diário de DMs
            </h3>
            <span className="text-xs text-slate-400">
              {rateLimitStatus.total_sent_today}/{rateLimitStatus.total_capacity_today} enviadas hoje
            </span>
          </div>

          {/* Barra de progresso geral */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">Uso Total</span>
              <span className={`font-medium ${
                rateLimitStatus.overall_usage_percent >= 90 ? 'text-red-500' :
                rateLimitStatus.overall_usage_percent >= 70 ? 'text-yellow-500' :
                'text-green-500'
              }`}>
                {rateLimitStatus.overall_usage_percent}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  rateLimitStatus.overall_usage_percent >= 90 ? 'bg-red-500' :
                  rateLimitStatus.overall_usage_percent >= 70 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(rateLimitStatus.overall_usage_percent, 100)}%` }}
              />
            </div>
          </div>

          {/* Detalhes por conta */}
          {rateLimitStatus.accounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rateLimitStatus.accounts.map((acc) => (
                <div key={acc.account_id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      @{acc.username}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      acc.outreach_enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                      {acc.outreach_enabled ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          acc.usage_percent >= 90 ? 'bg-red-500' :
                          acc.usage_percent >= 70 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(acc.usage_percent, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[60px] text-right">
                      {acc.sent_today}/{acc.daily_limit}
                    </span>
                  </div>
                  {acc.pending_followers > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {acc.pending_followers} pendentes na fila
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {rateLimitStatus.total_remaining_today === 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <AlertCircle size={16} />
              <span>Limite diário atingido. Resets à meia-noite.</span>
            </div>
          )}
        </div>
      )}

      {/* Accounts Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Instagram size={14} />
          Contas Monitoradas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingAccounts ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))
          ) : accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={account.id}
                className={`bg-white dark:bg-slate-800 border rounded-xl p-4 transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 ${
                  selectedAccountId === account.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'
                }`}
                onClick={() => setSelectedAccountId(selectedAccountId === account.id ? undefined : account.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {account.profile_pic_url ? (
                      <img
                        src={account.profile_pic_url}
                        alt={account.username}
                        className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        <Instagram size={20} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">@{account.username}</span>
                        {account.outreach_enabled && (
                          <Zap size={12} className="text-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {account.followers_count?.toLocaleString() || 0} seguidores
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfigAccount(account);
                        setShowConfigModal(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Configuracoes"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{account.total_new_followers}</div>
                    <div className="text-[9px] text-slate-500 uppercase">Total</div>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2">
                    <div className="text-lg font-bold text-yellow-500">{account.pending_count}</div>
                    <div className="text-[9px] text-yellow-500 uppercase">Pendentes</div>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-500">{account.sent_count}</div>
                    <div className="text-[9px] text-blue-500 uppercase">Enviados</div>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-500">{account.responded_count}</div>
                    <div className="text-[9px] text-green-500 uppercase">Respostas</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Target size={12} className="text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">
                      {account.ready_for_outreach} prontos (ICP &ge; {account.outreach_min_icp_score})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOutreach(account);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      account.outreach_enabled
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {account.outreach_enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    Auto
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
              <Instagram size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Nenhuma conta monitorada</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Adicione uma conta Instagram para comecar a detectar novos seguidores.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                Adicionar Conta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Followers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} />
            Novos Seguidores {selectedAccountId ? `(@${accounts.find(a => a.id === selectedAccountId)?.username})` : '(Todas as contas)'}
          </h2>

          {selectedFollowers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{selectedFollowers.size} selecionados</span>
              <button
                onClick={() => setShowOutreachModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send size={12} />
                Enviar DMs
              </button>
              <button
                onClick={handleBulkSkip}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <XCircle size={12} />
                Ignorar
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por username, nome ou bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 w-full md:w-auto">
              {(['all', 'pending', 'sent', 'responded', 'skipped'] as OutreachStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === s
                      ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendentes' : s === 'sent' ? 'Enviados' : s === 'responded' ? 'Respostas' : 'Ignorados'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Followers Table */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedFollowers.size === followers.length && followers.length > 0}
                onChange={toggleAllSelection}
                className="rounded border-slate-300 dark:border-slate-600"
              />
            </div>
            <div className="col-span-4">Seguidor</div>
            <div className="col-span-2">ICP Score</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Acoes</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {loadingFollowers ? (
              [...Array(itemsPerPage)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 animate-pulse">
                  <div className="col-span-1">
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-12" />
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-md w-24" />
                  </div>
                </div>
              ))
            ) : followers.length > 0 ? (
              followers.map((follower) => (
                <div
                  key={follower.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group ${
                    selectedFollowers.has(follower.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedFollowers.has(follower.id)}
                      onChange={() => toggleFollowerSelection(follower.id)}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div className="col-span-4 flex items-center gap-3">
                    {follower.follower_profile_pic ? (
                      <img
                        src={follower.follower_profile_pic}
                        alt={follower.follower_username}
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {follower.follower_username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://instagram.com/${follower.follower_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{follower.follower_username}
                          <ExternalLink size={10} className="opacity-50" />
                        </a>
                        {follower.follower_is_verified && (
                          <CheckCircle2 size={12} className="text-blue-500" />
                        )}
                        {follower.follower_is_business && (
                          <span className="text-[8px] px-1 py-0.5 bg-purple-500/10 text-purple-500 rounded uppercase font-bold">Business</span>
                        )}
                      </div>
                      {follower.follower_full_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{follower.follower_full_name}</p>
                      )}
                      {follower.follower_bio && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{follower.follower_bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2">
                    {getIcpBadge(follower.icp_score)}
                  </div>

                  <div className="col-span-2">
                    {getStatusBadge(follower.outreach_status)}
                  </div>

                  <div className="col-span-3 flex justify-end gap-2">
                    {follower.outreach_status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedFollower(follower);
                            setShowOutreachModal(true);
                          }}
                          disabled={actionLoading}
                          className="text-xs font-bold flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white transition-all px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          <Send size={12} />
                          Enviar DM
                        </button>
                        <button
                          onClick={() => handleSkipFollower(follower.id)}
                          disabled={actionLoading}
                          className="text-xs font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          <XCircle size={12} />
                        </button>
                      </>
                    )}
                    {follower.outreach_status === 'sent' && follower.outreach_sent_at && (
                      <span className="text-[10px] text-slate-500">
                        Enviado {new Date(follower.outreach_sent_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {follower.outreach_status === 'responded' && (
                      <button
                        className="text-xs font-bold flex items-center gap-1 bg-green-500/10 text-green-500 transition-all px-3 py-1.5 rounded-lg"
                      >
                        <MessageSquare size={12} />
                        Ver Conversa
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Nenhum novo seguidor</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  {selectedAccountId
                    ? 'Nenhum novo seguidor detectado para esta conta.'
                    : 'Adicione uma conta e aguarde a deteccao de novos seguidores.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="text-xs text-slate-500">
              Mostrando <span className="text-slate-900 dark:text-white font-semibold">{followers.length}</span> de{' '}
              <span className="text-slate-900 dark:text-white font-semibold">{totalCount}</span> seguidores
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all ${
                  currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white min-w-[80px] justify-center">
                <span>{currentPage}</span>
                <span className="text-slate-400 font-normal">/</span>
                <span className="text-slate-400 font-normal">{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all ${
                  currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adicionar Conta Instagram</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Username do Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.replace('@', ''))}
                    placeholder="username"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A conta sera monitorada para detectar novos seguidores a cada 6 horas.
              </p>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newUsername.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && configAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuracoes - @{configAccount.username}</h3>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setConfigAccount(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Outreach Automatico</span>
                  <button
                    onClick={() =>
                      setConfigAccount({
                        ...configAccount,
                        outreach_enabled: !configAccount.outreach_enabled,
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      configAccount.outreach_enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        configAccount.outreach_enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Envia DMs automaticamente para novos seguidores que atendem aos criterios.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  ICP Score Minimo: {configAccount.outreach_min_icp_score}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={configAccount.outreach_min_icp_score}
                  onChange={(e) =>
                    setConfigAccount({
                      ...configAccount,
                      outreach_min_icp_score: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Limite Diario de DMs</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={configAccount.outreach_daily_limit}
                  onChange={(e) =>
                    setConfigAccount({
                      ...configAccount,
                      outreach_daily_limit: parseInt(e.target.value) || 50,
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Recomendado: 30-50 DMs/dia para evitar restricoes.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setConfigAccount(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outreach Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedFollower ? `Enviar DM para @${selectedFollower.follower_username}` : `Enviar DM para ${selectedFollowers.size} seguidores`}
                </h3>
                <button
                  onClick={() => {
                    setShowOutreachModal(false);
                    setSelectedFollower(null);
                    setOutreachMessage('');
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Template Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Templates</label>
                  <button
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <MessageSquare size={12} />
                    {showTemplateSelector ? 'Ocultar' : 'Mostrar templates'}
                  </button>
                </div>
                {showTemplateSelector && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {messageTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setOutreachMessage(applyTemplate(template.message, selectedFollower));
                          setShowTemplateSelector(false);
                        }}
                        className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            template.category === 'hot' ? 'bg-green-500/10 text-green-500' :
                            template.category === 'warm' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>
                            {template.category}
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600">
                            {template.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {template.message.substring(0, 80)}...
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Mensagem</label>
                <textarea
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  placeholder="Escreva sua mensagem de abordagem ou selecione um template acima..."
                  rows={6}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">{outreachMessage.length} caracteres</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{'{{nome}}'}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{'{{username}}'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle size={12} />
                <span>A mensagem sera enviada via Instagram Direct.</span>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowOutreachModal(false);
                  setSelectedFollower(null);
                  setOutreachMessage('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={selectedFollower ? handleSendOutreach : handleBulkOutreach}
                disabled={!outreachMessage.trim() || actionLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewFollowersView;
