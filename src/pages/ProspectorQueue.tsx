import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  X,
  ChevronDown,
  SkipForward,
  Pause,
  FastForward,
  Instagram,
  Linkedin,
  MessageCircle,
  Clock,
  Thermometer,
  Award,
} from 'lucide-react';
import { useProspectorQueue, useProspectorCampaigns, ProspectorQueueLead } from '../hooks/useProspector';

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

const getStageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    warm_up: 'Warm-up',
    first_contact: 'Primeiro Contato',
    follow_up: 'Follow-up',
    breakup: 'Breakup',
  };
  return labels[stage] || stage;
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'warm_up':
      return 'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20';
    case 'first_contact':
      return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
    case 'follow_up':
      return 'text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/20';
    case 'breakup':
      return 'text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

const getTemperatureColor = (temp: string) => {
  switch (temp) {
    case 'cold':
      return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
    case 'warm':
      return 'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20';
    case 'hot':
      return 'text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'A':
      return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
    case 'B':
      return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
    case 'C':
      return 'text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/20';
    default:
      return 'text-text-muted bg-bg-hover border-border-default';
  }
};

const formatTimeUntil = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Agora';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// ═══════════════════════════════════════════════════════════════════════
// LEAD ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface LeadRowProps {
  lead: ProspectorQueueLead;
  onSkip: (id: string) => void;
  onPause: (id: string) => void;
  onAdvance: (id: string) => void;
}

const LeadRow = ({ lead, onSkip, onPause, onAdvance }: LeadRowProps) => {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/30 transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {lead.avatar_url ? (
            <img
              src={lead.avatar_url}
              alt={lead.name}
              className="w-12 h-12 rounded-full border-2 border-[#30363d] group-hover:border-[#58a6ff]/40 transition-colors"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#58a6ff]/20 border-2 border-[#30363d] flex items-center justify-center text-[#58a6ff] font-semibold">
              {lead.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{lead.name}</h3>
              <p className="text-xs text-[#8b949e]">{lead.username}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="p-1.5 rounded bg-[#0d1117] border border-[#30363d]" title={lead.channel}>
                {getChannelIcon(lead.channel)}
              </div>
            </div>
          </div>

          {/* Bio highlight */}
          {lead.bio_highlight && (
            <p className="text-xs text-[#8b949e] mb-2 line-clamp-1">{lead.bio_highlight}</p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStageColor(lead.stage)}`}>
              {getStageLabel(lead.stage)}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTemperatureColor(lead.temperature)}`}>
              <Thermometer size={10} />
              {lead.temperature}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTierColor(lead.icp_tier)}`}>
              <Award size={10} />
              Tier {lead.icp_tier}
            </span>
            {lead.city && (
              <span className="text-[10px] text-[#8b949e]">📍 {lead.city}</span>
            )}
            {lead.followers && (
              <span className="text-[10px] text-[#8b949e]">👥 {lead.followers.toLocaleString()}</span>
            )}
          </div>

          {/* Next action */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <Clock size={12} className="text-[#d29922]" />
            <span className="text-[#8b949e]">Próxima ação:</span>
            <span className="text-white font-medium">{lead.next_action}</span>
            <span className="text-[#58a6ff]">em {formatTimeUntil(lead.next_action_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSkip(lead.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#d29922]/10 border border-[#30363d] hover:border-[#d29922]/40 text-[#8b949e] hover:text-[#d29922] rounded text-xs font-medium transition-colors"
            >
              <SkipForward size={12} />
              Pular
            </button>
            <button
              onClick={() => onPause(lead.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#f85149]/10 border border-[#30363d] hover:border-[#f85149]/40 text-[#8b949e] hover:text-[#f85149] rounded text-xs font-medium transition-colors"
            >
              <Pause size={12} />
              Pausar
            </button>
            <button
              onClick={() => onAdvance(lead.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3fb950]/10 hover:bg-[#3fb950]/20 border border-[#3fb950]/20 hover:border-[#3fb950]/40 text-[#3fb950] rounded text-xs font-medium transition-colors"
            >
              <FastForward size={12} />
              Avançar Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ProspectorQueue = () => {
  const navigate = useNavigate();
  const { campaigns } = useProspectorCampaigns();
  const { leads, loading, skipLead, pauseLead, advanceStage } = useProspectorQueue();

  const [searchTerm, setSearchTerm] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtros aplicados
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (searchTerm && !lead.name.toLowerCase().includes(searchTerm.toLowerCase()) && !lead.username.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (campaignFilter && lead.campaign_id !== campaignFilter) return false;
      if (channelFilter && lead.channel !== channelFilter) return false;
      if (stageFilter && lead.stage !== stageFilter) return false;
      if (temperatureFilter && lead.temperature !== temperatureFilter) return false;
      return true;
    });
  }, [leads, searchTerm, campaignFilter, channelFilter, stageFilter, temperatureFilter]);

  const activeFilterCount = [campaignFilter, channelFilter, stageFilter, temperatureFilter, searchTerm].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setCampaignFilter('');
    setChannelFilter('');
    setStageFilter('');
    setTemperatureFilter('');
  };

  return (
    <div className="bg-[#0d1117] min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/prospector')}
              className="text-xs text-[#58a6ff] hover:underline mb-2"
            >
              ← Voltar ao Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Users size={26} className="text-[#58a6ff]" />
              Fila de Prospecção
            </h1>
            <p className="text-sm text-[#8b949e] mt-1">
              {filteredLeads.length} leads aguardando ação
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-between w-full mb-3 text-sm font-medium text-white"
          >
            <span className="flex items-center gap-2">
              <Filter size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-[#58a6ff] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          <div className={`grid grid-cols-1 md:grid-cols-6 gap-3 ${!showFilters ? 'hidden md:grid' : ''}`}>
            {/* Search */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8b949e]">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar nome ou username..."
                className="w-full pl-10 pr-10 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white placeholder:text-[#8b949e]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 flex items-center text-[#8b949e] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Campaign */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="">Todas campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Channel */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="">Todos canais</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            {/* Stage */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="">Todos stages</option>
              <option value="warm_up">Warm-up</option>
              <option value="first_contact">Primeiro Contato</option>
              <option value="follow_up">Follow-up</option>
              <option value="breakup">Breakup</option>
            </select>

            {/* Temperature */}
            <select
              className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]/20 transition-all text-white"
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value)}
            >
              <option value="">Todas temperaturas</option>
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="hot">Hot</option>
            </select>
          </div>

          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs border-t border-[#30363d] pt-3">
              <p className="text-[#8b949e]">
                <span className="text-white font-semibold">{filteredLeads.length}</span> leads encontrados
              </p>
              <button
                onClick={clearFilters}
                className="text-[#58a6ff] hover:underline font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0d1117]" />
                  <div className="flex-1">
                    <div className="h-4 bg-[#0d1117] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-[#0d1117] rounded w-1/2 mb-3" />
                    <div className="flex gap-2 mb-3">
                      <div className="h-6 bg-[#0d1117] rounded w-20" />
                      <div className="h-6 bg-[#0d1117] rounded w-16" />
                    </div>
                    <div className="h-8 bg-[#0d1117] rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-[#58a6ff]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum lead na fila</h3>
            <p className="text-sm text-[#8b949e]">
              {activeFilterCount > 0 
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Adicione leads às suas campanhas para começar'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onSkip={skipLead}
                onPause={pauseLead}
                onAdvance={advanceStage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectorQueue;
