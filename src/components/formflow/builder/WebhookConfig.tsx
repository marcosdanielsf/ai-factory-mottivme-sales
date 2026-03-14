"use client";

/**
 * WebhookConfig — Painel de configuração de webhook no Builder do FormFlow.
 * Permite configurar URL, ativar/desativar e testar o webhook.
 */

import { useState } from "react";
import {
  Webhook,
  TestTube2,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fireWebhookTest, buildWebhookPayload } from "@/lib/formflow/webhook";
import type { Form, FieldValue } from "@/lib/formflow/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookConfigProps {
  form: Form;
  onSave: (webhookUrl: string | undefined) => Promise<void>;
}

type TestState = "idle" | "loading" | "success" | "error";

interface TestResult {
  state: TestState;
  status?: number;
  errorMsg?: string;
}

// ---------------------------------------------------------------------------
// Payload preview helper
// ---------------------------------------------------------------------------

function buildPreviewPayload(form: Form): Record<string, unknown> {
  return buildWebhookPayload(
    form,
    "00000000-0000-0000-0000-000000000000",
    {
      "field-example-1": "Resposta de exemplo",
      "field-example-2": 8,
    } as Record<string, FieldValue>,
    { user_agent: "Mozilla/5.0 ...", duration_seconds: 42 },
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WebhookConfig({ form, onSave }: WebhookConfigProps) {
  const [urlDraft, setUrlDraft] = useState<string>(form.webhook_url ?? "");
  const [isEnabled, setIsEnabled] = useState<boolean>(
    Boolean(form.webhook_url),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({ state: "idle" });
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  async function handleSave() {
    setIsSaving(true);
    try {
      const valueToSave =
        isEnabled && urlDraft.trim() ? urlDraft.trim() : undefined;
      await onSave(valueToSave);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    const url = urlDraft.trim();
    if (!url) return;

    setTestResult({ state: "loading" });
    const result = await fireWebhookTest(url, form.id, form.title);

    if (result.ok) {
      setTestResult({ state: "success", status: result.status });
    } else {
      setTestResult({
        state: "error",
        status: result.status,
        errorMsg: result.error,
      });
    }

    // Reset após 5s
    setTimeout(() => setTestResult({ state: "idle" }), 5000);
  }

  async function handleCopyPayload() {
    const payload = buildPreviewPayload(form);
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function renderTestButton() {
    const disabled = !urlDraft.trim() || testResult.state === "loading";

    return (
      <button
        onClick={handleTest}
        disabled={disabled}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
          disabled
            ? "border-border-primary text-text-muted cursor-not-allowed"
            : "border-border-primary text-text-secondary hover:text-text-primary hover:border-brand-primary/60",
        ].join(" ")}
      >
        {testResult.state === "loading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <TestTube2 className="h-3.5 w-3.5" />
        )}
        Testar
      </button>
    );
  }

  function renderTestFeedback() {
    if (testResult.state === "idle" || testResult.state === "loading")
      return null;

    if (testResult.state === "success") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-400 mt-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Webhook respondeu com HTTP {testResult.status ?? "2xx"}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        {testResult.errorMsg
          ? `Erro: ${testResult.errorMsg}`
          : `Falhou com HTTP ${testResult.status ?? "erro"}`}
      </div>
    );
  }

  const previewPayload = buildPreviewPayload(form);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Toggle ativo */}
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-brand-primary" />
          <span className="text-sm font-medium text-text-primary">
            Ativar webhook
          </span>
        </div>
        <button
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled((v) => !v)}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            isEnabled
              ? "bg-brand-primary"
              : "bg-surface-primary border border-border-primary",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
              isEnabled ? "translate-x-4" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </label>

      {/* URL input */}
      {isEnabled && (
        <div className="space-y-2">
          <label className="text-xs text-text-muted font-medium">
            URL do webhook
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://seu-servidor.com/webhook"
              className={[
                "flex-1 bg-surface-primary border border-border-primary rounded-lg px-3 py-2",
                "text-xs text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-brand-primary/60",
              ].join(" ")}
            />
            {renderTestButton()}
          </div>

          {renderTestFeedback()}

          <p className="text-xs text-text-muted">
            Receberá um POST com o payload JSON a cada submissão concluída.
          </p>
        </div>
      )}

      {/* Preview do payload */}
      <div className="border border-border-primary rounded-lg overflow-hidden">
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <span>Preview do payload</span>
          {showPreview ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showPreview && (
          <div className="relative border-t border-border-primary bg-surface-primary">
            <button
              onClick={handleCopyPayload}
              title="Copiar payload"
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs text-text-muted hover:text-text-primary bg-surface-secondary border border-border-primary transition-colors"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <pre className="p-3 text-xs text-text-secondary overflow-x-auto leading-relaxed max-h-64">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Salvar */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={[
          "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors",
          isSaving
            ? "bg-surface-primary border border-border-primary text-text-muted cursor-not-allowed"
            : "bg-brand-primary text-white hover:bg-brand-primary/90",
        ].join(" ")}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar configuração"
        )}
      </button>
    </div>
  );
}
