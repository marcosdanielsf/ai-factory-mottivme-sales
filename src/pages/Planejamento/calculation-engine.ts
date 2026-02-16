import type { PlanningState, PlanResults, ChannelResults, Currency } from './types';

export function calculatePlan(state: PlanningState, periodDays = 30, scenarioMultiplier = 1.0): PlanResults {
  const { marketing, sales, products } = state;
  const totalInvestment = marketing.dailyBudget * periodDays;

  const clampRate = (rate: number, mult: number) => Math.min(100, rate * mult);

  const calcChannelLeads = (key: 'socialSelling' | 'trafego' | 'organico', investment: number): number => {
    if (key === 'trafego' && marketing.trafegoSubFunnels.length > 0) {
      return marketing.trafegoSubFunnels.reduce((total, sf) => {
        const sfInvestment = investment * sf.pctBudget / 100;
        return total + (sf.cpl > 0 ? Math.floor(sfInvestment / sf.cpl) : 0);
      }, 0);
    }
    const ch = marketing.channels[key];
    return ch.cpl > 0 ? Math.floor(investment / ch.cpl) : 0;
  };

  const calcProductRevenue = (salesCount: number) => {
    const totalTarget = products.reduce((s, p) => s + p.targetUnits, 0);
    let revenueBase = 0;
    let revenueBump = 0;
    let revenueUpsell = 0;
    products.forEach(p => {
      const pctShare = totalTarget > 0 ? p.targetUnits / totalTarget : 1 / products.length;
      const pSales = salesCount * pctShare;
      revenueBase += pSales * p.ticket;
      revenueBump += pSales * (p.orderBumpRate / 100) * p.orderBumpTicket;
      revenueUpsell += pSales * (p.upsellRate / 100) * p.upsellTicket;
    });
    return { revenueBase, revenueBump, revenueUpsell, total: revenueBase + revenueBump + revenueUpsell };
  };

  const calcChannel = (key: 'socialSelling' | 'trafego' | 'organico'): ChannelResults => {
    const ch = marketing.channels[key];
    const rates = sales.origins[key];
    const investment = totalInvestment * ch.pctBudget / 100;
    const leads = calcChannelLeads(key, investment);
    const mqls = Math.floor(leads * clampRate(rates.qualificationRate, scenarioMultiplier) / 100);
    const scheduledCalls = Math.floor(mqls * clampRate(rates.schedulingRate, scenarioMultiplier) / 100);
    const attendedCalls = Math.floor(scheduledCalls * clampRate(rates.attendanceRate, scenarioMultiplier) / 100);
    const salesCount = Math.floor(attendedCalls * clampRate(rates.conversionRate, scenarioMultiplier) / 100);

    const rev = calcProductRevenue(salesCount);
    return { leads, mqls, scheduledCalls, attendedCalls, sales: salesCount, revenue: rev.total, investment };
  };

  const ss = calcChannel('socialSelling');
  const tr = calcChannel('trafego');
  const org = calcChannel('organico');

  const trafegoBudget = totalInvestment * marketing.channels.trafego.pctBudget / 100;
  const bySubFunnel = marketing.trafegoSubFunnels.map(sf => {
    const sfInvestment = trafegoBudget * sf.pctBudget / 100;
    const sfLeads = sf.cpl > 0 ? Math.floor(sfInvestment / sf.cpl) : 0;
    return { name: sf.name, investment: sfInvestment, leads: sfLeads, cpl: sf.cpl };
  });

  const totalLeads = ss.leads + tr.leads + org.leads;
  const mqls = ss.mqls + tr.mqls + org.mqls;
  const scheduledCalls = ss.scheduledCalls + tr.scheduledCalls + org.scheduledCalls;
  const attendedCalls = ss.attendedCalls + tr.attendedCalls + org.attendedCalls;
  const totalSales = ss.sales + tr.sales + org.sales;
  const totalRevenue = ss.revenue + tr.revenue + org.revenue;

  const sdrCount = Math.ceil(mqls / sales.mqlsPerSdr);
  const closerCount = Math.ceil(attendedCalls / sales.callsPerCloser);
  const totalOpCost = totalInvestment + (sdrCount * 3000) + (closerCount * 5000) + (totalSales * 200) + 500 + 1000;
  const roas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0;
  const cac = totalSales > 0 ? totalOpCost / totalSales : 0;
  const netProfit = totalRevenue - totalOpCost;

  const totalTarget = products.reduce((s, p) => s + p.targetUnits, 0);
  const overallConvRate = totalLeads > 0 ? totalSales / totalLeads : 0;

  const byProduct = products.map(p => {
    const pctShare = totalTarget > 0 ? p.targetUnits / totalTarget : 1 / products.length;
    const estimatedSales = Math.round(totalSales * pctShare);
    const estimatedLeads = overallConvRate > 0 ? Math.round(estimatedSales / overallConvRate) : 0;
    const revenueBase = estimatedSales * p.ticket;
    const revenueBump = estimatedSales * (p.orderBumpRate / 100) * p.orderBumpTicket;
    const revenueUpsell = estimatedSales * (p.upsellRate / 100) * p.upsellTicket;
    return {
      name: p.name,
      ticket: p.ticket,
      targetUnits: p.targetUnits,
      revenueBase,
      revenueBump,
      revenueUpsell,
      revenue: revenueBase + revenueBump + revenueUpsell,
      estimatedLeads,
    };
  });

  return {
    totalInvestment,
    totalLeads,
    mqls,
    scheduledCalls,
    attendedCalls,
    totalSales,
    totalRevenue,
    roas,
    cac,
    sdrCount,
    closerCount,
    totalOpCost,
    netProfit,
    byChannel: { socialSelling: ss, trafego: tr, organico: org },
    byProduct,
    bySubFunnel,
  };
}

export const formatCurrency = (value: number, currency: Currency = 'BRL') =>
  new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency }).format(value);
