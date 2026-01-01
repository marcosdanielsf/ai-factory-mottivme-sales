import React, { useState, useMemo } from 'react';
import { Phone, Search, Filter, Download, Calendar, Clock, User, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { useAgentConversations } from '../src/hooks';

export const CallsRealizadas = () => {
  const { conversations, loading } = useAgentConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-3">
            <Phone size={28} />
            Calls Realizadas
          </h1>
          <p className="text-text-secondary">Histórico completo de interações telefônicas dos agentes</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors">
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
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar por contato ou telefone..."
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de Status */}
          <select
            className="px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Completadas</option>
            <option value="failed">Falhadas</option>
          </select>

          {/* Filtro de Data */}
          <select
            className="px-4 py-2 bg-bg-primary border border-border-default rounded text-sm focus:outline-none focus:border-accent-primary"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">Todo o Período</option>
            <option value="today">Hoje</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
          </select>
        </div>
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
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    Carregando calls...
                  </td>
                </tr>
              ) : filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    Nenhuma call encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-bg-tertiary transition-colors">
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
                      <button className="text-accent-primary text-sm hover:underline">
                        Ver Detalhes
                      </button>
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
