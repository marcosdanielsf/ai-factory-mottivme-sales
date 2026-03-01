#!/usr/bin/env node
/**
 * Mega Brain Extract Entities — Extrai entidades de chunks via Gemini Flash
 * Para cada chunk: detecta pessoas, empresas, tópicos, frameworks, livros, ferramentas
 * Faz merge com entidades existentes via find_entity_fuzzy (similaridade > 0.6)
 *
 * Usage:
 *   node scripts/mega-brain-extract-entities.mjs --source-id UUID
 *   node scripts/mega-brain-extract-entities.mjs --all
 */

import { parseArgs } from 'node:util';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('ERRO: Variaveis de ambiente obrigatorias: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const CHUNK_BATCH_SIZE = 50;
const RATE_LIMIT_MS = 500;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// ─── Args parsing ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'source-id': { type: 'string' },
    all:         { type: 'boolean', default: false },
    help:        { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || (!args['source-id'] && !args.all)) {
  console.log(`
Mega Brain Extract Entities — Extração de entidades via Gemini Flash

Uso:
  node scripts/mega-brain-extract-entities.mjs --source-id UUID
  node scripts/mega-brain-extract-entities.mjs --all

Opções:
  --source-id UUID  Processar apenas este source
  --all             Processar todos os sources sem entidades extraídas
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

async function extractEntitiesFromChunk(chunkText) {
  const prompt = `Extraia TODAS as entidades mencionadas neste texto. Inclua: pessoas, empresas, tópicos, frameworks, livros, ferramentas e lugares.

Retorne APENAS um JSON array válido, sem texto extra, no formato:
[{"name": "Nome da Entidade", "type": "person|company|topic|framework|book|tool|place", "context_snippet": "trecho relevante do texto"}]

TIPOS VÁLIDOS APENAS: person, company, topic, framework, book, tool, place

Se não houver entidades relevantes, retorne: []

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
    if (!Array.isArray(parsed)) return [];

    // Validar tipos — remover entidades com tipos inválidos
    const validTypes = ['person', 'company', 'topic', 'framework', 'book', 'tool', 'place'];
    return parsed.filter(e => validTypes.includes(e.type?.toLowerCase()));
  } catch {
    return [];
  }
}

// ─── Processamento de entidades ────────────────────────────────────────────────

async function upsertEntity(entity) {
  // 1. Tentar find_entity_fuzzy
  let existingEntity = null;
  try {
    const results = await sbRpc('find_entity_fuzzy', {
      search_name: entity.name,
      similarity_threshold: 0.6,
    });
    if (Array.isArray(results) && results.length > 0) {
      existingEntity = results[0];
    }
  } catch (err) {
    // RPC pode não existir ainda — prosseguir como nova entidade
    if (!err.message.includes('does not exist') && !err.message.includes('404')) {
      console.warn(`\n[fuzzy] Aviso: ${err.message}`);
    }
  }

  if (existingEntity) {
    // Merge: adicionar alias se nome for diferente, incrementar mention_count
    const aliases = existingEntity.aliases || [];
    const nameLower = entity.name.toLowerCase();
    const alreadyAlias = aliases.some(a => a.toLowerCase() === nameLower);
    const isMainName = existingEntity.canonical_name.toLowerCase() === nameLower;

    if (!alreadyAlias && !isMainName) {
      aliases.push(entity.name);
    }

    try {
      await sbPatch(`knowledge_entities?id=eq.${existingEntity.id}`, {
        aliases,
        mention_count: (existingEntity.mention_count || 0) + 1,
        last_seen_at: new Date().toISOString(),
      });
    } catch (err) {
      // Campo pode não existir — ignorar
      console.warn(`[update] Aviso ao atualizar entidade ${existingEntity.id}: ${err.message}`);
    }

    return existingEntity.id;
  }

  // Nova entidade
  try {
    const rows = await sbPost('knowledge_entities', {
      canonical_name: entity.name,
      entity_type: entity.type,
      aliases: [],
      mention_count: 1,
    });
    return Array.isArray(rows) ? rows[0]?.id : rows?.id;
  } catch (err) {
    // Pode ter constraint de nome duplicado — tentar buscar diretamente via fuzzy
    try {
      const results = await sbRpc('find_entity_fuzzy', {
        search_name: entity.name,
        similarity_threshold: 0.95,
      });
      if (Array.isArray(results) && results.length > 0) {
        return results[0].id;
      }
    } catch {}
    throw err;
  }
}

async function insertEntityMention(chunkId, entityId, contextSnippet, sourceId) {
  try {
    await sbPost('entity_mentions', {
      chunk_id: chunkId,
      entity_id: entityId,
      source_id: sourceId,
      mention_text: contextSnippet?.slice(0, 100) || '',
      context_snippet: contextSnippet?.slice(0, 500) || null,
      confidence: 1.0,
    }, 'return=minimal');
  } catch (err) {
    // Pode ter constraint unique (entity_id, chunk_id) — ignorar duplicatas
    if (!err.message.includes('duplicate') && !err.message.includes('unique')) {
      throw err;
    }
  }
}

// ─── Busca de sources/chunks ───────────────────────────────────────────────────

async function getSourceIds() {
  if (args['source-id']) {
    return [args['source-id']];
  }

  // Buscar sources completados (coluna entities_extracted não existe ainda no schema)
  // Processaremos todos os sources com processing_status=completed e chunks
  const sources = await sbGet(
    'knowledge_sources?select=id&processing_status=eq.completed&order=created_at.asc'
  );
  return sources.map(s => s.id);
}

async function getChunksForSource(sourceId) {
  const chunks = await sbGet(
    `knowledge_chunks?source_id=eq.${sourceId}&select=id,content,chunk_index&order=chunk_index.asc`
  );
  return chunks;
}

// ─── Processamento principal ───────────────────────────────────────────────────

async function processSource(sourceId) {
  console.log(`\n[source] Processando: ${sourceId}`);

  const chunks = await getChunksForSource(sourceId);
  if (chunks.length === 0) {
    console.log(`[source] Nenhum chunk encontrado — pulando`);
    return { chunks: 0, entities: 0, mentions: 0 };
  }

  console.log(`[source] ${chunks.length} chunks encontrados`);

  let totalEntities = 0;
  let totalMentions = 0;
  let processedChunks = 0;

  for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE);

    for (const chunk of batch) {
      try {
        const entities = await extractEntitiesFromChunk(chunk.content);

        for (const entity of entities) {
          if (!entity.name || entity.name.trim().length < 2) continue;

          try {
            const entityId = await upsertEntity(entity);
            if (entityId) {
              await insertEntityMention(chunk.id, entityId, entity.context_snippet, sourceId);
              totalMentions++;
              totalEntities++;
            }
          } catch (err) {
            console.warn(`\n[entity] Erro ao processar "${entity.name}": ${err.message}`);
          }
        }
      } catch (err) {
        console.warn(`\n[chunk] Erro no chunk ${chunk.chunk_index}: ${err.message}`);
      }

      processedChunks++;
      const pct = Math.round((processedChunks / chunks.length) * 100);
      process.stdout.write(`\r[extract] ${processedChunks}/${chunks.length} chunks (${pct}%) | ${totalEntities} entidades        `);
    }

    // Rate limit entre batches
    if (i + CHUNK_BATCH_SIZE < chunks.length) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  // Nota: source já está marcado como completed — entidades foram extraídas
  // Campo entities_extracted não existe no schema atual, será adicionado em futura migration

  console.log(`\n[source] Concluído: ${totalEntities} entidades, ${totalMentions} menções`);
  return { chunks: chunks.length, entities: totalEntities, mentions: totalMentions };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('MEGA BRAIN EXTRACT ENTITIES');
  console.log('='.repeat(60));

  const sourceIds = await getSourceIds();

  if (sourceIds.length === 0) {
    console.log('Nenhum source para processar.');
    process.exit(0);
  }

  console.log(`Sources a processar: ${sourceIds.length}`);

  let totalChunks = 0;
  let totalEntities = 0;
  let totalMentions = 0;

  for (const sourceId of sourceIds) {
    try {
      const result = await processSource(sourceId);
      totalChunks += result.chunks;
      totalEntities += result.entities;
      totalMentions += result.mentions;
    } catch (err) {
      console.error(`\n[ERRO] Source ${sourceId}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('EXTRAÇÃO CONCLUÍDA');
  console.log('='.repeat(60));
  console.log(`Sources:   ${sourceIds.length}`);
  console.log(`Chunks:    ${totalChunks}`);
  console.log(`Entidades: ${totalEntities}`);
  console.log(`Menções:   ${totalMentions}`);
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
