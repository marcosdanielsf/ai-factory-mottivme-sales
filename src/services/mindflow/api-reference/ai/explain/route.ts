import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ExplainNodeRequest,
  ExplainNodeResponse,
} from "@/components/mindflow/types/ai";

// POST /api/mindflow/ai/explain
// Modelo: claude-haiku-4-5
export async function POST(req: NextRequest) {
  const body: ExplainNodeRequest = await req.json();
  const { nodeLabel, nodeContext } = body;

  try {
    const client = new Anthropic();

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
    if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

    const parsed = JSON.parse(jsonMatch[0]) as { explanation: string };
    const response: ExplainNodeResponse = { explanation: parsed.explanation };

    return NextResponse.json(response);
  } catch (e) {
    console.error(
      "[explain]",
      e instanceof Error ? e.message : "Unknown error",
    );
    const fallback: ExplainNodeResponse = {
      explanation: `"${nodeLabel}" é um conceito central neste mapa mental, representando uma área de foco importante para o projeto.`,
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
