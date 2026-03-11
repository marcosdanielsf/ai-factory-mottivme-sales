/**
 * Script para executar a migration 019_agent_briefing_schema.sql
 *
 * Uso:
 *   node run_019_migration.js
 *
 * Ou cole o SQL no Supabase Dashboard > SQL Editor
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '019_agent_briefing_schema.sql');

// Configuracao Supabase
const CONNECTION_STRING = process.env.SUPABASE_DB_URL ||
  'postgresql://postgres.bfumywvwubvernvhjehk:[SERVICE_ROLE_KEY]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

async function runMigration() {
  console.log('📦 Lendo arquivo SQL...');
  const sql = fs.readFileSync(SQL_FILE, 'utf8');

  console.log('🔌 Conectando ao Supabase...');
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado!');

    console.log('🚀 Executando migration...');
    await client.query(sql);

    console.log('✅ Migration executada com sucesso!');
    console.log('\nTabelas criadas:');
    console.log('  - agent_briefing_sessions');
    console.log('  - agent_briefing_logs');
    console.log('\nFuncoes criadas:');
    console.log('  - get_or_create_briefing_session()');
    console.log('  - update_briefing_phase()');
    console.log('  - finalize_briefing_session()');
    console.log('  - log_briefing_message()');
    console.log('  - abandon_stale_briefings()');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Se nao conseguir conectar, instrucoes alternativas
console.log('='.repeat(50));
console.log('MIGRATION: 019_agent_briefing_schema.sql');
console.log('='.repeat(50));
console.log('\nSe este script falhar, execute manualmente:');
console.log('1. Acesse https://supabase.com/dashboard');
console.log('2. Selecione o projeto bfumywvwubvernvhjehk');
console.log('3. Va em SQL Editor');
console.log('4. Cole o conteudo de 019_agent_briefing_schema.sql');
console.log('5. Execute\n');
console.log('='.repeat(50));

runMigration();
