/**
 * SCRIPT DE IMPLEMENTACAO AUTOMATICA - PROCESSO COMERCIAL MOTTIVME
 * GoHighLevel - Setup Completo do CRM
 *
 * IMPORTANTE: Execute este script no n8n ou diretamente via Node.js
 *
 * Pre-requisitos:
 * 1. API Key com permissoes de escrita na Location
 * 2. Node.js instalado (se executar local)
 * 3. npm install axios
 *
 * Execucao:
 * source ~/.env && node ghl-mottivme-setup.js
 */

const axios = require('axios');

// ============================================
// CONFIGURACAO
// ============================================

const CONFIG = {
  locationId: process.env.GHL_LOCATION_ID || 'ehlHgDeJS3sr8rCDcZtA',
  apiKey: process.env.GHL_API_KEY,
  baseURL: 'https://services.leadconnectorhq.com',
  version: '2021-07-28'
};

// Validacao de seguranca
if (!CONFIG.apiKey) {
  console.error('❌ ERRO: GHL_API_KEY nao definida!');
  console.error('Execute: source ~/.env');
  process.exit(1);
}

// Cliente HTTP
const api = axios.create({
  baseURL: CONFIG.baseURL,
  headers: {
    'Authorization': `Bearer ${CONFIG.apiKey}`,
    'Version': CONFIG.version,
    'Content-Type': 'application/json'
  }
});

// ============================================
// UTILITARIOS
// ============================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
  info: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  section: (title) => console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`)
};

// ============================================
// 1. CAMPOS PERSONALIZADOS - CONTACT
// ============================================

const CUSTOM_FIELDS_CONTACT = [
  // Campos de Qualificacao
  {
    name: 'lead_score',
    dataType: 'NUMERICAL',
    placeholder: 'Score de qualificacao (0-100)'
  },
  {
    name: 'classificacao_ia',
    dataType: 'SINGLE_OPTIONS',
    options: ['QUENTE', 'MORNO', 'FRIO', 'NAO_CLASSIFICADO'],
    placeholder: 'Temperatura do lead'
  },
  {
    name: 'origem_lead',
    dataType: 'SINGLE_OPTIONS',
    options: ['inbound_site', 'inbound_social', 'outbound_instagram', 'outbound_email', 'outbound_linkedin', 'indicacao', 'outro'],
    placeholder: 'Fonte de aquisicao'
  },
  {
    name: 'utm_source',
    dataType: 'TEXT',
    placeholder: 'UTM Source'
  },
  {
    name: 'utm_medium',
    dataType: 'TEXT',
    placeholder: 'UTM Medium'
  },
  {
    name: 'utm_campaign',
    dataType: 'TEXT',
    placeholder: 'UTM Campaign'
  },
  {
    name: 'utm_content',
    dataType: 'TEXT',
    placeholder: 'UTM Content'
  },
  {
    name: 'primeira_mensagem',
    dataType: 'LARGE_TEXT',
    placeholder: 'Primeira mensagem do lead'
  },
  {
    name: 'data_primeira_interacao',
    dataType: 'DATE',
    placeholder: 'Data primeira interacao'
  },

  // Campos BANT
  {
    name: 'budget_range',
    dataType: 'SINGLE_OPTIONS',
    options: ['ate_5k', '5k_15k', '15k_30k', 'acima_30k', 'nao_definido'],
    placeholder: 'Faixa de orcamento'
  },
  {
    name: 'authority_nivel',
    dataType: 'SINGLE_OPTIONS',
    options: ['decisor', 'influenciador', 'usuario', 'desconhecido'],
    placeholder: 'Poder de decisao'
  },
  {
    name: 'need_principal',
    dataType: 'SINGLE_OPTIONS',
    options: ['marketing_digital', 'automacao', 'ia', 'crm', 'consultoria', 'outro'],
    placeholder: 'Necessidade principal'
  },
  {
    name: 'timeline_urgencia',
    dataType: 'SINGLE_OPTIONS',
    options: ['imediato', '30_dias', '60_dias', '90_dias', 'sem_prazo'],
    placeholder: 'Urgencia'
  },
  {
    name: 'competitor_atual',
    dataType: 'TEXT',
    placeholder: 'Concorrente ou solucao atual'
  },
  {
    name: 'pain_point',
    dataType: 'LARGE_TEXT',
    placeholder: 'Dor principal do cliente'
  },

  // Campos de Operacao
  {
    name: 'ativar_ia',
    dataType: 'SINGLE_OPTIONS',
    options: ['sim', 'nao'],
    placeholder: 'IA respondendo'
  },
  {
    name: 'agente_ia',
    dataType: 'SINGLE_OPTIONS',
    options: ['SDR_Prospeccao', 'SDR_Inbound', 'Closer', 'Suporte', 'Nenhum'],
    placeholder: 'Perfil do agente IA'
  },
  {
    name: 'data_ativacao_ia',
    dataType: 'DATE',
    placeholder: 'Quando IA foi ativada'
  },
  {
    name: 'ultimo_contato',
    dataType: 'DATE',
    placeholder: 'Data ultima interacao'
  },
  {
    name: 'motivo_perda',
    dataType: 'SINGLE_OPTIONS',
    options: ['sem_budget', 'sem_fit', 'timing', 'concorrente', 'nao_respondeu', 'spam', 'outro'],
    placeholder: 'Motivo da perda'
  },
  {
    name: 'reaquecimento_data',
    dataType: 'DATE',
    placeholder: 'Data para reaquecer'
  }
];

// ============================================
// 2. CAMPOS PERSONALIZADOS - OPPORTUNITY
// ============================================

const CUSTOM_FIELDS_OPPORTUNITY = [
  {
    name: 'produto_interesse',
    dataType: 'SINGLE_OPTIONS',
    options: ['pack_starter', 'pack_growth', 'pack_scale', 'custom'],
    placeholder: 'Produto de interesse',
    model: 'opportunity'
  },
  {
    name: 'recorrencia',
    dataType: 'SINGLE_OPTIONS',
    options: ['mensal', 'trimestral', 'semestral', 'anual'],
    placeholder: 'Modelo de contrato',
    model: 'opportunity'
  },
  {
    name: 'desconto_aplicado',
    dataType: 'NUMERICAL',
    placeholder: 'Desconto em %',
    model: 'opportunity'
  },
  {
    name: 'data_fechamento_prevista',
    dataType: 'DATE',
    placeholder: 'Previsao de fechamento',
    model: 'opportunity'
  },
  {
    name: 'probabilidade_fechamento',
    dataType: 'NUMERICAL',
    placeholder: 'Probabilidade (0-100)',
    model: 'opportunity'
  }
];

async function createCustomFields() {
  log.section('CRIANDO CAMPOS PERSONALIZADOS - CONTACT');

  const results = { contact: [], opportunity: [] };

  // Campos de Contact
  for (const field of CUSTOM_FIELDS_CONTACT) {
    try {
      log.info(`Criando campo: ${field.name}`);

      const payload = {
        name: field.name,
        dataType: field.dataType,
        model: 'contact',
        placeholder: field.placeholder
      };

      if (field.dataType === 'SINGLE_OPTIONS' && field.options) {
        payload.options = field.options;
      }

      const response = await api.post(`/locations/${CONFIG.locationId}/customFields`, payload);

      results.contact.push({
        name: field.name,
        id: response.data.customField?.id || 'created',
        status: 'success'
      });

      log.info(`Campo ${field.name} criado com sucesso!`);
      await sleep(300);

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        log.warn(`Campo ${field.name} ja existe, pulando...`);
        results.contact.push({ name: field.name, status: 'already_exists' });
      } else {
        log.error(`Erro ao criar ${field.name}: ${errorMsg}`);
        results.contact.push({ name: field.name, status: 'error', error: errorMsg });
      }
    }
  }

  // Campos de Opportunity
  log.section('CRIANDO CAMPOS PERSONALIZADOS - OPPORTUNITY');

  for (const field of CUSTOM_FIELDS_OPPORTUNITY) {
    try {
      log.info(`Criando campo: ${field.name}`);

      const payload = {
        name: field.name,
        dataType: field.dataType,
        model: 'opportunity',
        placeholder: field.placeholder
      };

      if (field.dataType === 'SINGLE_OPTIONS' && field.options) {
        payload.options = field.options;
      }

      const response = await api.post(`/locations/${CONFIG.locationId}/customFields`, payload);

      results.opportunity.push({
        name: field.name,
        id: response.data.customField?.id || 'created',
        status: 'success'
      });

      log.info(`Campo ${field.name} criado com sucesso!`);
      await sleep(300);

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        log.warn(`Campo ${field.name} ja existe, pulando...`);
        results.opportunity.push({ name: field.name, status: 'already_exists' });
      } else {
        log.error(`Erro ao criar ${field.name}: ${errorMsg}`);
        results.opportunity.push({ name: field.name, status: 'error', error: errorMsg });
      }
    }
  }

  return results;
}

// ============================================
// 3. TAGS
// ============================================

const TAGS = [
  // Origem
  'origem-inbound-site',
  'origem-inbound-social',
  'origem-outbound-instagram',
  'origem-outbound-email',
  'origem-outbound-linkedin',
  'origem-indicacao',

  // Qualificacao
  'lead-prospectado-ia',
  'lead-classificado-ia',
  'mql',
  'sql',
  'perdido',

  // Temperatura
  'temperatura-quente',
  'temperatura-morna',
  'temperatura-fria',

  // Interesse (Produto)
  'interesse-marketing-digital',
  'interesse-automacao',
  'interesse-ia',
  'interesse-crm',
  'interesse-consultoria',

  // Operacionais
  'ia-ativada',
  'transicao-closer',
  'follow-up-pendente',
  'reuniao-marcada',
  'proposta-enviada',
  'contrato-assinado',
  'reaquecimento',

  // Status Pipeline
  'novo-lead',
  'em-qualificacao',
  'qualificado',
  'negociacao',
  'fechado-ganho',
  'fechado-perdido'
];

async function createTags() {
  log.section('CRIANDO TAGS');

  const results = [];

  for (const tagName of TAGS) {
    try {
      log.info(`Criando tag: ${tagName}`);

      const payload = {
        name: tagName
      };

      const response = await api.post(`/locations/${CONFIG.locationId}/tags`, payload);

      results.push({
        name: tagName,
        id: response.data.tag?.id || 'created',
        status: 'success'
      });

      log.info(`Tag ${tagName} criada com sucesso!`);
      await sleep(200);

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;

      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        log.warn(`Tag ${tagName} ja existe, pulando...`);
        results.push({ name: tagName, status: 'already_exists' });
      } else {
        log.error(`Erro ao criar ${tagName}: ${errorMsg}`);
        results.push({ name: tagName, status: 'error', error: errorMsg });
      }
    }
  }

  return results;
}

// ============================================
// 4. PIPELINE
// ============================================

const PIPELINE_CONFIG = {
  name: 'Pipeline Comercial - MOTTIVME',
  stages: [
    { name: 'Novo Lead - Inbound', position: 1 },
    { name: 'Novo Lead - Outbound', position: 2 },
    { name: 'Em Qualificacao', position: 3 },
    { name: 'Qualificado (MQL)', position: 4 },
    { name: 'Reuniao Agendada', position: 5 },
    { name: 'Reuniao Realizada', position: 6 },
    { name: 'Proposta Enviada', position: 7 },
    { name: 'Negociacao', position: 8 },
    { name: 'Fechado Ganho', position: 9 },
    { name: 'Fechado Perdido', position: 10 },
    { name: 'Reaquecimento', position: 11 }
  ]
};

async function createPipeline() {
  log.section('PIPELINE - CONFIGURACAO MANUAL NECESSARIA');

  // A API PIT nao tem permissao para criar pipelines
  // Pipeline deve ser criado manualmente no GHL

  console.log('\n⚠️  NOTA: Pipeline deve ser criado MANUALMENTE no GHL');
  console.log('    A API key PIT nao tem permissao para criar pipelines.\n');

  console.log('📋 ESTAGIOS PARA CRIAR:');
  PIPELINE_CONFIG.stages.forEach((stage, index) => {
    console.log(`   ${index + 1}. ${stage.name}`);
  });

  console.log('\n📍 ACESSE:');
  console.log(`   https://app.socialfy.me/v2/location/${CONFIG.locationId}/opportunities/list\n`);

  console.log('🔧 PASSOS:');
  console.log('   1. Clique em "Pipelines" no menu lateral');
  console.log('   2. Clique em "Add Pipeline"');
  console.log(`   3. Nome: "${PIPELINE_CONFIG.name}"`);
  console.log('   4. Adicione cada estagio listado acima');
  console.log('   5. Salve o pipeline\n');

  return {
    status: 'manual_required',
    name: PIPELINE_CONFIG.name,
    stages: PIPELINE_CONFIG.stages,
    url: `https://app.socialfy.me/v2/location/${CONFIG.locationId}/opportunities/list`
  };
}

// ============================================
// 5. WEBHOOK PARA N8N
// ============================================

const WEBHOOKS_N8N = [
  {
    name: 'Novo Lead Inbound',
    triggerType: 'contact_created',
    url: 'https://cliente-a1.mentorfy.io/webhook/novo-lead-inbound'
  },
  {
    name: 'Mensagem Recebida',
    triggerType: 'inbound_message',
    url: 'https://cliente-a1.mentorfy.io/webhook/ghl-mensagem-recebida'
  },
  {
    name: 'Reuniao Agendada',
    triggerType: 'appointment_created',
    url: 'https://cliente-a1.mentorfy.io/webhook/reuniao-agendada'
  },
  {
    name: 'Oportunidade Atualizada',
    triggerType: 'opportunity_status_update',
    url: 'https://cliente-a1.mentorfy.io/webhook/oportunidade-atualizada'
  }
];

async function listWebhooks() {
  log.section('WEBHOOKS PARA CONFIGURAR NO GHL');

  console.log('\n⚠️  NOTA: Webhooks devem ser configurados manualmente no GHL');
  console.log('    Acesse: https://app.socialfy.me/v2/location/ehlHgDeJS3sr8rCDcZtA/automation\n');

  console.log('Webhooks recomendados:\n');

  WEBHOOKS_N8N.forEach((webhook, index) => {
    console.log(`${index + 1}. ${webhook.name}`);
    console.log(`   Trigger: ${webhook.triggerType}`);
    console.log(`   URL: ${webhook.url}\n`);
  });

  return WEBHOOKS_N8N;
}

// ============================================
// 6. RESUMO DE CONFIGURACAO
// ============================================

function generateConfigSummary(results) {
  log.section('RESUMO DA IMPLEMENTACAO');

  console.log('\n📊 CAMPOS PERSONALIZADOS (CONTACT):');
  console.log(`   ✅ Criados: ${results.customFields.contact.filter(f => f.status === 'success').length}`);
  console.log(`   ⚠️  Ja existiam: ${results.customFields.contact.filter(f => f.status === 'already_exists').length}`);
  console.log(`   ❌ Erros: ${results.customFields.contact.filter(f => f.status === 'error').length}`);

  console.log('\n📊 CAMPOS PERSONALIZADOS (OPPORTUNITY):');
  console.log(`   ✅ Criados: ${results.customFields.opportunity.filter(f => f.status === 'success').length}`);
  console.log(`   ⚠️  Ja existiam: ${results.customFields.opportunity.filter(f => f.status === 'already_exists').length}`);
  console.log(`   ❌ Erros: ${results.customFields.opportunity.filter(f => f.status === 'error').length}`);

  console.log('\n🏷️  TAGS:');
  console.log(`   ✅ Criadas: ${results.tags.filter(t => t.status === 'success').length}`);
  console.log(`   ⚠️  Ja existiam: ${results.tags.filter(t => t.status === 'already_exists').length}`);
  console.log(`   ❌ Erros: ${results.tags.filter(t => t.status === 'error').length}`);

  console.log('\n📈 PIPELINE:');
  console.log(`   Status: ${results.pipeline.status}`);
  if (results.pipeline.status === 'manual_required') {
    console.log(`   ⚠️  Criar manualmente: ${results.pipeline.name}`);
  } else if (results.pipeline.id) {
    console.log(`   ID: ${results.pipeline.id}`);
  }

  console.log('\n' + '='.repeat(60));
}

// ============================================
// FUNCAO PRINCIPAL
// ============================================

async function main() {
  console.log('\n🚀 INICIANDO SETUP CRM - MOTTIVME\n');
  console.log(`Location ID: ${CONFIG.locationId}`);
  console.log(`API Base: ${CONFIG.baseURL}\n`);

  const results = {
    customFields: { contact: [], opportunity: [] },
    tags: [],
    pipeline: null,
    webhooks: []
  };

  try {
    // 1. Criar campos personalizados
    results.customFields = await createCustomFields();

    // 2. Criar tags
    results.tags = await createTags();

    // 3. Criar pipeline
    results.pipeline = await createPipeline();

    // 4. Listar webhooks para configuracao manual
    results.webhooks = await listWebhooks();

    // Resumo
    generateConfigSummary(results);

    console.log('\n✅ SETUP CONCLUIDO!\n');

    console.log('⚠️  PROXIMOS PASSOS MANUAIS:');
    console.log('1. Configurar webhooks no GHL (listados acima)');
    console.log('2. Criar automacoes/workflows no GHL');
    console.log('3. Configurar workflows no n8n');
    console.log('4. Testar fluxo completo com lead de teste');
    console.log('5. Documentar e treinar equipe\n');

    // Salvar resultado em arquivo JSON
    const fs = require('fs');
    const outputPath = './ghl-mottivme-setup-result.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📄 Resultado salvo em: ${outputPath}\n`);

  } catch (error) {
    log.error(`Erro fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// ============================================
// FUNCOES DE UTILIDADE EXTRAS
// ============================================

/**
 * Verificar campos existentes
 */
async function listExistingFields() {
  try {
    const response = await api.get(`/locations/${CONFIG.locationId}/customFields`);
    return response.data.customFields || [];
  } catch (error) {
    log.error(`Erro ao listar campos: ${error.message}`);
    return [];
  }
}

/**
 * Verificar tags existentes
 */
async function listExistingTags() {
  try {
    const response = await api.get(`/locations/${CONFIG.locationId}/tags`);
    return response.data.tags || [];
  } catch (error) {
    log.error(`Erro ao listar tags: ${error.message}`);
    return [];
  }
}

/**
 * Verificar pipelines existentes
 */
async function listExistingPipelines() {
  try {
    const response = await api.get(`/opportunities/pipelines?locationId=${CONFIG.locationId}`);
    return response.data.pipelines || [];
  } catch (error) {
    log.error(`Erro ao listar pipelines: ${error.message}`);
    return [];
  }
}

// ============================================
// EXECUCAO
// ============================================

// Executar se chamado diretamente
if (require.main === module) {
  // Verificar argumentos
  const args = process.argv.slice(2);

  if (args.includes('--list-fields')) {
    listExistingFields().then(fields => {
      console.log('Campos existentes:', JSON.stringify(fields, null, 2));
    });
  } else if (args.includes('--list-tags')) {
    listExistingTags().then(tags => {
      console.log('Tags existentes:', JSON.stringify(tags, null, 2));
    });
  } else if (args.includes('--list-pipelines')) {
    listExistingPipelines().then(pipelines => {
      console.log('Pipelines existentes:', JSON.stringify(pipelines, null, 2));
    });
  } else {
    main().catch(console.error);
  }
}

// Exportar funcoes para uso em n8n ou outros scripts
module.exports = {
  createCustomFields,
  createTags,
  createPipeline,
  listExistingFields,
  listExistingTags,
  listExistingPipelines,
  CONFIG,
  CUSTOM_FIELDS_CONTACT,
  CUSTOM_FIELDS_OPPORTUNITY,
  TAGS,
  PIPELINE_CONFIG,
  WEBHOOKS_N8N
};
