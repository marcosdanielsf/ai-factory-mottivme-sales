const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-5';

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

interface AnthropicContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicMessage {
  id: string;
  content: AnthropicContentBlock[];
  stop_reason: string;
  role: string;
}

const JARVIS_TOOLS: AnthropicTool[] = [
  {
    name: 'get_system_status',
    description: 'Retorna o status geral do sistema AI Factory, incluindo saúde dos serviços.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_agents_status',
    description: 'Lista todos os agentes AIOS com seus status atuais (active, idle, error, offline).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_leads_metrics',
    description: 'Retorna métricas de leads para o período especificado.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Período', enum: ['hoje', '7d', '30d'] },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_cold_call_metrics',
    description: 'Retorna métricas de cold calls realizadas.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_aios_overview',
    description: 'Retorna overview do AIOS: agentes, stories e custos.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'update_aios_agent_status',
    description: 'Ativa ou desativa um agente AIOS. Use para ligar/desligar agentes pelo nome ou ID.',
    input_schema: {
      type: 'object',
      properties: {
        agent_name: { type: 'string', description: 'Nome do agente (ex: Diana, Julia, Shield)' },
        agent_id: { type: 'string', description: 'ID do agente (opcional se informar nome)' },
        new_status: { type: 'string', description: 'Novo status', enum: ['active', 'idle', 'offline'] },
        is_active: { type: 'string', description: 'true para ativar, false para desativar', enum: ['true', 'false'] },
      },
    },
  },
  {
    name: 'pause_ai_conversation',
    description: 'Pausa a IA de uma conversa de supervisão (SDR/atendimento). Use quando pedir para pausar IA de um lead específico.',
    input_schema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'ID da sessão/conversa' },
        lead_name: { type: 'string', description: 'Nome do lead (para buscar a sessão)' },
      },
    },
  },
  {
    name: 'resume_ai_conversation',
    description: 'Retoma a IA de uma conversa pausada.',
    input_schema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'ID da sessão/conversa' },
        lead_name: { type: 'string', description: 'Nome do lead' },
      },
    },
  },
  // TOOLS DE AÇÃO (novas)
  {
    name: 'reprocess_lead',
    description: 'Reprocessa a classificação 3D de um lead específico. Use quando pedem para reclassificar ou reprocessar um lead.',
    input_schema: {
      type: 'object',
      properties: {
        lead_name: { type: 'string', description: 'Nome do lead para reprocessar' },
        lead_id: { type: 'string', description: 'ID do lead (opcional se informar nome)' },
      },
    },
  },
  {
    name: 'send_message_to_lead',
    description: 'Envia uma mensagem para um lead via GHL. Use quando pedem para mandar mensagem, follow-up ou contato.',
    input_schema: {
      type: 'object',
      properties: {
        lead_name: { type: 'string', description: 'Nome do lead' },
        message: { type: 'string', description: 'Texto da mensagem a enviar' },
        channel: { type: 'string', description: 'Canal de envio', enum: ['whatsapp', 'sms', 'email'] },
      },
      required: ['message'],
    },
  },
  {
    name: 'run_agent_test',
    description: 'Roda um teste de qualidade em um agente específico. Use quando pedem para testar um agente.',
    input_schema: {
      type: 'object',
      properties: {
        agent_name: { type: 'string', description: 'Nome do agente (ex: Diana, Julia, Bruna)' },
        agent_id: { type: 'string', description: 'ID do agent_version (opcional)' },
      },
    },
  },
  {
    name: 'approve_agent_version',
    description: 'Aprova uma versão de agente pendente. Use quando pedem para aprovar ou ativar uma versão de agente.',
    input_schema: {
      type: 'object',
      properties: {
        agent_name: { type: 'string', description: 'Nome do agente' },
        version_id: { type: 'string', description: 'ID da versão (opcional se informar nome)' },
      },
    },
  },
  {
    name: 'create_cold_call_campaign',
    description: 'Cria uma nova campanha de cold call. Use quando pedem para criar campanha de ligações.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da campanha' },
        description: { type: 'string', description: 'Descrição' },
        target_count: { type: 'string', description: 'Número de leads alvo' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_best_call_hours',
    description: 'Analisa dados históricos para sugerir os melhores horários para cold calls.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_funnel_metrics',
    description: 'Retorna métricas do funil de vendas: leads novos, responderam, agendaram, compareceram, fecharam.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Período', enum: ['7d', '30d', '90d'] },
      },
    },
  },
  {
    name: 'get_anomaly_report',
    description: 'Detecta anomalias nos dados: queda/subida incomum de leads, custos fora do padrão, agentes com comportamento atípico.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_cost_forecast',
    description: 'Projeta o custo de IA para o resto do mês baseado no ritmo atual.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_daily_summary',
    description: 'Gera um resumo executivo completo do dia: leads, conversões, agentes, custos, destaques.',
    input_schema: { type: 'object', properties: {} },
  },
];

export async function askJarvis(
  userMessage: string,
  systemContext: string,
  onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<unknown>
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return '⚠️ Configure VITE_ANTHROPIC_API_KEY no .env para ativar o AI Brain.';
  }

  const systemPrompt = `Você é o JARVIS, orchestrator central do AI Factory da MOTTIVME.
Você tem acesso COMPLETO ao sistema: agentes IA, leads, cold calls, AIOS, custos, funil de vendas.
Você pode EXECUTAR ações: reprocessar leads, enviar mensagens, rodar testes, aprovar agentes, criar campanhas.
Você também analisa anomalias, faz previsões de custo e gera resumos executivos.
Responda sempre em português brasileiro. Seja direto, confiante e conciso.
Quando executar uma ação, confirme brevemente o que fez.
Quando detectar um problema, sugira a solução proativamente.
Contexto atual: ${systemContext}`;

  try {
    const messages: { role: string; content: unknown }[] = [
      { role: 'user', content: userMessage },
    ];

    // First API call
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: JARVIS_TOOLS,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return `❌ Erro ao conectar com o AI Brain (${response.status}). Tente novamente.`;
    }

    const data: AnthropicMessage = await response.json();

    // Check if we need to handle tool use
    if (data.stop_reason === 'tool_use') {
      const toolUseBlocks = data.content.filter((b) => b.type === 'tool_use');
      const toolResults: { type: string; tool_use_id: string; content: string }[] = [];

      for (const block of toolUseBlocks) {
        if (block.type === 'tool_use' && block.id && block.name) {
          let result: unknown = null;
          try {
            if (onToolCall) {
              result = await onToolCall(block.name, (block.input as Record<string, unknown>) ?? {});
            }
          } catch {
            result = { error: 'Tool call failed' };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result ?? {}),
          });
        }
      }

      // Second API call with tool results
      const response2 = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          tools: JARVIS_TOOLS,
          messages: [
            ...messages,
            { role: 'assistant', content: data.content },
            { role: 'user', content: toolResults },
          ],
        }),
      });

      if (!response2.ok) {
        return `❌ Erro ao processar resultado das ferramentas (${response2.status}).`;
      }

      const data2: AnthropicMessage = await response2.json();
      const textBlock = data2.content.find((b) => b.type === 'text');
      return textBlock?.text ?? '(sem resposta)';
    }

    // No tool use — just return text
    const textBlock = data.content.find((b) => b.type === 'text');
    return textBlock?.text ?? '(sem resposta)';
  } catch (err) {
    console.error('askJarvis error:', err);
    return '❌ Erro inesperado ao contatar o AI Brain. Verifique sua conexão.';
  }
}
