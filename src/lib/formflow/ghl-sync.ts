/**
 * FormFlow GHL Sync utilities
 *
 * Responsabilidade: preparar payload de sincronização para o GoHighLevel.
 * A chamada real à API GHL será feita via Supabase Edge Function (futuro).
 * Por ora, o payload é salvo em ff_submissions.metadata.ghl_payload.
 */

import type { FieldValue, Field, Form, FieldKind } from "./types";

// ---------------------------------------------------------------------------
// Auto-detect helpers
// ---------------------------------------------------------------------------

/** Campos GHL padrão sugeridos automaticamente por tipo de campo */
const AUTO_DETECT_BY_KIND: Partial<Record<FieldKind, string>> = {
  email: "contact.email",
  phone: "contact.phone",
};

/** Palavras-chave no título que sugerem mapeamento automático */
const AUTO_DETECT_BY_TITLE: Array<{ keywords: string[]; ghlField: string }> = [
  {
    keywords: ["nome", "name", "first name", "primeiro nome"],
    ghlField: "contact.firstName",
  },
  {
    keywords: ["sobrenome", "last name", "ultimo nome"],
    ghlField: "contact.lastName",
  },
  {
    keywords: ["empresa", "company", "negocio", "negócio"],
    ghlField: "contact.companyName",
  },
  { keywords: ["site", "website", "url"], ghlField: "contact.website" },
];

/**
 * Detecta sugestão automática de campo GHL baseado no tipo e título do field.
 * Retorna null se não houver sugestão.
 */
export function autoDetectGHLField(field: Field): string | null {
  // Prioridade 1: tipo exato
  const byKind = AUTO_DETECT_BY_KIND[field.type];
  if (byKind) return byKind;

  // Prioridade 2: palavras-chave no título
  const titleLower = field.title.toLowerCase();
  for (const { keywords, ghlField } of AUTO_DETECT_BY_TITLE) {
    if (keywords.some((kw) => titleLower.includes(kw))) {
      return ghlField;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// buildGHLPayload
// ---------------------------------------------------------------------------

/**
 * Converte as respostas do formulário para o formato esperado pela API GHL.
 *
 * Retorna null se:
 * - form.ghl_mapping é null
 * - contact_field_map está vazio
 * - nenhuma resposta mapeada tem valor
 */
export function buildGHLPayload(
  form: Form,
  fields: Field[],
  answers: Record<string, FieldValue>,
): Record<string, string> | null {
  if (!form.ghl_mapping || !form.ghl_mapping.contact_field_map) {
    return null;
  }

  const { contact_field_map } = form.ghl_mapping;

  if (Object.keys(contact_field_map).length === 0) {
    return null;
  }

  const result: Record<string, string> = {};

  // Mapeamento explícito via contact_field_map
  for (const [fieldId, ghlField] of Object.entries(contact_field_map)) {
    if (!ghlField) continue;

    const value = answers[fieldId];
    if (value === undefined || value === null || value === "") continue;

    // Normaliza valor para string
    const stringValue = Array.isArray(value) ? value.join(", ") : String(value);

    result[ghlField] = stringValue;
  }

  // Auto-detect para campos não mapeados explicitamente
  // (somente se o campo GHL ainda não foi preenchido por mapeamento explícito)
  for (const field of fields) {
    // Se já foi mapeado explicitamente, pular
    if (contact_field_map[field.id]) continue;

    const ghlField = autoDetectGHLField(field);
    if (!ghlField) continue;

    // Se o campo GHL já foi preenchido, pular
    if (result[ghlField]) continue;

    const value = answers[field.id];
    if (value === undefined || value === null || value === "") continue;

    const stringValue = Array.isArray(value) ? value.join(", ") : String(value);

    result[ghlField] = stringValue;
  }

  if (Object.keys(result).length === 0) {
    return null;
  }

  return result;
}
