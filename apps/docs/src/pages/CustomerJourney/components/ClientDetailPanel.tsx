import { useState } from "react";
import { X } from "lucide-react";
import TouchpointTimeline from "./TouchpointTimeline";
import OnboardingChecklist from "./OnboardingChecklist";

interface ClientDetailPanelProps {
  contactId: string | null;
  contactName: string | null;
  onClose: () => void;
}

type Tab = "timeline" | "onboarding";

const ClientDetailPanel = ({
  contactId,
  contactName,
  onClose,
}: ClientDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("timeline");
  const isOpen = contactId !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[480px] bg-bg-secondary border-l border-border-default shadow-xl z-40 transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {contactId && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default flex-shrink-0">
              <h3 className="text-lg font-semibold text-text-primary truncate pr-4">
                {contactName ?? "Cliente"}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-bg-hover text-text-muted flex-shrink-0"
                aria-label="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-default flex-shrink-0">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "timeline"
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("onboarding")}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === "onboarding"
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                Onboarding
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {activeTab === "timeline" && (
                <TouchpointTimeline contactId={contactId} />
              )}

              {activeTab === "onboarding" && (
                <OnboardingChecklist contactId={contactId} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientDetailPanel;
