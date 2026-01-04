import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env with VITE_ prefix
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not configured. Using mock data.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
