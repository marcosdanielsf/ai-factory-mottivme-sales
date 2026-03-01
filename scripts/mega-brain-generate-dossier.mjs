#!/usr/bin/env node
/**
 * Mega Brain Generate Dossier — Gera dossiê completo de entidades via GPT-4o-mini
 * Busca entity_mentions JOIN knowledge_chunks, sintetiza por entidade
 *
 * Usage:
 *   node scripts/mega-brain-generate-dossier.mjs --entity-id UUID
 *   node scripts/mega-brain-generate-dossier.mjs --all
 */

import { parseArgs } from 'node:util';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bfumywvwubvernvhjehk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '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';

const MIN_MENTION_COUNT = 3;
const MAX_CONTEXT_CHARS = 8000;

// ─── Args parsing ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'entity-id': { type: 'string' },
    all:         { type: 'boolean', default: false },
    help:        { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || (!args['entity-id'] && !args.all)) {
  console.log(`
Mega Brain Generate Dossier — Síntese de dossiê via GPT-4o-mini

Uso:
  node scripts/mega-brain-generate-dossier.mjs --entity-id UUID
  node scripts/mega-brain-generate-dossier.mjs --all

Opções:
  --entity-id UUID  Gerar dossiê para esta entidade específica
  --all             Gerar para todas as entidades com mention_count >= ${MIN_MENTION_COUNT}
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

async function generateDossier(entityName, entityType, mentions, sources) {
  const mentionCount = mentions.length;
  const sourceCount = new Set(mentions.map(m => m.source_id)).size;

  // Compilar contexto agrupado por source
  const bySource = {};
  for (const m of mentions) {
    const sourceTitle = sources[m.source_id] || m.source_id;
    if (!bySource[sourceTitle]) bySource[sourceTitle] = [];
    if (m.content) bySource[sourceTitle].push(m.content);
    else if (m.context_snippet) bySource[sourceTitle].push(m.context_snippet);
  }

  let contextText = '';
  for (const [sourceTitle, texts] of Object.entries(bySource)) {
    contextText += `\n\n### Fonte: ${sourceTitle}\n`;
    contextText += texts.slice(0, 5).join('\n\n---\n\n');
  }

  // Truncar para o limite de contexto
  if (contextText.length > MAX_CONTEXT_CHARS) {
    contextText = contextText.slice(0, MAX_CONTEXT_CHARS) + '\n\n[... conteúdo truncado ...]';
  }

  const prompt = `Sintetize um dossiê completo sobre "${entityName}" (tipo: ${entityType}) baseado nestas ${mentionCount} menções de ${sourceCount} fonte(s).

Formato markdown obrigatório:
## Resumo
[2-3 parágrafos de síntese objetiva]

## Contexto
[Onde e como esta entidade aparece no material analisado]

## Insights Chave
[Lista com os principais insights, ideias ou informações sobre ${entityName}]

## Fontes
[Lista das fontes onde ${entityName} foi mencionado]

Conteúdo das menções:
${contextText}`;

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
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Busca de entidades/menções ────────────────────────────────────────────────

async function getEntityIds() {
  if (args['entity-id']) {
    return [args['entity-id']];
  }

  const entities = await sbGet(
    `knowledge_entities?mention_count=gte.${MIN_MENTION_COUNT}&or=(dossier_text.is.null,dossier_text.eq.)&select=id&order=mention_count.desc`
  );
  return entities.map(e => e.id);
}

async function getEntityWithMentions(entityId) {
  const [entity] = await sbGet(
    `knowledge_entities?id=eq.${entityId}&select=id,name,entity_type,mention_count`
  );
  if (!entity) throw new Error(`Entidade ${entityId} não encontrada`);

  // Buscar menções com conteúdo dos chunks
  const mentions = await sbGet(
    `entity_mentions?entity_id=eq.${entityId}&select=id,chunk_id,source_id,context_snippet,knowledge_chunks(content)&limit=100`
  );

  // Normalizar — chunk content pode vir aninhado
  const normalizedMentions = mentions.map(m => ({
    ...m,
    content: m.knowledge_chunks?.content || null,
    source_id: m.source_id,
  }));

  // Buscar títulos das sources
  const sourceIds = [...new Set(normalizedMentions.map(m => m.source_id).filter(Boolean))];
  const sourcesMap = {};

  if (sourceIds.length > 0) {
    const sourcesFilter = sourceIds.map(id => `id.eq.${id}`).join(',');
    try {
      const sources = await sbGet(
        `knowledge_sources?or=(${sourcesFilter})&select=id,title`
      );
      for (const s of sources) {
        sourcesMap[s.id] = s.title;
      }
    } catch {
      // Ignorar erro de sources — usar IDs
    }
  }

  return { entity, mentions: normalizedMentions, sources: sourcesMap };
}

// ─── Processamento principal ───────────────────────────────────────────────────

async function processEntity(entityId, index, total) {
  const { entity, mentions, sources } = await getEntityWithMentions(entityId);

  if (mentions.length === 0) {
    console.log(`\n[${index}/${total}] ${entity.name} — sem menções, pulando`);
    return false;
  }

  console.log(`\n[${index}/${total}] ${entity.name} (${entity.entity_type}) — ${mentions.length} menções`);

  const dossierText = await generateDossier(
    entity.name,
    entity.entity_type,
    mentions,
    sources
  );

  if (!dossierText) {
    console.warn(`[dossier] Dossiê vazio para ${entity.name}`);
    return false;
  }

  await sbPatch(`knowledge_entities?id=eq.${entityId}`, {
    dossier_text: dossierText,
    dossier_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log(`[dossier] Salvo: ${dossierText.length} chars`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('MEGA BRAIN GENERATE DOSSIER');
  console.log('='.repeat(60));

  const entityIds = await getEntityIds();

  if (entityIds.length === 0) {
    console.log(`Nenhuma entidade com mention_count >= ${MIN_MENTION_COUNT} sem dossiê.`);
    process.exit(0);
  }

  console.log(`Entidades a processar: ${entityIds.length}`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < entityIds.length; i++) {
    try {
      const ok = await processEntity(entityIds[i], i + 1, entityIds.length);
      if (ok) success++;
    } catch (err) {
      console.error(`\n[ERRO] Entidade ${entityIds[i]}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DOSSIÊS GERADOS');
  console.log('='.repeat(60));
  console.log(`Total:    ${entityIds.length}`);
  console.log(`Sucesso:  ${success}`);
  console.log(`Erros:    ${errors}`);
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
