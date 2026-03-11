export interface AgentMode {
  id: string;
  name: string;
  description: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  params: string;
}

export const AGENT_MODES: AgentMode[] = [
  {
    id: "first_contact",
    name: "Primeiro Contato",
    description: "Modo de abordagem inicial com o lead",
  },
  {
    id: "scheduler",
    name: "Agendador",
    description: "Modo focado em agendar consultas/reunioes",
  },
  {
    id: "rescheduler",
    name: "Reagendador",
    description: "Modo para remarcar consultas canceladas",
  },
  {
    id: "concierge",
    name: "Concierge",
    description: "Modo de atendimento e suporte ao paciente",
  },
  {
    id: "customer_success",
    name: "Customer Success",
    description: "Modo de acompanhamento pos-venda",
  },
  {
    id: "objection_handler",
    name: "Tratamento de Objecoes",
    description: "Modo para contornar objecoes de leads",
  },
  {
    id: "followuper",
    name: "Follow Up",
    description: "Modo de reengajamento de leads inativos",
  },
  {
    id: "social_seller",
    name: "Social Seller",
    description: "Modo de venda social via Instagram/WhatsApp",
  },
  {
    id: "reativador",
    name: "Reativador",
    description: "Modo para reativar leads frios",
  },
  {
    id: "inbound",
    name: "SDR Inbound",
    description: "Modo de qualificacao de leads inbound",
  },
];

export const AGENT_TOOLS: AgentTool[] = [
  {
    id: "busca_disponibilidade",
    name: "Busca Disponibilidade",
    description: "Consulta horarios livres no calendario GHL",
    params: "calendar_id, date_range",
  },
  {
    id: "agendar_consulta",
    name: "Agendar Consulta",
    description: "Cria agendamento no calendario do cliente",
    params: "calendar_id, contact_id, datetime, notes",
  },
  {
    id: "buscar_historico",
    name: "Buscar Historico",
    description: "Recupera historico de conversas do lead",
    params: "contact_id, limit",
  },
  {
    id: "enviar_mensagem",
    name: "Enviar Mensagem",
    description: "Envia mensagem via WhatsApp/Instagram",
    params: "contact_id, message, channel",
  },
  {
    id: "atualizar_lead",
    name: "Atualizar Lead",
    description: "Atualiza campos customizados do lead no GHL",
    params: "contact_id, fields",
  },
  {
    id: "buscar_preco",
    name: "Buscar Preco",
    description: "Consulta tabela de precos do servico",
    params: "service_id",
  },
  {
    id: "escalar_humano",
    name: "Escalar para Humano",
    description: "Transfere conversa para atendente humano",
    params: "contact_id, reason, priority",
  },
  {
    id: "consultar_knowledge",
    name: "Consultar Knowledge Base",
    description: "Busca informacoes na base de conhecimento",
    params: "query, top_k",
  },
];

export const SYSTEM_PROMPT_TEMPLATE = `# {AGENT_NAME} {VERSION} - {CONTEXT}

## IDENTIDADE
Voce e {AGENT_NAME}, assistente virtual de {BUSINESS_NAME}.

## REGRAS
1. Sempre responda em portugues brasileiro
2. Seja cordial e profissional
3. Nunca invente informacoes
4. Siga o fluxo de atendimento do modo ativo

## MODOS DE OPERACAO
{MODES_CONFIG}

## FERRAMENTAS DISPONIVEIS
{TOOLS_CONFIG}

## REGRAS DE COMPLIANCE
{COMPLIANCE_RULES}
`;
