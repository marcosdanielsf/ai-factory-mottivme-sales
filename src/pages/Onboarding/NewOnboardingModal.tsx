import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { OnboardingVertical } from "./types";
import { VERTICAL_CONFIG, ONBOARDING_STEPS } from "./types";
import type { ClientOnboarding } from "../../hooks/useOnboardingTracker";

interface NewOnboardingModalProps {
  onClose: () => void;
  onCreate: (data: {
    client_name: string;
    vertical: OnboardingVertical;
    assigned_to?: string;
    notes?: string;
  }) => Promise<ClientOnboarding | null>;
}

export function NewOnboardingModal({
  onClose,
  onCreate,
}: NewOnboardingModalProps) {
  const [clientName, setClientName] = useState("");
  const [vertical, setVertical] = useState<OnboardingVertical>("servicos");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVertical = VERTICAL_CONFIG[vertical];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await onCreate({
        client_name: clientName.trim(),
        vertical,
        assigned_to: assignedTo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result) {
        onClose();
      } else {
        setError("Erro ao criar onboarding. Tente novamente.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={!submitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-primary border border-border-default rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default flex-shrink-0">
            <h2 className="text-lg font-bold text-text-primary">
              Novo Onboarding
            </h2>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">
              {/* client_name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Nome do cliente <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Clinica Bella Vida"
                  required
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              {/* vertical */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Vertical
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    Object.entries(VERTICAL_CONFIG) as [
                      OnboardingVertical,
                      (typeof VERTICAL_CONFIG)[OnboardingVertical],
                    ][]
                  ).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setVertical(key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                        vertical === key
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border-default bg-bg-secondary text-text-muted hover:border-accent-primary/30 hover:text-text-primary"
                      }`}
                    >
                      <span className="text-lg">{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template preview */}
              <div className="p-3 rounded-lg border border-border-default bg-bg-secondary">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                  Template: {selectedVertical.emoji} {selectedVertical.label}
                </p>
                <div className="space-y-1">
                  {ONBOARDING_STEPS.map((step) => (
                    <div
                      key={step.number}
                      className="flex items-center gap-2 text-xs text-text-muted"
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${selectedVertical.color}20`,
                          color: selectedVertical.color,
                        }}
                      >
                        {step.number}
                      </span>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-2 border-t border-border-default pt-2">
                  SLA:{" "}
                  <span className="text-text-primary font-medium">
                    48 horas
                  </span>{" "}
                  a partir do inicio
                </p>
              </div>

              {/* assigned_to */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Responsavel{" "}
                  <span className="text-text-muted font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Ex: Marcos"
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors"
                />
              </div>

              {/* notes */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Observacoes{" "}
                  <span className="text-text-muted font-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contexto, contatos, detalhes do contrato..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 transition-colors resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-default flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm font-medium text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !clientName.trim()}
                className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Iniciar Onboarding"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
