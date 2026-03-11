import type { PlanningState, PlanResults, SubFunnelResults, Currency } from './types';
import { SDR_CAPACITY, CLOSER_CAPACITY } from './constants';

export function calcOverallRate(q: number, s: number, a: number, c: number): number {
  return (q / 100) * (s / 100) * (a / 100) * (c / 100) * 100;
}

export function calcSubFunnelLeads(investment: number, cpl: number): number {
  return cpl > 0 ? Math.floor(investment / cpl) : 0;
}

export function calculatePlan(state: PlanningState, periodDays = 30, scenarioMultiplier = 1.0): PlanResults {
  const { marketing, products } = state;
  const totalInvestment = marketing.dailyBudget * periodDays;

  const clampRate = (rate: number, mult: number) => Math.min(100, rate * mult);

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

  const bySubFunnel: SubFunnelResults[] = marketing.subFunnels.map(sf => {
    const investment = totalInvestment * sf.pctBudget / 100;
    const leads = calcSubFunnelLeads(investment, sf.cpl);
    const mqls = Math.floor(leads * clampRate(sf.qualificationRate, scenarioMultiplier) / 100);
    const scheduledCalls = Math.floor(mqls * clampRate(sf.schedulingRate, scenarioMultiplier) / 100);
    const attendedCalls = Math.floor(scheduledCalls * clampRate(sf.attendanceRate, scenarioMultiplier) / 100);
    const sales = Math.floor(attendedCalls * clampRate(sf.conversionRate, scenarioMultiplier) / 100);
    const rev = calcProductRevenue(sales);
    const overallRate = leads > 0 ? (sales / leads) * 100 : 0;

    return { id: sf.id, name: sf.name, investment, leads, cpl: sf.cpl, mqls, scheduledCalls, attendedCalls, sales, revenue: rev.total, overallRate };
  });

  const totalLeads = bySubFunnel.reduce((s, sf) => s + sf.leads, 0);
  const mqls = bySubFunnel.reduce((s, sf) => s + sf.mqls, 0);
  const scheduledCalls = bySubFunnel.reduce((s, sf) => s + sf.scheduledCalls, 0);
  const attendedCalls = bySubFunnel.reduce((s, sf) => s + sf.attendedCalls, 0);
  const totalSales = bySubFunnel.reduce((s, sf) => s + sf.sales, 0);
  const totalRevenue = bySubFunnel.reduce((s, sf) => s + sf.revenue, 0);

  const sdrCount = mqls > 0 ? Math.ceil(mqls / SDR_CAPACITY) : 0;
  const closerCount = attendedCalls > 0 ? Math.ceil(attendedCalls / CLOSER_CAPACITY) : 0;
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
    bySubFunnel,
    byProduct,
  };
}

export const formatCurrency = (value: number, currency: Currency = 'BRL') =>
  new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency }).format(value);
