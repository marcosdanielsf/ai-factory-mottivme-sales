import React, { useState, useEffect } from 'react';
import { MOCK_TEST_RUNS, MOCK_AGENT_VERSIONS } from '../constants';
import { Play, CheckCircle, XCircle, AlertTriangle, FileText, ChevronRight, X, Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { TestReportModal } from '../components/TestReportModal';
import { useTestResults } from '../src/hooks/useTestResults';
import { useToast } from '../src/hooks/useToast';

export const Validation = () => {
  const { testRuns, loading, error, refetch } = useTestResults();
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

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
           ) : testRuns.length > 0 ? (
             testRuns.map((run: any) => (
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

                  <div className="col-span-2 flex justify-end">
                     <button
                       onClick={() => handleViewHtml(run.id)}
                       className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
                     >
                       <FileText size={14} />
                       Ver HTML
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