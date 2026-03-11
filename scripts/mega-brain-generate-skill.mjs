#!/usr/bin/env node
// mega-brain-generate-skill.mjs
// Gera skills .md para o Claude Code a partir de frameworks detectados
// Uso: node scripts/mega-brain-generate-skill.mjs --entity-id UUID
// Ou:  node scripts/mega-brain-generate-skill.mjs --all

import { parseArgs } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const { values } = parseArgs({
  options: {
    'entity-id': { type: 'string' },
    'all': { type: 'boolean', default: false }
  }
});

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`GET error: ${res.status}`);
  return res.json();
}

function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateSkillMarkdown(entity, dna) {
  const frameworkDNA = dna.find(d => d.layer === 'frameworks')?.content?.items || [];
  const mainFramework = frameworkDNA[0] || {};

  const steps = mainFramework.steps || [];
  const stepsFormatted = steps.length > 0
    ? steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '1. Analisar contexto\n2. Aplicar framework\n3. Validar resultado';

  const mentions = entity.mention_count || 0;
  const sources = entity.metadata?.source_count || 'N/A';

  return `---
skill: ${toKebabCase(entity.canonical_name)}
version: 1.0.0
description: Framework ${entity.canonical_name} - auto-gerado pelo Mega Brain
auto_generated: true
source_entity: ${entity.id}
approved: false
---

# ${entity.canonical_name}

> Auto-gerado pelo Mega Brain a partir de ${mentions} mencoes em conteudo ingerido.
> **Status:** Pendente aprovacao humana. Mover de \`_auto/\` para \`skills/\` para ativar.

## Quando Usar

${mainFramework.when_to_use || entity.description || `Aplicar quando o contexto exigir o framework ${entity.canonical_name}.`}

## Passos

${stepsFormatted}

## Exemplo

${mainFramework.description || mainFramework.example || 'Sem exemplo documentado. Adicionar manualmente apos aprovacao.'}

## Detalhes do DNA

${frameworkDNA.map(f => `### ${f.title}\n${f.description || ''}\n${f.steps ? '**Passos:** ' + f.steps.join(' → ') : ''}`).join('\n\n') || 'Nenhum detalhe adicional.'}

## Fonte

- **Extraido de:** ${entity.metadata?.source_person || 'Multiplas fontes'}
- **Mencoes:** ${mentions}
- **Confianca:** ${(dna.find(d => d.layer === 'frameworks')?.confidence || 0).toFixed(2)}
- **Entity ID:** \`${entity.id}\`
`;
}

async function main() {
  console.log('=== Mega Brain Skill Generator ===\n');

  const autoDir = join(homedir(), '.claude', 'skills', '_auto');
  await mkdir(autoDir, { recursive: true });

  let entities;
  if (values['entity-id']) {
    entities = await supabaseGet(`knowledge_entities?id=eq.${values['entity-id']}&entity_type=eq.framework`);
  } else if (values.all) {
    entities = await supabaseGet('knowledge_entities?entity_type=eq.framework&order=mention_count.desc');
  } else {
    console.error('Uso: --entity-id UUID ou --all');
    process.exit(1);
  }

  console.log(`${entities.length} frameworks para gerar skills\n`);
  let generated = 0;

  for (const entity of entities) {
    const dna = await supabaseGet(`expert_dna?entity_id=eq.${entity.id}&select=layer,content,confidence`);

    if (dna.length === 0) {
      console.log(`  ${entity.canonical_name}: sem DNA, pulando.`);
      continue;
    }

    const markdown = generateSkillMarkdown(entity, dna);
    const filename = `${toKebabCase(entity.canonical_name)}.md`;
    const filepath = join(autoDir, filename);

    await writeFile(filepath, markdown, 'utf-8');
    console.log(`  Skill gerada: ${filepath}`);
    generated++;
  }

  console.log(`\nConcluido! ${generated} skills geradas em ${autoDir}`);
  console.log('Para ativar: mover de _auto/ para ~/.claude/skills/');
}

main().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});
