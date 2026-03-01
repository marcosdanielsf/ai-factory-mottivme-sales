#!/usr/bin/env node
/**
 * Mega Brain Extract DNA — Extrai 6 camadas de DNA de especialistas via GPT-4o-mini
 * philosophy, mental_models, heuristics, frameworks, methodologies, dilemmas
 *
 * Usage:
 *   node scripts/mega-brain-extract-dna.mjs --entity-id UUID
 */

import { parseArgs } from 'node:util';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('ERRO: Variaveis de ambiente obrigatorias: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const MIN_MENTION_COUNT = 5;
const MAX_CONTEXT_CHARS = 6000;

const DNA_LAYERS = {
  philosophy: (name) => `Quais são as crenças fundamentais, valores e visão de mundo de ${name}? O que ele/ela acredita sobre pessoas, negócios, vida e impacto? Seja específico com evidências do texto.`,
  mental_models: (name) => `Quais modelos mentais ${name} usa recorrentemente para tomar decisões e entender o mundo? (ex: Pareto, First Principles, inversão, etc.) Liste os mais relevantes com exemplos.`,
  heuristics: (name) => `Quais regras de bolso e atalhos decisórios ${name} aplica? Que "quando X, então Y" ou "nunca faça Z" ele/ela usa no dia a dia?`,
  frameworks: (name) => `Quais frameworks estruturados ${name} criou ou usa sistematicamente? Para cada um: nome, passos/componentes, quando usar, exemplo de aplicação.`,
  methodologies: (name) => `Quais processos passo-a-passo ${name} segue para atingir resultados? Descreva os processos mais relevantes com etapas claras.`,
  dilemmas: (name) => `Quais trade-offs e tensões ${name} enfrenta recorrentemente? Quais dilemas ele/ela resolve de forma particular? Quais decisões difíceis são recorrentes?`,
};

// ─── Args parsing ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'entity-id': { type: 'string' },
    help:        { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || !args['entity-id']) {
  console.log(`
Mega Brain Extract DNA — Extração de 6 camadas de DNA de especialistas

Uso:
  node scripts/mega-brain-extract-dna.mjs --entity-id UUID

Opções:
  --entity-id UUID  UUID da entidade (pessoa com mention_count >= ${MIN_MENTION_COUNT})
  --help            Mostrar esta ajuda

Camadas DNA extraídas:
  philosophy     → Crenças fundamentais e visão de mundo
  mental_models  → Modelos mentais utilizados
  heuristics     → Regras de bolso e atalhos decisórios
  frameworks     → Frameworks estruturados criados ou utilizados
  methodologies  → Processos passo-a-passo
  dilemmas       → Trade-offs e tensões recorrentes
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

// ─── OpenAI GPT-4o-mini ───────────────────────────────────────────────────────

async function extractDnaLayer(personName, layerKey, layerPrompt, context) {
  const prompt = `${layerPrompt}

Baseado EXCLUSIVAMENTE no seguinte contexto sobre ${personName}:
${context}

Retorne um JSON object com a chave "items" contendo um array de objetos. Cada objeto DEVE ter: "title" (string curta), "description" (string detalhada), "evidence" (array de trechos do texto), "confidence" (float 0.0 a 1.0).

Formato OBRIGATORIO:
{"items": [{"title": "Nome do item", "description": "Descrição detalhada com contexto", "evidence": ["trecho relevante do texto original"], "confidence": 0.8}]}

Se não houver evidências suficientes: {"items": []}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '[]';

  try {
    // Pode retornar {items: [...]} ou [...] diretamente
    const parsed = JSON.parse(text);
    let rawItems;
    if (Array.isArray(parsed)) rawItems = parsed;
    else if (parsed.items && Array.isArray(parsed.items)) rawItems = parsed.items;
    else {
      const firstArray = Object.values(parsed).find(v => Array.isArray(v));
      rawItems = firstArray || [];
    }
    // Normalizar: se string, converter em objeto estruturado
    return rawItems.map(item => {
      if (typeof item === 'string') {
        return { title: item.slice(0, 80), description: item, evidence: [], confidence: 0.5 };
      }
      return item;
    });
  } catch {
    return [];
  }
}

// ─── Upsert DNA layer ──────────────────────────────────────────────────────────

async function upsertDnaLayer(entityId, layer, items) {
  // Tentar UPSERT via POST com ON CONFLICT
  try {
    const avgConfidence = items.length > 0
      ? items.reduce((sum, i) => sum + (i.confidence || 0.5), 0) / items.length
      : 0;
    await sbPost('expert_dna', {
      entity_id: entityId,
      layer,
      content: items,
      confidence: Math.round(avgConfidence * 100) / 100,
    }, 'return=minimal');
  } catch (err) {
    // Se já existe (unique constraint), fazer PATCH
    if (err.message.includes('duplicate') || err.message.includes('unique') || err.message.includes('23505')) {
      await sbPatch(`expert_dna?entity_id=eq.${entityId}&layer=eq.${layer}`, {
        content: items,
        updated_at: new Date().toISOString(),
      });
    } else {
      throw err;
    }
  }
}

// ─── Busca de contexto ────────────────────────────────────────────────────────

async function getEntityContext(entityId) {
  const [entity] = await sbGet(
    `knowledge_entities?id=eq.${entityId}&select=id,canonical_name,entity_type,mention_count,dossier_text`
  );

  if (!entity) throw new Error(`Entidade ${entityId} não encontrada`);

  if (entity.entity_type !== 'person') {
    throw new Error(`Entidade ${entity.canonical_name} não é uma pessoa (tipo: ${entity.entity_type}). DNA só é extraído de pessoas.`);
  }

  if ((entity.mention_count || 0) < MIN_MENTION_COUNT) {
    throw new Error(`Entidade ${entity.canonical_name} tem apenas ${entity.mention_count} menções (mínimo: ${MIN_MENTION_COUNT})`);
  }

  // Usar dossiê se disponível, senão buscar chunks
  let context = entity.dossier_text || '';

  if (!context || context.length < 200) {
    // Buscar chunks via entity_mentions
    const mentions = await sbGet(
      `entity_mentions?entity_id=eq.${entityId}&select=knowledge_chunks(content)&limit=50`
    );
    const chunks = mentions
      .map(m => m.knowledge_chunks?.content)
      .filter(Boolean)
      .join('\n\n---\n\n');
    context = chunks;
  }

  if (context.length > MAX_CONTEXT_CHARS) {
    context = context.slice(0, MAX_CONTEXT_CHARS) + '\n\n[... truncado ...]';
  }

  return { entity, context };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const entityId = args['entity-id'];

  console.log('='.repeat(60));
  console.log('MEGA BRAIN EXTRACT DNA');
  console.log('='.repeat(60));
  console.log(`Entity ID: ${entityId}`);

  const { entity, context } = await getEntityContext(entityId);

  console.log(`\nEntidade: ${entity.canonical_name} (${entity.entity_type})`);
  console.log(`Menções:  ${entity.mention_count}`);
  console.log(`Contexto: ${context.length} chars`);
  console.log(`\nExtraindo 6 camadas DNA...`);

  const results = {};
  let layerIndex = 0;

  for (const [layerKey, promptFn] of Object.entries(DNA_LAYERS)) {
    layerIndex++;
    process.stdout.write(`\r[${layerIndex}/6] Extraindo: ${layerKey}...                    `);

    try {
      const items = await extractDnaLayer(
        entity.canonical_name,
        layerKey,
        promptFn(entity.canonical_name),
        context
      );

      await upsertDnaLayer(entityId, layerKey, items);
      results[layerKey] = items.length;

      process.stdout.write(`\r[${layerIndex}/6] ${layerKey}: ${items.length} itens extraídos          \n`);
    } catch (err) {
      console.error(`\n[ERRO] Camada ${layerKey}: ${err.message}`);
      results[layerKey] = 0;
    }

    // Rate limit entre camadas
    if (layerIndex < 6) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Marcar entidade como tendo DNA extraído
  try {
    await sbPatch(`knowledge_entities?id=eq.${entityId}`, {
      last_seen_at: new Date().toISOString(),
    });
  } catch {
    // Campo pode não existir — ignorar
  }

  console.log('\n' + '='.repeat(60));
  console.log('DNA EXTRAÍDO');
  console.log('='.repeat(60));
  console.log(`Entidade: ${entity.canonical_name}`);
  for (const [layer, count] of Object.entries(results)) {
    console.log(`  ${layer.padEnd(16)}: ${count} itens`);
  }
  const total = Object.values(results).reduce((a, b) => a + b, 0);
  console.log(`Total: ${total} itens em 6 camadas`);
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
