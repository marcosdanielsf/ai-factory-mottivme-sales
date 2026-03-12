import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "crypto";

// --- Config ---
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "https://factorai.mottivme.com.br";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;
const MAX_CONTENT_LENGTH = 50_000;
const PINECONE_BATCH_SIZE = 100;

// --- Shared helpers ---

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
  const values = data.embeddings?.[0]?.values ?? data.embedding?.values;
  if (!values || values.length !== EMBED_DIM) {
    throw new Error(
      `Invalid embedding: expected ${EMBED_DIM} dims, got ${values?.length ?? 0}`,
    );
  }
  return values;
}

// --- Search ---

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

async function handleSearch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { message, topK = 5 } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const vector = await embedText(message);
  const matches = await queryPinecone(vector, topK);
  const answer = await synthesizeAnswer(message, matches);

  return res.status(200).json({ answer, sources: matches });
}

// --- Stats ---

async function handleStats(_req: VercelRequest, res: VercelResponse) {
  const pcRes = await fetch(`${PINECONE_INDEX_HOST}/describe_index_stats`, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!pcRes.ok) {
    return res
      .status(pcRes.status)
      .json({ error: "Pinecone error", detail: await pcRes.text() });
  }

  const data = await pcRes.json();
  return res.status(200).json({
    totalVectors: data.totalVectorCount || 0,
    namespaces: data.namespaces || {},
  });
}

// --- Ingest ---

function chunkText(text: string, maxChars = 2000): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function makeVectorId(title: string, chunkIndex: number): string {
  const hash = createHash("sha256")
    .update(`${title}::${chunkIndex}`)
    .digest("hex")
    .slice(0, 16);
  return `manual_${hash}`;
}

async function handleIngest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Auth: validate Supabase JWT
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!userRes.ok) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { title, content, tags } = req.body || {};
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content is required" });
  }
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      error: `content too large (${content.length} chars, max ${MAX_CONTENT_LENGTH})`,
    });
  }
  if (tags && typeof tags !== "string") {
    return res.status(400).json({ error: "tags must be a string" });
  }

  const chunks = chunkText(content);
  const vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, string>;
  }> = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]);
    vectors.push({
      id: makeVectorId(title, i),
      values: embedding,
      metadata: {
        source_file: title,
        content_type: "manual_input",
        text_preview: chunks[i].slice(0, 500),
        file_type: "text",
        ...(tags ? { tags } : {}),
        chunk_index: String(i),
        total_chunks: String(chunks.length),
      },
    });
  }

  for (let b = 0; b < vectors.length; b += PINECONE_BATCH_SIZE) {
    const batch = vectors.slice(b, b + PINECONE_BATCH_SIZE);
    const pcRes = await fetch(`${PINECONE_INDEX_HOST}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectors: batch, namespace: "default" }),
    });

    if (!pcRes.ok) {
      const err = await pcRes.text();
      throw new Error(`Pinecone upsert error: ${pcRes.status} ${err}`);
    }
  }

  return res.status(200).json({
    success: true,
    chunks: chunks.length,
    message: `"${title}" ingerido com ${chunks.length} chunk(s).`,
  });
}

// --- Router ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const action =
    (req.query.action as string) || (req.method === "GET" ? "stats" : "search");

  try {
    switch (action) {
      case "search":
        return await handleSearch(req, res);
      case "stats":
        return await handleStats(req, res);
      case "ingest":
        return await handleIngest(req, res);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
