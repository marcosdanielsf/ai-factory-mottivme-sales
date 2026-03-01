#!/usr/bin/env node
/**
 * Mega Brain Detect Frameworks — Detecta frameworks e metodologias nos chunks via Gemini Flash
 * Cria/atualiza entidades do tipo 'framework' com dedup fuzzy
 *
 * Usage:
 *   node scripts/mega-brain-detect-frameworks.mjs --source-id UUID
 *   node scripts/mega-brain-detect-frameworks.mjs --recent 10
 */

import { parseArgs } from 'node:util';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bfumywvwubvernvhjehk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE';
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB5-mijknEPpsUdSmpXMIytwNNEjSbHJsE';

const CHUNK_BATCH_SIZE = 50;
const RATE_LIMIT_MS = 500;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// ─── Args parsing ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'source-id': { type: 'string' },
    recent:      { type: 'string' },
    help:        { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || (!args['source-id'] && !args.recent)) {
  console.log(`
Mega Brain Detect Frameworks — Detecção de frameworks via Gemini Flash

Uso:
  node scripts/mega-brain-detect-frameworks.mjs --source-id UUID
  node scripts/mega-brain-detect-frameworks.mjs --recent 10

Opções:
  --source-id UUID  Processar apenas este source
  --recent N        Processar os últimos N sources
  --help            Mostrar esta ajuda
`);
  process.exit(0);
}

// ─── Supabase helpers ──────────────────────────────────────────────────────────

function sbHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: sbHeaders(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase GET ${path}: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function sbPost(path, body, prefer = 'return=representation') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': prefer },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase POST ${path}: ${res.status} ${err.slice(0, 200)}`);
  }
  return prefer === 'return=minimal' ? null : res.json();
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase PATCH ${path}: ${res.status} ${err.slice(0, 200)}`);
  }
}

async function sbRpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase RPC ${fn}: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Gemini Flash ──────────────────────────────────────────────────────────────

async function detectFrameworksInChunk(chunkText) {
  const prompt = `Identifique TODOS os frameworks, metodologias ou processos estruturados mencionados neste texto. Inclua apenas os que têm uma estrutura clara (passos, etapas, componentes) ou são metodologias reconhecidas.

Retorne APENAS um JSON array válido, sem texto extra:
[{
  "name": "Nome do Framework",
  "steps": ["passo 1", "passo 2"],
  "when_to_use": "Quando aplicar este framework",
  "example": "Exemplo de uso",
  "source_person": "Quem criou ou popularizou (se mencionado)",
  "source_context": "Como aparece no texto"
}]

Se não houver frameworks identificáveis, retorne: []

Texto:
${chunkText}`;

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Flash ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Upsert framework como entidade ───────────────────────────────────────────

async function upsertFrameworkEntity(framework) {
  if (!framework.name || framework.name.trim().length < 2) return null;

  // Tentar find_entity_fuzzy com tipo 'framework'
  let existingId = null;
  try {
    const results = await sbRpc('find_entity_fuzzy', {
      search_name: framework.name,
      similarity_threshold: 0.6,
    });
    if (Array.isArray(results) && results.length > 0) {
      // Verificar se é um framework
      const match = results.find(r => r.entity_type === 'framework') || results[0];
      existingId = match.id;

      // Atualizar mention_count
      try {
        await sbPatch(`knowledge_entities?id=eq.${existingId}`, {
          mention_count: (match.mention_count || 0) + 1,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Ignorar
      }

      return existingId;
    }
  } catch (err) {
    if (!err.message.includes('does not exist') && !err.message.includes('404')) {
      console.warn(`\n[fuzzy] Aviso: ${err.message}`);
    }
  }

  // Criar nova entidade de framework
  try {
    const rows = await sbPost('knowledge_entities', {
      name: framework.name,
      entity_type: 'framework',
      aliases: [],
      mention_count: 1,
      metadata: {
        steps: framework.steps || [],
        when_to_use: framework.when_to_use || null,
        example: framework.example || null,
        source_person: framework.source_person || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return Array.isArray(rows) ? rows[0]?.id : rows?.id;
  } catch (err) {
    if (err.message.includes('duplicate') || err.message.includes('unique')) {
      try {
        const existing = await sbGet(
          `knowledge_entities?name=eq.${encodeURIComponent(framework.name)}&limit=1`
        );
        if (existing.length > 0) return existing[0].id;
      } catch {}
    }
    throw err;
  }
}

// ─── Busca de sources ─────────────────────────────────────────────────────────

async function getSourceIds() {
  if (args['source-id']) {
    return [args['source-id']];
  }

  const n = parseInt(args.recent, 10) || 10;
  const sources = await sbGet(
    `knowledge_sources?select=id&status=eq.completed&order=created_at.desc&limit=${n}`
  );
  return sources.map(s => s.id);
}

async function getChunksForSource(sourceId) {
  return sbGet(
    `knowledge_chunks?source_id=eq.${sourceId}&select=id,content,chunk_index&order=chunk_index.asc`
  );
}

// ─── Processamento principal ───────────────────────────────────────────────────

async function processSource(sourceId, index, total) {
  console.log(`\n[${index}/${total}] Source: ${sourceId}`);

  const chunks = await getChunksForSource(sourceId);
  if (chunks.length === 0) {
    console.log(`  Nenhum chunk encontrado — pulando`);
    return { chunks: 0, frameworks: 0 };
  }

  console.log(`  ${chunks.length} chunks`);

  let totalFrameworks = 0;
  let processedChunks = 0;

  for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE);

    for (const chunk of batch) {
      try {
        const frameworks = await detectFrameworksInChunk(chunk.content);

        for (const fw of frameworks) {
          try {
            const entityId = await upsertFrameworkEntity(fw);
            if (entityId) {
              // Registrar menção do framework no chunk
              try {
                await sbPost('entity_mentions', {
                  chunk_id: chunk.id,
                  entity_id: entityId,
                  source_id: sourceId,
                  context_snippet: fw.source_context?.slice(0, 500) || null,
                  created_at: new Date().toISOString(),
                }, 'return=minimal');
              } catch {
                // Ignorar duplicatas de menção
              }
              totalFrameworks++;
            }
          } catch (err) {
            console.warn(`\n[framework] Erro ao processar "${fw.name}": ${err.message}`);
          }
        }
      } catch (err) {
        console.warn(`\n[chunk] Erro no chunk ${chunk.chunk_index}: ${err.message}`);
      }

      processedChunks++;
      const pct = Math.round((processedChunks / chunks.length) * 100);
      process.stdout.write(`\r  [detect] ${processedChunks}/${chunks.length} chunks (${pct}%) | ${totalFrameworks} frameworks        `);
    }

    // Rate limit entre batches
    if (i + CHUNK_BATCH_SIZE < chunks.length) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  console.log(`\n  Concluído: ${totalFrameworks} frameworks detectados`);
  return { chunks: chunks.length, frameworks: totalFrameworks };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('MEGA BRAIN DETECT FRAMEWORKS');
  console.log('='.repeat(60));

  const sourceIds = await getSourceIds();

  if (sourceIds.length === 0) {
    console.log('Nenhum source para processar.');
    process.exit(0);
  }

  console.log(`Sources a processar: ${sourceIds.length}`);

  let totalChunks = 0;
  let totalFrameworks = 0;

  for (let i = 0; i < sourceIds.length; i++) {
    try {
      const result = await processSource(sourceIds[i], i + 1, sourceIds.length);
      totalChunks += result.chunks;
      totalFrameworks += result.frameworks;
    } catch (err) {
      console.error(`\n[ERRO] Source ${sourceIds[i]}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DETECÇÃO CONCLUÍDA');
  console.log('='.repeat(60));
  console.log(`Sources:    ${sourceIds.length}`);
  console.log(`Chunks:     ${totalChunks}`);
  console.log(`Frameworks: ${totalFrameworks}`);
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
