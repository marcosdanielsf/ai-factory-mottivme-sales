import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Bot,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  Undo2,
  Zap,
  History
} from 'lucide-react';
import { useTestResults } from '../hooks/useTestResults';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { supabase } from '../lib/supabase';
import { PromptEngineerChat } from '../components/PromptEngineerChat';

// Types
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface SimulatedConversation {
  id: string;
  scenario: string;
  messages: ConversationMessage[];
  score: number;
  passed: boolean;
}

// Componentes auxiliares
const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 8 ? 'text-emerald-400 bg-emerald-500/10' :
                score >= 6 ? 'text-amber-400 bg-amber-500/10' :
                'text-red-400 bg-red-500/10';
  return (
    <span className={`px-2 py-1 rounded-full text-sm font-bold ${color}`}>
      {score.toFixed(1)}/10
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Ativo' },
    pending_approval: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Aguardando Aprovacao' },
    draft: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Rascunho' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Reprovado' },
    superseded: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Substituido' },
  };
  const { bg, text, label } = config[status] || config.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Componente de Conversa Simulada
const ConversationViewer = ({ conversation }: { conversation: SimulatedConversation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            conversation.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {conversation.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
          </div>
          <div className="text-left">
            <p className="font-medium text-text-primary text-sm">{conversation.scenario}</p>
            <p className="text-xs text-text-muted">{conversation.messages.length} mensagens</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={conversation.score} />
          <ChevronDown size={16} className={`text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-default p-4 space-y-3 bg-bg-tertiary/30 max-h-96 overflow-y-auto">
          {conversation.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary border border-border-default text-text-primary'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal
export const ClientPortal = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { selectedAccount, isViewingSubconta } = useAccount();
  const isAdmin = useIsAdmin();
  const { testRuns, loading, error, refetch } = useTestResults();

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showEngineer, setShowEngineer] = useState(false);
  const [versionHistory, setVersionHistory] = useState<string[]>([]);

  // Multi-tenancy: determina location_id baseado no contexto
  const clientLocationId = useMemo(() => {
    // Admin vendo subconta
    if (isViewingSubconta && selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    // Cliente logado diretamente
    if (!isAdmin && selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    // Fallback para metadata do user
    return user?.user_metadata?.location_id || '';
  }, [isViewingSubconta, isAdmin, selectedAccount, user]);

  // Agrupar versoes do agente do cliente
  const agentVersions = useMemo(() => {
    const filtered = clientLocationId
      ? testRuns.filter((run: any) => run.location_id === clientLocationId)
      : testRuns;

    return filtered.sort((a, b) =>
      new Date(b.run_at || b.created_at).getTime() - new Date(a.run_at || a.created_at).getTime()
    );
  }, [testRuns, clientLocationId]);

  // Versao selecionada
  const currentVersion = useMemo(() => {
    if (selectedVersion) {
      return agentVersions.find((v: any) => v.id === selectedVersion);
    }
    return agentVersions[0];
  }, [agentVersions, selectedVersion]);

  // Conversas simuladas (mock)
  const simulatedConversations: SimulatedConversation[] = useMemo(() => {
    if (!currentVersion) return [];

    return [
      {
        id: '1',
        scenario: 'Primeira abordagem - Lead frio',
        messages: [
          { role: 'assistant', content: 'Ola! Vi que voce tem interesse em [servico]. Posso te ajudar?' },
          { role: 'user', content: 'Oi, sim, queria saber mais sobre os precos' },
          { role: 'assistant', content: 'Claro! Antes de falar sobre valores, me conta: qual e o seu principal objetivo com [servico]? Assim posso te indicar a melhor opcao.' },
          { role: 'user', content: 'Quero melhorar minha aparencia' },
          { role: 'assistant', content: 'Perfeito! Temos opcoes incriveis para isso. Posso agendar uma avaliacao gratuita para voce conhecer pessoalmente?' },
        ],
        score: (currentVersion as any).score_overall || 8.5,
        passed: true,
      },
      {
        id: '2',
        scenario: 'Objecao de preco',
        messages: [
          { role: 'user', content: 'Achei muito caro' },
          { role: 'assistant', content: 'Entendo sua preocupacao com o investimento. Posso te mostrar como nossos clientes conseguem resultados que valem cada centavo? Temos tambem opcoes de parcelamento.' },
          { role: 'user', content: 'Quanto fica parcelado?' },
          { role: 'assistant', content: 'Conseguimos em ate 12x! E o melhor: a primeira consulta e gratuita. Que tal agendar para conhecer melhor?' },
        ],
        score: ((currentVersion as any).score_overall || 8) - 0.5,
        passed: true,
      },
      {
        id: '3',
        scenario: 'Lead nao responde',
        messages: [
          { role: 'assistant', content: 'Ola [Nome]! Tudo bem? Vi que voce demonstrou interesse em nossos servicos.' },
          { role: 'assistant', content: '[24h depois] Oi [Nome], passando para ver se conseguiu pensar sobre a avaliacao gratuita?' },
          { role: 'assistant', content: '[48h depois] [Nome], ainda temos um horario disponivel essa semana. Posso reservar para voce?' },
        ],
        score: ((currentVersion as any).score_overall || 7.5) - 1,
        passed: ((currentVersion as any).score_overall || 7.5) - 1 >= 6,
      },
    ];
  }, [currentVersion]);

  // Handler para aplicar mudancas do Engenheiro de Prompt
  const handleApplyPromptChanges = useCallback(async (zone: string, newContent: any, fieldPath?: string) => {
    if (!currentVersion) return;

    // Salvar versao atual no historico para poder desfazer
    setVersionHistory(prev => [...prev, (currentVersion as any).id]);

    // Aplicar mudanca via Supabase
    const { error: updateError } = await supabase
      .from('agent_versions')
      .update({
        [zone]: newContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (currentVersion as any).agent_version_id || currentVersion.id);

    if (updateError) {
      console.warn('Erro ao aplicar:', updateError);
      throw updateError;
    }

    showToast('Alteracao aplicada! Uma nova versao foi criada.', 'success');
    refetch();
  }, [currentVersion, showToast, refetch]);

  // Desfazer ultima alteracao
  const handleUndo = useCallback(async () => {
    if (versionHistory.length === 0) {
      showToast('Nao ha alteracoes para desfazer', 'info');
      return;
    }

    const previousVersionId = versionHistory[versionHistory.length - 1];
    setVersionHistory(prev => prev.slice(0, -1));
    setSelectedVersion(previousVersionId);

    showToast('Versao anterior restaurada', 'success');
    refetch();
  }, [versionHistory, showToast, refetch]);

  // Aprovar agente
  const handleApproveAgent = useCallback(async () => {
    if (!currentVersion) return;

    setApproving(true);
    try {
      const { error: updateError } = await supabase
        .from('agent_versions')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: user?.email,
        })
        .eq('id', (currentVersion as any).agent_version_id || currentVersion.id);

      if (updateError) {
        console.warn('Erro ao aprovar:', updateError);
      }

      showToast('Agente aprovado com sucesso! Ele ja esta ativo.', 'success');
      refetch();
    } catch (err) {
      showToast('Erro ao aprovar agente', 'error');
    } finally {
      setApproving(false);
    }
  }, [currentVersion, user, showToast, refetch]);

  // Reprovar agente
  const handleRejectAgent = useCallback(async () => {
    if (!currentVersion) return;

    showToast('Use o Engenheiro de Prompts para descrever o que precisa mudar', 'info');
    setShowEngineer(true);
  }, [currentVersion, showToast]);

  // Loading state
  if (loading && agentVersions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-bg-secondary rounded w-1/3"></div>
          <div className="h-64 bg-bg-secondary rounded"></div>
          <div className="h-48 bg-bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar dados</h2>
        <p className="text-text-muted max-w-md mb-6">{error}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Empty state
  if (agentVersions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary mb-6">
          <Bot size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Seu agente esta sendo preparado</h2>
        <p className="text-text-muted max-w-md mb-6">
          Em breve voce podera visualizar e aprovar seu agente de vendas personalizado.
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <RefreshCw size={16} />
          Verificar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto transition-all ${showEngineer ? 'mr-[400px]' : ''}`}>
        <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                  <Bot size={24} />
                </div>
                Portal do Cliente
              </h1>
              <p className="text-text-secondary mt-1">
                Visualize, edite e aprove seu agente de vendas
              </p>
            </div>

            <div className="flex items-center gap-2">
              {versionHistory.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium transition-all"
                  title="Desfazer ultima alteracao"
                >
                  <Undo2 size={16} />
                  Desfazer
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded-lg text-sm font-medium transition-all"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Agente Atual */}
          {currentVersion && (
            <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
              {/* Header do Agente */}
              <div className="p-6 border-b border-border-default">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white text-xl font-bold">
                      {((currentVersion as any).agent_name || 'Agente')[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        {(currentVersion as any).agent_name || 'Seu Agente SDR'}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-text-muted font-mono">
                          {(currentVersion as any).agent_version || 'v1.0'}
                        </span>
                        <StatusBadge status={(currentVersion as any).agent_status || 'pending_approval'} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <ScoreBadge score={(currentVersion as any).score_overall || 0} />
                      <p className="text-xs text-text-muted mt-1">Score Geral</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-bg-tertiary/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400">
                    <CheckCircle size={16} />
                    <span className="text-lg font-bold">{(currentVersion as any).passed_tests || 0}</span>
                  </div>
                  <p className="text-xs text-text-muted">Testes OK</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-400">
                    <XCircle size={16} />
                    <span className="text-lg font-bold">{(currentVersion as any).failed_tests || 0}</span>
                  </div>
                  <p className="text-xs text-text-muted">Falhas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-accent-primary">
                    <MessageSquare size={16} />
                    <span className="text-lg font-bold">{simulatedConversations.length}</span>
                  </div>
                  <p className="text-xs text-text-muted">Simulacoes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    <Clock size={16} />
                    <span className="text-lg font-bold">
                      {new Date((currentVersion as any).run_at || (currentVersion as any).created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">Ultima Validacao</p>
                </div>
              </div>

              {/* Prompt do Agente */}
              <div className="border-t border-border-default">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-accent-primary" />
                    <span className="font-medium text-text-primary">Ver Prompt do Agente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showPrompt ? <EyeOff size={16} className="text-text-muted" /> : <Eye size={16} className="text-text-muted" />}
                  </div>
                </button>

                {showPrompt && (
                  <div className="p-4 bg-bg-tertiary/50 border-t border-border-default">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-text-muted">Prompt atual do agente</span>
                      <button
                        onClick={() => setShowEngineer(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-medium transition-all"
                      >
                        <Zap size={14} />
                        Editar com IA
                      </button>
                    </div>
                    <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-bg-primary p-4 rounded-lg border border-border-default max-h-64 overflow-y-auto">
                      {(currentVersion as any).prompt_content || (currentVersion as any).system_prompt ||
                        `Voce e um assistente de vendas especializado em [servico].
Seu objetivo e:
1. Qualificar leads
2. Agendar consultas
3. Tratar objecoes com empatia

Sempre mantenha um tom profissional e amigavel.`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversas Simuladas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare size={20} className="text-accent-primary" />
              Conversas Simuladas
            </h3>
            <p className="text-sm text-text-muted">
              Analise como seu agente se comporta em diferentes cenarios. Se encontrar algo para melhorar, use o Engenheiro de Prompts.
            </p>

            <div className="space-y-3">
              {simulatedConversations.map(conv => (
                <ConversationViewer key={conv.id} conversation={conv} />
              ))}
            </div>
          </div>

          {/* Botao para abrir Engenheiro */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Sparkles size={24} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Quer fazer ajustes?</h3>
                <p className="text-sm text-text-muted">
                  Use o Engenheiro de Prompts para editar o agente em linguagem natural
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEngineer(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all"
            >
              <Zap size={24} />
              Abrir Engenheiro de Prompts
            </button>
          </div>

          {/* Botoes de Aprovacao */}
          {currentVersion && (currentVersion as any).agent_status === 'pending_approval' && (
            <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Decisao Final</h3>
              <p className="text-sm text-text-muted mb-6">
                Apos analisar as conversas e fazer os ajustes necessarios, aprove o agente para ativa-lo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleApproveAgent}
                  disabled={approving}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
                >
                  {approving ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <ThumbsUp size={24} />
                  )}
                  Aprovar Agente
                </button>

                <button
                  onClick={handleRejectAgent}
                  disabled={approving}
                  className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-bg-tertiary hover:bg-bg-hover border border-border-default text-text-primary rounded-xl font-semibold text-lg transition-colors disabled:opacity-50"
                >
                  <Zap size={24} className="text-cyan-400" />
                  Precisa de Ajustes
                </button>
              </div>
            </div>
          )}

          {/* Versoes Anteriores */}
          {agentVersions.length > 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <History size={20} className="text-text-muted" />
                Versoes Anteriores
              </h3>

              <div className="space-y-2">
                {agentVersions.slice(1, 5).map((version: any) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      selectedVersion === version.id
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-default bg-bg-secondary hover:border-border-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm px-2 py-1 rounded bg-bg-tertiary">
                        {version.agent_version || 'v' + version.id.slice(0, 4)}
                      </span>
                      <StatusBadge status={version.agent_status || 'superseded'} />
                    </div>
                    <div className="flex items-center gap-4">
                      <ScoreBadge score={version.score_overall || 0} />
                      <span className="text-xs text-text-muted">
                        {new Date(version.run_at || version.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engenheiro de Prompts - Painel Lateral */}
      {showEngineer && currentVersion && (
        <div className="fixed right-0 top-0 bottom-0 w-[400px] border-l border-border-default bg-bg-primary shadow-2xl z-50">
          <PromptEngineerChat
            agentId={(currentVersion as any).agent_version_id || currentVersion.id}
            agentName={(currentVersion as any).agent_name || 'Agente'}
            currentPrompt={(currentVersion as any).prompt_content || (currentVersion as any).system_prompt || ''}
            currentConfigs={{
              hyperpersonalization: (currentVersion as any).hyperpersonalization,
              compliance_rules: (currentVersion as any).compliance_rules,
              personality_config: (currentVersion as any).personality_config,
              business_config: (currentVersion as any).business_config,
              tools_config: (currentVersion as any).tools_config,
              prompts_by_mode: (currentVersion as any).prompts_by_mode,
            }}
            onApplyChanges={handleApplyPromptChanges}
            onClose={() => setShowEngineer(false)}
          />
        </div>
      )}
    </div>
  );
};
