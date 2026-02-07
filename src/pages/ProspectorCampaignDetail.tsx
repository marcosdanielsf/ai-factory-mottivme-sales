import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Target,
  Play,
  Pause,
  Edit,
  TrendingUp,
  Users,
  Send,
  CalendarCheck,
  Clock,
  Settings,
  Instagram,
  Linkedin,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useProspectorCampaigns, useProspectorQueue } from '../hooks/useProspector';

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'instagram':
      return <Instagram size={14} className="text-[#e1306c]" />;
    case 'linkedin':
      return <Linkedin size={14} className="text-[#0077b5]" />;
    case 'whatsapp':
      return <MessageCircle size={14} className="text-[#25d366]" />;
    default:
      return null;
  }
};

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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ═══════════════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════════════

const ActivityLog = () => {
  const mockLog = [
    {
      id: '1',
      type: 'success',
      message: 'DM enviada para Dr. João Silva',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'success',
      message: 'Resposta recebida de Maria Coach',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'warning',
      message: 'Lead "Clínica Vida Plena" pausado manualmente',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'error',
      message: 'Falha ao enviar DM para @infoprodutorxyz',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      type: 'success',
      message: 'Conversão: Lead avançado para reunião agendada',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-[#3fb950]" />;
      case 'warning':
        return <AlertCircle size={16} className="text-[#d29922]" />;
      case 'error':
        return <XCircle size={16} className="text-[#f85149]" />;
      default:
        return <Clock size={16} className="text-[#8b949e]" />;
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg">
      <div className="p-4 border-b border-[#30363d]">
        <h3 className="text-sm font-semibold text-white">Timeline de Atividades</h3>
      </div>
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {mockLog.map((log) => (
          <div key={log.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getIcon(log.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{log.message}</p>
              <p className="text-xs text-[#8b949e] mt-0.5">{formatDate(log.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// LEAD LIST
// ═══════════════════════════════════════════════════════════════════════

const LeadList = ({ campaignId }: { campaignId: string }) => {
  const { leads, loading } = useProspectorQueue(campaignId);

  if (loading) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-[#0d1117] rounded w-1/3 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#0d1117] rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg">
      <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Leads da Campanha</h3>
        <span className="text-xs text-[#8b949e]">{leads.length} leads</span>
      </div>
      <div className="divide-y divide-[#30363d]">
        {leads.slice(0, 10).map((lead) => (
          <div key={lead.id} className="p-4 hover:bg-[#0d1117] transition-colors">
            <div className="flex items-start gap-3">
              {lead.avatar_url ? (
                <img
                  src={lead.avatar_url}
                  alt={lead.name}
                  className="w-10 h-10 rounded-full border-2 border-[#30363d]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#58a6ff]/20 border-2 border-[#30363d] flex items-center justify-center text-[#58a6ff] font-semibold text-sm">
                  {lead.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                    <p className="text-xs text-[#8b949e]">{lead.username}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20">
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {leads.length > 10 && (
        <div className="p-3 bg-[#0d1117] border-t border-[#30363d] text-center">
          <button className="text-xs text-[#58a6ff] hover:underline">
            Ver todos os {leads.length} leads
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ProspectorCampaignDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { campaigns, pauseCampaign, resumeCampaign } = useProspectorCampaigns();

  const campaign = useMemo(() => {
    return campaigns.find((c) => c.id === id);
  }, [campaigns, id]);

  if (!campaign) {
    return (
      <div className="bg-[#0d1117] min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#f85149]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={32} className="text-[#f85149]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Campanha não encontrada</h2>
          <p className="text-sm text-[#8b949e] mb-6">
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/prospector')}
            className="px-6 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

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
    <div className="bg-[#0d1117] min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => navigate('/prospector')}
              className="text-xs text-[#58a6ff] hover:underline mb-2"
            >
              ← Voltar ao Dashboard
            </button>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center flex-shrink-0">
                <Target size={24} className="text-[#58a6ff]" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white">{campaign.name}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getVerticalColor(campaign.vertical)}`}>
                    {campaign.vertical}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <div className="flex items-center gap-1">
                    {campaign.channels.map((channel) => (
                      <div
                        key={channel}
                        className="p-1.5 rounded bg-[#161b22] border border-[#30363d]"
                        title={channel}
                      >
                        {getChannelIcon(channel)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {campaign.status === 'ativa' ? (
              <button
                onClick={() => pauseCampaign(campaign.id)}
                className="flex items-center gap-2 px-4 py-2 bg-[#d29922]/10 hover:bg-[#d29922]/20 border border-[#d29922]/20 hover:border-[#d29922]/40 text-[#d29922] rounded-lg text-sm font-medium transition-colors"
              >
                <Pause size={16} />
                Pausar
              </button>
            ) : (
              <button
                onClick={() => resumeCampaign(campaign.id)}
                className="flex items-center gap-2 px-4 py-2 bg-[#3fb950]/10 hover:bg-[#3fb950]/20 border border-[#3fb950]/20 hover:border-[#3fb950]/40 text-[#3fb950] rounded-lg text-sm font-medium transition-colors"
              >
                <Play size={16} />
                Retomar
              </button>
            )}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#161b22] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded-lg text-sm font-medium transition-colors"
            >
              <Edit size={16} />
              Editar
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#8b949e]">Progresso da Campanha</span>
            <span className="text-white font-semibold">
              {campaign.leads_processed} / {campaign.total_leads} leads processados
            </span>
          </div>
          <div className="w-full h-3 bg-[#0d1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#8b949e] mt-2">{progress.toFixed(1)}% concluído</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Send size={16} className="text-[#58a6ff]" />
              <p className="text-xs text-[#8b949e]">DMs Enviadas</p>
            </div>
            <p className="text-2xl font-semibold text-white">{campaign.dms_sent}</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-[#3fb950]" />
              <p className="text-xs text-[#8b949e]">Respostas</p>
            </div>
            <p className="text-2xl font-semibold text-white">{campaign.replies}</p>
            <p className="text-xs text-[#3fb950] mt-1">{replyRate}% reply rate</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck size={16} className="text-[#a371f7]" />
              <p className="text-xs text-[#8b949e]">Conversões</p>
            </div>
            <p className="text-2xl font-semibold text-white">{campaign.conversions}</p>
            <p className="text-xs text-[#a371f7] mt-1">{conversionRate}% conversão</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[#d29922]" />
              <p className="text-xs text-[#8b949e]">Limite Diário</p>
            </div>
            <p className="text-2xl font-semibold text-white">{campaign.daily_limit}</p>
            <p className="text-xs text-[#8b949e] mt-1">DMs por dia</p>
          </div>
        </div>

        {/* Two columns: Activity log + Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityLog />
          <LeadList campaignId={campaign.id} />
        </div>

        {/* Settings */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Settings size={16} className="text-[#58a6ff]" />
            Configurações da Campanha
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#8b949e] mb-1">Limite diário de DMs:</p>
              <p className="text-white font-medium">{campaign.daily_limit} mensagens/dia</p>
            </div>
            <div>
              <p className="text-[#8b949e] mb-1">Horário de envio:</p>
              <p className="text-white font-medium">09:00 - 18:00 (seg-sex)</p>
            </div>
            <div>
              <p className="text-[#8b949e] mb-1">Contas conectadas:</p>
              <p className="text-white font-medium">{campaign.channels.length} conta(s)</p>
            </div>
            <div>
              <p className="text-[#8b949e] mb-1">Data de criação:</p>
              <p className="text-white font-medium">{formatDate(campaign.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectorCampaignDetail;
