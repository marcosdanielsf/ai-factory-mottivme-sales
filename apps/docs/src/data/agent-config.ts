
export const AGENT_MODES = [
  {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Primeiro contato com o lead. Foco em saudação e identificação.',
    prompt_variable: 'prompts_por_modo.first_contact'
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    description: 'Responsável por encontrar horários e agendar reuniões.',
    prompt_variable: 'prompts_por_modo.scheduler'
  },
  {
    id: 'rescheduler',
    name: 'Rescheduler',
    description: 'Gerencia reagendamentos de reuniões existentes.',
    prompt_variable: 'prompts_por_modo.rescheduler'
  },
  {
    id: 'concierge',
    name: 'Concierge',
    description: 'Auxilia com dúvidas gerais e direcionamento.',
    prompt_variable: 'prompts_por_modo.concierge'
  },
  {
    id: 'customer_success',
    name: 'Customer Success',
    description: 'Foco em pós-venda e sucesso do cliente.',
    prompt_variable: 'prompts_por_modo.customer_success'
  },
  {
    id: 'objection_handler',
    name: 'Objection Handler',
    description: 'Especialista em contornar objeções e negativas.',
    prompt_variable: 'prompts_por_modo.objection_handler'
  },
  {
    id: 'followuper',
    name: 'Followuper',
    description: 'Realiza o acompanhamento de leads que não responderam.',
    prompt_variable: 'prompts_por_modo.followuper'
  }
];

export const AGENT_TOOLS = [
  {
    id: 'busca_disponibilidade',
    name: 'Busca Disponibilidade',
    description: 'Busca/consultar por horários disponíveis antes de agendar.',
    usage: 'OBRIGATÓRIO antes de oferecer horários ao lead.',
    params: 'calendar, dateStartFrom, dateEndTo'
  },
  {
    id: 'agendar_reuniao',
    name: 'Agendar Reunião',
    description: 'Agendar uma nova reunião no CRM/GHL.',
    usage: 'Use APÓS confirmar horário com o lead.',
    params: 'nome, tel, email, eventId, data, hora'
  },
  {
    id: 'adicionar_tag_perdido',
    name: 'Adicionar Tag Perdido',
    description: 'Marcar lead como perdido/desqualificado.',
    usage: 'Quando o lead não tem interesse ou pede para não ser contatado.',
    params: 'contact_id'
  }
];

export const SYSTEM_PROMPT_TEMPLATE = `**CONTEXTO**
DATA: {{ $now.format('FFFF') }}
HORA_LOCAL: {{ $now.setZone('America/Sao_Paulo').toFormat('HH:mm') }}
TEL/WHATSAPP: {{ $('Preparar Execução + Identificar Contexto').item.json.telefone }}
EMAIL: {{ $('Preparar Execução + Identificar Contexto').item.json.email || 'não informado' }}
NOME DO CLIENTE: {{ $('Preparar Execução + Identificar Contexto').item.json.first_name }} {{ $('Preparar Execução + Identificar Contexto').item.json.last_name }}
CONTACT_ID: {{ $('Preparar Execução + Identificar Contexto').item.json.contact_id }}
LOCATION_ID: {{ $('Preparar Execução + Identificar Contexto').item.json.location_id }}
API_KEY: {{ $('Preparar Execução + Identificar Contexto').item.json.location_api_key }}
MODO_ATUAL: {{ $json.modo_atual }}

{{ $('Preparar Execução + Identificar Contexto').item.json.contexto_hiperpersonalizado }}

## SAUDAÇÃO
{{ $('Preparar Execução + Identificar Contexto').item.json.is_primeira_mensagem ? '- PRIMEIRA MENSAGEM: Use saudação apropriada (Bom dia/Boa tarde/Boa noite conforme HORA_LOCAL) + nome do cliente' : '- JÁ CONVERSARAM: Não use saudação, vá direto ao ponto' }}
- HORA_LOCAL < 12 → "Bom dia"
- HORA_LOCAL 12-17 → "Boa tarde"
- HORA_LOCAL >= 18 → "Boa noite"

## FERRAMENTAS DISPONÍVEIS
- **Busca_disponibilidade**: OBRIGATÓRIO antes de oferecer horários
- **Agendar_reuniao**: Criar agendamento (nome, tel, email, eventId, data, hora)
- **Adicionar_tag_perdido**: Desqualificar lead

## FORMATOS OBRIGATÓRIOS
- **Telefone**: +00000000000 (sem espaços)
- **Data**: dd/mm/yyyy
- **Hora**: 24h (manter exato, não converter)
- **Agendamento CRM**: ISO 8601 (Y-m-d\\TH:i:sP)

## HISTÓRICO DE CONVERSAS ANTIGAS
(Placeholder - implementar busca de histórico no GHL)

---

{{ $json.prompt_dinamico }}`;
