import type { ProductItem, SubFunnel, ScenarioConfig, ScenarioKey, PlanningState } from './types';

export const STATUS_CONFIG = {
  ahead: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Acima' },
  on_track: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'No ritmo' },
  behind: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Atras' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Critico' },
};

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  pessimista: 'Aceitavel',
  realista: 'Realista',
  otimista: 'Otimista',
};

export const createDefaultProduct = (): ProductItem => ({
  id: crypto.randomUUID(),
  name: 'Produto Principal',
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

export const DEFAULT_SUB_FUNNELS: SubFunnel[] = [
  { id: '1', name: 'Novo Seguidor', pctBudget: 25, cpl: 1.5 },
  { id: '2', name: 'Remarketing', pctBudget: 20, cpl: 12 },
  { id: '3', name: 'Formulario / LP', pctBudget: 25, cpl: 15 },
  { id: '4', name: 'VSL', pctBudget: 15, cpl: 20 },
  { id: '5', name: 'Direct DM', pctBudget: 10, cpl: 5 },
  { id: '6', name: 'Direct WhatsApp', pctBudget: 5, cpl: 8 },
];

export const DEFAULT_STATE: PlanningState = {
  step: 1,
  currency: 'BRL',
  products: [createDefaultProduct()],
  marketing: {
    dailyBudget: 333,
    channels: {
      socialSelling: { pctBudget: 30, cpl: 3 },
      trafego: { pctBudget: 50, cpl: 8 },
      organico: { pctBudget: 20, cpl: 1 },
    },
    trafegoSubFunnels: DEFAULT_SUB_FUNNELS,
  },
  sales: {
    origins: {
      socialSelling: { qualificationRate: 60, schedulingRate: 45, attendanceRate: 75, conversionRate: 25 },
      trafego: { qualificationRate: 40, schedulingRate: 35, attendanceRate: 65, conversionRate: 15 },
      organico: { qualificationRate: 55, schedulingRate: 40, attendanceRate: 70, conversionRate: 20 },
    },
    mqlsPerSdr: 150,
    callsPerCloser: 60,
  },
  scenarioConfig: DEFAULT_SCENARIO_CONFIG,
};
