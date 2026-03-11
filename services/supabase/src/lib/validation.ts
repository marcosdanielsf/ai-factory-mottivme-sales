/**
 * Security validation helpers for database operations
 */

const VALID_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'like',
  'ilike',
  'in',
  'is'
] as const;

const TABLE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COLUMN_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates table name to prevent SQL injection
 * @param table - Table name to validate
 * @returns true if valid, false otherwise
 */
export function validateTableName(table: string): boolean {
  if (!table || typeof table !== 'string') {
    return false;
  }

  // Check length (PostgreSQL limit is 63 chars)
  if (table.length > 63) {
    return false;
  }

  // Check against regex pattern
  return TABLE_NAME_REGEX.test(table);
}

/**
 * Validates column name to prevent SQL injection
 * @param column - Column name to validate
 * @returns true if valid, false otherwise
 */
export function validateColumnName(column: string): boolean {
  if (!column || typeof column !== 'string') {
    return false;
  }

  // Check length
  if (column.length > 63) {
    return false;
  }

  // Check against regex pattern
  return COLUMN_NAME_REGEX.test(column);
}

/**
 * Validates filter operator
 * @param op - Operator to validate
 * @returns true if valid operator
 */
export function validateOperator(op: string): op is typeof VALID_OPERATORS[number] {
  return VALID_OPERATORS.includes(op as any);
}

/**
 * Sanitizes SQL for safe logging (removes sensitive values)
 * @param sql - SQL query to sanitize
 * @returns Sanitized SQL string
 */
export function sanitizeForLog(sql: string): string {
  // Remove single-quoted values
  let sanitized = sql.replace(/'.+?'/g, "'***'");

  // Remove numbers that might be sensitive
  sanitized = sanitized.replace(/\b\d{10,}\b/g, "***");

  return sanitized;
}

/**
 * Validates policy name (alphanumeric and underscore only)
 * @param name - Policy name to validate
 * @returns Sanitized policy name
 */
export function sanitizePolicyName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Gets safe error message for API response
 * @param error - Error object or message
 * @returns Safe error message
 */
export function getSafeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Internal error';
}
