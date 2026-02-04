/**
 * GHL Snapshot - CRM Médico (MedFlow)
 * ====================================
 * Script para criar estrutura completa de CRM para clínicas e consultórios
 * Focado em: Captação, Agendamento, Confirmação e Fidelização
 *
 * NÃO INCLUI: Prontuário eletrônico, gestão financeira, estoque
 *
 * Uso: node ghl-snapshot-crm-medico.js <locationId>
 * Exemplo: node ghl-snapshot-crm-medico.js hHTtB7iZ4EUqQ3L2yQZK
 *
 * Criado: Janeiro 2026
 * Versão: 1.0.0
 */

const AGENCY_API_KEY = process.env.GHL_AGENCY_KEY || 'pit-3872ad13-41f7-4e76-a3ff-f2dee789f8d6';
const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

// ============================================
// CONFIGURAÇÃO DO SNAPSHOT - CRM MÉDICO
// ============================================

const SNAPSHOT_CONFIG = {
  name: 'CRM Médico - MedFlow',
  version: '1.0.0',
  description: 'Sistema de captação, agendamento e fidelização para clínicas médicas',

  // ==========================================
  // CUSTOM FIELDS (15 campos)
  // ==========================================
  customFields: [
    // === DADOS DO PACIENTE (5) ===
    {
      name: 'Data de Nascimento',
      dataType: 'DATE',
      model: 'contact',
      placeholder: 'Data de nascimento do paciente'
    },
    {
      name: 'CPF',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'CPF do paciente'
    },
    {
      name: 'Convênio',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Convênio do paciente',
      options: [
        'Particular',
        'Unimed',
        'Bradesco Saúde',
        'SulAmérica',
        'Amil',
        'Porto Seguro',
        'NotreDame Intermédica',
        'Hapvida',
        'Outro'
      ]
    },
    {
      name: 'Número Carteira Convênio',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'Número da carteira do convênio'
    },
    {
      name: 'Contato de Emergência',
      dataType: 'PHONE',
      model: 'contact',
      placeholder: 'Telefone para emergência'
    },

    // === PREFERÊNCIAS DE ATENDIMENTO (4) ===
    {
      name: 'Médico Preferencial',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'Médico de preferência do paciente'
    },
    {
      name: 'Especialidade de Interesse',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Especialidade procurada',
      options: [
        'Clínica Geral',
        'Cardiologia',
        'Dermatologia',
        'Endocrinologia',
        'Ginecologia',
        'Neurologia',
        'Oftalmologia',
        'Ortopedia',
        'Pediatria',
        'Psiquiatria',
        'Urologia',
        'Outro'
      ]
    },
    {
      name: 'Horário Preferencial',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Melhor horário para consultas',
      options: ['Manhã (8h-12h)', 'Tarde (12h-18h)', 'Noite (18h-21h)', 'Qualquer horário']
    },
    {
      name: 'Observações Especiais',
      dataType: 'LARGE_TEXT',
      model: 'contact',
      placeholder: 'Alergias, necessidades especiais, preferências...'
    },

    // === HISTÓRICO E ACOMPANHAMENTO (4) ===
    {
      name: 'Última Consulta',
      dataType: 'DATE',
      model: 'contact',
      placeholder: 'Data da última consulta realizada'
    },
    {
      name: 'Próximo Retorno Previsto',
      dataType: 'DATE',
      model: 'contact',
      placeholder: 'Data sugerida para retorno'
    },
    {
      name: 'Total de Consultas',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Quantidade total de consultas realizadas'
    },
    {
      name: 'Quantidade No-Show',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Quantas vezes não compareceu'
    },

    // === AUTOMAÇÃO E IA (2) ===
    {
      name: 'Ativar Lembretes',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Paciente aceita receber lembretes?',
      options: ['Sim', 'Não', 'Apenas SMS', 'Apenas WhatsApp']
    },
    {
      name: 'NPS Última Consulta',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Nota 0-10 da última pesquisa de satisfação'
    }
  ],

  // ==========================================
  // PIPELINES (2)
  // ==========================================
  pipelines: [
    {
      name: 'Jornada do Paciente',
      stages: [
        { name: '📥 Novo Lead', position: 0 },
        { name: '📞 Contato Realizado', position: 1 },
        { name: '📅 Agendado', position: 2 },
        { name: '✅ Confirmado', position: 3 },
        { name: '🏥 Atendido', position: 4 },
        { name: '🔄 Retorno Pendente', position: 5 },
        { name: '⭐ Fidelizado', position: 6 },
        { name: '❌ Não Compareceu', position: 7 },
        { name: '💤 Inativo', position: 8 }
      ]
    },
    {
      name: 'Captação Marketing',
      stages: [
        { name: 'Lead Frio', position: 0 },
        { name: 'Lead Morno', position: 1 },
        { name: 'Lead Quente', position: 2 },
        { name: 'Agendou', position: 3 },
        { name: 'Converteu', position: 4 },
        { name: 'Perdido', position: 5 }
      ]
    }
  ],

  // ==========================================
  // TAGS (40 tags organizadas por categoria)
  // ==========================================
  tags: [
    // === ORIGEM DO LEAD (8) ===
    'origem:google-ads',
    'origem:meta-ads',
    'origem:instagram-organico',
    'origem:indicacao-paciente',
    'origem:convenio',
    'origem:site',
    'origem:whatsapp-direto',
    'origem:telefone',

    // === ESPECIALIDADE (10) ===
    'esp:clinica-geral',
    'esp:cardiologia',
    'esp:dermatologia',
    'esp:endocrinologia',
    'esp:ginecologia',
    'esp:ortopedia',
    'esp:pediatria',
    'esp:psiquiatria',
    'esp:neurologia',
    'esp:outro',

    // === TIPO DE PACIENTE (5) ===
    'tipo:primeira-consulta',
    'tipo:retorno',
    'tipo:procedimento',
    'tipo:urgencia',
    'tipo:check-up',

    // === CONVÊNIO (6) ===
    'conv:particular',
    'conv:unimed',
    'conv:bradesco',
    'conv:sulamerica',
    'conv:amil',
    'conv:outro',

    // === STATUS (7) ===
    'status:vip',
    'status:fidelizado',
    'status:inativo-3m',
    'status:inativo-6m',
    'status:no-show-recorrente',
    'status:nps-detrator',
    'status:nps-promotor',

    // === AUTOMAÇÃO (4) ===
    'auto:lembrete-enviado',
    'auto:confirmou-consulta',
    'auto:nao-confirmou',
    'auto:pesquisa-enviada'
  ],

  // ==========================================
  // CALENDÁRIOS (3 templates)
  // ==========================================
  calendars: [
    {
      name: 'Consulta Primeira Vez',
      description: 'Agendamento para novos pacientes',
      slotDuration: 45, // minutos
      slotBuffer: 15,
      dateRange: 30, // dias disponíveis
      appointmentPerSlot: 1,
      appointmentPerDay: 16,
      officeHours: [
        { day: 'monday', start: '08:00', end: '18:00' },
        { day: 'tuesday', start: '08:00', end: '18:00' },
        { day: 'wednesday', start: '08:00', end: '18:00' },
        { day: 'thursday', start: '08:00', end: '18:00' },
        { day: 'friday', start: '08:00', end: '17:00' }
      ]
    },
    {
      name: 'Consulta Retorno',
      description: 'Agendamento para pacientes em retorno',
      slotDuration: 30,
      slotBuffer: 10,
      dateRange: 60,
      appointmentPerSlot: 1,
      appointmentPerDay: 20,
      officeHours: [
        { day: 'monday', start: '08:00', end: '18:00' },
        { day: 'tuesday', start: '08:00', end: '18:00' },
        { day: 'wednesday', start: '08:00', end: '18:00' },
        { day: 'thursday', start: '08:00', end: '18:00' },
        { day: 'friday', start: '08:00', end: '17:00' }
      ]
    },
    {
      name: 'Procedimento',
      description: 'Agendamento para procedimentos especiais',
      slotDuration: 60,
      slotBuffer: 30,
      dateRange: 45,
      appointmentPerSlot: 1,
      appointmentPerDay: 6,
      officeHours: [
        { day: 'monday', start: '09:00', end: '16:00' },
        { day: 'wednesday', start: '09:00', end: '16:00' },
        { day: 'friday', start: '09:00', end: '14:00' }
      ]
    }
  ],

  // ==========================================
  // TEMPLATES DE MENSAGEM (WhatsApp)
  // ==========================================
  messageTemplates: [
    {
      name: 'Boas-vindas Novo Paciente',
      type: 'whatsapp',
      message: `Olá {{contact.first_name}}! 👋

Seja bem-vindo(a) à *{{location.name}}*!

Recebemos seu contato e estamos felizes em atendê-lo.

Como posso ajudar?
1️⃣ Agendar consulta
2️⃣ Informações sobre especialidades
3️⃣ Convênios aceitos
4️⃣ Falar com atendente

Responda com o número da opção desejada.`
    },
    {
      name: 'Confirmação Agendamento',
      type: 'whatsapp',
      message: `✅ *Consulta Agendada!*

Olá {{contact.first_name}},

Sua consulta está confirmada:

📅 *Data:* {{appointment.date}}
⏰ *Horário:* {{appointment.time}}
👨‍⚕️ *Profissional:* {{appointment.staff}}
📍 *Local:* {{location.address}}

*Importante:*
• Chegue 15 minutos antes
• Traga documento com foto
• Traga carteira do convênio (se aplicável)

Precisa remarcar? Responda esta mensagem.`
    },
    {
      name: 'Lembrete 24h',
      type: 'whatsapp',
      message: `⏰ *Lembrete de Consulta*

Olá {{contact.first_name}}!

Sua consulta é *amanhã*:

📅 {{appointment.date}} às {{appointment.time}}
👨‍⚕️ {{appointment.staff}}
📍 {{location.address}}

Por favor, confirme sua presença:
✅ Responda *SIM* para confirmar
❌ Responda *NÃO* para reagendar

Contamos com você! 😊`
    },
    {
      name: 'Lembrete 2h',
      type: 'whatsapp',
      message: `🔔 {{contact.first_name}}, sua consulta é em *2 horas*!

⏰ {{appointment.time}}
📍 {{location.address}}

📱 Como chegar: {{location.maps_link}}

Até logo! 👋`
    },
    {
      name: 'Pós-Consulta Agradecimento',
      type: 'whatsapp',
      message: `Olá {{contact.first_name}}! 😊

Obrigado por confiar na *{{location.name}}*!

Esperamos que seu atendimento tenha sido excelente.

Alguma dúvida sobre as orientações? Estamos aqui para ajudar!

Cuide-se! 💙`
    },
    {
      name: 'Pesquisa NPS',
      type: 'whatsapp',
      message: `{{contact.first_name}}, sua opinião é muito importante! 📊

De 0 a 10, qual a chance de você recomendar a *{{location.name}}* para amigos e familiares?

Responda apenas com o número (0-10).

Obrigado! 🙏`
    },
    {
      name: 'Lembrete Retorno',
      type: 'whatsapp',
      message: `Olá {{contact.first_name}}! 👋

Faz um tempo desde sua última consulta e o Dr(a). indicou um retorno para acompanhamento.

Que tal agendar agora?

📅 Clique aqui para ver horários disponíveis:
{{calendar.link}}

Qualquer dúvida, estamos à disposição! 😊`
    },
    {
      name: 'Reativação Paciente Inativo',
      type: 'whatsapp',
      message: `Olá {{contact.first_name}}!

Sentimos sua falta na *{{location.name}}*! 💙

Que tal agendar um check-up? Cuidar da saúde regularmente faz toda a diferença.

Temos horários disponíveis esta semana. Posso agendar para você?`
    },
    {
      name: 'Aniversário',
      type: 'whatsapp',
      message: `🎂 *Feliz Aniversário, {{contact.first_name}}!*

A equipe da *{{location.name}}* deseja um dia cheio de alegria e muita saúde!

Obrigado por fazer parte da nossa família. 💙

Um abraço carinhoso de toda equipe! 🎉`
    },
    {
      name: 'No-Show Follow-up',
      type: 'whatsapp',
      message: `Olá {{contact.first_name}},

Notamos que você não pôde comparecer à consulta de hoje. Esperamos que esteja tudo bem! 🙏

Gostaria de reagendar? Temos horários disponíveis esta semana.

Se precisar de alguma ajuda, estamos aqui!`
    }
  ],

  // ==========================================
  // WORKFLOWS (Estrutura - criar manualmente no GHL)
  // ==========================================
  workflows: [
    {
      name: 'WF01 - Novo Lead',
      trigger: 'form_submitted',
      description: 'Ativado quando formulário é preenchido',
      steps: [
        'Criar/Atualizar contato',
        'Adicionar tag origem',
        'Mover para pipeline "Jornada do Paciente" > "Novo Lead"',
        'Enviar template "Boas-vindas Novo Paciente"',
        'Aguardar 1 hora',
        'Se não respondeu: Enviar SMS',
        'Aguardar 24 horas',
        'Se não respondeu: Enviar email',
        'Aguardar 72 horas',
        'Se não respondeu: Tag "lead-frio" + mover para remarketing'
      ]
    },
    {
      name: 'WF02 - Confirmação de Consulta',
      trigger: 'appointment_created',
      description: 'Ativado quando consulta é agendada',
      steps: [
        'Enviar template "Confirmação Agendamento" (imediato)',
        'Mover para "Agendado"',
        'Aguardar até 24h antes',
        'Enviar template "Lembrete 24h"',
        'Aguardar resposta por 4 horas',
        'Se SIM: Tag "auto:confirmou-consulta" + Mover para "Confirmado"',
        'Se NÃO: Notificar recepção + Oferecer reagendamento',
        'Se sem resposta: Tag "auto:nao-confirmou" + Notificar recepção',
        'Aguardar até 2h antes',
        'Enviar template "Lembrete 2h"'
      ]
    },
    {
      name: 'WF03 - Pós-Consulta',
      trigger: 'appointment_status_showed',
      description: 'Ativado quando status muda para "Atendido"',
      steps: [
        'Atualizar campo "Última Consulta" com data atual',
        'Incrementar campo "Total de Consultas"',
        'Mover para "Atendido"',
        'Aguardar 2 horas',
        'Enviar template "Pós-Consulta Agradecimento"',
        'Aguardar 7 dias',
        'Enviar template "Pesquisa NPS"',
        'Se NPS <= 6: Tag "status:nps-detrator" + Notificar gestão',
        'Se NPS >= 9: Tag "status:nps-promotor" + Pedir avaliação Google'
      ]
    },
    {
      name: 'WF04 - Lembrete de Retorno',
      trigger: 'date_field',
      triggerField: 'Próximo Retorno Previsto',
      triggerOffset: -7, // 7 dias antes
      description: 'Ativado 7 dias antes da data de retorno',
      steps: [
        'Mover para "Retorno Pendente"',
        'Enviar template "Lembrete Retorno"',
        'Aguardar 3 dias',
        'Se não agendou: Enviar SMS',
        'Aguardar 7 dias',
        'Se não agendou: Enviar email',
        'Aguardar 30 dias',
        'Se não agendou: Tag "status:inativo-3m"'
      ]
    },
    {
      name: 'WF05 - Aniversário',
      trigger: 'date_field',
      triggerField: 'Data de Nascimento',
      triggerOffset: 0, // no dia
      description: 'Ativado na data de aniversário',
      steps: [
        'Enviar template "Aniversário" às 9h'
      ]
    },
    {
      name: 'WF06 - Paciente Inativo',
      trigger: 'date_field',
      triggerField: 'Última Consulta',
      triggerOffset: 180, // 6 meses depois
      description: 'Ativado 6 meses após última consulta',
      steps: [
        'Tag "status:inativo-6m"',
        'Mover para "Inativo"',
        'Enviar template "Reativação Paciente Inativo"',
        'Aguardar 7 dias',
        'Se não respondeu: Enviar email',
        'Aguardar 30 dias',
        'Se não respondeu: Mover para campanha de remarketing'
      ]
    },
    {
      name: 'WF07 - No-Show',
      trigger: 'appointment_status_no_show',
      description: 'Ativado quando paciente não comparece',
      steps: [
        'Incrementar campo "Quantidade No-Show"',
        'Mover para "Não Compareceu"',
        'Aguardar 1 hora',
        'Enviar template "No-Show Follow-up"',
        'Se No-Show >= 3: Tag "status:no-show-recorrente" + Notificar gestão'
      ]
    },
    {
      name: 'WF08 - Lista de Espera',
      trigger: 'appointment_cancelled',
      description: 'Ativado quando consulta é cancelada',
      steps: [
        'Buscar contatos com tag "lista-espera" + mesma especialidade',
        'Enviar WhatsApp: "Surgiu uma vaga para [data]. Deseja agendar?"',
        'Aguardar 2 horas',
        'Se primeiro responder SIM: Criar agendamento + Remover tag',
        'Se não: Próximo da lista',
        'Repetir até vaga preenchida ou lista esgotada'
      ]
    }
  ],

  // ==========================================
  // FORMULÁRIOS (templates)
  // ==========================================
  forms: [
    {
      name: 'Captação Rápida - Ads',
      fields: ['first_name', 'phone', 'Especialidade de Interesse'],
      description: 'Formulário simples para tráfego pago'
    },
    {
      name: 'Pré-Agendamento Completo',
      fields: [
        'first_name', 'last_name', 'phone', 'email',
        'Data de Nascimento', 'Convênio', 'Número Carteira Convênio',
        'Especialidade de Interesse', 'Horário Preferencial',
        'Observações Especiais'
      ],
      description: 'Formulário completo para pré-agendamento'
    },
    {
      name: 'Pesquisa de Satisfação',
      fields: ['NPS Última Consulta', 'large_text_feedback'],
      description: 'Pesquisa NPS pós-consulta'
    }
  ]
};

// ============================================
// FUNÇÕES DE API
// ============================================

async function makeRequest(method, endpoint, body = null, locationId = null) {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${AGENCY_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': API_VERSION
  };

  if (locationId) {
    headers['Channel'] = 'location';
    headers['Source'] = locationId;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return { success: false, error: data, status: response.status };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CRIAR CUSTOM FIELDS
// ============================================

async function createCustomFields(locationId) {
  console.log('\n📋 CRIANDO CUSTOM FIELDS...\n');
  const results = [];

  for (const field of SNAPSHOT_CONFIG.customFields) {
    const body = {
      name: field.name,
      dataType: field.dataType,
      model: field.model,
      placeholder: field.placeholder
    };

    if (field.options) {
      body.options = field.options;
    }

    console.log(`  → Criando: ${field.name}...`);

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/customFields`,
      body
    );

    if (result.success) {
      console.log(`    ✅ Criado: ${field.name}`);
      results.push({ name: field.name, id: result.data.customField?.id, status: 'created' });
    } else if (result.status === 422 || result.error?.message?.includes('already exists')) {
      console.log(`    ⚠️ Já existe: ${field.name}`);
      results.push({ name: field.name, status: 'exists' });
    } else {
      console.log(`    ❌ Falhou: ${field.name}`);
      results.push({ name: field.name, status: 'failed', error: result.error });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

// ============================================
// CRIAR PIPELINES
// ============================================

async function createPipelines(locationId) {
  console.log('\n🔄 CRIANDO PIPELINES...\n');
  const results = [];

  for (const pipeline of SNAPSHOT_CONFIG.pipelines) {
    console.log(`  → Criando: ${pipeline.name}...`);

    const body = {
      name: pipeline.name,
      stages: pipeline.stages.map(stage => ({
        name: stage.name,
        position: stage.position
      }))
    };

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/pipelines`,
      body
    );

    if (result.success) {
      console.log(`    ✅ Criado: ${pipeline.name}`);
      console.log(`       Estágios: ${pipeline.stages.map(s => s.name).join(' → ')}`);
      results.push({
        name: pipeline.name,
        id: result.data.pipeline?.id,
        status: 'created'
      });
    } else {
      console.log(`    ❌ Falhou: ${pipeline.name}`);
      results.push({ name: pipeline.name, status: 'failed', error: result.error });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

// ============================================
// CRIAR TAGS
// ============================================

async function createTags(locationId) {
  console.log('\n🏷️ CRIANDO TAGS...\n');
  const results = [];

  // Agrupar tags por categoria para log mais limpo
  const tagsByCategory = {};
  SNAPSHOT_CONFIG.tags.forEach(tag => {
    const category = tag.split(':')[0];
    if (!tagsByCategory[category]) {
      tagsByCategory[category] = [];
    }
    tagsByCategory[category].push(tag);
  });

  for (const [category, tags] of Object.entries(tagsByCategory)) {
    console.log(`  📁 Categoria: ${category}`);

    for (const tagName of tags) {
      const result = await makeRequest(
        'POST',
        `/locations/${locationId}/tags`,
        { name: tagName }
      );

      if (result.success) {
        console.log(`    ✅ ${tagName}`);
        results.push({ name: tagName, status: 'created' });
      } else if (result.error?.message?.includes('already exists')) {
        console.log(`    ⚠️ ${tagName} (já existe)`);
        results.push({ name: tagName, status: 'exists' });
      } else {
        console.log(`    ❌ ${tagName}`);
        results.push({ name: tagName, status: 'failed' });
      }

      await new Promise(r => setTimeout(r, 150));
    }
  }

  return results;
}

// ============================================
// CRIAR CALENDÁRIOS
// ============================================

async function createCalendars(locationId) {
  console.log('\n📅 CRIANDO CALENDÁRIOS...\n');
  const results = [];

  for (const calendar of SNAPSHOT_CONFIG.calendars) {
    console.log(`  → Criando: ${calendar.name}...`);

    // Nota: A API de calendários do GHL requer estrutura específica
    // Este é um template - ajustar conforme documentação atual
    const body = {
      name: calendar.name,
      description: calendar.description,
      slotDuration: calendar.slotDuration,
      slotBuffer: calendar.slotBuffer,
      slotInterval: calendar.slotDuration,
      appointmentPerSlot: calendar.appointmentPerSlot,
      appointmentPerDay: calendar.appointmentPerDay,
      allowReschedule: true,
      allowCancellation: true
    };

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/calendars`,
      body
    );

    if (result.success) {
      console.log(`    ✅ Criado: ${calendar.name}`);
      results.push({ name: calendar.name, id: result.data.calendar?.id, status: 'created' });
    } else {
      console.log(`    ❌ Falhou: ${calendar.name} - Criar manualmente no GHL`);
      results.push({ name: calendar.name, status: 'manual', config: calendar });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

// ============================================
// VERIFICAR LOCATION
// ============================================

async function verifyLocation(locationId) {
  console.log(`\n🔍 Verificando location: ${locationId}...`);

  const result = await makeRequest('GET', `/locations/${locationId}`);

  if (result.success) {
    const name = result.data.location?.name || result.data.name || 'N/A';
    console.log(`✅ Location válida: ${name}`);
    return { valid: true, name };
  } else {
    console.log(`❌ Location inválida ou sem acesso`);
    return { valid: false };
  }
}

// ============================================
// GERAR INSTRUÇÕES DE WORKFLOWS
// ============================================

function generateWorkflowInstructions() {
  console.log('\n📝 INSTRUÇÕES PARA CRIAR WORKFLOWS MANUALMENTE:\n');
  console.log('=' .repeat(60));

  SNAPSHOT_CONFIG.workflows.forEach((wf, index) => {
    console.log(`\n${index + 1}. ${wf.name}`);
    console.log(`   Trigger: ${wf.trigger}`);
    if (wf.triggerField) {
      console.log(`   Campo: ${wf.triggerField} (offset: ${wf.triggerOffset} dias)`);
    }
    console.log(`   Descrição: ${wf.description}`);
    console.log(`   Passos:`);
    wf.steps.forEach((step, i) => {
      console.log(`     ${i + 1}. ${step}`);
    });
  });

  console.log('\n' + '=' .repeat(60));
}

// ============================================
// MAIN
// ============================================

async function applySnapshot(locationId) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        GHL SNAPSHOT - CRM MÉDICO (MedFlow) v1.0.0              ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Location ID: ${locationId.padEnd(46)}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // 1. Verificar location
  const location = await verifyLocation(locationId);
  if (!location.valid) {
    console.log('\n❌ Abortando: Location inválida');
    process.exit(1);
  }

  // 2. Criar Custom Fields
  const fieldsResults = await createCustomFields(locationId);

  // 3. Criar Pipelines
  const pipelinesResults = await createPipelines(locationId);

  // 4. Criar Tags
  const tagsResults = await createTags(locationId);

  // 5. Criar Calendários
  const calendarsResults = await createCalendars(locationId);

  // 6. Gerar instruções de workflows
  generateWorkflowInstructions();

  // 7. Resumo
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         RESUMO                                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');

  const fieldsCreated = fieldsResults.filter(r => r.status === 'created').length;
  const fieldsExists = fieldsResults.filter(r => r.status === 'exists').length;
  const pipelinesCreated = pipelinesResults.filter(r => r.status === 'created').length;
  const tagsCreated = tagsResults.filter(r => r.status === 'created').length;
  const tagsExists = tagsResults.filter(r => r.status === 'exists').length;
  const calendarsCreated = calendarsResults.filter(r => r.status === 'created').length;

  console.log(`║  Custom Fields: ${fieldsCreated} criados, ${fieldsExists} já existiam`.padEnd(63) + '║');
  console.log(`║  Pipelines:     ${pipelinesCreated}/${SNAPSHOT_CONFIG.pipelines.length} criados`.padEnd(63) + '║');
  console.log(`║  Tags:          ${tagsCreated} criadas, ${tagsExists} já existiam`.padEnd(63) + '║');
  console.log(`║  Calendários:   ${calendarsCreated}/${SNAPSHOT_CONFIG.calendars.length} criados`.padEnd(63) + '║');
  console.log(`║  Workflows:     ${SNAPSHOT_CONFIG.workflows.length} (criar manualmente)`.padEnd(63) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // 8. Próximos passos
  console.log('\n📌 PRÓXIMOS PASSOS:');
  console.log('   1. Criar os 8 workflows manualmente (instruções acima)');
  console.log('   2. Configurar templates de WhatsApp no Meta Business');
  console.log('   3. Conectar número de WhatsApp Business API');
  console.log('   4. Configurar horários dos calendários');
  console.log('   5. Criar landing pages de captação');
  console.log('   6. Testar fluxo completo com contato de teste');

  // 9. Salvar resultado
  const outputFile = `/tmp/ghl-snapshot-crm-medico-${locationId}.json`;
  const output = {
    locationId,
    locationName: location.name,
    snapshot: SNAPSHOT_CONFIG.name,
    version: SNAPSHOT_CONFIG.version,
    appliedAt: new Date().toISOString(),
    results: {
      customFields: fieldsResults,
      pipelines: pipelinesResults,
      tags: tagsResults,
      calendars: calendarsResults
    },
    manualSetup: {
      workflows: SNAPSHOT_CONFIG.workflows,
      messageTemplates: SNAPSHOT_CONFIG.messageTemplates,
      forms: SNAPSHOT_CONFIG.forms
    }
  };

  require('fs').writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n📄 Resultado completo salvo em: ${outputFile}`);

  return output;
}

// ============================================
// EXECUÇÃO
// ============================================

const locationId = process.argv[2];

if (!locationId) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        GHL SNAPSHOT - CRM MÉDICO (MedFlow) v1.0.0              ║
╚════════════════════════════════════════════════════════════════╝

Uso: node ghl-snapshot-crm-medico.js <locationId>

Exemplo:
  node ghl-snapshot-crm-medico.js hHTtB7iZ4EUqQ3L2yQZK

O que será criado:
  • ${SNAPSHOT_CONFIG.customFields.length} Custom Fields (dados do paciente, convênio, etc)
  • ${SNAPSHOT_CONFIG.pipelines.length} Pipelines (Jornada do Paciente, Captação)
  • ${SNAPSHOT_CONFIG.tags.length} Tags organizadas por categoria
  • ${SNAPSHOT_CONFIG.calendars.length} Calendários (Primeira vez, Retorno, Procedimento)
  • ${SNAPSHOT_CONFIG.workflows.length} Workflows (instruções para criar manualmente)
  • ${SNAPSHOT_CONFIG.messageTemplates.length} Templates de mensagem (referência)

Locations conhecidas:
  hHTtB7iZ4EUqQ3L2yQZK = Marcos Daniels F Test
  cd1uyzpJox6XPt4Vct8Y = Mottivme Sales (Principal)
`);
  process.exit(1);
}

applySnapshot(locationId).then(() => {
  console.log('\n✅ Snapshot CRM Médico aplicado com sucesso!\n');
}).catch(error => {
  console.error('\n❌ Erro ao aplicar snapshot:', error);
  process.exit(1);
});
