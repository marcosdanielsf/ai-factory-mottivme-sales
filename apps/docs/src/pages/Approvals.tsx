import React, { useState, useMemo } from 'react';
import { usePendingApprovals } from '../hooks';
import { useToast } from '../hooks/useToast';
import { Check, X, GitCommit, ChevronRight, RefreshCw, AlertCircle, Search } from 'lucide-react';

export const Approvals = () => {
  const { showToast } = useToast();
  const { approvals, loading, error, approveVersion, rejectVersion, refetch } = usePendingApprovals();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApprovals = useMemo(() => {
    if (!searchTerm) return approvals;
    const term = searchTerm.toLowerCase();
    return approvals.filter(req => 
      (req.agent_name || '').toLowerCase().includes(term) ||
      (req.version_number || '').toLowerCase().includes(term) ||
      (req.change_log || '').toLowerCase().includes(term)
    );
  }, [approvals, searchTerm]);

  const handleApprove = async (id: string, agentId: string) => {
    const { error } = await approveVersion(id, agentId);
    if (!error) {
      showToast('Versão aprovada com sucesso!', 'success');
    } else {
      showToast('Erro ao aprovar versão', 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm('Tem certeza que deseja rejeitar esta versão?')) {
      const { error } = await rejectVersion(id);
      if (!error) {
        showToast('Versão rejeitada', 'info');
      } else {
        showToast('Erro ao rejeitar versão', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="h-8 bg-bg-secondary animate-pulse rounded w-1/3"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-5 h-40 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center text-accent-error mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar aprovações</h2>
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

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-warning/10 text-accent-warning rounded-lg">
            <GitCommit size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Aprovações Pendentes</h1>
            <p className="text-sm text-text-muted">Revise e aprove alterações de prompts e configurações.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              refetch();
              showToast('Aprovações atualizadas', 'info');
            }}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
            title="Atualizar aprovações"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text"
              placeholder="Buscar aprovações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>
          <span className="text-xs font-bold text-text-muted bg-bg-secondary px-3 py-1.5 rounded-full border border-border-default uppercase tracking-widest shrink-0">
            {approvals.length} pendentes
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {filteredApprovals.map(req => (
          <div key={req.id} className="bg-bg-secondary border border-border-default rounded-xl p-6 flex gap-6 hover:border-accent-primary/30 transition-all group">
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-text-primary">{req.agent_name || 'Agente Desconhecido'}</h3>
                    <span className="px-2 py-0.5 bg-bg-tertiary border border-border-default rounded text-[10px] font-mono text-text-secondary">
                      {req.version_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <GitCommit size={12} />
                      Prompt Update
                    </span>
                    <span>•</span>
                    <span>Criado em {new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleReject(req.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-accent-error hover:bg-accent-error/10 rounded-lg transition-colors border border-transparent hover:border-accent-error/20"
                   >
                    <X size={16} />
                    Rejeitar
                  </button>
                  <button 
                    onClick={() => handleApprove(req.id, req.agent_id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-accent-primary text-white hover:bg-accent-primary/90 rounded-lg transition-all shadow-md shadow-accent-primary/20 active:scale-95"
                  >
                    <Check size={16} />
                    Aprovar
                  </button>
                </div>
              </div>
              
              <div className="bg-bg-tertiary rounded-lg p-4 text-sm font-mono text-text-secondary border border-border-default whitespace-pre-wrap leading-relaxed">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Changelog</p>
                {req.change_log || 'Sem resumo de alterações disponível.'}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <button className="text-[10px] font-bold text-accent-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
                  Ver Diff Completo
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredApprovals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-bg-secondary rounded-2xl border border-dashed border-border-default text-center">
            <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
              {searchTerm ? <Search size={32} className="opacity-20" /> : <Check size={32} />}
            </div>
            <h3 className="text-lg font-bold text-text-primary">
              {searchTerm ? 'Nenhuma aprovação encontrada' : 'Tudo em dia!'}
            </h3>
            <p className="text-sm text-text-muted max-w-xs mt-1">
              {searchTerm ? `Não encontramos aprovações para "${searchTerm}"` : 'Não há nenhuma versão aguardando aprovação no momento.'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-xs text-accent-primary hover:underline"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};