import type {
  ProductItem,
  SubFunnel,
  ScenarioConfig,
  ScenarioKey,
  PlanningState,
} from "./types";

export const STATUS_CONFIG = {
  ahead: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Acima" },
  on_track: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    label: "No ritmo",
  },
  behind: { color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Atras" },
  critical: { color: "text-red-400", bg: "bg-red-500/10", label: "Critico" },
};

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  pessimista: "Aceitavel",
  realista: "Realista",
  otimista: "Otimista",
};

export const createDefaultProduct = (): ProductItem => ({
  id: crypto.randomUUID(),
  name: "Produto Principal",
  ticket: 1000,
  salesCycleDays: 30,
  targetUnits: 10,
  orderBumpTicket: 0,
  orderBumpRate: 0,
  upsellTicket: 0,
  upsellRate: 0,
});

export const DEFAULT_SCENARIO_CONFIG: ScenarioConfig = {
  pessimista: 0.7,
  realista: 1.0,
  otimista: 1.3,
};

export const SDR_CAPACITY = 150;
export const CLOSER_CAPACITY = 60;

export const DEFAULT_SUB_FUNNELS: SubFunnel[] = [
  {
    id: "1",
    name: "Novo Seguidor",
    pctBudget: 25,
    cpl: 1.5,
    qualificationRate: 60,
    schedulingRate: 45,
    attendanceRate: 75,
    conversionRate: 25,
  },
  {
    id: "2",
    name: "Remarketing",
    pctBudget: 20,
    cpl: 12,
    qualificationRate: 40,
    schedulingRate: 35,
    attendanceRate: 65,
    conversionRate: 15,
  },
  {
    id: "3",
    name: "Formulario / LP",
    pctBudget: 25,
    cpl: 15,
    qualificationRate: 35,
    schedulingRate: 30,
    attendanceRate: 60,
    conversionRate: 12,
  },
  {
    id: "4",
    name: "VSL",
    pctBudget: 15,
    cpl: 20,
    qualificationRate: 50,
    schedulingRate: 40,
    attendanceRate: 70,
    conversionRate: 20,
  },
  {
    id: "5",
    name: "Direct DM",
    pctBudget: 10,
    cpl: 5,
    qualificationRate: 55,
    schedulingRate: 45,
    attendanceRate: 75,
    conversionRate: 22,
  },
  {
    id: "6",
    name: "Direct WhatsApp",
    pctBudget: 5,
    cpl: 8,
    qualificationRate: 50,
    schedulingRate: 40,
    attendanceRate: 70,
    conversionRate: 18,
  },
];

export const DEFAULT_STATE: PlanningState = {
  step: 1,
  segment: null,
  currency: "BRL",
  products: [createDefaultProduct()],
  marketing: {
    dailyBudget: 333,
    subFunnels: DEFAULT_SUB_FUNNELS,
  },
  scenarioConfig: DEFAULT_SCENARIO_CONFIG,
};

export type SegmentKey =
  | "healthcare"
  | "dental"
  | "real_estate"
  | "saas"
  | "professional_services"
  | "education"
  | "ecommerce"
  | "financial_services"
  | "legal"
  | "fitness"
  | "beauty"
  | "automotive"
  | "insurance"
  | "b2b_general"
  | "home_services";

export interface SegmentBenchmark {
  label: string;
  cplGoogle: number;
  cplMeta: number;
  cplAvg: number;
  qualificationRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
  ticketAvg: number;
  salesCycleDays: number;
  bestFunnel: string;
  sdrCapacity: number;
  closerCapacity: number;
}

export const SEGMENT_BENCHMARKS: Record<SegmentKey, SegmentBenchmark> = {
  healthcare: {
    label: "Saude / Clinicas",
    cplGoogle: 66,
    cplMeta: 22,
    cplAvg: 54,
    qualificationRate: 25,
    schedulingRate: 40,
    attendanceRate: 65,
    conversionRate: 30,
    ticketAvg: 350,
    salesCycleDays: 45,
    bestFunnel: "Webinar + Email + Google Ads",
    sdrCapacity: 150,
    closerCapacity: 25,
  },
  dental: {
    label: "Odontologia",
    cplGoogle: 77,
    cplMeta: 77,
    cplAvg: 77,
    qualificationRate: 25,
    schedulingRate: 37,
    attendanceRate: 73,
    conversionRate: 33,
    ticketAvg: 500,
    salesCycleDays: 21,
    bestFunnel: "VSL + Membership Plan",
    sdrCapacity: 150,
    closerCapacity: 20,
  },
  real_estate: {
    label: "Imobiliario",
    cplGoogle: 66,
    cplMeta: 50,
    cplAvg: 250,
    qualificationRate: 20,
    schedulingRate: 15,
    attendanceRate: 50,
    conversionRate: 18,
    ticketAvg: 15000,
    salesCycleDays: 60,
    bestFunnel: "Meta Lead Ads + VSL + Nurture",
    sdrCapacity: 100,
    closerCapacity: 5,
  },
  saas: {
    label: "SaaS / Software",
    cplGoogle: 200,
    cplMeta: 80,
    cplAvg: 237,
    qualificationRate: 31,
    schedulingRate: 18,
    attendanceRate: 80,
    conversionRate: 30,
    ticketAvg: 15000,
    salesCycleDays: 60,
    bestFunnel: "Free Trial 7d + Onboarding",
    sdrCapacity: 150,
    closerCapacity: 3,
  },
  professional_services: {
    label: "Consultoria / Servicos",
    cplGoogle: 104,
    cplMeta: 50,
    cplAvg: 132,
    qualificationRate: 28,
    schedulingRate: 23,
    attendanceRate: 75,
    conversionRate: 38,
    ticketAvg: 10000,
    salesCycleDays: 83,
    bestFunnel: "Webinar Evergreen + SPIN",
    sdrCapacity: 150,
    closerCapacity: 3,
  },
  education: {
    label: "Educacao / Cursos",
    cplGoogle: 90,
    cplMeta: 19,
    cplAvg: 73,
    qualificationRate: 20,
    schedulingRate: 40,
    attendanceRate: 80,
    conversionRate: 25,
    ticketAvg: 5000,
    salesCycleDays: 45,
    bestFunnel: "VSL + Webinar + Challenge",
    sdrCapacity: 150,
    closerCapacity: 15,
  },
  ecommerce: {
    label: "E-commerce",
    cplGoogle: 45,
    cplMeta: 25,
    cplAvg: 91,
    qualificationRate: 13,
    schedulingRate: 33,
    attendanceRate: 95,
    conversionRate: 15,
    ticketAvg: 120,
    salesCycleDays: 14,
    bestFunnel: "Quiz Funnel + Retargeting",
    sdrCapacity: 200,
    closerCapacity: 200,
  },
  financial_services: {
    label: "Financeiro / Investimentos",
    cplGoogle: 125,
    cplMeta: 60,
    cplAvg: 611,
    qualificationRate: 20,
    schedulingRate: 40,
    attendanceRate: 60,
    conversionRate: 48,
    ticketAvg: 2500,
    salesCycleDays: 68,
    bestFunnel: "Multi-channel + Consultative",
    sdrCapacity: 150,
    closerCapacity: 8,
  },
  legal: {
    label: "Advocacia / Juridico",
    cplGoogle: 132,
    cplMeta: 65,
    cplAvg: 717,
    qualificationRate: 25,
    schedulingRate: 40,
    attendanceRate: 78,
    conversionRate: 45,
    ticketAvg: 3000,
    salesCycleDays: 90,
    bestFunnel: "Google Ads + Consultation",
    sdrCapacity: 100,
    closerCapacity: 3,
  },
  fitness: {
    label: "Fitness / Academias",
    cplGoogle: 62,
    cplMeta: 25,
    cplAvg: 43,
    qualificationRate: 28,
    schedulingRate: 50,
    attendanceRate: 62,
    conversionRate: 30,
    ticketAvg: 480,
    salesCycleDays: 11,
    bestFunnel: "Challenge 7-30d + Facebook Ads",
    sdrCapacity: 150,
    closerCapacity: 30,
  },
  beauty: {
    label: "Estetica / Beauty",
    cplGoogle: 51,
    cplMeta: 51,
    cplAvg: 51,
    qualificationRate: 30,
    schedulingRate: 50,
    attendanceRate: 68,
    conversionRate: 33,
    ticketAvg: 420,
    salesCycleDays: 19,
    bestFunnel: "Google Ads + Retarget + SMS",
    sdrCapacity: 150,
    closerCapacity: 23,
  },
  automotive: {
    label: "Automotivo",
    cplGoogle: 34,
    cplMeta: 30,
    cplAvg: 283,
    qualificationRate: 30,
    schedulingRate: 58,
    attendanceRate: 40,
    conversionRate: 20,
    ticketAvg: 45000,
    salesCycleDays: 22,
    bestFunnel: "Google Local + Test Drive",
    sdrCapacity: 150,
    closerCapacity: 8,
  },
  insurance: {
    label: "Seguros",
    cplGoogle: 100,
    cplMeta: 50,
    cplAvg: 442,
    qualificationRate: 20,
    schedulingRate: 40,
    attendanceRate: 60,
    conversionRate: 48,
    ticketAvg: 2000,
    salesCycleDays: 45,
    bestFunnel: "Multi-channel + Consultative",
    sdrCapacity: 150,
    closerCapacity: 12,
  },
  b2b_general: {
    label: "B2B Geral",
    cplGoogle: 70,
    cplMeta: 50,
    cplAvg: 142,
    qualificationRate: 31,
    schedulingRate: 18,
    attendanceRate: 70,
    conversionRate: 35,
    ticketAvg: 25000,
    salesCycleDays: 60,
    bestFunnel: "ABM + Multi-channel cadence",
    sdrCapacity: 150,
    closerCapacity: 3,
  },
  home_services: {
    label: "Reformas / Manutencao",
    cplGoogle: 92,
    cplMeta: 45,
    cplAvg: 91,
    qualificationRate: 25,
    schedulingRate: 44,
    attendanceRate: 60,
    conversionRate: 25,
    ticketAvg: 8000,
    salesCycleDays: 19,
    bestFunnel: "Google Local + GMB + Referral",
    sdrCapacity: 150,
    closerCapacity: 12,
  },
};
