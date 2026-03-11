#!/usr/bin/env node

/**
 * Fix gemini-2.5-pro output pricing no subworkflow de cost tracking
 * Subworkflow: GWKl5KuXAdeu4BLr ("[TOOL] Registrar Custo IA")
 * Node: "Calcular Custo1"
 * Problema: output price $5.00/M → correto: $10.00/M
 *
 * Uso: node scripts/fix-n8n-pricing.mjs [--dry-run]
 */

import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const N8N_BASE_URL = 'https://cliente-a1.mentorfy.io/api/v1';
const WORKFLOW_ID = 'GWKl5KuXAdeu4BLr';

// API key MUST come from environment variable
const API_KEY = process.env.N8N_API_KEY;
if (!API_KEY) {
  console.error('ERRO: N8N_API_KEY nao definida. Use: N8N_API_KEY=xxx node scripts/fix-n8n-pricing.mjs');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`[fix-n8n-pricing] Workflow: ${WORKFLOW_ID}`);
  console.log(`[fix-n8n-pricing] Modo: ${DRY_RUN ? 'DRY RUN (sem alteracoes)' : 'LIVE'}`);
  console.log('');

  // 1. Buscar workflow atual
  console.log('[1/4] Buscando workflow...');
  const res = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });

  if (!res.ok) {
    console.error(`ERRO: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const workflow = await res.json();
  console.log(`  Nome: ${workflow.name}`);
  console.log(`  Nodes: ${workflow.nodes?.length || 0}`);

  // 2. Encontrar node "Calcular Custo1"
  console.log('\n[2/4] Procurando node "Calcular Custo1"...');
  const targetNode = workflow.nodes?.find(n => n.name === 'Calcular Custo1');

  if (!targetNode) {
    console.error('ERRO: Node "Calcular Custo1" nao encontrado');
    console.log('Nodes disponiveis:', workflow.nodes?.map(n => n.name).join(', '));
    process.exit(1);
  }

  console.log(`  Tipo: ${targetNode.type}`);

  // 3. Verificar e corrigir o preco
  console.log('\n[3/4] Verificando pricing...');
  const code = targetNode.parameters?.jsCode || targetNode.parameters?.code || '';

  // Buscar o padrao de preco do gemini-2.5-pro output
  // Pode estar como: output: 5.00, output: 5, "output": 5.00, etc.
  const patterns = [
    // gemini-2.5-pro com output 5.00 (errado)
    /(['"]?gemini-2\.5-pro['"]?\s*[:{]\s*[^}]*?output\s*:\s*)5(\.0+)?(\s*[,}\]])/gi,
    // Ou em formato de tabela/objeto de precos
    /(['"]?output['"]?\s*:\s*)5(\.0+)?(\s*[,}].*?gemini.*?2\.5.*?pro)/gi,
    // Formato direto
    /(gemini.*?2\.5.*?pro[^}]*?output_price[_\s]*[:=]\s*)5(\.0+)?/gi
  ];

  let fixedCode = code;
  let found = false;

  for (const pattern of patterns) {
    if (pattern.test(fixedCode)) {
      found = true;
      fixedCode = fixedCode.replace(pattern, (match, prefix, decimals, suffix) => {
        const replacement = `${prefix}10${decimals ? '.00' : ''}${suffix || ''}`;
        console.log(`  ENCONTRADO: ${match.substring(0, 80)}...`);
        console.log(`  CORRIGIDO:  ${replacement.substring(0, 80)}...`);
        return replacement;
      });
      break;
    }
  }

  if (!found) {
    // Tentar busca mais ampla
    const outputPriceMatch = code.match(/output.*?5\.?0*.*?gemini|gemini.*?2\.5.*?pro.*?output.*?5/i);
    if (outputPriceMatch) {
      console.log(`  Encontrado padrao mas nao auto-corrigivel: "${outputPriceMatch[0]}"`);
      console.log('  O codigo precisa ser verificado manualmente.');
      console.log('\n  Trecho relevante do codigo:');
      console.log('  ' + code.substring(Math.max(0, code.indexOf('2.5-pro') - 100), code.indexOf('2.5-pro') + 200));
    } else {
      console.log('  AVISO: Nao encontrou padrao de $5 para gemini-2.5-pro output.');
      console.log('  Pode ja estar corrigido ou o formato e diferente.');
      console.log('\n  Trecho do codigo do node:');
      console.log('  ' + code.substring(0, 500));
    }

    if (!DRY_RUN) {
      console.log('\n  Saindo sem alteracoes (padrao nao encontrado automaticamente).');
      console.log('  Use --dry-run para ver o codigo completo do node.');
    }

    if (DRY_RUN) {
      console.log('\n  === CODIGO COMPLETO DO NODE ===');
      console.log(code);
      console.log('  === FIM ===');
    }

    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Alteracoes que seriam feitas:');
    console.log('  Output price: $5/M → $10/M para gemini-2.5-pro');
    console.log('\n  Nenhuma alteracao enviada ao n8n.');
    process.exit(0);
  }

  // 4. Enviar alteracao
  console.log('\n[4/4] Enviando correcao para n8n...');

  // Atualizar o codigo no node
  if (targetNode.parameters?.jsCode !== undefined) {
    targetNode.parameters.jsCode = fixedCode;
  } else if (targetNode.parameters?.code !== undefined) {
    targetNode.parameters.code = fixedCode;
  }

  // Preparar payload limpo (n8n PUT aceita apenas estes campos)
  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  // Salvar em arquivo temporario (evita problemas com ! no bash)
  const tmpFile = join(tmpdir(), `wf-fix-pricing-${Date.now()}.json`);
  writeFileSync(tmpFile, JSON.stringify(payload, null, 2));
  console.log(`  Payload salvo em: ${tmpFile}`);

  const putRes = await fetch(`${N8N_BASE_URL}/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': API_KEY,
      'Content-Type': 'application/json'
    },
    body: readFileSync(tmpFile, 'utf-8')
  });

  // Limpar arquivo temporario
  try { unlinkSync(tmpFile); } catch {}

  if (!putRes.ok) {
    console.error(`ERRO PUT: ${putRes.status} ${putRes.statusText}`);
    const body = await putRes.text();
    console.error(body);
    process.exit(1);
  }

  console.log('  Workflow atualizado com sucesso!');
  console.log('  gemini-2.5-pro output: $5/M → $10/M');
  console.log('\n  IMPORTANTE: Novos registros em llm_costs usarao o preco corrigido.');
  console.log('  Registros antigos NAO foram alterados (correcao retroativa nao aplicada).');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
