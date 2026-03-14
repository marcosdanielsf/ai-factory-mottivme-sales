/**
 * FormFlow Skip Logic Engine
 *
 * Avalia regras de navegação condicional e determina o próximo campo
 * a ser exibido com base nas respostas já fornecidas pelo respondente.
 *
 * As regras são avaliadas em ordem — a primeira que corresponder vence.
 * Se nenhuma regra corresponder, retorna null (avança para o próximo campo).
 */

import type { FieldValue, LogicOperator, SkipLogicRule } from "./types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Verifica se um FieldValue é considerado "vazio".
 * - null / undefined → vazio
 * - string vazia → vazio
 * - array vazio → vazio
 * - 0 (número) → NÃO é vazio (intenção explícita de resposta)
 */
function isEmpty(value: FieldValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Normaliza um valor para string segura para comparações textuais.
 */
function toStr(value: FieldValue | SkipLogicRule["value"]): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(",");
  return String(value);
}

/**
 * Normaliza um valor para número. Retorna NaN se a conversão falhar.
 */
function toNum(value: FieldValue | SkipLogicRule["value"]): number {
  if (value === null || value === undefined) return NaN;
  if (Array.isArray(value)) return NaN;
  return Number(value);
}

// ---------------------------------------------------------------------------
// Core evaluator
// ---------------------------------------------------------------------------

/**
 * Avalia uma condição individual de skip logic.
 *
 * @param operator - Operador de comparação
 * @param fieldValue - Valor atual do campo (resposta do usuário)
 * @param ruleValue - Valor esperado definido na regra
 * @returns true se a condição for satisfeita
 */
export function evaluateCondition(
  operator: LogicOperator,
  fieldValue: FieldValue,
  ruleValue: SkipLogicRule["value"],
): boolean {
  switch (operator) {
    case "eq": {
      // Para multiple_choice (array), verifica se o valor está incluído
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(toStr(ruleValue));
      }
      // Comparação com coerção de tipo intencional para acomodar "5" == 5
      return toStr(fieldValue) === toStr(ruleValue);
    }

    case "neq": {
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(toStr(ruleValue));
      }
      return toStr(fieldValue) !== toStr(ruleValue);
    }

    case "contains": {
      // Arrays: checa se algum item inclui a substring
      if (Array.isArray(fieldValue)) {
        const needle = toStr(ruleValue).toLowerCase();
        return fieldValue.some((item) => item.toLowerCase().includes(needle));
      }
      return toStr(fieldValue)
        .toLowerCase()
        .includes(toStr(ruleValue).toLowerCase());
    }

    case "gt": {
      const numField = toNum(fieldValue);
      const numRule = toNum(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField > numRule;
    }

    case "lt": {
      const numField = toNum(fieldValue);
      const numRule = toNum(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField < numRule;
    }

    case "is_empty": {
      return isEmpty(fieldValue);
    }

    case "is_not_empty": {
      return !isEmpty(fieldValue);
    }

    default: {
      // Garante exhaustiveness — se um novo operador for adicionado
      // sem implementação, o TypeScript sinalizará aqui
      const _exhaustive: never = operator;
      console.warn(`[FormFlow] Operador desconhecido: ${_exhaustive}`);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Rule set evaluator
// ---------------------------------------------------------------------------

/**
 * Avalia o conjunto de regras de skip logic de um campo e retorna o destino.
 *
 * As regras são avaliadas em ordem de inserção (first-match wins).
 * Para cada regra, o valor comparado é buscado em `answers` pelo `field_id`
 * da regra — permitindo que um campo condicione o salto com base na resposta
 * de outro campo já respondido.
 *
 * @param rules - Lista de regras do campo atual (skip_logic[])
 * @param answers - Mapa de respostas já coletadas (field_id → valor)
 * @returns
 *   - `string` — ID do campo de destino
 *   - `'end'` — encerrar o formulário
 *   - `null` — nenhuma regra correspondeu; avançar para o próximo campo na ordem
 */
export function evaluateSkipLogic(
  rules: SkipLogicRule[],
  answers: Record<string, FieldValue>,
): string | "end" | null {
  for (const rule of rules) {
    const fieldValue = answers[rule.field_id] ?? null;
    const matched = evaluateCondition(rule.operator, fieldValue, rule.value);
    if (matched) {
      return rule.then.go_to;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Navigation resolver
// ---------------------------------------------------------------------------

/**
 * Versão mínima de Field necessária para o cálculo de navegação.
 * Evita dependência circular com o tipo Field completo.
 */
export interface NavigableField {
  id: string;
  position: number;
  skip_logic: SkipLogicRule[];
}

/**
 * Calcula o próximo campo a ser exibido após o respondente avançar.
 *
 * Algoritmo:
 * 1. Busca o campo atual pelo ID
 * 2. Avalia as regras de skip logic do campo atual
 * 3. Se uma regra corresponder → retorna o destino da regra
 * 4. Se nenhuma regra → retorna o campo com position imediatamente maior
 * 5. Se não houver próximo campo → retorna 'end'
 *
 * @param currentFieldId - ID do campo que o respondente acabou de responder
 * @param fields - Todos os campos do formulário (não precisam estar ordenados)
 * @param answers - Mapa de respostas coletadas até o momento
 * @returns
 *   - `string` — ID do próximo campo a exibir
 *   - `'end'` — formulário concluído
 *   - `null` — campo atual não encontrado (erro de dados)
 */
export function getNextField(
  currentFieldId: string,
  fields: NavigableField[],
  answers: Record<string, FieldValue>,
): string | "end" | null {
  const currentField = fields.find((f) => f.id === currentFieldId);

  if (!currentField) {
    console.warn(
      `[FormFlow] getNextField: campo "${currentFieldId}" não encontrado`,
    );
    return null;
  }

  // 1. Avaliar skip logic do campo atual
  const skipDestination = evaluateSkipLogic(currentField.skip_logic, answers);
  if (skipDestination !== null) {
    return skipDestination;
  }

  // 2. Avançar para o próximo campo por posição
  const sorted = [...fields].sort((a, b) => a.position - b.position);
  const currentIndex = sorted.findIndex((f) => f.id === currentFieldId);
  const nextField = sorted[currentIndex + 1];

  return nextField ? nextField.id : "end";
}
