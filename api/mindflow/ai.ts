import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// ── Types (inlined to avoid bundler issues with src/ path aliases) ─────────────

interface SuggestTasksRequest {
  action: "suggest-tasks";
  nodeLabel: string;
  existingTasks: string[];
}

interface ExpandNodeRequest {
  action: "expand-node";
  nodeLabel: string;
  existingChildren: string[];
}

interface ExplainNodeRequest {
  action: "explain";
  nodeLabel: string;
  nodeContext: string;
}

interface CopilotRequest {
  action: "copilot";
  text: string;
  layout: string;
}

type AIRequest =
  | SuggestTasksRequest
  | ExpandNodeRequest
  | ExplainNodeRequest
  | CopilotRequest;

// ── Constants ──────────────────────────────────────────────────────────────────

const COLORS = [
  "#6EE7F7",
  "#A78BFA",
  "#34D399",
  "#F472B6",
  "#FBBF24",
  "#60A5FA",
  "#FB923C",
  "#C084FC",
  "#86EFAC",
];

const VALID_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);

// ── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers — allow the Vercel deployment and local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[mindflow/ai] ANTHROPIC_API_KEY not set");
    return res.status(500).json({ error: "AI service not configured" });
  }

  const body = req.body as AIRequest;
  if (!body?.action) {
    return res.status(400).json({ error: "Missing action field" });
  }

  const client = new Anthropic({ apiKey });

  try {
    switch (body.action) {
      case "suggest-tasks":
        return res.status(200).json(await handleSuggestTasks(client, body));

      case "expand-node":
        return res.status(200).json(await handleExpandNode(client, body));

      case "explain":
        return res.status(200).json(await handleExplain(client, body));

      case "copilot":
        return res.status(200).json(await handleCopilot(client, body));

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (e) {
    console.error("[mindflow/ai]", e instanceof Error ? e.message : e);
    return res.status(500).json({ error: "AI request failed" });
  }
}

// ── suggest-tasks ──────────────────────────────────────────────────────────────

async function handleSuggestTasks(
  client: Anthropic,
  body: SuggestTasksRequest,
) {
  const { nodeLabel, existingTasks } = body;

  const prompt = `Você é um assistente de produtividade. Para o tópico "${nodeLabel}" ${
    existingTasks.length
      ? `que já tem as tarefas: ${existingTasks.join(", ")}`
      : "sem tarefas ainda"
  }, sugira de 3 a 5 tarefas acionáveis e específicas.

Responda APENAS com JSON válido neste formato:
{"tasks": [{"text": "Descrição da tarefa", "priority": "high"}, ...]}

Prioridades válidas: "low", "medium", "high", "urgent". Seja direto e acionável. Não repita tarefas existentes.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback
    return {
      tasks: [
        { text: "Definir escopo", priority: "high" },
        { text: "Pesquisar referências", priority: "medium" },
        { text: "Documentar decisões", priority: "low" },
      ],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    tasks: { text: string; priority: string }[];
  };

  return {
    tasks: parsed.tasks.map((t) => ({
      text: t.text,
      priority: VALID_PRIORITIES.has(t.priority)
        ? (t.priority as "low" | "medium" | "high" | "urgent")
        : "medium",
    })),
  };
}

// ── expand-node ────────────────────────────────────────────────────────────────

async function handleExpandNode(client: Anthropic, body: ExpandNodeRequest) {
  const { nodeLabel, existingChildren } = body;

  const prompt = `Você é um assistente de mapas mentais. Dado o nó "${nodeLabel}" ${
    existingChildren.length
      ? `que já tem os filhos: ${existingChildren.join(", ")}`
      : "sem filhos ainda"
  }, sugira de 3 a 5 sub-tópicos relevantes para expandir esse nó.

Responda APENAS com JSON válido neste formato:
{"children": [{"label": "Nome do sub-tópico"}, ...]}

Seja conciso, use labels curtas (2-4 palavras). Não repita os filhos existentes.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      children: [
        { label: "Sub-tópico 1", color: "#6EE7F7" },
        { label: "Sub-tópico 2", color: "#A78BFA" },
        { label: "Sub-tópico 3", color: "#34D399" },
      ],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as { children: { label: string }[] };

  return {
    children: parsed.children.map((c, i) => ({
      label: c.label,
      color: COLORS[i % COLORS.length],
    })),
  };
}

// ── explain ────────────────────────────────────────────────────────────────────

async function handleExplain(client: Anthropic, body: ExplainNodeRequest) {
  const { nodeLabel, nodeContext } = body;

  const prompt = `Você é um assistente de mapas mentais. Explique de forma clara e concisa o conceito "${nodeLabel}"${
    nodeContext ? ` no contexto de: ${nodeContext}` : ""
  }.

Responda APENAS com JSON válido neste formato:
{"explanation": "Explicação em 2-3 frases."}

Seja informativo mas sucinto. Fale em português.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      explanation: `"${nodeLabel}" é um conceito central neste mapa mental, representando uma área de foco importante para o projeto.`,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]) as { explanation: string };
  return { explanation: parsed.explanation };
}

// ── copilot ────────────────────────────────────────────────────────────────────

async function handleCopilot(client: Anthropic, body: CopilotRequest) {
  const { text, layout } = body;

  const prompt = `Você é um assistente especializado em criar mapas mentais estruturados. O usuário quer criar um mapa mental sobre:

"${text}"

Layout preferido: ${layout}

Crie um mapa mental hierárquico com:
- 1 nó raiz (id: "root", parent: null)
- 3 a 6 nós de primeiro nível (filhos do root)
- Opcionalmente 1 a 3 sub-nós para cada nó de primeiro nível

Responda APENAS com JSON válido neste formato:
{
  "nodes": [
    {"id": "root", "label": "Título Central", "parent": null},
    {"id": "n1", "label": "Tópico 1", "parent": "root"},
    {"id": "n1_1", "label": "Sub-tópico", "parent": "n1"}
  ]
}

Use IDs sequenciais simples (root, n1, n2, n1_1, n1_2, etc.).
Labels curtas e descritivas (2-5 palavras). Responda em português.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { elements: [] };
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    nodes: { id: string; label: string; parent: string | null }[];
  };

  // Assign colors per first-level branch
  const colorMap = new Map<string, string>();
  let colorIdx = 0;

  const elements = parsed.nodes.map((n) => {
    if (n.parent === "root" || n.parent === null) {
      if (!colorMap.has(n.id)) {
        colorMap.set(n.id, COLORS[colorIdx++ % COLORS.length]);
      }
    }
    const color =
      colorMap.get(n.id) ??
      colorMap.get(n.parent ?? "") ??
      COLORS[colorIdx++ % COLORS.length];

    return {
      id: n.id,
      type: "node" as const,
      x: 0,
      y: 0,
      width: 164,
      height: 64,
      parentId: n.parent ?? undefined,
      data: {
        label: n.label,
        color,
        status: "backlog" as const,
        tasks: [],
        parentId: n.parent ?? undefined,
      },
    };
  });

  return { elements };
}
