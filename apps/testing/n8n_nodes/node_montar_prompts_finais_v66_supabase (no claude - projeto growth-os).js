// ═══════════════════════════════════════════════════════════════════════════
// MONTAR PROMPTS FINAIS v6.6 - VERSÃO SUPABASE
// Pega prompts modulares do campo prompts_by_mode do Supabase
// ═══════════════════════════════════════════════════════════════════════════

const prev = $input.item.json;

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PARA SUBSTITUIR VARIÁVEIS MUSTACHE
// ─────────────────────────────────────────────────────────────────────────────
function replaceVars(template, vars) {
  if (!template) return '';
  let result = template;

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, value || '');
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIÁVEIS PARA SUBSTITUIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
const variaveis = {
  modo_agente: prev.agent_type || 'sdr_inbound',
  source: prev.source || 'instagram',
  full_name: prev.full_name || 'Visitante',
  timezone: 'America/Sao_Paulo',
  agente: prev.agent_name || 'Isabella',
  data_hora: prev.data_hora,
  status_pagamento: prev.status_pagamento || 'nenhum',
  preferencia_audio_texto: prev.preferencia_audio_texto || 'texto'
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECTAR MODO ATIVO (agente_ia)
// ─────────────────────────────────────────────────────────────────────────────
const modoAtivo = prev.agente_ia || prev.agent_type || 'sdr_inbound';

// ─────────────────────────────────────────────────────────────────────────────
// PEGAR PROMPTS DO SUPABASE (prompts_by_mode)
// ─────────────────────────────────────────────────────────────────────────────
const promptsDoAgente = prev.prompts_by_mode || {};

// Normalizar o modo para encontrar no JSON
function normalizarModo(modo) {
  const modoLower = (modo || '').toLowerCase().trim();

  // Mapeamento de aliases
  const aliases = {
    'sdr': 'sdr_inbound',
    'inbound': 'sdr_inbound',
    'social_seller': 'social_seller_instagram',
    'instagram': 'social_seller_instagram',
    'agendamento': 'scheduler',
    'followup': 'followuper',
    'objecao': 'objection_handler',
    'objecoes': 'objection_handler',
    'reativador': 'reativador_base'
  };

  return aliases[modoLower] || modoLower;
}

const modoNormalizado = normalizarModo(modoAtivo);

// Pegar o prompt do modo ativo (ou fallback para sdr_inbound)
const promptModoAtivo = promptsDoAgente[modoNormalizado]
  || promptsDoAgente['sdr_inbound']
  || '';

// Prompt base vem do system_prompt do agente
const promptBase = prev.system_prompt || '';

// ─────────────────────────────────────────────────────────────────────────────
// MONTAR SYSTEM PROMPT FINAL
// ─────────────────────────────────────────────────────────────────────────────
let systemPrompt = promptBase + '\n\n' + promptModoAtivo;

// Substituir variáveis
systemPrompt = replaceVars(systemPrompt, variaveis);

// ─────────────────────────────────────────────────────────────────────────────
// REGRA DINÂMICA DE SAUDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
let regraSaudacao = '';
const hora = prev.hora_numero;
const historicoExiste = prev.historico_existe;

if (!historicoExiste) {
  if (hora >= 5 && hora < 12) {
    regraSaudacao = '\n\n<regra_saudacao>\nÉ a PRIMEIRA mensagem. Inicie com "Bom dia" de forma calorosa.\n</regra_saudacao>';
  } else if (hora >= 12 && hora < 18) {
    regraSaudacao = '\n\n<regra_saudacao>\nÉ a PRIMEIRA mensagem. Inicie com "Boa tarde" de forma calorosa.\n</regra_saudacao>';
  } else {
    regraSaudacao = '\n\n<regra_saudacao>\nÉ a PRIMEIRA mensagem. Inicie com "Boa noite" de forma calorosa.\n</regra_saudacao>';
  }
} else {
  regraSaudacao = '\n\n<regra_saudacao>\nConversa já iniciada. NÃO repita saudação. Continue naturalmente.\n</regra_saudacao>';
}

systemPrompt += regraSaudacao;

// ─────────────────────────────────────────────────────────────────────────────
// MONTAR BLOCO DE RESPOSTAS DO FORMULÁRIO DE TRÁFEGO
// ─────────────────────────────────────────────────────────────────────────────
let blocoFormularioTrafego = '';
const form = prev.formulario_trafego || {};
const isLeadTrafego = prev.is_lead_trafego || false;

if (isLeadTrafego) {
  const linhas = [];
  if (form.origem_campanha) linhas.push(`VEIO POR CAMPANHA: ${form.origem_campanha}`);
  if (form.procurou_ajuda) linhas.push(`PROCUROU AJUDA ANTES: ${form.procurou_ajuda}`);
  if (form.sintomas_atuais) linhas.push(`SINTOMAS ATUAIS: ${form.sintomas_atuais}`);
  if (form.mudanca_corpo) linhas.push(`MUDANÇA NO CORPO: ${form.mudanca_corpo}`);
  if (form.preferencia_consulta) linhas.push(`PREFERÊNCIA CONSULTA: ${form.preferencia_consulta}`);
  if (form.pronto_investir) linhas.push(`PRONTO PRA INVESTIR: ${form.pronto_investir}`);

  if (linhas.length > 0) {
    blocoFormularioTrafego = `\n<respostas_formulario_trafego>\n${linhas.join('\n')}\n</respostas_formulario_trafego>\n`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTAR USER PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const etiquetasStr = Array.isArray(prev.etiquetas)
  ? prev.etiquetas.join(', ')
  : (prev.etiquetas || 'nenhuma');

let userPrompt = `
<contexto_conversa>
LEAD: ${prev.full_name}
CANAL: ${prev.source}
DDD: ${prev.ddd || 'não identificado'}
DATA/HORA: ${prev.data_hora}
ETIQUETAS: ${etiquetasStr}
STATUS PAGAMENTO: ${prev.status_pagamento}
MODO ATIVO: ${modoAtivo}
</contexto_conversa>
`;

if (blocoFormularioTrafego) {
  userPrompt += blocoFormularioTrafego;
}

userPrompt += `
<hiperpersonalizacao>
${prev.contexto_hiperpersonalizado}
</hiperpersonalizacao>

<calendarios_disponiveis>
${prev.calendarios_formatados}

${prev.agendamento_info}
</calendarios_disponiveis>
`;

if (prev.historico_formatado) {
  userPrompt += `
<historico_conversa>
${prev.historico_formatado}
</historico_conversa>
`;
}

userPrompt += `
<mensagem_atual>
LEAD: ${prev.message}
</mensagem_atual>

Responda à mensagem acima como Isabella, seguindo as instruções do MODO ATIVO: ${modoAtivo}.`;

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT FINAL
// ─────────────────────────────────────────────────────────────────────────────
return {
  json: {
    system_prompt: systemPrompt,
    user_prompt: userPrompt,

    // Metadados para debug
    _meta: {
      agent_name: prev.agent_name || 'Isabella',
      agent_version: prev.version || 'v6.6',
      modo_ativo: modoAtivo,
      modo_normalizado: modoNormalizado,
      prompt_modo_encontrado: !!promptsDoAgente[modoNormalizado],
      contact_id: prev.contact_id,
      conversation_id: prev.conversation_id,
      historico_mensagens: prev.historico_existe ? 'sim' : 'não',
      hora_execucao: prev.data_hora,
      is_lead_trafego: isLeadTrafego,
      prompt_size: systemPrompt.length,
      modos_disponiveis: Object.keys(promptsDoAgente)
    }
  }
};
