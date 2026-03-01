#!/usr/bin/env node
/**
 * Mega Brain Auto Agent — Gera agentes CRITICS automaticamente a partir de DNA extraído
 * Cria system_prompt no formato CRITICS usando DNA (6 camadas) + dossiê da entidade
 *
 * Usage:
 *   node scripts/mega-brain-auto-agent.mjs --entity-id UUID
 *   node scripts/mega-brain-auto-agent.mjs --auto
 */

import { parseArgs } from 'node:util';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: Variaveis de ambiente obrigatorias: SUPABASE_URL, SUPABASE_KEY');
  process.exit(1);
}

const MIN_MENTION_THRESHOLD = 5;

// ─── Args parsing ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'entity-id': { type: 'string' },
    auto:        { type: 'boolean', default: false },
    threshold:   { type: 'string', default: String(MIN_MENTION_THRESHOLD) },
    help:        { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || (!args['entity-id'] && !args.auto)) {
  console.log(`
Mega Brain Auto Agent — Geração automática de agentes CRITICS a partir de DNA

Uso:
  node scripts/mega-brain-auto-agent.mjs --entity-id UUID
  node scripts/mega-brain-auto-agent.mjs --auto

Opções:
  --entity-id UUID   Gerar agente para esta entidade específica
  --auto             Gerar para todas as entidades elegíveis sem auto_agents
  --threshold N      Mention count mínimo (default: ${MIN_MENTION_THRESHOLD})
  --help             Mostrar esta ajuda
`);
  process.exit(0);
}

const mentionThreshold = parseInt(args.threshold, 10) || MIN_MENTION_THRESHOLD;

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

// ─── Busca de dados ───────────────────────────────────────────────────────────

async function getEntityIds() {
  if (args['entity-id']) {
    return [args['entity-id']];
  }

  // Entidades com mention_count suficiente sem auto_agents
  const entities = await sbGet(
    `knowledge_entities?mention_count=gte.${mentionThreshold}&entity_type=eq.person&select=id&order=mention_count.desc`
  );
  const allIds = entities.map(e => e.id);

  if (allIds.length === 0) return [];

  // Filtrar as que já têm auto_agents
  const existing = await sbGet(
    `auto_agents?entity_id=in.(${allIds.join(',')})&select=entity_id`
  );
  const existingIds = new Set(existing.map(a => a.entity_id));

  return allIds.filter(id => !existingIds.has(id));
}

async function getEntityFullData(entityId) {
  const [entity] = await sbGet(
    `knowledge_entities?id=eq.${entityId}&select=id,name,entity_type,mention_count,dossier_text`
  );
  if (!entity) throw new Error(`Entidade ${entityId} não encontrada`);

  // Buscar DNA (todas as camadas)
  const dnaLayers = await sbGet(
    `expert_dna?entity_id=eq.${entityId}&select=layer,items&order=layer.asc`
  );

  const dna = {};
  for (const layer of dnaLayers) {
    dna[layer.layer] = layer.items || [];
  }

  return { entity, dna };
}

// ─── Geração do system_prompt CRITICS ─────────────────────────────────────────

function formatDnaItems(items) {
  if (!items || items.length === 0) return 'Nenhum dado disponível.';
  return items
    .slice(0, 5)
    .map((item, i) => {
      let text = `${i + 1}. **${item.title}**: ${item.description}`;
      if (item.evidence && item.evidence.length > 0) {
        text += `\n   _Evidência: "${item.evidence[0]}"_`;
      }
      return text;
    })
    .join('\n');
}

function generateCriticsPrompt(entity, dna) {
  const name = entity.name;
  const dossier = entity.dossier_text || 'Informações baseadas em análise de menções coletadas.';

  const philosophy = formatDnaItems(dna.philosophy);
  const mentalModels = formatDnaItems(dna.mental_models);
  const heuristics = formatDnaItems(dna.heuristics);
  const frameworks = formatDnaItems(dna.frameworks);
  const methodologies = formatDnaItems(dna.methodologies);
  const dilemmas = formatDnaItems(dna.dilemmas);

  return `# ${name} vAuto.1.0 — Expert Clone

## C — Constraints
Você é um clone intelectual de ${name}. Responda APENAS com base no DNA extraído de suas obras, entrevistas e conteúdos documentados. Quando não tiver evidência, sinalize claramente: "[Extrapolação — não baseado em fonte direta]".

Não invente citações. Não atribua ideias que não foram documentadas. Mantenha o tom e o estilo de ${name}.

## R — Role
${dossier.split('\n').slice(0, 8).join('\n')}

## I — Inputs

### Filosofia e Visão de Mundo
${philosophy}

### Modelos Mentais
${mentalModels}

## T — Tools
- Busca semântica no knowledge base de ${name}
- Citação de fontes quando possível
- Aplicação de frameworks e heurísticas documentadas
- Flag explícita quando estiver extrapolando vs. baseado em evidência

## I — Instructions
1. Antes de responder, consulte o DNA disponível (filosofia, modelos mentais, heurísticas)
2. Aplique os frameworks e metodologias de ${name} quando relevante
3. Cite a fonte ou contexto quando possível ("Em [obra/entrevista], ${name} afirmou...")
4. Se a pergunta estiver fora do escopo documentado, responda: "Não tenho evidência direta de ${name} sobre isso. Com base no padrão geral de pensamento..."
5. Mantenha coerência com a visão de mundo e valores documentados

### Heurísticas de ${name}
${heuristics}

### Frameworks e Metodologias
${frameworks}
${methodologies}

## C — Conclusions

### Dilemas e Trade-offs Recorrentes
${dilemmas}

Ao encerrar uma conversa, ofereça um próximo passo concreto baseado no estilo de ${name}.

## S — Solutions (Exemplos de Raciocínio)
Quando perguntado sobre [problema de negócio], ${name} tipicamente:
1. Começa pelo primeiro princípio
2. Aplica seus modelos mentais documentados
3. Oferece uma perspectiva prática baseada em evidências
4. Desafia premissas quando necessário

_Clone gerado automaticamente pelo Mega Brain em ${new Date().toISOString().split('T')[0]}. Aprovação manual requerida antes de ativar._`;
}

// ─── Processamento principal ───────────────────────────────────────────────────

async function processEntity(entityId, index, total) {
  const { entity, dna } = await getEntityFullData(entityId);

  const layerCount = Object.keys(dna).length;

  console.log(`\n[${index}/${total}] ${entity.name}`);
  console.log(`  Menções: ${entity.mention_count} | Camadas DNA: ${layerCount}/6`);

  if (layerCount === 0) {
    console.log(`  Sem DNA extraído — execute mega-brain-extract-dna.mjs primeiro`);
    return false;
  }

  const systemPrompt = generateCriticsPrompt(entity, dna);
  const agentName = `${entity.name} Clone Auto`;
  const version = 'vAuto.1.0';

  // INSERT auto_agents
  try {
    const rows = await sbPost('auto_agents', {
      entity_id: entityId,
      agent_name: agentName,
      version,
      system_prompt: systemPrompt,
      is_active: false,
      source_entity_name: entity.name,
      dna_layers_count: layerCount,
      mention_count: entity.mention_count,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        generated_by: 'mega-brain-auto-agent',
        requires_approval: true,
        dna_layers: Object.keys(dna),
      },
    });

    const agentId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
    console.log(`  Agente criado: ${agentId || 'OK'} (is_active=false, aguardando aprovação)`);
    return true;
  } catch (err) {
    // Pode já existir um auto_agent para esta entidade
    if (err.message.includes('duplicate') || err.message.includes('unique')) {
      console.log(`  Agente já existe para esta entidade — pulando`);
      return false;
    }
    throw err;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('MEGA BRAIN AUTO AGENT');
  console.log('='.repeat(60));
  console.log(`Threshold: mention_count >= ${mentionThreshold}`);

  const entityIds = await getEntityIds();

  if (entityIds.length === 0) {
    console.log('Nenhuma entidade elegível sem auto_agent.');
    process.exit(0);
  }

  console.log(`Entidades elegíveis: ${entityIds.length}`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < entityIds.length; i++) {
    try {
      const ok = await processEntity(entityIds[i], i + 1, entityIds.length);
      if (ok) success++;
      else skipped++;
    } catch (err) {
      console.error(`\n[ERRO] Entidade ${entityIds[i]}: ${err.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('AGENTES GERADOS');
  console.log('='.repeat(60));
  console.log(`Total:    ${entityIds.length}`);
  console.log(`Criados:  ${success} (is_active=false)`);
  console.log(`Pulados:  ${skipped}`);
  console.log(`Erros:    ${errors}`);
  console.log('\nATENÇÃO: Agentes criados com is_active=false.');
  console.log('Revise e ative manualmente via Supabase ou AI Factory.');
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
