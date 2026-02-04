export { createClient } from "./client";
export { createClient as createServerClient } from "./server";
export { createAdminClient } from "./admin";

// Export custom errors
export {
  SupabaseConfigError,
  SupabaseQueryError,
  SupabaseAuthError,
  SupabaseRLSError,
  isSupabaseCustomError,
  formatSupabaseError,
} from "./errors";
