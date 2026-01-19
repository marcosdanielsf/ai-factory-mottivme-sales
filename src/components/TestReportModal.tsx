import React, { useState } from 'react';
import { FileText, X, CheckCircle, XCircle, AlertTriangle, Bot, MessageSquare, Code, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

// Interface para test_result individual
interface TestResult {
  name: string;
  input: string;
  score: number;
  passed: boolean;
  feedback: string;
  simulated_response: string;
}

// Interface para cenário E2E
interface E2EScenario {
  id: string;
  scenario_name: string;
  status: string;
  score: number;
  lead_persona?: string;
  total_turns?: number;
  duration_seconds?: number;
  conversation?: Array<{
    role: string;
    content: string;
  }>;
}

// Interface para dados do debate
interface DebateData {
  score: number;
  verdict: string;
  criticism?: string;
  defense?: string;
  improvement_summary?: string;
}

// Interface extendida para o run com dados completos
interface TestRunWithDetails {
  id: string;
  agent_version_id: string;
  passed_tests: number;
  failed_tests: number;
  total_tests: number;
  run_at?: string;
  created_at: string;
  summary?: string;
  agent_name?: string;
  agent_version?: string;
  client_name?: string;
  location_id?: string;
  score_overall?: number;
  execution_time_ms?: number;
  total_tokens?: number;
  lead_classification?: string;
  sales_score?: number;
  test_details?: TestResult[];
  validation_status?: string;
  // Campos para prompt e conversa (podem vir do agent_versions)
  system_prompt?: string;
  business_config?: {
    company_name?: string;
    industry?: string;
    target_audience?: string;
    tone_of_voice?: string;
    [key: string]: any;
  };
  // Dados de testes E2E (cenários completos com conversas)
  e2e_scenarios?: E2EScenario[];
  // Dados do debate (quando E2E não rodou)
  debate?: DebateData;
}

interface TestReportModalProps {
  run: TestRunWithDetails;
  onClose: () => void;
}

type TabType = 'results' | 'prompt' | 'conversation';

export const TestReportModal = ({ run, onClose }: TestReportModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set([0])); // Primeiro expandido por padrão

  const toggleTest = (index: number) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTests(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-accent-success';
    if (score >= 6) return 'text-accent-warning';
    return 'text-accent-error';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-accent-success/10 border-accent-success/20';
    if (score >= 6) return 'bg-accent-warning/10 border-accent-warning/20';
    return 'bg-accent-error/10 border-accent-error/20';
  };

  const getBorderColor = (passed: boolean, score: number) => {
    if (passed && score >= 8) return 'border-l-accent-success';
    if (score >= 6) return 'border-l-accent-warning';
    return 'border-l-accent-error';
  };

  const testDetails = run.test_details || [];
  const e2eScenarios = run.e2e_scenarios || [];
  const hasTestDetails = testDetails.length > 0;
  const hasE2EScenarios = e2eScenarios.length > 0;
  const hasDebate = !!run.debate?.verdict;
  const hasRealData = hasTestDetails || hasE2EScenarios || hasDebate;
  const isE2ETest = hasE2EScenarios && !hasTestDetails;
  const isDebateOnly = hasDebate && !hasTestDetails && !hasE2EScenarios;

  // Calcular contagem total de itens para a aba
  const totalResultsCount = hasE2EScenarios ? e2eScenarios.length : (hasTestDetails ? testDetails.length : (hasDebate ? 1 : 0));

  const tabs = [
    { id: 'results' as TabType, label: isDebateOnly ? 'Veredito do Debate' : (isE2ETest ? 'Cenários E2E' : 'Resultados dos Testes'), icon: FileText, count: totalResultsCount },
    { id: 'prompt' as TabType, label: 'Prompt do Agente', icon: Code },
    { id: 'conversation' as TabType, label: isDebateOnly ? 'Análise Completa' : (isE2ETest ? 'Conversas E2E' : 'Raciocínio & Conversa'), icon: MessageSquare },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-tertiary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-accent-primary" />
              <div>
                <h3 className="font-semibold text-text-primary">
                  {run.agent_name || 'Agente'} - {run.agent_version_id}
                </h3>
                <p className="text-xs text-text-muted">
                  {run.client_name || run.location_id || 'Cliente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-bg-primary rounded-full border border-border-default">
              <span className="text-xs font-medium text-accent-success flex items-center gap-1">
                <CheckCircle size={12} />
                {run.passed_tests} Passou
              </span>
              <div className="w-px h-3 bg-border-default"></div>
              <span className="text-xs font-medium text-accent-error flex items-center gap-1">
                <XCircle size={12} />
                {run.failed_tests} Falhou
              </span>
            </div>
            {run.score_overall !== undefined && (
              <div className={`px-3 py-1.5 rounded-full border ${getScoreBgColor(run.score_overall)}`}>
                <span className={`text-xs font-bold ${getScoreColor(run.score_overall)}`}>
                  Score: {run.score_overall.toFixed(1)}/10
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors text-text-muted hover:text-text-primary border border-transparent hover:border-border-default"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-default bg-bg-tertiary/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary bg-bg-secondary/50'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary/30'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-bg-tertiary">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'results' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Metadata Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded bg-bg-tertiary border border-border-default">
                  <div className="text-[10px] uppercase text-text-muted mb-1">Data/Hora</div>
                  <div className="text-text-primary text-sm">
                    {new Date(run.run_at || run.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
                {run.lead_classification && (
                  <div className="p-4 rounded bg-bg-tertiary border border-border-default">
                    <div className="text-[10px] uppercase text-text-muted mb-1">Classificação Lead</div>
                    <div className="text-text-primary text-sm font-medium">{run.lead_classification}</div>
                  </div>
                )}
                {run.total_tokens && (
                  <div className="p-4 rounded bg-bg-tertiary border border-border-default">
                    <div className="text-[10px] uppercase text-text-muted mb-1">Tokens Usados</div>
                    <div className="text-text-primary text-sm">{run.total_tokens.toLocaleString()}</div>
                  </div>
                )}
                {run.execution_time_ms && (
                  <div className="p-4 rounded bg-bg-tertiary border border-border-default">
                    <div className="text-[10px] uppercase text-text-muted mb-1">Tempo Execução</div>
                    <div className="text-text-primary text-sm">{(run.execution_time_ms / 1000).toFixed(2)}s</div>
                  </div>
                )}
              </div>

              {/* Test Results ou E2E Scenarios */}
              {hasRealData ? (
                <div className="space-y-3">
                  {/* Renderizar cenários E2E */}
                  {isE2ETest && e2eScenarios.map((scenario, index) => {
                    const passed = scenario.status === 'passed';
                    const score = scenario.score || 0;
                    return (
                      <div
                        key={scenario.id || index}
                        className={`bg-bg-tertiary rounded border border-border-default border-l-4 ${getBorderColor(passed, score)} overflow-hidden`}
                      >
                        {/* Header clicável */}
                        <button
                          onClick={() => toggleTest(index)}
                          className="w-full p-4 flex items-center justify-between hover:bg-bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {passed ? (
                              <CheckCircle size={18} className="text-accent-success" />
                            ) : (
                              <XCircle size={18} className="text-accent-error" />
                            )}
                            <div className="text-left">
                              <p className={`font-bold text-sm uppercase tracking-wider ${passed ? 'text-accent-success' : 'text-accent-error'}`}>
                                {passed ? '[PASSOU]' : '[FALHOU]'} {String(index + 1).padStart(2, '0')} - {scenario.scenario_name}
                              </p>
                              {scenario.lead_persona && (
                                <p className="text-xs text-text-muted mt-1">Persona: {scenario.lead_persona}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {scenario.total_turns && (
                              <span className="text-xs text-text-muted">
                                {scenario.total_turns} turnos
                              </span>
                            )}
                            {scenario.duration_seconds && (
                              <span className="text-xs text-text-muted">
                                {scenario.duration_seconds}s
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded border ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                              Score: {score.toFixed(1)}/10
                            </span>
                            {expandedTests.has(index) ? (
                              <ChevronDown size={18} className="text-text-muted" />
                            ) : (
                              <ChevronRight size={18} className="text-text-muted" />
                            )}
                          </div>
                        </button>

                        {/* Conteúdo expandido - Conversa E2E */}
                        {expandedTests.has(index) && scenario.conversation && scenario.conversation.length > 0 && (
                          <div className="px-4 pb-4 space-y-3">
                            <p className="text-xs text-text-muted uppercase mb-2">Conversa Completa:</p>
                            {scenario.conversation.map((msg, msgIndex) => (
                              <div key={msgIndex} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  msg.role === 'user' || msg.role === 'lead'
                                    ? 'bg-blue-500/10'
                                    : 'bg-accent-primary/10'
                                }`}>
                                  {msg.role === 'user' || msg.role === 'lead' ? (
                                    <MessageSquare size={14} className="text-blue-500" />
                                  ) : (
                                    <Bot size={14} className="text-accent-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-text-muted mb-1">
                                    {msg.role === 'user' || msg.role === 'lead' ? 'Lead' : 'Agente'}
                                  </div>
                                  <div className={`p-3 rounded-lg text-text-primary text-sm ${
                                    msg.role === 'user' || msg.role === 'lead'
                                      ? 'bg-bg-secondary'
                                      : 'bg-accent-primary/5 border border-accent-primary/20'
                                  }`}>
                                    {msg.content}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fallback se não tiver conversa */}
                        {expandedTests.has(index) && (!scenario.conversation || scenario.conversation.length === 0) && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-text-muted italic">Detalhes da conversa não disponíveis para este cenário.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Renderizar test_details (formato antigo) */}
                  {hasTestDetails && testDetails.map((test, index) => (
                    <div
                      key={index}
                      className={`bg-bg-tertiary rounded border border-border-default border-l-4 ${getBorderColor(test.passed, test.score)} overflow-hidden`}
                    >
                      {/* Header clicável */}
                      <button
                        onClick={() => toggleTest(index)}
                        className="w-full p-4 flex items-center justify-between hover:bg-bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {test.passed ? (
                            <CheckCircle size={18} className="text-accent-success" />
                          ) : (
                            <XCircle size={18} className="text-accent-error" />
                          )}
                          <div className="text-left">
                            <p className={`font-bold text-sm uppercase tracking-wider ${test.passed ? 'text-accent-success' : 'text-accent-error'}`}>
                              {test.passed ? '[PASSOU]' : '[FALHOU]'} {String(index + 1).padStart(2, '0')} - {test.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded border ${getScoreBgColor(test.score)} ${getScoreColor(test.score)}`}>
                            Score: {test.score.toFixed(1)}/10
                          </span>
                          {expandedTests.has(index) ? (
                            <ChevronDown size={18} className="text-text-muted" />
                          ) : (
                            <ChevronRight size={18} className="text-text-muted" />
                          )}
                        </div>
                      </button>

                      {/* Conteúdo expandido */}
                      {expandedTests.has(index) && (
                        <div className="px-4 pb-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-bg-secondary rounded border border-border-default">
                              <p className="text-[10px] text-text-muted uppercase mb-2 flex items-center gap-1">
                                <MessageSquare size={10} />
                                Input (Lead)
                              </p>
                              <p className="text-text-primary text-sm italic">"{test.input}"</p>
                            </div>
                            <div className="p-3 bg-bg-secondary rounded border border-border-default">
                              <p className="text-[10px] text-text-muted uppercase mb-2 flex items-center gap-1">
                                <Bot size={10} />
                                Output (Agente)
                              </p>
                              <p className="text-text-primary text-sm italic">"{test.simulated_response}"</p>
                            </div>
                          </div>

                          <div className="p-3 bg-bg-primary/50 rounded border border-border-default">
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              <span className={`font-bold ${test.passed ? 'text-accent-success' : 'text-accent-error'}`}>
                                <Sparkles size={12} className="inline mr-1" />
                                Análise do Judge:
                              </span>{' '}
                              {test.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted">Nenhum detalhe de teste disponível para esta execução.</p>
                  <p className="text-text-muted text-sm mt-1">Os dados de test_results não estão no validation_result.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Code size={20} className="text-accent-primary" />
                <h3 className="text-lg font-semibold text-text-primary">System Prompt do Agente</h3>
              </div>

              {run.system_prompt ? (
                <div className="bg-bg-tertiary rounded-lg border border-border-default p-6">
                  <pre className="whitespace-pre-wrap text-sm text-text-secondary font-mono leading-relaxed">
                    {run.system_prompt}
                  </pre>
                </div>
              ) : (
                <div className="bg-bg-tertiary rounded-lg border border-border-default p-8 text-center">
                  <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code size={24} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted mb-2">O prompt do agente não está disponível nesta visualização.</p>
                  <p className="text-text-muted text-sm">Para ver o prompt completo, acesse a página de Configuração do Agente.</p>
                </div>
              )}

              {/* Business Config se disponível */}
              {run.business_config && Object.keys(run.business_config).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <Bot size={16} />
                    Configuração do Negócio
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(run.business_config).map(([key, value]) => (
                      <div key={key} className="p-3 bg-bg-tertiary rounded border border-border-default">
                        <div className="text-[10px] uppercase text-text-muted mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-text-primary text-sm">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conversation' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare size={20} className="text-accent-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {isE2ETest ? 'Conversas E2E Completas' : 'Raciocínio e Conversa de Teste'}
                </h3>
              </div>

              {hasRealData ? (
                <div className="space-y-4">
                  <p className="text-text-muted text-sm mb-6">
                    {isE2ETest
                      ? 'Esta seção mostra as conversas completas de cada cenário E2E, simulando interações reais entre lead e agente.'
                      : 'Esta seção mostra o fluxo completo de cada teste, demonstrando como o agente interpretou o prompt e respondeu a cada cenário.'}
                  </p>

                  {/* Conversas E2E */}
                  {isE2ETest && e2eScenarios.map((scenario, index) => {
                    const passed = scenario.status === 'passed';
                    const score = scenario.score || 0;
                    return (
                      <div key={scenario.id || index} className="bg-bg-tertiary rounded-lg border border-border-default overflow-hidden">
                        <div className={`p-3 border-b border-border-default ${passed ? 'bg-accent-success/5' : 'bg-accent-error/5'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-text-primary">
                                Cenário {index + 1}: {scenario.scenario_name}
                              </span>
                              {scenario.lead_persona && (
                                <span className="ml-2 text-xs text-text-muted">
                                  ({scenario.lead_persona})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {scenario.total_turns && (
                                <span className="text-xs text-text-muted">{scenario.total_turns} turnos</span>
                              )}
                              {scenario.duration_seconds && (
                                <span className="text-xs text-text-muted">{scenario.duration_seconds}s</span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                                Score: {score.toFixed(1)}/10
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${passed ? 'bg-accent-success/10 text-accent-success' : 'bg-accent-error/10 text-accent-error'}`}>
                                {passed ? 'Aprovado' : 'Reprovado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {scenario.conversation && scenario.conversation.length > 0 ? (
                            scenario.conversation.map((msg, msgIndex) => (
                              <div key={msgIndex} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  msg.role === 'user' || msg.role === 'lead'
                                    ? 'bg-blue-500/10'
                                    : 'bg-accent-primary/10'
                                }`}>
                                  {msg.role === 'user' || msg.role === 'lead' ? (
                                    <MessageSquare size={14} className="text-blue-500" />
                                  ) : (
                                    <Bot size={14} className="text-accent-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-text-muted mb-1">
                                    {msg.role === 'user' || msg.role === 'lead' ? 'Lead' : 'Agente'}
                                  </div>
                                  <div className={`p-3 rounded-lg text-text-primary text-sm ${
                                    msg.role === 'user' || msg.role === 'lead'
                                      ? 'bg-bg-secondary'
                                      : 'bg-accent-primary/5 border border-accent-primary/20'
                                  }`}>
                                    {msg.content}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-text-muted italic text-center py-4">
                              Conversa não disponível para este cenário.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Conversas test_details (formato antigo) */}
                  {hasTestDetails && testDetails.map((test, index) => (
                    <div key={index} className="bg-bg-tertiary rounded-lg border border-border-default overflow-hidden">
                      <div className={`p-3 border-b border-border-default ${test.passed ? 'bg-accent-success/5' : 'bg-accent-error/5'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text-primary">
                            Cenário {index + 1}: {test.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${test.passed ? 'bg-accent-success/10 text-accent-success' : 'bg-accent-error/10 text-accent-error'}`}>
                            {test.passed ? 'Aprovado' : 'Reprovado'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Mensagem do Lead */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={14} className="text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted mb-1">Lead (Input)</div>
                            <div className="p-3 bg-bg-secondary rounded-lg text-text-primary text-sm">
                              {test.input}
                            </div>
                          </div>
                        </div>

                        {/* Resposta do Agente */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot size={14} className="text-accent-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted mb-1">Agente (Resposta Simulada)</div>
                            <div className="p-3 bg-accent-primary/5 rounded-lg text-text-primary text-sm border border-accent-primary/20">
                              {test.simulated_response}
                            </div>
                          </div>
                        </div>

                        {/* Análise do Judge */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={14} className="text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted mb-1">LLM-as-a-Judge (Análise)</div>
                            <div className={`p-3 rounded-lg text-sm border ${test.passed ? 'bg-accent-success/5 border-accent-success/20 text-text-primary' : 'bg-accent-error/5 border-accent-error/20 text-text-primary'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`font-bold ${getScoreColor(test.score)}`}>
                                  Score: {test.score.toFixed(1)}/10
                                </span>
                              </div>
                              <p>{test.feedback}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={24} className="text-text-muted" />
                  </div>
                  <p className="text-text-muted">Nenhuma conversa de teste disponível.</p>
                  <p className="text-text-muted text-sm mt-1">Os dados de conversação não estão presentes nesta execução.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default bg-bg-tertiary flex items-center justify-between">
          <div className="text-xs text-text-muted">
            {run.validation_status && (
              <span className="mr-4">Status: <span className="font-medium">{run.validation_status}</span></span>
            )}
            ID: {run.id.slice(0, 8)}...
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border-default rounded text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
