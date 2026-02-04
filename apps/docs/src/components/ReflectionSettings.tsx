import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Target,
  RefreshCw,
  AlertTriangle,
  Save,
  RotateCcw,
  Info,
  Sliders,
  Bell,
  Shield,
  Zap
} from 'lucide-react';

interface ReflectionConfig {
  // Timing
  reflection_interval_hours: number;
  min_conversations_before_reflection: number;

  // Thresholds
  update_threshold: number; // Score minimo para considerar UPDATE vs MAINTAIN
  weakness_repeat_threshold: number; // Quantas vezes uma fraqueza precisa aparecer
  significant_drop_threshold: number; // Queda de score que dispara alerta

  // Behavior
  auto_apply_minor_fixes: boolean;
  require_approval_for_major_changes: boolean;
  pause_on_low_score: boolean;
  low_score_threshold: number;

  // Notifications
  notify_on_update: boolean;
  notify_on_weakness_pattern: boolean;
  notify_on_score_drop: boolean;
  notification_channels: string[];

  // Limits
  max_changes_per_cycle: number;
  cooldown_after_change_hours: number;
}

interface ReflectionSettingsProps {
  agentId: string;
  agentName: string;
  currentConfig: ReflectionConfig;
  onSave: (config: ReflectionConfig) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_CONFIG: ReflectionConfig = {
  reflection_interval_hours: 24,
  min_conversations_before_reflection: 50,
  update_threshold: 7.0,
  weakness_repeat_threshold: 3,
  significant_drop_threshold: 1.5,
  auto_apply_minor_fixes: false,
  require_approval_for_major_changes: true,
  pause_on_low_score: true,
  low_score_threshold: 5.0,
  notify_on_update: true,
  notify_on_weakness_pattern: true,
  notify_on_score_drop: true,
  notification_channels: ['email', 'slack'],
  max_changes_per_cycle: 3,
  cooldown_after_change_hours: 4,
};

export const ReflectionSettings: React.FC<ReflectionSettingsProps> = ({
  agentId,
  agentName,
  currentConfig,
  onSave,
  isLoading = false,
}) => {
  const [config, setConfig] = useState<ReflectionConfig>(currentConfig || DEFAULT_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'timing' | 'thresholds' | 'behavior' | 'notifications' | 'limits'>('timing');

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const handleChange = (key: keyof ReflectionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setIsDirty(true);
  };

  const sections = [
    { id: 'timing', label: 'Timing', icon: Clock },
    { id: 'thresholds', label: 'Thresholds', icon: Target },
    { id: 'behavior', label: 'Comportamento', icon: Sliders },
    { id: 'notifications', label: 'Notificacoes', icon: Bell },
    { id: 'limits', label: 'Limites', icon: Shield },
  ];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Settings className="text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Configuracoes do Reflection Loop</h3>
            <p className="text-xs text-text-muted">Agente: {agentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Resetar
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isDirty && !isSaving
                ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
                : 'bg-bg-tertiary text-text-muted cursor-not-allowed'
            }`}
          >
            <Save size={14} className={isSaving ? 'animate-spin' : ''} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-border-default bg-bg-tertiary/50">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-bg-secondary text-text-primary border-r-2 border-accent-primary'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Timing Section */}
          {activeSection === 'timing' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Configure a frequencia com que o sistema analisa as conversas e gera sugestoes de melhoria.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Intervalo de Reflexao (horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={config.reflection_interval_hours}
                    onChange={(e) => handleChange('reflection_interval_hours', parseInt(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    A cada quantas horas o sistema deve rodar o ciclo de reflexao. Padrao: 24h
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Minimo de Conversas antes da Reflexao
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={config.min_conversations_before_reflection}
                    onChange={(e) => handleChange('min_conversations_before_reflection', parseInt(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Quantidade minima de conversas necessarias para gerar insights significativos.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Thresholds Section */}
          {activeSection === 'thresholds' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Defina os limites que determinam quando uma melhoria deve ser aplicada ou quando alertas devem ser disparados.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Threshold de UPDATE (Score)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={5}
                      max={9}
                      step={0.5}
                      value={config.update_threshold}
                      onChange={(e) => handleChange('update_threshold', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-bold text-accent-primary w-12 text-center">
                      {config.update_threshold.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Score minimo para que a IA decida UPDATE ao inves de MAINTAIN. Abaixo disso, mantem o prompt atual.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Repeticao de Fraqueza (vezes)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={config.weakness_repeat_threshold}
                    onChange={(e) => handleChange('weakness_repeat_threshold', parseInt(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Quantas vezes uma mesma fraqueza precisa aparecer em avaliacoes diferentes para disparar uma sugestao de correcao.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Queda Significativa de Score
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={config.significant_drop_threshold}
                    onChange={(e) => handleChange('significant_drop_threshold', parseFloat(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Queda de pontos no score que dispara um alerta automatico.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Behavior Section */}
          {activeSection === 'behavior' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <Zap size={18} className="text-purple-400 shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Configure como o sistema deve se comportar ao identificar oportunidades de melhoria.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Auto-aplicar correcoes menores</h4>
                    <p className="text-xs text-text-muted mt-1">
                      Aplicar automaticamente fixes de baixo impacto sem aprovacao manual.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.auto_apply_minor_fixes}
                      onChange={(e) => handleChange('auto_apply_minor_fixes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary peer-focus:ring-2 peer-focus:ring-accent-primary/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Exigir aprovacao para mudancas maiores</h4>
                    <p className="text-xs text-text-muted mt-1">
                      Mudancas estruturais sempre precisam de aprovacao humana.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.require_approval_for_major_changes}
                      onChange={(e) => handleChange('require_approval_for_major_changes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary peer-focus:ring-2 peer-focus:ring-accent-primary/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Pausar em score baixo</h4>
                    <p className="text-xs text-text-muted mt-1">
                      Pausar auto-aplicacoes quando o score cair abaixo do threshold.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.pause_on_low_score}
                      onChange={(e) => handleChange('pause_on_low_score', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary peer-focus:ring-2 peer-focus:ring-accent-primary/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {config.pause_on_low_score && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Threshold de Score Baixo
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={7}
                      step={0.5}
                      value={config.low_score_threshold}
                      onChange={(e) => handleChange('low_score_threshold', parseFloat(e.target.value))}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Notificar em Updates</h4>
                    <p className="text-xs text-text-muted mt-1">Enviar notificacao quando uma melhoria for aplicada.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notify_on_update}
                      onChange={(e) => handleChange('notify_on_update', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Notificar em Padrao de Fraqueza</h4>
                    <p className="text-xs text-text-muted mt-1">Alertar quando uma fraqueza aparecer repetidamente.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notify_on_weakness_pattern}
                      onChange={(e) => handleChange('notify_on_weakness_pattern', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Notificar em Queda de Score</h4>
                    <p className="text-xs text-text-muted mt-1">Alertar quando o score cair significativamente.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notify_on_score_drop}
                      onChange={(e) => handleChange('notify_on_score_drop', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:bg-accent-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Canais de Notificacao</label>
                  <div className="flex gap-2">
                    {['email', 'slack', 'webhook', 'sms'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => {
                          const channels = config.notification_channels.includes(channel)
                            ? config.notification_channels.filter(c => c !== channel)
                            : [...config.notification_channels, channel];
                          handleChange('notification_channels', channels);
                        }}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          config.notification_channels.includes(channel)
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                      >
                        {channel.charAt(0).toUpperCase() + channel.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Limits Section */}
          {activeSection === 'limits' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <Shield size={18} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary">
                  Defina limites de seguranca para evitar mudancas excessivas no prompt.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Maximo de Mudancas por Ciclo
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={config.max_changes_per_cycle}
                    onChange={(e) => handleChange('max_changes_per_cycle', parseInt(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Quantas mudancas podem ser aplicadas em um unico ciclo de reflexao.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cooldown apos Mudanca (horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={config.cooldown_after_change_hours}
                    onChange={(e) => handleChange('cooldown_after_change_hours', parseInt(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Tempo de espera apos aplicar uma mudanca antes de permitir outra.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
