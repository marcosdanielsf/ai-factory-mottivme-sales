import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { JarvisConversation, JarvisDbMessage } from '../types/jarvis';

interface UseJarvisConversationsReturn {
  conversations: JarvisConversation[];
  messages: JarvisDbMessage[];
  loading: boolean;
  error: string | null;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (title: string, project_slug?: string | null) => Promise<JarvisConversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  saveMessage: (
    conversationId: string,
    role: JarvisDbMessage['role'],
    content: string,
    metadata?: {
      tokens_used?: number;
      cost?: number;
      model?: string;
      intent?: string;
      project_slug?: string | null;
    }
  ) => Promise<JarvisDbMessage | null>;
}

export function useJarvisConversations(): UseJarvisConversationsReturn {
  const [conversations, setConversations] = useState<JarvisConversation[]>([]);
  const [messages, setMessages] = useState<JarvisDbMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('jarvis_conversations')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (err) throw err;
        setConversations(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar conversas');
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('jarvis_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setMessages(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (
    title: string,
    project_slug: string | null = null
  ): Promise<JarvisConversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: err } = await supabase
        .from('jarvis_conversations')
        .insert({ title, project_slug, user_id: user.id, metadata: {} })
        .select()
        .single();

      if (err) throw err;
      setConversations(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar conversa');
      return null;
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase
        .from('jarvis_conversations')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao deletar conversa');
    }
  }, []);

  const saveMessage = useCallback(async (
    conversationId: string,
    role: JarvisDbMessage['role'],
    content: string,
    metadata: {
      tokens_used?: number;
      cost?: number;
      model?: string;
      intent?: string;
      project_slug?: string | null;
    } = {}
  ): Promise<JarvisDbMessage | null> => {
    try {
      const { data, error: err } = await supabase
        .from('jarvis_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          tokens_used: metadata.tokens_used ?? 0,
          cost: metadata.cost ?? 0,
          model: metadata.model ?? null,
          intent: metadata.intent ?? null,
          project_slug: metadata.project_slug ?? null,
          metadata: {},
        })
        .select()
        .single();

      if (err) throw err;

      // Atualizar updated_at da conversa
      await supabase
        .from('jarvis_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      setMessages(prev => [...prev, data]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar mensagem');
      return null;
    }
  }, []);

  return {
    conversations,
    messages,
    loading,
    error,
    loadConversation,
    createConversation,
    deleteConversation,
    saveMessage,
  };
}
