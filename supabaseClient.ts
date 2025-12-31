import { createClient } from '@supabase/supabase-js';

// In a real scenario, these would come from import.meta.env or process.env
// For this demo, we use placeholders. The app will use Mocks if connection fails.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);