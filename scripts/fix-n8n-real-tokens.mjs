#!/usr/bin/env node

/**
 * fix-n8n-real-tokens.mjs
 *
 * Atualiza o sub-workflow de cost tracking e workflows chamadores para:
 * 1. Sub-workflow: aceitar tokens_source + aplicar correção para tokens estimados Gemini
 * 2. Chamadores: enviar tokens_source no payload do sub-workflow
 *
 * Problema: tokens são estimados por chars/3.4 (gap de ~10x vs Google Cloud billing)
 * Solução: sub-workflow aplica correção automática quando tokens_source = 'estimated'
 *
 * Uso:
 *   N8N_API_KEY=xxx node scripts/fix-n8n-real-tokens.mjs [--dry-run] [--sub-only] [--callers-only]
 *
 * Flags:
 *   --dry-run       Mostra mudanças sem aplicar
 *   --sub-only      Atualiza apenas o sub-workflow
 *   --callers-only  Atualiza apenas os workflows chamadores
 *
 * Data: 2026-02-23
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const N8N_BASE_URL = 'https://cliente-a1.mentorfy.io/api/v1';
const SUB_WORKFLOW_ID = 'GWKl5KuXAdeu4BLr';

const API_KEY = process.env.N8N_API_KEY;
if (!API_KEY) {
  console.error('ERRO: N8N_API_KEY nao definida.');
  console.error('Uso: N8N_API_KEY=xxx node scripts/fix-n8n-real-tokens.mjs');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const SUB_ONLY = process.argv.includes('--sub-only');
const CALLERS_ONLY = process.argv.includes('--callers-only');

// Top 5 Gemini workflows (por custo) + node names
const CALLER_WORKFLOWS = [
  {
    id: 'IawOpB56MTFoEP3M',
    name: 'Mensagem recebida',
    costNode: 'Calcular Custo LLM',
    trackNode: 'Call Track AI Cost'
  },
  {
    id: 'BtHmCsdr4fNaqnyR',
    name: '[ Core ] IA Vertical',
    costNode: 'Calcular Custo LLM',
    trackNode: null // precisa descobrir
  },
  {
    id: 'TwmNKaeDjuhr5ys2',
    name: '20.1-Improver-Inner',
    costNode: 'Calcular Custo LLM',
    trackNode: null
  },
  {
    id: 'i17IH6yh8IY1DP7s',
    name: 'Comandos do Grupo',
    costNode: 'Calcular Custo LLM',
    trackNode: null
  },
  {
    id: 'Klsr9cIB9rAOp9na',
    name: 'Relatório Diário',
    costNode: 'Calcular Custo LLM',
    trackNode: null
  }
];

// Backup directory
const BACKUP_DIR = join(tmpdir(), 'claude');
try { mkdirSync(BACKUP_DIR, { recursive: true }); } catch {}

async function fetchWorkflow(id) {
  const res = await fetch(`${N8N_BASE_URL}/workflows/${id}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  if (!res.ok) {
    throw new Error(`GET ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function putWorkflow(id, workflow) {
  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings || {}
  };

  const tmpFile = join(BACKUP_DIR, `wf-put-${id}-${Date.now()}.json`);
  writeFileSync(tmpFile, JSON.stringify(payload, null, 2));

  const res = await fetch(`${N8N_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': API_KEY,
      'Content-Type': 'application/json'
    },
    body: readFileSync(tmpFile, 'utf-8')
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PUT ${id}: ${res.status} — ${body.substring(0, 500)}`);
  }
  return res.json();
}

function backupWorkflow(id, workflow) {
  const file = join(BACKUP_DIR, `wf-backup-${id}-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(workflow, null, 2));
  return file;
}

// ============================================================================
// 1. UPDATE SUB-WORKFLOW
// ============================================================================
async function updateSubWorkflow() {
  console.log('=== ATUALIZANDO SUB-WORKFLOW ===');
  console.log(`ID: ${SUB_WORKFLOW_ID}`);

  const wf = await fetchWorkflow(SUB_WORKFLOW_ID);
  console.log(`Nome: ${wf.name} (${wf.nodes.length} nodes)`);

  const backupFile = backupWorkflow(SUB_WORKFLOW_ID, wf);
  console.log(`Backup: ${backupFile}`);

  // 1a. Adicionar tokens_source ao trigger
  const trigger = wf.nodes.find(n => n.name === 'Quando Chamado');
  if (!trigger) throw new Error('Trigger "Quando Chamado" nao encontrado');

  const inputs = trigger.parameters?.workflowInputs?.values || [];
  const hasTokensSource = inputs.some(v => v.name === 'tokens_source');

  if (!hasTokensSource) {
    inputs.push({ name: 'tokens_source' });
    console.log('  [+] Campo tokens_source adicionado ao trigger');
  } else {
    console.log('  [=] Campo tokens_source ja existe no trigger');
  }

  // 1b. Atualizar Calcular Custo1 — adicionar correção para tokens estimados
  const calcNode = wf.nodes.find(n => n.name === 'Calcular Custo1');
  if (!calcNode) throw new Error('Node "Calcular Custo1" nao encontrado');

  const codeField = calcNode.parameters?.jsCode !== undefined ? 'jsCode' : 'code';
  const currentCode = calcNode.parameters[codeField];

  // Verificar se já foi atualizado
  if (currentCode.includes('tokens_source')) {
    console.log('  [=] Calcular Custo1 ja tem logica de tokens_source');
  } else {
    // Injetar correção após a leitura de tokens
    const newCode = buildCalcCosto1Code();
    calcNode.parameters[codeField] = newCode;
    console.log('  [+] Calcular Custo1 atualizado com correção de tokens estimados');
  }

  // 1c. Atualizar INSERT para incluir tokens_source
  const insertNode = wf.nodes.find(n => n.name === 'Inserir em llm_costs');
  if (!insertNode) throw new Error('Node "Inserir em llm_costs" nao encontrado');

  const query = insertNode.parameters?.query || '';
  if (query.includes('tokens_source')) {
    console.log('  [=] INSERT ja tem coluna tokens_source');
  } else {
    // Adicionar tokens_source ao INSERT
    const newQuery = query
      .replace(
        'mensagem_saida\n)',
        'mensagem_saida,\n  tokens_source\n)'
      )
      .replace(
        /{{ \$json\.mensagem_saida \? "'" \+ \$json\.mensagem_saida\.replace\(\/'\//g + "g, \"''\").replace(/\\n/g, ' ') + \"'\" : 'NULL' }}\n)",
        `{{ $json.mensagem_saida ? "'" + $json.mensagem_saida.replace(/'/g, "''").replace(/\\n/g, ' ') + "'" : 'NULL' }},\n  '{{ $json.tokens_source || 'estimated' }}'\n)`
      );

    // Fallback: simpler replacement if the complex one didn't work
    if (!newQuery.includes('tokens_source')) {
      // Replace the last RETURNING with tokens_source + RETURNING
      insertNode.parameters.query = query.replace(
        ")\nRETURNING id, custo_usd;",
        `,\n  tokens_source\n)\nVALUES_APPEND\nRETURNING id, custo_usd;`
      );
      // Actually, let's rebuild the query cleanly
      insertNode.parameters.query = buildInsertQuery();
      console.log('  [+] INSERT atualizado com coluna tokens_source (rebuild)');
    } else {
      insertNode.parameters.query = newQuery;
      console.log('  [+] INSERT atualizado com coluna tokens_source');
    }
  }

  if (DRY_RUN) {
    console.log('\n  [DRY RUN] Nenhuma alteracao enviada.');
    console.log('\n  Calcular Custo1 (novo codigo):');
    console.log(calcNode.parameters[codeField].substring(0, 500) + '...');
    return;
  }

  await putWorkflow(SUB_WORKFLOW_ID, wf);
  console.log('  [OK] Sub-workflow atualizado com sucesso');
}

function buildCalcCosto1Code() {
  return `const input = $input.first().json;

// Tabela de precos por modelo (USD por 1M tokens)
// Atualizado: 2026-02-23
const precos = {
  // Google Gemini 2.5
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'gemini-2.5-pro+flash': { input: 1.40, output: 10.60 },
  // Google Gemini 2.0
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
  // Google Gemini 1.5
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  // Anthropic - Novos (4.5/4.6)
  'claude-opus-4.6': { input: 5.00, output: 25.00 },
  'claude-opus-4.5': { input: 5.00, output: 25.00 },
  'claude-sonnet-4.6': { input: 3.00, output: 15.00 },
  'claude-sonnet-4.5': { input: 3.00, output: 15.00 },
  'claude-haiku-4.5': { input: 1.00, output: 5.00 },
  'claude-haiku-3.5': { input: 0.80, output: 4.00 },
  // Anthropic - Legado
  'claude-3-opus': { input: 15.00, output: 75.00 },
  'claude-3-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  // Groq
  'groq-llama3.3-70b': { input: 0.59, output: 0.79 },
  'groq-llama3-70b': { input: 0.59, output: 0.79 },
  'groq-llama3-8b': { input: 0.05, output: 0.08 },
  'groq-mixtral-8x7b': { input: 0.24, output: 0.24 },
  // Default
  'default': { input: 0.10, output: 0.40 }
};

// Normalizar nome do modelo (aceita model OU modelo_ia)
let modelo = (input.model || input.modelo_ia || 'gemini-2.0-flash').toLowerCase();

// Tentar encontrar modelo na tabela
let preco = precos[modelo];
if (!preco) {
  for (const [key, val] of Object.entries(precos)) {
    if (modelo.includes(key) || key.includes(modelo)) {
      preco = val;
      modelo = key;
      break;
    }
  }
}
if (!preco) preco = precos['default'];

// Tokens (aceita input_tokens OU tokens_input)
let tokens_input = parseInt(input.input_tokens || input.tokens_input) || 0;
let tokens_output = parseInt(input.output_tokens || input.tokens_output) || 0;

// tokens_source: 'api' (tokens reais) ou 'estimated' (chars/3.4)
const tokensSource = input.tokens_source || 'estimated';

// ============================================
// CORRECAO DE TOKENS ESTIMADOS (Gemini only)
// ============================================
// Quando tokens vem de estimativa (chars/3.4), aplicar correção:
// - gemini-2.5-pro: input*3 + 8000 thinking tokens no output
// - gemini-2.0-flash: input*3.5, output*3.5
// - gemini-1.5: input*3, output*3
// Quando tokens_source = 'api', tokens ja sao reais — sem correção
if (tokensSource === 'estimated' && modelo.includes('gemini')) {
  if (modelo.includes('gemini-2.5-pro')) {
    tokens_input = Math.round(tokens_input * 3);
    tokens_output = tokens_output + 8000; // thinking tokens estimados
  } else if (modelo.includes('gemini-2.0-flash')) {
    tokens_input = Math.round(tokens_input * 3.5);
    tokens_output = Math.round(tokens_output * 3.5);
  } else if (modelo.includes('gemini-1.5')) {
    tokens_input = Math.round(tokens_input * 3);
    tokens_output = Math.round(tokens_output * 3);
  }
}

const tokens_total = parseInt(input.total_tokens) || (tokens_input + tokens_output);

// Calcular custo
const custo_input = (tokens_input / 1000000) * preco.input;
const custo_output = (tokens_output / 1000000) * preco.output;
const custo_total = custo_input + custo_output;

return {
  json: {
    date: input.date || new Date().toISOString(),
    modelo_ia: modelo,
    tokens_input: tokens_input,
    tokens_output: tokens_output,
    tokens_total: tokens_total,
    custo_usd: parseFloat(custo_total.toFixed(6)),
    workflow_id: input.workflowId || $workflow.id,
    execution_id: input.executionId || $execution.id,
    location_id: input.location_id || null,
    location_name: input.location_name || null,
    contact_id: input.contact_id || null,
    contact_name: input.contact_name || null,
    canal: input.canal || 'api',
    tipo_acao: input.tipo_acao || 'llm_call',
    workflow_name: input.workflowName || '',
    tokens_source: tokensSource
  }
};`;
}

function buildInsertQuery() {
  return `=INSERT INTO llm_costs (
  workflow_id,
  workflow_name,
  execution_id,
  location_id,
  location_name,
  contact_id,
  contact_name,
  canal,
  tipo_acao,
  modelo_ia,
  tokens_input,
  tokens_output,
  custo_usd,
  mensagem_entrada,
  mensagem_saida,
  tokens_source
)
VALUES (
  {{ $json.workflow_id ? "'" + $json.workflow_id + "'" : 'NULL' }},
  {{ $json.workflow_name ? "'" + $json.workflow_name.replace(/'/g, "''") + "'" : 'NULL' }},
  {{ $json.execution_id ? "'" + $json.execution_id + "'" : 'NULL' }},
  {{ $json.location_id ? "'" + $json.location_id + "'" : 'NULL' }},
  {{ $json.location_name ? "'" + $json.location_name.replace(/'/g, "''") + "'" : 'NULL' }},
  {{ $json.contact_id ? "'" + $json.contact_id + "'" : 'NULL' }},
  {{ $json.contact_name ? "'" + $json.contact_name.replace(/'/g, "''") + "'" : 'NULL' }},
  '{{ $json.canal }}',
  '{{ $json.tipo_acao }}',
  '{{ $json.modelo_ia }}',
  {{ $json.tokens_input }},
  {{ $json.tokens_output }},
  {{ $json.custo_usd }},
  {{ $json.mensagem_entrada ? "'" + $json.mensagem_entrada.replace(/'/g, "''").replace(/\\n/g, ' ') + "'" : 'NULL' }},
  {{ $json.mensagem_saida ? "'" + $json.mensagem_saida.replace(/'/g, "''").replace(/\\n/g, ' ') + "'" : 'NULL' }},
  '{{ $json.tokens_source || 'estimated' }}'
)
RETURNING id, custo_usd;`;
}

// ============================================================================
// 2. UPDATE CALLING WORKFLOWS
// ============================================================================
async function updateCallerWorkflow(config) {
  console.log(`\n--- ${config.name} (${config.id}) ---`);

  const wf = await fetchWorkflow(config.id);
  console.log(`  Nodes: ${wf.nodes.length}`);

  const backupFile = backupWorkflow(config.id, wf);
  console.log(`  Backup: ${backupFile}`);

  // Encontrar o node executeWorkflow que chama o sub-workflow
  const execNode = wf.nodes.find(n =>
    n.type === 'n8n-nodes-base.executeWorkflow' &&
    (n.parameters?.workflowId?.value === SUB_WORKFLOW_ID ||
     JSON.stringify(n.parameters || {}).includes(SUB_WORKFLOW_ID))
  );

  if (!execNode) {
    console.log('  [SKIP] Node executeWorkflow para sub-workflow nao encontrado');
    return false;
  }

  console.log(`  Track node: "${execNode.name}"`);

  // Verificar se já tem tokens_source
  const inputs = execNode.parameters?.workflowInputs?.value || {};
  if (inputs.tokens_source) {
    console.log('  [=] tokens_source ja configurado');
    return false;
  }

  // Adicionar tokens_source
  inputs.tokens_source = 'estimated';
  execNode.parameters.workflowInputs.value = inputs;
  console.log('  [+] tokens_source: "estimated" adicionado');

  if (DRY_RUN) {
    console.log('  [DRY RUN] Nenhuma alteracao enviada.');
    return false;
  }

  await putWorkflow(config.id, wf);
  console.log('  [OK] Workflow atualizado');
  return true;
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('[fix-n8n-real-tokens] Correcao de tokens estimados');
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  let subOk = false;
  let callersUpdated = 0;

  // 1. Sub-workflow
  if (!CALLERS_ONLY) {
    try {
      await updateSubWorkflow();
      subOk = true;
    } catch (err) {
      console.error(`ERRO sub-workflow: ${err.message}`);
    }
  }

  // 2. Calling workflows
  if (!SUB_ONLY) {
    console.log('\n=== ATUALIZANDO WORKFLOWS CHAMADORES ===');
    for (const config of CALLER_WORKFLOWS) {
      try {
        const updated = await updateCallerWorkflow(config);
        if (updated) callersUpdated++;
      } catch (err) {
        console.error(`  ERRO ${config.id}: ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n=== RESUMO ===');
  if (!CALLERS_ONLY) console.log(`Sub-workflow: ${subOk ? 'OK' : 'ERRO'}`);
  if (!SUB_ONLY) console.log(`Chamadores atualizados: ${callersUpdated}/${CALLER_WORKFLOWS.length}`);
  console.log('');
  console.log('Proximos passos:');
  console.log('1. Testar com uma execucao manual do workflow principal');
  console.log('2. Verificar em llm_costs: SELECT tokens_source FROM llm_costs ORDER BY created_at DESC LIMIT 5;');
  console.log('3. Novos registros Gemini devem ter custos ~10x maiores que os antigos (corrigidos)');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
