const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';

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
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_agents_status',
    description: 'Lista todos os agentes com seus status atuais (ativo, erro, pausado).',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_leads_metrics',
    description: 'Retorna métricas de leads para o período especificado.',
    input_schema: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Período para as métricas',
          enum: ['hoje', '7d', '30d'],
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_cold_call_metrics',
    description: 'Retorna métricas de cold calls realizadas.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_aios_overview',
    description: 'Retorna overview do AIOS: agentes, stories e custos.',
    input_schema: {
      type: 'object',
      properties: {},
    },
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

  const systemPrompt = `Você é o JARVIS, orchestrator central do AI Factory da MOTTIVME. Responda sempre em português brasileiro. Seja direto e conciso. Contexto atual: ${systemContext}`;

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
