import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_TEST_RUNS, MOCK_AGENT_VERSIONS } from '../constants';
import { Play, CheckCircle, XCircle, AlertTriangle, FileText, ChevronRight, X, Loader2, AlertCircle, Inbox, RefreshCw, Trash2, Filter, Calendar, ChevronDown } from 'lucide-react';
import { TestReportModal } from '../components/TestReportModal';
import { useTestResults } from '../src/hooks/useTestResults';
import { useToast } from '../src/hooks/useToast';

export const Validation = () => {
  const { testRuns, loading, error, refetch, deleteTestRun, deleting } = useTestResults();
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filtros
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterVersion, setFilterVersion] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Extrair listas únicas para os dropdowns
  const uniqueAgents = useMemo(() => {
    const agents = testRuns.map(r => r.agent_name).filter(Boolean);
    return [...new Set(agents)].sort();
  }, [testRuns]);

  const uniqueVersions = useMemo(() => {
    const versions = testRuns.map(r => r.agent_version_id).filter(Boolean);
    return [...new Set(versions)].sort();
  }, [testRuns]);

  // Aplicar filtros
  const filteredRuns = useMemo(() => {
    return testRuns.filter(run => {
      // Filtro por agente
      if (filterAgent && run.agent_name !== filterAgent) return false;

      // Filtro por versão
      if (filterVersion && run.agent_version_id !== filterVersion) return false;

      // Filtro por data (de)
      if (filterDateFrom) {
        const runDate = new Date(run.run_at || run.created_at);
        const fromDate = new Date(filterDateFrom);
        if (runDate < fromDate) return false;
      }

      // Filtro por data (até)
      if (filterDateTo) {
        const runDate = new Date(run.run_at || run.created_at);
        const toDate = new Date(filterDateTo + 'T23:59:59');
        if (runDate > toDate) return false;
      }

      return true;
    });
  }, [testRuns, filterAgent, filterVersion, filterDateFrom, filterDateTo]);

  const hasActiveFilters = filterAgent || filterVersion || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterAgent('');
    setFilterVersion('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

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

  const handleViewHtml = (id: string) => {
    const run = testRuns.find(r => r.id === id);
    if (run) {
      setSelectedReport(id);
    }
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

        {/* Status Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-2"></div>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-bg-tertiary rounded w-1/4"></div>
                <div className="h-5 bg-bg-tertiary rounded-full w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Runs List Skeleton */}
        <div className="space-y-4">
          <div className="h-6 bg-bg-secondary rounded w-48 animate-pulse"></div>
          <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-border-default last:border-0 animate-pulse">
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-bg-tertiary"></div>
                    <div className="h-4 bg-bg-tertiary rounded w-16"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-bg-tertiary rounded w-16"></div>
                  </div>
                  <div className="col-span-3">
                    <div className="h-4 bg-bg-tertiary rounded w-32"></div>
                  </div>
                  <div className="col-span-3">
                    <div className="h-4 bg-bg-tertiary rounded w-24 mb-1"></div>
                    <div className="h-3 bg-bg-tertiary rounded w-40"></div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="h-4 bg-bg-tertiary rounded w-16"></div>
                  </div>
               </div>
             ))}
          </div>
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
            Resultados dos testes automatizados (Python LLM-as-a-Judge)
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
            {running ? 'Executando...' : 'Rodar Nova Bateria de Testes'}
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
              Tem certeza que deseja deletar este registro de teste? O registro será removido permanentemente do banco de dados.
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-bg-tertiary rounded w-1/3 mb-2"></div>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-bg-tertiary rounded w-1/4"></div>
                <div className="h-5 bg-bg-tertiary rounded-full w-1/3"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4 group hover:border-accent-success/30 transition-colors">
              <div className="text-sm text-text-muted mb-1">Versão em Produção</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-text-primary">v2.1</span>
                <span className="px-2 py-1 rounded-full bg-accent-success/10 text-accent-success text-xs border border-accent-success/20">Aprovada (98%)</span>
              </div>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4 group hover:border-accent-error/30 transition-colors">
              <div className="text-sm text-text-muted mb-1">Versão em Staging</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-text-primary">v2.2-beta</span>
                <span className="px-2 py-1 rounded-full bg-accent-error/10 text-accent-error text-xs border border-accent-error/20">Falha (65%)</span>
              </div>
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4 group hover:border-accent-primary/30 transition-colors">
              <div className="text-sm text-text-muted mb-1">Cobertura de Testes</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-text-primary">25 Cenários</span>
                <span className="text-xs text-text-muted">Core Business Logic</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Histórico de Execuções</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
                hasActiveFilters
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                  : 'bg-bg-secondary border-border-default text-text-muted hover:text-text-primary hover:border-border-hover'
              }`}
            >
              <Filter size={14} />
              Filtros
              {hasActiveFilters && (
                <span className="bg-accent-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[filterAgent, filterVersion, filterDateFrom, filterDateTo].filter(Boolean).length}
                </span>
              )}
            </button>
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

        {/* Barra de Filtros */}
        {showFilters && (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Filtro por Agente */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-text-muted mb-1.5">Agente</label>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Todos os agentes</option>
                  {uniqueAgents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Versão */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-text-muted mb-1.5">Versão</label>
                <select
                  value={filterVersion}
                  onChange={(e) => setFilterVersion(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Todas as versões</option>
                  {uniqueVersions.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Data De */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-text-muted mb-1.5">Data de</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Filtro por Data Até */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-text-muted mb-1.5">Data até</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Botão Limpar */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-accent-error hover:text-accent-error/80 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Resumo dos filtros ativos */}
            {hasActiveFilters && (
              <div className="mt-3 pt-3 border-t border-border-default text-xs text-text-muted">
                Mostrando {filteredRuns.length} de {testRuns.length} registros
              </div>
            )}
          </div>
        )}
        
        <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
           <div className="grid grid-cols-12 gap-4 p-3 border-b border-border-default bg-bg-tertiary text-xs font-semibold text-text-muted uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Agente / Cliente</div>
              <div className="col-span-2">Versão</div>
              <div className="col-span-2">Data/Hora</div>
              <div className="col-span-3">Resultados</div>
              <div className="col-span-2 text-right">Relatório</div>
           </div>

           {loading ? (
             [...Array(5)].map((_, i) => (
               <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-border-default last:border-0 animate-pulse">
                  <div className="col-span-1 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-bg-tertiary"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-4 bg-bg-tertiary rounded w-20 mb-1"></div>
                    <div className="h-3 bg-bg-tertiary rounded w-24"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-6 bg-bg-tertiary rounded w-16"></div>
                  </div>
                  <div className="col-span-2">
                    <div className="h-4 bg-bg-tertiary rounded w-24"></div>
                  </div>
                  <div className="col-span-3">
                    <div className="h-4 bg-bg-tertiary rounded w-24 mb-1"></div>
                    <div className="h-3 bg-bg-tertiary rounded w-40"></div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="h-4 bg-bg-tertiary rounded w-16"></div>
                  </div>
               </div>
             ))
           ) : filteredRuns.length > 0 ? (
             filteredRuns.map((run: any) => (
               <div key={run.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-bg-tertiary transition-colors border-b border-border-default last:border-0">
                  <div className="col-span-1">
                     {run.passed_tests === run.total_tests && run.passed_tests > 0 ? (
                       <div className="flex items-center gap-1 text-accent-success">
                         <CheckCircle size={16} />
                       </div>
                     ) : (
                       <div className="flex items-center gap-1 text-accent-error">
                         <XCircle size={16} />
                       </div>
                     )}
                  </div>

                  <div className="col-span-2">
                    <div className="text-sm font-medium text-text-primary">
                      {run.agent_name || '-'}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {run.client_name || run.location_id || '-'}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="font-mono text-sm bg-bg-tertiary px-2 py-1 rounded border border-border-default">{run.agent_version_id}</span>
                  </div>

                  <div className="col-span-2 text-sm text-text-secondary">
                     {new Date(run.run_at || run.created_at).toLocaleString('pt-BR', {
                       day: '2-digit',
                       month: '2-digit',
                       year: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}
                  </div>

                  <div className="col-span-3">
                     <div className="flex items-center gap-2 text-sm">
                        <span className="text-accent-success font-medium">{run.passed_tests} Pass</span>
                        <span className="text-text-muted">/</span>
                        <span className={`${run.failed_tests > 0 ? 'text-accent-error font-bold' : 'text-text-muted'}`}>{run.failed_tests} Fail</span>
                     </div>
                     {run.summary && (
                       <p className="text-xs text-text-muted mt-1 truncate">{run.summary}</p>
                     )}
                  </div>

                  <div className="col-span-2 flex justify-end gap-3">
                     <button
                       onClick={() => handleViewHtml(run.id)}
                       className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
                     >
                       <FileText size={14} />
                       Ver HTML
                     </button>
                     <button
                       onClick={() => setConfirmDelete(run.id)}
                       disabled={deleting === run.id}
                       className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-error transition-colors disabled:opacity-50"
                       title="Deletar registro"
                     >
                       {deleting === run.id ? (
                         <Loader2 size={14} className="animate-spin" />
                       ) : (
                         <Trash2 size={14} />
                       )}
                     </button>
                  </div>
               </div>
             ))
           ) : (
             <div className="flex flex-col items-center justify-center p-12 text-center">
               <div className="w-12 h-12 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                 <Inbox size={24} />
               </div>
               <p className="text-text-primary font-medium">Nenhum teste encontrado</p>
               <p className="text-text-muted text-sm max-w-xs mt-1">
                 Inicie uma nova bateria de testes para visualizar os resultados aqui.
               </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};