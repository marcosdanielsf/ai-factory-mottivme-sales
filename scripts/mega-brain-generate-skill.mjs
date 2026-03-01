#!/usr/bin/env node
/**
 * Mega Brain Generate Skill — Gera skill .md a partir de DNA de framework
 * Salva em ~/.claude/skills/_auto/[nome-kebab-case].md
 *
 * Usage:
 *   node scripts/mega-brain-generate-skill.mjs --entity-id UUID
 */

import { parseArgs } from 'node:util';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ─── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRO: Variaveis de ambiente obrigatorias: SUPABASE_URL, SUPABASE_KEY');
  process.exit(1);
}

const SKILLS_AUTO_DIR = join(homedir(), '.claude', 'skills', '_auto');

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
Mega Brain Generate Skill — Gera skill .md a partir de DNA de framework

Uso:
  node scripts/mega-brain-generate-skill.mjs --entity-id UUID

Opções:
  --entity-id UUID  UUID da entidade (framework com DNA extraído)
  --help            Mostrar esta ajuda

Output:
  Salva em: ~/.claude/skills/_auto/[nome-kebab-case].md
  approved: false (requer revisão manual antes de usar)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toKebabCase(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Busca de dados ───────────────────────────────────────────────────────────

async function getFrameworkData(entityId) {
  const [entity] = await sbGet(
    `knowledge_entities?id=eq.${entityId}&select=id,name,entity_type,mention_count,metadata,dossier_text`
  );

  if (!entity) throw new Error(`Entidade ${entityId} não encontrada`);

  // Buscar camada de frameworks do DNA (pode ser da entidade-pessoa associada, ou da própria entidade)
  let dnaFrameworks = [];

  // 1. Tentar buscar DNA direto da entidade
  const dnaRows = await sbGet(
    `expert_dna?entity_id=eq.${entityId}&layer=eq.frameworks&select=items`
  );

  if (dnaRows.length > 0 && dnaRows[0].items) {
    dnaFrameworks = dnaRows[0].items;
  }

  // 2. Usar metadata da entidade como fallback (preenchido no detect-frameworks)
  if (dnaFrameworks.length === 0 && entity.metadata) {
    const meta = entity.metadata;
    if (meta.steps || meta.when_to_use) {
      dnaFrameworks = [{
        title: entity.name,
        description: entity.dossier_text || `Framework: ${entity.name}`,
        steps: meta.steps || [],
        when_to_use: meta.when_to_use || '',
        example: meta.example || '',
        source_person: meta.source_person || '',
        evidence: [],
        confidence: 0.8,
      }];
    }
  }

  // 3. Buscar menções para contexto
  const mentions = await sbGet(
    `entity_mentions?entity_id=eq.${entityId}&select=context_snippet,knowledge_sources(title)&limit=10`
  );

  const mentionSources = mentions
    .map(m => m.knowledge_sources?.title)
    .filter(Boolean);

  return { entity, dnaFrameworks, mentionSources };
}

// ─── Geração da skill ─────────────────────────────────────────────────────────

function generateSkillMarkdown(entity, dnaFrameworks, mentionSources) {
  const skillName = toKebabCase(entity.name);
  const sourcePerson = entity.metadata?.source_person || 'Desconhecido';
  const sourceContext = mentionSources.slice(0, 3).join(', ') || 'Knowledge Base';

  // Usar o primeiro framework do DNA (o mais relevante) ou criar estrutura genérica
  const mainFramework = dnaFrameworks[0] || {
    title: entity.name,
    description: entity.dossier_text || `Metodologia: ${entity.name}`,
    steps: [],
    when_to_use: 'Consulte o knowledge base para detalhes de aplicação.',
    example: '',
    evidence: [],
  };

  const stepsText = mainFramework.steps && mainFramework.steps.length > 0
    ? mainFramework.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
    : '1. Consulte o knowledge base para os passos detalhados\n2. Aplique o contexto do material de origem';

  const exampleText = mainFramework.example || mainFramework.description?.slice(0, 300) || '';

  // Frameworks adicionais do DNA
  const additionalFrameworks = dnaFrameworks.slice(1).map(fw => {
    const fwSteps = fw.steps && fw.steps.length > 0
      ? fw.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      : '  - Consulte o knowledge base para detalhes';
    return `### ${fw.title}\n${fw.description || ''}\n\n**Passos:**\n${fwSteps}`;
  }).join('\n\n');

  const frontmatter = `---
skill: ${skillName}
version: 1.0.0
description: ${entity.name} — framework extraído automaticamente do Mega Brain
auto_generated: true
source_entity: ${entity.id}
approved: false
---`;

  const body = `# ${entity.name}

## Quando Usar
${mainFramework.when_to_use || 'Quando precisar aplicar este framework estruturado.'}

## Passos
${stepsText}

## Exemplo
${exampleText || 'Sem exemplo documentado — consulte o knowledge base.'}

## Fonte
Extraído de: ${sourcePerson} em ${sourceContext}

_Skill gerada automaticamente em ${new Date().toISOString().split('T')[0]}. Requer aprovação manual antes de usar._
${additionalFrameworks ? '\n## Frameworks Relacionados\n\n' + additionalFrameworks : ''}`;

  return { skillName, content: frontmatter + '\n\n' + body };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const entityId = args['entity-id'];

  console.log('='.repeat(60));
  console.log('MEGA BRAIN GENERATE SKILL');
  console.log('='.repeat(60));
  console.log(`Entity ID: ${entityId}`);

  const { entity, dnaFrameworks, mentionSources } = await getFrameworkData(entityId);

  console.log(`\nEntidade: ${entity.name} (${entity.entity_type})`);
  console.log(`Frameworks no DNA: ${dnaFrameworks.length}`);
  console.log(`Fontes: ${mentionSources.length}`);

  if (dnaFrameworks.length === 0 && !entity.metadata?.steps) {
    console.log('\nAVISO: Sem dados de DNA ou metadata para gerar skill.');
    console.log('Execute mega-brain-extract-dna.mjs ou mega-brain-detect-frameworks.mjs primeiro.');

    // Ainda assim gerar uma skill básica com o dossiê
    if (!entity.dossier_text && entity.mention_count < 1) {
      console.error('Dados insuficientes para gerar skill.');
      process.exit(1);
    }
    console.log('Gerando skill básica com informações disponíveis...');
  }

  // Criar diretório _auto se não existir
  try {
    await mkdir(SKILLS_AUTO_DIR, { recursive: true });
    console.log(`\nDiretório: ${SKILLS_AUTO_DIR}`);
  } catch (err) {
    if (!err.code === 'EEXIST') throw err;
  }

  const { skillName, content } = generateSkillMarkdown(entity, dnaFrameworks, mentionSources);
  const filePath = join(SKILLS_AUTO_DIR, `${skillName}.md`);

  await writeFile(filePath, content, 'utf-8');

  // Listar skills geradas no diretório
  let skillCount = 0;
  try {
    const files = await readdir(SKILLS_AUTO_DIR);
    skillCount = files.filter(f => f.endsWith('.md')).length;
  } catch {}

  console.log('\n' + '='.repeat(60));
  console.log('SKILL GERADA');
  console.log('='.repeat(60));
  console.log(`Skill:   ${skillName}`);
  console.log(`Arquivo: ${filePath}`);
  console.log(`Status:  approved=false (revisão manual necessária)`);
  console.log(`\nTotal skills em _auto: ${skillCount}`);
  console.log('\nPróximo passo: Revise e edite approved=true para ativar.');
}

main().catch(err => {
  console.error('[ERRO CRÍTICO]', err.message);
  process.exit(1);
});
