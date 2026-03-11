import React, { useState } from 'react';
import { Plus, MoreHorizontal, Loader2, X, Play, Square, Hash, User, Users, Target, Zap, AlertCircle, CheckCircle2, Clock, Instagram, UserPlus } from 'lucide-react';
import { Button, Card, Badge, ChannelBadge } from '../UI';
import { useData } from '../../App';
import { useCampaigns, type CampaignConfig, type Campaign as APICampaign } from '../../hooks';
import { useTenantDropdown } from '../../hooks';
import { useMonitoredAccounts } from '../../hooks/useNewFollowers';

// ============================================
// NEW CAMPAIGN MODAL
// ============================================

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: CampaignConfig) => Promise<void>;
  loading: boolean;
}

const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const { options: tenantOptions } = useTenantDropdown();
  const { accounts: monitoredAccounts } = useMonitoredAccounts();

  const [formData, setFormData] = useState<CampaignConfig>({
    name: '',
    target_type: 'leads',
    target_value: 'all',
    limit: 50,
    min_score: 0,
    tenant_id: 'DEFAULT',
    account_id: undefined,
  });

  const [step, setStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      name: '',
      target_type: 'leads',
      target_value: 'all',
      limit: 50,
      min_score: 0,
      tenant_id: 'DEFAULT',
      account_id: undefined,
    });
    setStep(1);
  };

  const targetTypeOptions = [
    {
      value: 'leads',
      label: 'Leads Existentes',
      description: 'Usar leads já scraped no banco de dados',
      icon: <Users size={20} />,
    },
    {
      value: 'hashtag',
      label: 'Hashtag',
      description: 'Scrape posts de uma hashtag e extrair perfis',
      icon: <Hash size={20} />,
    },
    {
      value: 'profile',
      label: 'Followers de Perfil',
      description: 'Scrape followers de um perfil específico',
      icon: <User size={20} />,
    },
    {
      value: 'new_followers',
      label: 'Novos Seguidores',
      description: 'Usar novos seguidores detectados nas contas monitoradas',
      icon: <UserPlus size={20} />,
    },
  ];

  const priorityOptions = [
    { value: 0, label: 'Todos os leads', description: 'Sem filtro de qualidade' },
    { value: 40, label: 'COLD+', description: 'Pular NURTURING (score < 40)' },
    { value: 50, label: 'WARM+', description: 'Apenas WARM e HOT (score >= 50)' },
    { value: 70, label: 'HOT apenas', description: 'Somente leads HOT (score >= 70)' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Instagram size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nova Campanha de Prospecção</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {step === 1 ? 'Configure o alvo da campanha' : 'Defina os parâmetros de envio'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${step >= 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500'}`}>
              <Target size={14} />
              Alvo
            </div>
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${step >= 2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500'}`}>
              <Zap size={14} />
              Configuração
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Prospecção Clínicas SP"
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Target Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Alvo *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {targetTypeOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          target_type: option.value as CampaignConfig['target_type'],
                          target_value: option.value === 'leads' || option.value === 'new_followers' ? 'all' : '',
                          account_id: option.value === 'new_followers' ? undefined : prev.account_id,
                        }))}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          formData.target_type === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className={`mb-2 ${formData.target_type === option.value ? 'text-blue-600' : 'text-slate-400'}`}>
                          {option.icon}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{option.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Value - for hashtag and profile */}
                {(formData.target_type === 'hashtag' || formData.target_type === 'profile') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {formData.target_type === 'hashtag' ? 'Hashtag (sem #)' : 'Username do perfil'} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {formData.target_type === 'hashtag' ? '#' : '@'}
                      </span>
                      <input
                        type="text"
                        value={formData.target_value}
                        onChange={e => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                        placeholder={formData.target_type === 'hashtag' ? 'clinicaestetica' : 'clinica_exemplo'}
                        className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Account Selection - for new_followers */}
                {formData.target_type === 'new_followers' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Conta Monitorada
                    </label>
                    <select
                      value={formData.account_id || 'all'}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        account_id: e.target.value === 'all' ? undefined : parseInt(e.target.value),
                        target_value: e.target.value === 'all' ? 'all' : e.target.value,
                      }))}
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Todas as contas</option>
                      {monitoredAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          @{acc.username} ({acc.pending_count} pendentes)
                        </option>
                      ))}
                    </select>
                    {monitoredAccounts.length === 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Nenhuma conta monitorada. Adicione contas em "Novos Seguidores".
                      </p>
                    )}
                  </div>
                )}

                {/* Tenant Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tenant (ICP Config)
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={e => setFormData(prev => ({ ...prev, tenant_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DEFAULT">DEFAULT</option>
                    {tenantOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.name || (formData.target_type !== 'leads' && formData.target_type !== 'new_followers' && !formData.target_value)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Campanha</div>
                  <div className="font-medium text-slate-900 dark:text-white">{formData.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {formData.target_type === 'leads' && '📋 Usando leads existentes no banco'}
                    {formData.target_type === 'hashtag' && `#️⃣ Hashtag: #${formData.target_value}`}
                    {formData.target_type === 'profile' && `👤 Followers de @${formData.target_value}`}
                    {formData.target_type === 'new_followers' && `🆕 Novos seguidores ${formData.account_id ? `da conta #${formData.account_id}` : 'de todas as contas'}`}
                  </div>
                </div>

                {/* Limit */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Limite de Leads
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={10}
                    value={formData.limit}
                    onChange={e => setFormData(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span>10</span>
                    <span className="font-medium text-blue-600">{formData.limit} leads</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Min Score (Priority Filter) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Filtro de Qualidade
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {priorityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, min_score: option.value }))}
                        className={`p-3 border rounded-lg text-left transition-all ${
                          formData.min_score === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{option.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-800 dark:text-amber-200">Atenção</div>
                    <div className="text-amber-700 dark:text-amber-300 mt-1">
                      A campanha enviará DMs reais para os leads. Certifique-se de que a sessão do Instagram está configurada corretamente.
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Play size={16} className="mr-2" />
                        Iniciar Campanha
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Card>
    </div>
  );
};

// ============================================
// CAMPAIGN STATUS BADGE
// ============================================

const CampaignStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'yellow', icon: <Clock size={12} />, label: 'Pending' },
    running: { color: 'blue', icon: <Loader2 size={12} className="animate-spin" />, label: 'Running' },
    completed: { color: 'green', icon: <CheckCircle2 size={12} />, label: 'Completed' },
    failed: { color: 'red', icon: <AlertCircle size={12} />, label: 'Failed' },
    stopped: { color: 'gray', icon: <Square size={12} />, label: 'Stopped' },
  };

  const cfg = config[status] || config.pending;

  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
      cfg.color === 'yellow' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
      cfg.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
      cfg.color === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
      cfg.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CampaignsView = () => {
  const { campaigns: mockCampaigns, loading: mockLoading } = useData();
  const {
    campaigns: apiCampaigns,
    loading: apiLoading,
    error: apiError,
    startCampaign,
    stopCampaign
  } = useCampaigns();

  const [activeTab, setActiveTab] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [startingCampaign, setStartingCampaign] = useState(false);

  // Combine mock campaigns with API campaigns
  const allCampaigns = [...mockCampaigns, ...apiCampaigns.map(c => ({
    id: c.id,
    name: c.name,
    type: 'Instagram DM' as const,
    status: c.status === 'completed' ? 'Completed' as const :
            c.status === 'running' ? 'Active' as const :
            c.status === 'failed' ? 'Paused' as const :
            'Draft' as const,
    channels: ['instagram'] as const,
    leads: c.stats.leads_scraped || c.limit,
    responses: c.stats.dms_sent,
    conversionRate: c.stats.dms_sent > 0
      ? Math.round((c.stats.dms_sent / (c.stats.dms_sent + c.stats.dms_failed + c.stats.dms_skipped)) * 100)
      : 0,
    cadenceName: `min_score: ${c.min_score}`,
    owner: c.tenant_id,
    // Keep original API data for detail view
    _apiData: c,
  }))];

  const tabs = ['All', 'Connection', 'Warm-up', 'Authority', 'Instagram DM', 'Multi-channel'];

  // Filter campaigns based on active tab
  const filteredCampaigns = activeTab === 'All'
    ? allCampaigns
    : allCampaigns.filter((c: any) => c.type === activeTab);

  const loading = mockLoading || apiLoading;

  const handleStartCampaign = async (config: CampaignConfig) => {
    setStartingCampaign(true);
    try {
      const result = await startCampaign(config);
      if (result?.success) {
        setShowNewCampaignModal(false);
      }
    } finally {
      setStartingCampaign(false);
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    await stopCampaign(campaignId);
  };

  if (loading && allCampaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500 dark:text-slate-400">Loading campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Campaigns</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and manage your outreach campaigns</p>
        </div>
        <Button onClick={() => setShowNewCampaignModal(true)}>
          <Plus size={16} className="mr-1" /> New Campaign
        </Button>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={16} />
          {apiError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign: any) => (
            <Card key={campaign.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={campaign.type === 'Multi-channel' ? 'purple' : campaign.type === 'Instagram DM' ? 'pink' : 'blue'}>
                      {campaign.type}
                    </Badge>
                    {campaign._apiData ? (
                      <CampaignStatusBadge status={campaign._apiData.status} />
                    ) : (
                      <span className={`flex items-center gap-1 text-xs ${campaign.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        {campaign.status}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal size={16} />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <span>👤 {campaign.owner}</span>
                <span>•</span>
                <span>Cadence: {campaign.cadenceName}</span>
              </div>

              <div className="flex gap-1 mb-4">
                {campaign.channels.map((c: string) => <ChannelBadge key={c} channel={c as any} size="sm" />)}
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.leads}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Leads</div>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.responses}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">DMs Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{campaign.conversionRate}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Success</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 text-sm" onClick={() => setSelectedCampaign(campaign)}>
                  View Details
                </Button>
                {campaign._apiData?.status === 'running' ? (
                  <Button
                    variant="secondary"
                    className="flex-1 text-sm text-red-600 hover:text-red-700"
                    onClick={() => handleStopCampaign(campaign.id)}
                  >
                    <Square size={14} className="mr-1" /> Stop
                  </Button>
                ) : (
                  <Button variant="secondary" className="flex-1 text-sm">Edit</Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            No campaigns found for "{activeTab}"
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onSubmit={handleStartCampaign}
        loading={startingCampaign}
      />

      {/* Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCampaign(null)}>
          <Card className="w-full max-w-2xl m-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCampaign.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge color="blue">{selectedCampaign.type}</Badge>
                  {selectedCampaign._apiData ? (
                    <CampaignStatusBadge status={selectedCampaign._apiData.status} />
                  ) : (
                    <Badge color={selectedCampaign.status === 'Active' ? 'green' : 'gray'}>{selectedCampaign.status}</Badge>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Owner</label>
                <p className="text-slate-900 dark:text-white">{selectedCampaign.owner}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Cadence</label>
                <p className="text-slate-900 dark:text-white">{selectedCampaign.cadenceName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Channels</label>
                <div className="flex gap-1 mt-1">
                  {selectedCampaign.channels.map((c: string) => <ChannelBadge key={c} channel={c as any} size="md" />)}
                </div>
              </div>

              {/* API Campaign Stats */}
              {selectedCampaign._apiData && (
                <div>
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Campaign Stats</label>
                  <div className="grid grid-cols-4 gap-3 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedCampaign._apiData.stats.leads_scraped}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Scraped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        {selectedCampaign._apiData.stats.dms_sent}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {selectedCampaign._apiData.stats.dms_failed}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">
                        {selectedCampaign._apiData.stats.dms_skipped}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Skipped</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{selectedCampaign.leads}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{selectedCampaign.responses}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">DMs Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">{selectedCampaign.conversionRate}%</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedCampaign(null)}>Close</Button>
              {selectedCampaign._apiData?.status === 'running' ? (
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    handleStopCampaign(selectedCampaign.id);
                    setSelectedCampaign(null);
                  }}
                >
                  <Square size={16} className="mr-2" /> Stop Campaign
                </Button>
              ) : (
                <Button className="flex-1">Edit Campaign</Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CampaignsView;
