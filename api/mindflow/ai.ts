import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Gemini helper ─────────────────────────────────────────────────────────────

async function callGemini(prompt: string, maxTokens = 1024): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const body = req.body as AIRequest;
  if (!body?.action)
    return res.status(400).json({ error: "Missing action field" });

  try {
    switch (body.action) {
      case "suggest-tasks":
        return res.status(200).json(await handleSuggestTasks(body));
      case "expand-node":
        return res.status(200).json(await handleExpandNode(body));
      case "explain":
        return res.status(200).json(await handleExplain(body));
      case "copilot":
        return res.status(200).json(await handleCopilot(body));
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (e) {
    console.error("[mindflow/ai]", e instanceof Error ? e.message : e);
    return res.status(500).json({ error: "AI request failed" });
  }
}

// ── suggest-tasks ─────────────────────────────────────────────────────────────

async function handleSuggestTasks(body: SuggestTasksRequest) {
  const { nodeLabel, existingTasks } = body;

  const prompt = `Você é um assistente de produtividade. Para o tópico "${nodeLabel}" ${
    existingTasks.length
      ? `que já tem as tarefas: ${existingTasks.join(", ")}`
      : "sem tarefas ainda"
  }, sugira de 3 a 5 tarefas acionáveis e específicas.

Responda com JSON neste formato:
{"tasks": [{"text": "Descrição da tarefa", "priority": "high"}, ...]}

Prioridades válidas: "low", "medium", "high", "urgent". Seja direto e acionável. Não repita tarefas existentes.`;

  try {
    const text = await callGemini(prompt, 512);
    const parsed = JSON.parse(text) as {
      tasks: { text: string; priority: string }[];
    };
    return {
      tasks: parsed.tasks.map((t) => ({
        text: t.text,
        priority: VALID_PRIORITIES.has(t.priority) ? t.priority : "medium",
      })),
    };
  } catch {
    return {
      tasks: [
        { text: "Definir escopo", priority: "high" },
        { text: "Pesquisar referências", priority: "medium" },
        { text: "Documentar decisões", priority: "low" },
      ],
    };
  }
}

// ── expand-node ───────────────────────────────────────────────────────────────

async function handleExpandNode(body: ExpandNodeRequest) {
  const { nodeLabel, existingChildren } = body;

  const prompt = `Você é um assistente de mapas mentais. Dado o nó "${nodeLabel}" ${
    existingChildren.length
      ? `que já tem os filhos: ${existingChildren.join(", ")}`
      : "sem filhos ainda"
  }, sugira de 3 a 5 sub-tópicos relevantes para expandir esse nó.

Responda com JSON neste formato:
{"children": [{"label": "Nome do sub-tópico"}, ...]}

Seja conciso, use labels curtas (2-4 palavras). Não repita os filhos existentes.`;

  try {
    const text = await callGemini(prompt, 512);
    const parsed = JSON.parse(text) as { children: { label: string }[] };
    return {
      children: parsed.children.map((c, i) => ({
        label: c.label,
        color: COLORS[i % COLORS.length],
      })),
    };
  } catch {
    return {
      children: [
        { label: "Sub-tópico 1", color: "#6EE7F7" },
        { label: "Sub-tópico 2", color: "#A78BFA" },
        { label: "Sub-tópico 3", color: "#34D399" },
      ],
    };
  }
}

// ── explain ───────────────────────────────────────────────────────────────────

async function handleExplain(body: ExplainNodeRequest) {
  const { nodeLabel, nodeContext } = body;

  const prompt = `Explique de forma clara e concisa o conceito "${nodeLabel}"${
    nodeContext ? ` no contexto de: ${nodeContext}` : ""
  }.

Responda com JSON neste formato:
{"explanation": "Explicação em 2-3 frases."}

Seja informativo mas sucinto. Fale em português.`;

  try {
    const text = await callGemini(prompt, 256);
    const parsed = JSON.parse(text) as { explanation: string };
    return { explanation: parsed.explanation };
  } catch {
    return {
      explanation: `"${nodeLabel}" é um conceito central neste mapa mental.`,
    };
  }
}

// ── copilot ───────────────────────────────────────────────────────────────────

async function handleCopilot(body: CopilotRequest) {
  const { text, layout } = body;

  const prompt = `Você é um assistente especializado em criar mapas mentais. Crie um mapa mental sobre:

"${text}"

Layout: ${layout}

Crie um mapa mental hierárquico com:
- 1 nó raiz (id: "root", parent: null)
- 3 a 6 nós de primeiro nível (filhos do root)
- Opcionalmente 1 a 3 sub-nós para cada nó de primeiro nível

Responda com JSON neste formato:
{
  "nodes": [
    {"id": "root", "label": "Título Central", "parent": null},
    {"id": "n1", "label": "Tópico 1", "parent": "root"},
    {"id": "n1_1", "label": "Sub-tópico", "parent": "n1"}
  ]
}

IDs sequenciais (root, n1, n2, n1_1, etc.). Labels curtas (2-5 palavras). Português.`;

  try {
    const text2 = await callGemini(prompt, 2048);
    const parsed = JSON.parse(text2) as {
      nodes: { id: string; label: string; parent: string | null }[];
    };

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
  } catch {
    return { elements: [] };
  }
}
