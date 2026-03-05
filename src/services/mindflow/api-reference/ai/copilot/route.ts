import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  CopilotRequest,
  CopilotResponse,
} from "@/components/mindflow/types/ai";
import type { CanvasElement } from "@/components/mindflow/types/elements";

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

// POST /api/mindflow/ai/copilot
// Modelo: claude-sonnet-4-6 (qualidade para geração de mapa completo)
export async function POST(req: NextRequest) {
  const body: CopilotRequest = await req.json();
  const { text, layout } = body;

  try {
    const client = new Anthropic();

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
    if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

    const parsed = JSON.parse(jsonMatch[0]) as {
      nodes: { id: string; label: string; parent: string | null }[];
    };

    // Convert AI nodes to CanvasElement format
    const colorMap = new Map<string, string>();
    let colorIdx = 0;

    const elements: CanvasElement[] = parsed.nodes.map((n) => {
      // Assign color based on first-level parent
      const parentId = n.parent;
      if (parentId === "root" || parentId === null) {
        if (!colorMap.has(n.id)) {
          colorMap.set(n.id, COLORS[colorIdx++ % COLORS.length]);
        }
      }
      const color =
        colorMap.get(n.id) ??
        colorMap.get(parentId ?? "") ??
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

    const response: CopilotResponse = { elements };
    return NextResponse.json(response);
  } catch (e) {
    console.error(
      "[copilot]",
      e instanceof Error ? e.message : "Unknown error",
    );
    const fallback: CopilotResponse = { elements: [] };
    return NextResponse.json(fallback, { status: 500 });
  }
}
