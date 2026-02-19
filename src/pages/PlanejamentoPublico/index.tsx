import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import type { PlanningState, ScenarioKey, Currency, PlanResults, ProductItem, SubFunnel, ScenarioConfig } from '../Planejamento/types';
import { DEFAULT_STATE, DEFAULT_SCENARIO_CONFIG } from '../Planejamento/constants';
import { calculatePlan, formatCurrency } from '../Planejamento/calculation-engine';

import { WizardSteps } from '../Planejamento/components/WizardSteps';
import { ProductsStep } from '../Planejamento/components/ProductsStep';
import { MarketingStep } from '../Planejamento/components/MarketingStep';
import { SalesStep } from '../Planejamento/components/SalesStep';
import { ResultsSidebar } from '../Planejamento/components/ResultsSidebar';

const TOKEN_REGEX = /^[a-f0-9]{32,64}$/;

interface ScenarioSummary {
  totalSales: number;
  totalRevenue: number;
  roas: number;
  netProfit: number;
  totalLeads: number;
  totalInvestment: number;
}

interface PlanSavedData {
  planState: PlanningState;
  scenarios: Record<ScenarioKey, ScenarioSummary>;
  savedAt: string;
}

interface TokenConfig {
  currency?: Currency;
  products?: ProductItem[];
  subFunnels?: SubFunnel[];
  dailyBudget?: number;
  scenarioConfig?: ScenarioConfig;
  clientName?: string;
}

interface TokenData {
  id: string;
  token: string;
  client_name: string;
  location_id: string | null;
  config: TokenConfig;
  plan_data: PlanSavedData | null;
  expires_at: string | null;
  is_active: boolean;
}

type PageState = 'loading' | 'error' | 'wizard' | 'saved';

export default function PlanejamentoPublico() {
  const { token } = useParams<{ token: string }>();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [plan, setPlan] = useState<PlanningState>(DEFAULT_STATE);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('realista');

  // Fetch token data
  useEffect(() => {
    if (!token || !TOKEN_REGEX.test(token)) {
      setErrorMsg('Link invalido. Verifique o endereco e tente novamente.');
      setPageState('error');
      return;
    }

    const fetchToken = async () => {
      const { data, error } = await supabase
        .from('planning_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[PlanejamentoPublico] fetch error:', error.code, error.message);
        const msg = error.code === 'PGRST116'
          ? 'Este link de planejamento nao existe, expirou ou foi desativado.'
          : 'Erro ao carregar o planejamento. Tente novamente em alguns instantes.';
        setErrorMsg(msg);
        setPageState('error');
        return;
      }

      if (!data) {
        setErrorMsg('Este link de planejamento nao existe, expirou ou foi desativado.');
        setPageState('error');
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setErrorMsg('Este link de planejamento expirou. Entre em contato com a equipe MOTTIVME.');
        setPageState('error');
        return;
      }

      const td = data as TokenData;
      setTokenData(td);

      // If plan_data exists, show saved summary
      if (td.plan_data?.planState) {
        setPlan(td.plan_data.planState);
        setPageState('saved');
      } else {
        // Initialize from config
        const cfg = td.config || {};
        setPlan(prev => ({
          ...prev,
          currency: cfg.currency || prev.currency,
          products: Array.isArray(cfg.products) && cfg.products.length > 0 ? cfg.products : prev.products,
          marketing: {
            dailyBudget: cfg.dailyBudget ?? prev.marketing.dailyBudget,
            subFunnels: Array.isArray(cfg.subFunnels) && cfg.subFunnels.length > 0 ? cfg.subFunnels : prev.marketing.subFunnels,
          },
          scenarioConfig: cfg.scenarioConfig || DEFAULT_SCENARIO_CONFIG,
        }));
        setPageState('wizard');
      }
    };

    fetchToken();
  }, [token]);

  // Calculate scenarios
  const scenarios = useMemo(() => ({
    pessimista: calculatePlan(plan, 30, plan.scenarioConfig.pessimista),
    realista: calculatePlan(plan, 30, plan.scenarioConfig.realista),
    otimista: calculatePlan(plan, 30, plan.scenarioConfig.otimista),
  }), [plan]);

  const results = scenarios[activeScenario];

  // Save plan via RPC
  const handleSave = async () => {
    if (!tokenData) return;
    setSaving(true);
    setSaveError(null);

    try {
      const extractSummary = (r: PlanResults): ScenarioSummary => ({
        totalSales: r.totalSales,
        totalRevenue: r.totalRevenue,
        roas: r.roas,
        netProfit: r.netProfit,
        totalLeads: r.totalLeads,
        totalInvestment: r.totalInvestment,
      });

      const planDataToSave: PlanSavedData = {
        planState: plan,
        scenarios: {
          pessimista: extractSummary(scenarios.pessimista),
          realista: extractSummary(scenarios.realista),
          otimista: extractSummary(scenarios.otimista),
        },
        savedAt: new Date().toISOString(),
      };

      const { data, error } = await supabase.rpc('save_public_plan', {
        p_token: tokenData.token,
        p_plan_data: planDataToSave,
      });

      if (error) throw error;
      if (data === false) throw new Error('Token invalido ou expirado');

      setTokenData(prev => prev ? { ...prev, plan_data: planDataToSave } : prev);
      setPageState('saved');
    } catch (err) {
      console.error('Erro ao salvar planejamento:', err);
      setSaveError('Nao foi possivel salvar. Verifique sua conexao e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Restart wizard
  const handleRestart = () => {
    setPageState('wizard');
    setSaveError(null);
    setPlan(p => ({ ...p, step: 1 }));
  };

  const clientName = tokenData?.client_name || tokenData?.config?.clientName || 'Cliente';

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="text-blue-400 animate-spin mx-auto" />
          <p className="text-sm text-text-muted">Carregando planejamento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary rounded-2xl border border-border-default p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-text-primary">Link Indisponivel</h1>
          <p className="text-sm text-text-muted">{errorMsg}</p>
          <p className="text-xs text-text-muted pt-2">
            Precisa de ajuda? Entre em contato com a equipe <span className="text-blue-400 font-medium">MOTTIVME</span>.
          </p>
        </div>
      </div>
    );
  }

  // Saved summary state
  if (pageState === 'saved') {
    const r = scenarios.realista;
    const p = scenarios.pessimista;
    const o = scenarios.otimista;

    return (
      <div className="min-h-screen bg-bg-primary">
        <Header clientName={clientName} />

        <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Success banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">Planejamento salvo com sucesso!</p>
              <p className="text-xs text-text-muted mt-0.5">Sua equipe MOTTIVME ja pode visualizar os resultados.</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Investimento" value={formatCurrency(r.totalInvestment, plan.currency)} sub={`${formatCurrency(plan.marketing.dailyBudget, plan.currency)}/dia`} />
            <KpiCard label="Vendas" value={String(r.totalSales)} sub={`${r.totalLeads} leads`} />
            <KpiCard label="Faturamento" value={formatCurrency(r.totalRevenue, plan.currency)} sub={`ROAS ${r.roas.toFixed(1)}x`} />
            <KpiCard label="Lucro Liquido" value={formatCurrency(r.netProfit, plan.currency)} sub={`CAC ${formatCurrency(r.cac, plan.currency)}`} positive={r.netProfit >= 0} />
          </div>

          {/* Scenarios table */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Cenarios</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-2 text-xs text-text-muted font-medium"></th>
                  <th className="text-center py-2 text-xs text-yellow-400 font-medium">Aceitavel</th>
                  <th className="text-center py-2 text-xs text-blue-400 font-medium">Realista</th>
                  <th className="text-center py-2 text-xs text-green-400 font-medium">Otimista</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-default/50">
                  <td className="py-2 text-xs text-text-muted">Vendas</td>
                  <td className="text-center text-xs text-text-secondary">{p.totalSales}</td>
                  <td className="text-center text-xs font-bold text-blue-400">{r.totalSales}</td>
                  <td className="text-center text-xs text-text-secondary">{o.totalSales}</td>
                </tr>
                <tr className="border-b border-border-default/50">
                  <td className="py-2 text-xs text-text-muted">Faturamento</td>
                  <td className="text-center text-xs text-text-secondary">{formatCurrency(p.totalRevenue, plan.currency)}</td>
                  <td className="text-center text-xs font-bold text-blue-400">{formatCurrency(r.totalRevenue, plan.currency)}</td>
                  <td className="text-center text-xs text-text-secondary">{formatCurrency(o.totalRevenue, plan.currency)}</td>
                </tr>
                <tr className="border-b border-border-default/50">
                  <td className="py-2 text-xs text-text-muted">ROAS</td>
                  <td className="text-center text-xs text-text-secondary">{p.roas.toFixed(1)}x</td>
                  <td className="text-center text-xs font-bold text-blue-400">{r.roas.toFixed(1)}x</td>
                  <td className="text-center text-xs text-text-secondary">{o.roas.toFixed(1)}x</td>
                </tr>
                <tr>
                  <td className="py-2 text-xs text-text-muted">Lucro</td>
                  <td className={`text-center text-xs ${p.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(p.netProfit, plan.currency)}</td>
                  <td className={`text-center text-xs font-bold ${r.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(r.netProfit, plan.currency)}</td>
                  <td className={`text-center text-xs ${o.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(o.netProfit, plan.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Funnel visual */}
          <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Funil de Vendas</h4>
            <div className="space-y-2">
              {[
                { label: 'Leads', value: r.totalLeads, maxValue: r.totalLeads },
                { label: 'MQLs', value: r.mqls, maxValue: r.totalLeads },
                { label: 'Agendados', value: r.scheduledCalls, maxValue: r.totalLeads },
                { label: 'Realizados', value: r.attendedCalls, maxValue: r.totalLeads },
                { label: 'Vendas', value: r.totalSales, maxValue: r.totalLeads },
              ].map(item => {
                const pct = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-muted">{item.label}</span>
                      <span className="text-text-primary font-semibold">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {r.totalLeads > 0 && (
                <p className="text-[10px] text-text-muted mt-1">
                  Conversao geral: <span className="text-blue-400 font-semibold">{((r.totalSales / r.totalLeads) * 100).toFixed(2)}%</span>
                </p>
              )}
            </div>
          </div>

          {/* Products breakdown */}
          {r.byProduct.length > 0 && (
            <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Produtos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {r.byProduct.map(bp => (
                  <div key={bp.name} className="bg-bg-primary rounded-lg border border-border-default p-3">
                    <div className="text-xs font-medium text-text-primary mb-1">{bp.name}</div>
                    <div className="text-lg font-bold text-blue-400">{formatCurrency(bp.revenue, plan.currency)}</div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {bp.targetUnits} vendas x {formatCurrency(bp.ticket, plan.currency)}
                    </div>
                    {(bp.revenueBump > 0 || bp.revenueUpsell > 0) && (
                      <div className="mt-1 space-y-0.5">
                        {bp.revenueBump > 0 && <div className="text-[10px] text-green-400">+ Bump: {formatCurrency(bp.revenueBump, plan.currency)}</div>}
                        {bp.revenueUpsell > 0 && <div className="text-[10px] text-green-400">+ Upsell: {formatCurrency(bp.revenueUpsell, plan.currency)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restart button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-5 py-2.5 bg-bg-secondary hover:bg-bg-hover border border-border-default text-text-primary rounded-xl font-medium transition-colors text-sm"
            >
              <RefreshCw size={16} /> Refazer Planejamento
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Wizard state
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header clientName={clientName} />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
          {/* Currency Toggle + Wizard Steps */}
          <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-default bg-bg-primary/50">
            <WizardSteps step={plan.step} onChange={s => setPlan(p => ({ ...p, step: s }))} />
            <div className="flex items-center bg-bg-primary rounded-lg border border-border-default p-0.5">
              <button
                onClick={() => setPlan(p => ({ ...p, currency: 'BRL' }))}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'BRL' ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                R$ BRL
              </button>
              <button
                onClick={() => setPlan(p => ({ ...p, currency: 'USD' }))}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${plan.currency === 'USD' ? 'bg-blue-500 text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                $ USD
              </button>
            </div>
          </div>

          {/* Wizard Content + Results Sidebar */}
          <div className="flex flex-col lg:flex-row">
            {/* Left: Wizard Steps */}
            <div className="flex-1 px-4 md:px-6 py-5 lg:border-r border-border-default min-w-0">
              {plan.step === 1 && (
                <ProductsStep
                  products={plan.products}
                  currency={plan.currency}
                  onChange={products => setPlan(p => ({ ...p, products }))}
                />
              )}
              {plan.step === 2 && (
                <MarketingStep
                  marketing={plan.marketing}
                  currency={plan.currency}
                  onChange={marketing => setPlan(p => ({ ...p, marketing }))}
                />
              )}
              {plan.step === 3 && (
                <SalesStep
                  subFunnels={plan.marketing.subFunnels}
                  onChange={subFunnels => setPlan(p => ({ ...p, marketing: { ...p.marketing, subFunnels } }))}
                />
              )}

              {/* Save error feedback */}
              {saveError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <XCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{saveError}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
                <button
                  onClick={() => setPlan(p => ({ ...p, step: Math.max(1, p.step - 1) as 1 | 2 | 3 }))}
                  disabled={plan.step === 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>

                <div className="flex items-center gap-2">
                  {plan.step === 3 ? (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
                      {saving ? 'Salvando...' : 'Salvar Planejamento'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setPlan(p => ({ ...p, step: Math.min(3, p.step + 1) as 1 | 2 | 3 }))}
                      className="flex items-center gap-1.5 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Proximo <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Results Sidebar */}
            <ResultsSidebar
              results={results}
              scenarios={scenarios}
              activeScenario={activeScenario}
              onScenarioChange={setActiveScenario}
              currency={plan.currency}
              products={plan.products}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Helper Components ----

function Header({ clientName }: { clientName: string }) {
  return (
    <header className="border-b border-border-default px-4 md:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Target size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Planejamento de Vendas</h1>
          <p className="text-xs text-text-muted">{clientName}</p>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ label, value, sub, positive }: { label: string; value: string; sub: string; positive?: boolean }) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${positive === false ? 'text-red-400' : 'text-blue-400'}`}>{value}</p>
      <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
    </div>
  );
}
