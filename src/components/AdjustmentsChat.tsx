import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Eye, Sparkles, Shield, AlertTriangle, Zap, Brain } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  preview?: PromptPreview;
  status?: 'pending' | 'approved' | 'rejected';
  ragContext?: number; // Quantos padrões do RAG foram usados
  confidence?: number; // Confiança do Claude na resposta
}

interface PromptPreview {
  zone: 'guardrails' | 'hyperpersonalization' | 'few_shot' | 'tools';
  zone_label: string;
  before: string;
  after: string;
  diff_summary: string;
  adjustment_text: string;
  reasoning?: string;
}

interface AdjustmentsChatProps {
  agentId: string;
  agentName: string;
  clientName?: string;
  currentPrompt: string;
  onApplyChanges: (zone: string, newContent: string) => Promise<void>;
  onClose?: () => void;
}

// URL do webhook n8n - pode ser configurada via env
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_CHAT_AJUSTES || 'https://mottivme.app.n8n.cloud/webhook/chat-ajustes';
const N8N_WEBHOOK_SAVE_URL = import.meta.env.VITE_N8N_WEBHOOK_CHAT_AJUSTES_SAVE || 'https://mottivme.app.n8n.cloud/webhook/chat-ajustes-save';

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
  clientName = '',
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
  const [lastAdjustmentData, setLastAdjustmentData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para chamar o webhook n8n com RAG
  const processUserRequestWithRAG = async (userMessage: string): Promise<Message> => {
    try {
      // Preparar resumo do prompt atual (primeiros 500 chars)
      const promptSummary = currentPrompt.substring(0, 500) + (currentPrompt.length > 500 ? '...' : '');

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          agentName,
          clientName,
          userMessage,
          currentPromptSummary: promptSummary,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status}`);
      }

      const data = await response.json();

      // Salvar dados para uso posterior no save
      setLastAdjustmentData({
        ...data,
        userMessage,
      });

      // Validar zona retornada
      const zone = data.result?.zone as keyof typeof EDITABLE_ZONES;
      const validZone = EDITABLE_ZONES[zone] ? zone : 'guardrails';
      const zoneInfo = EDITABLE_ZONES[validZone];

      const preview: PromptPreview = {
        zone: validZone,
        zone_label: data.result?.zone_label || zoneInfo.label,
        before: data.preview?.before || `[Conteúdo atual da zona ${zoneInfo.label}]`,
        after: data.result?.adjustment_text || data.preview?.after || userMessage,
        diff_summary: data.preview?.diff_summary || `Ajuste sugerido: "${userMessage.substring(0, 50)}..."`,
        adjustment_text: data.result?.adjustment_text || userMessage,
        reasoning: data.result?.reasoning,
      };

      const ragContextCount = data.rag_context || 0;
      const confidence = data.result?.confidence || 0.8;
      const similarPatternUsed = data.result?.similar_pattern_used || false;

      let contentMessage = `Entendi! Vou adicionar isso na zona **${preview.zone_label}**.

**Ajuste sugerido:**
_"${preview.adjustment_text}"_

**Motivo:** ${preview.reasoning || 'Baseado na sua solicitação.'}`;

      if (ragContextCount > 0) {
        contentMessage += `

🧠 _Usei ${ragContextCount} padrão(ões) similar(es) do RAG como referência._`;
      }

      if (similarPatternUsed) {
        contentMessage += `
✨ _Encontrei um padrão similar que foi aplicado antes!_`;
      }

      contentMessage += `

Clique em **Aprovar** para aplicar ou **Rejeitar** para cancelar.`;

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: contentMessage,
        timestamp: new Date(),
        preview,
        status: 'pending',
        ragContext: ragContextCount,
        confidence,
      };

    } catch (error) {
      console.error('Erro ao processar com RAG:', error);

      // Fallback: processar localmente se webhook falhar
      return processUserRequestFallback(userMessage);
    }
  };

  // Fallback caso o webhook não funcione
  const processUserRequestFallback = async (userMessage: string): Promise<Message> => {
    // Detectar zona baseado em keywords (fallback)
    let detectedZone: keyof typeof EDITABLE_ZONES = 'guardrails';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('horário') || lowerMessage.includes('contexto') || lowerMessage.includes('cliente')) {
      detectedZone = 'hyperpersonalization';
    } else if (lowerMessage.includes('exemplo') || lowerMessage.includes('conversa')) {
      detectedZone = 'few_shot';
    } else if (lowerMessage.includes('ferramenta') || lowerMessage.includes('tool')) {
      detectedZone = 'tools';
    }

    const zoneInfo = EDITABLE_ZONES[detectedZone];

    const preview: PromptPreview = {
      zone: detectedZone,
      zone_label: zoneInfo.label,
      before: `[Conteúdo atual da zona ${zoneInfo.label}]`,
      after: userMessage,
      diff_summary: `Adicionado: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`,
      adjustment_text: userMessage,
    };

    setLastAdjustmentData({
      userMessage,
      result: { zone: detectedZone, zone_label: zoneInfo.label, adjustment_text: userMessage },
    });

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Entendi! Vou adicionar isso na zona **${zoneInfo.label}**.

**Resumo da alteração:**
${preview.diff_summary}

⚠️ _Modo offline - RAG não disponível_

Clique em **Aprovar** para aplicar ou **Rejeitar** para cancelar.`,
      timestamp: new Date(),
      preview,
      status: 'pending',
      ragContext: 0,
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
      const response = await processUserRequestWithRAG(input);
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

  // Salvar padrão no RAG após aprovar
  const saveToRAG = async (adjustmentData: any) => {
    try {
      await fetch(N8N_WEBHOOK_SAVE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          agentName,
          clientName,
          userMessage: adjustmentData.userMessage,
          zone: adjustmentData.result?.zone,
          zone_label: adjustmentData.result?.zone_label,
          adjustment_text: adjustmentData.result?.adjustment_text,
        }),
      });
      console.log('Padrão salvo no RAG com sucesso');
    } catch (error) {
      console.error('Erro ao salvar no RAG:', error);
      // Não bloqueia o fluxo se falhar
    }
  };

  const handleApprove = async () => {
    if (!pendingPreview?.preview) return;

    setIsProcessing(true);
    try {
      // Aplicar a alteração
      await onApplyChanges(pendingPreview.preview.zone, pendingPreview.preview.adjustment_text);

      // Salvar no RAG para aprendizado futuro
      if (lastAdjustmentData) {
        saveToRAG(lastAdjustmentData);
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === pendingPreview.id ? { ...m, status: 'approved' as const } : m
        )
      );

      const zoneLabel = pendingPreview.preview.zone_label || EDITABLE_ZONES[pendingPreview.preview.zone].label;

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: `Alteração aplicada com sucesso na zona **${zoneLabel}**!

Uma nova versão do prompt foi criada.
🧠 _Este padrão foi salvo no RAG para uso futuro._`,
          timestamp: new Date(),
        },
      ]);

      setPendingPreview(null);
      setLastAdjustmentData(null);
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
    setLastAdjustmentData(null);
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
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Chat de Ajustes
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                <Brain size={10} />
                RAG
              </span>
            </h3>
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
                          EDITABLE_ZONES[message.preview.zone]?.bgColor || 'bg-gray-500/20'
                        } ${EDITABLE_ZONES[message.preview.zone]?.color || 'text-gray-400'}`}
                      >
                        {message.preview.zone_label}
                      </span>
                      {message.confidence && message.confidence > 0.7 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          {Math.round(message.confidence * 100)}% confiança
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary">{message.preview.diff_summary}</p>
                    {message.preview.reasoning && (
                      <p className="text-xs text-text-muted mt-2 italic">
                        💡 {message.preview.reasoning}
                      </p>
                    )}
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
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                Consultando RAG e processando...
              </span>
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
