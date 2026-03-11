// =====================================================
// NÓ 2.1 - RESOLVER VARIÁVEIS NO PROMPT (V2 - CORRIGIDO)
// =====================================================
// IMPORTANTE: Este nó DEVE passar os dados da transcrição
// para os próximos nós, não apenas o prompt!
// =====================================================

// Obter dados do prompt (do nó Postgres)
const promptRow = $input.first()?.json || {};
const promptContent = promptRow.prompt_content || '';
const promptKey = promptRow.prompt_key || 'unknown';
const version = promptRow.version || 1;

// ========== BUSCAR DADOS DE CONTEXTO ==========
// Ajuste os nomes dos nós conforme seu fluxo!

let dadosContexto = {};
let transcricaoTexto = '';

// Tentar buscar de diferentes nós possíveis
const possiveisNos = [
  'Export Google Doc como Texto',
  'Buscar Transcrição',
  'Config GHL + Dados Supabase',
  '1.6 Preparar Dados',
  'Preparar Dados'
];

for (const nomeNo of possiveisNos) {
  try {
    const dados = $node[nomeNo]?.json;
    if (dados) {
      dadosContexto = dados;

      // Buscar transcrição em diferentes campos possíveis
      transcricaoTexto = dados.data
        || dados.texto
        || dados.texto_transcricao
        || dados.transcricao
        || dados.content
        || dados.body
        || '';

      if (transcricaoTexto) {
        console.log(`✅ Transcrição encontrada no nó: ${nomeNo}`);
        console.log(`📝 Tamanho: ${transcricaoTexto.length} caracteres`);
        break;
      }
    }
  } catch (e) {
    // Nó não existe, continua tentando
  }
}

// Se ainda não encontrou, tenta do input direto
if (!transcricaoTexto) {
  transcricaoTexto = promptRow.data || promptRow.texto || '';
  if (transcricaoTexto) {
    console.log('✅ Transcrição encontrada no input direto');
  }
}

// Avisar se não encontrou transcrição
if (!transcricaoTexto) {
  console.warn('⚠️ ATENÇÃO: Transcrição não encontrada! O AI Agent vai receber texto vazio.');
}

// ========== MAPEAMENTO DE VARIÁVEIS ==========
const variaveis = {
  // Transcrição (principal)
  'transcricao_processada': transcricaoTexto,
  'texto': transcricaoTexto,
  'transcricao': transcricaoTexto,

  // Dados do Lead
  'nome_lead': dadosContexto.nome_lead || dadosContexto.contact_name || '',
  'tipo_call': dadosContexto.tipo_call || 'diagnostico',
  'nome_empresa': dadosContexto.nome_empresa || dadosContexto.empresa || '',

  // ICP e contexto
  'icp_segmento': dadosContexto.icp?.segmento || '',
  'tickets': JSON.stringify(dadosContexto.tickets || []),
  'red_flags_criticos': (dadosContexto.red_flags_criticos || []).join('\n- '),
  'objecoes': JSON.stringify(dadosContexto.objecoes || []),

  // IDs
  'location_id': dadosContexto.location_id || '',
  'contact_id': dadosContexto.contact_id || '',

  // Metadata
  'data_atual': new Date().toLocaleDateString('pt-BR'),
  'timestamp': new Date().toISOString()
};

// ========== RESOLVER VARIÁVEIS NO PROMPT ==========
let promptFinal = promptContent;

if (!promptContent) {
  console.error('❌ ERRO: Prompt vazio! Verifique se existe no Supabase.');
  promptFinal = 'ERRO: Prompt não encontrado no banco de dados.';
} else {
  for (const [key, value] of Object.entries(variaveis)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    const valorStr = value === null || value === undefined ? '' : String(value);
    promptFinal = promptFinal.replace(regex, valorStr);
  }
}

// Verificar placeholders não resolvidos
const placeholdersRestantes = promptFinal.match(/\{\{[^}]+\}\}/g) || [];
if (placeholdersRestantes.length > 0) {
  console.warn('⚠️ Placeholders não resolvidos:', placeholdersRestantes);
}

// Log para debug
console.log('============================================');
console.log('RESOLVER VARIÁVEIS - RESUMO:');
console.log(`Prompt: ${promptKey} v${version}`);
console.log(`Tamanho prompt: ${promptFinal.length} chars`);
console.log(`Transcrição: ${transcricaoTexto.length} chars`);
console.log(`Placeholders pendentes: ${placeholdersRestantes.length}`);
console.log('============================================');

// ========== OUTPUT ==========
// IMPORTANTE: Passar TODOS os dados necessários para os próximos nós!
return [{
  json: {
    // Prompt processado (para o AI Agent)
    prompt_final: promptFinal,

    // TRANSCRIÇÃO - IMPORTANTE! Os próximos nós precisam disso!
    texto: transcricaoTexto,
    transcricao_processada: transcricaoTexto,

    // Metadados do prompt
    prompt_metadata: {
      prompt_key: promptKey,
      version: version,
      original_length: promptContent.length,
      final_length: promptFinal.length
    },

    // Config do modelo
    model_config: promptRow.model_config || {},

    // Dados de contexto (para nós posteriores)
    dados_contexto: {
      ...dadosContexto,
      nome_lead: variaveis.nome_lead,
      tipo_call: variaveis.tipo_call,
      location_id: variaveis.location_id,
      contact_id: variaveis.contact_id
    },

    // Debug
    variaveis_resolvidas: Object.fromEntries(
      Object.entries(variaveis).filter(([k, v]) => v !== '' && v !== '[]')
    ),
    placeholders_nao_resolvidos: placeholdersRestantes,

    // Status
    success: promptContent.length > 0 && transcricaoTexto.length > 0,
    transcricao_encontrada: transcricaoTexto.length > 0,
    resolved_at: new Date().toISOString()
  }
}];
