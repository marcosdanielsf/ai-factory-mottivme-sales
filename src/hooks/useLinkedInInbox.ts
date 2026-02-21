import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { prospectorApi } from '../lib/prospector-api';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type ConversationFilter = 'all' | 'unanswered' | 'starred' | 'ai_pending';

export type ConversationTemperature = 'hot' | 'warm' | 'cold' | 'dead';

export interface LPConversation {
  id: string;
  account_id: string;
  lead_name: string;
  lead_headline?: string;
  lead_company?: string;
  lead_avatar_url?: string;
  lead_linkedin_url?: string;
  linkedin_thread_id?: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  is_starred: boolean;
  ai_pending: boolean;
  ai_suggested_response?: string;
  ai_score?: number;
  ai_temperature?: ConversationTemperature;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface LPMessage {
  id: string;
  conversation_id: string;
  sender: 'me' | 'lead';
  content: string;
  sent_at: string;
  is_ai_generated: boolean;
  ai_score?: number;
  ai_temperature?: ConversationTemperature;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK: useLinkedInInbox
// ═══════════════════════════════════════════════════════════════════════

export const useLinkedInInbox = () => {
  const [conversations, setConversations] = useState<LPConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch all conversations ordered by last_message_at DESC
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('lp_conversations')
        .select('id,linkedin_conversation_id,lead_id,participant_urn,participant_name,participant_public_id,participant_headline,last_message,last_message_at,last_message_preview,unread,unread_count,is_starred,ai_pending,ai_suggested_response,ai_score,ai_temperature,ai_classification,tags,total_messages,account_id,created_at,updated_at')
        .order('last_message_at', { ascending: false });

      if (queryError) throw queryError;

      // Map DB fields to frontend interface
      const mapped: LPConversation[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        account_id: (row.account_id as string) || '',
        lead_name: (row.participant_name as string) || (row.lead_name as string) || 'Unknown',
        lead_headline: row.participant_headline as string | undefined,
        lead_company: undefined,
        lead_avatar_url: undefined,
        lead_linkedin_url: row.participant_public_id
          ? `https://linkedin.com/in/${row.participant_public_id}`
          : undefined,
        linkedin_thread_id: row.linkedin_conversation_id as string | undefined,
        last_message_at: (row.last_message_at as string) || (row.created_at as string),
        last_message_preview: (row.last_message_preview as string) || (row.last_message as string) || '',
        unread_count: (row.unread_count as number) || (row.unread ? 1 : 0),
        is_starred: (row.is_starred as boolean) || false,
        ai_pending: (row.ai_pending as boolean) || false,
        ai_suggested_response: row.ai_suggested_response as string | undefined,
        ai_score: row.ai_score as number | undefined,
        ai_temperature: (row.ai_temperature as ConversationTemperature) || undefined,
        tags: (row.tags as string[]) || [],
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      }));

      setConversations(mapped);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar conversas';
      setError(message);
      console.error('Error in fetchConversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger LinkedIn inbox sync via backend
  const syncInbox = useCallback(async (accountId?: string) => {
    try {
      setSyncing(true);
      const id = accountId || 'default';
      await prospectorApi.getConversations(id);
      await fetchConversations();
    } catch (err: unknown) {
      console.error('Error syncing inbox:', err);
    } finally {
      setSyncing(false);
    }
  }, [fetchConversations]);

  // Toggle starred status for a conversation
  const toggleStar = useCallback(async (conversationId: string, current: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('lp_conversations')
        .update({ is_starred: !current, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, is_starred: !current } : c)
      );
    } catch (err: unknown) {
      console.error('Error toggling star:', err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    syncing,
    refetch: fetchConversations,
    syncInbox,
    toggleStar,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// HOOK: useConversationMessages
// ═══════════════════════════════════════════════════════════════════════

export const useConversationMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<LPMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const fetchMessages = useCallback(async (id: string) => {
    try {
      setLoading(true);

      // Mark conversation as read
      await supabase
        .from('lp_conversations')
        .update({ unread_count: 0, unread: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      // Try by UUID first, fallback to linkedin_conversation_id
      let { data, error: queryError } = await supabase
        .from('lp_messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;

      // Map DB fields to frontend interface
      const mapped: LPMessage[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        conversation_id: row.conversation_id as string,
        sender: (row.is_from_me ? 'me' : 'lead') as 'me' | 'lead',
        content: (row.text as string) || '',
        sent_at: (row.created_at as string) || new Date().toISOString(),
        is_ai_generated: (row.ai_generated as boolean) || false,
        ai_score: undefined,
        ai_temperature: undefined,
        created_at: row.created_at as string,
      }));

      setMessages(mapped);
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message via backend API
  const sendMessage = useCallback(async (conversationId: string, text: string, accountId?: string): Promise<boolean> => {
    try {
      setSending(true);
      const id = accountId || 'default';
      await prospectorApi.sendMessage(id, {
        conversation_id: conversationId,
        text,
      });

      // Optimistic local update
      const newMsg: LPMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender: 'me',
        content: text,
        sent_at: new Date().toISOString(),
        is_ai_generated: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);

      // Update conversation preview in Supabase
      await supabase
        .from('lp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: text.slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return true;
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  // Generate AI response for a conversation
  const generateAIResponse = useCallback(async (conversationId: string): Promise<string | null> => {
    try {
      setGeneratingAI(true);
      const API_BASE = import.meta.env.VITE_PROSPECTOR_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/ai/generate-response/${conversationId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('AI generation failed');
      const data = await response.json();
      return data.response || null;
    } catch (err: unknown) {
      console.error('Error generating AI response:', err);
      return null;
    } finally {
      setGeneratingAI(false);
    }
  }, []);

  // Classify conversation via AI
  const classifyConversation = useCallback(async (id: string) => {
    try {
      const API_BASE = import.meta.env.VITE_PROSPECTOR_API_URL || 'http://localhost:8000';
      await fetch(`${API_BASE}/api/ai/classify/${id}`, { method: 'POST' });
    } catch (err: unknown) {
      console.error('Error classifying conversation:', err);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    sending,
    generatingAI,
    sendMessage,
    generateAIResponse,
    classifyConversation,
    refetch: conversationId ? () => fetchMessages(conversationId) : () => Promise.resolve(),
  };
};
