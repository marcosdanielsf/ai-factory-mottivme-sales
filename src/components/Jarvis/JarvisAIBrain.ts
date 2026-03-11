import { supabase } from '../../lib/supabase';
import type { JarvisProject, JarvisIntent } from '../../types/jarvis';
import type { JarvisAttachment } from './types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

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

// ============================================
// BRAIN ROUTER
// ============================================

export async function detectProject(message: string): Promise<{ project: JarvisProject | null; confidence: number }> {
  try {
    const { data: projects } = await supabase
      .from('jarvis_projects')
      .select('*')
      .eq('is_active', true);

    if (!projects?.length) return { project: null, confidence: 0 };

    const messageLower = message.toLowerCase();
    let bestMatch: JarvisProject | null = null;
    let bestScore = 0;

    for (const p of projects) {
      const keywords: string[] = p.keywords ?? [];
      const matchCount = keywords.filter((k: string) => messageLower.includes(k.toLowerCase())).length;
      if (keywords.length > 0 && matchCount > 0) {
        const score = matchCount / keywords.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = p as JarvisProject;
        }
      }
    }

    return { project: bestMatch, confidence: bestScore };
  } catch {
    return { project: null, confidence: 0 };
  }
}

export async function classifyIntent(message: string): Promise<JarvisIntent> {
  const lower = message.toLowerCase();
  if (/\b(cria|crie|gera|gere|escreva|faz|faça|adiciona|adicione|implementa|implementar)\b/.test(lower)) return 'create';
  if (/\b(roda|rode|executa|execute|deploy|publica|publique)\b/.test(lower)) return 'execute';
  if (/\b(usa|use|chama|chamar|aciona|acionar|conecta|webhook)\b/.test(lower)) return 'tools';
  return 'query';
}

export async function buildJarvisContext(
  message: string,
  project: JarvisProject | null,
  conversationId: string | null
): Promise<string> {
  const parts: string[] = [];

  if (project) {
    parts.push(`[Projeto: ${project.name} (${project.type})]`);
    if (project.claude_md) parts.push(project.claude_md);
  }

  try {
    // Buscar memórias: genéricas (null) + do projeto específico + por keyword
    const queries = [
      // Memórias genéricas (sem projeto) — conhecimento geral do CLI
      supabase
        .from('jarvis_memory')
        .select('type, content, source')
        .is('project_slug', null)
        .order('importance', { ascending: false })
        .limit(15),
    ];

    // Se há projeto detectado, buscar memórias dele também
    if (project?.slug) {
      queries.push(
        supabase
          .from('jarvis_memory')
          .select('type, content, source')
          .eq('project_slug', project.slug)
          .order('created_at', { ascending: false })
          .limit(10)
      );
    }

    // Buscar por keyword na mensagem (busca semântica simples)
    const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    if (keywords.length > 0) {
      queries.push(
        supabase
          .from('jarvis_memory')
          .select('type, content, source')
          .ilike('content', `%${keywords[0]}%`)
          .order('importance', { ascending: false })
          .limit(5)
      );
    }

    // Buscar memórias temporais quando detectar "hoje", "ontem", "semana"
    const lower = message.toLowerCase();
    if (/\b(hoje|agora|hj)\b/.test(lower)) {
      const today = new Date().toISOString().split('T')[0];
      queries.push(
        supabase
          .from('jarvis_memory')
          .select('type, content, source')
          .ilike('content', `%${today}%`)
          .order('importance', { ascending: false })
          .limit(5)
      );
    }
    if (/\b(ontem|yesterday)\b/.test(lower)) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      queries.push(
        supabase
          .from('jarvis_memory')
          .select('type, content, source')
          .ilike('content', `%${yesterday}%`)
          .order('importance', { ascending: false })
          .limit(5)
      );
    }

    const results = await Promise.all(queries);
    const allMemories = results.flatMap(r => r.data ?? []);

    // Deduplicar por conteúdo (primeiras 100 chars)
    const seen = new Set<string>();
    const unique = allMemories.filter(m => {
      const key = m.content.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);

    if (unique.length) {
      parts.push(`[Memórias do sistema (${unique.length} registros)]`);
      unique.forEach((m: { type: string; content: string; source: string }) => {
        const src = m.source === 'cli_sync' ? 'CLI' : m.source === 'auto_extract' ? 'auto' : 'manual';
        parts.push(`- [${m.type}|${src}] ${m.content.substring(0, 300)}`);
      });
    }
  } catch {
    // silencioso — memórias indisponíveis não bloqueiam
  }

  if (conversationId) {
    try {
      const { data: recentMsgs } = await supabase
        .from('jarvis_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentMsgs?.length) {
        parts.push('[Histórico recente]');
        [...recentMsgs].reverse().forEach((m: { role: string; content: string }) =>
          parts.push(`${m.role}: ${m.content.substring(0, 200)}`)
        );
      }
    } catch {
      // silencioso
    }
  }

  // Inclui a mensagem atual para referência no contexto
  void message;

  return parts.join('\n');
}

// ============================================
// AUTO MEMORY EXTRACTION
// ============================================

interface ExtractedMemory {
  type: 'task' | 'preference' | 'decision' | 'update' | 'fact';
  content: string;
  importance: number;
}

export async function extractMemories(
  userMessage: string,
  assistantResponse: string,
  projectSlug: string | null
): Promise<ExtractedMemory[]> {
  const apiKey = getApiKey();
  if (!apiKey && !import.meta.env.VITE_JARVIS_BACKEND_URL) return [];

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: `Você é um extrator de memórias. Analise a conversa e extraia APENAS informações que valem lembrar para o futuro.
Tipos: task (algo a fazer), preference (gosta/prefere), decision (decidiu algo), update (status/progresso), fact (dado importante).
Retorne JSON array. Se não há nada relevante, retorne [].
Formato: [{"type":"fact","content":"resumo curto","importance":5}]
importance: 1-10 (10=crítico)
REGRAS:
- NÃO extraia saudações, perguntas genéricas ou respostas triviais
- Extraia apenas quando há informação NOVA e ÚTIL
- Max 3 memórias por interação
- Content deve ser auto-explicativo (sem "o usuário disse que...")`,
        messages: [{
          role: 'user',
          content: `<user_message>${userMessage}</user_message>\n\n<assistant_response>${assistantResponse.substring(0, 500).trimEnd()}</assistant_response>\n\nProjeto: ${projectSlug ?? 'geral'}\n\nExtraia memórias relevantes (JSON array):`,
        }],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const textBlock = data.content?.find((b: AnthropicContentBlock) => b.type === 'text');
    if (!textBlock?.text) return [];

    // Parse JSON do texto (pode ter markdown wrapping)
    const jsonStr = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown): m is ExtractedMemory => {
        if (typeof m !== 'object' || m === null) return false;
        const mem = m as Record<string, unknown>;
        return (
          typeof mem.content === 'string' &&
          mem.content.length > 0 &&
          mem.content.length <= 500 &&
          typeof mem.importance === 'number' &&
          mem.importance >= 1 &&
          mem.importance <= 10 &&
          typeof mem.type === 'string' &&
          ['task', 'preference', 'decision', 'update', 'fact'].includes(mem.type)
        );
      }
    ).slice(0, 3);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Jarvis] extractMemories failed:', err);
    return [];
  }
}

// ============================================
// API HELPERS
// ============================================

function getApiKey(): string | null {
  return import.meta.env.VITE_ANTHROPIC_API_KEY ?? null;
}

function getApiUrl(): string {
  // Backend proxy mode: se VITE_JARVIS_BACKEND_URL estiver setado, usa como proxy
  const backendUrl = import.meta.env.VITE_JARVIS_BACKEND_URL;
  if (backendUrl) return backendUrl;
  return ANTHROPIC_API_URL;
}

function getHeaders(apiKey: string): Record<string, string> {
  const backendUrl = import.meta.env.VITE_JARVIS_BACKEND_URL;
  if (backendUrl) {
    // Proxy mode: headers simples, o backend cuida da autenticação
    return { 'content-type': 'application/json' };
  }
  return {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
    'content-type': 'application/json',
  };
}

// ============================================
// ASK JARVIS (com retorno enriquecido)
// ============================================

export async function askJarvis(
  userMessage: string,
  systemContext: string,
  onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<unknown>,
  options?: { model?: string; maxTokens?: number; attachments?: JarvisAttachment[] }
): Promise<{ text: string; tokens: number; cost: number; model: string }> {
  const apiKey = getApiKey();
  const activeModel = options?.model ?? MODEL;
  const maxTokens = options?.maxTokens ?? 512;

  const errorResult = (text: string) => ({ text, tokens: 0, cost: 0, model: activeModel });

  if (!apiKey && !import.meta.env.VITE_JARVIS_BACKEND_URL) {
    return errorResult('⚠️ Configure VITE_ANTHROPIC_API_KEY ou VITE_JARVIS_BACKEND_URL no .env para ativar o AI Brain.');
  }

  const systemPrompt = `Você é o JARVIS, assistente pessoal do Marcos Daniels (MOTTIVME).

ESTILO OBRIGATÓRIO:
- Respostas CURTAS (max 3-5 linhas para perguntas simples)
- Sem emojis excessivos (max 1-2 por resposta)
- Tom direto de CEO: frase curta, sem enrolação
- Só use bullet points quando listar 3+ itens
- NUNCA repita o que o usuário já sabe

MEMÓRIA:
Você tem memórias no contexto ([CLI], [auto], [manual]).
Quando perguntarem "o que fizemos", "lembra de X", consulte as memórias PRIMEIRO.
Memórias [update] = atividades recentes. [fact] = dados do sistema. [preference] = como Marcos gosta.

CAPACIDADES:
- Acesso ao AI Factory: agentes, leads, cold calls, custos, funil
- Pode executar: reprocessar leads, enviar msgs, testar agentes, criar campanhas
- Pode analisar: anomalias, previsão de custo, resumo diário

Data de hoje: ${new Date().toISOString().split('T')[0]}. PT-BR sempre. Contexto: ${systemContext}`;

  // Custo aproximado por token (Haiku: $0.25/MTok input, $1.25/MTok output)
  function estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * 0.00000025) + (outputTokens * 0.00000125);
  }

  try {
    // Build user content: text + optional attachments (images as vision blocks, text files inline)
    const attachments = options?.attachments ?? [];
    let userContent: unknown;

    if (attachments.length === 0) {
      userContent = userMessage;
    } else {
      const contentBlocks: unknown[] = [];
      for (const att of attachments) {
        if (att.type === 'image' && att.mediaType) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: att.mediaType, data: att.data },
          });
        } else {
          // Text file: prepend as context
          contentBlocks.push({
            type: 'text',
            text: `[Arquivo: ${att.name}]\n${att.data.substring(0, 15000)}`,
          });
        }
      }
      contentBlocks.push({ type: 'text', text: userMessage });
      userContent = contentBlocks;
    }

    const messages: { role: string; content: unknown }[] = [
      { role: 'user', content: userContent },
    ];

    // First API call
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: getHeaders(apiKey ?? ''),
      body: JSON.stringify({
        model: activeModel,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: JARVIS_TOOLS,
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return errorResult(`❌ Erro ao conectar com o AI Brain (${response.status}). Tente novamente.`);
    }

    const data: AnthropicMessage & { usage?: { input_tokens: number; output_tokens: number } } = await response.json();
    const usage1 = data.usage ?? { input_tokens: 0, output_tokens: 0 };

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
      const response2 = await fetch(getApiUrl(), {
        method: 'POST',
        headers: getHeaders(apiKey ?? ''),
        body: JSON.stringify({
          model: activeModel,
          max_tokens: maxTokens,
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
        return errorResult(`❌ Erro ao processar resultado das ferramentas (${response2.status}).`);
      }

      const data2: AnthropicMessage & { usage?: { input_tokens: number; output_tokens: number } } = await response2.json();
      const usage2 = data2.usage ?? { input_tokens: 0, output_tokens: 0 };
      const totalTokens = usage1.input_tokens + usage1.output_tokens + usage2.input_tokens + usage2.output_tokens;
      const totalCost = estimateCost(usage1.input_tokens + usage2.input_tokens, usage1.output_tokens + usage2.output_tokens);

      const textBlock = data2.content.find((b) => b.type === 'text');
      return { text: textBlock?.text ?? '(sem resposta)', tokens: totalTokens, cost: totalCost, model: activeModel };
    }

    // No tool use — just return text
    const textBlock = data.content.find((b) => b.type === 'text');
    const totalTokens = usage1.input_tokens + usage1.output_tokens;
    const totalCost = estimateCost(usage1.input_tokens, usage1.output_tokens);

    return { text: textBlock?.text ?? '(sem resposta)', tokens: totalTokens, cost: totalCost, model: activeModel };
  } catch (err) {
    console.error('askJarvis error:', err);
    return errorResult('❌ Erro inesperado ao contatar o AI Brain. Verifique sua conexão.');
  }
}
