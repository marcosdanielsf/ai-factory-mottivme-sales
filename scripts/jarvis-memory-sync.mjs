#!/usr/bin/env node
/**
 * Jarvis Memory Sync — CLI Memory → Supabase
 * Lê todos os memory/*.md do Claude Code CLI e insere no jarvis_memory do Supabase
 * Ignora: api-keys.md (segurança), MEMORY.md e MEMORY-INDEX.md (meta-files)
 *
 * Usage: node scripts/jarvis-memory-sync.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const SUPABASE_URL = 'https://bfumywvwubvernvhjehk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE';
const USER_ID = '5d8cc979-387a-49ce-aac8-03875cfc1012';
const MEMORY_DIR = '/Users/marcosdaniels/.claude/projects/-Users-marcosdaniels/memory';

// Arquivos a ignorar (segurança ou meta)
const SKIP_FILES = ['api-keys.md', 'MEMORY.md', 'MEMORY-INDEX.md', 'session-log.md'];

// Mapear nomes de arquivo → project_slug baseado no conteúdo
const FILE_TO_PROJECT = {
  'assembly-line-quick-ref.md': 'assembly-line',
  'assembly-line-fase2.md': 'assembly-line',
  'aios-dashboard.md': 'aios',
  'aios-live-insights.md': 'aios',
  'brand-portal.md': 'brand-portal',
  'brandpack-system.md': 'brand-portal',
  'otica-maria-clara.md': 'otica-lumar',
  'grego-imoveis-prime.md': 'grego-imoveis',
  'sites-alberto-eline.md': 'sites-alberto-eline',
  'socialfy-platform.md': 'socialfy',
  'social-selling-dashboard.md': 'social-selling',
  'mentoria-estrategista.md': 'mentoria',
  'propostal-portal-diagnostico.md': 'propostal',
  'calculadora-vendas-front.md': 'calculadora',
  'life-os-donna-wendy.md': 'life-os',
  'video-production.md': 'video-pipeline',
  'cold-outreach-br.md': 'cold-outreach',
  'jarvis-upgrade.md': 'jarvis',
  'financeiro-dashboard.md': 'financeiro',
  'financeiro-email-workflow.md': 'financeiro',
};

// Classificar tipo baseado no conteúdo
function classifyType(content, filename) {
  const lower = content.toLowerCase();
  if (lower.includes('deployed') || lower.includes('status:') || lower.includes('fase')) return 'update';
  if (lower.includes('decidimos') || lower.includes('decisão') || lower.includes('escolhemos')) return 'decision';
  if (lower.includes('pendente') || lower.includes('todo') || lower.includes('próximo')) return 'task';
  if (lower.includes('pattern') || lower.includes('gotcha') || lower.includes('nunca')) return 'fact';
  return 'fact';
}

// Extrair resumo do arquivo (primeira seção significativa, max 800 chars)
function extractSummary(content, filename) {
  const lines = content.split('\n').filter(l => l.trim());
  const title = lines[0]?.replace(/^#+\s*/, '') ?? filename;

  // Pegar as primeiras linhas significativas (não headers vazios)
  const meaningful = lines
    .slice(1)
    .filter(l => !l.startsWith('>') && l.trim().length > 5)
    .slice(0, 15)
    .join('\n');

  const summary = `[${filename.replace('.md', '')}] ${title}\n${meaningful}`;
  return summary.substring(0, 800);
}

async function main() {
  console.log('🧠 Jarvis Memory Sync — CLI → Supabase\n');

  // 1. Verificar memórias já sincronizadas
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/jarvis_memory?select=content&source=eq.cli_sync&user_id=eq.${USER_ID}&limit=500`,
    {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const existing = await existingRes.json();
  const existingSlugs = new Set(
    (existing ?? []).map(m => {
      const match = m.content?.match(/^\[([^\]]+)\]/);
      return match ? match[1] : null;
    }).filter(Boolean)
  );
  console.log(`📋 Já sincronizados: ${existingSlugs.size} arquivos\n`);

  // 2. Ler arquivos de memória
  const files = readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md') && !SKIP_FILES.includes(f));

  console.log(`📂 Encontrados: ${files.length} arquivos de memória\n`);

  // Subdiretórios (tier-1)
  try {
    const tier1Dir = join(MEMORY_DIR, 'tier-1');
    const tier1Files = readdirSync(tier1Dir).filter(f => f.endsWith('.md'));
    for (const f of tier1Files) {
      files.push(`tier-1/${f}`);
    }
  } catch {
    // tier-1 pode não existir
  }

  const inserts = [];
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace('.md', '').replace('tier-1/', 'tier1-');

    // Skip se já sincronizado
    if (existingSlugs.has(slug)) {
      skipped++;
      continue;
    }

    try {
      const filepath = join(MEMORY_DIR, file);
      const content = readFileSync(filepath, 'utf-8');

      if (content.trim().length < 20) continue; // Arquivo vazio

      const summary = extractSummary(content, file);
      const type = classifyType(content, file);
      const projectSlug = FILE_TO_PROJECT[basename(file)] ?? null;

      inserts.push({
        user_id: USER_ID,
        type,
        content: summary,
        project_slug: projectSlug,
        importance: 7, // Base importance para memórias CLI
        source: 'cli_sync',
      });
    } catch (err) {
      console.error(`  ❌ Erro lendo ${file}: ${err.message}`);
    }
  }

  console.log(`✅ Novos para inserir: ${inserts.length}`);
  console.log(`⏭️  Já existentes (skip): ${skipped}\n`);

  if (inserts.length === 0) {
    console.log('✅ Tudo sincronizado. Nada a fazer.');
    return;
  }

  // 3. Bulk insert no Supabase
  const batchSize = 20;
  let inserted = 0;

  for (let i = 0; i < inserts.length; i += batchSize) {
    const batch = inserts.slice(i, i + batchSize);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/jarvis_memory`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      inserted += batch.length;
      console.log(`  📝 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} memórias inseridas`);
    } else {
      const err = await res.text();
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} falhou: ${res.status} ${err}`);
    }
  }

  console.log(`\n🎉 Sync completo. ${inserted}/${inserts.length} memórias sincronizadas.`);
}

main().catch(console.error);
