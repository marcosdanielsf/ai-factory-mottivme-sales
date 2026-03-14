/**
 * FormFlow Webhook utilities
 *
 * Responsabilidade: disparar webhooks de forma fire-and-forget após submissões.
 * Não bloqueia o fluxo do player — erros são logados mas não relançados.
 */

import type { FieldValue, Form } from "./types";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface WebhookPayload {
  event: "submission.created";
  form_id: string;
  form_title: string;
  submission_id: string;
  answers: Record<string, FieldValue>;
  metadata: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// buildWebhookPayload
// ---------------------------------------------------------------------------

export function buildWebhookPayload(
  form: Form,
  submissionId: string,
  answers: Record<string, FieldValue>,
  metadata: Record<string, unknown> = {},
): WebhookPayload {
  return {
    event: "submission.created",
    form_id: form.id,
    form_title: form.title,
    submission_id: submissionId,
    answers,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// fireWebhook — fire-and-forget
// ---------------------------------------------------------------------------

/**
 * Envia o payload via POST para o webhook_url configurado no formulário.
 * - Timeout de 10s
 * - Não lança erros (fire-and-forget)
 * - Retorna true se a resposta HTTP for 2xx, false caso contrário
 */
export async function fireWebhook(
  form: Form,
  submissionId: string,
  answers: Record<string, FieldValue>,
  metadata: Record<string, unknown> = {},
): Promise<boolean> {
  if (!form.webhook_url || !isValidUrl(form.webhook_url)) {
    return false;
  }

  const payload = buildWebhookPayload(form, submissionId, answers, metadata);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(form.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `[FormFlow Webhook] HTTP ${response.status} from ${form.webhook_url}`,
      );
      return false;
    }

    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[FormFlow Webhook] Timeout (10s) for ${form.webhook_url}`);
    } else {
      console.error(`[FormFlow Webhook] Error firing webhook:`, err);
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// fireWebhookTest — envia payload de teste com dados fake
// ---------------------------------------------------------------------------

export async function fireWebhookTest(
  webhookUrl: string,
  formId: string,
  formTitle: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!isValidUrl(webhookUrl)) {
    return { ok: false, error: "URL inválida" };
  }

  const fakePayload: WebhookPayload = {
    event: "submission.created",
    form_id: formId,
    form_title: formTitle,
    submission_id: crypto.randomUUID(),
    answers: {
      "field-example-1": "Resposta de exemplo",
      "field-example-2": 8,
    },
    metadata: {
      user_agent: navigator.userAgent,
      duration_seconds: 42,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakePayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return { ok: response.ok, status: response.status };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Timeout após 10s" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}
