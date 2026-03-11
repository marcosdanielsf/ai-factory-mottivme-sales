import React, { useState, useMemo } from 'react';
import { Loader2, TrendingUp, Users, Calendar, Trophy, Target, ArrowRight, Phone, Mail, MessageCircle, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import { Button, Card, Badge, ChannelBadge } from '../UI';
import { useData } from '../../App';
import { UILead } from '../../hooks/useSupabaseData';

// Source type filter
type SourceFilter = 'all' | 'outbound' | 'inbound';

// Funnel stage config
const FUNNEL_STAGES = [
  { key: 'prospected', label: 'Prospectados', color: 'from-slate-500 to-slate-400', section: 'outbound' },
  { key: 'lead', label: 'Leads', color: 'from-purple-500 to-purple-400', section: 'inbound' },
  { key: 'qualified', label: 'Qualificados', color: 'from-indigo-600 to-indigo-500', section: 'conversion' },
  { key: 'scheduled', label: 'Agendados', color: 'from-blue-500 to-blue-400', section: 'conversion' },
  { key: 'showed', label: 'Compareceram', color: 'from-emerald-500 to-emerald-400', section: 'conversion' },
  { key: 'no_show', label: 'No-Show', color: 'from-red-500 to-red-400', section: 'conversion' },
  { key: 'proposal', label: 'Propostas', color: 'from-amber-500 to-amber-400', section: 'conversion' },
  { key: 'won', label: 'Vendas', color: 'from-cyan-500 to-cyan-400', section: 'conversion' },
];

// Channel config - maps source_channel to display info
const CHANNEL_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  // Outbound channels
  instagram: { icon: Instagram, color: 'bg-pink-500', label: 'Instagram' },
  instagram_dm: { icon: Instagram, color: 'bg-pink-500', label: 'Instagram DM' },
  instagram_search: { icon: Instagram, color: 'bg-pink-500', label: 'Instagram Search' },
  instagram_scraping: { icon: Instagram, color: 'bg-pink-400', label: 'Instagram Scraping' },
  apify_scraping: { icon: Instagram, color: 'bg-orange-500', label: 'Apify Scraping' },
  linkedin: { icon: Linkedin, color: 'bg-[#0A66C2]', label: 'LinkedIn' },
  linkedin_search: { icon: Linkedin, color: 'bg-[#0A66C2]', label: 'LinkedIn Search' },
  linkedin_dm: { icon: Linkedin, color: 'bg-[#0A66C2]', label: 'LinkedIn DM' },
  cnpj_search: { icon: Target, color: 'bg-amber-600', label: 'CNPJ Search' },
  cold_email: { icon: Mail, color: 'bg-slate-500', label: 'Cold Email' },
  cold_call: { icon: Phone, color: 'bg-blue-500', label: 'Cold Call' },

  // Inbound channels
  email: { icon: Mail, color: 'bg-slate-500', label: 'Email' },
  whatsapp: { icon: MessageCircle, color: 'bg-emerald-500', label: 'WhatsApp' },
  phone: { icon: Phone, color: 'bg-blue-500', label: 'Telefone' },
  ads: { icon: Target, color: 'bg-amber-500', label: 'Ads' },
  facebook_ads: { icon: Target, color: 'bg-blue-600', label: 'Facebook Ads' },
  instagram_ads: { icon: Instagram, color: 'bg-pink-600', label: 'Instagram Ads' },
  google_ads: { icon: Target, color: 'bg-green-500', label: 'Google Ads' },
  referral: { icon: Users, color: 'bg-indigo-500', label: 'Indicação' },
  organic: { icon: ExternalLink, color: 'bg-slate-400', label: 'Orgânico' },
  website: { icon: ExternalLink, color: 'bg-cyan-500', label: 'Website' },
};

// KPI Card Component
const KPICard: React.FC<{
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sublabel?: string;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}> = ({ icon, value, label, sublabel, trend, trendUp = true, colorClass = 'border-t-blue-500' }) => (
  <Card className={`p-4 border-t-4 ${colorClass} hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          trendUp
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {trend}
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
      {value}
    </div>
    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
      {label}
    </div>
    {sublabel && (
      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
        <TrendingUp size={12} />
        {sublabel}
      </div>
    )}
  </Card>
);

// Funnel Bar Component
const FunnelBar: React.FC<{
  label: string;
  value: number;
  maxValue: number;
  percentage?: number;
  colorClass: string;
}> = ({ label, value, maxValue, percentage, colorClass }) => {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 5) : 5;

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-24 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </div>
      <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} flex items-center px-3 transition-all duration-700 ease-out`}
          style={{ width: `${width}%`, minWidth: '40px' }}
        >
          <span className="text-white font-semibold text-sm">{value}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 w-20">
        <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {percentage !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
};

// Channel Item Component
const ChannelItem: React.FC<{
  channel: string;
  count: number;
  percentage: number;
}> = ({ channel, count, percentage }) => {
  // Get config or create fallback with real channel name
  const config = CHANNEL_CONFIG[channel] || {
    icon: ExternalLink,
    color: 'bg-slate-400',
    label: channel.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  };
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <Icon size={16} className="text-slate-500 dark:text-slate-400" />
      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
        {config.label}
      </span>
      <span className="font-bold text-slate-900 dark:text-slate-100">{count}</span>
      <span className="text-xs text-slate-400 dark:text-slate-500 w-10 text-right">{percentage}%</span>
    </div>
  );
};

// Lead Row Component
const LeadRow: React.FC<{ lead: UILead }> = ({ lead }) => {
  const tempEmoji = lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '🌡️' : '❄️';
  const statusColors: Record<string, string> = {
    'Prospected': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    'New Lead': 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'Qualified': 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    'Scheduled': 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'Showed': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    'Won': 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
            lead.sourceType === 'outbound'
              ? 'bg-gradient-to-br from-orange-500 to-orange-400'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-400'
          }`}>
            {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{lead.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{lead.title || lead.company || '@' + lead.name.toLowerCase().replace(' ', '')}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          lead.sourceType === 'outbound'
            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
        }`}>
          {lead.sourceType === 'outbound' ? '🎯' : '📥'}
          {lead.sourceType === 'outbound' ? 'Outbound' : 'Inbound'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {lead.channels.slice(0, 3).map(c => (
            <ChannelBadge key={c} channel={c as any} size="sm" />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[lead.status] || statusColors['New Lead']}`}>
          {lead.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-lg">{tempEmoji}</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
        {lead.lastContactAt
          ? new Date(lead.lastContactAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '-'
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            👁️
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            💬
          </button>
        </div>
      </td>
    </tr>
  );
};

// Main Component
export const GrowthDashboardView: React.FC = () => {
  const { leads, funnelData, loading } = useData();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'month'>('7d');

  // Filter leads by source type
  const filteredLeads = useMemo(() => {
    if (sourceFilter === 'all') return leads;
    return leads.filter(l => l.sourceType === sourceFilter);
  }, [leads, sourceFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const outbound = leads.filter(l => l.sourceType === 'outbound');
    const inbound = leads.filter(l => l.sourceType === 'inbound');

    // Funnel counts from filtered leads
    const funnelCounts: Record<string, number> = {};
    FUNNEL_STAGES.forEach(stage => {
      funnelCounts[stage.key] = filteredLeads.filter(l => l.funnelStage === stage.key).length;
    });

    // Channel breakdown
    const channelCounts: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      const channel = lead.sourceChannel || 'unknown';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    // Outbound channels
    const outboundChannels: Record<string, number> = {};
    outbound.forEach(lead => {
      const channel = lead.sourceChannel || 'unknown';
      outboundChannels[channel] = (outboundChannels[channel] || 0) + 1;
    });

    // Inbound channels
    const inboundChannels: Record<string, number> = {};
    inbound.forEach(lead => {
      const channel = lead.sourceChannel || 'unknown';
      inboundChannels[channel] = (inboundChannels[channel] || 0) + 1;
    });

    // Conversion rates
    const prospected = funnelCounts['prospected'] || 0;
    const leadsCount = funnelCounts['lead'] || 0;
    const qualified = funnelCounts['qualified'] || 0;
    const scheduled = funnelCounts['scheduled'] || 0;
    const showed = funnelCounts['showed'] || 0;
    const noShow = funnelCounts['no_show'] || 0;
    const proposals = funnelCounts['proposal'] || 0;
    const won = funnelCounts['won'] || 0;

    const totalLeads = leadsCount + qualified + scheduled + showed + noShow + proposals + won;
    const qualificationRate = totalLeads > 0 ? Math.round((qualified / totalLeads) * 100) : 0;
    const schedulingRate = qualified > 0 ? Math.round((scheduled / qualified) * 100) : 0;
    const showRate = scheduled > 0 ? Math.round((showed / scheduled) * 100) : 0;
    const proposalRate = showed > 0 ? Math.round((proposals / showed) * 100) : 0;
    const closingRate = proposals > 0 ? Math.round((won / proposals) * 100) : 0;

    return {
      total: leads.length,
      outbound: outbound.length,
      inbound: inbound.length,
      funnelCounts,
      channelCounts,
      outboundChannels,
      inboundChannels,
      prospected,
      leads: totalLeads,
      qualified,
      scheduled,
      showed,
      noShow,
      proposals,
      won,
      qualificationRate,
      schedulingRate,
      showRate,
      proposalRate,
      closingRate,
    };
  }, [leads, filteredLeads]);

  // Max value for funnel bars
  const maxFunnelValue = Math.max(...Object.values(stats.funnelCounts), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500 dark:text-slate-400">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Growth Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Funil de vendas e métricas de conversão</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['today', '7d', '30d', 'month'] as const).map(period => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  periodFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {period === 'today' ? 'Hoje' : period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Source Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSourceFilter('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              sourceFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>📊</span>
            Todos
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              sourceFilter === 'all' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
            }`}>
              {stats.total}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter('outbound')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              sourceFilter === 'outbound'
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>🎯</span>
            Outbound
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              sourceFilter === 'outbound' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
            }`}>
              {stats.outbound}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter('inbound')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              sourceFilter === 'inbound'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>📥</span>
            Inbound
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              sourceFilter === 'inbound' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
            }`}>
              {stats.inbound}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          icon={<Target size={20} />}
          value={stats.prospected}
          label="Prospectados"
          sublabel="Outbound ativo"
          trend="+23%"
          colorClass="border-t-slate-400"
        />
        <KPICard
          icon={<Users size={20} />}
          value={stats.leads}
          label="Leads"
          sublabel="Inbound + Responderam"
          trend="+18%"
          colorClass="border-t-purple-500"
        />
        <KPICard
          icon={<TrendingUp size={20} />}
          value={stats.qualified}
          label="Qualificados"
          sublabel={`${stats.qualificationRate}% taxa`}
          trend="+15%"
          colorClass="border-t-indigo-600"
        />
        <KPICard
          icon={<Calendar size={20} />}
          value={stats.scheduled}
          label="Agendados"
          sublabel={`${stats.showRate}% show-rate`}
          trend="+12%"
          colorClass="border-t-blue-500"
        />
        <KPICard
          icon={<Trophy size={20} />}
          value={stats.won}
          label="Vendas"
          sublabel="R$ 24.985"
          trend="+25%"
          colorClass="border-t-cyan-500"
        />
      </div>

      {/* Main Grid - Funnel + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>📊</span>
                Funil de Vendas
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Conversão por etapa do Growth OS</p>
            </div>
            <Button variant="ghost" className="text-sm">Detalhes</Button>
          </div>

          <div className="space-y-6">
            {/* Outbound Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Outbound (Social Selling)
                </span>
              </div>
              <FunnelBar
                label="Prospectados"
                value={stats.prospected}
                maxValue={maxFunnelValue}
                colorClass="from-slate-500 to-slate-400"
              />
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              <ArrowRight size={16} className="mx-2 rotate-90" />
              responderam ({stats.leads > 0 && stats.prospected > 0 ? Math.round((stats.leads / (stats.prospected + stats.leads)) * 100) : 0}%)
            </div>

            {/* Inbound Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Inbound (Tráfego + Respostas)
                </span>
              </div>
              <FunnelBar
                label="Leads"
                value={stats.leads}
                maxValue={maxFunnelValue}
                percentage={stats.inbound + (stats.leads - stats.inbound) > 0 ? Math.round(((stats.leads - stats.inbound) / stats.leads) * 100) : 0}
                colorClass="from-purple-500 to-purple-400"
              />
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              <ArrowRight size={16} className="mx-2 rotate-90" />
              qualificados
            </div>

            {/* Conversion Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Conversão
                </span>
              </div>
              <div className="space-y-2">
                <FunnelBar label="Qualificados" value={stats.qualified} maxValue={maxFunnelValue} percentage={stats.qualificationRate} colorClass="from-indigo-600 to-indigo-500" />
                <FunnelBar label="Agendados" value={stats.scheduled} maxValue={maxFunnelValue} percentage={stats.schedulingRate} colorClass="from-blue-500 to-blue-400" />
                <FunnelBar label="Compareceram" value={stats.showed} maxValue={maxFunnelValue} percentage={stats.showRate} colorClass="from-emerald-500 to-emerald-400" />
                <FunnelBar label="No-Show" value={stats.noShow} maxValue={maxFunnelValue} colorClass="from-red-500 to-red-400" />
                <FunnelBar label="Propostas" value={stats.proposals} maxValue={maxFunnelValue} percentage={stats.proposalRate} colorClass="from-amber-500 to-amber-400" />
                <FunnelBar label="Vendas" value={stats.won} maxValue={maxFunnelValue} percentage={stats.closingRate} colorClass="from-cyan-500 to-cyan-400" />
              </div>
            </div>
          </div>
        </Card>

        {/* Channel Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>📱</span>
              Canais
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Origem dos leads</p>
          </div>

          <div className="space-y-6">
            {/* Outbound Channels */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  🎯
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Outbound</span>
                <span className="ml-auto font-bold text-lg text-slate-900 dark:text-slate-100">{stats.outbound}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.outboundChannels)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([channel, count]) => (
                    <ChannelItem
                      key={channel}
                      channel={channel}
                      count={count}
                      percentage={stats.outbound > 0 ? Math.round((count / stats.outbound) * 100) : 0}
                    />
                  ))}
              </div>
            </div>

            {/* Inbound Channels */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-600">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  📥
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Inbound</span>
                <span className="ml-auto font-bold text-lg text-slate-900 dark:text-slate-100">{stats.inbound}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(stats.inboundChannels)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([channel, count]) => (
                    <ChannelItem
                      key={channel}
                      channel={channel}
                      count={count}
                      percentage={stats.inbound > 0 ? Math.round((count / stats.inbound) * 100) : 0}
                    />
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>👥</span>
              Leads Recentes
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Últimas interações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-sm">Filtrar</Button>
            <Button variant="outline" className="text-sm">Exportar</Button>
            <Button className="text-sm">Ver Todos</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Canal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Etapa</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temp.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLeads.slice(0, 10).map(lead => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Nenhum lead encontrado</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GrowthDashboardView;
