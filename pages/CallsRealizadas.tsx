import React, { useState, useMemo, useEffect } from 'react';
import {
  Phone,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  User,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Volume2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { useAgentConversations } from '../src/hooks';
import { useToast } from '../src/hooks/useToast';

export const CallsRealizadas = () => {
  const { showToast } = useToast();
  const { conversations, loading, error, refetch } = useAgentConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [playingCall, setPlayingCall] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  // Simular progresso de áudio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playingCall) {
      setPlayProgress(0);
      interval = setInterval(() => {
        setPlayProgress(prev => {
          if (prev >= 100) {
            setPlayingCall(null);
            return 0;
          }
          return prev + 1;
        });
      }, 300); // 30s de áudio simulado (100 * 300ms)
    } else {
      setPlayProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingCall]);

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact_phone?.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(conv =>
        new Date(conv.created_at) >= filterDate
      );
    }

    return filtered;
  }, [conversations, searchTerm, statusFilter, dateFilter]);

  // Métricas
  const metrics = useMemo(() => {
    const total = filteredConversations.length;
    const completed = filteredConversations.filter(c => c.status === 'completed').length;
    const failed = filteredConversations.filter(c => c.status === 'failed').length;
    const avgDuration = filteredConversations.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / total || 0;

    return {
      total,
      completed,
      failed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDuration: Math.round(avgDuration)
    };
  }, [filteredConversations]);

  const handleExport = () => {
    try {
      showToast('Exportando relatório de chamadas...', 'info');
      // Simular exportação
      setTimeout(() => {
        showToast('Relatório exportado com sucesso!', 'success');
      }, 1500);
    } catch (error) {
      showToast('Erro ao exportar relatório', 'error');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar conversas</h2>
        <p className="text-text-muted max-w-md mb-6">{error}</p>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
              <Phone size={28} />
              Calls Realizadas
            </h1>
            <p className="text-text-secondary">Histórico completo de interações telefônicas dos agentes</p>
          </div>
          
          <button 
            onClick={() => {
              showToast('Atualizando chamadas...', 'info');
              refetch().then(() => showToast('Chamadas atualizadas', 'success'));
            }}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center self-end mb-1"
            title="Atualizar chamadas"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors shadow-lg shadow-accent-primary/10 active:scale-95"
        >
          <Download size={16} />
          Exportar Relatório
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total de Calls</p>
              <p className="text-2xl font-bold text-text-primary">{metrics.total}</p>
            </div>
            <Phone className="text-accent-primary" size={24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Completadas</p>
              <p className="text-2xl font-bold text-accent-success">{metrics.completed}</p>
            </div>
            <CheckCircle className="text-accent-success" size={24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-text-primary">{metrics.completionRate}%</p>
            </div>
            <TrendingUp className="text-accent-primary" size={24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Duração Média</p>
              <p className="text-2xl font-bold text-text-primary">{metrics.avgDuration}s</p>
            </div>
            <Clock className="text-accent-warning" size={24} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
              <Search size={18} className="opacity-50" />
            </div>
            <input
              type="text"
              placeholder="Buscar por contato ou telefone..."
              className="w-full pl-10 pr-10 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtro de Status */}
          <select
            className="px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Completadas</option>
            <option value="failed">Falhadas</option>
          </select>

          {/* Filtro de Data */}
          <select
            className="px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>

        {/* Resultados Encontrados */}
        {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between text-xs border-t border-border-default pt-4">
            <p className="text-text-muted">
              Encontradas <span className="text-text-primary font-semibold">{filteredConversations.length}</span> chamadas
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="text-accent-primary hover:underline font-medium"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Calls */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border-default">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-bg-tertiary rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg-tertiary rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg-tertiary rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg-tertiary rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-bg-tertiary rounded-full w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-bg-tertiary rounded-full w-24"></div></td>
                  </tr>
                ))
              ) : filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center py-8">
                       <div className="p-4 bg-bg-tertiary rounded-full mb-4">
                         {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? <Search size={32} className="opacity-20" /> : <Phone size={32} className="opacity-20" />}
                       </div>
                       <p className="font-medium text-text-primary">
                         {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Nenhuma call encontrada' : 'Nenhuma call realizada'}
                       </p>
                       <p className="text-sm text-text-muted mt-1">
                         {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                           ? 'Tente ajustar seus filtros de busca para encontrar o que procura.' 
                           : 'Aguardando as primeiras interações dos agentes.'}
                       </p>
                       {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                         <button 
                           onClick={() => {
                             setSearchTerm('');
                             setStatusFilter('all');
                             setDateFilter('all');
                           }}
                           className="mt-4 text-xs text-accent-primary hover:underline font-medium"
                         >
                           Limpar todos os filtros
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-bg-tertiary transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-text-muted" />
                        <span className="text-text-primary">
                          {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-text-muted">
                          {new Date(conv.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-text-muted" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {conv.contact_name || 'Contato sem nome'}
                          </p>
                          <p className="text-xs text-text-muted">{conv.contact_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {conv.agent_name || 'Agente N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-text-muted">
                        <Clock size={14} />
                        <span>{conv.duration_seconds || 0}s</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {conv.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-success/10 text-accent-success text-xs rounded-full">
                          <CheckCircle size={12} />
                          Completada
                        </span>
                      ) : conv.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-error/10 text-accent-error text-xs rounded-full">
                          <XCircle size={12} />
                          Falhada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-warning/10 text-accent-warning text-xs rounded-full">
                          <Clock size={12} />
                          Em andamento
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group/player">
                          <button 
                            onClick={() => setPlayingCall(playingCall === conv.id ? null : conv.id)}
                            className={`p-2 rounded-full transition-all duration-300 ${
                              playingCall === conv.id 
                              ? 'bg-accent-primary text-white scale-110 shadow-lg shadow-accent-primary/20' 
                              : 'bg-bg-tertiary text-text-muted hover:text-accent-primary hover:bg-bg-hover'
                            }`}
                          >
                            {playingCall === conv.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                          </button>
                          
                          {playingCall === conv.id && (
                            <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 flex items-center gap-2 bg-bg-secondary border border-border-default rounded-full px-3 py-1.5 shadow-xl z-10 w-48">
                              <Volume2 size={12} className="text-accent-primary shrink-0" />
                              <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-accent-primary transition-all duration-200" 
                                  style={{ width: `${playProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-text-muted shrink-0">
                                {Math.floor((playProgress / 100) * (conv.duration_seconds || 30))}s
                              </span>
                            </div>
                          )}
                        </div>

                        {playingCall === conv.id && (
                          <div className="flex gap-0.5 items-center h-4 w-12">
                            {[...Array(8)].map((_, i) => (
                              <div 
                                key={i}
                                className="w-0.5 bg-accent-primary animate-pulse" 
                                style={{ 
                                  height: `${20 + Math.random() * 80}%`,
                                  animationDelay: `${i * 0.1}s` 
                                }}
                              />
                            ))}
                          </div>
                        )}
                        <button className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-tertiary transition-colors">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
