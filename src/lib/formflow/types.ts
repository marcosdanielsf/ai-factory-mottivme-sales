/**
 * FormFlow Types
 * Tipos completos para o sistema de formulários conversacionais (clone Typeform)
 */

// ---------------------------------------------------------------------------
// Enums / Union types
// ---------------------------------------------------------------------------

/** Tipos de campo suportados pelo FormFlow */
export type FieldKind =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "single_choice"
  | "rating"
  | "scale"
  | "email"
  | "phone"
  | "date"
  | "file_upload"
  | "statement"
  | "yes_no";

/** Estado de ciclo de vida de um formulário */
export type FormStatus = "draft" | "published" | "closed" | "archived";

/**
 * Operadores lógicos disponíveis para regras de skip logic.
 * Usados para comparar o valor respondido com o valor esperado na regra.
 */
export type LogicOperator =
  | "eq"
  | "neq"
  | "contains"
  | "gt"
  | "lt"
  | "is_empty"
  | "is_not_empty";

/** Tipos de evento rastreados nas analytics do formulário */
export type AnalyticsEventType =
  | "view"
  | "start"
  | "field_view"
  | "field_drop"
  | "completion";

// ---------------------------------------------------------------------------
// Theme & Settings
// ---------------------------------------------------------------------------

/**
 * Configuração visual do formulário (cores, tipografia, bordas).
 * Aplicada globalmente em todos os campos do form.
 */
export interface ThemeConfig {
  /** Cor primária (botões, progresso) — hex, ex: "#4F46E5" */
  primary_color: string;
  /** Cor de fundo da página do formulário */
  background_color: string;
  /** Cor padrão do texto */
  text_color: string;
  /** Família de fonte (Google Fonts ou system) */
  font_family: string;
  /** Border radius em px dos elementos (botões, cards) */
  border_radius: number;
}

/**
 * Configurações gerais de comportamento e aparência do formulário.
 */
export interface FormSettings {
  /** Tema visual personalizado */
  theme?: ThemeConfig;
  /** URL de redirecionamento após submissão completa */
  redirect_url?: string;
  /** Mensagem exibida quando o formulário está fechado */
  close_message?: string;
  /** Exibe barra de progresso durante preenchimento */
  show_progress_bar?: boolean;
  /** URL do logotipo da marca exibido no formulário */
  brand_logo_url?: string;
}

// ---------------------------------------------------------------------------
// GHL Integration
// ---------------------------------------------------------------------------

/**
 * Mapeamento de campos do formulário para campos customizados do GoHighLevel.
 * Usado para sincronizar respostas como propriedades de contato no GHL.
 */
export interface GHLMapping {
  /** Mapa field_id → ghl_custom_field_id */
  contact_field_map: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/**
 * Workspace é o namespace organizacional do FormFlow.
 * Agrupa formulários de um mesmo cliente ou projeto.
 */
export interface Workspace {
  /** UUID único do workspace */
  id: string;
  /** Nome exibido do workspace */
  name: string;
  /** ID do usuário dono do workspace */
  owner_id: string;
  /** Configurações adicionais em formato livre */
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Formulário conversacional no estilo Typeform.
 * Contém os metadados, configurações e integrações do form.
 * Os campos (Field[]) são relacionados via form_id.
 */
export interface Form {
  /** UUID único do formulário */
  id: string;
  /** Workspace ao qual o formulário pertence */
  workspace_id: string;
  /** Título principal do formulário */
  title: string;
  /** Descrição opcional exibida antes do início */
  description?: string;
  /** Slug único para URL pública (ex: "pesquisa-perfil-cliente") */
  slug: string;
  /** Estado do ciclo de vida do formulário */
  status: FormStatus;
  /** Configurações de tema e comportamento */
  settings: FormSettings;
  /** URL do webhook chamado após cada submissão completa */
  webhook_url?: string;
  /** Mapeamento de campos para contatos no GoHighLevel */
  ghl_mapping: GHLMapping | null;
  created_at: string;
  updated_at: string;
  /** Data de publicação do formulário (null se draft) */
  published_at: string | null;
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

/**
 * Opção de escolha para campos do tipo multiple_choice e single_choice.
 */
export interface FieldChoice {
  /** ID único da opção */
  id: string;
  /** Texto exibido para o respondente */
  label: string;
  /** Valor armazenado na submissão */
  value: string;
}

/**
 * Propriedades específicas de cada tipo de campo.
 * Nem todos os campos são relevantes para todos os FieldKind.
 */
export interface FieldProperties {
  /** Texto de placeholder (short_text, long_text, email, phone, date) */
  placeholder?: string;
  /** Lista de opções (multiple_choice, single_choice) */
  choices?: FieldChoice[];
  /** Valor mínimo da escala (rating, scale) */
  min?: number;
  /** Valor máximo da escala (rating, scale) */
  max?: number;
  /** Incremento entre valores (scale) */
  step?: number;
  /** Label do extremo mínimo da escala (scale) */
  min_label?: string;
  /** Label do extremo máximo da escala (scale) */
  max_label?: string;
  /** Permite upload de múltiplos arquivos (file_upload) */
  allow_multiple?: boolean;
  /** Tamanho máximo de cada arquivo em MB (file_upload) */
  max_file_size_mb?: number;
  /** Tipos MIME aceitos, ex: ["image/png", "application/pdf"] (file_upload) */
  accepted_types?: string[];
  /** Texto do botão de avanço (statement) */
  button_text?: string;
}

/**
 * Regras de validação de um campo.
 * Aplicadas antes de avançar para o próximo campo.
 */
export interface FieldValidations {
  /** Comprimento mínimo de texto (short_text, long_text) */
  min_length?: number;
  /** Comprimento máximo de texto (short_text, long_text) */
  max_length?: number;
  /** Regex de validação (ex: email personalizado, CPF) */
  pattern?: string;
  /** Mensagem de erro customizada exibida ao usuário */
  custom_error?: string;
}

/**
 * Regra individual de skip logic.
 * Avalia a resposta de um campo e redireciona para outro campo ou encerra o form.
 *
 * Exemplo: se campo "setor" === "saude" → go_to campo "pergunta_saude"
 */
export interface SkipLogicRule {
  /** ID único da regra */
  id: string;
  /**
   * ID do campo cujo valor será avaliado.
   * Geralmente é o próprio campo que contém a regra,
   * mas pode referenciar qualquer campo já respondido.
   */
  field_id: string;
  /** Operador de comparação */
  operator: LogicOperator;
  /** Valor com o qual o campo será comparado */
  value: string | number | boolean | null;
  /** Destino quando a condição é verdadeira */
  then: {
    /** ID do campo de destino ou 'end' para encerrar o formulário */
    go_to: string | "end";
  };
}

/**
 * Campo do formulário.
 * Contém tipo, conteúdo, validações e regras de skip logic.
 * A ordem de exibição é determinada pelo campo `position` (ascendente).
 */
export interface Field {
  /** UUID único do campo */
  id: string;
  /** Formulário ao qual o campo pertence */
  form_id: string;
  /** Tipo de entrada do campo */
  type: FieldKind;
  /** Pergunta ou enunciado principal exibido ao respondente */
  title: string;
  /** Descrição ou instrução adicional (opcional) */
  description?: string;
  /** Se true, o respondente não pode avançar sem preencher */
  required: boolean;
  /** Posição na sequência do formulário (começa em 0) */
  position: number;
  /** Propriedades específicas do tipo de campo */
  properties: FieldProperties;
  /** Regras de validação */
  validations: FieldValidations;
  /** Regras de navegação condicional — avaliadas na ordem em que aparecem */
  skip_logic: SkipLogicRule[];
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

/**
 * Valor de resposta para um campo.
 * - string: short_text, long_text, email, phone, date, single_choice, yes_no
 * - number: rating, scale
 * - boolean: yes_no alternativo
 * - string[]: multiple_choice (IDs das opções escolhidas)
 * - null: campo não respondido (pulado por skip logic)
 */
export type FieldValue = string | number | boolean | string[] | null;

/**
 * Metadados técnicos capturados junto à submissão.
 * Todos opcionais — coletados via browser/server quando disponíveis.
 */
export interface SubmissionMetadata {
  /** IP do respondente */
  ip?: string;
  /** User-Agent do browser */
  user_agent?: string;
  /** URL de referência */
  referrer?: string;
  /** Parâmetro UTM source da URL */
  utm_source?: string;
  /** Parâmetro UTM medium da URL */
  utm_medium?: string;
  /** Parâmetro UTM campaign da URL */
  utm_campaign?: string;
  /** Tempo total de preenchimento em segundos */
  duration_seconds?: number;
}

/**
 * Submissão de um formulário por um respondente.
 * Armazena todas as respostas e metadados da sessão.
 */
export interface Submission {
  /** UUID único da submissão */
  id: string;
  /** Formulário respondido */
  form_id: string;
  /**
   * Mapa de respostas: chave é o field_id, valor é a resposta tipada.
   * Campos pulados por skip logic ficam ausentes ou com valor null.
   */
  answers: Record<string, FieldValue>;
  /** Dados técnicos da sessão */
  metadata: SubmissionMetadata;
  /** Timestamp de quando o respondente visualizou o primeiro campo (null se não registrado) */
  started_at: string | null;
  /** Timestamp de quando a submissão foi concluída */
  completed_at: string;
  /** true se o respondente chegou ao fim do formulário */
  is_complete: boolean;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * Evento de analytics do FormFlow.
 * Registrado a cada interação rastreável do respondente com o formulário.
 */
export interface AnalyticsEvent {
  /** UUID único do evento */
  id: string;
  /** Formulário relacionado */
  form_id: string;
  /** Submissão relacionada (null para eventos antes de iniciar) */
  submission_id: string | null;
  /** Tipo de interação rastreada */
  event_type: AnalyticsEventType;
  /** Campo específico relacionado ao evento (quando aplicável) */
  field_id: string | null;
  /** Dados adicionais do evento em formato livre */
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Estatísticas agregadas de um formulário.
 * Calculadas a partir dos eventos e submissões registradas.
 */
export interface FormStats {
  /** Formulário de referência */
  form_id: string;
  /** Total de submissões completas */
  total_submissions: number;
  /** Taxa de conclusão (0-100): submissoes_completas / total_starts * 100 */
  completion_rate: number;
  /** Duração média de preenchimento em segundos */
  avg_duration_seconds: number;
  /** Total de visualizações únicas da página do formulário */
  total_views: number;
  /** Total de respondentes que interagiram com o primeiro campo */
  total_starts: number;
}
