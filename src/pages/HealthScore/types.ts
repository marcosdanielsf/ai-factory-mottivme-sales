export type RiskLevel = "critical" | "at_risk" | "healthy" | "excellent";

export type Dimension =
  | "engagement"
  | "scheduling"
  | "satisfaction"
  | "activity"
  | "payment";

export interface DimensionConfig {
  key: Dimension;
  label: string;
  description: string;
  weight: number;
  color: string;
  isManual: boolean;
}

export const DIMENSIONS: DimensionConfig[] = [
  {
    key: "scheduling",
    label: "Agendamento",
    description: "% de leads que agendaram",
    weight: 30,
    color: "#06b6d4",
    isManual: false,
  },
  {
    key: "engagement",
    label: "Engajamento",
    description: "% de leads que responderam",
    weight: 25,
    color: "#8b5cf6",
    isManual: false,
  },
  {
    key: "satisfaction",
    label: "Satisfacao",
    description: "Input manual do CS",
    weight: 20,
    color: "#f59e0b",
    isManual: true,
  },
  {
    key: "activity",
    label: "Atividade",
    description: "Volume de leads recentes",
    weight: 15,
    color: "#10b981",
    isManual: false,
  },
  {
    key: "payment",
    label: "Pagamento",
    description: "Regularidade financeira",
    weight: 10,
    color: "#ec4899",
    isManual: true,
  },
];

export const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  excellent: {
    label: "Excelente",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  healthy: {
    label: "Saudavel",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.08)",
    border: "rgba(6, 182, 212, 0.2)",
  },
  at_risk: {
    label: "Em Risco",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  critical: {
    label: "Critico",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
  },
};
