import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentVersion, PendingApproval } from '../types';

export interface ApprovalRequest extends AgentVersion {
  agent_name?: string;
  agent_slug?: string;
}

export const usePendingApprovals = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);

      // Tentar usar a View otimizada vw_pending_approvals
      const { data: viewData, error: viewError } = await supabase
        .from('vw_pending_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewError) {
        console.warn('View vw_pending_approvals não encontrada, usando fallback:', viewError);

        // Fallback: query direta (mantendo compatibilidade)
        const { data, error } = await supabase
          .from('agent_versions')
          .select(`
            *,
            agents (name, slug)
          `)
          .eq('status', 'pending_approval')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map((item: any) => ({
          ...item,
          agent_name: item.agents?.name,
          agent_slug: item.agents?.slug
        }));

        setApprovals(formatted);
        setError(null);
        return;
      }

      // Usar dados da View otimizada
      const formattedFromView = (viewData || []).map((item: PendingApproval) => ({
        id: item.version_id,
        agent_id: item.agent_id,
        version_number: item.version_number,
        status: item.status as 'production' | 'sandbox' | 'archived' | 'draft' | 'pending_approval',
        created_at: item.created_at,
        change_log: item.description,
        agent_name: item.agent_name,
        agent_slug: item.agent_slug,
        // Campos opcionais
        system_prompt: '', // Não vem da view
        parent_version_id: undefined,
      }));

      setApprovals(formattedFromView as ApprovalRequest[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching approvals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveVersion = async (id: string, agentId?: string) => {
    try {
      // 1. Atualizar a versão para 'production'
      const { error: updateError } = await supabase
        .from('agent_versions')
        .update({ 
          status: 'production',
          deployed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;

      // 2. Se tivermos o agentId, atualizar o agente para apontar para esta nova versão
      if (agentId) {
        const { error: agentError } = await supabase
          .from('agents')
          .update({ current_version_id: id })
          .eq('id', agentId);
        
        if (agentError) throw agentError;
      }
      
      setApprovals(prev => prev.filter(a => a.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error approving version:', err);
      return { error: err };
    }
  };

  const rejectVersion = async (id: string) => {
    const { error } = await supabase
      .from('agent_versions')
      .update({ status: 'draft' }) // Back to draft
      .eq('id', id);

    if (!error) {
      setApprovals(prev => prev.filter(a => a.id !== id));
    }
    return { error };
  };

  return { approvals, loading, error, approveVersion, rejectVersion, refetch: fetchApprovals };
};
