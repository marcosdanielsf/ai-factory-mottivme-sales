/**
 * Custom error classes for Supabase operations
 * Provides better error handling and debugging
 */

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(`[Supabase Config] ${message}`);
    this.name = 'SupabaseConfigError';
  }
}

export class SupabaseQueryError extends Error {
  public readonly query?: string;

  constructor(message: string, query?: string) {
    super(`[Supabase Query] ${message}`);
    this.name = 'SupabaseQueryError';
    this.query = query;
  }
}

export class SupabaseAuthError extends Error {
  constructor(message: string) {
    super(`[Supabase Auth] ${message}`);
    this.name = 'SupabaseAuthError';
  }
}

export class SupabaseRLSError extends Error {
  public readonly tableName?: string;

  constructor(message: string, tableName?: string) {
    super(`[Supabase RLS] ${message}`);
    this.name = 'SupabaseRLSError';
    this.tableName = tableName;
  }
}

/**
 * Type guard to check if error is a Supabase custom error
 */
export function isSupabaseCustomError(error: unknown): error is SupabaseConfigError | SupabaseQueryError | SupabaseAuthError | SupabaseRLSError {
  return error instanceof SupabaseConfigError ||
         error instanceof SupabaseQueryError ||
         error instanceof SupabaseAuthError ||
         error instanceof SupabaseRLSError;
}

/**
 * Format error for logging/display
 */
export function formatSupabaseError(error: unknown): string {
  if (isSupabaseCustomError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
