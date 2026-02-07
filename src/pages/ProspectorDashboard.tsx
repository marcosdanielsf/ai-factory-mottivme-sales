import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Users,
  Send,
  TrendingUp,
  CalendarCheck,
  Play,
  Pause,
  Edit,
  Eye,
  Instagram,
  Linkedin,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { useProspectorCampaigns, useProspectorAnalytics, ProspectorCampaign } from '../hooks/useProspector';

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

const getVerticalColor = (vertical: string) => {
  switch (vertical) {
    case 'clinicas':
      return 'text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/20';
    case 'coaches':
      return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
    case 'infoprodutores':
      return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativa':
      return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
    case 'pausada':
      return 'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20';
    case 'concluida':
      return 'text-text-muted bg-bg-hover border-border-default';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'instagram':
      return <Instagram size={16} />;
    case 'linkedin':
      return <Linkedin size={16} />;
    case 'whatsapp':
      return <MessageCircle size={16} />;
    default:
      return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// METRIC CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

const MetricCard = ({ icon, label, value, trend, color = 'text-[#58a6ff]' }: MetricCardProps) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-colors">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-[#0d1117] ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-[#8b949e] mb-1">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
        {trend && (
          <p className="text-[10px] text-[#3fb950] mt-0.5 flex items-center gap-1">
            <TrendingUp size={10} />
            {trend}
          </p>
        )}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface CampaignCardProps {
  campaign: ProspectorCampaign;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const CampaignCard = ({ campaign, onPause, onResume, onView, onEdit }: CampaignCardProps) => {
  const progress = campaign.total_leads > 0 
    ? (campaign.leads_processed / campaign.total_leads) * 100 
    : 0;

  const replyRate = campaign.dms_sent > 0 
    ? ((campaign.replies / campaign.dms_sent) * 100).toFixed(1) 
    : '0.0';

  const conversionRate = campaign.dms_sent > 0 
    ? ((campaign.conversions / campaign.dms_sent) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-2">{campaign.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getVerticalColor(campaign.vertical)}`}>
              {campaign.vertical}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {campaign.channels.map((channel) => (
            <div
              key={channel}
              className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]"
              title={channel}
            >
              {getChannelIcon(channel)}
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1">
          <span>Progresso</span>
          <span>{campaign.leads_processed} / {campaign.total_leads} leads</span>
        </div>
        <div className="w-full h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58a6ff] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[#30363d]">
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Enviadas</p>
          <p className="text-sm font-semibold text-white">{campaign.dms_sent}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Respostas</p>
          <p className="text-sm font-semibold text-[#3fb950]">{campaign.replies}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8b949e] mb-0.5">Conversões</p>
          <p className="text-sm font-semibold text-[#a371f7]">{campaign.conversions}</p>
        </div>
      </div>

      {/* Performance badges */}
      <div className="flex items-center gap-2 mb-3 text-[10px]">
        <span className="text-[#8b949e]">Reply rate: <span className="text-[#3fb950] font-medium">{replyRate}%</span></span>
        <span className="text-[#8b949e]">•</span>
        <span className="text-[#8b949e]">Conversão: <span className="text-[#a371f7] font-medium">{conversionRate}%</span></span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {campaign.status === 'ativa' ? (
          <button
            onClick={() => onPause(campaign.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#d29922]/10 hover:bg-[#d29922]/20 border border-[#d29922]/20 hover:border-[#d29922]/40 text-[#d29922] rounded text-xs font-medium transition-colors"
          >
            <Pause size={12} />
            Pausar
          </button>
        ) : (
          <button
            onClick={() => onResume(campaign.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3fb950]/10 hover:bg-[#3fb950]/20 border border-[#3fb950]/20 hover:border-[#3fb950]/40 text-[#3fb950] rounded text-xs font-medium transition-colors"
          >
            <Play size={12} />
            Retomar
          </button>
        )}
        <button
          onClick={() => onView(campaign.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors"
        >
          <Eye size={12} />
          Ver
        </button>
        <button
          onClick={() => onEdit(campaign.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors"
        >
          <Edit size={12} />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ProspectorDashboard = () => {
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading, pauseCampaign, resumeCampaign } = useProspectorCampaigns();
  const { metrics, loading: metricsLoading } = useProspectorAnalytics();

  const handlePause = async (id: string) => {
    await pauseCampaign(id);
  };

  const handleResume = async (id: string) => {
    await resumeCampaign(id);
  };

  const handleView = (id: string) => {
    navigate(`/prospector/campaign/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/prospector/campaign/${id}?edit=true`);
  };

  return (
    <div className="bg-[#0d1117] min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Target size={26} className="text-[#58a6ff]" />
              Prospecção Ativa
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Automação de outbound multi-canal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/prospector/queue')}
              className="px-4 py-2 bg-[#161b22] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded-lg text-sm font-medium transition-colors"
            >
              Ver Fila
            </button>
            <button
              onClick={() => navigate('/prospector/templates')}
              className="px-4 py-2 bg-[#161b22] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded-lg text-sm font-medium transition-colors"
            >
              Templates
            </button>
            <button
              onClick={() => navigate('/prospector/analytics')}
              className="px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        {metricsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                <div className="h-10 bg-[#0d1117] rounded mb-2" />
                <div className="h-6 bg-[#0d1117] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              icon={<Target size={20} />}
              label="Campanhas Ativas"
              value={metrics.total_campaigns_active}
            />
            <MetricCard
              icon={<Users size={20} />}
              label="Leads na Fila Hoje"
              value={metrics.leads_in_queue_today}
            />
            <MetricCard
              icon={<Send size={20} />}
              label="DMs Enviadas Hoje"
              value={metrics.dms_sent_today}
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Reply Rate (7d)"
              value={`${metrics.reply_rate_7d}%`}
              trend="+2.3% vs. semana passada"
              color="text-[#3fb950]"
            />
            <MetricCard
              icon={<CalendarCheck size={20} />}
              label="Taxa de Conversão"
              value={`${metrics.conversion_rate}%`}
              trend="+1.1% vs. semana passada"
              color="text-[#a371f7]"
            />
          </div>
        )}

        {/* Campaigns Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Campanhas</h2>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Target size={16} />
              Nova Campanha
            </button>
          </div>

          {campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-[#0d1117] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[#0d1117] rounded w-1/2 mb-4" />
                  <div className="h-2 bg-[#0d1117] rounded mb-4" />
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="h-8 bg-[#0d1117] rounded" />
                    <div className="h-8 bg-[#0d1117] rounded" />
                    <div className="h-8 bg-[#0d1117] rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-[#0d1117] rounded" />
                    <div className="h-8 w-16 bg-[#0d1117] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-[#58a6ff]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma campanha ainda</h3>
              <p className="text-sm text-[#8b949e] mb-4">
                Crie sua primeira campanha de prospecção para começar
              </p>
              <button className="px-6 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors">
                Criar Campanha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onPause={handlePause}
                  onResume={handleResume}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/prospector/queue')}
              className="flex items-center gap-3 p-4 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 rounded-lg text-left transition-colors group"
            >
              <Users size={20} className="text-[#58a6ff]" />
              <div>
                <p className="text-sm font-medium text-white group-hover:text-[#58a6ff] transition-colors">Ver Fila de Leads</p>
                <p className="text-xs text-[#8b949e]">{metrics.leads_in_queue_today} leads aguardando</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/prospector/templates')}
              className="flex items-center gap-3 p-4 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 rounded-lg text-left transition-colors group"
            >
              <Send size={20} className="text-[#a371f7]" />
              <div>
                <p className="text-sm font-medium text-white group-hover:text-[#58a6ff] transition-colors">Editar Templates</p>
                <p className="text-xs text-[#8b949e]">Otimize suas mensagens</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/prospector/analytics')}
              className="flex items-center gap-3 p-4 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 rounded-lg text-left transition-colors group"
            >
              <TrendingUp size={20} className="text-[#3fb950]" />
              <div>
                <p className="text-sm font-medium text-white group-hover:text-[#58a6ff] transition-colors">Ver Analytics</p>
                <p className="text-xs text-[#8b949e]">Performance detalhada</p>
              </div>
            </button>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-[#8b949e] pb-4">
          <Loader2 size={10} className="animate-spin opacity-50" />
          Dados atualizados em tempo real
        </div>
      </div>
    </div>
  );
};

export default ProspectorDashboard;
