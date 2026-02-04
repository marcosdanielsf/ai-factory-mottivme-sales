import React, { useState } from 'react';
import { Activity, Users, Calendar, TrendingUp, MessageSquare, CheckCircle, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import { useFunnelMetrics } from '../hooks';
import { useAuth } from '../contexts/AuthContext';

/**
 * Portal do Cliente - View simplificada de resultados
 * 
 * Mostra apenas as métricas importantes para o cliente
 * acompanhar os resultados que a MOTTIVME está gerando.
 */

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'blue' | 'green' | 'purple' | 'amber';
  trend?: { value: number; label: string };
}) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 hover:border-[#444] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.value >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

const FunnelStep = ({
  label,
  value,
  percentage,
  color,
  isLast = false
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  isLast?: boolean;
}) => (
  <div className="relative">
    <div className="flex items-center gap-4">
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0" 
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">{label}</span>
          <span className="text-sm font-semibold text-white">{value}</span>
        </div>
        <div className="h-2 bg-[#333] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
    {!isLast && (
      <div className="absolute left-[5px] top-[18px] w-0.5 h-8 bg-[#333]" />
    )}
  </div>
);

export const ClientPortal = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Pegar location_id do usuário (cliente)
  const locationId = user?.user_metadata?.location_id || null;
  
  const { 
    funnel, 
    engagement, 
    loading, 
    error 
  } = useFunnelMetrics(selectedPeriod, locationId);

  // Calcular totais
  const totalLeads = funnel[0]?.count || 0;
  const responderam = funnel[1]?.count || 0;
  const agendaram = funnel[2]?.count || 0;
  const compareceram = funnel[3]?.count || 0;
  const fecharam = funnel[4]?.count || 0;

  const taxaResposta = totalLeads > 0 ? ((responderam / totalLeads) * 100).toFixed(1) : '0';
  const taxaAgendamento = responderam > 0 ? ((agendaram / responderam) * 100).toFixed(1) : '0';
  const taxaConversao = totalLeads > 0 ? ((fecharam / totalLeads) * 100).toFixed(1) : '0';

  const periodLabels = {
    '7d': 'últimos 7 dias',
    '30d': 'últimos 30 dias',
    '90d': 'últimos 90 dias',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">Carregando seus resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <header className="border-b border-[#222] bg-[#111]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg">MOTTIV.ME</h1>
                <p className="text-xs text-gray-500">Portal de Resultados</p>
              </div>
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Seus Resultados
          </h2>
          <p className="text-gray-400">
            Acompanhe o desempenho da IA nos {periodLabels[selectedPeriod]}.
          </p>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Leads Gerados"
            value={totalLeads}
            subtitle="Novos contatos captados"
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Responderam"
            value={responderam}
            subtitle={`${taxaResposta}% de resposta`}
            icon={MessageSquare}
            color="green"
          />
          <MetricCard
            title="Agendamentos"
            value={agendaram}
            subtitle={`${taxaAgendamento}% dos que responderam`}
            icon={Calendar}
            color="purple"
          />
          <MetricCard
            title="Conversões"
            value={fecharam}
            subtitle={`${taxaConversao}% de conversão total`}
            icon={CheckCircle}
            color="amber"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funil */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target size={18} className="text-blue-400" />
              <h3 className="font-semibold">Funil de Conversão</h3>
            </div>
            
            <div className="space-y-6">
              {funnel.map((stage, i) => (
                <FunnelStep
                  key={stage.stage}
                  label={stage.stage}
                  value={stage.count}
                  percentage={(stage.count / (funnel[0]?.count || 1)) * 100}
                  color={stage.color}
                  isLast={i === funnel.length - 1}
                />
              ))}
            </div>

            {/* Taxa geral */}
            <div className="mt-6 pt-6 border-t border-[#333] flex items-center justify-between">
              <span className="text-gray-400">Conversão Geral</span>
              <span className="text-2xl font-bold text-emerald-400">{taxaConversao}%</span>
            </div>
          </div>

          {/* Métricas de Performance */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={18} className="text-purple-400" />
              <h3 className="font-semibold">Performance da IA</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Follow-ups por Lead</div>
                    <div className="text-lg font-semibold">{engagement.followupsPerLead}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Taxa de Resposta</div>
                    <div className="text-lg font-semibold">{engagement.taxaResposta}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Clock size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Tempo até Resposta</div>
                    <div className="text-lg font-semibold">{engagement.tempoAteResposta}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Zap size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Tentativa que Converte</div>
                    <div className="text-lg font-semibold">{engagement.tentativaQueConverte}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="flex gap-3">
                <Zap size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Insight:</strong> A IA está mantendo {engagement.followupsPerLead} follow-ups por lead, gerando {taxaResposta}% de taxa de resposta.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#222] text-center">
          <p className="text-sm text-gray-500">
            Dados atualizados em tempo real • Powered by MOTTIV.ME AI
          </p>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
