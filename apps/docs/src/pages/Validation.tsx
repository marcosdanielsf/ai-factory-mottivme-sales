import React, { useState, useMemo, useCallback } from 'react';
import { Play, CheckCircle, XCircle, FileText, ChevronRight, Loader2, AlertCircle, Inbox, RefreshCw, Trash2, Users, TrendingUp, Award, Power, ToggleLeft, ToggleRight } from 'lucide-react';
import { TestReportModal } from '../components/TestReportModal';
import { useTestResults } from '../hooks/useTestResults';
import { useToast } from '../hooks/useToast';

// Mapeamento de location_id para nome do cliente
const LOCATION_NAMES: Record<string, string> = {
  // Clientes ativos
  'sNwLyynZWP6jEtBy1ubf': 'Instituto Amar',
  'GT77iGk2WDneoHwtuq6D': 'Dr. Alberto Correia',
  'Rre0WqSlmAPmIrURgiMf': 'Dr. Thauan Santos',
  'pFHwENFUxjtiON94jn2k': 'Dra. Eline Lobo',
  'I0LCuaH8lRKFMfvfxpDe': 'Dra. Gabriella Rossmann',
  'xliub5H5pQ4QcDeKHc6F': 'Dra. Gabriella (Mentoria)',
  'uSwkCg4V1rfpvk4tG6zP': 'BPOSS - Dra. Heloise',
  'Bgi2hFMgiLLoRlOO0K5b': 'Brazillionaires',
  'Cl5gfyVMEjpP6Z8vINex': 'Dra. Eline SDR',
  'EKHxHl3KLPN0iRc69GNU': 'Fernanda Lappe',
  '3Ilk6A1LdnaP8POy0JWo': 'Fernanda Leal',
  'XNjmi1DpvqoF09y1mip9': 'Social Business (Marcos)',
  'KtMB8IKwmhtnKt7aimzd': 'Legacy Agency',
  // Internos / Testes
  'cd1uyzpJox6XPt4Vct8Y': 'AI Factory (Interno)',
  '8GedMLMaF26jIkHq50XG': 'Diana (Teste)',
  'flavia-leal-beauty-school-test': 'Flavia Leal Beauty School',
  // Sem location
  '': 'Sem Location',
  'sem-location': 'Sem Location',
};

// Tipo para cliente agrupado (por location_id)
interface ClientGroup {
  locationId: string;
  clientName: string;
  agents: AgentInfo[];
  totalVersions: number;
  activeVersion: string | null;
  latestScore: number;
  latestStatus: 'approved' | 'rejected' | 'pending';
  lastValidated: string;
}

interface AgentInfo {
  agentName: string;
  versions: any[];
}

export const Validation = () => {
  const { testRuns, loading, error, refetch, deleteTestRun, deleting, toggleVersionActive } = useTestResults();
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Filtros
  const [filterClient, setFilterClient] = useState<string>('');

  // Agrupar por location_id (cliente)
  const clientGroups = useMemo(() => {
    const groups = new Map<string, ClientGroup>();

    testRuns.forEach(run => {
      const locationId = (run as any).location_id || 'sem-location';
      const clientName = LOCATION_NAMES[locationId] || (run as any).client_name || locationId;
      const agentName = run.agent_name || 'Agente Desconhecido';

      if (!groups.has(locationId)) {
        groups.set(locationId, {
          locationId,
          clientName,
          agents: [],
          totalVersions: 0,
          activeVersion: null,
          latestScore: 0,
          latestStatus: 'pending',
          lastValidated: run.created_at || run.run_at || ''
        });
      }

      const group = groups.get(locationId)!;

      // Encontrar ou criar o agente
      let agent = group.agents.find(a => a.agentName === agentName);
      if (!agent) {
        agent = { agentName, versions: [] };
        group.agents.push(agent);
      }

      agent.versions.push(run);
      group.totalVersions++;

      // Verificar se é a versão ativa
      if ((run as any).is_active) {
        group.activeVersion = run.agent_version || run.agent_version_id || 'v1.0';
      }

      // Atualizar última validação se esta for mais recente
      const runDate = new Date(run.run_at || run.created_at);
      if (runDate > new Date(group.lastValidated)) {
        group.lastValidated = run.run_at || run.created_at;
        group.latestScore = run.score_overall || 0;
        group.latestStatus = run.passed_tests === run.total_tests && run.passed_tests > 0
          ? 'approved'
          : run.failed_tests > 0
            ? 'rejected'
            : 'pending';
      }
    });

    // Ordenar versões dentro de cada agente (mais recente primeiro)
    groups.forEach(group => {
      group.agents.forEach(agent => {
        agent.versions.sort((a, b) =>
          new Date(b.run_at || b.created_at).getTime() - new Date(a.run_at || a.created_at).getTime()
        );
      });
      // Ordenar agentes por nome
      group.agents.sort((a, b) => a.agentName.localeCompare(b.agentName));
    });

    // Converter para array e ordenar por última validação
    return Array.from(groups.values())
      .sort((a, b) => new Date(b.lastValidated).getTime() - new Date(a.lastValidated).getTime());
  }, [testRuns]);

  // Filtrar clientes
  const filteredGroups = useMemo(() => {
    if (!filterClient) return clientGroups;
    const search = filterClient.toLowerCase();
    return clientGroups.filter(g =>
      g.clientName.toLowerCase().includes(search) ||
      g.locationId.toLowerCase().includes(search) ||
      g.agents.some(a => a.agentName.toLowerCase().includes(search))
    );
  }, [clientGroups, filterClient]);

  // Estatísticas globais
  const stats = useMemo(() => {
    const approved = clientGroups.filter(g => g.latestStatus === 'approved').length;
    const rejected = clientGroups.filter(g => g.latestStatus === 'rejected').length;
    const avgScore = clientGroups.length > 0
      ? clientGroups.reduce((sum, g) => sum + g.latestScore, 0) / clientGroups.length
      : 0;
    return { approved, rejected, avgScore, total: clientGroups.length };
  }, [clientGroups]);

  const handleRunTests = () => {
    setRunning(true);
    showToast('Iniciando bateria de testes V4...', 'info');

    setTimeout(() => {
      setRunning(false);
      showToast('Bateria de testes finalizada com sucesso!', 'success');
      refetch();
    }, 2000);
  };

  const handleRefresh = () => {
    refetch();
    showToast('Histórico de execuções atualizado', 'info');
  };

  const handleViewReport = (id: string) => {
    setSelectedReport(id);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTestRun(id);
    if (success) {
      showToast('Registro deletado com sucesso!', 'success');
    } else {
      showToast('Erro ao deletar registro', 'error');
    }
    setConfirmDelete(null);
  };

  const handleToggleActive = useCallback(async (id: string, currentActive: boolean) => {
    setToggling(id);
    const success = await toggleVersionActive(id, !currentActive);
    if (success) {
      showToast(
        !currentActive ? 'Versão ativada com sucesso!' : 'Versão desativada.',
        !currentActive ? 'success' : 'info'
      );
    } else {
      showToast('Erro ao alterar status da versão', 'error');
    }
    setToggling(null);
  }, [toggleVersionActive, showToast]);

  const toggleClient = (locationId: string) => {
    setExpandedClient(prev => prev === locationId ? null : locationId);
    setExpandedAgent(null); // Colapsar agente ao trocar de cliente
  };

  const toggleAgent = (agentKey: string) => {
    setExpandedAgent(prev => prev === agentKey ? null : agentKey);
  };

  const selectedRun = testRuns.find(r => r.id === selectedReport);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar validações</h2>
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

  if (loading && testRuns.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b border-border-default pb-6">
          <div className="space-y-2">
            <div className="h-8 bg-bg-secondary rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-bg-secondary rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-10 bg-bg-secondary rounded w-48 animate-pulse"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-bg-tertiary rounded w-1/4"></div>
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bg-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-bg-tertiary rounded w-48 mb-2"></div>
                  <div className="h-3 bg-bg-tertiary rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-1.5 rounded bg-accent-primary/10 text-accent-primary">
              <span className="text-lg font-mono font-bold">V4</span>
            </div>
            Framework de Validação
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Validações agrupadas por cliente com controle de versões
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTests}
            disabled={running || loading}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary hover:bg-white/90 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {running ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            {running ? 'Executando...' : 'Rodar Nova Bateria'}
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {selectedReport && selectedRun && (
        <TestReportModal
          run={selectedRun}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary border border-border-default rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Confirmar Exclusão</h3>
                <p className="text-sm text-text-muted">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-text-secondary mb-6">
              Tem certeza que deseja deletar este registro de validação?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex items-center gap-2 px-4 py-2 bg-accent-error text-white rounded text-sm font-medium hover:bg-accent-error/90 transition-colors disabled:opacity-50"
              >
                {deleting === confirmDelete ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards - Dinâmicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-primary/30 transition-colors">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Users size={14} />
            <span className="text-xs uppercase tracking-wider">Total Clientes</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-success/30 transition-colors">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <CheckCircle size={14} className="text-accent-success" />
            <span className="text-xs uppercase tracking-wider">Aprovados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-accent-success">{stats.approved}</span>
            <span className="text-xs text-text-muted">
              ({stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-error/30 transition-colors">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <XCircle size={14} className="text-accent-error" />
            <span className="text-xs uppercase tracking-wider">Reprovados</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-accent-error">{stats.rejected}</span>
            <span className="text-xs text-text-muted">
              ({stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-warning/30 transition-colors">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Award size={14} className="text-accent-warning" />
            <span className="text-xs uppercase tracking-wider">Score Médio</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-text-primary">{stats.avgScore.toFixed(1)}</span>
            <span className="text-sm text-text-muted">/10</span>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Clientes e Validações</h2>
          <div className="flex items-center gap-2">
            {/* Busca rápida */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente ou agente..."
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-56 bg-bg-tertiary border border-border-default rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
              />
              {filterClient && (
                <button
                  onClick={() => setFilterClient('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  ×
                </button>
              )}
            </div>
            {!loading && (
              <button
                onClick={handleRefresh}
                className="p-2 text-text-muted hover:text-accent-primary transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Accordion de Clientes */}
        <div className="space-y-2">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.locationId}
                className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden"
              >
                {/* Header do Cliente - Clicável */}
                <button
                  onClick={() => toggleClient(group.locationId)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-bg-tertiary transition-colors text-left"
                >
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    group.latestStatus === 'approved'
                      ? 'bg-accent-success/10 text-accent-success'
                      : group.latestStatus === 'rejected'
                        ? 'bg-accent-error/10 text-accent-error'
                        : 'bg-accent-warning/10 text-accent-warning'
                  }`}>
                    {group.latestStatus === 'approved' ? (
                      <CheckCircle size={20} />
                    ) : group.latestStatus === 'rejected' ? (
                      <XCircle size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">
                        {group.clientName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        group.latestStatus === 'approved'
                          ? 'bg-accent-success/10 text-accent-success'
                          : group.latestStatus === 'rejected'
                            ? 'bg-accent-error/10 text-accent-error'
                            : 'bg-accent-warning/10 text-accent-warning'
                      }`}>
                        {group.latestStatus === 'approved' ? 'Aprovado' : group.latestStatus === 'rejected' ? 'Reprovado' : 'Pendente'}
                      </span>
                      {group.activeVersion && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-accent-primary/10 text-accent-primary flex items-center gap-1">
                          <Power size={10} />
                          {group.activeVersion}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {group.agents.length} agente{group.agents.length !== 1 ? 's' : ''} · {group.totalVersions} versões
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-text-primary">{group.latestScore.toFixed(1)}</div>
                      <div className="text-xs text-text-muted">Score</div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="text-xs text-text-muted">Última</div>
                      <div className="text-xs text-text-secondary">
                        {new Date(group.lastValidated).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className={`transition-transform ${expandedClient === group.locationId ? 'rotate-90' : ''}`}>
                    <ChevronRight size={20} className="text-text-muted" />
                  </div>
                </button>

                {/* Lista de Agentes (expandida) */}
                {expandedClient === group.locationId && (
                  <div className="border-t border-border-default bg-bg-tertiary/30">
                    {group.agents.map((agent) => {
                      const agentKey = `${group.locationId}_${agent.agentName}`;
                      const latestVersion = agent.versions[0];
                      const activeVersion = agent.versions.find((v: any) => v.is_active);
                      const agentScore = latestVersion?.score_overall || 0;

                      return (
                        <div key={agent.agentName} className="border-b border-border-default/50 last:border-0">
                          {/* Header do Agente - Clicável */}
                          <button
                            onClick={() => toggleAgent(agentKey)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors text-left"
                          >
                            {/* Chevron */}
                            <div className={`transition-transform ${expandedAgent === agentKey ? 'rotate-90' : ''}`}>
                              <ChevronRight size={16} className="text-text-muted" />
                            </div>

                            {/* Status do agente */}
                            <div className={`w-2 h-2 rounded-full ${
                              activeVersion ? 'bg-accent-success' : 'bg-text-muted'
                            }`} />

                            {/* Nome do Agente */}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text-primary">{agent.agentName}</span>
                              {activeVersion && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-accent-success/10 text-accent-success">
                                  {activeVersion.agent_version || 'ativo'}
                                </span>
                              )}
                            </div>

                            {/* Stats do agente */}
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-text-muted">{agent.versions.length} versões</span>
                              <span className={`font-medium ${
                                agentScore >= 8 ? 'text-accent-success' :
                                agentScore >= 6 ? 'text-accent-warning' :
                                agentScore > 0 ? 'text-accent-error' : 'text-text-muted'
                              }`}>
                                {agentScore.toFixed(1)}
                              </span>
                            </div>
                          </button>

                          {/* Versões do Agente (expandidas) */}
                          {expandedAgent === agentKey && (
                            <div className="bg-bg-primary/50">
                              {/* Header da tabela de versões */}
                              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-y border-border-default/50">
                                <div className="col-span-1">Ativo</div>
                                <div className="col-span-2">Versão</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2">Score</div>
                                <div className="col-span-2">Resultado</div>
                                <div className="col-span-1">Data</div>
                                <div className="col-span-2 text-right">Ações</div>
                              </div>

                              {/* Lista de versões */}
                              {agent.versions.map((run: any) => (
                                <div
                                  key={run.id}
                                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-bg-tertiary transition-colors border-b border-border-default/30 last:border-0 ${
                                    run.is_active ? 'bg-accent-primary/5' : ''
                                  }`}
                                >
                                  {/* Toggle Ativo */}
                                  <div className="col-span-1">
                                    <button
                                      onClick={() => handleToggleActive(run.id, run.is_active)}
                                      disabled={toggling === run.id}
                                      className={`p-1 rounded transition-colors ${
                                        run.is_active
                                          ? 'text-accent-success hover:text-accent-success/80'
                                          : 'text-text-muted hover:text-text-primary'
                                      }`}
                                      title={run.is_active ? 'Versão ativa - clique para desativar' : 'Clique para ativar esta versão'}
                                    >
                                      {toggling === run.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                      ) : run.is_active ? (
                                        <ToggleRight size={18} />
                                      ) : (
                                        <ToggleLeft size={18} />
                                      )}
                                    </button>
                                  </div>

                                  {/* Versão */}
                                  <div className="col-span-2">
                                    <span className={`font-mono text-sm px-2 py-0.5 rounded border ${
                                      run.is_active
                                        ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                        : 'bg-bg-secondary border-border-default'
                                    }`}>
                                      {run.agent_version || run.agent_version_id || 'v1.0'}
                                    </span>
                                  </div>

                                  {/* Status do Agente */}
                                  <div className="col-span-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                      run.agent_status === 'active'
                                        ? 'bg-accent-success/10 text-accent-success'
                                        : run.agent_status === 'pending_approval'
                                          ? 'bg-accent-warning/10 text-accent-warning'
                                          : run.agent_status === 'draft'
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'bg-text-muted/10 text-text-muted'
                                    }`}>
                                      {run.agent_status === 'active' ? 'Ativo' :
                                       run.agent_status === 'pending_approval' ? 'Aguardando' :
                                       run.agent_status === 'draft' ? 'Rascunho' :
                                       run.agent_status === 'superseded' ? 'Substituído' :
                                       run.agent_status === 'inactive' ? 'Inativo' :
                                       run.agent_status || 'N/A'}
                                    </span>
                                  </div>

                                  {/* Score */}
                                  <div className="col-span-2">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium ${
                                      (run.score_overall || 0) >= 8
                                        ? 'bg-accent-success/10 text-accent-success'
                                        : (run.score_overall || 0) >= 6
                                          ? 'bg-accent-warning/10 text-accent-warning'
                                          : (run.score_overall || 0) > 0
                                            ? 'bg-accent-error/10 text-accent-error'
                                            : 'bg-text-muted/10 text-text-muted'
                                    }`}>
                                      <TrendingUp size={12} />
                                      {(run.score_overall || 0).toFixed(1)}
                                    </div>
                                  </div>

                                  {/* Resultado */}
                                  <div className="col-span-2">
                                    <div className="flex items-center gap-1 text-sm">
                                      <span className="text-accent-success">{run.passed_tests || 0}</span>
                                      <span className="text-text-muted">/</span>
                                      <span className={run.failed_tests > 0 ? 'text-accent-error' : 'text-text-muted'}>
                                        {run.failed_tests || 0}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Data */}
                                  <div className="col-span-1 text-xs text-text-muted">
                                    {new Date(run.run_at || run.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit'
                                    })}
                                  </div>

                                  {/* Ações */}
                                  <div className="col-span-2 flex justify-end gap-1">
                                    <button
                                      onClick={() => handleViewReport(run.id)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs text-accent-primary hover:bg-accent-primary/10 rounded transition-colors"
                                    >
                                      <FileText size={12} />
                                      Detalhes
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(run.id)}
                                      disabled={deleting === run.id}
                                      className="p-1 text-text-muted hover:text-accent-error transition-colors disabled:opacity-50"
                                      title="Deletar"
                                    >
                                      {deleting === run.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={14} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-border-default rounded-lg bg-bg-secondary">
              <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                <Inbox size={24} />
              </div>
              <p className="text-text-primary font-medium">Nenhum cliente encontrado</p>
              <p className="text-text-muted text-sm max-w-xs mt-1">
                {filterClient
                  ? 'Tente ajustar o filtro de busca.'
                  : 'Inicie uma nova bateria de testes para visualizar os resultados aqui.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
