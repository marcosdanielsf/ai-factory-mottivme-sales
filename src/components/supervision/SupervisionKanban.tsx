import React, { useState, useCallback, useMemo } from 'react';
import {
  Bot,
  PauseCircle,
  Calendar,
  CheckCircle,
  XCircle,
  Archive,
  MessageSquare,
  GripVertical,
  Layers,
  UserCheck,
} from 'lucide-react';
import {
  SupervisionConversation,
  SupervisionStatus,
  supervisionStatusConfig,
  channelConfig,
} from '../../types/supervision';

type KanbanGroupBy = 'status' | 'pipeline';

interface SupervisionKanbanProps {
  conversations: SupervisionConversation[];
  onSelect: (conversation: SupervisionConversation) => void;
  onStatusChange?: (sessionId: string, newStatus: SupervisionStatus) => void;
  selectedId: string | null;
}

const KANBAN_COLUMNS: { status: SupervisionStatus; icon: React.ReactNode }[] = [
  { status: 'ai_active', icon: <Bot size={14} className="text-green-400" /> },
  { status: 'ai_paused', icon: <PauseCircle size={14} className="text-yellow-400" /> },
  { status: 'handoff', icon: <UserCheck size={14} className="text-cyan-400" /> },
  { status: 'scheduled', icon: <Calendar size={14} className="text-purple-400" /> },
  { status: 'converted', icon: <CheckCircle size={14} className="text-emerald-400" /> },
  { status: 'lost', icon: <XCircle size={14} className="text-red-400" /> },
  { status: 'archived', icon: <Archive size={14} className="text-gray-400" /> },
];

const getContactDisplayName = (conversation: SupervisionConversation): string => {
  if (conversation.contact_name?.trim() && conversation.contact_name !== 'Desconhecido') {
    return conversation.contact_name;
  }
  if ((conversation as any).instagram_username?.trim()) return `@${(conversation as any).instagram_username}`;
  if (conversation.contact_phone?.trim()) return conversation.contact_phone;
  if (conversation.contact_email?.trim()) return conversation.contact_email.split('@')[0];
  return 'Desconhecido';
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const SupervisionKanban: React.FC<SupervisionKanbanProps> = ({
  conversations,
  onSelect,
  onStatusChange,
  selectedId,
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>('status');

  const getColumnConversations = useCallback(
    (status: SupervisionStatus) =>
      conversations.filter((c) => c.supervision_status === status),
    [conversations]
  );

  const pipelineColumns = useMemo(() => {
    if (groupBy !== 'pipeline') return [];
    const stages = new Set<string>();
    conversations.forEach((c) => {
      if (c.etapa_funil) stages.add(c.etapa_funil);
    });
    if (stages.size === 0) stages.add('sem_funil');
    return Array.from(stages).sort();
  }, [conversations, groupBy]);

  const getPipelineColumnConversations = useCallback(
    (stage: string) =>
      stage === 'sem_funil'
        ? conversations.filter((c) => !c.etapa_funil)
        : conversations.filter((c) => c.etapa_funil === stage),
    [conversations]
  );

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData('text/plain', sessionId);
    setDraggedItem(sessionId);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: SupervisionStatus) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggedItem(null);
    if (sessionId && onStatusChange) {
      onStatusChange(sessionId, newStatus);
    }
  };

  // Componente de card reutilizavel
  const KanbanCard = ({ conv, draggable: isDraggable }: { conv: SupervisionConversation; draggable: boolean }) => (
    <div
      key={conv.conversation_id}
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => handleDragStart(e, conv.session_id) : undefined}
      onClick={() => onSelect(conv)}
      className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selectedId === conv.session_id
          ? 'border-accent-primary bg-accent-primary/10'
          : isDraggable && draggedItem === conv.session_id
          ? 'border-accent-primary/50 opacity-50'
          : conv.last_message_role === 'user'
          ? 'border-yellow-400/40 bg-yellow-400/5 hover:bg-yellow-400/10'
          : 'border-border-default bg-bg-secondary hover:bg-bg-hover'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isDraggable && (
            <GripVertical size={12} className="text-text-muted shrink-0 cursor-grab" />
          )}
          <span className="text-sm font-medium text-text-primary truncate">
            {getContactDisplayName(conv)}
          </span>
        </div>
        <span className="text-[10px] text-text-muted shrink-0">
          {formatTime(conv.last_message_at)}
        </span>
      </div>

      {/* Last Message */}
      <p className="text-xs text-text-secondary truncate mb-1.5">
        {conv.last_message_role === 'assistant' && (
          <span className="text-accent-primary">IA: </span>
        )}
        {conv.last_message?.slice(0, 50)}
        {(conv.last_message?.length || 0) > 50 && '...'}
      </p>

      {/* Card Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {conv.tags && conv.tags.length > 0 && (
            conv.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary rounded">
                {tag}
              </span>
            ))
          )}
          {conv.channel && conv.channel !== 'unknown' && (
            <span className={`text-[10px] ${channelConfig[conv.channel]?.color || 'text-text-muted'}`}>
              {channelConfig[conv.channel]?.label || conv.channel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted">
          <MessageSquare size={10} />
          {conv.message_count}
        </div>
      </div>

      {/* Client name / Status pill (pipeline mode) */}
      {(conv.client_name || (groupBy === 'pipeline' && conv.supervision_status)) && (
        <div className="mt-1.5 pt-1.5 border-t border-border-default/50 flex items-center justify-between gap-1">
          {conv.client_name && (
            <span className="text-[10px] text-text-muted truncate">
              {conv.client_name}
            </span>
          )}
          {groupBy === 'pipeline' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${supervisionStatusConfig[conv.supervision_status]?.bgColor || ''} ${supervisionStatusConfig[conv.supervision_status]?.color || 'text-text-muted'}`}>
              {supervisionStatusConfig[conv.supervision_status]?.label || conv.supervision_status}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* GroupBy Selector */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-default/50 shrink-0">
        <Layers size={13} className="text-text-muted" />
        <span className="text-xs text-text-muted">Agrupar por:</span>
        <div className="flex bg-bg-hover rounded-lg p-0.5">
          <button
            onClick={() => setGroupBy('status')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              groupBy === 'status'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setGroupBy('pipeline')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              groupBy === 'pipeline'
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Funil
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-3">
        <div className="flex gap-3 min-w-max h-full">
          {groupBy === 'status' ? (
            KANBAN_COLUMNS.map(({ status, icon }) => {
              const columnConversations = getColumnConversations(status);
              const config = supervisionStatusConfig[status];
              const isOver = dragOverColumn === status;

              return (
                <div
                  key={status}
                  className={`w-72 flex flex-col rounded-xl border transition-all ${
                    isOver
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border-default bg-bg-primary/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-default/50">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className={`text-sm font-medium ${config?.color || 'text-text-primary'}`}>
                        {config?.label || status}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
                      {columnConversations.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {columnConversations.length === 0 ? (
                      <div className="text-center py-8 text-text-muted text-xs">
                        Nenhuma conversa
                      </div>
                    ) : (
                      columnConversations.map((conv) => (
                        <KanbanCard key={conv.conversation_id} conv={conv} draggable={true} />
                      ))
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            pipelineColumns.map((stage) => {
              const columnConversations = getPipelineColumnConversations(stage);
              const label = stage === 'sem_funil' ? 'Sem Funil' : stage;

              return (
                <div
                  key={stage}
                  className="w-72 flex flex-col rounded-xl border border-border-default bg-bg-primary/50"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-default/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-primary/60" />
                      <span className="text-sm font-medium text-text-primary capitalize">
                        {label}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
                      {columnConversations.length}
                    </span>
                  </div>

                  {/* Cards - sem drag no modo pipeline */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {columnConversations.length === 0 ? (
                      <div className="text-center py-8 text-text-muted text-xs">
                        Nenhuma conversa
                      </div>
                    ) : (
                      columnConversations.map((conv) => (
                        <KanbanCard key={conv.conversation_id} conv={conv} draggable={false} />
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
