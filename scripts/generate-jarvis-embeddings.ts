// Usage: npx tsx scripts/generate-jarvis-embeddings.ts --user-id=UUID [--limit=500] [--dry-run]
// Requires: SUPABASE_SERVICE_ROLE_KEY in .env
// Uses: Ollama local with nomic-embed-text (768 dims)

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// .env reader
// ---------------------------------------------------------------------------

function readEnvFile(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

function getCliArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hasCliFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// ---------------------------------------------------------------------------
// Embedding provider (Gemini or Ollama)
// ---------------------------------------------------------------------------

const BATCH_SIZE = 10;
const PROVIDER = process.env["EMBED_PROVIDER"] ?? "gemini"; // "gemini" | "ollama"

async function getEmbeddingGemini(
  text: string,
  apiKey: string,
): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text.slice(0, 2000) }] },
        outputDimensionality: 768,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini embedding error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    embedding?: { values: number[] };
  };
  if (!data.embedding?.values)
    throw new Error("No embedding in Gemini response");
  return data.embedding.values;
}

async function getEmbeddingOllama(text: string): Promise<number[]> {
  const ollamaUrl = process.env["OLLAMA_URL"] ?? "http://localhost:11434";
  const model = process.env["OLLAMA_EMBED_MODEL"] ?? "nomic-embed-text";

  const response = await fetch(`${ollamaUrl}/api/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, prompt: text.slice(0, 2000) }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama embedding error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

let geminiApiKey: string | undefined;

async function getEmbedding(text: string): Promise<number[]> {
  if (PROVIDER === "gemini") {
    if (!geminiApiKey)
      throw new Error("VITE_GEMINI_API_KEY required for Gemini embeddings");
    return getEmbeddingGemini(text, geminiApiKey);
  }
  return getEmbeddingOllama(text);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  const env = readEnvFile(path.join(projectRoot, ".env"));

  const supabaseUrl =
    process.env["VITE_SUPABASE_URL"] ?? env["VITE_SUPABASE_URL"];
  const supabaseKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    env["SUPABASE_SERVICE_ROLE_KEY"];
  const userId = getCliArg("user-id") ?? env["SYNC_USER_ID"];
  const limitArg = getCliArg("limit") ?? "500";
  const dryRun = hasCliFlag("dry-run");

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
    process.exit(1);
  }

  if (!userId) {
    console.error("ERROR: --user-id=UUID is required");
    process.exit(1);
  }

  // Initialize Gemini API key if using Gemini provider
  if (PROVIDER === "gemini") {
    geminiApiKey =
      process.env["VITE_GEMINI_API_KEY"] ?? env["VITE_GEMINI_API_KEY"];
    if (!geminiApiKey) {
      console.error(
        "ERROR: VITE_GEMINI_API_KEY required for Gemini embeddings",
      );
      process.exit(1);
    }
  }

  const limit = parseInt(limitArg, 10);
  if (isNaN(limit) || limit <= 0) {
    console.error(
      `ERROR: --limit must be a positive integer, got: ${limitArg}`,
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const force = hasCliFlag("force"); // re-generate all embeddings

  console.log("=== Generate JARVIS Memory Embeddings ===");
  console.log(`User     : ${userId}`);
  console.log(`Provider : ${PROVIDER}`);
  console.log(`Limit    : ${limit}`);
  console.log(`Force    : ${force}`);
  console.log(`Dry run  : ${dryRun}\n`);

  // Fetch records (without embeddings, or all if --force)
  let query = supabase
    .from("jarvis_memory")
    .select("id, content, type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!force) {
    query = query.is("embedding", null);
  }

  const { data: records, error: fetchError } = await query;

  if (fetchError) {
    console.error(`ERROR fetching records: ${fetchError.message}`);
    process.exit(1);
  }

  const toProcess = records ?? [];
  console.log(`Found ${toProcess.length} records without embeddings\n`);

  if (toProcess.length === 0) {
    console.log("Nothing to process. All records have embeddings.");
    return;
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);

    for (const record of batch) {
      const content = record.content as string;
      const shortContent = content.slice(0, 60).replace(/\n/g, " ");

      try {
        const embedding = await getEmbedding(content);

        if (dryRun) {
          console.log(
            `  [DRY-RUN] ${record.type}: ${shortContent}... (${embedding.length} dims)`,
          );
          processed++;
          continue;
        }

        const { error: updateError } = await supabase
          .from("jarvis_memory")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", record.id);

        if (updateError) {
          console.error(
            `  ERROR updating ${record.id}: ${updateError.message}`,
          );
          errors++;
        } else {
          processed++;
        }
      } catch (err) {
        console.error(
          `  ERROR embedding ${record.id}: ${(err as Error).message}`,
        );
        errors++;
      }
    }

    // Progress log every batch
    const pct = Math.round(((i + batch.length) / toProcess.length) * 100);
    process.stdout.write(
      `\r  Progress: ${i + batch.length}/${toProcess.length} (${pct}%)`,
    );
  }

  console.log("\n\n=== Embedding generation complete ===");
  console.log(`  Processed : ${processed}`);
  console.log(`  Errors    : ${errors}`);
  console.log(`  Total     : ${toProcess.length}`);

  if (errors > 0) process.exit(1);
}

main().catch((err: Error) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
