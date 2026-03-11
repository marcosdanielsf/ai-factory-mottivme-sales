#!/usr/bin/env python3
"""
Executar migration via conexão direta ao Postgres
"""

import psycopg2

# Conexão Supabase
conn_string = "postgresql://postgres.bfumywvwubvernvhjehk:M0tt1vm3.SBP4ss!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

migration_sql = """
-- 1. Adicionar coluna SOURCE (whatsapp, instagram, sms, email)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'whatsapp';

-- 2. Adicionar coluna FOLLOW_UP_COUNT (contador de tentativas)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- 3. Adicionar coluna API_KEY (chave da API do GHL)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- 4. Adicionar coluna LOCATION_ID (ID da location no GHL)
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS location_id VARCHAR(100);

-- Setar source = 'whatsapp' como padrão para registros antigos
UPDATE n8n_schedule_tracking
SET source = 'whatsapp'
WHERE source IS NULL;

-- Setar follow_up_count = 0 para registros que não têm
UPDATE n8n_schedule_tracking
SET follow_up_count = 0
WHERE follow_up_count IS NULL;

-- Índice para a query principal do Follow Up Eterno
CREATE INDEX IF NOT EXISTS idx_n8n_schedule_tracking_followup
ON n8n_schedule_tracking (ativo, source, follow_up_count)
WHERE ativo = true;

-- Índice para busca por unique_id
CREATE INDEX IF NOT EXISTS idx_n8n_schedule_tracking_unique_id
ON n8n_schedule_tracking (unique_id);

-- Índice na n8n_historico_mensagens para performance da subquery
CREATE INDEX IF NOT EXISTS idx_n8n_historico_mensagens_session_created
ON n8n_historico_mensagens (session_id, created_at DESC);
"""

def run_migration():
    print("=== EXECUTANDO MIGRATION ===\n")

    try:
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cur = conn.cursor()

        # Executar cada comando separadamente
        commands = [cmd.strip() for cmd in migration_sql.split(';') if cmd.strip() and not cmd.strip().startswith('--')]

        for i, cmd in enumerate(commands, 1):
            if cmd:
                print(f"{i}. Executando: {cmd[:60]}...")
                try:
                    cur.execute(cmd)
                    print(f"   ✓ OK")
                except Exception as e:
                    print(f"   ⚠ {e}")

        # Verificar colunas
        print("\n=== VERIFICANDO COLUNAS ===")
        cur.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'n8n_schedule_tracking'
            ORDER BY ordinal_position;
        """)

        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} (default: {row[2]})")

        cur.close()
        conn.close()

        print("\n=== MIGRATION CONCLUÍDA ===")

    except Exception as e:
        print(f"ERRO: {e}")

if __name__ == "__main__":
    run_migration()
