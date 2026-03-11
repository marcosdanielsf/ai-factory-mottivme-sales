#!/usr/bin/env python3
"""
Script para rodar migrations no Supabase via API
"""
import os
from supabase import create_client

# Credenciais do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

def run_migration():
    """Executa a migration criando a tabela via rpc ou verificando se existe"""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Verificar se tabela já existe tentando fazer um select
    try:
        result = client.table('e2e_test_results').select('id').limit(1).execute()
        print("✅ Tabela e2e_test_results já existe!")
        return True
    except Exception as e:
        error_str = str(e)
        if "does not exist" in error_str or "relation" in error_str:
            print("⚠️ Tabela e2e_test_results não existe. Precisa rodar migration manualmente.")
            print("\n📋 Copie o SQL abaixo e execute no Supabase SQL Editor:\n")
            print("-" * 60)
            with open('migrations/003_create_e2e_test_results.sql', 'r') as f:
                print(f.read())
            print("-" * 60)
            print("\n🔗 Acesse: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk/sql/new")
            return False
        else:
            print(f"❌ Erro inesperado: {e}")
            return False

if __name__ == "__main__":
    run_migration()
