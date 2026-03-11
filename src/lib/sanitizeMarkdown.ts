import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["strong", "em", "code", "br"];
const ALLOWED_ATTR: string[] = ["class"];

/**
 * Converte markdown inline simples para HTML sanitizado.
 * Primeiro sanitiza o input RAW, depois aplica regex no texto limpo.
 * Isso evita que regex parcialmente escapado gere HTML malicioso.
 */
export function sanitizeMarkdown(raw: string): string {
  // 1. Sanitizar input ANTES de qualquer transformação
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // 2. Aplicar formatação markdown no texto já limpo (sem HTML)
  const formatted = clean
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code class="bg-bg-tertiary px-1 rounded text-xs">$1</code>',
    );

  // 3. Re-sanitizar output final permitindo apenas tags seguras
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
