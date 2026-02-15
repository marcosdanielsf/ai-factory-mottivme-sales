import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Play, Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight,
  Bot, MessageSquare, Beaker, AlertCircle, RotateCcw
} from 'lucide-react';
import { useTestRunner, AVAILABLE_SCENARIOS } from '../hooks/useTestRunner';
import { useToast } from '../hooks/useToast';
import { useAccount } from '../contexts/AccountContext';

interface TestRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunner = ({ isOpen, onClose }: TestRunnerProps) => {
  const {
    status, result, error, agentVersions, loadingAgents,
    runTest, fetchAgentVersions, reset
  } = useTestRunner();
  const { showToast } = useToast();
  const { selectedAccount } = useAccount();

  // Form state
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set(['inbound']));
  const [customContext, setCustomContext] = useState('');
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  // Load agent versions on mount
  useEffect(() => {
    if (isOpen) {
      fetchAgentVersions();
    }
  }, [isOpen, fetchAgentVersions]);

  // Filter agents by selected account if applicable
  const filteredAgents = useMemo(() => {
    if (selectedAccount?.location_id) {
      return agentVersions.filter(a => a.location_id === selectedAccount.location_id);
    }
    return agentVersions;
  }, [agentVersions, selectedAccount]);

  // Auto-select first agent
  useEffect(() => {
    if (filteredAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(filteredAgents[0].id);
    }
  }, [filteredAgents, selectedAgentId]);

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRun = async () => {
    if (!selectedAgentId) {
      showToast('Selecione um agente para testar', 'error');
      return;
    }
    if (selectedScenarios.size === 0) {
      showToast('Selecione pelo menos um cenário', 'error');
      return;
    }

    const runId = await runTest(
      selectedAgentId,
      Array.from(selectedScenarios),
      customContext.trim() || undefined
    );

    if (runId) {
      showToast('Teste E2E iniciado! Acompanhe o progresso abaixo.', 'info');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedAgentId('');
    setSelectedScenarios(new Set(['inbound']));
    setCustomContext('');
    setExpandedScenario(null);
    onClose();
  };

  const handleNewTest = () => {
    reset();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-accent-success';
    if (score >= 6) return 'text-accent-warning';
    return 'text-accent-error';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-accent-success/10 border-accent-success/30';
    if (score >= 6) return 'bg-accent-warning/10 border-accent-warning/30';
    return 'bg-accent-error/10 border-accent-error/30';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-tertiary rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Beaker size={18} className="text-accent-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary text-lg">Teste E2E</h2>
              <p className="text-xs text-text-muted">Simule conversas completas com o agente</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* === CONFIGURATION PHASE === */}
          {(status === 'idle' || status === 'error') && (
            <>
              {/* Agent Selector */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Agente
                </label>
                {loadingAgents ? (
                  <div className="flex items-center gap-2 p-3 bg-bg-tertiary border border-border-default rounded-lg text-text-muted text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Carregando agentes...
                  </div>
                ) : (
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Selecionar agente...</option>
                    {filteredAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.agent_name} ({agent.version})
                        {agent.status === 'active' ? ' ✓' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Scenario Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Cenários
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_SCENARIOS.map((scenario) => {
                    const isSelected = selectedScenarios.has(scenario.id);
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => toggleScenario(scenario.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-accent-primary/10 border-accent-primary/40 text-text-primary'
                            : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-border-hover'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-accent-primary border-accent-primary'
                            : 'border-border-hover bg-transparent'
                        }`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{scenario.label}</div>
                          <div className="text-xs text-text-muted mt-0.5">{scenario.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Context */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Contexto Custom <span className="text-text-muted font-normal">(opcional)</span>
                </label>
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Ex: Simule um lead que pergunta preço mas não tem permissão de trabalho..."
                  rows={3}
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              {/* Error display */}
              {status === 'error' && error && (
                <div className="flex items-start gap-3 p-4 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <AlertCircle size={18} className="text-accent-error mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-accent-error">Erro ao executar teste</p>
                    <p className="text-xs text-text-muted mt-1">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* === RUNNING PHASE === */}
          {status === 'running' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-bg-tertiary"></div>
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot size={24} className="text-accent-primary" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-text-primary">Executando Teste E2E...</p>
                <p className="text-sm text-text-muted">
                  Simulando conversas com {selectedScenarios.size} cenário{selectedScenarios.size !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Progress indicator */}
              {result?.progress !== undefined && (
                <div className="w-64">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(result.progress)}%</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-primary rounded-full transition-all duration-500"
                      style={{ width: `${result.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Skeleton cards */}
              <div className="w-full space-y-3 mt-4">
                {Array.from(selectedScenarios).map((s, i) => (
                  <div key={s} className="bg-bg-tertiary border border-border-default rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-bg-hover rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-bg-hover rounded w-32 mb-2"></div>
                        <div className="h-3 bg-bg-hover rounded w-48"></div>
                      </div>
                      <div className="h-6 w-16 bg-bg-hover rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === RESULTS PHASE === */}
          {status === 'completed' && result && (
            <div className="space-y-6">
              {/* Score Hero Card */}
              <div className={`p-6 rounded-lg border ${getScoreBgColor(result.score_overall || 0)} text-center`}>
                <div className={`text-5xl font-bold ${getScoreColor(result.score_overall || 0)}`}>
                  {(result.score_overall || 0).toFixed(1)}
                </div>
                <div className="text-sm text-text-muted mt-1">/10</div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {(result.score_overall || 0) >= 7 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-success/10 text-accent-success text-sm font-medium">
                      <CheckCircle size={14} />
                      Aprovado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-error/10 text-accent-error text-sm font-medium">
                      <XCircle size={14} />
                      Reprovado
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 text-center">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Cenários</div>
                  <div className="text-xl font-bold text-text-primary">{result.total_tests || 0}</div>
                </div>
                <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 text-center">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Passou</div>
                  <div className="text-xl font-bold text-accent-success">{result.passed_tests || 0}</div>
                </div>
                <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 text-center">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Falhou</div>
                  <div className="text-xl font-bold text-accent-error">{result.failed_tests || 0}</div>
                </div>
              </div>

              {/* Scenario Results */}
              {result.scenarios && result.scenarios.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                    Detalhes dos Cenários
                  </h3>
                  {result.scenarios.map((scenario, idx) => {
                    const isExpanded = expandedScenario === `${idx}`;
                    const passed = scenario.status === 'passed';
                    return (
                      <div
                        key={idx}
                        className={`bg-bg-tertiary border border-border-default rounded-lg overflow-hidden border-l-4 ${
                          passed ? 'border-l-accent-success' : 'border-l-accent-error'
                        }`}
                      >
                        {/* Scenario Header */}
                        <button
                          onClick={() => setExpandedScenario(isExpanded ? null : `${idx}`)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-bg-hover transition-colors text-left"
                        >
                          {passed ? (
                            <CheckCircle size={18} className="text-accent-success flex-shrink-0" />
                          ) : (
                            <XCircle size={18} className="text-accent-error flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {scenario.scenario_name}
                            </p>
                            {scenario.lead_persona && (
                              <p className="text-xs text-text-muted">
                                Persona: {scenario.lead_persona}
                                {scenario.total_turns ? ` · ${scenario.total_turns} turnos` : ''}
                                {scenario.duration_seconds ? ` · ${scenario.duration_seconds}s` : ''}
                              </p>
                            )}
                          </div>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${getScoreBgColor(scenario.score)} ${getScoreColor(scenario.score)}`}>
                            {scenario.score.toFixed(1)}
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-text-muted" />
                          ) : (
                            <ChevronRight size={16} className="text-text-muted" />
                          )}
                        </button>

                        {/* Expanded Conversation */}
                        {isExpanded && scenario.conversation && scenario.conversation.length > 0 && (
                          <div className="px-4 pb-4 space-y-3 border-t border-border-default pt-4">
                            {scenario.conversation.map((msg, msgIdx) => {
                              const isLead = msg.role === 'user' || msg.role === 'lead';
                              return (
                                <div key={msgIdx} className="flex gap-3">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isLead ? 'bg-blue-500/10' : 'bg-accent-primary/10'
                                  }`}>
                                    {isLead ? (
                                      <MessageSquare size={12} className="text-blue-500" />
                                    ) : (
                                      <Bot size={12} className="text-accent-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-[10px] text-text-muted mb-1 uppercase">
                                      {isLead ? 'Lead' : 'Agente'}
                                    </div>
                                    <div className={`p-3 rounded-lg text-sm text-text-primary ${
                                      isLead
                                        ? 'bg-bg-primary border border-border-default'
                                        : 'bg-accent-primary/5 border border-accent-primary/20'
                                    }`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* No conversation fallback */}
                        {isExpanded && (!scenario.conversation || scenario.conversation.length === 0) && (
                          <div className="px-4 pb-4 border-t border-border-default pt-4">
                            <p className="text-sm text-text-muted italic text-center">
                              Conversa não disponível para este cenário.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default bg-bg-tertiary rounded-b-lg flex items-center justify-between">
          <div className="text-xs text-text-muted">
            {status === 'running' && 'Polling a cada 3s...'}
            {status === 'completed' && result?.completed_at && (
              <>Finalizado em {new Date(result.completed_at).toLocaleString('pt-BR')}</>
            )}
          </div>
          <div className="flex items-center gap-3">
            {status === 'completed' && (
              <button
                onClick={handleNewTest}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-default rounded-lg text-sm transition-colors text-text-primary"
              >
                <RotateCcw size={14} />
                Novo Teste
              </button>
            )}
            {(status === 'idle' || status === 'error') && (
              <button
                onClick={handleRun}
                disabled={!selectedAgentId || selectedScenarios.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                Rodar Teste
              </button>
            )}
            {status !== 'running' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-default rounded-lg text-sm transition-colors text-text-secondary"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
