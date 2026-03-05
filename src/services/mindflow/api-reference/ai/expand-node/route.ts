import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExpandNodeRequest,
  ExpandNodeResponse,
} from "@/components/mindflow/types/ai";

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

// POST /api/mindflow/ai/expand-node
// Modelo: claude-haiku-4-5 (rápido, barato)
export async function POST(req: NextRequest) {
  const body: ExpandNodeRequest = await req.json();
  const { nodeLabel, existingChildren } = body;

  try {
    const client = new Anthropic();

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
    if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

    const parsed = JSON.parse(jsonMatch[0]) as {
      children: { label: string }[];
    };

    const response: ExpandNodeResponse = {
      children: parsed.children.map((c, i) => ({
        label: c.label,
        color: COLORS[i % COLORS.length],
      })),
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error(
      "[expand-node]",
      e instanceof Error ? e.message : "Unknown error",
    );
    // Fallback mock
    const fallback: ExpandNodeResponse = {
      children: [
        { label: "Sub-tópico 1", color: "#6EE7F7" },
        { label: "Sub-tópico 2", color: "#A78BFA" },
        { label: "Sub-tópico 3", color: "#34D399" },
      ],
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
