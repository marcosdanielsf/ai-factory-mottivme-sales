// =====================================================
// NÓ 2.0 - BUSCAR PROMPT ATIVO DO SUPABASE
// =====================================================
// Inserir ANTES de qualquer AI Agent que usa prompt dinâmico
// Este nó substitui o prompt hardcoded por busca no Supabase
// =====================================================
//
// COMO USAR:
// 1. Adicione este nó Code ANTES do AI Agent
// 2. Configure a variável PROMPT_KEY com a chave do prompt
// 3. Conecte a saída ao próximo nó (Resolver Variáveis)
//
// DEPENDÊNCIAS:
// - Supabase configurado com migration 008 e 010
// - Credenciais configuradas no n8n (Header Auth ou env vars)
// - Prompt registrado em prompt_registry com is_current = true
//
// =====================================================

// ========== CONFIGURAÇÃO ==========
// Altere a chave do prompt conforme o fluxo
const PROMPT_KEY = 'head-vendas-bposs'; // Chave do prompt no Supabase

// URLs do Supabase (usar variáveis de ambiente no n8n)
const SUPABASE_URL = $env?.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = $env?.SUPABASE_ANON_KEY || $env?.SUPABASE_SERVICE_KEY || '';

// ========== FUNÇÃO PRINCIPAL ==========
async function buscarPromptAtivo(promptKey) {
  try {
    // Chamar RPC do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_prompt_with_variables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ p_prompt_key: promptKey })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Verificar se retornou erro
    if (data.error) {
      throw new Error(data.error);
    }

    // Extrair dados do prompt
    const promptData = data.prompt || {};
    const variables = data.variables || [];
    const catalog = data.catalog || {};

    return {
      success: true,
      prompt_key: promptData.prompt_key || promptKey,
      prompt_name: promptData.prompt_name || '',
      prompt_content: promptData.prompt_content || '',
      version: promptData.version || 1,
      version_id: promptData.version_id,
      prompt_id: promptData.prompt_id,
      model_config: promptData.model_config || {},
      performance_score: promptData.performance_score,
      variables: variables,
      catalog: catalog,
      _fetch_timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro ao buscar prompt:', error.message);

    // Retornar erro estruturado (não quebra o fluxo)
    return {
      success: false,
      error: error.message,
      prompt_key: promptKey,
      prompt_content: null,
      _fetch_timestamp: new Date().toISOString()
    };
  }
}

// ========== EXECUÇÃO ==========
const resultado = await buscarPromptAtivo(PROMPT_KEY);

// Verificar se conseguiu buscar
if (!resultado.success) {
  // Opção 1: Lançar erro e parar fluxo
  // throw new Error(`Falha ao buscar prompt ${PROMPT_KEY}: ${resultado.error}`);

  // Opção 2: Continuar com fallback (pode usar prompt default)
  console.warn(`AVISO: Falha ao buscar prompt. Usando fallback se disponível.`);
}

// Passar dados para o próximo nó
return [{
  json: {
    ...resultado,
    // Passar dados do nó anterior se necessário
    dados_anteriores: $input.first()?.json || {}
  }
}];

// =====================================================
// NOTAS DE IMPLEMENTAÇÃO:
// =====================================================
//
// 1. ALTERNATIVA COM HTTP REQUEST:
//    Se preferir usar nó HTTP Request nativo ao invés de Code:
//    - URL: {{ $env.SUPABASE_URL }}/rest/v1/rpc/get_prompt_with_variables
//    - Method: POST
//    - Headers:
//      - apikey: {{ $env.SUPABASE_ANON_KEY }}
//      - Authorization: Bearer {{ $env.SUPABASE_ANON_KEY }}
//      - Content-Type: application/json
//    - Body (JSON): {"p_prompt_key": "head-vendas-bposs"}
//
// 2. CACHE (opcional):
//    Para evitar chamadas repetidas, pode implementar cache:
//    - Usar nó "Set" para guardar em variável global
//    - Verificar se já tem cache antes de buscar
//    - Invalidar cache a cada X minutos
//
// 3. FALLBACK:
//    Se o prompt não for encontrado, você pode:
//    - Usar um prompt default hardcoded
//    - Parar o fluxo com erro
//    - Notificar e continuar com comportamento degradado
//
// =====================================================
