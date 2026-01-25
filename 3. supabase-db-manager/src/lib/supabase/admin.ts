import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton instance to prevent memory leaks
let adminClientInstance: SupabaseClient | null = null;

/**
 * Creates or returns existing admin client with service role key
 * Uses singleton pattern to prevent creating multiple instances
 * @returns {SupabaseClient} Admin client with service role permissions
 */
export function createAdminClient(): SupabaseClient {
  // Return existing instance if already created
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin credentials");
  }

  // Create new instance and cache it
  adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}
