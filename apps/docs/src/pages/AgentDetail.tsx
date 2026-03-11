import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Edit, Play, Clock, TrendingUp, Power, PowerOff, ChevronDown, ChevronUp, Settings, Code, Shield, Brain, Target, Briefcase, Sparkles, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AgentPerformanceRadar, ScoreAreaChart } from '../components/charts';

interface AgentVersion {
  id: string;
  agent_name: string;
  slug: string;
  version: string;
  status: string;
  is_active: boolean;
  system_prompt: string | null;
  last_test_score: number | null;
  validation_score: number | null;
  total_test_runs: number;
  framework_approved: boolean;
  test_report_url: string | null;
  last_test_at: string | null;
  created_at: string;
  updated_at: string;
  // 8 campos de configuração
  tools_config: Record<string, any> | null;
  compliance_rules: Record<string, any> | null;
  personality_config: Record<string, any> | null;
  qualification_config: Record<string, any> | null;
  business_config: Record<string, any> | null;
  // Extras
  prompts_by_mode: Record<string, any> | null;
  deployment_notes: string | null;
  hyperpersonalization: Record<string, any> | null;
  location_id: string | null;
  client_id: string | null;
  avg_score_overall: number | null;
}

interface TestResult {
  id: string;
  overall_score: number;
  tested_at: string;
  test_duration_ms?: number;
  tone?: number;
  engagement?: number;
  compliance?: number;
  completeness?: number;
  conversion?: number;
  strengths?: string[];
  weaknesses?: string[];
  html_report_url?: string;
}

export const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentVersion | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchAgent = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar agente
      const { data: agentData, error: agentError } = await supabase
        .from('agent_versions')
        .select('*')
        .eq('id', id)
        .single();

      if (agentError) throw agentError;
      setAgent(agentData);

      // Buscar resultados de testes
      const { data: testsData, error: testsError } = await supabase
        .from('test_results')
        .select('*')
        .eq('agent_version_id', id)
        .order('tested_at', { ascending: false })
        .limit(10);

      if (!testsError && testsData) {
        setTestResults(testsData);
      }
    } catch (err: any) {
      console.error('Error fetching agent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleRunTest = async () => {
    if (!agent) return;

    setTesting(true);
    // Simular teste por enquanto - integrar com backend depois
    setTimeout(() => {
      setTesting(false);
      fetchAgent(); // Refresh data
    }, 3000);
  };

  // Toggle is_active
  const handleToggleActive = async () => {
    if (!agent) return;
    try {
      const { error } = await supabase
        .from('agent_versions')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);
      
      if (error) throw error;
      fetchAgent();
    } catch (err: any) {
      console.error('Error toggling active:', err);
    }
  };

  // Change status
  const handleChangeStatus = async (newStatus: string) => {
    if (!agent) return;
    try {
      const { error } = await supabase
        .from('agent_versions')
        .update({ status: newStatus })
        .eq('id', agent.id);
      
      if (error) throw error;
      fetchAgent();
    } catch (err: any) {
      console.error('Error changing status:', err);
    }
  };

  // Componente para mostrar JSONB expandível
  const JsonSection = ({ title, icon: Icon, data, color = 'blue' }: { title: string; icon: any; data: any; color?: string }) => {
    const [expanded, setExpanded] = useState(false);
    const colorClasses: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      green: 'text-green-400 bg-green-500/10 border-green-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]} opacity-50`}>
          <div className="flex items-center gap-2">
            <Icon size={18} />
            <span className="font-medium">{title}</span>
            <span className="text-xs ml-auto">Não configurado</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`rounded-lg border ${colorClasses[color]}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center gap-2 hover:bg-white/5 transition-colors"
        >
          <Icon size={18} />
          <span className="font-medium">{title}</span>
          <span className="text-xs ml-auto mr-2">{Object.keys(data).length} campos</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 border-t border-current/10">
            <pre className="text-xs overflow-auto max-h-80 mt-3 p-3 bg-black/20 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-bg-tertiary rounded w-1/3" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-[350px] bg-bg-tertiary rounded" />
            <div className="h-[350px] bg-bg-tertiary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto text-accent-error mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Agente não encontrado</h2>
          <p className="text-text-muted mb-6">{error || 'O agente solicitado não existe.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const lastTest = testResults[0];
  const dimensions = lastTest ? [
    { dimension: 'Completude', score: lastTest.completeness || 0, fullMark: 10 },
    { dimension: 'Tom', score: lastTest.tone || 0, fullMark: 10 },
    { dimension: 'Engajamento', score: lastTest.engagement || 0, fullMark: 10 },
    { dimension: 'Compliance', score: lastTest.compliance || 0, fullMark: 10 },
    { dimension: 'Conversão', score: lastTest.conversion || 0, fullMark: 10 },
  ] : [];

  const scoreHistory = testResults.map(test => ({
    date: test.tested_at,
    score: test.overall_score
  })).reverse();

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-accent-success';
    if (score >= 6) return 'text-accent-warning';
    return 'text-accent-error';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      production: 'bg-green-500/20 text-green-400',
      draft: 'bg-yellow-500/20 text-yellow-400',
      archived: 'bg-gray-500/20 text-gray-400',
      pending_approval: 'bg-blue-500/20 text-blue-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-text-primary">{agent.agent_name}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(agent.status)}`}>
              {agent.status}
            </span>
            {agent.framework_approved && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                Framework Approved
              </span>
            )}
          </div>

          <p className="text-text-muted">
            Versão {agent.version} • Último teste:{' '}
            {agent.last_test_at
              ? new Date(agent.last_test_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Nunca testado'}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {/* Toggle Ativo/Inativo */}
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                agent.is_active 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {agent.is_active ? <Power size={16} /> : <PowerOff size={16} />}
              {agent.is_active ? 'Ativo' : 'Inativo'}
            </button>

            {/* Status Dropdown */}
            <select
              value={agent.status}
              onChange={(e) => handleChangeStatus(e.target.value)}
              className="px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary cursor-pointer hover:bg-bg-tertiary transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="production">Production</option>
              <option value="deprecated">Deprecated</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={() => navigate('/prompt-studio')}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <Edit size={16} />
              Editar Prompt
            </button>
            <button
              onClick={handleRunTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              <Play size={16} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testando...' : 'Rodar Teste'}
            </button>
          </div>
        </div>

        {/* Score Badge */}
        <div className="text-right">
          <div className={`text-5xl font-bold ${getScoreColor(agent.last_test_score || 0)}`}>
            {(agent.last_test_score || 0).toFixed(1)}
          </div>
          <div className="text-sm text-text-muted">Score Geral</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-text-muted justify-end">
            <TrendingUp size={12} />
            {agent.total_test_runs} testes realizados
          </div>
        </div>
      </div>

      {/* System Prompt */}
      {agent.system_prompt && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-accent-primary" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">System Prompt</h3>
            <span className="text-xs text-text-muted ml-auto">{agent.system_prompt.length} caracteres</span>
          </div>
          <pre className="text-sm text-text-secondary whitespace-pre-wrap bg-bg-tertiary p-4 rounded-lg max-h-60 overflow-auto">
            {agent.system_prompt}
          </pre>
        </div>
      )}

      {/* 8 Campos de Configuração */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="text-accent-primary" size={20} />
          <h3 className="text-lg font-semibold text-text-primary">Configurações do Agente</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <JsonSection title="Tools Config" icon={Code} data={agent.tools_config} color="blue" />
          <JsonSection title="Compliance Rules" icon={Shield} data={agent.compliance_rules} color="red" />
          <JsonSection title="Personality Config" icon={Brain} data={agent.personality_config} color="purple" />
          <JsonSection title="Qualification Config" icon={Target} data={agent.qualification_config} color="green" />
          <JsonSection title="Business Config" icon={Briefcase} data={agent.business_config} color="orange" />
          <JsonSection title="Prompts by Mode" icon={BookOpen} data={agent.prompts_by_mode} color="pink" />
        </div>
      </div>

      {/* Extras */}
      {(agent.hyperpersonalization || agent.deployment_notes) && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-accent-primary" size={20} />
            <h3 className="text-lg font-semibold text-text-primary">Extras</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JsonSection title="Hyperpersonalization" icon={Sparkles} data={agent.hyperpersonalization} color="pink" />
            {agent.deployment_notes && (
              <div className="p-4 rounded-lg border border-gray-500/20 bg-gray-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-gray-400" />
                  <span className="font-medium text-gray-400">Deployment Notes</span>
                </div>
                <p className="text-sm text-text-secondary">{agent.deployment_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Adicional */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Location ID</p>
          <p className="text-sm text-text-primary font-mono truncate">{agent.location_id || '-'}</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Client ID</p>
          <p className="text-sm text-text-primary font-mono truncate">{agent.client_id || '-'}</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Validation Score</p>
          <p className={`text-sm font-bold ${getScoreColor(agent.validation_score || 0)}`}>
            {agent.validation_score?.toFixed(1) || '-'}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <p className="text-xs text-text-muted mb-1">Avg Score Overall</p>
          <p className={`text-sm font-bold ${getScoreColor(agent.avg_score_overall || 0)}`}>
            {agent.avg_score_overall?.toFixed(1) || '-'}
          </p>
        </div>
      </div>

      {/* Dimension Charts */}
      {dimensions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Performance Radar</h3>
            <p className="text-sm text-text-muted mb-4">Visualização das 5 dimensões de avaliação</p>
            <AgentPerformanceRadar data={dimensions} agentName={agent.agent_name} />
          </div>

          {/* Score Bars */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Score por Dimensão</h3>
            <p className="text-sm text-text-muted mb-4">Detalhamento dos critérios de avaliação</p>
            <div className="space-y-4">
              {dimensions.map((dim) => {
                const percentage = (dim.score / 10) * 100;
                const colorClass = dim.score >= 8 ? 'bg-green-500' : dim.score >= 6 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={dim.dimension} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">{dim.dimension}</span>
                      <span className={`text-sm font-bold ${getScoreColor(dim.score)}`}>
                        {dim.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Score Evolution Chart */}
      {scoreHistory.length > 1 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Evolução do Score</h3>
          <p className="text-sm text-text-muted mb-4">Histórico de performance ao longo do tempo</p>
          <ScoreAreaChart data={scoreHistory} />
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {lastTest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="text-accent-success" size={20} />
              <h3 className="text-lg font-semibold text-text-primary">Pontos Fortes</h3>
            </div>
            <ul className="space-y-2">
              {lastTest.strengths && lastTest.strengths.length > 0 ? (
                lastTest.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent-success mt-1">•</span>
                    <span className="text-sm text-text-secondary">{strength}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-muted">Nenhum dado disponível</li>
              )}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-accent-warning" size={20} />
              <h3 className="text-lg font-semibold text-text-primary">Áreas de Melhoria</h3>
            </div>
            <ul className="space-y-2">
              {lastTest.weaknesses && lastTest.weaknesses.length > 0 ? (
                lastTest.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-accent-warning mt-1">•</span>
                    <span className="text-sm text-text-secondary">{weakness}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-muted">Nenhum dado disponível</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Test History */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Histórico de Testes</h3>
        <p className="text-sm text-text-muted mb-4">Timeline de todas as avaliações deste agente</p>

        {testResults.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum teste realizado ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testResults.map((test, index) => {
              const isPassed = test.overall_score >= 8.0;
              const isWarning = test.overall_score >= 6.0 && test.overall_score < 8.0;
              const status = isPassed ? 'passed' : isWarning ? 'warning' : 'failed';
              const statusColors = {
                passed: 'bg-green-500/20 text-green-400',
                warning: 'bg-yellow-500/20 text-yellow-400',
                failed: 'bg-red-500/20 text-red-400',
              };

              return (
                <div key={test.id} className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isPassed ? 'bg-green-500/20' : isWarning ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    <FileText size={20} className={isPassed ? 'text-green-400' : isWarning ? 'text-yellow-400' : 'text-red-400'} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">Teste #{testResults.length - index}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}>
                        {status === 'passed' ? 'Aprovado' : status === 'warning' ? 'Atenção' : 'Reprovado'}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted flex items-center gap-2">
                      <Clock size={12} />
                      {new Date(test.tested_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {test.test_duration_ms && (
                        <span>• {(test.test_duration_ms / 1000).toFixed(1)}s</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(test.overall_score)}`}>
                      {test.overall_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-muted">Score</div>
                  </div>

                  {test.html_report_url && (
                    <a
                      href={test.html_report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                    >
                      Ver Relatório
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Full Report Button */}
      {agent.test_report_url && (
        <div className="flex justify-end">
          <a
            href={agent.test_report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            <FileText size={18} />
            Ver Relatório Completo (HTML)
          </a>
        </div>
      )}
    </div>
  );
};
