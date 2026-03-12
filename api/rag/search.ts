import type { VercelRequest, VercelResponse } from "@vercel/node";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: text.slice(0, 8000) }] },
        output_dimensionality: EMBED_DIM,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embed error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.embeddings?.[0]?.values || data.embedding?.values || [];
}

async function queryPinecone(
  vector: number[],
  topK = 5,
): Promise<
  Array<{ id: string; score: number; metadata: Record<string, string> }>
> {
  const res = await fetch(`${PINECONE_INDEX_HOST}/query`, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true,
      namespace: "default",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinecone query error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.matches || []).map(
    (m: { id: string; score: number; metadata?: Record<string, string> }) => ({
      id: m.id,
      score: Math.round((m.score || 0) * 1000) / 10,
      metadata: m.metadata || {},
    }),
  );
}

async function synthesizeAnswer(
  question: string,
  matches: Array<{ score: number; metadata: Record<string, string> }>,
): Promise<string> {
  const context = matches
    .map((m, i) => {
      const src = m.metadata.source_file || "unknown";
      const preview = m.metadata.text_preview || "";
      return `[Source ${i + 1}: ${src} (${m.score}% match)]\n${preview}`;
    })
    .join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers questions based on the provided context from a vector database. Always cite which source(s) you used. If the context doesn't contain enough info, say so. Answer in the same language as the question.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext from vector database:\n${context}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Sem resposta.";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, topK = 5 } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const vector = await embedText(message);
    const matches = await queryPinecone(vector, topK);
    const answer = await synthesizeAnswer(message, matches);

    return res.status(200).json({ answer, sources: matches });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
