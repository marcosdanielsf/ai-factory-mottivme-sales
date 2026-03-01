/**
 * conclaveService.ts
 * Service para executar deliberacoes do Conclave de experts.
 *
 * O Conclave convoca multiplos agentes experts para deliberar sobre
 * uma questao, coleta respostas individuais e sintetiza um consenso.
 */

import { supabase } from "../lib/supabase";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bfumywvwubvernvhjehk.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY || "";

// ============================================================
// TYPES
// ============================================================
export interface ConclaveRequest {
  question: string;
  context?: string;
  agentIds: string[];
  maxTokensPerAgent?: number;
}

export interface AgentResponse {
  agent_id: string;
  agent_name: string;
  response: string;
  reasoning: string;
  confidence: number;
  dissent_points: string[];
  processing_ms: number;
}

export interface ConclaveSession {
  id: string;
  question: string;
  context?: string;
  agent_responses: AgentResponse[];
  synthesis: string;
  consensus_level: "high" | "medium" | "low";
  key_agreements: string[];
  key_disagreements: string[];
  final_recommendation: string;
  total_agents: number;
  successful_agents: number;
  created_at: string;
}

interface AgentRecord {
  id: string;
  agent_name?: string;
  system_prompt?: string;
  is_active?: boolean;
  version?: string;
}

// ============================================================
// HELPERS
// ============================================================
async function fetchWithAuth(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...((opts.headers as Record<string, string>) || {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${path} -> ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function rpcCall(fn: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new Error(`RPC ${fn}: ${error.message}`);
  return data;
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500,
): Promise<string> {
  const key = OPENAI_KEY || import.meta.env.VITE_OPENAI_KEY;
  if (!key) throw new Error("VITE_OPENAI_KEY nao configurada");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI -> ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function fetchRelevantChunks(
  question: string,
  limit = 5,
): Promise<string> {
  // Tentar busca semantica via RPC
  try {
    const results = await rpcCall("search_knowledge", {
      p_query: question,
      p_limit: limit,
    });

    if (results && results.length > 0) {
      return results
        .map(
          (r: { content?: string; chunk?: string }) =>
            r.content || r.chunk || "",
        )
        .join("\n\n---\n\n");
    }
  } catch (_) {
    // Fallback: buscar chunks mais recentes
  }

  // Fallback simples
  try {
    const chunks = await fetchWithAuth(
      `knowledge_chunks?select=content&order=created_at.desc&limit=${limit}`,
    );
    return (chunks || [])
      .map((c: { content: string }) => c.content)
      .join("\n\n---\n\n");
  } catch (_) {
    return "";
  }
}

async function fetchAgentSystemPrompt(
  agentId: string,
): Promise<AgentRecord | null> {
  // Tentar em auto_agents primeiro
  try {
    const agents = await fetchWithAuth(
      `auto_agents?id=eq.${agentId}&select=id,agent_name,system_prompt&limit=1`,
    );
    if (agents && agents.length > 0) return agents[0];
  } catch (_) {
    // tabela nao existe
  }

  // Fallback: agent_versions
  try {
    const agents = await fetchWithAuth(
      `agent_versions?id=eq.${agentId}&select=id,agent_name,system_prompt,version&limit=1`,
    );
    if (agents && agents.length > 0) return agents[0];
  } catch (_) {
    // falhou
  }

  return null;
}

async function callSingleAgent(
  agent: AgentRecord,
  question: string,
  context: string,
  relevantChunks: string,
  maxTokens: number,
): Promise<Omit<AgentResponse, "processing_ms">> {
  const agentName = agent.agent_name || `Agente ${agent.id.slice(0, 8)}`;
  const systemPrompt =
    agent.system_prompt || `Voce e um expert chamado ${agentName}.`;

  const userPrompt = `${context ? `CONTEXTO: ${context}\n\n` : ""}${relevantChunks ? `CONHECIMENTO RELEVANTE:\n${relevantChunks}\n\n` : ""}QUESTAO PARA DELIBERAR: ${question}

Responda de forma estruturada com:
1. Sua RESPOSTA principal (2-3 paragrafos)
2. Seu RACIOCINIO (como chegou a esta conclusao)
3. Seu NIVEL DE CONFIANCA (0 a 1)
4. PONTOS DE DISCORDANCIA (o que voce discordaria de uma opiniao consensual, se houver)

Formato de resposta esperado (JSON):
{
  "response": "sua resposta principal",
  "reasoning": "seu raciocinio",
  "confidence": 0.8,
  "dissent_points": ["ponto 1", "ponto 2"]
}`;

  const raw = await callOpenAI(systemPrompt, userPrompt, maxTokens);

  // Tentar parsear JSON da resposta
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        agent_id: agent.id,
        agent_name: agentName,
        response: parsed.response || raw,
        reasoning: parsed.reasoning || "",
        confidence:
          typeof parsed.confidence === "number"
            ? Math.min(1, Math.max(0, parsed.confidence))
            : 0.7,
        dissent_points: Array.isArray(parsed.dissent_points)
          ? parsed.dissent_points
          : [],
      };
    } catch (_) {
      // fallback para texto puro
    }
  }

  return {
    agent_id: agent.id,
    agent_name: agentName,
    response: raw,
    reasoning: "",
    confidence: 0.7,
    dissent_points: [],
  };
}

async function synthesizeResponses(
  question: string,
  responses: AgentResponse[],
): Promise<
  Omit<
    ConclaveSession,
    | "id"
    | "question"
    | "context"
    | "agent_responses"
    | "total_agents"
    | "successful_agents"
    | "created_at"
  >
> {
  const responseSummary = responses
    .map(
      (r) =>
        `**${r.agent_name}** (confianca: ${r.confidence.toFixed(1)}):\n${r.response}\n\nDissencias: ${r.dissent_points.join(", ") || "nenhuma"}`,
    )
    .join("\n\n===\n\n");

  const synthesisPrompt = `Voce e um sintetizador imparcial. Analise as perspectivas de ${responses.length} experts sobre a seguinte questao e produza uma sintese estruturada.

QUESTAO: ${question}

RESPOSTAS DOS EXPERTS:
${responseSummary}

Produza um JSON com:
{
  "synthesis": "paragrafos de sintese geral",
  "consensus_level": "high|medium|low",
  "key_agreements": ["ponto acordado 1", "ponto acordado 2"],
  "key_disagreements": ["ponto de discordancia 1"],
  "final_recommendation": "recomendacao final baseada na sintese"
}

consensus_level: high (todos concordam >80%), medium (maioria concorda), low (opinioes divididas).`;

  const raw = await callOpenAI(
    "Voce e um sintetizador de perspectivas multiplas de experts.",
    synthesisPrompt,
    2000,
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        synthesis: parsed.synthesis || raw,
        consensus_level: ["high", "medium", "low"].includes(
          parsed.consensus_level,
        )
          ? parsed.consensus_level
          : "medium",
        key_agreements: Array.isArray(parsed.key_agreements)
          ? parsed.key_agreements
          : [],
        key_disagreements: Array.isArray(parsed.key_disagreements)
          ? parsed.key_disagreements
          : [],
        final_recommendation: parsed.final_recommendation || "",
      };
    } catch (_) {
      // fallback
    }
  }

  return {
    synthesis: raw,
    consensus_level: "medium",
    key_agreements: [],
    key_disagreements: [],
    final_recommendation: "",
  };
}

async function saveConclaveSession(
  session: Omit<ConclaveSession, "id">,
): Promise<string> {
  try {
    const result = await fetchWithAuth("conclave_sessions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...session,
        created_at: new Date().toISOString(),
      }),
    });
    return result?.[0]?.id || "unsaved";
  } catch (err) {
    console.warn("[conclaveService] Falha ao salvar sessao:", err);
    return "unsaved";
  }
}

// ============================================================
// MAIN EXPORT
// ============================================================
export async function runConclave(
  request: ConclaveRequest,
): Promise<ConclaveSession> {
  const { question, context, agentIds, maxTokensPerAgent = 1200 } = request;

  if (!question || question.trim().length === 0) {
    throw new Error("Questao nao pode ser vazia");
  }
  if (!agentIds || agentIds.length === 0) {
    throw new Error("Pelo menos um agente deve ser selecionado");
  }
  if (agentIds.length > 10) {
    throw new Error("Maximo de 10 agentes por sessao do Conclave");
  }

  // Buscar chunks relevantes para a questao
  const relevantChunks = await fetchRelevantChunks(question);

  // Buscar system_prompts de todos os agentes em paralelo
  const agentRecords = await Promise.all(
    agentIds.map((id) => fetchAgentSystemPrompt(id)),
  );

  const validAgents = agentRecords.filter((a): a is AgentRecord => a !== null);
  if (validAgents.length === 0) {
    throw new Error("Nenhum agente valido encontrado com os IDs fornecidos");
  }

  // Convocar cada agente (sequencial para evitar rate limit)
  const agentResponses: AgentResponse[] = [];
  for (const agent of validAgents) {
    const startMs = Date.now();
    try {
      const response = await callSingleAgent(
        agent,
        question,
        context || "",
        relevantChunks,
        maxTokensPerAgent,
      );
      agentResponses.push({
        ...response,
        processing_ms: Date.now() - startMs,
      });
    } catch (err) {
      console.warn(`[conclaveService] Agente ${agent.agent_name} falhou:`, err);
      // Continuar com os outros
    }

    // Rate limiting suave entre agentes
    await new Promise((r) => setTimeout(r, 500));
  }

  if (agentResponses.length === 0) {
    throw new Error("Nenhum agente conseguiu processar a questao");
  }

  // Sintetizar respostas
  const synthesis = await synthesizeResponses(question, agentResponses);

  const sessionData: Omit<ConclaveSession, "id"> = {
    question,
    context,
    agent_responses: agentResponses,
    total_agents: agentIds.length,
    successful_agents: agentResponses.length,
    created_at: new Date().toISOString(),
    ...synthesis,
  };

  // Salvar no Supabase
  const sessionId = await saveConclaveSession(sessionData);

  return { id: sessionId, ...sessionData };
}

export async function getConclaveHistory(
  limit = 20,
): Promise<ConclaveSession[]> {
  try {
    const sessions = await fetchWithAuth(
      `conclave_sessions?select=*&order=created_at.desc&limit=${limit}`,
    );
    return sessions || [];
  } catch (_) {
    return [];
  }
}

export async function getConclaveSession(
  sessionId: string,
): Promise<ConclaveSession | null> {
  try {
    const sessions = await fetchWithAuth(
      `conclave_sessions?id=eq.${sessionId}&select=*&limit=1`,
    );
    return sessions?.[0] || null;
  } catch (_) {
    return null;
  }
}
