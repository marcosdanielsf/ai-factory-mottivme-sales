// =====================================================
// NÓ 2.2 - REGISTRAR USO DE PROMPT (ANALYTICS)
// =====================================================
// Inserir APÓS o AI Agent executar
// Registra execução para analytics e métricas de performance
// =====================================================
//
// FLUXO:
// [AI Agent] -> [ESTE NÓ] -> [Próximos passos]
//
// DEPENDÊNCIAS:
// - Nó "Resolver Variáveis" executado antes
// - Nó "AI Agent" executado
// - Supabase com migration 010
//
// =====================================================

// ========== CONFIGURAÇÃO ==========
const NO_VARIAVEIS = '2.1 Resolver Variáveis'; // ou nome do seu nó
const NO_AI_AGENT = 'AI Agent - Head de Vendas1'; // nome do nó AI Agent

// Supabase config
const SUPABASE_URL = $env?.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = $env?.SUPABASE_ANON_KEY || $env?.SUPABASE_SERVICE_KEY || '';

// ========== OBTER DADOS ==========
// Dados do prompt (do nó Resolver Variáveis)
let promptMetadata = {};
try {
  promptMetadata = $node[NO_VARIAVEIS]?.json?.prompt_metadata || {};
} catch (e) {
  promptMetadata = $input.first()?.json?.prompt_metadata || {};
}

// Resultado do AI Agent
let aiResult = {};
try {
  aiResult = $node[NO_AI_AGENT]?.json || $input.first()?.json || {};
} catch (e) {
  aiResult = $input.first()?.json || {};
}

// Dados de contexto
let dadosContexto = {};
try {
  dadosContexto = $node[NO_VARIAVEIS]?.json?.variaveis_resolvidas || {};
} catch (e) {
  dadosContexto = {};
}

// ========== CALCULAR MÉTRICAS ==========
// Timestamp de início (se disponível)
const startTime = promptMetadata._start_time || Date.now() - 5000; // fallback: assume 5s
const executionTimeMs = Date.now() - startTime;

// Verificar se foi sucesso
const isSuccess = !aiResult.error && (aiResult.output || aiResult.text || aiResult.message);

// Extrair tokens (se disponível - depende do modelo)
const usage = aiResult.usage || aiResult.tokenUsage || {};
const inputTokens = usage.prompt_tokens || usage.input_tokens || usage.promptTokens || null;
const outputTokens = usage.completion_tokens || usage.output_tokens || usage.completionTokens || null;

// Calcular custo estimado (aproximado para GPT-4o)
const costPerInputToken = 0.00001; // $0.01 per 1K tokens
const costPerOutputToken = 0.00003; // $0.03 per 1K tokens
const totalCost = inputTokens && outputTokens
  ? (inputTokens * costPerInputToken) + (outputTokens * costPerOutputToken)
  : null;

// ========== REGISTRAR NO SUPABASE ==========
async function registrarExecucao() {
  try {
    const payload = {
      p_prompt_key: promptMetadata.prompt_key || 'unknown',
      p_workflow_key: $workflow?.name || 'unknown',
      p_success: isSuccess,
      p_error_message: aiResult.error ? String(aiResult.error) : null,
      p_execution_time_ms: executionTimeMs,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_workflow_execution_id: $execution?.id || null,
      p_location_id: dadosContexto.location_id || null,
      p_contact_id: dadosContexto.contact_id || null,
      p_variables_resolved: dadosContexto
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/log_prompt_execution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao registrar execução:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Erro ao registrar execução:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar registro
const logResult = await registrarExecucao();

// ========== OUTPUT ==========
// Passa os dados originais do AI Agent + metadados de logging
return [{
  json: {
    // Dados originais do AI Agent (para próximos nós processarem)
    ...aiResult,

    // Metadados do logging (para debug)
    _prompt_analytics: {
      logged: logResult.success || false,
      execution_id: logResult.execution_id || null,
      prompt_key: promptMetadata.prompt_key,
      version: promptMetadata.version,

      metrics: {
        execution_time_ms: executionTimeMs,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_cost_usd: totalCost,
        success: isSuccess
      },

      logged_at: new Date().toISOString()
    }
  }
}];

// =====================================================
// ALTERNATIVA: USAR NÓ POSTGRES DIRETO
// =====================================================
//
// Se preferir usar o nó Postgres nativo:
//
// 1. Adicione nó "Postgres"
// 2. Operation: Execute Query
// 3. Query:
//
// SELECT log_prompt_execution(
//   '{{ $node["Resolver Variáveis"].json.prompt_metadata.prompt_key }}',
//   '{{ $workflow.name }}',
//   {{ $node["AI Agent"].json.error ? 'false' : 'true' }},
//   {{ $node["AI Agent"].json.error ? "'" + $node["AI Agent"].json.error + "'" : 'NULL' }},
//   {{ Date.now() - $node["Resolver Variáveis"].json.resolved_at }},
//   NULL, -- input_tokens
//   NULL, -- output_tokens
//   '{{ $execution.id }}',
//   '{{ $node["Resolver Variáveis"].json.variaveis_resolvidas.location_id }}',
//   '{{ $node["Resolver Variáveis"].json.variaveis_resolvidas.contact_id }}',
//   '{}' -- variables_resolved as JSON
// );
//
// =====================================================
// IMPORTANTE: Este nó não deve bloquear o fluxo
// =====================================================
//
// Se houver erro no logging:
// - Apenas loga warning no console
// - Continua o fluxo normalmente
// - Não afeta o resultado do AI Agent
//
// Para implementar fire-and-forget:
// 1. Separe este nó em branch paralelo
// 2. Use nó "No Operation" após se precisar sincronizar
//
// =====================================================
