import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "crypto";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const INGEST_SECRET = process.env.INGEST_SECRET || "";
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "https://factorai.mottivme.com.br";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;
const MAX_CONTENT_LENGTH = 50_000;
const PINECONE_BATCH_SIZE = 100;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Auth: Bearer token
  const authHeader = req.headers.authorization;
  if (!INGEST_SECRET || authHeader !== `Bearer ${INGEST_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
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

    // Upsert in batches
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
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
