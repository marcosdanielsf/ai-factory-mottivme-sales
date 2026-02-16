export type Currency = 'BRL' | 'USD';

export interface ProductItem {
  id: string;
  name: string;
  ticket: number;
  salesCycleDays: number;
  targetUnits: number;
  orderBumpTicket: number;
  orderBumpRate: number;
  upsellTicket: number;
  upsellRate: number;
}

export interface ChannelConfig {
  pctBudget: number;
  cpl: number;
}

export interface SubFunnel {
  id: string;
  name: string;
  pctBudget: number;
  cpl: number;
}

export interface OriginRates {
  qualificationRate: number;
  schedulingRate: number;
  attendanceRate: number;
  conversionRate: number;
}

export interface PlanningState {
  step: 1 | 2 | 3;
  currency: Currency;
  products: ProductItem[];
  marketing: {
    dailyBudget: number;
    channels: {
      socialSelling: ChannelConfig;
      trafego: ChannelConfig;
      organico: ChannelConfig;
    };
    trafegoSubFunnels: SubFunnel[];
  };
  sales: {
    origins: {
      socialSelling: OriginRates;
      trafego: OriginRates;
      organico: OriginRates;
    };
    mqlsPerSdr: number;
    callsPerCloser: number;
  };
  scenarioConfig: ScenarioConfig;
}

export interface ChannelResults {
  leads: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  sales: number;
  revenue: number;
  investment: number;
}

export type ScenarioKey = 'pessimista' | 'realista' | 'otimista';

export interface ScenarioConfig {
  pessimista: number;
  realista: number;
  otimista: number;
}

export interface PlanResults {
  totalInvestment: number;
  totalLeads: number;
  mqls: number;
  scheduledCalls: number;
  attendedCalls: number;
  totalSales: number;
  totalRevenue: number;
  roas: number;
  cac: number;
  sdrCount: number;
  closerCount: number;
  totalOpCost: number;
  netProfit: number;
  byChannel: {
    socialSelling: ChannelResults;
    trafego: ChannelResults;
    organico: ChannelResults;
  };
  byProduct: {
    name: string;
    ticket: number;
    targetUnits: number;
    revenueBase: number;
    revenueBump: number;
    revenueUpsell: number;
    revenue: number;
    estimatedLeads: number;
  }[];
  bySubFunnel: {
    name: string;
    investment: number;
    leads: number;
    cpl: number;
  }[];
}
