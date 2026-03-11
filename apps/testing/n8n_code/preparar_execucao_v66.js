// ═══════════════════════════════════════════════════════════════════════════
// PREPARAR EXECUÇÃO + IDENTIFICAR CONTEXTO v6.6
// Versão corrigida que PEGA o agente_ia do customData
// ═══════════════════════════════════════════════════════════════════════════

// Pegar dados do agente (vem do node anterior - Buscar Agente Ativo)
const agent = $input.item.json;

// Pegar dados das mensagens do node Set mensagens
const mensagens = $('Set mensagens2').first().json;

// Pegar customData do webhook original
const customData = $('Mensagem recebida').first().json.body?.customData || {};

// ─────────────────────────────────────────────────────────────────────────────
// PARSE SEGURO DE JSON
// ─────────────────────────────────────────────────────────────────────────────
function safeParseJSON(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.log('Erro parsing JSON:', e.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRAIR DDD DO TELEFONE
// ─────────────────────────────────────────────────────────────────────────────
function extrairDDD(telefone) {
  if (!telefone) return null;
  const limpo = telefone.replace(/\D/g, '');

  if (limpo.startsWith('55') && limpo.length >= 12) {
    return limpo.substring(2, 4);
  }
  if (limpo.length >= 10 && limpo.length <= 11) {
    return limpo.substring(0, 2);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINAR PERÍODO DO DIA
// ─────────────────────────────────────────────────────────────────────────────
function getPeriodoHorario() {
  const agora = new Date();
  const hora = agora.getHours();

  if (hora >= 5 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  return 'noite';
}

// ─────────────────────────────────────────────────────────────────────────────
// GERAR CONTEXTO HIPERPERSONALIZADO
// ─────────────────────────────────────────────────────────────────────────────
function gerarContextoHiperpersonalizado(ddd, periodo, hyperConfig) {
  const contextos = [];

  if (hyperConfig.personalizacao_por_ddd && ddd) {
    const dddConfig = hyperConfig.personalizacao_por_ddd[ddd];
    if (dddConfig) {
      contextos.push(`[REGIÃO ${ddd}] ${dddConfig.contexto || ''}`);
      if (dddConfig.unidade_proxima) {
        contextos.push(`Unidade mais próxima: ${dddConfig.unidade_proxima}`);
      }
    }
  }

  if (hyperConfig.saudacoes_por_horario) {
    const saudacao = hyperConfig.saudacoes_por_horario[periodo];
    if (saudacao) {
      contextos.push(`Saudação recomendada: "${saudacao}"`);
    }
  }

  return contextos.length > 0
    ? contextos.join('\n')
    : 'Usar abordagem padrão empática e acolhedora';
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSEAR CONFIGURAÇÕES DO AGENTE
// ─────────────────────────────────────────────────────────────────────────────
const toolsConfig = safeParseJSON(agent.tools_config, {});
const businessConfig = safeParseJSON(agent.business_config, {});
const hyperpersonalization = safeParseJSON(agent.hyperpersonalization, {});
const qualificationConfig = safeParseJSON(agent.qualification_config, {});

// ─────────────────────────────────────────────────────────────────────────────
// DADOS CONTEXTUAIS
// ─────────────────────────────────────────────────────────────────────────────
const ddd = extrairDDD(mensagens.phone);
const periodo = getPeriodoHorario();
const agora = new Date();
const dataHora = agora.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'full',
  timeStyle: 'short'
});

const contextoHiper = gerarContextoHiperpersonalizado(ddd, periodo, hyperpersonalization);

// ─────────────────────────────────────────────────────────────────────────────
// FORMATAR HISTÓRICO
// ─────────────────────────────────────────────────────────────────────────────
let historicoFormatado = '';
if (mensagens.historico && mensagens.historico.length > 0) {
  historicoFormatado = mensagens.historico
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'LEAD' : 'ISABELLA'}: ${m.content}`)
    .join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECTAR MODO ATIVO (agente_ia do customData)
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE: Pegar do customData que vem do GHL
const agenteIA = customData.agente_ia
  || customData.agente_IA
  || customData['agente_ia']
  || mensagens.agente_ia
  || agent.agent_type
  || 'sdr_inbound';

console.log('>>> MODO ATIVO DETECTADO:', agenteIA);

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
return {
  json: {
    // Dados do agente
    agent_id: agent.id,
    agent_name: agent.agent_name || 'Isabella',
    agent_type: agent.agent_type,
    version: agent.version,
    system_prompt: agent.system_prompt,
    location_api_key: agent.location_api_key,

    // ⚠️ NOVO: Modo ativo do agente (vem do customData.agente_ia)
    agente_ia: agenteIA,

    // Configurações parseadas
    tools_config: toolsConfig,
    business_config: businessConfig,
    hyperpersonalization: hyperpersonalization,
    qualification_config: qualificationConfig,

    // Contexto da conversa
    contact_id: mensagens.contact_id,
    phone: mensagens.phone,
    full_name: mensagens.full_name,
    source: mensagens.source,
    message: mensagens.message,
    conversation_id: mensagens.conversation_id,
    etiquetas: mensagens.etiquetas,
    status_pagamento: mensagens.status_pagamento,
    preferencia_audio_texto: mensagens.preferencia_audio_texto,

    // Dados calculados
    ddd: ddd,
    periodo: periodo,
    data_hora: dataHora,
    contexto_hiperpersonalizado: contextoHiper,
    historico_formatado: historicoFormatado,
    historico_existe: mensagens.historico && mensagens.historico.length > 0,
    hora_numero: agora.getHours(),

    // Calendários
    calendarios_ghl: mensagens.calendarios_ghl || {},
    ghl_api_key: mensagens.ghl_api_key || '',

    // Dados do formulário de tráfego
    formulario_trafego: mensagens.formulario_trafego || {},
    is_lead_trafego: mensagens.is_lead_trafego || false
  }
};
