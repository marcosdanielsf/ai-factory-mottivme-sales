// Usage: npx tsx scripts/extract-knowledge-from-transcripts.ts \
//   --user-id=UUID \
//   --limit=50 \
//   --min-size=1M \
//   --dry-run
//
// Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
// Uses Ollama local (free, no API key). Set OLLAMA_URL and OLLAMA_MODEL to override defaults.

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JsonlLine {
  type: string;
  message?: {
    role?: string;
    content?: unknown;
    message?: {
      content?: unknown;
    };
  };
  sessionId?: string;
  timestamp?: string;
  gitBranch?: string;
}

interface ConversationMeta {
  sessionId: string;
  gitBranch: string | undefined;
  firstTimestamp: string | undefined;
  lastTimestamp: string | undefined;
}

interface TranscriptFile {
  filePath: string;
  projectDir: string;
  sizeBytes: number;
  mtimeMs: number;
}

interface ExtractedItem {
  type: "decision" | "preference" | "fact" | "update" | "task";
  content: string;
  importance: number;
}

interface InsertStats {
  processed: number;
  extracted: number;
  inserted: number;
  skipped: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// .env reader (no dotenv dependency)
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
// CLI arg parser
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
// Parse min-size arg (e.g. "1M", "500K", "2048")
// ---------------------------------------------------------------------------

function parseMinSize(raw: string): number {
  const upper = raw.toUpperCase();
  if (upper.endsWith("M")) return parseFloat(upper) * 1024 * 1024;
  if (upper.endsWith("K")) return parseFloat(upper) * 1024;
  return parseInt(raw, 10);
}

// ---------------------------------------------------------------------------
// Derive project_slug from directory path (mirrors sync-claude-memories.ts)
// ---------------------------------------------------------------------------

function deriveProjectSlug(projectDir: string): string {
  const parts = projectDir.split("-").filter((p) => p.length > 0);

  const skipWords = new Set([
    "users",
    "projects",
    "mottivme",
    "marcosdaniels",
    "home",
    "opt",
    "usr",
    "var",
    "private",
    "tmp",
    "1",
    "2",
    "3",
    "4",
    "5",
    "ai",
    "factory",
    "sales",
    "front",
    "factorai",
  ]);

  const meaningfulParts: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (skipWords.has(p)) break;
    meaningfulParts.unshift(parts[i].toLowerCase());
    if (meaningfulParts.length >= 4) break;
  }

  if (meaningfulParts.length > 0) {
    return meaningfulParts.join("-");
  }

  return projectDir.slice(-40).replace(/^-/, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Extract text content from a JSONL message content field
// ---------------------------------------------------------------------------

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .filter(
        (item): item is { type: string; text: string } =>
          typeof item === "object" &&
          item !== null &&
          (item as { type?: string }).type === "text" &&
          typeof (item as { text?: string }).text === "string",
      )
      .map((item) => item.text)
      .join("\n");
  }

  return "";
}

// ---------------------------------------------------------------------------
// Clean extracted text: remove system tags, long paths, tool noise
// ---------------------------------------------------------------------------

function cleanConversationText(text: string): string {
  return (
    text
      // Remove <system-reminder>...</system-reminder> blocks
      .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
      // Remove <available-deferred-tools>...</available-deferred-tools>
      .replace(
        /<available-deferred-tools>[\s\S]*?<\/available-deferred-tools>/g,
        "",
      )
      // Remove long file paths (>/60 chars)
      .replace(
        /\/[\w\-./]+\.(?:ts|tsx|js|jsx|json|md|sql|css|mjs){1}\b/g,
        (m) => (m.length > 60 ? "[file]" : m),
      )
      // Remove base64 data
      .replace(/data:[^;]+;base64,[A-Za-z0-9+/=]{50,}/g, "[base64]")
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ---------------------------------------------------------------------------
// Stream-parse a .jsonl file and build conversation text
// ---------------------------------------------------------------------------

const TEXT_LIMIT = 8_000;

async function parseTranscript(
  filePath: string,
): Promise<{ text: string; meta: ConversationMeta }> {
  const parts: string[] = [];
  let totalChars = 0;
  let done = false;

  const meta: ConversationMeta = {
    sessionId: path.basename(filePath, ".jsonl"),
    gitBranch: undefined,
    firstTimestamp: undefined,
    lastTimestamp: undefined,
  };

  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  return new Promise((resolve, reject) => {
    rl.on("line", (rawLine) => {
      if (done) return;

      let parsed: JsonlLine;
      try {
        parsed = JSON.parse(rawLine) as JsonlLine;
      } catch {
        return; // skip malformed lines
      }

      // Capture metadata from first line
      if (meta.firstTimestamp === undefined && parsed.timestamp) {
        meta.firstTimestamp = parsed.timestamp;
      }
      if (parsed.timestamp) {
        meta.lastTimestamp = parsed.timestamp;
      }
      if (parsed.sessionId) {
        meta.sessionId = parsed.sessionId;
      }
      if (parsed.gitBranch && !meta.gitBranch) {
        meta.gitBranch = parsed.gitBranch;
      }

      const lineType = parsed.type;

      // Skip non-conversational lines
      if (lineType !== "user" && lineType !== "assistant") {
        return;
      }

      const messageContent = parsed.message?.content;

      // Skip if content is missing
      if (!messageContent) {
        // Try nested content (some messages)
        const nested = parsed.message?.message?.content;
        if (!nested) return;
        const text = extractTextFromContent(nested);
        if (!text.trim()) return;

        const prefix = lineType === "user" ? "USER: " : "ASSISTANT: ";
        parts.push(prefix + text);
        totalChars += prefix.length + text.length;
        if (totalChars >= TEXT_LIMIT * 2) done = true;
        return;
      }

      if (lineType === "user") {
        const text = extractTextFromContent(messageContent);
        if (!text.trim()) return;
        parts.push("USER: " + text);
        totalChars += 6 + text.length;
      } else if (lineType === "assistant") {
        // For assistant, extract only text entries (skip tool_use)
        const text = extractTextFromContent(messageContent);
        if (!text.trim()) return;
        const prefix = "ASSISTANT: ";
        parts.push(prefix + text);
        totalChars += prefix.length + text.length;
      }

      if (totalChars >= TEXT_LIMIT * 2) done = true;
    });

    rl.on("close", () => {
      const raw = parts.join("\n").slice(0, TEXT_LIMIT * 2); // extra room before cleaning
      resolve({
        text: cleanConversationText(raw).slice(0, TEXT_LIMIT),
        meta,
      });
    });

    rl.on("error", reject);
    fileStream.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Discover .jsonl transcript files in ~/.claude/projects/
// ---------------------------------------------------------------------------

function discoverTranscripts(minSizeBytes: number): TranscriptFile[] {
  const claudeProjectsDir = path.join(os.homedir(), ".claude", "projects");

  if (!fs.existsSync(claudeProjectsDir)) {
    console.error(`Directory not found: ${claudeProjectsDir}`);
    return [];
  }

  const results: TranscriptFile[] = [];

  const projectDirs = fs
    .readdirSync(claudeProjectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const projectDir of projectDirs) {
    const projectPath = path.join(claudeProjectsDir, projectDir);

    let files: fs.Dirent[];
    try {
      files = fs.readdirSync(projectPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".jsonl")) continue;

      const filePath = path.join(projectPath, file.name);

      let stat: fs.Stats;
      try {
        stat = fs.statSync(filePath);
      } catch {
        continue;
      }

      if (stat.size < minSizeBytes) continue;

      results.push({
        filePath,
        projectDir,
        sizeBytes: stat.size,
        mtimeMs: stat.mtimeMs,
      });
    }
  }

  // Sort by modification date, newest first
  results.sort((a, b) => b.mtimeMs - a.mtimeMs);

  return results;
}

// ---------------------------------------------------------------------------
// Call Claude Haiku to extract knowledge from conversation text
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM = `You are a knowledge extractor. You receive conversation transcripts and extract structured knowledge items.

You MUST respond with ONLY a JSON array. No explanation, no text before or after.

Each item in the array must have:
- type: one of "decision", "preference", "fact", "update", "task"
- content: a self-contained description in Portuguese (PT-BR)
- importance: 1-10 (10 = critical business decision)

Rules:
- Max 5 items per conversation (only the most valuable)
- Skip trivial things (typos, retries, build errors, code diffs)
- Focus on: business decisions, client info, architecture choices, user preferences
- If nothing valuable, return: []

Example response:
[{"type": "decision", "content": "Decidido usar Supabase em vez de Firebase por causa do PostgreSQL", "importance": 7}]`;

async function extractKnowledge(
  conversationText: string,
): Promise<ExtractedItem[]> {
  // Use Ollama local (free, no API key needed)
  const ollamaUrl = process.env["OLLAMA_URL"] ?? "http://localhost:11434";
  const ollamaModel = process.env["OLLAMA_MODEL"] ?? "llama3.1:8b";

  // Use /api/chat with system message to prevent model from "continuing" the conversation
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM },
        {
          role: "user",
          content: `Extract knowledge from this transcript:\n\n<transcript>\n${conversationText}\n</transcript>\n\nRespond with ONLY the JSON array.`,
        },
      ],
      stream: false,
      options: { temperature: 0.3, num_predict: 1024 },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    response?: string;
    message?: { content: string };
  };
  const textContent = data.message?.content ?? data.response ?? "";

  // Debug: show first 300 chars of Ollama response
  if (process.env["DEBUG"]) {
    console.log(
      `\n    [OLLAMA RAW (${textContent.length} chars)]: ${textContent.slice(0, 300)}`,
    );
  }

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch =
    textContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    textContent.match(/(\[[\s\S]*\])/);

  if (!jsonMatch) {
    if (process.env["DEBUG"]) {
      console.log("    [NO JSON MATCH FOUND]");
    }
    return [];
  }

  const raw = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ExtractedItem => {
      if (typeof item !== "object" || item === null) return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i["type"] === "string" &&
        ["decision", "preference", "fact", "update", "task"].includes(
          i["type"] as string,
        ) &&
        typeof i["content"] === "string" &&
        typeof i["importance"] === "number"
      );
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Rate limiting: max 10 req/min → 6 second delay between calls
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Progress file (idempotency across reruns)
// ---------------------------------------------------------------------------

const PROGRESS_FILE = path.join(
  process.env["TMPDIR"] ?? os.tmpdir(),
  "extraction-progress.json",
);

interface ProgressData {
  processedFiles: string[];
}

function loadProgress(): Set<string> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, "utf-8");
      const data = JSON.parse(raw) as ProgressData;
      return new Set(data.processedFiles ?? []);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveProgress(processed: Set<string>): void {
  try {
    const data: ProgressData = { processedFiles: Array.from(processed) };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore — non-critical
  }
}

// ---------------------------------------------------------------------------
// Content fingerprint for deduplication (first 80 chars, normalized)
// ---------------------------------------------------------------------------

function contentFingerprint(content: string): string {
  return content.trim().slice(0, 80).toLowerCase().replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  const envPath = path.join(projectRoot, ".env");
  const env = readEnvFile(envPath);

  // --- Config from env + CLI ---
  const supabaseUrl =
    process.env["VITE_SUPABASE_URL"] ?? env["VITE_SUPABASE_URL"];
  const supabaseKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    env["SUPABASE_SERVICE_ROLE_KEY"];
  const userId = getCliArg("user-id") ?? env["SYNC_USER_ID"];
  const limitArg = getCliArg("limit") ?? "50";
  const minSizeArg = getCliArg("min-size") ?? "1M";
  const dryRun = hasCliFlag("dry-run");

  // --- Validation ---
  if (!supabaseUrl) {
    console.error("ERROR: VITE_SUPABASE_URL must be set in .env");
    process.exit(1);
  }
  if (!supabaseKey) {
    console.error(
      "ERROR: SUPABASE_SERVICE_ROLE_KEY must be set in .env (anon key not accepted — this script bypasses RLS)",
    );
    process.exit(1);
  }

  if (!userId) {
    console.error(
      "ERROR: --user-id=UUID is required (or set SYNC_USER_ID in .env)",
    );
    process.exit(1);
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error(`ERROR: Invalid UUID format: ${userId}`);
    process.exit(1);
  }

  const limit = parseInt(limitArg, 10);
  if (isNaN(limit) || limit <= 0) {
    console.error(
      `ERROR: --limit must be a positive integer, got: ${limitArg}`,
    );
    process.exit(1);
  }
  const minSizeBytes = parseMinSize(minSizeArg);

  console.log("=== Extract Knowledge from Claude Transcripts ===");
  console.log(`User ID  : ${userId}`);
  console.log(`Limit    : ${limit} conversations`);
  console.log(`Min size : ${minSizeArg} (${minSizeBytes} bytes)`);
  console.log(`Dry run  : ${dryRun}`);
  console.log(`Supabase : ${supabaseUrl}`);
  console.log("");

  // --- Supabase client ---
  const supabase = createClient(supabaseUrl, supabaseKey);

  // --- Discover transcripts ---
  console.log("Scanning ~/.claude/projects/ for .jsonl transcripts...");
  const allTranscripts = discoverTranscripts(minSizeBytes);
  console.log(`Found ${allTranscripts.length} transcripts >= ${minSizeArg}`);

  // --- Load progress (already processed files) ---
  const processedFiles = loadProgress();
  const remaining = allTranscripts.filter(
    (t) => !processedFiles.has(t.filePath),
  );
  const toProcess = remaining.slice(0, limit);

  console.log(`Already processed : ${processedFiles.size} files (skipping)`);
  console.log(`To process now    : ${toProcess.length} files`);
  console.log("");

  if (toProcess.length === 0) {
    console.log("Nothing to process. All files already processed.");
    console.log(
      "(Delete the progress file to reprocess: " + PROGRESS_FILE + ")",
    );
    return;
  }

  // --- Fetch existing extracted memories for deduplication ---
  const { data: existingRows, error: fetchError } = await supabase
    .from("jarvis_memory")
    .select("content")
    .eq("source", "transcript_extraction")
    .eq("user_id", userId);

  if (fetchError) {
    console.error(`ERROR fetching existing memories: ${fetchError.message}`);
    process.exit(1);
  }

  const existingFingerprints = new Set<string>(
    ((existingRows ?? []) as Array<{ content: string }>).map((r) =>
      contentFingerprint(r.content ?? ""),
    ),
  );
  console.log(
    `Existing transcript_extraction records: ${existingFingerprints.size}\n`,
  );

  // --- Process each transcript ---
  const stats: InsertStats = {
    processed: 0,
    extracted: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 0; i < toProcess.length; i++) {
    const transcript = toProcess[i];
    const sizeMB = (transcript.sizeBytes / (1024 * 1024)).toFixed(1);
    const dateStr = new Date(transcript.mtimeMs).toISOString().slice(0, 10);

    // Show progress
    process.stdout.write(
      `[${i + 1}/${toProcess.length}] Processing ${path.basename(transcript.filePath, ".jsonl").slice(0, 8)}... (${sizeMB}MB, ${dateStr})`,
    );

    // Step 1: Parse transcript
    let conversationText: string;
    let meta: ConversationMeta;

    try {
      const result = await parseTranscript(transcript.filePath);
      conversationText = result.text;
      meta = result.meta;
    } catch (err) {
      console.log(` ERROR parsing: ${(err as Error).message}`);
      stats.errors++;
      processedFiles.add(transcript.filePath);
      saveProgress(processedFiles);
      continue;
    }

    if (conversationText.trim().length < 100) {
      console.log(" SKIP (too short)");
      processedFiles.add(transcript.filePath);
      saveProgress(processedFiles);
      continue;
    }

    // Step 2: Extract knowledge with Ollama (retry once on failure)
    let items: ExtractedItem[] = [];
    let extractionError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        items = await extractKnowledge(conversationText);
        extractionError = null;
        break;
      } catch (err) {
        extractionError = err as Error;
        if (attempt === 1) {
          process.stdout.write(" (retry in 10s...)");
          await sleep(10_000);
        }
      }
    }

    if (extractionError) {
      console.log(` ERROR Ollama: ${extractionError.message}`);
      stats.errors++;
      // Don't mark as processed — retry next run
      continue;
    }

    stats.processed++;

    if (items.length === 0) {
      console.log(" → 0 items");
      processedFiles.add(transcript.filePath);
      saveProgress(processedFiles);
      continue;
    }

    // Count by type for log
    const typeCounts = items.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const typeStr = Object.entries(typeCounts)
      .map(([t, n]) => `${n} ${t}${n > 1 ? "s" : ""}`)
      .join(", ");

    console.log(` → ${items.length} items (${typeStr})`);
    stats.extracted += items.length;

    const projectSlug = deriveProjectSlug(transcript.projectDir);

    // Step 3: Save to Supabase (or dry-run print)
    for (const item of items) {
      const contentWithSource = `[session:${meta.sessionId}] ${item.content}`;
      const fp = contentFingerprint(contentWithSource);

      if (existingFingerprints.has(fp)) {
        stats.skipped++;
        if (dryRun) {
          console.log(`    SKIP (duplicate): ${item.content.slice(0, 60)}...`);
        }
        continue;
      }

      if (dryRun) {
        console.log(
          `    [DRY-RUN] ${item.type.toUpperCase()} (importance ${item.importance}): ${item.content.slice(0, 80)}`,
        );
        stats.inserted++;
        existingFingerprints.add(fp);
        continue;
      }

      const { error: insertError } = await supabase
        .from("jarvis_memory")
        .insert({
          user_id: userId,
          type: item.type,
          content: contentWithSource,
          source: "transcript_extraction",
          project_slug: projectSlug,
          importance: Math.round(item.importance) / 10,
        });

      if (insertError) {
        console.log(
          `    ERROR inserting [${item.type}]: ${insertError.message}`,
        );
        stats.errors++;
      } else {
        stats.inserted++;
        existingFingerprints.add(fp);
      }
    }

    // Mark as processed
    processedFiles.add(transcript.filePath);
    saveProgress(processedFiles);

    // Rate limiting: 6 seconds between Haiku calls (max 10/min)
    if (i < toProcess.length - 1) {
      await sleep(6_000);
    }
  }

  // --- Summary ---
  console.log("\n=================================================");
  console.log("Extraction complete.");
  console.log(`  Conversations processed : ${stats.processed}`);
  console.log(`  Knowledge items found   : ${stats.extracted}`);
  console.log(
    `  Inserted to DB          : ${stats.inserted}${dryRun ? " (dry-run, not saved)" : ""}`,
  );
  console.log(`  Skipped (duplicates)    : ${stats.skipped}`);
  console.log(`  Errors                  : ${stats.errors}`);
  console.log(`  Progress saved to       : ${PROGRESS_FILE}`);
  console.log("=================================================");

  if (stats.errors > 0) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
