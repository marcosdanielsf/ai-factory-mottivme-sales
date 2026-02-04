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
  X,
  ChevronDown
} from 'lucide-react';
import { useAgentConversations } from '../hooks';
import { useToast } from '../hooks/useToast';
import { useIsMobile } from '../hooks/useMediaQuery';

export const CallsRealizadas = () => {
  const { showToast } = useToast();
  const { conversations, loading, error, refetch } = useAgentConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [playingCall, setPlayingCall] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

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
      }, 300);
    } else {
      setPlayProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingCall]);

  // Filtrar conversas
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.contact_phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

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
      setTimeout(() => {
        showToast('Relatório exportado com sucesso!', 'success');
      }, 1500);
    } catch (error) {
      showToast('Erro ao exportar relatório', 'error');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-semibold mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <Phone size={isMobile ? 22 : 28} />
              Calls Realizadas
            </h1>
            <p className="text-text-secondary text-xs md:text-base">Histórico de interações telefônicas</p>
          </div>
          
          <button 
            onClick={() => {
              showToast('Atualizando chamadas...', 'info');
              refetch().then(() => showToast('Chamadas atualizadas', 'success'));
            }}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center shrink-0"
            title="Atualizar chamadas"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors shadow-lg shadow-accent-primary/10 active:scale-95 w-full md:w-auto md:self-end text-sm"
        >
          <Download size={16} />
          Exportar Relatório
        </button>
      </div>

      {/* Métricas - 2 colunas no mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-[10px] md:text-xs uppercase tracking-wider mb-1">Total</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary">{metrics.total}</p>
            </div>
            <Phone className="text-accent-primary" size={isMobile ? 20 : 24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-[10px] md:text-xs uppercase tracking-wider mb-1">Completadas</p>
              <p className="text-xl md:text-2xl font-bold text-accent-success">{metrics.completed}</p>
            </div>
            <CheckCircle className="text-accent-success" size={isMobile ? 20 : 24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-[10px] md:text-xs uppercase tracking-wider mb-1">Taxa Sucesso</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary">{metrics.completionRate}%</p>
            </div>
            <TrendingUp className="text-accent-primary" size={isMobile ? 20 : 24} />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-[10px] md:text-xs uppercase tracking-wider mb-1">Duração Média</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary">{metrics.avgDuration}s</p>
            </div>
            <Clock className="text-accent-warning" size={isMobile ? 20 : 24} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4 shadow-sm">
        {/* Mobile: Toggle filters */}
        {isMobile && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full mb-3 text-sm font-medium text-text-primary"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filtros
            </span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 ${isMobile && !showFilters ? 'hidden' : ''}`}>
          {/* Busca */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
              <Search size={16} className="opacity-50" />
            </div>
            <input
              type="text"
              placeholder="Buscar contato ou telefone..."
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
            className="px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Completadas</option>
            <option value="failed">Falhadas</option>
          </select>

          {/* Filtro de Data */}
          <select
            className="px-3 md:px-4 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">Todo Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>

        {/* Resultados Encontrados */}
        {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
          <div className="mt-3 md:mt-4 flex items-center justify-between text-xs border-t border-border-default pt-3 md:pt-4">
            <p className="text-text-muted">
              <span className="text-text-primary font-semibold">{filteredConversations.length}</span> chamadas
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="text-accent-primary hover:underline font-medium"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Calls */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        {isMobile ? (
          /* Mobile: Cards */
          <div className="divide-y divide-border-default">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-3 animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-bg-tertiary rounded w-24"></div>
                    <div className="h-5 bg-bg-tertiary rounded-full w-20"></div>
                  </div>
                  <div className="h-3 bg-bg-tertiary rounded w-32"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-bg-tertiary rounded w-16"></div>
                    <div className="h-8 bg-bg-tertiary rounded-full w-8"></div>
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-12 text-center text-text-muted">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="p-4 bg-bg-tertiary rounded-full mb-4">
                    <Phone size={28} className="opacity-20" />
                  </div>
                  <p className="font-medium text-text-primary text-sm">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Nenhuma call encontrada' : 'Nenhuma call realizada'}
                  </p>
                  <p className="text-xs text-text-muted mt-1 max-w-[200px]">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? 'Tente ajustar os filtros.' 
                      : 'Aguardando as primeiras interações.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.id} className="p-3 hover:bg-bg-tertiary/50 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {conv.contact_name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-text-muted">{conv.contact_phone || 'N/A'}</p>
                    </div>
                    {conv.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-success/10 text-accent-success text-[10px] rounded-full shrink-0">
                        <CheckCircle size={10} />
                        Completada
                      </span>
                    ) : conv.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-error/10 text-accent-error text-[10px] rounded-full shrink-0">
                        <XCircle size={10} />
                        Falhada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-warning/10 text-accent-warning text-[10px] rounded-full shrink-0">
                        <Clock size={10} />
                        Andamento
                      </span>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-[10px] text-text-muted mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {conv.duration_seconds || 0}s
                    </span>
                    <span className="text-text-secondary">
                      {conv.agent_name || 'Agente N/A'}
                    </span>
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPlayingCall(playingCall === conv.id ? null : conv.id)}
                      className={`p-2 rounded-full transition-all ${
                        playingCall === conv.id 
                        ? 'bg-accent-primary text-white' 
                        : 'bg-bg-tertiary text-text-muted hover:text-accent-primary'
                      }`}
                    >
                      {playingCall === conv.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
                    
                    {playingCall === conv.id && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-primary transition-all duration-200" 
                            style={{ width: `${playProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">
                          {Math.floor((playProgress / 100) * (conv.duration_seconds || 30))}s
                        </span>
                        <div className="flex gap-0.5 items-center h-3">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i}
                              className="w-0.5 bg-accent-primary animate-pulse rounded-full" 
                              style={{ 
                                height: `${20 + Math.random() * 80}%`,
                                animationDelay: `${i * 0.1}s` 
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {playingCall !== conv.id && (
                      <span className="text-xs text-text-muted">Ouvir gravação</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop: Table */
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
        )}
      </div>
    </div>
  );
};
