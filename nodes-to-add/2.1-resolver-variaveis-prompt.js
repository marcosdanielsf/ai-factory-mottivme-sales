// =====================================================
// NÓ 2.1 - RESOLVER VARIÁVEIS NO PROMPT
// =====================================================
// Inserir APÓS o nó "Buscar Prompt Ativo" (2.0)
// Substitui placeholders {{variavel}} pelos valores reais
// =====================================================
//
// FLUXO:
// [Preparar Dados] -> [Buscar Prompt] -> [ESTE NÓ] -> [AI Agent]
//
// DEPENDÊNCIAS:
// - Nó "Buscar Prompt Ativo" executado antes
// - Nó com dados do contexto (transcrição, lead, etc)
//
// =====================================================

// ========== CONFIGURAÇÃO ==========
// Nome dos nós que fornecem dados (ajustar conforme seu fluxo)
const NO_PROMPT = '2.0 Buscar Prompt Ativo'; // ou 'Buscar Prompt Ativo'
const NO_DADOS = '1.6 Preparar Dados'; // ou 'Preparar Dados', 'Config GHL + Dados Supabase'

// ========== OBTER DADOS ==========
// Dados do prompt buscado do Supabase
const promptData = $node[NO_PROMPT]?.json || $input.first()?.json || {};
const promptTemplate = promptData.prompt_content || '';

// Dados do contexto (transcrição, lead, etc)
// Tenta buscar do nó específico ou do input anterior
let dadosContexto = {};
try {
  dadosContexto = $node[NO_DADOS]?.json || {};
} catch (e) {
  // Se não encontrar o nó, usar dados passados junto com o prompt
  dadosContexto = promptData.dados_anteriores || $input.first()?.json || {};
}

// ========== MAPEAMENTO DE VARIÁVEIS ==========
// Mapeie aqui TODAS as variáveis possíveis do seu sistema
// O sistema é resiliente: se uma variável não existir, fica vazia

const variaveis = {
  // --- Dados da Transcrição/Call ---
  'transcricao_processada': dadosContexto.texto_transcricao
                            || dadosContexto.transcricao_processada
                            || dadosContexto.texto
                            || '',

  'transcricao_bruta': dadosContexto.transcricao_bruta
                       || dadosContexto.raw_transcription
                       || '',

  'tipo_call': dadosContexto.tipo_call
               || dadosContexto.call_type
               || 'diagnostico',

  'duracao_call': dadosContexto.duracao_call
                  || dadosContexto.duration
                  || '',

  // --- Dados do Lead ---
  'nome_lead': dadosContexto.nome_lead
               || dadosContexto.contact_name
               || dadosContexto.nome
               || '',

  'email_lead': dadosContexto.email_lead
                || dadosContexto.email
                || '',

  'telefone_lead': dadosContexto.telefone_lead
                   || dadosContexto.phone
                   || '',

  // --- Dados da Empresa ---
  'nome_empresa': dadosContexto.nome_empresa
                  || dadosContexto.empresa
                  || dadosContexto.company
                  || '',

  'segmento_empresa': dadosContexto.segmento
                      || dadosContexto.vertical
                      || '',

  'faturamento_empresa': dadosContexto.faturamento
                         || dadosContexto.revenue
                         || '',

  // --- ICP (Ideal Customer Profile) ---
  'icp_segmento': dadosContexto.icp?.segmento
                  || dadosContexto.icp_segmento
                  || '',

  'icp_faturamento': dadosContexto.icp?.faturamento_minimo
                     || dadosContexto.icp_faturamento
                     || '',

  'icp_cargo_decisor': dadosContexto.icp?.cargo_decisor
                       || dadosContexto.icp_cargo
                       || '',

  'icp_dor_principal': dadosContexto.icp?.dor_principal
                       || dadosContexto.icp_dor
                       || '',

  // --- Tickets/Produtos ---
  'tickets': (() => {
    const t = dadosContexto.tickets || [];
    if (Array.isArray(t)) {
      return JSON.stringify(t, null, 2);
    }
    return typeof t === 'string' ? t : JSON.stringify(t);
  })(),

  'ticket_medio': dadosContexto.ticket_medio
                  || dadosContexto.avg_ticket
                  || '',

  'ticket_minimo': dadosContexto.ticket_minimo
                   || dadosContexto.min_ticket
                   || '',

  // --- Red Flags ---
  'red_flags_criticos': (() => {
    const rf = dadosContexto.red_flags_criticos || [];
    return Array.isArray(rf) ? rf.join('\n- ') : rf;
  })(),

  'red_flags_moderados': (() => {
    const rf = dadosContexto.red_flags_moderados || [];
    return Array.isArray(rf) ? rf.join('\n- ') : rf;
  })(),

  // --- Objeções ---
  'objecoes': (() => {
    const o = dadosContexto.objecoes || [];
    if (Array.isArray(o)) {
      return JSON.stringify(o, null, 2);
    }
    return typeof o === 'string' ? o : JSON.stringify(o);
  })(),

  // --- Contexto GHL ---
  'location_id': dadosContexto.location_id
                 || dadosContexto.locationId
                 || '',

  'contact_id': dadosContexto.contact_id
                || dadosContexto.contactId
                || '',

  'pipeline_stage': dadosContexto.pipeline_stage
                    || dadosContexto.stage
                    || '',

  // --- Concorrência ---
  'concorrentes': (() => {
    const c = dadosContexto.concorrentes || [];
    if (Array.isArray(c)) {
      return JSON.stringify(c, null, 2);
    }
    return typeof c === 'string' ? c : JSON.stringify(c);
  })(),

  // --- Etapas do Funil ---
  'etapas_funil': (() => {
    const e = dadosContexto.etapas_funil || [];
    if (Array.isArray(e)) {
      return JSON.stringify(e, null, 2);
    }
    return typeof e === 'string' ? e : JSON.stringify(e);
  })(),

  // --- Metadata ---
  'data_atual': new Date().toLocaleDateString('pt-BR'),
  'hora_atual': new Date().toLocaleTimeString('pt-BR'),
  'timestamp': new Date().toISOString()
};

// ========== SUBSTITUIR PLACEHOLDERS ==========
function resolverVariaveis(template, vars) {
  if (!template || typeof template !== 'string') {
    return template;
  }

  let resultado = template;

  // Substituir cada variável
  for (const [key, value] of Object.entries(vars)) {
    // Regex para {{variavel}} com espaços opcionais
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');

    // Converter valor para string se necessário
    const valorStr = value === null || value === undefined ? '' : String(value);

    resultado = resultado.replace(regex, valorStr);
  }

  return resultado;
}

// Resolver o prompt
let promptFinal = resolverVariaveis(promptTemplate, variaveis);

// ========== VERIFICAR PLACEHOLDERS NÃO RESOLVIDOS ==========
const placeholdersRestantes = promptFinal.match(/\{\{[^}]+\}\}/g) || [];

if (placeholdersRestantes.length > 0) {
  console.warn('⚠️ Placeholders não resolvidos:', placeholdersRestantes);

  // Opção: Remover placeholders não resolvidos
  // placeholdersRestantes.forEach(ph => {
  //   promptFinal = promptFinal.replace(ph, '');
  // });
}

// ========== ESTATÍSTICAS ==========
const stats = {
  template_length: promptTemplate.length,
  final_length: promptFinal.length,
  variaveis_disponiveis: Object.keys(variaveis).length,
  variaveis_usadas: Object.entries(variaveis).filter(([k, v]) => v && promptTemplate.includes(`{{${k}}}`)).length,
  placeholders_nao_resolvidos: placeholdersRestantes.length
};

// ========== OUTPUT ==========
return [{
  json: {
    // Prompt final para usar no AI Agent
    prompt_final: promptFinal,

    // Metadados do prompt (para logging)
    prompt_metadata: {
      prompt_key: promptData.prompt_key,
      prompt_name: promptData.prompt_name,
      version: promptData.version,
      version_id: promptData.version_id,
      prompt_id: promptData.prompt_id,
      performance_score: promptData.performance_score
    },

    // Configuração do modelo (para o AI Agent)
    model_config: promptData.model_config || {},

    // Estatísticas de resolução
    resolution_stats: stats,

    // Lista de variáveis usadas (para debug)
    variaveis_resolvidas: Object.fromEntries(
      Object.entries(variaveis).filter(([k, v]) => v !== '' && v !== null)
    ),

    // Warnings
    placeholders_nao_resolvidos: placeholdersRestantes,

    // Flag de sucesso
    success: promptData.success !== false && placeholdersRestantes.length === 0,

    // Timestamp
    resolved_at: new Date().toISOString()
  }
}];

// =====================================================
// COMO USAR O PROMPT_FINAL NO AI AGENT:
// =====================================================
//
// No nó AI Agent, configure:
//
// System Message (usando expressão):
// ={{ $('2.1 Resolver Variáveis').item.json.prompt_final }}
//
// Ou se estiver usando Basic LLM Chain:
// ={{ $json.prompt_final }}
//
// =====================================================
