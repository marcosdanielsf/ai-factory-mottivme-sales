#!/usr/bin/env node
/**
 * mega-brain-extract-entities.mjs
 * Extrai entidades de chunks usando Gemini Flash e faz dedup fuzzy.
 *
 * Uso:
 *   node scripts/mega-brain-extract-entities.mjs --source-id UUID
 *   node scripts/mega-brain-extract-entities.mjs --all
 */

import { parseArgs } from 'node:util';

// ============================================================
// CONFIG — env vars (setar antes de rodar)
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.MEGA_BRAIN_GEMINI_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const CHUNK_BATCH_SIZE = 50;
const FUZZY_SIMILARITY_THRESHOLD = 0.6;
const LLM_SLEEP_MS = 1000;

const supaHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// ============================================================
// CLI
// ============================================================
const { values: args } = parseArgs({
  options: {
    'source-id': { type: 'string' },
    all:         { type: 'boolean', default: false },
    help:        { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (args.help || (!args['source-id'] && !args.all)) {
  console.log(`
Uso:
  node scripts/mega-brain-extract-entities.mjs --source-id UUID
  node scripts/mega-brain-extract-entities.mjs --all

Opcoes:
  --source-id UUID   Processar apenas este source
  --all              Processar todos os sources sem entities extraidas
  --help, -h         Exibir ajuda
`);
  process.exit(0);
}

// ============================================================
// HELPERS
// ============================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { ...supaHeaders, ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${opts.method || 'GET'} ${path} -> ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function rpcCall(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: supaHeaders,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RPC ${fn} -> ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function extractEntitiesFromChunks(chunks) {
  const combinedText = chunks.map(c => c.content).join('\n\n---\n\n');
  const prompt = `Extraia TODAS as entidades mencionadas neste texto. Tipos aceitos: person, company, topic, book, framework, tool, place.

Para cada entidade, retorne um item no array JSON com:
- name: nome da entidade exatamente como aparece
- type: um dos tipos acima
- context_snippet: trecho (max 200 chars) onde a entidade aparece pela primeira vez

Retorne APENAS o JSON array, sem markdown, sem explicacoes.

Texto:
${combinedText.slice(0, 25000)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API -> ${res.status}: ${body}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  // Extrair JSON do texto (pode ter markdown)
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.warn('  [warn] Falha ao parsear JSON de entidades, retornando []');
    return [];
  }
}

async function findOrCreateEntity(name, type, contextSnippet) {
  // Buscar entidade via fuzzy RPC
  let matchedEntity = null;

  try {
    const results = await rpcCall('find_entity_fuzzy', {
      p_name: name,
      p_type: type,
      p_threshold: FUZZY_SIMILARITY_THRESHOLD,
    });

    if (results && results.length > 0) {
      matchedEntity = results[0];
    }
  } catch (err) {
    // RPC pode nao existir ainda — fallback para busca direta
    const existing = await supaFetch(
      `knowledge_entities?canonical_name=ilike.${encodeURIComponent(name)}&entity_type=eq.${type}&limit=1`
    );
    if (existing && existing.length > 0) {
      matchedEntity = { entity_id: existing[0].id, similarity: 1.0, entity: existing[0] };
    }
  }

  if (matchedEntity && matchedEntity.similarity > FUZZY_SIMILARITY_THRESHOLD) {
    const entityId = matchedEntity.entity_id || matchedEntity.id;

    // Adicionar alias se o nome e diferente do canonical
    try {
      const current = await supaFetch(`knowledge_entities?id=eq.${entityId}&select=aliases,mention_count`);
      if (current && current.length > 0) {
        const entity = current[0];
        const aliases = Array.isArray(entity.aliases) ? entity.aliases : [];
        if (!aliases.includes(name) && name !== entity.canonical_name) {
          aliases.push(name);
          await supaFetch(`knowledge_entities?id=eq.${entityId}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              aliases,
              mention_count: (entity.mention_count || 0) + 1,
              updated_at: new Date().toISOString(),
            }),
          });
        } else {
          await supaFetch(`knowledge_entities?id=eq.${entityId}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              mention_count: (entity.mention_count || 0) + 1,
              updated_at: new Date().toISOString(),
            }),
          });
        }
      }
    } catch (err) {
      console.warn(`  [warn] Falha ao atualizar aliases para ${name}: ${err.message}`);
    }

    return entityId;
  }

  // Criar nova entidade
  const newEntity = await supaFetch('knowledge_entities', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      canonical_name: name,
      entity_type: type,
      aliases: [],
      mention_count: 1,
      dossier_text: null,
      dossier_updated_at: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  return newEntity[0].id;
}

async function insertEntityMention(entityId, chunkId, sourceId, mentionText, contextSnippet) {
  // Verificar se ja existe mention para evitar duplicatas
  try {
    const existing = await supaFetch(
      `entity_mentions?entity_id=eq.${entityId}&chunk_id=eq.${chunkId}&select=id&limit=1`
    );
    if (existing && existing.length > 0) return;
  } catch (_) {
    // Tabela pode nao existir, continuar
  }

  await supaFetch('entity_mentions', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      entity_id: entityId,
      chunk_id: chunkId,
      source_id: sourceId,
      mention_text: mentionText,
      context_snippet: contextSnippet?.slice(0, 500) || '',
      created_at: new Date().toISOString(),
    }),
  });
}

async function processSource(sourceId) {
  console.log(`\nProcessando source: ${sourceId}`);

  // Buscar chunks do source
  const chunks = await supaFetch(
    `knowledge_chunks?source_id=eq.${sourceId}&select=id,content,chunk_index&order=chunk_index.asc`
  );

  if (!chunks || chunks.length === 0) {
    console.log(`  Nenhum chunk encontrado para source ${sourceId}`);
    return;
  }

  console.log(`  ${chunks.length} chunks encontrados`);

  let totalEntities = 0;
  let totalMentions = 0;

  // Processar em batches
  for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE);
    const batchNum = Math.floor(i / CHUNK_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / CHUNK_BATCH_SIZE);

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);

    let entities = [];
    try {
      entities = await extractEntitiesFromChunks(batch);
    } catch (err) {
      console.error(`  [erro] LLM falhou no batch ${batchNum}: ${err.message}`);
      await sleep(LLM_SLEEP_MS * 3);
      continue;
    }

    console.log(`    ${entities.length} entidades extraidas`);

    for (const entity of entities) {
      if (!entity.name || !entity.type) continue;

      try {
        const entityId = await findOrCreateEntity(entity.name, entity.type, entity.context_snippet);

        // Inserir mencoes para todos os chunks do batch
        for (const chunk of batch) {
          if (chunk.content.toLowerCase().includes(entity.name.toLowerCase())) {
            await insertEntityMention(entityId, chunk.id, sourceId, entity.name, entity.context_snippet);
            totalMentions++;
          }
        }
        totalEntities++;
      } catch (err) {
        console.warn(`  [warn] Falha ao processar entidade "${entity.name}": ${err.message}`);
      }
    }

    // Rate limiting entre batches
    if (i + CHUNK_BATCH_SIZE < chunks.length) {
      await sleep(LLM_SLEEP_MS);
    }
  }

  // Marcar source como entities processadas
  try {
    await supaFetch(`knowledge_sources?id=eq.${sourceId}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        entities_extracted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (_) {
    // Campo pode nao existir, ignorar
  }

  console.log(`  Concluido: ${totalEntities} entidades, ${totalMentions} mencoes`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Mega Brain: Extract Entities ===');

  if (args['source-id']) {
    await processSource(args['source-id']);
  } else if (args.all) {
    // Buscar sources sem entities extraidas
    let sources;
    try {
      sources = await supaFetch(
        `knowledge_sources?entities_extracted_at=is.null&select=id,title&order=created_at.asc`
      );
    } catch (_) {
      // Fallback se campo nao existir
      sources = await supaFetch(
        `knowledge_sources?select=id,title&order=created_at.asc`
      );
    }

    if (!sources || sources.length === 0) {
      console.log('Nenhum source pendente encontrado.');
      return;
    }

    console.log(`${sources.length} sources para processar`);

    for (const source of sources) {
      console.log(`\n[${sources.indexOf(source) + 1}/${sources.length}] ${source.title || source.id}`);
      try {
        await processSource(source.id);
      } catch (err) {
        console.error(`  [erro] Source ${source.id}: ${err.message}`);
      }
    }
  }

  console.log('\nConcluido!');
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
