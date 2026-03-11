import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  // Check appointments_log structure
  const { data: sample, error } = await supabase
    .from('appointments_log')
    .select('*')
    .limit(3);
  
  if (error) {
    console.log('appointments_log error:', error.message);
  } else {
    console.log('appointments_log columns:', Object.keys(sample[0] || {}));
    console.log('\nSample data:');
    console.log(JSON.stringify(sample, null, 2));
  }

  // Count total
  const { count } = await supabase
    .from('appointments_log')
    .select('*', { count: 'exact', head: true });
  console.log('\nTotal appointments_log:', count);
}

main();
