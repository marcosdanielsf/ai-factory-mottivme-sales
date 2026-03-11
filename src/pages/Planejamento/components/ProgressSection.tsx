import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { Currency } from '../types';
import { STATUS_CONFIG } from '../constants';
import { formatCurrency } from '../calculation-engine';
import { SalesGoal } from '../../../hooks/useSalesGoals';

function ProgressCard({ label, projection }: {
  label: string;
  projection: any;
}) {
  const status = STATUS_CONFIG[projection.status as keyof typeof STATUS_CONFIG];
  const progress = Math.min(100, Math.round((projection.actualToDate / projection.goalTotal) * 100));

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-default p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">
        {projection.actualToDate} <span className="text-sm text-text-muted">/ {projection.goalTotal}</span>
      </div>
      <div className="w-full bg-bg-primary rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all ${
            projection.status === 'ahead' ? 'bg-emerald-500' :
            projection.status === 'on_track' ? 'bg-green-500' :
            projection.status === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">
        Projecao: {projection.projectedTotal} ({projection.projectedPercentOfGoal}%)
      </p>
    </div>
  );
}

export function ProgressSection({ activeGoal, projections, chartData, funnelData, actualData, currency, showWizard }: {
  activeGoal: SalesGoal;
  projections: any;
  chartData: any[];
  funnelData: any;
  actualData: any;
  currency: Currency;
  showWizard: boolean;
}) {
  return (
    <>
      {showWizard && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Progresso vs Meta</h3>
        </div>
      )}

      {!showWizard && <h3 className="text-sm font-semibold text-text-primary mt-2">Progresso vs Meta</h3>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ProgressCard label="Leads" projection={projections.leads} />
        <ProgressCard label="Agendamentos" projection={projections.agendamentos} />
        <ProgressCard label="Comparecimentos" projection={projections.comparecimentos} />
        <ProgressCard label="Vendas" projection={projections.vendas} />
      </div>

      {/* Grafico */}
      <div className="bg-bg-secondary rounded-xl border border-border-default p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Projecao de Leads</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return `${d.getDate()}/${d.getMonth() + 1}`; }}
            />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
              labelFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('pt-BR'); }}
            />
            <Legend />
            <Line type="monotone" dataKey="meta" name="Meta" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="real" name="Real" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="projecao" name="Projecao" stroke="#eab308" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detalhamento por Origem */}
      <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Detalhamento por Origem</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left px-6 py-3 text-text-muted font-medium">Etapa</th>
                <th className="text-center px-3 py-3 text-blue-400 font-medium">SS Meta</th>
                <th className="text-center px-3 py-3 text-blue-400 font-medium">SS Real</th>
                <th className="text-center px-3 py-3 text-amber-400 font-medium">Traf Meta</th>
                <th className="text-center px-3 py-3 text-amber-400 font-medium">Traf Real</th>
                <th className="text-center px-3 py-3 text-emerald-400 font-medium">Org Meta</th>
                <th className="text-center px-3 py-3 text-emerald-400 font-medium">Org Real</th>
                <th className="text-center px-3 py-3 text-text-muted font-medium">Total Meta</th>
                <th className="text-center px-3 py-3 text-blue-400 font-medium">Total Real</th>
              </tr>
            </thead>
            <tbody>
              {([
                {
                  label: 'Leads',
                  metaSS: activeGoal.goal_leads_social_selling, realSS: actualData.leadsSS,
                  metaTr: activeGoal.goal_leads_trafego, realTr: actualData.leadsTrafego,
                  metaOrg: activeGoal.goal_leads_organico, realOrg: actualData.leadsOrganico,
                  metaTotal: activeGoal.goal_leads_total, realTotal: actualData.leads,
                },
                {
                  label: 'Responderam',
                  metaSS: Math.round(activeGoal.goal_leads_social_selling * (activeGoal.calc_qualification_rate || 50) / 100),
                  realSS: funnelData.socialSelling.responderam,
                  metaTr: Math.round(activeGoal.goal_leads_trafego * (activeGoal.calc_qualification_rate || 50) / 100),
                  realTr: funnelData.trafego.responderam,
                  metaOrg: Math.round(activeGoal.goal_leads_organico * (activeGoal.calc_qualification_rate || 50) / 100),
                  realOrg: funnelData.whatsappDireto.responderam + funnelData.organico.responderam,
                  metaTotal: activeGoal.goal_responderam, realTotal: actualData.responderam,
                },
                {
                  label: 'Agendaram',
                  metaSS: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                  realSS: funnelData.socialSelling.agendaram,
                  metaTr: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                  realTr: funnelData.trafego.agendaram,
                  metaOrg: Math.round(activeGoal.goal_agendamentos * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                  realOrg: funnelData.whatsappDireto.agendaram + funnelData.organico.agendaram,
                  metaTotal: activeGoal.goal_agendamentos, realTotal: actualData.agendamentos,
                },
                {
                  label: 'Compareceram',
                  metaSS: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                  realSS: funnelData.socialSelling.compareceram,
                  metaTr: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                  realTr: funnelData.trafego.compareceram,
                  metaOrg: Math.round(activeGoal.goal_comparecimentos * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                  realOrg: funnelData.whatsappDireto.compareceram + funnelData.organico.compareceram,
                  metaTotal: activeGoal.goal_comparecimentos, realTotal: actualData.comparecimentos,
                },
                {
                  label: 'Vendas',
                  metaSS: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_social_selling / Math.max(1, activeGoal.goal_leads_total)),
                  realSS: funnelData.socialSelling.fecharam,
                  metaTr: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_trafego / Math.max(1, activeGoal.goal_leads_total)),
                  realTr: funnelData.trafego.fecharam,
                  metaOrg: Math.round(activeGoal.goal_vendas * activeGoal.goal_leads_organico / Math.max(1, activeGoal.goal_leads_total)),
                  realOrg: funnelData.whatsappDireto.fecharam + funnelData.organico.fecharam,
                  metaTotal: activeGoal.goal_vendas, realTotal: actualData.vendas,
                },
              ]).map((row, i) => {
                const pctTotal = row.metaTotal > 0 ? Math.round((row.realTotal / row.metaTotal) * 100) : 0;
                return (
                  <tr key={row.label} className={i < 4 ? 'border-b border-border-default' : ''}>
                    <td className="px-6 py-2.5 font-medium text-text-primary text-sm">{row.label}</td>
                    <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaSS}</td>
                    <td className="text-center px-3 py-2.5 text-blue-400 font-bold text-xs">{row.realSS}</td>
                    <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaTr}</td>
                    <td className="text-center px-3 py-2.5 text-amber-400 font-bold text-xs">{row.realTr}</td>
                    <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaOrg}</td>
                    <td className="text-center px-3 py-2.5 text-emerald-400 font-bold text-xs">{row.realOrg}</td>
                    <td className="text-center px-3 py-2.5 text-text-muted text-xs">{row.metaTotal}</td>
                    <td className="text-center px-3 py-2.5 font-bold text-xs">
                      <span className={pctTotal >= 90 ? 'text-green-400' : pctTotal >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                        {row.realTotal} ({pctTotal}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-border-default bg-bg-primary/50">
                <td className="px-6 py-2.5 font-medium text-text-primary text-sm">Investimento</td>
                <td colSpan={6}></td>
                <td colSpan={2} className="text-center px-3 py-2.5 text-blue-400 font-bold text-sm">
                  {formatCurrency(activeGoal.calc_daily_investment * 30, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
