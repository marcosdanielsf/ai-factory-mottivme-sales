export type OnboardingVertical =
  | "clinica"
  | "imobiliaria"
  | "servicos"
  | "ecommerce"
  | "educacao"
  | "outro";

export type OnboardingStatus =
  | "em_andamento"
  | "concluido"
  | "atrasado"
  | "cancelado";

export const ONBOARDING_STEPS = [
  { number: 1, key: "contrato_assinado", label: "Contrato Assinado" },
  { number: 2, key: "dados_coletados", label: "Dados Coletados" },
  { number: 3, key: "location_ghl", label: "Location GHL" },
  { number: 4, key: "agent_version_criado", label: "Agent Version" },
  { number: 5, key: "workflow_n8n_ativo", label: "Workflow n8n" },
  { number: 6, key: "primeiro_lead", label: "Primeiro Lead" },
  { number: 7, key: "review_48h", label: "Review 48h" },
] as const;

export const VERTICAL_CONFIG: Record<
  OnboardingVertical,
  { label: string; emoji: string; color: string }
> = {
  clinica: { label: "Clinica", emoji: "🏥", color: "#22C55E" },
  imobiliaria: { label: "Imobiliaria", emoji: "🏠", color: "#3B82F6" },
  servicos: { label: "Servicos", emoji: "⚙️", color: "#8B5CF6" },
  ecommerce: { label: "E-commerce", emoji: "🛒", color: "#F59E0B" },
  educacao: { label: "Educacao", emoji: "📚", color: "#EC4899" },
  outro: { label: "Outro", emoji: "📋", color: "#6B7280" },
};

export const STATUS_CONFIG: Record<
  OnboardingStatus,
  { label: string; color: string }
> = {
  em_andamento: { label: "Em Andamento", color: "#3B82F6" },
  concluido: { label: "Concluido", color: "#22C55E" },
  atrasado: { label: "Atrasado", color: "#EF4444" },
  cancelado: { label: "Cancelado", color: "#6B7280" },
};

// Re-export types from hook
export type {
  ClientOnboarding,
  OnboardingChecklistItem,
} from "../../hooks/useOnboardingTracker";
