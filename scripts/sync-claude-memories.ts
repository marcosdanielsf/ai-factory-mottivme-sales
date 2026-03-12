// Usage: npx tsx scripts/sync-claude-memories.ts
// Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
// Optional: SYNC_USER_ID in .env or --user-id=UUID as CLI arg

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Frontmatter {
  name?: string;
  description?: string;
  type?: string;
}

interface ParsedMemoryFile {
  filePath: string;
  projectDir: string;
  fileName: string;
  frontmatter: Frontmatter | null;
  content: string;
}

interface MemoryRow {
  id: string;
  content: string;
  source: string;
  project_slug: string | null;
}

interface SyncStats {
  inserted: number;
  updated: number;
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
    // Remove surrounding quotes if present
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

// ---------------------------------------------------------------------------
// Frontmatter parser (regex, no external deps)
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): {
  frontmatter: Frontmatter | null;
  body: string;
} {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = raw.match(fmRegex);

  if (!match) {
    return { frontmatter: null, body: raw };
  }

  const fmBlock = match[1];
  const body = match[2];
  const frontmatter: Frontmatter = {};

  for (const line of fmBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key === "name") frontmatter.name = value;
    else if (key === "description") frontmatter.description = value;
    else if (key === "type") frontmatter.type = value;
  }

  return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// Map frontmatter type → DB type
// ---------------------------------------------------------------------------

// DB constraint: type IN ('task', 'preference', 'decision', 'update', 'fact')
function mapType(fmType: string | undefined): string {
  if (!fmType) return "fact";
  const map: Record<string, string> = {
    user: "preference",
    feedback: "decision",
    project: "update",
    reference: "fact",
  };
  return map[fmType.toLowerCase()] ?? "fact";
}

// ---------------------------------------------------------------------------
// Derive project_slug from directory path
// e.g. '-Users-marcosdaniels-Projects-mottivme-saas-assembly-line-t1'
//   → 'assembly-line-t1'
// Strategy: take the last 1-3 meaningful path segments
// ---------------------------------------------------------------------------

function deriveProjectSlug(projectDir: string): string {
  // projectDir is the folder name under ~/.claude/projects/
  // It looks like: -Users-marcosdaniels-Projects-mottivme-some-project-name
  // We want: some-project-name (last meaningful segment)

  // Split on hyphens but filter out path-like segments
  const parts = projectDir.split("-").filter((p) => p.length > 0);

  // Find index where meaningful project name starts
  // Common prefixes to skip: 'Users', username, 'Projects', company names
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
    "5", // numbered dirs
    "ai",
    "factory",
    "mottivme",
    "sales",
    "front",
    "factorai",
  ]);

  // Try to find meaningful suffix (last 2-4 parts not in skip list)
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

  // Fallback: last segment of raw path (use full dir name truncated)
  return projectDir.slice(-40).replace(/^-/, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Discover all memory .md files
// ---------------------------------------------------------------------------

const SKIP_FILES = new Set([
  "MEMORY.md",
  "MEMORY-INDEX.md",
  "api-keys.md",
  "session-log.md",
]);

function discoverMemoryFiles(): ParsedMemoryFile[] {
  const claudeProjectsDir = path.join(os.homedir(), ".claude", "projects");

  if (!fs.existsSync(claudeProjectsDir)) {
    console.error(`Directory not found: ${claudeProjectsDir}`);
    return [];
  }

  const results: ParsedMemoryFile[] = [];

  const projectDirs = fs
    .readdirSync(claudeProjectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const projectDir of projectDirs) {
    const memoryDir = path.join(claudeProjectsDir, projectDir, "memory");

    if (!fs.existsSync(memoryDir)) continue;

    const files = fs
      .readdirSync(memoryDir, { withFileTypes: true })
      .filter(
        (f) => f.isFile() && f.name.endsWith(".md") && !SKIP_FILES.has(f.name),
      );

    for (const file of files) {
      const filePath = path.join(memoryDir, file.name);
      let raw: string;

      try {
        raw = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`  ERROR reading ${filePath}: ${(err as Error).message}`);
        continue;
      }

      if (raw.trim().length < 10) continue;

      const { frontmatter } = parseFrontmatter(raw);

      results.push({
        filePath,
        projectDir,
        fileName: file.name,
        frontmatter,
        content: raw, // full content including frontmatter
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Content fingerprint for deduplication (first 100 chars, normalized)
// ---------------------------------------------------------------------------

function contentFingerprint(content: string): string {
  return content.trim().slice(0, 100).replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Main sync logic
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const projectRoot = path.resolve(process.cwd());
  const envPath = path.join(projectRoot, ".env");
  const env = readEnvFile(envPath);

  const supabaseUrl =
    process.env["VITE_SUPABASE_URL"] ?? env["VITE_SUPABASE_URL"];
  // Prefer service_role key (bypasses RLS) > anon key
  const supabaseKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??
    env["SUPABASE_SERVICE_ROLE_KEY"] ??
    env["VITE_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "ERROR: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY) must be set in .env",
    );
    process.exit(1);
  }

  // Resolve user_id: CLI arg > .env > error
  const userId = getCliArg("user-id") ?? env["SYNC_USER_ID"];

  if (!userId) {
    console.error(
      "ERROR: user_id is required.\n" +
        "  Options:\n" +
        "  1. Pass --user-id=UUID as CLI argument\n" +
        "  2. Set SYNC_USER_ID=UUID in .env",
    );
    process.exit(1);
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error(`ERROR: Invalid UUID format for user_id: ${userId}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Claude Code Memory Sync -> Supabase (jarvis_memory)");
  console.log(`User ID: ${userId}`);
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // 1. Discover local files
  console.log("Scanning ~/.claude/projects/*/memory/*.md ...");
  const memoryFiles = discoverMemoryFiles();
  console.log(`Found ${memoryFiles.length} memory files to process\n`);

  if (memoryFiles.length === 0) {
    console.log("No memory files found. Nothing to sync.");
    return;
  }

  // 2. Fetch all existing records from this source + user
  console.log("Fetching existing records from jarvis_memory ...");
  const { data: existingRows, error: fetchError } = await supabase
    .from("jarvis_memory")
    .select("id, content, source, project_slug")
    .eq("source", "claude_code")
    .eq("user_id", userId);

  if (fetchError) {
    console.error(`ERROR fetching existing records: ${fetchError.message}`);
    process.exit(1);
  }

  // Build lookup map: fingerprint -> row
  const existingByFingerprint = new Map<string, MemoryRow>();
  for (const row of (existingRows ?? []) as MemoryRow[]) {
    const fp = contentFingerprint(row.content ?? "");
    existingByFingerprint.set(fp, row);
  }
  console.log(`Found ${existingByFingerprint.size} existing records in DB\n`);

  // 3. Process each file
  const stats: SyncStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (const memFile of memoryFiles) {
    const { filePath, projectDir, fileName, frontmatter, content } = memFile;
    const fingerprint = contentFingerprint(content);
    const projectSlug = deriveProjectSlug(projectDir);
    const dbType = mapType(frontmatter?.type);

    const existing = existingByFingerprint.get(fingerprint);

    if (existing) {
      // Same content fingerprint exists — check if content changed beyond 100 chars
      if (existing.content.trim() === content.trim()) {
        stats.skipped++;
        console.log(`  SKIP   ${fileName} (${projectSlug}) — unchanged`);
        continue;
      }

      // Content changed — UPDATE
      const { error: updateError } = await supabase
        .from("jarvis_memory")
        .update({
          content,
          type: dbType,
          project_slug: projectSlug,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error(`  ERROR  ${fileName}: ${updateError.message}`);
        stats.errors++;
      } else {
        stats.updated++;
        console.log(`  UPDATE ${fileName} (${projectSlug}) — content changed`);
      }
      continue;
    }

    // New record — INSERT
    const { error: insertError } = await supabase.from("jarvis_memory").insert({
      user_id: userId,
      type: dbType,
      content,
      source: "claude_code",
      project_slug: projectSlug,
      importance: 5,
    });

    if (insertError) {
      console.error(
        `  ERROR  ${fileName} (${projectSlug}): ${insertError.message}`,
      );
      stats.errors++;
    } else {
      stats.inserted++;
      console.log(`  INSERT ${fileName} (${projectSlug}) [${dbType}]`);
    }
  }

  // 4. Summary
  console.log("\n-------------------------------------------");
  console.log("Sync complete.");
  console.log(`  Inserted : ${stats.inserted}`);
  console.log(`  Updated  : ${stats.updated}`);
  console.log(`  Skipped  : ${stats.skipped}`);
  console.log(`  Errors   : ${stats.errors}`);
  console.log("-------------------------------------------");

  if (stats.errors > 0) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
