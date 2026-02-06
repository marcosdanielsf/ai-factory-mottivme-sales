import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface Conversation {
  id: string;
  leadName: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'completed' | 'pending';
  unread: number;
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    leadName: 'Maria Silva',
    lastMessage: 'Oi, gostaria de saber mais sobre o procedimento',
    timestamp: 'Ha 5 min',
    status: 'active',
    unread: 2,
  },
  {
    id: '2',
    leadName: 'Joao Santos',
    lastMessage: 'Obrigado! Vou confirmar o horario',
    timestamp: 'Ha 1 hora',
    status: 'completed',
    unread: 0,
  },
  {
    id: '3',
    leadName: 'Ana Costa',
    lastMessage: 'Qual o valor do tratamento completo?',
    timestamp: 'Ha 2 horas',
    status: 'pending',
    unread: 1,
  },
  {
    id: '4',
    leadName: 'Carlos Oliveira',
    lastMessage: 'Pode ser na proxima semana?',
    timestamp: 'Ha 3 horas',
    status: 'active',
    unread: 0,
  },
  {
    id: '5',
    leadName: 'Patricia Lima',
    lastMessage: 'Agendamento confirmado para sexta',
    timestamp: 'Ontem',
    status: 'completed',
    unread: 0,
  },
];

const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
  const statusColors = {
    active: 'bg-emerald-500',
    completed: 'bg-text-muted',
    pending: 'bg-amber-500',
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-bg-tertiary rounded-xl cursor-pointer transition-all group">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold">
          {conversation.leadName.charAt(0)}
        </div>
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-secondary ${statusColors[conversation.status]}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-text-primary">{conversation.leadName}</h3>
          <span className="text-xs text-text-muted">{conversation.timestamp}</span>
        </div>
        <p className="text-sm text-text-muted truncate mt-0.5">{conversation.lastMessage}</p>
      </div>

      <div className="flex items-center gap-2">
        {conversation.unread > 0 && (
          <span className="bg-accent-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {conversation.unread}
          </span>
        )}
        <ChevronRight size={16} className="text-text-muted group-hover:text-accent-primary transition-colors" />
      </div>
    </div>
  );
};

export const ClientConversas = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockConversations.length,
    active: mockConversations.filter(c => c.status === 'active').length,
    pending: mockConversations.filter(c => c.status === 'pending').length,
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
          <MessageSquare className="text-accent-primary" size={28} />
          Conversas
        </h1>
        <p className="text-text-secondary mt-1">
          Acompanhe as interacoes do seu agente com os leads
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          <p className="text-sm text-text-muted">Total</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-sm text-text-muted">Ativas</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-text-muted">Pendentes</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-default rounded-xl text-sm focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'pending', 'completed'] as const).map((status) => {
            const labels = { all: 'Todas', active: 'Ativas', pending: 'Pendentes', completed: 'Concluidas' };
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary border border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-bg-secondary border border-border-default rounded-2xl divide-y divide-border-default overflow-hidden">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))
        ) : (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-primary font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm text-text-muted mt-1">
              {searchTerm ? 'Tente ajustar sua busca' : 'As conversas aparecerão aqui'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
