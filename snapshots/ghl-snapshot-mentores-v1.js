/**
 * GHL Snapshot - Universal Mentores & Prestadores de Servicos
 * ==============================================================
 * Unifica 8 funis de vendas com metodologias consolidadas:
 * - JP Bijari (Social Selling)
 * - BANT (Qualificacao)
 * - Concierge Protocol (Confirmacao)
 * - Sexy Canvas (Copywriting)
 * - Cavalo de Troia (Diagnostico)
 *
 * Funis suportados:
 * 1. Social Selling (Instagram DM)
 * 2. Webinario
 * 3. Aplicacao (High-Ticket)
 * 4. Iscador
 * 5. Isca Gratuita
 * 6. Isca Paga
 * 7. Diagnostico
 * 8. Sessao Estrategica
 *
 * Uso: node ghl-snapshot-mentores-v1.js <locationId>
 * Exemplo: node ghl-snapshot-mentores-v1.js hHTtB7iZ4EUqQ3L2yQZK
 *
 * Criado: Janeiro 2026
 * Versao: 1.0.0
 * MOTTIVME
 */

const AGENCY_API_KEY = process.env.GHL_AGENCY_KEY || 'pit-3872ad13-41f7-4e76-a3ff-f2dee789f8d6';
const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

// ============================================
// CONFIGURACAO DO SNAPSHOT - MENTORES UNIVERSAL
// ============================================

const SNAPSHOT_CONFIG = {
  name: 'Universal Mentores & Prestadores de Servicos',
  version: '1.0.0',
  description: 'Snapshot universal com 8 funis de vendas e metodologias consolidadas (JP Bijari, BANT, Concierge, Sexy Canvas)',

  // ==========================================
  // CUSTOM FIELDS (25 campos)
  // ==========================================
  customFields: [
    // === DADOS BASICOS (5) ===
    {
      name: 'Profissao_Segmento',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Area de atuacao do lead',
      options: [
        'Mentor/Coach',
        'Consultor',
        'Terapeuta',
        'Advogado',
        'Contador',
        'Medico',
        'Arquiteto/Designer',
        'Nutricionista',
        'Personal/Fitness',
        'Infoprodutor',
        'Agencia',
        'Outro'
      ]
    },
    {
      name: 'Empresa_Negocio',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'Nome da empresa ou negocio'
    },
    {
      name: 'Faturamento_Atual',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Faixa de faturamento mensal',
      options: [
        'Ate 5k/mes',
        '5k-10k/mes',
        '10k-30k/mes',
        '30k-50k/mes',
        '50k-100k/mes',
        '100k-300k/mes',
        '300k+/mes'
      ]
    },
    {
      name: 'Tamanho_Equipe',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Quantidade de pessoas na equipe',
      options: [
        'Solo (apenas eu)',
        '2-5 pessoas',
        '6-15 pessoas',
        '16-50 pessoas',
        '50+ pessoas'
      ]
    },
    {
      name: 'Tempo_Mercado',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Tempo de atuacao no mercado',
      options: [
        'Menos de 1 ano',
        '1-3 anos',
        '3-5 anos',
        '5-10 anos',
        '10+ anos'
      ]
    },

    // === QUALIFICACAO BANT (4) ===
    {
      name: 'BANT_Budget',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Score Budget (0-25)'
    },
    {
      name: 'BANT_Authority',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Score Authority (0-25)'
    },
    {
      name: 'BANT_Need',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Score Need (0-25)'
    },
    {
      name: 'BANT_Timeline',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Score Timeline (0-25)'
    },

    // === SCORES CALCULADOS (3) ===
    {
      name: 'Lead_Score',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Score total 0-100 (calculado)'
    },
    {
      name: 'Lead_Temperature',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Temperatura do lead',
      options: ['HOT', 'WARM', 'COLD']
    },
    {
      name: 'ICP_Fit',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Fit com ICP',
      options: ['A', 'B', 'C', 'D']
    },

    // === FUNIL/ORIGEM (3) ===
    {
      name: 'Funil_Origem',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Qual funil de entrada',
      options: [
        'Social Selling',
        'Webinario',
        'Aplicacao',
        'Iscador',
        'Isca Gratuita',
        'Isca Paga',
        'Diagnostico',
        'Sessao Estrategica'
      ]
    },
    {
      name: 'Campanha_Origem',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'Nome da campanha de origem'
    },
    {
      name: 'UTM_Source',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'UTM Source (instagram, google, etc)'
    },

    // === AGENDAMENTO (3) ===
    {
      name: 'Tipo_Call',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Tipo de call agendada',
      options: [
        'Discovery',
        'Demo',
        'Estrategica',
        'Fechamento'
      ]
    },
    {
      name: 'Data_Call',
      dataType: 'DATE',
      model: 'contact',
      placeholder: 'Data da proxima call'
    },
    {
      name: 'Show_Status',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Status de comparecimento',
      options: [
        'Pendente',
        'Confirmado',
        'No-Show',
        'Reagendou',
        'Compareceu'
      ]
    },

    // === DORES/INTERESSES (3) ===
    {
      name: 'Dor_Principal',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Maior dor do lead',
      options: [
        'Captacao de clientes',
        'Escala e processos',
        'Precificacao',
        'Falta de equipe',
        'Falta de tempo'
      ]
    },
    {
      name: 'Interesse_Produto',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Produto de interesse',
      options: [
        'Mentoria Individual',
        'Mentoria Grupo',
        'Consultoria',
        'Treinamento',
        'Done-for-you',
        'Outro'
      ]
    },
    {
      name: 'Objecao_Atual',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Objecao identificada',
      options: [
        'Nenhuma',
        'Preco',
        'Tempo',
        'Preciso pensar',
        'Consultar socio/conjuge',
        'Ja tentei antes'
      ]
    },

    // === AUTOMACAO IA (4) ===
    {
      name: 'Ativar_IA',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'IA pode atender?',
      options: ['Sim', 'Nao']
    },
    {
      name: 'Agente_Atual',
      dataType: 'TEXT',
      model: 'contact',
      placeholder: 'ID do agente IA atual'
    },
    {
      name: 'FUP_Counter',
      dataType: 'NUMBER',
      model: 'contact',
      placeholder: 'Contador de follow-ups enviados'
    },
    {
      name: 'Classificacao_IA',
      dataType: 'SINGLE_OPTIONS',
      model: 'contact',
      placeholder: 'Classificacao automatica',
      options: [
        'LEAD_HOT',
        'LEAD_WARM',
        'LEAD_COLD',
        'PESSOAL',
        'SPAM',
        'SUPORTE'
      ]
    }
  ],

  // ==========================================
  // PIPELINES (3)
  // ==========================================
  pipelines: [
    // Pipeline 1: AQUISICAO
    {
      name: 'AQUISICAO',
      stages: [
        { name: '🎯 Prospect', position: 0 },
        { name: '📥 Novo Lead', position: 1 },
        { name: '💬 Engajado', position: 2 },
        { name: '✅ Qualificado', position: 3 },
        { name: '📅 Agendado', position: 4 },
        { name: '🤝 Compareceu', position: 5 },
        { name: '📄 Proposta', position: 6 },
        { name: '🏆 Ganho', position: 7 },
        { name: '❌ Perdido', position: 8 }
      ]
    },
    // Pipeline 2: ENTREGA
    {
      name: 'ENTREGA',
      stages: [
        { name: '🚀 Onboarding', position: 0 },
        { name: '⏳ Em Progresso', position: 1 },
        { name: '📊 Check-in', position: 2 },
        { name: '🔄 Renovacao', position: 3 },
        { name: '✅ Concluido', position: 4 },
        { name: '💔 Churned', position: 5 }
      ]
    },
    // Pipeline 3: INDICACAO
    {
      name: 'INDICACAO',
      stages: [
        { name: '🌟 Potencial', position: 0 },
        { name: '📤 Pedido Feito', position: 1 },
        { name: '👥 Indicou', position: 2 },
        { name: '🎯 Converteu', position: 3 }
      ]
    }
  ],

  // ==========================================
  // TAGS (57 tags no formato categoria:valor)
  // ==========================================
  tags: [
    // === ORIGEM (10) ===
    'origem:social-selling-instagram',
    'origem:social-selling-linkedin',
    'origem:webinario-ao-vivo',
    'origem:webinario-gravado',
    'origem:aplicacao-high-ticket',
    'origem:lead-magnet',
    'origem:isca-gratuita',
    'origem:isca-paga',
    'origem:indicacao',
    'origem:organico',

    // === FUNIL (9) ===
    'funil:prospect',
    'funil:new-lead',
    'funil:engaged',
    'funil:qualified',
    'funil:scheduled',
    'funil:showed',
    'funil:no-show',
    'funil:won',
    'funil:lost',

    // === STATUS (8) ===
    'status:hot-lead',
    'status:warm-lead',
    'status:cold-lead',
    'status:icp-fit-a',
    'status:icp-fit-b',
    'status:icp-fit-c',
    'status:cliente-ativo',
    'status:cliente-inativo',

    // === AUTOMACAO (10) ===
    'auto:ia-ativada',
    'auto:ia-desativada',
    'auto:concierge-enviado',
    'auto:lembrete-24h',
    'auto:lembrete-3h',
    'auto:lembrete-30min',
    'auto:follow-up-1',
    'auto:follow-up-2',
    'auto:follow-up-3',
    'auto:reativacao',

    // === OBJECAO (6) ===
    'objecao:preco',
    'objecao:tempo',
    'objecao:pensar',
    'objecao:socio-conjuge',
    'objecao:ja-tentei',
    'objecao:outro',

    // === EVENTO (7) ===
    'evento:confirmou-call',
    'evento:reagendou',
    'evento:no-show-1',
    'evento:no-show-2',
    'evento:no-show-3',
    'evento:proposta-enviada',
    'evento:contrato-assinado',

    // === PRODUTO (7) ===
    'produto:mentoria-individual',
    'produto:mentoria-grupo',
    'produto:consultoria',
    'produto:treinamento',
    'produto:done-for-you',
    'produto:ticket-baixo',
    'produto:ticket-alto'
  ],

  // ==========================================
  // CALENDARIOS (4)
  // ==========================================
  calendars: [
    {
      name: 'Discovery Call',
      description: 'Primeira conversa - conhecer o lead',
      slotDuration: 30,
      slotBuffer: 10,
      dateRange: 14,
      appointmentPerSlot: 1,
      appointmentPerDay: 10,
      officeHours: [
        { day: 'monday', start: '09:00', end: '18:00' },
        { day: 'tuesday', start: '09:00', end: '18:00' },
        { day: 'wednesday', start: '09:00', end: '18:00' },
        { day: 'thursday', start: '09:00', end: '18:00' },
        { day: 'friday', start: '09:00', end: '17:00' }
      ]
    },
    {
      name: 'Sessao Estrategica',
      description: 'Diagnostico profundo + proposta',
      slotDuration: 60,
      slotBuffer: 15,
      dateRange: 21,
      appointmentPerSlot: 1,
      appointmentPerDay: 6,
      officeHours: [
        { day: 'monday', start: '09:00', end: '18:00' },
        { day: 'tuesday', start: '09:00', end: '18:00' },
        { day: 'wednesday', start: '09:00', end: '18:00' },
        { day: 'thursday', start: '09:00', end: '18:00' },
        { day: 'friday', start: '09:00', end: '17:00' }
      ]
    },
    {
      name: 'Proposta',
      description: 'Apresentacao de proposta / fechamento',
      slotDuration: 45,
      slotBuffer: 15,
      dateRange: 7,
      appointmentPerSlot: 1,
      appointmentPerDay: 8,
      officeHours: [
        { day: 'monday', start: '10:00', end: '19:00' },
        { day: 'tuesday', start: '10:00', end: '19:00' },
        { day: 'wednesday', start: '10:00', end: '19:00' },
        { day: 'thursday', start: '10:00', end: '19:00' },
        { day: 'friday', start: '10:00', end: '17:00' }
      ]
    },
    {
      name: 'Onboarding',
      description: 'Kickoff com novo cliente',
      slotDuration: 60,
      slotBuffer: 30,
      dateRange: 14,
      appointmentPerSlot: 1,
      appointmentPerDay: 4,
      officeHours: [
        { day: 'monday', start: '10:00', end: '17:00' },
        { day: 'tuesday', start: '10:00', end: '17:00' },
        { day: 'wednesday', start: '10:00', end: '17:00' },
        { day: 'thursday', start: '10:00', end: '17:00' }
      ]
    }
  ],

  // ==========================================
  // TEMPLATES DE MENSAGEM (14)
  // ==========================================
  messageTemplates: [
    // 1. Primeiro Contato - Social Selling
    {
      name: '01 - Primeiro Contato (Social Selling)',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}}! 👋

Vi que voce trabalha com {{custom.profissao_segmento}}, muito bacana!

Estou entrando em contato porque {{motivo_personalizado}}.

Posso te fazer uma pergunta rapida?`
    },

    // 2. Qualificacao BANT
    {
      name: '02 - Qualificacao BANT',
      type: 'whatsapp',
      message: `{{contact.first_name}}, para entender melhor como posso te ajudar, 3 perguntas rapidas:

1️⃣ Qual seu principal desafio hoje no negocio?

2️⃣ Voce ja investiu em alguma solucao para isso?

3️⃣ Se encontrarmos a solucao ideal, quando voce gostaria de comecar?

Responde no seu tempo! 🙏`
    },

    // 3. Agendamento
    {
      name: '03 - Agendamento (Opcoes Binarias)',
      type: 'whatsapp',
      message: `Perfeito {{contact.first_name}}! 🎯

Que tal uma conversa de 30min para entender melhor seu cenario?

Tenho esses horarios essa semana:
📅 Terca ou Quinta?

Qual prefere?`
    },

    // 4. Confirmacao
    {
      name: '04 - Confirmacao de Call',
      type: 'whatsapp',
      message: `✅ *Call Confirmada!*

Oi {{contact.first_name}}!

📅 *Data:* {{appointment.date}}
⏰ *Horario:* {{appointment.time}}
📍 *Link:* {{appointment.meeting_link}}

*Importante:*
• Teste o audio/video antes
• Esteja em local silencioso
• Anote suas principais duvidas

Ate la! 🚀`
    },

    // 5. Lembrete 24h (Concierge Toque 1)
    {
      name: '05 - Lembrete 24h (Concierge)',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}}! 👋

Lembrete: nossa conversa e *amanha*!

📅 {{appointment.date}} as {{appointment.time}}
📍 {{appointment.meeting_link}}

Pode confirmar sua presenca?
✅ SIM, estarei la
❌ Preciso reagendar`
    },

    // 6. Lembrete 3h (Concierge Toque 2)
    {
      name: '06 - Lembrete 3h (Concierge)',
      type: 'whatsapp',
      message: `{{contact.first_name}}, faltam 3 horas! ⏰

Nossa conversa e as {{appointment.time}}.

Link de acesso: {{appointment.meeting_link}}

Nos vemos em breve! 🙌`
    },

    // 7. Lembrete 30min (Concierge Toque 3)
    {
      name: '07 - Lembrete 30min (Concierge)',
      type: 'whatsapp',
      message: `🔔 {{contact.first_name}}, comecaremos em 30 min!

📍 {{appointment.meeting_link}}

Ja estou te esperando! 🚀`
    },

    // 8. No-Show Toque 1 (Imediato)
    {
      name: '08 - No-Show Toque 1 (Imediato)',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}},

Estou no horario da nossa call mas nao te vi entrar...

Aconteceu alguma coisa? 🤔

Posso aguardar mais uns 5 min ou prefere remarcar?`
    },

    // 9. No-Show Toque 2 (D+1)
    {
      name: '09 - No-Show Toque 2 (D+1)',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}}, tudo bem?

Ontem nao conseguimos nos conectar. Espero que esteja tudo bem! 🙏

Posso reagendar para essa semana?

📅 Qual dia funciona melhor?`
    },

    // 10. No-Show Toque 3 (D+3)
    {
      name: '10 - No-Show Toque 3 (D+3)',
      type: 'whatsapp',
      message: `{{contact.first_name}}, ultima tentativa!

Ainda tenho interesse em conversar sobre {{custom.dor_principal}}.

Se nao fizer sentido agora, sem problemas! Me avisa?

Assim posso liberar o espaco para outras pessoas.`
    },

    // 11. Reativacao (9-Word Message - Dean Jackson)
    {
      name: '11 - Reativacao (9-Word)',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}}, voce ainda quer ajuda com {{custom.dor_principal}}?`
    },

    // 12. Pos-Call Agradecimento
    {
      name: '12 - Pos-Call Agradecimento',
      type: 'whatsapp',
      message: `{{contact.first_name}}, muito obrigado pela conversa! 🙏

Foi otimo conhecer mais sobre seu negocio e seus desafios.

Conforme conversamos, vou te enviar {{proximo_passo}}.

Qualquer duvida, estou por aqui!`
    },

    // 13. Follow-up Proposta D+2
    {
      name: '13 - Follow-up Proposta D+2',
      type: 'whatsapp',
      message: `Oi {{contact.first_name}}!

Passando para saber se conseguiu analisar a proposta que enviei.

Alguma duvida que posso esclarecer?

Fico no aguardo! 🙌`
    },

    // 14. Follow-up Proposta D+5
    {
      name: '14 - Follow-up Proposta D+5',
      type: 'whatsapp',
      message: `{{contact.first_name}}, ja faz alguns dias que conversamos.

Sei que a decisao e importante e respeito seu tempo.

Me conta: o que falta para voce decidir?

🅰️ Preco
🅱️ Prazo
🅲️ Preciso de mais informacoes
🅳️ Nao vou seguir agora`
    }
  ],

  // ==========================================
  // WORKFLOWS (8)
  // ==========================================
  workflows: [
    {
      name: 'WF01 - Novo Lead Inbound',
      trigger: 'form_submitted',
      description: 'Form preenchido ou lead criado via API',
      steps: [
        'Criar/atualizar contato',
        'Tag origem baseada em UTM/formulario',
        'Mover para pipeline AQUISICAO > Novo Lead',
        'Enviar template "01 - Primeiro Contato"',
        'Aguardar 4 horas',
        'Se nao respondeu: Follow-up WhatsApp',
        'Aguardar 24 horas',
        'Se nao respondeu: Follow-up SMS',
        'Aguardar 48 horas',
        'Se nao respondeu: Tag "status:cold-lead"'
      ]
    },
    {
      name: 'WF02 - Prospeccao Outbound (Social Selling)',
      trigger: 'webhook',
      webhookUrl: '/webhook/ghl-new-lead',
      description: 'Lead enviado pelo n8n via Social Selling',
      steps: [
        'Tag "origem:social-selling-instagram"',
        'Mover para pipeline AQUISICAO > Prospect',
        'Setar "Ativar_IA" = Sim',
        'Esperar resposta do contato',
        'Quando responder: Mover para Engajado'
      ]
    },
    {
      name: 'WF03 - Qualificacao BANT',
      trigger: 'contact_replied',
      description: 'Calcular score quando lead responde',
      steps: [
        'Enviar template "02 - Qualificacao BANT"',
        'Aguardar respostas',
        'Processar com IA (API classify-lead)',
        'Atualizar campos BANT_* com scores',
        'Calcular Lead_Score (soma BANT)',
        'Se score >= 70: Tag "status:hot-lead" + Mover para Qualificado',
        'Se score 40-69: Tag "status:warm-lead" + Continuar nurturing',
        'Se score < 40: Tag "status:cold-lead" + Mover para remarketing'
      ]
    },
    {
      name: 'WF04 - Concierge Protocol',
      trigger: 'appointment_created',
      description: 'Sequencia de confirmacao pre-call',
      steps: [
        'Enviar template "04 - Confirmacao" (imediato)',
        'Tag "auto:concierge-enviado"',
        'Mover para Agendado',
        'Aguardar ate 24h antes da call',
        'Enviar template "05 - Lembrete 24h"',
        'Tag "auto:lembrete-24h"',
        'Aguardar ate 3h antes',
        'Enviar template "06 - Lembrete 3h"',
        'Tag "auto:lembrete-3h"',
        'Aguardar ate 30min antes',
        'Enviar template "07 - Lembrete 30min"',
        'Tag "auto:lembrete-30min"',
        'Verificar se confirmou: Update Show_Status'
      ]
    },
    {
      name: 'WF05 - No-Show Recovery (7 toques / 15 dias)',
      trigger: 'appointment_status_no_show',
      description: 'Recuperacao de leads que faltaram',
      steps: [
        'Tag "evento:no-show-1"',
        'Update Show_Status = No-Show',
        'Enviar template "08 - No-Show Toque 1" (imediato)',
        'Aguardar 24 horas',
        'Se nao respondeu: Template "09 - No-Show Toque 2" + Tag "evento:no-show-2"',
        'Aguardar 48 horas',
        'Se nao respondeu: Template "10 - No-Show Toque 3" + Tag "evento:no-show-3"',
        'Aguardar 24 horas',
        'Se nao respondeu: Ligacao manual (criar tarefa)',
        'Aguardar 3 dias',
        'Se nao respondeu: Email de ultima tentativa',
        'Aguardar 7 dias',
        'Se nao respondeu: Mover para Perdido + Tag "cold-lead"'
      ]
    },
    {
      name: 'WF06 - Pos-Call Fechamento',
      trigger: 'appointment_status_showed',
      description: 'Sequencia apos call realizada',
      steps: [
        'Update Show_Status = Compareceu',
        'Mover para Compareceu',
        'Aguardar 2 horas',
        'Enviar template "12 - Pos-Call Agradecimento"',
        'Se proposta enviada: Tag "evento:proposta-enviada"',
        'Aguardar 48 horas',
        'Se nao fechou: Template "13 - Follow-up D+2"',
        'Aguardar 72 horas',
        'Se nao fechou: Template "14 - Follow-up D+5"',
        'Se fechou: Tag "evento:contrato-assinado" + Mover para Ganho',
        'Notificar time comercial'
      ]
    },
    {
      name: 'WF07 - Reativacao Base (Dean Jackson)',
      trigger: 'scheduled',
      schedule: '0 9 * * 1-5', // 9h dias uteis
      description: 'Reativar leads inativos 7+ dias',
      steps: [
        'Query: Leads sem interacao ha 7+ dias',
        'Excluir: Clientes ativos, Perdidos definitivos',
        'Para cada lead:',
        '  - Enviar template "11 - Reativacao 9-Word"',
        '  - Tag "auto:reativacao"',
        '  - Incrementar FUP_Counter',
        'Se FUP_Counter >= 5: Mover para Perdido'
      ]
    },
    {
      name: 'WF08 - Indicacao Pos-Venda',
      trigger: 'date_field',
      triggerField: 'dateAdded',
      triggerOffset: 30, // 30 dias apos virar cliente
      description: 'Pedir indicacao apos 30 dias',
      steps: [
        'Verificar se e cliente ativo (pipeline Entrega)',
        'Enviar NPS survey',
        'Se NPS >= 8:',
        '  - Pedir indicacao',
        '  - Criar oportunidade no pipeline INDICACAO',
        'Se NPS <= 6:',
        '  - Notificar CS para intervencao'
      ]
    }
  ],

  // ==========================================
  // INTEGRACAO N8N - WEBHOOKS
  // ==========================================
  webhooks: {
    newLead: '/webhook/ghl-new-lead',
    message: '/webhook/ghl-message',
    appointment: '/webhook/ghl-appointment',
    classifyLead: '/webhook/classify-lead',
    bantScore: '/webhook/bant-score'
  }
};

// ============================================
// FUNCOES DE API
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
  console.log('\n📋 CRIANDO CUSTOM FIELDS (25)...\n');
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
      console.log(`    ⚠️ Ja existe: ${field.name}`);
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
  console.log('\n🔄 CRIANDO PIPELINES (3)...\n');
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
      console.log(`       Estagios: ${pipeline.stages.map(s => s.name).join(' → ')}`);
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
  console.log('\n🏷️ CRIANDO TAGS (57)...\n');
  const results = [];

  // Agrupar tags por categoria
  const tagsByCategory = {};
  SNAPSHOT_CONFIG.tags.forEach(tag => {
    const category = tag.split(':')[0];
    if (!tagsByCategory[category]) {
      tagsByCategory[category] = [];
    }
    tagsByCategory[category].push(tag);
  });

  for (const [category, tags] of Object.entries(tagsByCategory)) {
    console.log(`  📁 Categoria: ${category} (${tags.length} tags)`);

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
        console.log(`    ⚠️ ${tagName} (ja existe)`);
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
// CRIAR CALENDARIOS
// ============================================

async function createCalendars(locationId) {
  console.log('\n📅 CRIANDO CALENDARIOS (4)...\n');
  const results = [];

  for (const calendar of SNAPSHOT_CONFIG.calendars) {
    console.log(`  → Criando: ${calendar.name}...`);

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
    console.log(`✅ Location valida: ${name}`);
    return { valid: true, name };
  } else {
    console.log(`❌ Location invalida ou sem acesso`);
    return { valid: false };
  }
}

// ============================================
// GERAR INSTRUCOES DE WORKFLOWS
// ============================================

function generateWorkflowInstructions() {
  console.log('\n📝 INSTRUCOES PARA CRIAR WORKFLOWS MANUALMENTE:\n');
  console.log('='.repeat(70));

  SNAPSHOT_CONFIG.workflows.forEach((wf, index) => {
    console.log(`\n${index + 1}. ${wf.name}`);
    console.log(`   Trigger: ${wf.trigger}`);
    if (wf.schedule) {
      console.log(`   Schedule: ${wf.schedule}`);
    }
    if (wf.webhookUrl) {
      console.log(`   Webhook: ${wf.webhookUrl}`);
    }
    if (wf.triggerField) {
      console.log(`   Campo: ${wf.triggerField} (offset: ${wf.triggerOffset} dias)`);
    }
    console.log(`   Descricao: ${wf.description}`);
    console.log(`   Passos:`);
    wf.steps.forEach((step, i) => {
      console.log(`     ${i + 1}. ${step}`);
    });
  });

  console.log('\n' + '='.repeat(70));
}

// ============================================
// GERAR TEMPLATES DE MENSAGEM
// ============================================

function generateMessageTemplates() {
  console.log('\n💬 TEMPLATES DE MENSAGEM (14):\n');
  console.log('='.repeat(70));

  SNAPSHOT_CONFIG.messageTemplates.forEach((template) => {
    console.log(`\n📌 ${template.name}`);
    console.log(`   Tipo: ${template.type}`);
    console.log(`   ---`);
    console.log(template.message.split('\n').map(l => `   ${l}`).join('\n'));
    console.log(`   ---`);
  });

  console.log('\n' + '='.repeat(70));
}

// ============================================
// MAIN
// ============================================

async function applySnapshot(locationId) {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   GHL SNAPSHOT - Universal Mentores & Prestadores de Servicos v1.0.0       ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Location ID: ${locationId.padEnd(60)}║`);
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  // 1. Verificar location
  const location = await verifyLocation(locationId);
  if (!location.valid) {
    console.log('\n❌ Abortando: Location invalida');
    process.exit(1);
  }

  // 2. Criar Custom Fields
  const fieldsResults = await createCustomFields(locationId);

  // 3. Criar Pipelines
  const pipelinesResults = await createPipelines(locationId);

  // 4. Criar Tags
  const tagsResults = await createTags(locationId);

  // 5. Criar Calendarios
  const calendarsResults = await createCalendars(locationId);

  // 6. Gerar instrucoes de workflows
  generateWorkflowInstructions();

  // 7. Gerar templates de mensagem
  generateMessageTemplates();

  // 8. Resumo
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              RESUMO                                         ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');

  const fieldsCreated = fieldsResults.filter(r => r.status === 'created').length;
  const fieldsExists = fieldsResults.filter(r => r.status === 'exists').length;
  const pipelinesCreated = pipelinesResults.filter(r => r.status === 'created').length;
  const tagsCreated = tagsResults.filter(r => r.status === 'created').length;
  const tagsExists = tagsResults.filter(r => r.status === 'exists').length;
  const calendarsCreated = calendarsResults.filter(r => r.status === 'created').length;

  console.log(`║  Custom Fields: ${fieldsCreated} criados, ${fieldsExists} ja existiam`.padEnd(77) + '║');
  console.log(`║  Pipelines:     ${pipelinesCreated}/${SNAPSHOT_CONFIG.pipelines.length} criados`.padEnd(77) + '║');
  console.log(`║  Tags:          ${tagsCreated} criadas, ${tagsExists} ja existiam`.padEnd(77) + '║');
  console.log(`║  Calendarios:   ${calendarsCreated}/${SNAPSHOT_CONFIG.calendars.length} criados`.padEnd(77) + '║');
  console.log(`║  Workflows:     ${SNAPSHOT_CONFIG.workflows.length} (criar manualmente)`.padEnd(77) + '║');
  console.log(`║  Templates:     ${SNAPSHOT_CONFIG.messageTemplates.length} (referencia)`.padEnd(77) + '║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  // 9. Proximos passos
  console.log('\n📌 PROXIMOS PASSOS:');
  console.log('   1. Criar os 8 workflows manualmente (instrucoes acima)');
  console.log('   2. Configurar templates de WhatsApp no Meta Business');
  console.log('   3. Conectar numero de WhatsApp Business API');
  console.log('   4. Configurar webhooks no n8n para integracao');
  console.log('   5. Criar client_config no Supabase para parametrizacao');
  console.log('   6. Testar fluxo completo: Lead → Qualificacao → Agendamento → Call → Proposta');
  console.log('   7. Ativar agentes IA para resposta automatica');

  // 10. Salvar resultado
  const outputFile = `/tmp/ghl-snapshot-mentores-${locationId}.json`;
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
      webhooks: SNAPSHOT_CONFIG.webhooks
    }
  };

  require('fs').writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n📄 Resultado completo salvo em: ${outputFile}`);

  return output;
}

// ============================================
// EXECUCAO
// ============================================

const locationId = process.argv[2];

if (!locationId) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║   GHL SNAPSHOT - Universal Mentores & Prestadores de Servicos v1.0.0       ║
╚════════════════════════════════════════════════════════════════════════════╝

Uso: node ghl-snapshot-mentores-v1.js <locationId>

Exemplo:
  node ghl-snapshot-mentores-v1.js hHTtB7iZ4EUqQ3L2yQZK

O que sera criado:
  • ${SNAPSHOT_CONFIG.customFields.length} Custom Fields (BANT, dores, scores, etc)
  • ${SNAPSHOT_CONFIG.pipelines.length} Pipelines (Aquisicao, Entrega, Indicacao)
  • ${SNAPSHOT_CONFIG.tags.length} Tags organizadas por categoria
  • ${SNAPSHOT_CONFIG.calendars.length} Calendarios (Discovery, Estrategica, Proposta, Onboarding)
  • ${SNAPSHOT_CONFIG.workflows.length} Workflows (instrucoes para criar manualmente)
  • ${SNAPSHOT_CONFIG.messageTemplates.length} Templates de mensagem (referencia)

Funis suportados:
  1. Social Selling (Instagram DM)
  2. Webinario
  3. Aplicacao (High-Ticket)
  4. Iscador
  5. Isca Gratuita
  6. Isca Paga
  7. Diagnostico
  8. Sessao Estrategica

Metodologias:
  • JP Bijari (Social Selling)
  • BANT (Qualificacao)
  • Concierge Protocol (Confirmacao)
  • Sexy Canvas (Copywriting)
  • Dean Jackson 9-Word (Reativacao)

Locations conhecidas:
  hHTtB7iZ4EUqQ3L2yQZK = Marcos Daniels F Test
  cd1uyzpJox6XPt4Vct8Y = Mottivme Sales (Principal)
`);
  process.exit(1);
}

applySnapshot(locationId).then(() => {
  console.log('\n✅ Snapshot Universal Mentores aplicado com sucesso!\n');
}).catch(error => {
  console.error('\n❌ Erro ao aplicar snapshot:', error);
  process.exit(1);
});
