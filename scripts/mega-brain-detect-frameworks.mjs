#!/usr/bin/env node
// mega-brain-detect-frameworks.mjs
// Detecta frameworks e metodologias mencionados em chunks
// Uso: node scripts/mega-brain-detect-frameworks.mjs --source-id UUID
// Ou:  node scripts/mega-brain-detect-frameworks.mjs --all

import { parseArgs } from 'node:util';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.MEGA_BRAIN_GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const { values } = parseArgs({
  options: {
    'source-id': { type: 'string' },
    'all': { type: 'boolean', default: false }
  }
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`GET error: ${res.status}`);
  return res.json();
}

async function supabasePost(path, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes('duplicate') || text.includes('23505')) return null;
    throw new Error(`POST error: ${res.status} ${text}`);
  }
  return res.json();
}

async function supabaseRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers, body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  return res.json();
}

async function detectFrameworks(text) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Identifique TODOS os frameworks, metodologias ou processos estruturados mencionados neste texto.
Retorne APENAS JSON array (sem markdown): [{"name": "...", "steps": ["passo1", "passo2"], "when_to_use": "...", "example": "...", "source_person": "quem criou/mencionou", "source_context": "contexto onde foi mencionado"}]
Se nao houver frameworks, retorne [].

Texto:
${text.slice(0, 4000)}`
        }]
      }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    })
  });

  if (!res.ok) return [];
  const data = await res.json();
  try {
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
  } catch {
    return [];
  }
}

async function main() {
  console.log('=== Mega Brain Framework Detector ===\n');

  let chunks;
  if (values['source-id']) {
    chunks = await supabaseGet(`knowledge_chunks?source_id=eq.${values['source-id']}&select=id,content,source_id&order=chunk_index`);
  } else if (values.all) {
    chunks = await supabaseGet('knowledge_chunks?select=id,content,source_id&order=created_at&limit=500');
  } else {
    console.error('Uso: --source-id UUID ou --all');
    process.exit(1);
  }

  console.log(`${chunks.length} chunks para analisar\n`);
  let totalFrameworks = 0;

  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    console.log(`[${i + 1}-${Math.min(i + BATCH, chunks.length)}/${chunks.length}] Processando...`);

    for (const chunk of batch) {
      const frameworks = await detectFrameworks(chunk.content);

      for (const fw of frameworks) {
        if (!fw.name || fw.name.length < 3) continue;

        // Verificar se ja existe como entidade
        const existing = await supabaseRpc('find_entity_fuzzy', {
          search_name: fw.name,
          similarity_threshold: 0.6
        });

        let entityId;
        if (existing.length > 0 && existing[0].entity_type === 'framework') {
          entityId = existing[0].id;
          console.log(`  Framework existente: ${fw.name} → ${existing[0].canonical_name}`);
        } else if (existing.length === 0) {
          const created = await supabasePost('knowledge_entities', {
            canonical_name: fw.name,
            entity_type: 'framework',
            description: fw.when_to_use || '',
            metadata: { steps: fw.steps, source_person: fw.source_person, example: fw.example },
            mention_count: 1
          });
          if (created) {
            entityId = created[0].id;
            console.log(`  Novo framework: ${fw.name}`);
            totalFrameworks++;
          }
        }

        if (entityId) {
          // Inserir mention
          await supabasePost('entity_mentions', {
            entity_id: entityId,
            chunk_id: chunk.id,
            source_id: chunk.source_id,
            mention_text: fw.name,
            context_snippet: fw.source_context?.slice(0, 200) || ''
          }).catch(() => {}); // Ignorar duplicatas

          // Inserir/atualizar DNA layer frameworks
          await supabasePost('expert_dna', {
            entity_id: entityId,
            layer: 'frameworks',
            content: { items: [{ title: fw.name, steps: fw.steps, when_to_use: fw.when_to_use, description: fw.example, confidence: 0.8 }] },
            confidence: 0.8,
            extracted_by: 'llm'
          }).catch(() => {}); // Ignorar se ja existe
        }
      }
      await sleep(200);
    }
    await sleep(1000);
  }

  console.log(`\nConcluido! ${totalFrameworks} novos frameworks detectados.`);
}

main().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});
