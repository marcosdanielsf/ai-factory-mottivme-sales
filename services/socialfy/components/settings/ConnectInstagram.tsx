import React, { useState } from 'react';
import {
  Instagram,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Clock,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../UI';
import { useInstagramAccounts, InstagramAccount } from '../../hooks/useInstagramAccounts';

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  status: InstagramAccount['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: 'Ativo',
      color: 'green' as const,
      icon: CheckCircle,
    },
    blocked: {
      label: 'Bloqueado',
      color: 'red' as const,
      icon: XCircle,
    },
    warming_up: {
      label: 'Aquecendo',
      color: 'yellow' as const,
      icon: Clock,
    },
    inactive: {
      label: 'Inativo',
      color: 'gray' as const,
      icon: AlertCircle,
    },
    pending: {
      label: 'Pendente',
      color: 'blue' as const,
      icon: Loader2,
    },
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <Badge color={config.color} className="flex items-center gap-1">
      <Icon className={`w-3 h-3 ${status === 'pending' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

// ============================================
// ACCOUNT CARD COMPONENT
// ============================================

interface AccountCardProps {
  account: InstagramAccount;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function AccountCard({ account, onDelete, deleting }: AccountCardProps) {
  const [showSession, setShowSession] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySessionId = () => {
    navigator.clipboard.writeText(account.session_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usagePercent = account.daily_limit > 0
    ? Math.round((1 - account.remaining_today / account.daily_limit) * 100)
    : 0;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-white">
                @{account.username}
              </h4>
              <StatusBadge status={account.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Criado em {new Date(account.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://instagram.com/${account.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Abrir perfil"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => onDelete(account.id)}
            disabled={deleting}
            className="p-2 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Remover conta"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Uso diário</span>
          <span>{account.remaining_today} / {account.daily_limit} restantes</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {account.error_message && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400">{account.error_message}</p>
        </div>
      )}

      {/* Blocked Until */}
      {account.blocked_until && (
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Desbloqueio em: {new Date(account.blocked_until).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {/* Session ID (collapsible) */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setShowSession(!showSession)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <Shield className="w-3 h-3" />
          {showSession ? 'Ocultar' : 'Mostrar'} Session ID
        </button>
        {showSession && (
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
              {account.session_id.substring(0, 50)}...
            </code>
            <button
              onClick={copySessionId}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title={copied ? 'Copiado!' : 'Copiar'}
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ConnectInstagram() {
  const {
    accounts,
    loading,
    error,
    createAccount,
    deleteAccount,
    validateSession,
    refetch,
  } = useInstagramAccounts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!username.trim()) {
      setFormError('Informe o nome de usuário do Instagram');
      return;
    }

    if (!sessionId.trim()) {
      setFormError('Cole o session_id do Instagram');
      return;
    }

    // Clean username (remove @)
    const cleanUsername = username.trim().replace(/^@/, '');

    setFormLoading(true);

    try {
      const result = await createAccount({
        username: cleanUsername,
        session_id: sessionId.trim(),
      });

      if (result) {
        // Success - reset form
        setUsername('');
        setSessionId('');
        setShowAddForm(false);
      } else {
        setFormError('Não foi possível adicionar a conta. Verifique o session_id.');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao adicionar conta');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conta?')) {
      return;
    }

    setDeletingId(accountId);
    await deleteAccount(accountId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Contas Instagram
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Conecte suas contas para automação de prospecção
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Conta
          </Button>
        </div>
      </div>

      {/* Global Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Erro ao carregar contas</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Add Account Form */}
      {showAddForm && (
        <Card className="p-6 border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  Conectar Nova Conta
                </h4>

                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Username
                    </label>
                    <Input
                      placeholder="@seu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Session ID
                    </label>
                    <Input
                      placeholder="Cole o session_id aqui..."
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      disabled={formLoading}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Como obter o Session ID:
                  </p>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                    <li>Faça login no Instagram pelo navegador (desktop)</li>
                    <li>Abra o DevTools (F12) → Application → Cookies</li>
                    <li>Procure o cookie <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">sessionid</code></li>
                    <li>Copie o valor completo e cole aqui</li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setUsername('');
                      setSessionId('');
                      setFormError(null);
                    }}
                    disabled={formLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Conectar Conta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Loading State */}
      {loading && accounts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando contas...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && accounts.length === 0 && !showAddForm && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-white" />
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
            Nenhuma conta conectada
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            Conecte sua primeira conta Instagram para começar a automatizar sua prospecção e capturar novos seguidores.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Conectar Primeira Conta
          </Button>
        </Card>
      )}

      {/* Accounts Grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onDelete={handleDeleteAccount}
              deleting={deletingId === account.id}
            />
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Segurança das suas contas
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Seus dados de sessão são criptografados e nunca compartilhados. 
              Use contas secundárias para automação e mantenha limites conservadores 
              para evitar bloqueios do Instagram.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectInstagram;
