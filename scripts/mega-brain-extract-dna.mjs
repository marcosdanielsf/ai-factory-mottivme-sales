#!/usr/bin/env node
/**
 * mega-brain-extract-dna.mjs
 * Extrai DNA intelectual de experts (6 camadas) usando GPT-4o-mini.
 *
 * Uso:
 *   node scripts/mega-brain-extract-dna.mjs --entity-id UUID
 *   node scripts/mega-brain-extract-dna.mjs --all
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

const MIN_MENTION_COUNT = 5;
const LLM_SLEEP_MS = 1200;
const MAX_CONTEXT_CHARS = 18000;

const supaHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// ============================================================
// 6 CAMADAS DE DNA
// ============================================================
const DNA_LAYERS = [
  {
    layer: 'philosophy',
    label: 'Filosofia',
    prompt: (name) => `Quais sao as crencas fundamentais, valores e visao de mundo de ${name}? Baseado nos textos abaixo, extraia cada crenca como um item separado.

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Nome da crenca", "description": "Explicacao detalhada", "evidence": ["trecho 1", "trecho 2"], "confidence": 0.8}]}

Confidence de 0 a 1 baseado na forca da evidencia. Minimo 3, maximo 10 items.`,
  },
  {
    layer: 'mental_models',
    label: 'Modelos Mentais',
    prompt: (name) => `Quais modelos mentais ${name} usa recorrentemente para pensar e tomar decisoes? (ex: Pareto, First Principles, Inversion, Second-order thinking...)

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Nome do modelo", "description": "Como ${name} aplica este modelo", "evidence": ["trecho 1"], "confidence": 0.7}]}

Minimo 2, maximo 8 items.`,
  },
  {
    layer: 'heuristics',
    label: 'Heuristicas',
    prompt: (name) => `Quais regras de bolso, atalhos decisorios e principios praticos ${name} aplica? (frases como "sempre faca X", "nunca faca Y", "quando Z, entao W")

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Regra curta e memoravel", "description": "Contexto e como aplicar", "evidence": ["trecho 1"], "confidence": 0.75}]}

Minimo 3, maximo 10 items.`,
  },
  {
    layer: 'frameworks',
    label: 'Frameworks',
    prompt: (name) => `Quais frameworks estruturados ${name} criou ou usa consistentemente? Extraia o nome, os passos/componentes e quando usar cada um.

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Nome do Framework", "steps": ["passo 1", "passo 2"], "when_to_use": "situacoes de uso", "evidence": ["trecho 1"], "confidence": 0.8}]}

Minimo 1, maximo 6 items. Se nao houver frameworks claros, retorne {"items": []}.`,
  },
  {
    layer: 'methodologies',
    label: 'Metodologias',
    prompt: (name) => `Quais processos passo-a-passo ${name} segue para resolver problemas ou executar tarefas? (rotinas, processos, sistemas recorrentes)

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Nome do processo", "steps": ["passo 1", "passo 2"], "description": "Quando e como usar", "evidence": ["trecho 1"], "confidence": 0.7}]}

Minimo 1, maximo 6 items.`,
  },
  {
    layer: 'dilemmas',
    label: 'Dilemas',
    prompt: (name) => `Quais trade-offs, tensoes e dilemas ${name} enfrenta ou discute recorrentemente? (escolhas dificeis, paradoxos, tensoes entre valores opostos)

Retorne APENAS JSON valido no formato:
{"items": [{"title": "Nome do dilema", "description": "Contexto do trade-off", "tension": ["lado A", "lado B"], "evidence": ["trecho 1"], "confidence": 0.65}]}

Minimo 1, maximo 5 items. Se nao houver dilemas claros, retorne {"items": []}.`,
  },
];

// ============================================================
// CLI
// ============================================================
const { values: args } = parseArgs({
  options: {
    'entity-id':    { type: 'string' },
    all:            { type: 'boolean', default: false },
    'min-mentions': { type: 'string', default: String(MIN_MENTION_COUNT) },
    layer:          { type: 'string' }, // processar apenas uma camada especifica
    help:           { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (args.help || (!args['entity-id'] && !args.all)) {
  console.log(`
Uso:
  node scripts/mega-brain-extract-dna.mjs --entity-id UUID
  node scripts/mega-brain-extract-dna.mjs --all

Opcoes:
  --entity-id UUID      Processar apenas esta entidade
  --all                 Processar todas pessoas com mention_count >= N
  --min-mentions N      Minimo de mencoes (default: ${MIN_MENTION_COUNT})
  --layer NOME          Processar apenas esta camada de DNA
  --help, -h            Exibir ajuda

Camadas disponíveis: ${DNA_LAYERS.map(l => l.layer).join(', ')}
`);
  process.exit(0);
}

const minMentions = parseInt(args['min-mentions'] || String(MIN_MENTION_COUNT), 10);
const targetLayer = args.layer;

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

async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API -> ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{"items":[]}';

  try {
    return JSON.parse(content);
  } catch {
    return { items: [] };
  }
}

async function upsertDnaLayer(entityId, layer, content) {
  const avgConfidence = content.items?.length > 0
    ? content.items.reduce((acc, item) => acc + (item.confidence || 0.5), 0) / content.items.length
    : 0;

  // Verificar se ja existe
  const existing = await supaFetch(
    `expert_dna?entity_id=eq.${entityId}&layer=eq.${layer}&select=id,content`
  );

  if (existing && existing.length > 0) {
    // Merge: combinar items existentes com novos (sem duplicar por title)
    const existingItems = existing[0].content?.items || [];
    const newItems = content.items || [];
    const mergedItems = [...existingItems];

    for (const newItem of newItems) {
      const isDuplicate = existingItems.some(ei =>
        ei.title?.toLowerCase() === newItem.title?.toLowerCase()
      );
      if (!isDuplicate) {
        mergedItems.push(newItem);
      }
    }

    await supaFetch(`expert_dna?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        content: { ...content, items: mergedItems },
        confidence_avg: avgConfidence,
        updated_at: new Date().toISOString(),
      }),
    });

    return { action: 'merged', itemCount: mergedItems.length };
  } else {
    await supaFetch('expert_dna', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        entity_id: entityId,
        layer,
        content,
        confidence_avg: avgConfidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    return { action: 'created', itemCount: content.items?.length || 0 };
  }
}

async function processEntityDna(entityId) {
  // Buscar entidade
  const entities = await supaFetch(`knowledge_entities?id=eq.${entityId}&select=*`);
  if (!entities || entities.length === 0) {
    throw new Error(`Entidade ${entityId} nao encontrada`);
  }
  const entity = entities[0];
  console.log(`  Entidade: ${entity.canonical_name} (${entity.entity_type})`);

  // Buscar todos os chunks onde entidade e mencionada via entity_mentions
  let chunks = [];
  try {
    const mentions = await supaFetch(
      `entity_mentions?entity_id=eq.${entityId}&select=chunk_id&limit=200`
    );
    const chunkIds = [...new Set((mentions || []).map(m => m.chunk_id).filter(Boolean))];

    if (chunkIds.length > 0) {
      const chunkIdList = chunkIds.slice(0, 100).map(id => `"${id}"`).join(',');
      chunks = await supaFetch(
        `knowledge_chunks?id=in.(${chunkIdList})&select=id,content&limit=100`
      );
    }
  } catch (_) {
    console.warn('  [warn] entity_mentions nao disponivel, buscando chunks por entity_id...');
  }

  // Fallback: buscar chunks diretamente se disponivel
  if (!chunks || chunks.length === 0) {
    try {
      chunks = await supaFetch(
        `knowledge_chunks?select=id,content&limit=100&order=created_at.asc`
      );
    } catch (_) {
      console.warn('  [warn] Nao foi possivel buscar chunks');
    }
  }

  if (!chunks || chunks.length === 0) {
    console.log('  Sem chunks para processar DNA');
    return;
  }

  const contextText = chunks
    .map(c => c.content)
    .join('\n\n---\n\n')
    .slice(0, MAX_CONTEXT_CHARS);

  console.log(`  ${chunks.length} chunks de contexto (${contextText.length} chars)`);

  // Processar cada camada
  const layersToProcess = targetLayer
    ? DNA_LAYERS.filter(l => l.layer === targetLayer)
    : DNA_LAYERS;

  if (layersToProcess.length === 0) {
    throw new Error(`Camada "${targetLayer}" nao encontrada. Opcoes: ${DNA_LAYERS.map(l => l.layer).join(', ')}`);
  }

  for (const dnaLayer of layersToProcess) {
    console.log(`  Extraindo: ${dnaLayer.label}...`);

    const systemPrompt = `Voce e um analista especializado em extrair padroes de pensamento de experts. Analise os textos fornecidos sobre "${entity.canonical_name}" e extraia informacoes estruturadas. Retorne APENAS JSON valido, sem markdown.`;

    const userPrompt = `${dnaLayer.prompt(entity.canonical_name)}

TEXTOS SOBRE ${entity.canonical_name.toUpperCase()}:
${contextText}`;

    let dnaContent = { items: [] };
    try {
      dnaContent = await callOpenAI(systemPrompt, userPrompt);
    } catch (err) {
      console.error(`    [erro] LLM falhou para camada ${dnaLayer.layer}: ${err.message}`);
      await sleep(LLM_SLEEP_MS * 2);
      continue;
    }

    if (!dnaContent.items) dnaContent = { items: [] };

    try {
      const result = await upsertDnaLayer(entityId, dnaLayer.layer, dnaContent);
      console.log(`    ${result.action}: ${result.itemCount} items`);
    } catch (err) {
      console.error(`    [erro] Falha ao salvar camada ${dnaLayer.layer}: ${err.message}`);
    }

    await sleep(LLM_SLEEP_MS);
  }

  console.log(`  DNA extraido com sucesso`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Mega Brain: Extract DNA ===');

  if (args['entity-id']) {
    await processEntityDna(args['entity-id']);
  } else if (args.all) {
    // Buscar persons com mention_count suficiente
    const entities = await supaFetch(
      `knowledge_entities?entity_type=eq.person&mention_count=gte.${minMentions}&select=id,canonical_name,mention_count&order=mention_count.desc`
    );

    if (!entities || entities.length === 0) {
      console.log(`Nenhuma pessoa com >= ${minMentions} mencoes encontrada.`);
      return;
    }

    console.log(`${entities.length} experts para processar`);

    for (const entity of entities) {
      console.log(`\n[${entities.indexOf(entity) + 1}/${entities.length}] ${entity.canonical_name} (${entity.mention_count} mencoes)`);
      try {
        await processEntityDna(entity.id);
      } catch (err) {
        console.error(`  [erro]: ${err.message}`);
      }
      await sleep(LLM_SLEEP_MS * 2);
    }
  }

  console.log('\nConcluido!');
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
