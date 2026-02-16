import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, ExternalLink, RefreshCw, MessageCircle } from 'lucide-react';
import type { CriativoLead } from '../../../hooks/useCriativoPerformance';
import { useConversationMessages } from '../../../hooks/useConversationMessages';
import { MessageBubble } from '../../../components/supervision/MessageBubble';
import { supabase } from '../../../lib/supabase';
import { formatPhone } from '../helpers';
import { getLeadStage } from '../constants';

interface LeadChatModalProps {
  lead: CriativoLead | null;
  onClose: () => void;
  locationId: string | null;
}

export const LeadChatModal: React.FC<LeadChatModalProps> = ({ lead, onClose, locationId }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const { messages, loading: messagesLoading } = useConversationMessages(sessionId);

  useEffect(() => {
    if (!lead) {
      setSessionId(null);
      setLookupDone(false);
      return;
    }

    if (lead.unique_id) {
      console.log('[LeadChatModal] Using unique_id as session_id:', lead.unique_id);
      setSessionId(lead.unique_id);
      setLookupDone(true);
      return;
    }

    const rawLead = lead as any;
    if (rawLead.session_id) {
      console.log('[LeadChatModal] Using raw session_id:', rawLead.session_id);
      setSessionId(rawLead.session_id);
      setLookupDone(true);
      return;
    }

    const lookup = async () => {
      setLookupLoading(true);
      setLookupDone(false);
      try {
        if (lead.phone) {
          const cleanPhone = lead.phone.replace(/\D/g, '');
          const phoneVariants = [
            lead.phone,
            '+' + cleanPhone,
            cleanPhone,
          ];
          if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            phoneVariants.push('+' + cleanPhone.slice(2));
            phoneVariants.push(cleanPhone.slice(2));
          }
          if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
            phoneVariants.push('+55' + cleanPhone);
            phoneVariants.push('55' + cleanPhone);
          }

          for (const phone of phoneVariants) {
            const { data, error } = await supabase
              .from('vw_supervision_conversations_v2')
              .select('session_id')
              .eq('contact_phone', phone)
              .not('session_id', 'is', null)
              .limit(1);
            if (!error && data && data.length > 0 && data[0].session_id) {
              setSessionId(data[0].session_id);
              return;
            }
          }

          for (const phone of [cleanPhone, cleanPhone.slice(-9)]) {
            const { data, error } = await supabase
              .from('vw_supervision_conversations_v2')
              .select('session_id')
              .ilike('contact_phone', `%${phone}%`)
              .not('session_id', 'is', null)
              .limit(1);
            if (!error && data && data.length > 0 && data[0].session_id) {
              setSessionId(data[0].session_id);
              return;
            }
          }
        }

        if (lead.first_name && lead.first_name.length > 2) {
          const { data, error } = await supabase
            .from('vw_supervision_conversations_v2')
            .select('session_id')
            .ilike('contact_name', `%${lead.first_name}%`)
            .not('session_id', 'is', null)
            .order('last_message_at', { ascending: false })
            .limit(1);
          if (!error && data && data.length > 0 && data[0].session_id) {
            setSessionId(data[0].session_id);
            return;
          }
        }

        setSessionId(null);
      } catch (err) {
        console.error('[LeadChatModal] Lookup error:', err);
        setSessionId(null);
      } finally {
        setLookupLoading(false);
        setLookupDone(true);
      }
    };

    lookup();
  }, [lead?.id]);

  if (!lead) return null;

  const stage = getLeadStage(lead);
  const isLoading = lookupLoading || messagesLoading;
  const ghlUrl = locationId && lead.contact_id
    ? `https://app.gohighlevel.com/v2/location/${locationId}/contacts/${lead.contact_id}`
    : null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/70 z-[9998]" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 z-[9999] flex flex-col bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border-default bg-bg-tertiary">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-accent-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{lead.first_name || 'Sem nome'}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>{stage.label}</span>
                {lead.phone && <span className="text-xs text-text-muted">{formatPhone(lead.phone)}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ghlUrl && (
              <button
                onClick={() => window.open(ghlUrl, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs rounded-lg transition-colors"
              >
                <ExternalLink size={14} />
                Abrir no CRM
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors">
              <X size={18} className="text-text-muted" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw size={24} className="animate-spin text-text-muted" />
            </div>
          ) : lookupDone && !sessionId ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <MessageCircle size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Nenhuma conversa encontrada para este lead</p>
              <p className="text-xs mt-1">O historico aparece quando o lead tem mensagens registradas</p>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <MessageCircle size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Conversa sem mensagens</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg) => (
                <MessageBubble key={msg.message_id} message={{
                  ...msg,
                  role: msg.role === 'user' ? 'assistant' : 'user',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};
