import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentVersion } from '../../types';

export interface ApprovalRequest extends AgentVersion {
  agent_name?: string;
  agent_slug?: string;
}

export const usePendingApprovals = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      // Fetch versions with status 'pending_approval'
      // Note: Make sure to insert data with this status or update schema if needed
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
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveVersion = async (id: string) => {
    const { error } = await supabase
      .from('agent_versions')
      .update({ status: 'production' })
      .eq('id', id);
    
    if (!error) {
      setApprovals(prev => prev.filter(a => a.id !== id));
    }
    return { error };
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

  return { approvals, loading, approveVersion, rejectVersion, refetch: fetchApprovals };
};
