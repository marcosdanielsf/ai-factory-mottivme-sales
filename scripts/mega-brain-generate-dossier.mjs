#!/usr/bin/env node
/**
 * mega-brain-generate-dossier.mjs
 * Gera dossies sintetizados para entidades usando GPT-4o-mini.
 *
 * Uso:
 *   node scripts/mega-brain-generate-dossier.mjs --entity-id UUID
 *   node scripts/mega-brain-generate-dossier.mjs --all
 */

import { parseArgs } from 'node:util';

// ============================================================
// CONFIG — env vars (setar antes de rodar)
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.MEGA_BRAIN_OPENAI_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const MIN_MENTION_COUNT = 3;
const LLM_SLEEP_MS = 1000;
const MAX_CONTEXT_CHARS = 20000;

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
    'entity-id': { type: 'string' },
    all:         { type: 'boolean', default: false },
    'min-mentions': { type: 'string', default: String(MIN_MENTION_COUNT) },
    help:        { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (args.help || (!args['entity-id'] && !args.all)) {
  console.log(`
Uso:
  node scripts/mega-brain-generate-dossier.mjs --entity-id UUID
  node scripts/mega-brain-generate-dossier.mjs --all

Opcoes:
  --entity-id UUID      Processar apenas esta entidade
  --all                 Processar entidades com mention_count >= ${MIN_MENTION_COUNT}
  --min-mentions N      Minimo de mencoes para processar (default: ${MIN_MENTION_COUNT})
  --help, -h            Exibir ajuda
`);
  process.exit(0);
}

const minMentions = parseInt(args['min-mentions'] || String(MIN_MENTION_COUNT), 10);

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

async function generateDossier(entity, mentions, chunks, sources) {
  // Agrupar mencoes por source
  const bySource = {};
  for (const mention of mentions) {
    const sourceId = mention.source_id;
    if (!bySource[sourceId]) {
      const src = sources.find(s => s.id === sourceId);
      bySource[sourceId] = {
        title: src?.title || sourceId,
        author: src?.author || 'Desconhecido',
        snippets: [],
      };
    }
    bySource[sourceId].snippets.push(mention.context_snippet || mention.mention_text);
  }

  const sourceSummary = Object.entries(bySource)
    .map(([, src]) => `**${src.title}** (${src.author}):\n${src.snippets.slice(0, 5).join('\n')}`)
    .join('\n\n---\n\n');

  const chunkContext = chunks
    .slice(0, 20)
    .map(c => c.content)
    .join('\n\n')
    .slice(0, MAX_CONTEXT_CHARS);

  const numSources = Object.keys(bySource).length;

  const prompt = `Sintetize um dossie completo sobre "${entity.canonical_name}" (tipo: ${entity.entity_type}) baseado nestas mencoes de ${numSources} fontes diferentes.

MENCOES POR FONTE:
${sourceSummary.slice(0, 10000)}

CONTEXTO ADICIONAL:
${chunkContext}

Formato markdown:
## Resumo
(2-3 paragrafos sobre quem/o que e esta entidade)

## Contexto
(em que contextos aparece, por que e relevante)

## Insights Chave
(bullet points com as informacoes mais importantes)

## Conexoes
(outras entidades, temas ou contextos relacionados mencionados)

## Fontes Citadas
(lista das ${numSources} fontes com titulo e autor)

Seja objetivo, factual e baseado APENAS nas informacoes fornecidas.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: 'Voce e um analista especializado em sintetizar informacoes sobre pessoas, empresas, frameworks e conceitos.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API -> ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function processEntity(entityId) {
  // Buscar entidade
  const entities = await supaFetch(`knowledge_entities?id=eq.${entityId}&select=*`);
  if (!entities || entities.length === 0) {
    throw new Error(`Entidade ${entityId} nao encontrada`);
  }
  const entity = entities[0];
  console.log(`  Entidade: ${entity.canonical_name} (${entity.entity_type})`);

  // Buscar entity_mentions com chunks e sources
  let mentions = [];
  try {
    mentions = await supaFetch(
      `entity_mentions?entity_id=eq.${entityId}&select=id,chunk_id,source_id,mention_text,context_snippet&limit=100`
    );
  } catch (_) {
    console.warn('  [warn] entity_mentions nao disponivel');
  }

  // Buscar chunks diretamente via entity_mentions
  const chunkIds = [...new Set((mentions || []).map(m => m.chunk_id).filter(Boolean))];
  let chunks = [];
  if (chunkIds.length > 0) {
    const chunkIdList = chunkIds.slice(0, 50).map(id => `"${id}"`).join(',');
    try {
      chunks = await supaFetch(
        `knowledge_chunks?id=in.(${chunkIdList})&select=id,content,source_id`
      );
    } catch (_) {
      console.warn('  [warn] Falha ao buscar chunks');
    }
  }

  // Buscar sources
  const sourceIds = [...new Set((mentions || []).map(m => m.source_id).filter(Boolean))];
  let sources = [];
  if (sourceIds.length > 0) {
    const sourceIdList = sourceIds.map(id => `"${id}"`).join(',');
    try {
      sources = await supaFetch(
        `knowledge_sources?id=in.(${sourceIdList})&select=id,title,author`
      );
    } catch (_) {
      console.warn('  [warn] Falha ao buscar sources');
    }
  }

  console.log(`  ${(mentions || []).length} mencoes, ${(chunks || []).length} chunks, ${(sources || []).length} fontes`);

  if ((mentions || []).length === 0 && (chunks || []).length === 0) {
    console.log('  Sem dados suficientes para gerar dossie');
    return;
  }

  const dossierText = await generateDossier(entity, mentions || [], chunks || [], sources || []);

  // Salvar dossier na entidade
  await supaFetch(`knowledge_entities?id=eq.${entityId}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      dossier_text: dossierText,
      dossier_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  console.log(`  Dossie gerado: ${dossierText.length} chars`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Mega Brain: Generate Dossier ===');

  if (args['entity-id']) {
    await processEntity(args['entity-id']);
  } else if (args.all) {
    // Buscar entidades com mention_count suficiente e sem dossier atualizado
    const entities = await supaFetch(
      `knowledge_entities?mention_count=gte.${minMentions}&select=id,canonical_name,entity_type,mention_count&order=mention_count.desc`
    );

    if (!entities || entities.length === 0) {
      console.log(`Nenhuma entidade com >= ${minMentions} mencoes encontrada.`);
      return;
    }

    console.log(`${entities.length} entidades para processar`);

    for (const entity of entities) {
      console.log(`\n[${entities.indexOf(entity) + 1}/${entities.length}] ${entity.canonical_name} (${entity.mention_count} mencoes)`);
      try {
        await processEntity(entity.id);
      } catch (err) {
        console.error(`  [erro]: ${err.message}`);
      }
      await sleep(LLM_SLEEP_MS);
    }
  }

  console.log('\nConcluido!');
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
