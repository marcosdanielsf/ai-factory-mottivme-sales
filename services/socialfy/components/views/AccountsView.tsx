import React from 'react';
import { Plus, RefreshCw, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button, Card, ChannelBadge } from '../UI';
import { useData } from '../../App';
import { AgenticOSAccount } from '../../hooks/useAgenticOSAccounts';

// Status badge component for accounts
const AccountStatusBadge = ({ status }: { status: AgenticOSAccount['status'] }) => {
  const config = {
    active: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Ativo' },
    blocked: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Bloqueado' },
    warming_up: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Aquecendo' },
    inactive: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-700', label: 'Inativo' },
  };
  const { icon: Icon, color, bg, label } = config[status] || config.inactive;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Icon size={14} className={color} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
};

export const AccountsView = () => {
  const { accounts, agenticAccounts, loading, refetchAgenticData } = useData();

  // Prefer AgenticOS accounts, fallback to mock accounts
  const displayAccounts = agenticAccounts.length > 0 ? agenticAccounts : accounts;

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contas Conectadas</h1>
            <p className="text-slate-500 dark:text-slate-400">Gerencie suas contas Instagram e canais de prospecção</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Carregando contas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render AgenticOS accounts (Instagram accounts)
  const renderAgenticOSAccount = (account: AgenticOSAccount) => {
    const usagePercent = account.daily_limit > 0
      ? ((account.daily_limit - account.remaining_today) / account.daily_limit) * 100
      : 0;
    const usedToday = account.daily_limit - account.remaining_today;

    return (
      <Card key={account.id} className="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <ChannelBadge channel="instagram" size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">@{account.username}</h3>
            <AccountStatusBadge status={account.status} />
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {/* Daily Usage */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">DMs Enviadas Hoje</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {usedToday}/{account.daily_limit}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 90 ? 'bg-red-500' :
                usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>

          {/* Warmup Progress (if warming up) */}
          {account.status === 'warming_up' && account.warmup_progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Progresso Warm-up</span>
                <span className="text-amber-600 font-medium">{account.warmup_progress}%</span>
              </div>
              <div className="w-full bg-amber-100 dark:bg-amber-900/20 rounded-full h-1.5">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${account.warmup_progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Blocked until (if blocked) */}
          {account.status === 'blocked' && account.blocked_until && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">
                Bloqueado até: {new Date(account.blocked_until).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {/* Error message */}
          {account.error_message && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                {account.error_message}
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-2">
            <Button variant="outline" className="flex-1 text-xs h-8">Configurar</Button>
            <Button
              variant="ghost"
              className="text-xs h-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => refetchAgenticData()}
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Render mock/legacy account format
  const renderLegacyAccount = (account: any) => (
    <Card key={account.id} className="p-6 relative overflow-hidden group hover:shadow-lg transition-all">
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <ChannelBadge channel={account.platform} size="md" />
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{account.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${account.status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{account.status}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Uso Diário</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{account.usage}/{account.limit}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full ${account.usage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(account.usage / account.limit) * 100}%` }}></div>
        </div>
        <div className="pt-4 flex gap-2">
          <Button variant="outline" className="flex-1 text-xs h-8">Configurar</Button>
          <Button variant="ghost" className="text-xs h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">Reconectar</Button>
        </div>
      </div>
    </Card>
  );

  const isAgenticOSData = agenticAccounts.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contas Conectadas</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAgenticOSData
              ? `${agenticAccounts.length} conta(s) Instagram do AgenticOS`
              : 'Gerencie suas contas de prospecção'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAgenticOSData && (
            <Button variant="outline" onClick={() => refetchAgenticData()}>
              <RefreshCw size={16} />
            </Button>
          )}
          <Button><Plus size={16}/> Conectar Conta</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAgenticOSData
          ? agenticAccounts.map(renderAgenticOSAccount)
          : displayAccounts.map(renderLegacyAccount)
        }

        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer min-h-[200px]">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
            <Plus size={24} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Adicionar Conta</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
            Conecte contas Instagram para prospecção automática
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AccountsView;
