import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { BuilderCanvas, type AgentFlow } from '../../components/builder/BuilderCanvas';

interface AgentVersionBasic {
  id: string;
  agent_name: string;
  version: string;
  version_number: string;
  agent_flow: AgentFlow | null;
}

export const AgentBuilder: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<AgentVersionBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchVersion = async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('agent_versions')
          .select('id, agent_name, version, version_number, agent_flow')
          .eq('id', agentId)
          .single();

        if (err) throw new Error(err.message);
        setVersion(data as AgentVersionBasic);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, [agentId]);

  const handleSave = useCallback(async (flow: AgentFlow) => {
    if (!agentId) return;

    const { error: err } = await supabase
      .from('agent_versions')
      .update({ agent_flow: flow, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (err) throw new Error(err.message);

    setVersion(prev => prev ? { ...prev, agent_flow: flow } : null);
  }, [agentId]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900">
        <Loader2 size={24} className="text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-900 gap-3">
        <p className="text-sm text-red-400">{error || 'Agente nao encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-white">Agent Builder</h1>
          <p className="text-[11px] text-zinc-500">
            {version.agent_name || 'Sem nome'} — {version.version_number || version.version}
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <BuilderCanvas
          initialFlow={version.agent_flow}
          onSave={handleSave}
          agentName={version.agent_name}
        />
      </div>
    </div>
  );
};

export default AgentBuilder;
