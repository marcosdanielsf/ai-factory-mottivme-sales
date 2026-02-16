import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const GHL_BASE_URL = process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com';

// Fallback global key (usado quando nao tem location_id)
export const GHL_GLOBAL_KEY = process.env.GHL_API_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Busca API key (PIT) do cliente pela location_id na tabela clients.
 * Fallback para GHL_API_KEY global se nao encontrar.
 */
export async function getGHLApiKey(locationId?: string | null): Promise<string> {
    if (!locationId) return GHL_GLOBAL_KEY;

    try {
        const { data } = await supabaseAdmin
            .from('clients')
            .select('metadata')
            .eq('metadata->>ghl_location_id', locationId)
            .limit(1)
            .single();

        const apiKey = data?.metadata?.api_key;
        if (apiKey) return apiKey;
    } catch {
        // Fallback silencioso
    }

    return GHL_GLOBAL_KEY;
}
