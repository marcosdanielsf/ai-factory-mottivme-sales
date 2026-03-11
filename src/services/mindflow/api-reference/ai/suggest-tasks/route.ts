import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  SuggestTasksRequest,
  SuggestTasksResponse,
} from "@/components/mindflow/types/ai";

// POST /api/mindflow/ai/suggest-tasks
// Modelo: claude-haiku-4-5
export async function POST(req: NextRequest) {
  const body: SuggestTasksRequest = await req.json();
  const { nodeLabel, existingTasks } = body;

  try {
    const client = new Anthropic();

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
    if (!jsonMatch) throw new Error("JSON não encontrado na resposta");

    const parsed = JSON.parse(jsonMatch[0]) as {
      tasks: { text: string; priority: string }[];
    };

    const validPriorities = new Set(["low", "medium", "high", "urgent"]);
    const response: SuggestTasksResponse = {
      tasks: parsed.tasks.map((t) => ({
        text: t.text,
        priority: validPriorities.has(t.priority)
          ? (t.priority as SuggestTasksResponse["tasks"][0]["priority"])
          : "medium",
      })),
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error(
      "[suggest-tasks]",
      e instanceof Error ? e.message : "Unknown error",
    );
    const fallback: SuggestTasksResponse = {
      tasks: [
        { text: "Definir escopo", priority: "high" },
        { text: "Pesquisar referências", priority: "medium" },
        { text: "Documentar decisões", priority: "low" },
      ],
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
