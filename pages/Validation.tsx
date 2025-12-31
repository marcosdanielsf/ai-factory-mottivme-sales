import React from 'react';
import { MOCK_TEST_RUNS, MOCK_AGENT_VERSIONS } from '../constants';
import { Play, CheckCircle, XCircle, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

export const Validation = () => {
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
        
        <button className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary hover:bg-white/90 rounded text-sm font-medium transition-colors">
          <Play size={16} />
          Rodar Nova Bateria de Testes
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Versão em Produção</div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-text-primary">v2.1</span>
            <span className="px-2 py-1 rounded-full bg-accent-success/10 text-accent-success text-xs border border-accent-success/20">Aprovada (98%)</span>
          </div>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Versão em Staging</div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-text-primary">v2.2-beta</span>
            <span className="px-2 py-1 rounded-full bg-accent-error/10 text-accent-error text-xs border border-accent-error/20">Falha (65%)</span>
          </div>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Cobertura de Testes</div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-text-primary">25 Cenários</span>
            <span className="text-xs text-text-muted">Core Business Logic</span>
          </div>
        </div>
      </div>

      {/* Runs List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Histórico de Execuções</h2>
        
        <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden">
           <div className="grid grid-cols-12 gap-4 p-3 border-b border-border-default bg-bg-tertiary text-xs font-semibold text-text-muted uppercase tracking-wider">
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Versão</div>
              <div className="col-span-3">Data/Hora</div>
              <div className="col-span-3">Resultados</div>
              <div className="col-span-2 text-right">Relatório</div>
           </div>

           {MOCK_TEST_RUNS.map(run => (
             <div key={run.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-bg-tertiary transition-colors border-b border-border-default last:border-0">
                <div className="col-span-2">
                   {run.passed_tests === run.total_tests ? (
                     <div className="flex items-center gap-2 text-accent-success">
                       <CheckCircle size={16} />
                       <span className="text-sm font-medium">Passou</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-accent-error">
                       <XCircle size={16} />
                       <span className="text-sm font-medium">Falhou</span>
                     </div>
                   )}
                </div>
                
                <div className="col-span-2">
                  <span className="font-mono text-sm bg-bg-tertiary px-2 py-1 rounded border border-border-default">{run.version_id}</span>
                </div>
                
                <div className="col-span-3 text-sm text-text-secondary">
                   {new Date(run.run_at).toLocaleString()}
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
                   <button className="flex items-center gap-1.5 text-xs text-accent-primary hover:underline">
                     <FileText size={14} />
                     Ver HTML
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};