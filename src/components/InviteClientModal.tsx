import React, { useState } from 'react';
import { X, Mail, Send, Copy, Check, Loader2, UserPlus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from "../lib/getErrorMessage";

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({
  isOpen,
  onClose,
  locationId,
  locationName,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured() || !user) {
      setError('Configuracao invalida');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create invite in database
      const { data: invite, error: insertError } = await supabase
        .from('location_invites')
        .insert({
          location_id: locationId,
          email: email.toLowerCase().trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Generate invite URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/#/invite/${invite.token}`;
      setInviteUrl(url);
      setSuccess(true);

      // Optionally send email via webhook
      try {
        await fetch('https://cliente-a1.mentorfy.io/webhook/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            invite_url: url,
            location_name: locationName,
          }),
        });
      } catch (emailErr) {
        // Email sending failed but invite was created
        console.warn('Failed to send invite email:', emailErr);
      }
    } catch (err: unknown) {
      console.error('Error creating invite:', err);
      setError(getErrorMessage(err) || 'Erro ao criar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    setInviteUrl(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-default rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Convidar Cliente</h2>
              <p className="text-xs text-text-muted">{locationName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Convite criado!
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Envie o link abaixo para <span className="text-text-primary font-medium">{email}</span>
              </p>

              {/* Invite URL */}
              <div className="bg-bg-primary border border-border-default rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl || ''}
                    className="flex-1 bg-transparent text-sm text-text-muted truncate outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'hover:bg-bg-hover text-text-muted hover:text-text-primary'
                    }`}
                    title="Copiar link"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-text-muted mb-6">
                O convite expira em 7 dias
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                    setInviteUrl(null);
                  }}
                  className="flex-1 py-2.5 bg-bg-hover text-text-primary rounded-lg font-medium hover:bg-bg-tertiary transition-colors"
                >
                  Convidar outro
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-text-muted mb-4">
                Digite o email do cliente para gerar um link de convite. Ele podera criar uma conta e acessar apenas esta subconta.
              </p>

              <div className="mb-4">
                <label className="block text-sm text-text-muted mb-1.5">Email do cliente</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="cliente@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg text-accent-error text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando convite...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gerar convite
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteClientModal;
