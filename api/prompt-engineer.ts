import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://factorai.mottivme.com.br",
  "http://localhost:3000",
  "http://localhost:3001",
];

const MAX_INSTRUCTION_LENGTH = 5000;
const MAX_HISTORY_PAIRS = 8;

// ── Types ────────────────────────────────────────────────────────────────────

interface PromptEngineerRequest {
  instruction: string;
  agentName: string;
  agentId: string;
  currentVersion: {
    system_prompt: string;
    prompts_by_mode: Record<string, unknown>;
    tools_config: Record<string, unknown>;
    compliance_rules: Record<string, unknown>;
    personality_config: Record<string, unknown>;
    business_config: Record<string, unknown>;
    hyperpersonalization: Record<string, unknown>;
    qualification_config: Record<string, unknown>;
  };
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

// ── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Voce e o **Engenheiro de Prompts** da AI Factory MOTTIVME.
Voce recebe instrucoes da CS (Isabella) e gera alteracoes PRECISAS nos agentes de vendas.

## ESTRUTURA DOS AGENTES (CRITICS Framework)

### 1. system_prompt (string)
Prompt principal com secoes XML: <Role>, <Constraints>, <Inputs>, <Tools>, <Instructions>, <Solutions>, <Conclusions>
- Contem identidade, regras, fluxo de conversa, objecoes mapeadas
- Tamanho tipico: 3000-15000 chars

### 2. prompts_by_mode (objeto)
Prompts especificos por modo de operacao. Keys OBRIGATORIAS em snake_case:
- sdr_inbound: DEVE ser OBJETO com 7 sub-keys (_base, acolhimento, discovery, pitch, confirmacao, fast_track, objecao)
- social_seller_instagram, social_seller_nova_seguidora, social_seller_grupo_seguidora
- followuper, concierge, scheduler, rescheduler, objection_handler, reativador_base, customersuccess
NUNCA usar camelCase (sdrinbound, socialSeller). SEMPRE snake_case.

### 3. tools_config (objeto)
Ferramentas do agente. Estrutura:
{ "ferramenta_nome": { "description": "...", "parameters": {...} } }
OU formato dict com tool_code como key.

### 4. compliance_rules (objeto)
{ "proibicoes": ["string"], "escalacao": { "triggers": [...] }, "anti_alucinacao": ["string"] }

### 5. personality_config (objeto)
{ "tom_voz": "string", "nivel_formalidade": 1-10, "uso_emojis": boolean, "modos": {...} }

### 6. business_config (objeto)
Dados comerciais: valores, unidades, horarios, parcelamento, calendar_ids, equipe

### 7. hyperpersonalization (objeto)
Contexto: setor, localizacao, publico_alvo, ddi, estado, periodo_festivo

### 8. qualification_config (objeto)
Regras BANT, criterios de qualificacao

## BUGS RECORRENTES (VOCE SABE CORRIGIR)

1. **SDR FLAT**: sdr_inbound e uma string em vez de objeto 7-fases. Fix: converter para objeto com sub-keys (_base, acolhimento, discovery, pitch, confirmacao, fast_track, objecao), preservando o conteudo original distribuido nas fases corretas.

2. **PBM camelCase**: keys como "sdrinbound", "socialSeller" em vez de "sdr_inbound", "social_seller". Fix: renomear todas as keys para snake_case.

3. **Tools vazio**: tools_config esta {} ou tem apenas descricoes textuais sem estrutura. Fix: adicionar tools estruturadas com description e parameters.

4. **FUU incompleto**: falta templates_por_objecao no modo followuper. Fix: adicionar 4 tipos (preco, timing, ceticismo, nenhuma_clara) x T1-T5.

5. **Calendar IDs placeholder**: calendar_id tem "{tipo}" em vez do ID real do GHL. Fix: usuario deve fornecer o ID real.

6. **Modos faltando**: agente tem poucos modos (ex: so sdr_inbound). Fix: adicionar modos necessarios (scheduler, concierge, social_seller, etc).

7. **Multi-Q**: agente faz multiplas perguntas numa mensagem. Fix: adicionar regra #1 no system_prompt: "NUNCA faca mais de 1 pergunta por mensagem".

## COMO RESPONDER

Voce SEMPRE responde em JSON valido com esta estrutura:
{
  "analysis": "Explicacao curta do que voce entendeu e vai fazer",
  "changes": {
    "field": "nome_do_campo (system_prompt, prompts_by_mode, tools_config, etc)",
    "operation": "update | add | remove",
    "value": <valor novo - string para system_prompt, objeto para JSONBs>,
    "diff_summary": "Resumo do que mudou em 1 linha"
  },
  "warnings": ["alertas opcionais sobre riscos"],
  "suggested_version": "vX.Y.Z (incrementar patch para fix, minor para feature, major para rewrite)"
}

Se a instrucao for AMBIGUA ou precisar de mais info, responda:
{
  "analysis": "O que voce entendeu",
  "needs_clarification": true,
  "questions": ["pergunta 1", "pergunta 2"]
}

Se for uma PERGUNTA sobre o agente (nao uma instrucao de edicao), responda:
{
  "analysis": "Resposta informativa sobre o agente",
  "is_info_only": true
}

## REGRAS CRITICAS

1. NUNCA invente dados do negocio — se nao sabe o calendar_id, PERGUNTE
2. SEMPRE preserve conteudo existente — reestruturar sim, deletar nao
3. Para system_prompt: retorne o prompt COMPLETO modificado (nao apenas o delta)
4. Para JSONBs: retorne o OBJETO COMPLETO do campo (nao apenas o delta)
5. Responda SEMPRE em portugues
6. JSON VALIDO sempre — sem trailing commas, sem comments
7. Ao converter SDR flat para 7-fases, distribua o conteudo nas fases corretas baseado no significado
8. NUNCA use camelCase em keys de prompts_by_mode`;

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — restricted to known origins
  const origin = req.headers.origin || "";
  if (!ALLOWED_ORIGINS.includes(origin)) {
    // Still set CORS for preflight but block non-allowed origins on POST
    if (req.method !== "OPTIONS") {
      return res.status(403).json({ error: "Origin not allowed" });
    }
  }
  res.setHeader("Access-Control-Allow-Origin", origin || ALLOWED_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // ── Auth: verify Supabase JWT ──────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ") ||
    authHeader.length <= 7
  ) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // ── Validate API key ──────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  // ── Validate input ────────────────────────────────────────────────────
  const body = req.body as PromptEngineerRequest;
  if (
    !body?.instruction ||
    !body?.currentVersion ||
    typeof body.currentVersion !== "object" ||
    Array.isArray(body.currentVersion)
  ) {
    return res
      .status(400)
      .json({ error: "Missing instruction or invalid currentVersion" });
  }

  if (body.instruction.length > MAX_INSTRUCTION_LENGTH) {
    return res.status(400).json({
      error: `Instruction too long (max ${MAX_INSTRUCTION_LENGTH} chars)`,
    });
  }

  if (body.agentId && !/^[0-9a-f-]{36}$/i.test(body.agentId)) {
    return res.status(400).json({ error: "Invalid agentId format" });
  }

  try {
    const client = new Anthropic({ apiKey });

    // Build context message with current agent state
    const agentContext = buildAgentContext(body);

    // Build conversation messages — cap history to prevent token explosion
    const messages: Anthropic.MessageParam[] = [];

    if (body.conversationHistory?.length) {
      const trimmed = body.conversationHistory.slice(-(MAX_HISTORY_PAIRS * 2));
      for (const msg of trimmed) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current instruction — delimited to mitigate prompt injection
    messages.push({
      role: "user",
      content: `${agentContext}\n\n---\n\n<user_instruction>\n${body.instruction}\n</user_instruction>`,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let response: Anthropic.Message;
    try {
      response = await client.messages.create(
        {
          model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages,
        },
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timeout);
    }

    // Extract text content
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return res.status(500).json({ error: "No text response from Claude" });
    }

    // Parse JSON response — guard against oversized responses
    const rawText = textContent.text;
    if (rawText.length > 100000) {
      return res
        .status(422)
        .json({ error: "Resposta do modelo excedeu limite de tamanho" });
    }
    let parsed: Record<string, unknown>;

    try {
      // Try direct parse first
      parsed = JSON.parse(rawText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Last resort: find first { to last }
        const start = rawText.indexOf("{");
        const end = rawText.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(rawText.substring(start, end + 1));
        } else {
          return res.status(200).json({
            analysis: rawText,
            is_info_only: true,
          });
        }
      }
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error(
      "[prompt-engineer]",
      error instanceof Error ? error.stack || error.message : error,
    );

    const isTimeout = error instanceof Error && error.name === "AbortError";
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout
        ? "Tempo limite excedido. Tente uma instrucao mais curta."
        : "Erro ao processar instrucao. Tente novamente.",
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAgentContext(body: PromptEngineerRequest): string {
  const v = body.currentVersion;
  const promptPreview = v.system_prompt
    ? v.system_prompt.substring(0, 4000) +
      (v.system_prompt.length > 4000 ? "\n...[truncado]" : "")
    : "[vazio]";

  const modeKeys = v.prompts_by_mode ? Object.keys(v.prompts_by_mode) : [];

  // Check for common issues
  const issues: string[] = [];
  if (v.prompts_by_mode) {
    const sdr = v.prompts_by_mode["sdr_inbound"];
    if (typeof sdr === "string")
      issues.push("SDR_FLAT: sdr_inbound e string, nao objeto 7-fases");
    // Check camelCase keys
    const camelKeys = modeKeys.filter(
      (k) => k !== k.toLowerCase() || !k.includes("_"),
    );
    if (camelKeys.some((k) => /[A-Z]/.test(k)))
      issues.push(`CAMELCASE: keys ${camelKeys.join(", ")}`);
  }
  if (!v.tools_config || Object.keys(v.tools_config).length === 0) {
    issues.push("TOOLS_VAZIO: tools_config esta vazio");
  }

  const sdrDetail = v.prompts_by_mode?.["sdr_inbound"];
  const sdrInfo =
    typeof sdrDetail === "string"
      ? `[STRING FLAT - ${sdrDetail.length} chars]`
      : typeof sdrDetail === "object" && sdrDetail
        ? `[OBJETO 7-fases - keys: ${Object.keys(sdrDetail).join(", ")}]`
        : "[ausente]";

  return `## AGENTE ATUAL: ${body.agentName}

### system_prompt (${v.system_prompt?.length || 0} chars):
\`\`\`
${promptPreview}
\`\`\`

### prompts_by_mode (${modeKeys.length} modos): ${modeKeys.join(", ") || "[vazio]"}
- sdr_inbound: ${sdrInfo}

### tools_config: ${JSON.stringify(v.tools_config || {}).substring(0, 1500)}

### compliance_rules: ${JSON.stringify(v.compliance_rules || {}).substring(0, 800)}

### personality_config: ${JSON.stringify(v.personality_config || {}).substring(0, 800)}

### business_config: ${JSON.stringify(v.business_config || {}).substring(0, 1500)}

### hyperpersonalization: ${JSON.stringify(v.hyperpersonalization || {}).substring(0, 800)}

### qualification_config: ${JSON.stringify(v.qualification_config || {}).substring(0, 800)}

${issues.length > 0 ? `### PROBLEMAS DETECTADOS AUTOMATICAMENTE:\n${issues.map((i) => `- ${i}`).join("\n")}` : ""}`;
}
