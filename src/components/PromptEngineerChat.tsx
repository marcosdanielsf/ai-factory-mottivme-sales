import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, XCircle, Eye, Sparkles, Shield, AlertTriangle, Zap, Brain, Code, Target, Briefcase, GitBranch, FileText, Settings } from 'lucide-react';
import DOMPurify from 'dompurify';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  preview?: PromptPreview;
  status?: 'pending' | 'approved' | 'rejected';
  zone?: EditableZone;
  confidence?: number;
}

interface PromptPreview {
  zone: EditableZone;
  zone_label: string;
  field_path: string;
  operation: 'add' | 'update' | 'remove';
  before: string;
  after: string;
  diff_summary: string;
  reasoning: string;
}

type EditableZone = 
  | 'system_prompt'      // Prompt principal
  | 'compliance_rules'   // Regras de compliance
  | 'personality_config' // Personalidade
  | 'business_config'    // Dados do negócio
  | 'tools_config'       // Ferramentas
  | 'hyperpersonalization' // Contexto
  | 'prompts_by_mode';   // Prompts por modo

// =============================================================================
// ZONE DEFINITIONS - Estrutura dos Agentes MOTTIVME
// =============================================================================

const ZONES: Record<EditableZone, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  examples: string[];
  structure_hint: string;
}> = {
  system_prompt: {
    label: 'System Prompt',
    description: 'Prompt principal do agente (CRITICS framework)',
    icon: FileText,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    examples: [
      'Adicione uma nova objeção mapeada',
      'Mude o tom da saudação',
      'Adicione regra de formatação',
    ],
    structure_hint: 'Seções: <Role>, <Constraints>, <Inputs>, <Tools>, <Instructions>, <Solutions>',
  },
  compliance_rules: {
    label: 'Compliance',
    description: 'Regras de segurança, escalação e anti-alucinação',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    examples: [
      'Adicione proibição de mencionar concorrentes',
      'Configure trigger de escalação',
      'Adicione regra anti-alucinação',
    ],
    structure_hint: 'Campos: proibicoes[], escalacao.triggers[], anti_alucinacao[], objecoes_mapeadas{}',
  },
  personality_config: {
    label: 'Personalidade',
    description: 'Tom de voz, emojis, formalidade, idiomas',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    examples: [
      'Mude o tom para mais consultivo',
      'Reduza uso de emojis',
      'Configure nível de formalidade',
    ],
    structure_hint: 'Campos: tom_voz, nivel_formalidade (1-10), uso_emojis, idiomas_suportados[], modos.{modo}.tom',
  },
  business_config: {
    label: 'Negócio',
    description: 'Valores, unidades, horários, dados comerciais',
    icon: Briefcase,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    examples: [
      'Atualize valor do curso de nails',
      'Adicione nova unidade',
      'Configure horário de atendimento',
    ],
    structure_hint: 'Campos: valores.{curso}, unidades[], horario, parcelamento{}',
  },
  tools_config: {
    label: 'Ferramentas',
    description: 'Tools disponíveis e seus parâmetros',
    icon: Code,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    examples: [
      'Habilite ferramenta de agendamento',
      'Configure limite de chamadas',
      'Adicione novo parâmetro em tool',
    ],
    structure_hint: 'Campos: enabled_tools.{categoria}[].code, .enabled, .parameters[], .max_chamadas_por_conversa',
  },
  hyperpersonalization: {
    label: 'Contexto',
    description: 'Setor, localização, público-alvo, modos ativos',
    icon: Target,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    examples: [
      'Configure público-alvo primário',
      'Adicione modo de operação',
      'Configure timezone',
    ],
    structure_hint: 'Campos: setor, localizacao{}, publico_alvo{}, modos_habilitados[], saudacao_por_horario{}',
  },
  prompts_by_mode: {
    label: 'Modos',
    description: 'Prompts específicos por modo de operação',
    icon: GitBranch,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    examples: [
      'Edite prompt do modo SDR',
      'Configure fluxo do followuper',
      'Adicione novo modo de operação',
    ],
    structure_hint: 'Campos: sdr_inbound, social_seller, followuper, concierge, reativador',
  },
};

// Zonas protegidas (read-only)
const PROTECTED_ZONES = ['id', 'client_id', 'created_at', 'version'];

// =============================================================================
// PROMPT DO ENGENHEIRO
// =============================================================================

const ENGINEER_SYSTEM_PROMPT = `Você é o **Engenheiro de Prompts** da AI Factory MOTTIVME.

## SUA FUNÇÃO
Você recebe pedidos em linguagem natural e traduz em alterações precisas nos prompts dos agentes.
Você NÃO é um chatbot genérico - você é um ESPECIALISTA que entende a estrutura CRITICS e faz modificações cirúrgicas.

## ESTRUTURA DOS AGENTES (OBRIGATÓRIO ENTENDER)

### 1. system_prompt (string)
Prompt principal usando CRITICS framework:
- <Role> - Persona e contexto
- <Constraints> - Regras e limitações
- <Inputs> - Como recebe dados
- <Tools> - Ferramentas disponíveis
- <Instructions> - Fluxo por modo
- <Solutions> - Objeções mapeadas
- <Conclusions> - Formato de saída

### 2. compliance_rules (JSON)
{
  "proibicoes": ["string"],
  "escalacao": { "triggers": ["string"] },
  "anti_alucinacao": ["string"],
  "objecoes_mapeadas": { "nome": { "tecnica": "string" } }
}

### 3. personality_config (JSON)
{
  "tom_voz": "string",
  "nivel_formalidade": 1-10,
  "uso_emojis": boolean,
  "max_emoji_por_mensagem": number,
  "idiomas_suportados": ["string"],
  "modos": { "modo": { "tom": "string", "objetivo": "string" } }
}

### 4. business_config (JSON)
{
  "nome_negocio": "string",
  "valores": { "curso": { "valor": number, "moeda": "string" } },
  "unidades": [{ "nome": "string", "estado": "string" }],
  "horario": "string",
  "parcelamento": { "max_parcelas": number }
}

### 5. tools_config (JSON)
{
  "enabled_tools": {
    "categoria": [{ "code": "string", "enabled": boolean, "parameters": [] }]
  }
}

### 6. hyperpersonalization (JSON)
{
  "setor": "string",
  "localizacao": { "pais": "string", "estado": "string" },
  "publico_alvo": { "primario": "string" },
  "modos_habilitados": ["string"]
}

### 7. prompts_by_mode (JSON)
{
  "sdr_inbound": "# MODO: ...",
  "social_seller": "# MODO: ...",
  ...
}

## COMO RESPONDER

1. IDENTIFIQUE a zona correta (system_prompt, compliance_rules, etc)
2. IDENTIFIQUE o campo específico dentro da zona
3. PROPONHA a alteração com:
   - zone: qual zona
   - field_path: caminho do campo (ex: "compliance_rules.proibicoes")
   - operation: add | update | remove
   - before: valor atual (se souber)
   - after: novo valor proposto
   - reasoning: por que essa alteração faz sentido

## REGRAS

- NUNCA invente estrutura - use EXATAMENTE os campos documentados
- SEMPRE identifique a zona correta antes de propor alteração
- Se não souber onde vai, PERGUNTE ao usuário
- Para system_prompt, identifique a SEÇÃO correta (<Role>, <Constraints>, etc)
- Para JSONs, use path notation (ex: "business_config.valores.nail.valor")
- VALIDE que a alteração não quebra a estrutura`;

// =============================================================================
// COMPONENT
// =============================================================================

interface PromptEngineerChatProps {
  agentId: string;
  agentName: string;
  currentPrompt: string;
  currentConfigs: {
    hyperpersonalization?: any;
    compliance_rules?: any;
    personality_config?: any;
    business_config?: any;
    tools_config?: any;
    prompts_by_mode?: any;
  };
  onApplyChanges: (zone: string, newContent: any, fieldPath?: string) => Promise<void>;
  onClose?: () => void;
}

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_PROMPT_ENGINEER || 'https://cliente-a1.mentorfy.io/webhook/engenheiro-prompt';

export const PromptEngineerChat: React.FC<PromptEngineerChatProps> = ({
  agentId,
  agentName,
  currentPrompt,
  currentConfigs,
  onApplyChanges,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `🛠️ **Engenheiro de Prompts** ativo para **${agentName}**

Eu conheço a estrutura completa deste agente e posso fazer alterações precisas em:

${Object.entries(ZONES).map(([key, zone]) => `• **${zone.label}** - ${zone.description}`).join('\n')}

**Como funciona:**
1. Descreva o que quer alterar em linguagem natural
2. Eu identifico a zona e campo corretos
3. Proponho a alteração com preview
4. Você aprova → eu aplico automaticamente

**Exemplos:**
_"Adicione regra: nunca mencionar preço antes de qualificar"_
_"O tom no modo followuper deve ser mais casual"_
_"Atualize o valor do curso de nails para $950"_`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<Message | null>(null);
  const [selectedZone, setSelectedZone] = useState<EditableZone | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Preparar contexto do agente para o webhook
  const prepareAgentContext = () => {
    return {
      agentId,
      agentName,
      system_prompt_preview: currentPrompt.substring(0, 2000),
      system_prompt_sections: extractSections(currentPrompt),
      configs: {
        hyperpersonalization: currentConfigs.hyperpersonalization,
        compliance_rules: currentConfigs.compliance_rules,
        personality_config: currentConfigs.personality_config,
        business_config: currentConfigs.business_config,
        tools_config: currentConfigs.tools_config,
        prompts_by_mode: currentConfigs.prompts_by_mode ? Object.keys(currentConfigs.prompts_by_mode) : [],
      },
    };
  };

  // Extrair seções do system_prompt
  const extractSections = (prompt: string): string[] => {
    const sectionRegex = /<(\w+)>/g;
    const sections: string[] = [];
    let match;
    while ((match = sectionRegex.exec(prompt)) !== null) {
      if (!sections.includes(match[1])) {
        sections.push(match[1]);
      }
    }
    return sections;
  };

  // Processar pedido via webhook n8n (Engenheiro de Prompt)
  const processRequest = async (userMessage: string): Promise<Message> => {
    try {
      // Formato esperado pelo workflow n8n:
      // { comando: "editar", cliente: "Nome", instrucao: "..." }
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comando: 'editar',
          cliente: agentName,
          instrucao: userMessage,
          // Dados extras para contexto
          zone: selectedZone,
          agent_id: agentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const data = await response.json();
      
      // Workflow retorna: { success, message, data: { version_id, versao }, comando }
      if (data.success && data.data?.version_id) {
        // Edição foi processada pelo workflow
        const detectedZone = selectedZone || detectZoneFromMessage(userMessage);
        const zoneInfo = ZONES[detectedZone];
        
        const preview: PromptPreview = {
          zone: detectedZone,
          zone_label: zoneInfo.label,
          field_path: detectedZone,
          operation: 'update',
          before: '[Processado pelo Engenheiro n8n]',
          after: userMessage,
          diff_summary: `Nova versão ${data.data.versao} criada`,
          reasoning: data.message || 'Mudança aplicada via workflow n8n',
        };

        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **Mudança processada pelo Engenheiro!**

**Agente:** ${agentName}
**Nova versão:** ${data.data.versao}
**Status:** pending_approval

**ID para aprovar:** \`${data.data.version_id}\`

${data.message || ''}

A versão foi criada mas ainda precisa de aprovação.
Use o comando \`/prompt aprovar ${data.data.version_id}\` para ativar.`,
          timestamp: new Date(),
          preview,
          status: 'approved', // Já foi aplicado pelo workflow
          zone: detectedZone,
          confidence: 1,
        };
      }
      
      // Se não teve sucesso ou é outro tipo de resposta
      if (!data.success) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ **Resposta do Engenheiro:**\n\n${data.message || 'Não foi possível processar a solicitação.'}`,
          timestamp: new Date(),
        };
      }

      // Fallback para respostas de outros comandos (listar, ver, etc)
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message || 'Comando processado.',
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Webhook error:', error);
      return processLocalFallback(userMessage);
    }
  };

  // Detectar se a mensagem é conversacional (não é uma instrução de edição)
  const isConversationalMessage = (message: string): boolean => {
    const lower = message.toLowerCase().trim();
    const conversationalPatterns = [
      /^(oi|olá|hey|e aí|fala)/,
      /^(obrigad|valeu|thanks)/,
      /\?$/, // Perguntas genéricas
      /^(sim|não|ok|beleza|show|certo)/,
      /^(da pra|dá pra|pode|consegue|como)/,
      /^(o que|quem|qual|quando|onde|por que)/,
    ];
    // Se bate padrão conversacional E não contém keywords de edição, é conversacional
    const isConversational = conversationalPatterns.some(p => p.test(lower));
    const hasEditKeywords = /(?:adicion|remov|atualiz|mude|alter|configur|habilit|desabilit|proibi|nunca|sempre|deve ser|defin|seta|coloque|troque|aument|diminu|reduz)/i.test(message);
    return isConversational && !hasEditKeywords;
  };

  // Extrair o conteúdo da instrução (a regra/valor real, não o texto conversacional)
  const extractInstructionContent = (message: string, zone: EditableZone): { content: string; operation: 'add' | 'update' | 'remove'; fieldPath: string } => {
    const lower = message.toLowerCase();

    // Detectar operação
    let operation: 'add' | 'update' | 'remove' = 'update';
    if (/(?:adicion|inclua|coloque|insira|crie)/.test(lower)) operation = 'add';
    if (/(?:remov|delet|tire|exclu)/.test(lower)) operation = 'remove';

    // Extrair conteúdo baseado na zona
    switch (zone) {
      case 'compliance_rules': {
        // "nunca mencionar preço antes de qualificar" → extrair a regra
        const ruleMatch = message.match(/(?:regra[:\s]*|nunca\s+|proib\w+[:\s]*|sempre\s+)(.+)/i);
        const content = ruleMatch ? ruleMatch[0].trim() : message;
        const subField = /proibi|nunca/.test(lower) ? 'proibicoes' : /escala/.test(lower) ? 'escalacao.triggers' : 'proibicoes';
        return { content, operation: operation === 'update' ? 'add' : operation, fieldPath: `compliance_rules.${subField}` };
      }
      case 'personality_config': {
        // "O tom no modo followuper deve ser mais casual" → extrair tom e modo
        const modeMatch = lower.match(/modo\s+(\w+)/);
        const mode = modeMatch ? modeMatch[1] : null;
        const tomMatch = message.match(/(?:tom|estilo|voz)\s+(?:deve ser |mais |para )?\s*(.+)/i);
        const content = tomMatch ? tomMatch[1].trim() : message;
        const fieldPath = mode ? `personality_config.modos.${mode}.tom` : 'personality_config.tom_voz';
        return { content, operation: 'update', fieldPath };
      }
      case 'business_config': {
        // "Atualize o valor do curso de nails para $950" → extrair item e valor
        const valueMatch = message.match(/(?:valor|preço)\s+(?:do|da|de)\s+(.+?)\s+(?:para|pra|=|:)\s*(.+)/i);
        if (valueMatch) {
          return { content: `${valueMatch[1].trim()}: ${valueMatch[2].trim()}`, operation: 'update', fieldPath: `business_config.valores` };
        }
        return { content: message, operation, fieldPath: 'business_config' };
      }
      case 'prompts_by_mode': {
        const modeMatch = lower.match(/modo\s+(\w+)/);
        const mode = modeMatch ? modeMatch[1] : 'sdr_inbound';
        return { content: message, operation, fieldPath: `prompts_by_mode.${mode}` };
      }
      default:
        return { content: message, operation, fieldPath: zone };
    }
  };

  // Obter valor atual de uma zona
  const getCurrentValue = (zone: EditableZone, fieldPath: string): string => {
    if (zone === 'system_prompt') {
      return currentPrompt ? currentPrompt.substring(0, 300) + (currentPrompt.length > 300 ? '...' : '') : '[vazio]';
    }
    const config = currentConfigs[zone as keyof typeof currentConfigs];
    if (!config) return '[não configurado]';
    // Navegar pelo fieldPath para achar o valor
    const parts = fieldPath.split('.').slice(1); // Remove o nome da zona
    let value: any = config;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return JSON.stringify(config).substring(0, 200) + '...';
      }
    }
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2).substring(0, 200);
    return String(value);
  };

  // Fallback local se webhook falhar
  const processLocalFallback = (userMessage: string): Message => {
    // Se é mensagem conversacional, pedir instrução clara
    if (isConversationalMessage(userMessage)) {
      return createClarificationMessage(userMessage);
    }

    const detectedZone = selectedZone || detectZoneFromMessage(userMessage);
    const zoneInfo = ZONES[detectedZone];
    const { content, operation, fieldPath } = extractInstructionContent(userMessage, detectedZone);
    const currentValue = getCurrentValue(detectedZone, fieldPath);

    const preview: PromptPreview = {
      zone: detectedZone,
      zone_label: zoneInfo.label,
      field_path: fieldPath,
      operation,
      before: currentValue,
      after: content,
      diff_summary: `${operation === 'add' ? 'Adicionar' : operation === 'remove' ? 'Remover' : 'Atualizar'} em ${zoneInfo.label}`,
      reasoning: 'Processado localmente (webhook indisponível). Verifique o preview antes de aprovar.',
    };

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `⚠️ **Modo Offline** - Processamento local

${formatPreviewMessage(preview, zoneInfo)}`,
      timestamp: new Date(),
      preview,
      status: 'pending',
      zone: detectedZone,
    };
  };

  // Detectar zona baseado em keywords
  const detectZoneFromMessage = (message: string): EditableZone => {
    const lower = message.toLowerCase();
    
    if (lower.includes('proibi') || lower.includes('compliance') || lower.includes('escala') || lower.includes('anti-alucina')) {
      return 'compliance_rules';
    }
    if (lower.includes('tom') || lower.includes('emoji') || lower.includes('formal') || lower.includes('personalidade')) {
      return 'personality_config';
    }
    if (lower.includes('valor') || lower.includes('preço') || lower.includes('unidade') || lower.includes('horário') || lower.includes('parcela')) {
      return 'business_config';
    }
    if (lower.includes('ferramenta') || lower.includes('tool') || lower.includes('habilit')) {
      return 'tools_config';
    }
    if (lower.includes('contexto') || lower.includes('público') || lower.includes('setor') || lower.includes('localização')) {
      return 'hyperpersonalization';
    }
    if (lower.includes('modo') && (lower.includes('sdr') || lower.includes('followup') || lower.includes('social') || lower.includes('concierge'))) {
      return 'prompts_by_mode';
    }
    
    // Default: system_prompt
    return 'system_prompt';
  };

  // Criar mensagem pedindo clarificação
  const createClarificationMessage = (userMessage: string): Message => {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🤔 Preciso de mais contexto para fazer essa alteração.

**Sua solicitação:** "${userMessage}"

**Em qual zona você quer fazer essa alteração?**
${Object.entries(ZONES).map(([key, zone], i) => `${i + 1}. **${zone.label}** - ${zone.description}`).join('\n')}

Me diz o número ou descreve melhor o que você quer alterar.`,
      timestamp: new Date(),
    };
  };

  // Formatar mensagem de preview
  const formatPreviewMessage = (preview: PromptPreview, zoneInfo: typeof ZONES[EditableZone]): string => {
    return `✅ Entendi! Vou fazer essa alteração em **${preview.zone_label}**.

**Operação:** ${preview.operation === 'add' ? '➕ Adicionar' : preview.operation === 'remove' ? '➖ Remover' : '✏️ Atualizar'}
**Campo:** \`${preview.field_path}\`

**Alteração proposta:**
_"${preview.after.substring(0, 200)}${preview.after.length > 200 ? '...' : ''}"_

**Motivo:** ${preview.reasoning}

${zoneInfo.structure_hint ? `💡 _Estrutura: ${zoneInfo.structure_hint}_` : ''}

Clique em **Aprovar** para aplicar ou **Rejeitar** para cancelar.`;
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
      const response = await processRequest(input);
      setMessages(prev => [...prev, response]);
      if (response.status === 'pending') {
        setPendingPreview(response);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '❌ Erro ao processar. Tente novamente ou descreva de forma diferente.',
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
      await onApplyChanges(
        pendingPreview.preview.zone,
        pendingPreview.preview.after,
        pendingPreview.preview.field_path
      );

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
          content: `✅ **Alteração aplicada com sucesso!**

**Zona:** ${pendingPreview.preview.zone_label}
**Campo:** \`${pendingPreview.preview.field_path}\`

Uma nova versão do prompt foi criada automaticamente.`,
          timestamp: new Date(),
        },
      ]);

      setPendingPreview(null);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content: `❌ **Erro ao aplicar:** ${error.message}`,
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
        content: '↩️ Alteração cancelada. Descreva o que você quer modificar.',
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
    <div className="flex flex-col h-full bg-bg-primary relative z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-lg">
            <Zap className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Engenheiro de Prompts
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                <Brain size={10} />
                CRITICS
              </span>
            </h3>
            <p className="text-xs text-text-muted">{agentName}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded transition-colors text-text-muted hover:text-text-primary"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      {/* Zone Selector */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-bg-tertiary/50 border-b border-border-default overflow-x-auto">
        <span className="text-[10px] text-text-muted uppercase shrink-0">Zona:</span>
        <button
          onClick={() => setSelectedZone(null)}
          className={`px-2 py-1 text-xs rounded transition-colors shrink-0 ${
            !selectedZone ? 'bg-bg-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Auto
        </button>
        {Object.entries(ZONES).map(([key, zone]) => {
          const Icon = zone.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedZone(key as EditableZone)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors shrink-0 ${
                selectedZone === key ? zone.bgColor + ' ' + zone.color : 'text-text-muted hover:text-text-secondary'
              }`}
              title={zone.description}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{zone.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                message.role === 'user'
                  ? 'bg-accent-primary'
                  : message.role === 'system'
                  ? 'bg-green-500/20'
                  : 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30'
              }`}
            >
              {message.role === 'user' ? (
                <User size={16} className="text-white" />
              ) : message.role === 'system' ? (
                <CheckCircle2 size={16} className="text-green-400" />
              ) : (
                <Zap size={16} className="text-cyan-400" />
              )}
            </div>

            <div className={`max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
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
                    __html: DOMPurify.sanitize(
                      message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/_(.*?)_/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-bg-tertiary px-1 rounded text-xs">$1</code>')
                    ),
                  }}
                />

                {/* Preview Card */}
                {message.preview && message.status === 'pending' && (
                  <div className="mt-3 p-3 bg-bg-tertiary rounded-lg border border-border-default">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={14} className="text-text-muted" />
                      <span className="text-xs font-medium text-text-muted">Preview</span>
                      {message.zone && ZONES[message.zone] && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${ZONES[message.zone].bgColor} ${ZONES[message.zone].color}`}
                        >
                          {ZONES[message.zone].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary font-mono bg-bg-primary p-2 rounded">
                      {message.preview.field_path}
                    </p>
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
                      <><CheckCircle2 size={12} /> Aplicado</>
                    ) : (
                      <><XCircle size={12} /> Cancelado</>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-text-muted mt-1">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <Loader2 size={16} className="text-cyan-400 animate-spin" />
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                Analisando estrutura do agente...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Approval Actions */}
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
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Aprovar e Aplicar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border-default bg-bg-secondary pb-6">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedZone 
              ? `Alteração em ${ZONES[selectedZone].label}...` 
              : "Descreva a alteração que você quer fazer..."
            }
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
        <p className="text-[10px] text-text-muted mt-2 text-center opacity-70">
          Humanos supervisionam • IA executa • Versão criada automaticamente
        </p>
      </div>
    </div>
  );
};

export default PromptEngineerChat;
