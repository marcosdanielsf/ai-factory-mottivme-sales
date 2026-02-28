import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSplitMessages, SplitConfig } from './useSplitMessages';

export interface SandboxMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokenEstimate?: number;
}

export interface SandboxSession {
  id: string;
  session_name: string;
  mode: string;
  created_at: string;
  message_count?: number;
}

const AGENT_MODES = [
  'sdr_inbound',
  'social_seller_instagram',
  'followuper',
  'concierge',
  'scheduler',
  'rescheduler',
  'objection_handler',
  'reativador_base',
  'customersuccess',
] as const;

export type AgentMode = typeof AGENT_MODES[number];

export { AGENT_MODES };

interface UseSandboxChatProps {
  agentVersionId: string;
  locationId: string;
}

export function useSandboxChat({ agentVersionId, locationId }: UseSandboxChatProps) {
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AgentMode>('sdr_inbound');
  const [totalTokens, setTotalTokens] = useState(0);
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const { splitMessage } = useSplitMessages();

  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  const buildSystemPrompt = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase
      .from('agent_versions')
      .select('system_prompt, prompts_by_mode, split_config')
      .eq('id', agentVersionId)
      .single();

    if (error || !data) return 'Você é um assistente de vendas prestativo.';

    const base = data.system_prompt || '';
    const modePrompt = data.prompts_by_mode?.[currentMode] || '';

    return modePrompt ? `${base}\n\n---\nMODO ATIVO: ${currentMode}\n${modePrompt}` : base;
  }, [agentVersionId, currentMode]);

  const getSplitConfig = useCallback(async (): Promise<SplitConfig> => {
    const { data } = await supabase
      .from('agent_versions')
      .select('split_config')
      .eq('id', agentVersionId)
      .single();

    return data?.split_config ?? { enabled: true, max_chars: 300, delay_ms: 1500 };
  }, [agentVersionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: SandboxMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      tokenEstimate: estimateTokens(content),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const systemPrompt = await buildSystemPrompt();
      const splitConfig = await getSplitConfig();

      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: content.trim() },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.choices?.[0]?.message?.content || '';
      const tokenCount = estimateTokens(assistantText);

      const parts = splitMessage(assistantText, splitConfig);

      // Add messages with animated delay
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i > 0 && part.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, part.delayMs));
        }
        const assistantMsg: SandboxMessage = {
          role: 'assistant',
          content: part.text,
          timestamp: new Date().toISOString(),
          tokenEstimate: Math.ceil(tokenCount / parts.length),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }

      setTotalTokens(prev => prev + estimateTokens(content) + tokenCount);
    } catch (err: any) {
      const errorMsg: SandboxMessage = {
        role: 'system',
        content: `Erro: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, buildSystemPrompt, getSplitConfig, splitMessage]);

  const saveSession = useCallback(async (sessionName?: string) => {
    const name = sessionName || `Teste ${new Date().toLocaleString('pt-BR')}`;

    const payload = {
      agent_version_id: agentVersionId,
      location_id: locationId,
      session_name: name,
      mode: currentMode,
      messages: messages as unknown as Record<string, unknown>[],
      metadata: { total_tokens: totalTokens },
      updated_at: new Date().toISOString(),
    };

    if (sessionId) {
      const { error } = await supabase
        .from('sandbox_sessions')
        .update(payload)
        .eq('id', sessionId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('sandbox_sessions')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      setSessionId(data.id);
    }
  }, [agentVersionId, locationId, currentMode, messages, totalTokens, sessionId]);

  const loadSession = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('sandbox_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return;

    setSessionId(data.id);
    setCurrentMode(data.mode as AgentMode);
    setMessages((data.messages as unknown as SandboxMessage[]) || []);
    setTotalTokens(data.metadata?.total_tokens || 0);
  }, []);

  const listSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('sandbox_sessions')
      .select('id, session_name, mode, created_at')
      .eq('agent_version_id', agentVersionId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return;
    setSessions(data as SandboxSession[]);
  }, [agentVersionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setTotalTokens(0);
  }, []);

  const setMode = useCallback((mode: AgentMode) => {
    setCurrentMode(mode);
  }, []);

  return {
    messages,
    loading,
    sessionId,
    currentMode,
    totalTokens,
    sessions,
    sendMessage,
    saveSession,
    loadSession,
    listSessions,
    clearMessages,
    setMode,
  };
}
