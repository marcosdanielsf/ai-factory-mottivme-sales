#!/usr/bin/env node
/**
 * mega-brain-auto-agent.mjs
 * Auto-cria agentes clones de experts a partir do DNA extraido.
 *
 * Uso:
 *   node scripts/mega-brain-auto-agent.mjs --entity-id UUID
 *   node scripts/mega-brain-auto-agent.mjs --all
 */

import { parseArgs } from 'node:util';

// ============================================================
// CONFIG — env vars (setar antes de rodar)
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.MEGA_BRAIN_OPENAI_KEY;

// GHL para notificacao
const GHL_PIT = process.env.GHL_PIT || process.env.MEGA_BRAIN_GHL_PIT;
const MARCOS_CONTACT_ID = process.env.GHL_MARCOS_CONTACT_ID || 'cZ7R2cMAc0RZInNFDHy7';

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const MIN_MENTION_COUNT = 5;
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
    'entity-id':    { type: 'string' },
    all:            { type: 'boolean', default: false },
    'min-mentions': { type: 'string', default: String(MIN_MENTION_COUNT) },
    notify:         { type: 'boolean', default: true },
    help:           { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (args.help || (!args['entity-id'] && !args.all)) {
  console.log(`
Uso:
  node scripts/mega-brain-auto-agent.mjs --entity-id UUID
  node scripts/mega-brain-auto-agent.mjs --all

Opcoes:
  --entity-id UUID    Criar agente para esta entidade especifica
  --all               Processar todas persons sem auto_agent
  --min-mentions N    Minimo de mencoes (default: ${MIN_MENTION_COUNT})
  --no-notify         Nao enviar notificacao WhatsApp
  --help, -h          Exibir ajuda
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

function buildSystemPromptFromDna(entity, dnaByLayer, dossierText) {
  const name = entity.canonical_name;

  // Extrair itens de cada camada
  const philosophy = dnaByLayer.philosophy?.content?.items || [];
  const mentalModels = dnaByLayer.mental_models?.content?.items || [];
  const heuristics = dnaByLayer.heuristics?.content?.items || [];
  const frameworks = dnaByLayer.frameworks?.content?.items || [];
  const methodologies = dnaByLayer.methodologies?.content?.items || [];
  const dilemmas = dnaByLayer.dilemmas?.content?.items || [];

  const formatItems = (items) => items
    .slice(0, 5)
    .map(item => `- **${item.title}**: ${item.description || ''}`)
    .join('\n');

  const formatFrameworks = (items) => items
    .slice(0, 3)
    .map(item => `- **${item.title}**: ${item.steps ? item.steps.slice(0, 3).join(' → ') : item.description || ''}`)
    .join('\n');

  const formatDilemmas = (items) => items
    .slice(0, 3)
    .map(item => `- **${item.title}**: ${item.tension ? item.tension.join(' vs ') : item.description || ''}`)
    .join('\n');

  const dossieSummary = dossierText
    ? dossierText.split('\n').slice(0, 15).join('\n')
    : `Expert em sua area com ${entity.mention_count} mencoes no knowledge base.`;

  return `# ${name} vAuto.1.0 — Expert Clone

## C — Constraints
Voce e um clone intelectual de **${name}**, construido a partir da analise profunda de suas obras, entrevistas e ensinamentos. Responda APENAS com base no DNA extraido e no conhecimento documentado. Quando incerto, declare explicitamente: "Com base no que conheço sobre ${name}...". NUNCA invente citacoes ou posicoes nao documentadas.

## R — Role
${dossieSummary}

Voce representa o pensamento, os valores e a perspectiva de ${name}. Fale na primeira pessoa quando responder como ${name}, mas deixe claro que e uma representacao baseada em analise de conteudo.

## I — Inputs
**Filosofia central:**
${philosophy.length > 0 ? formatItems(philosophy) : '- Baseada no dossie e mencoes disponíveis'}

**Modelos mentais preferidos:**
${mentalModels.length > 0 ? formatItems(mentalModels) : '- A ser descoberto a partir das mencoes'}

## T — Tools
- Busca semantica no knowledge base de ${name} (use quando precisar de informacao especifica)
- Citacao direta de fontes documentadas
- Aplicacao dos frameworks e metodologias de ${name}
- Sinalizacao de incerteza quando extrapolar além do documentado

## I — Instructions
1. Ao receber uma pergunta, primeiro identifique qual framework ou modelo mental de ${name} seria mais relevante
2. Responda como ${name} responderia, baseado nos padroes documentados
3. Cite a fonte quando possivel (obra, entrevista, contexto onde este pensamento aparece)
4. Se a pergunta estiver fora do escopo documentado, diga claramente e ofeca a perspectiva mais proximo que o DNA permite inferir
5. Aplique as heuristicas de ${name} nas recomendacoes praticas

**Heuristicas de ${name}:**
${heuristics.length > 0 ? formatItems(heuristics) : '- Ver dossie para heuristicas documentadas'}

**Frameworks:**
${frameworks.length > 0 ? formatFrameworks(frameworks) : '- Ver dossie para frameworks documentados'}

## C — Conclusions
Encerre cada resposta com uma reflexao no estilo de ${name} ou com a tensao principal que a resposta evoca.

**Dilemas recorrentes de ${name}:**
${dilemmas.length > 0 ? formatDilemmas(dilemmas) : '- Ver dossie para dilemas documentados'}

## S — Solutions
**Metodologias de ${name}:**
${methodologies.length > 0 ? formatItems(methodologies) : '- Ver dossie para metodologias documentadas'}

---
*Este agente foi auto-gerado pelo sistema Mega Brain em ${new Date().toISOString().split('T')[0]} a partir de ${entity.mention_count} mencoes em fontes curadas.*
*Aprovacao humana necessaria antes de uso em producao.*`;
}

async function sendWhatsAppNotification(entityName, mentionCount, entityId) {
  if (!args.notify) return;

  try {
    const message = `Novo agente auto-criado no Mega Brain!\n\nExpert: ${entityName}\nMencoes: ${mentionCount}\nTipo: Clone Intelectual (vAuto.1.0)\n\nAprovar em: factorai.mottivme.com.br/#/brain/dna`;

    const res = await fetch('https://services.leadconnectorhq.com/conversations/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_PIT}`,
        'Version': '2021-04-15',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'SMS',
        contactId: MARCOS_CONTACT_ID,
        message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`  [warn] Notificacao WhatsApp falhou: ${res.status}: ${body}`);
    } else {
      console.log('  Notificacao WhatsApp enviada');
    }
  } catch (err) {
    console.warn(`  [warn] Erro ao enviar notificacao: ${err.message}`);
  }
}

async function createAutoAgent(entityId) {
  // Buscar entidade
  const entities = await supaFetch(`knowledge_entities?id=eq.${entityId}&select=*`);
  if (!entities || entities.length === 0) {
    throw new Error(`Entidade ${entityId} nao encontrada`);
  }
  const entity = entities[0];

  if (entity.entity_type !== 'person') {
    throw new Error(`Entidade ${entity.canonical_name} nao e uma pessoa (tipo: ${entity.entity_type})`);
  }

  console.log(`  Entidade: ${entity.canonical_name} (${entity.mention_count} mencoes)`);

  // Verificar se ja tem auto_agent
  let existingAgents = [];
  try {
    existingAgents = await supaFetch(
      `auto_agents?entity_id=eq.${entityId}&select=id,agent_name`
    );
  } catch (_) {
    // Tabela pode nao existir
  }

  if (existingAgents && existingAgents.length > 0) {
    console.log(`  Agente ja existe: ${existingAgents[0].agent_name} (${existingAgents[0].id})`);
    return null;
  }

  // Buscar DNA de todas as camadas
  let dnaRows = [];
  try {
    dnaRows = await supaFetch(
      `expert_dna?entity_id=eq.${entityId}&select=layer,content,confidence_avg`
    );
  } catch (_) {
    console.warn('  [warn] expert_dna nao disponivel');
  }

  const dnaByLayer = {};
  for (const row of (dnaRows || [])) {
    dnaByLayer[row.layer] = row;
  }

  console.log(`  DNA disponivel: ${Object.keys(dnaByLayer).join(', ') || 'nenhum'}`);

  // Usar dossier se disponivel
  const dossierText = entity.dossier_text || null;

  // Gerar system_prompt
  const systemPrompt = buildSystemPromptFromDna(entity, dnaByLayer, dossierText);

  // Calcular confidence media geral
  const avgConfidence = dnaRows && dnaRows.length > 0
    ? dnaRows.reduce((acc, r) => acc + (r.confidence_avg || 0), 0) / dnaRows.length
    : 0.5;

  // Inserir auto_agent
  let newAgent = null;
  try {
    const created = await supaFetch('auto_agents', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        entity_id: entityId,
        agent_name: `${entity.canonical_name} Clone`,
        system_prompt: systemPrompt,
        is_active: false,
        creation_trigger: 'threshold_mentions',
        confidence_score: avgConfidence,
        dna_layers_count: Object.keys(dnaByLayer).length,
        version: 'vAuto.1.0',
        metadata: {
          mention_count: entity.mention_count,
          entity_type: entity.entity_type,
          dna_layers: Object.keys(dnaByLayer),
          auto_generated_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    newAgent = created?.[0];
  } catch (err) {
    // Fallback: tentar salvar em agent_versions se auto_agents nao existir
    console.warn(`  [warn] auto_agents falhou, tentando agent_versions: ${err.message}`);

    try {
      const created = await supaFetch('agent_versions', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          agent_name: `${entity.canonical_name} Clone`,
          version: 'vAuto.1.0',
          system_prompt: systemPrompt,
          is_active: false,
          status: 'draft',
          metadata: {
            auto_generated: true,
            entity_id: entityId,
            mention_count: entity.mention_count,
            creation_trigger: 'mega_brain_threshold',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      newAgent = created?.[0];
    } catch (err2) {
      throw new Error(`Falha ao criar agente: ${err2.message}`);
    }
  }

  console.log(`  Agente criado: ${newAgent?.id || 'ID desconhecido'}`);

  // Notificacao WhatsApp
  await sendWhatsAppNotification(entity.canonical_name, entity.mention_count, entityId);

  return newAgent;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Mega Brain: Auto Agent Creator ===');

  if (args['entity-id']) {
    await createAutoAgent(args['entity-id']);
  } else if (args.all) {
    // Buscar persons com mention_count suficiente
    const entities = await supaFetch(
      `knowledge_entities?entity_type=eq.person&mention_count=gte.${minMentions}&select=id,canonical_name,mention_count&order=mention_count.desc`
    );

    if (!entities || entities.length === 0) {
      console.log(`Nenhuma pessoa com >= ${minMentions} mencoes encontrada.`);
      return;
    }

    // Filtrar entidades sem auto_agent
    const withAgents = new Set();
    try {
      const agents = await supaFetch(`auto_agents?select=entity_id`);
      for (const a of (agents || [])) {
        withAgents.add(a.entity_id);
      }
    } catch (_) {
      // Tabela pode nao existir
    }

    const pending = entities.filter(e => !withAgents.has(e.id));
    console.log(`${pending.length} experts sem agente (de ${entities.length} total)`);

    if (pending.length === 0) {
      console.log('Todos os experts ja tem agentes criados.');
      return;
    }

    for (const entity of pending) {
      console.log(`\n[${pending.indexOf(entity) + 1}/${pending.length}] ${entity.canonical_name} (${entity.mention_count} mencoes)`);
      try {
        await createAutoAgent(entity.id);
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
