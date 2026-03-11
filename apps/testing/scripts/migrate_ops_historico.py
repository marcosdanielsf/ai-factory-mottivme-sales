#!/usr/bin/env python3
"""
Migração: ops_historico_mensagens_grupo -> n8n_historico_mensagens
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_ops_messages():
    """Buscar todas as mensagens de ops_historico_mensagens_grupo"""
    print("1. Buscando mensagens de ops_historico_mensagens_grupo...")
    all_msgs = []
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/ops_historico_mensagens_grupo?select=*&order=id&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        if not msgs or not isinstance(msgs, list):
            break
        all_msgs.extend(msgs)
        offset += limit
        print(f"   {len(all_msgs)} mensagens carregadas...")

    return all_msgs

def get_existing():
    """Buscar session_ids existentes"""
    print("2. Buscando registros existentes...")
    existing = set()
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data or not isinstance(data, list):
            break
        for r in data:
            existing.add(r["session_id"])
        offset += limit

    return existing

def migrate():
    print("=== MIGRAÇÃO: ops_historico_mensagens_grupo -> n8n_historico_mensagens ===\n")

    # 1. Buscar mensagens
    messages = get_ops_messages()
    print(f"   Total: {len(messages)} mensagens\n")

    # 2. Buscar existentes (para evitar duplicar session_id)
    existing = get_existing()
    print(f"   {len(existing)} session_ids já existem\n")

    # 3. Preparar dados
    print("3. Preparando dados...")
    to_insert = []
    skipped = 0
    default_location = "sNwLyynZWP6jEtBy1ubf"

    for msg in messages:
        session_id = msg.get("session_id")
        message = msg.get("message")

        if not session_id or not message:
            continue

        # Garantir que message tem a estrutura correta
        if not isinstance(message, dict):
            continue

        # Adicionar campos faltantes se necessário
        if "tool_calls" not in message:
            message["tool_calls"] = []
        if "invalid_tool_calls" not in message:
            message["invalid_tool_calls"] = []

        record = {
            "session_id": session_id,
            "message": message,
            "location_id": default_location
            # created_at será gerado automaticamente pelo Supabase
        }
        to_insert.append(record)

    print(f"   {len(to_insert)} registros para inserir\n")

    # 4. Inserir em lotes
    if to_insert:
        print("4. Inserindo dados...")
        batch_size = 100
        inserted = 0
        errors = 0

        for i in range(0, len(to_insert), batch_size):
            batch = to_insert[i:i+batch_size]
            url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens"
            resp = requests.post(url, headers=headers, json=batch)

            if resp.status_code in [200, 201]:
                inserted += len(batch)
                print(f"   Inseridos: {inserted}/{len(to_insert)}")
            else:
                errors += len(batch)
                print(f"   ERRO: {resp.status_code} - {resp.text[:200]}")

        print(f"\n   Total inseridos: {inserted}")
        print(f"   Total erros: {errors}")

    # 5. Verificar resultado
    print("\n5. Verificando resultado...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=count"
    headers_count = headers.copy()
    headers_count["Prefer"] = "count=exact"
    headers_count["Range"] = "0-0"
    resp = requests.get(url, headers=headers_count)
    print(f"   Total em n8n_historico_mensagens: {resp.json()}")

    print("\n=== MIGRAÇÃO CONCLUÍDA ===")

if __name__ == "__main__":
    migrate()
