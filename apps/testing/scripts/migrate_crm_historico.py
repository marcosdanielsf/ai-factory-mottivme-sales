#!/usr/bin/env python3
"""
Migração: crm_historico_mensagens -> n8n_historico_mensagens
Importa mensagens dos leads para dar contexto ao agente
"""

import requests
import json

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_existing_sessions():
    """Buscar session_ids e timestamps que já existem"""
    print("1. Buscando registros existentes...")
    existing = {}
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,created_at&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data:
            break
        for r in data:
            sid = r["session_id"]
            if sid not in existing:
                existing[sid] = set()
            ts = r["created_at"][:19]
            existing[sid].add(ts)
        offset += limit
        print(f"   {len(existing)} sessões carregadas...")

    return existing

def get_crm_messages():
    """Buscar todas as mensagens de crm_historico_mensagens"""
    print("2. Buscando mensagens do CRM...")
    all_msgs = []
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/crm_historico_mensagens?select=*&order=created_at&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        if not msgs:
            break
        all_msgs.extend(msgs)
        offset += limit
        print(f"   {len(all_msgs)} mensagens carregadas...")

    return all_msgs

def migrate():
    print("=== MIGRAÇÃO: crm_historico_mensagens -> n8n_historico_mensagens ===\n")

    # 1. Buscar existentes
    existing = get_existing_sessions()
    print(f"   Total: {len(existing)} sessões já existem\n")

    # 2. Buscar mensagens do CRM
    messages = get_crm_messages()
    print(f"   Total: {len(messages)} mensagens no CRM\n")

    # 3. Preparar dados
    print("3. Preparando dados para migração...")
    to_insert = []
    skipped = 0

    default_location = "sNwLyynZWP6jEtBy1ubf"  # Instituto Amare

    for msg in messages:
        lead_id = msg.get("lead_id")
        if not lead_id:
            continue

        # Usar datetime ou created_at
        created = msg.get("datetime") or msg.get("created_at")
        if not created:
            continue

        # Verificar duplicado
        ts = created[:19] if created else ""
        if lead_id in existing and ts in existing[lead_id]:
            skipped += 1
            continue

        # Usar location_id do registro se existir
        location_id = msg.get("location_id") or default_location

        record = {
            "session_id": lead_id,
            "message": {
                "type": "human",
                "content": msg.get("mensagem") or "",
                "tool_calls": [],
                "additional_kwargs": {
                    "source": msg.get("source", "unknown"),
                    "full_name": msg.get("full_name", "")
                },
                "response_metadata": {},
                "invalid_tool_calls": []
            },
            "created_at": created,
            "location_id": location_id
        }
        to_insert.append(record)

    print(f"   {len(to_insert)} registros para inserir")
    print(f"   {skipped} registros já existiam (pulados)\n")

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
    print("\n5. Verificando resultado final...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=count"
    headers_count = headers.copy()
    headers_count["Prefer"] = "count=exact"
    headers_count["Range"] = "0-0"
    resp = requests.get(url, headers=headers_count)
    print(f"   Total em n8n_historico_mensagens: {resp.json()}")

    print("\n=== MIGRAÇÃO CONCLUÍDA ===")

if __name__ == "__main__":
    migrate()
