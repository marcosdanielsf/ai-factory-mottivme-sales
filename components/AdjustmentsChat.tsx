import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Eye, Sparkles, Shield, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  preview?: PromptPreview;
  status?: 'pending' | 'approved' | 'rejected';
}

interface PromptPreview {
  zone: 'guardrails' | 'hyperpersonalization' | 'few_shot' | 'tools';
  before: string;
  after: string;
  diff_summary: string;
}

interface AdjustmentsChatProps {
  agentId: string;
  agentName: string;
  currentPrompt: string;
  onApplyChanges: (zone: string, newContent: string) => Promise<void>;
  onClose?: () => void;
}

// Zonas editáveis pelo CS
const EDITABLE_ZONES = {
  guardrails: {
    label: 'Guardrails',
    description: 'Regras de comportamento e limites',
    icon: Shield,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  hyperpersonalization: {
    label: 'Hiperpersonalização',
    description: 'Contexto e personalização do cliente',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  few_shot: {
    label: 'Few-Shot Examples',
    description: 'Exemplos de conversas ideais',
    icon: Bot,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  tools: {
    label: 'Ferramentas',
    description: 'Configuração de tools disponíveis',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
};

// Zonas protegidas (somente visualização)
const PROTECTED_ZONES = ['operation_modes', 'prompt_structure', 'core_instructions'];

export const AdjustmentsChat: React.FC<AdjustmentsChatProps> = ({
  agentId,
  agentName,
  currentPrompt,
  onApplyChanges,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Olá! Sou o assistente de ajustes do agente **${agentName}**.

Posso ajudar você a modificar:
- **Guardrails**: Regras de comportamento
- **Hiperpersonalização**: Contexto do cliente
- **Few-Shot**: Exemplos de conversas
- **Ferramentas**: Configurações de tools

Descreva em linguagem natural o que você quer alterar. Por exemplo:
_"Adicione uma regra para nunca mencionar concorrentes"_
_"Inclua o horário de funcionamento: seg-sex 9h-18h"_`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processUserRequest = async (userMessage: string): Promise<Message> => {
    // Simular processamento do Claude para interpretar a intenção
    // Em produção, isso chamaria o backend com Claude
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Detectar zona baseado em keywords
    let detectedZone: keyof typeof EDITABLE_ZONES = 'guardrails';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('horário') || lowerMessage.includes('contexto') || lowerMessage.includes('cliente')) {
      detectedZone = 'hyperpersonalization';
    } else if (lowerMessage.includes('exemplo') || lowerMessage.includes('conversa')) {
      detectedZone = 'few_shot';
    } else if (lowerMessage.includes('ferramenta') || lowerMessage.includes('tool')) {
      detectedZone = 'tools';
    }

    // Gerar preview simulado
    const preview: PromptPreview = {
      zone: detectedZone,
      before: `[Conteúdo atual da zona ${EDITABLE_ZONES[detectedZone].label}]`,
      after: `[Conteúdo atualizado com: "${userMessage}"]`,
      diff_summary: `Adicionado: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
    };

    const zoneInfo = EDITABLE_ZONES[detectedZone];

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Entendi! Vou adicionar isso na zona **${zoneInfo.label}**.

**Resumo da alteração:**
${preview.diff_summary}

Clique em **Aprovar** para aplicar ou **Rejeitar** para cancelar.`,
      timestamp: new Date(),
      preview,
      status: 'pending',
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await processUserRequest(input);
      setMessages(prev => [...prev, response]);
      setPendingPreview(response);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingPreview?.preview) return;

    setIsProcessing(true);
    try {
      await onApplyChanges(pendingPreview.preview.zone, pendingPreview.preview.after);

      setMessages(prev =>
        prev.map(m =>
          m.id === pendingPreview.id ? { ...m, status: 'approved' as const } : m
        )
      );

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: `Alteração aplicada com sucesso na zona **${EDITABLE_ZONES[pendingPreview.preview.zone].label}**! Uma nova versão do prompt foi criada.`,
          timestamp: new Date(),
        },
      ]);

      setPendingPreview(null);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: 'Erro ao aplicar alteração. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (!pendingPreview) return;

    setMessages(prev =>
      prev.map(m =>
        m.id === pendingPreview.id ? { ...m, status: 'rejected' as const } : m
      )
    );

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'system',
        content: 'Alteração cancelada. Descreva o que você gostaria de modificar.',
        timestamp: new Date(),
      },
    ]);

    setPendingPreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-primary/20 rounded-lg">
            <Bot className="text-accent-primary" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Chat de Ajustes</h3>
            <p className="text-xs text-text-muted">Agente: {agentName}</p>
          </div>
        </div>

        {/* Editable Zones Indicator */}
        <div className="flex gap-1">
          {Object.entries(EDITABLE_ZONES).map(([key, zone]) => {
            const Icon = zone.icon;
            return (
              <div
                key={key}
                className={`p-1.5 rounded ${zone.bgColor}`}
                title={`${zone.label}: ${zone.description}`}
              >
                <Icon size={14} className={zone.color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user'
                  ? 'bg-accent-primary'
                  : message.role === 'system'
                  ? 'bg-green-500/20'
                  : 'bg-bg-tertiary'
              }`}
            >
              {message.role === 'user' ? (
                <User size={16} className="text-white" />
              ) : message.role === 'system' ? (
                <CheckCircle2 size={16} className="text-green-400" />
              ) : (
                <Bot size={16} className="text-text-secondary" />
              )}
            </div>

            {/* Content */}
            <div
              className={`max-w-[80%] ${
                message.role === 'user' ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-accent-primary text-white'
                    : message.role === 'system'
                    ? 'bg-green-500/10 border border-green-500/30 text-text-secondary'
                    : 'bg-bg-secondary border border-border-default text-text-secondary'
                }`}
              >
                <div
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/_(.*?)_/g, '<em>$1</em>'),
                  }}
                />

                {/* Preview Card */}
                {message.preview && message.status === 'pending' && (
                  <div className="mt-3 p-3 bg-bg-tertiary rounded-lg border border-border-default">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={14} className="text-text-muted" />
                      <span className="text-xs font-medium text-text-muted">Preview</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          EDITABLE_ZONES[message.preview.zone].bgColor
                        } ${EDITABLE_ZONES[message.preview.zone].color}`}
                      >
                        {EDITABLE_ZONES[message.preview.zone].label}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{message.preview.diff_summary}</p>
                  </div>
                )}

                {/* Status Badge */}
                {message.status && message.status !== 'pending' && (
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      message.status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {message.status === 'approved' ? (
                      <>
                        <CheckCircle2 size={12} /> Aprovado
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Rejeitado
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-text-muted mt-1">
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
              <Loader2 size={16} className="text-text-secondary animate-spin" />
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2">
              <span className="text-sm text-text-muted">Processando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Approval Actions */}
      {pendingPreview && (
        <div className="px-4 py-3 bg-bg-secondary border-t border-border-default flex items-center justify-center gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <XCircle size={16} />
            Rejeitar
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Aprovar e Aplicar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border-default bg-bg-secondary">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Descreva o ajuste que você quer fazer..."
            disabled={isProcessing || !!pendingPreview}
            className="flex-1 bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none disabled:opacity-50"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || !!pendingPreview}
            className="px-4 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2 text-center">
          Zonas protegidas (Modos de Operação, Estrutura do Prompt) não são editáveis via chat.
        </p>
      </div>
    </div>
  );
};
