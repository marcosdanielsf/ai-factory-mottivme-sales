#!/usr/bin/env python3
"""
Migração: Restaurar memória de agent_conversation_messages para n8n_historico_mensagens
"""

import os
import json
import requests
from datetime import datetime

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_conversations():
    """Buscar mapeamento conversation_id -> contact_id"""
    url = f"{SUPABASE_URL}/rest/v1/agent_conversations?select=id,contact_id"
    resp = requests.get(url, headers=headers)
    return {c["id"]: c["contact_id"] for c in resp.json()}

def get_existing_sessions():
    """Buscar session_ids que já existem em n8n_historico_mensagens"""
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,created_at"
    resp = requests.get(url, headers=headers)
    existing = {}
    for r in resp.json():
        sid = r["session_id"]
        if sid not in existing:
            existing[sid] = set()
        # Guardar timestamps aproximados (sem microsegundos)
        ts = r["created_at"][:19]  # "2026-01-09T01:20:34"
        existing[sid].add(ts)
    return existing

def get_location_ids():
    """Buscar location_id de n8n_historico_mensagens existente"""
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,location_id"
    resp = requests.get(url, headers=headers)
    data = resp.json()
    if isinstance(data, list):
        return {r["session_id"]: r["location_id"] for r in data if r.get("location_id")}
    return {}

def get_messages():
    """Buscar todas as mensagens de agent_conversation_messages"""
    all_msgs = []
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/agent_conversation_messages?select=*&order=created_at&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        msgs = resp.json()
        if not msgs:
            break
        all_msgs.extend(msgs)
        offset += limit
        print(f"  Buscando mensagens... {len(all_msgs)}")

    return all_msgs

def migrate():
    print("=== MIGRAÇÃO: agent_conversation_messages -> n8n_historico_mensagens ===\n")

    # 1. Buscar dados
    print("1. Buscando mapeamentos...")
    conversations = get_conversations()
    print(f"   {len(conversations)} conversas encontradas")

    print("2. Buscando sessões existentes...")
    existing = get_existing_sessions()
    print(f"   {len(existing)} sessões já existem")

    print("3. Buscando location_ids...")
    locations = get_location_ids()
    print(f"   {len(locations)} location_ids encontrados")

    print("4. Buscando mensagens...")
    messages = get_messages()
    print(f"   {len(messages)} mensagens encontradas")

    # 2. Preparar dados para inserção
    print("\n5. Preparando dados para migração...")
    to_insert = []
    skipped = 0
    no_contact = 0

    default_location = "sNwLyynZWP6jEtBy1ubf"  # Instituto Amare

    for msg in messages:
        conv_id = msg["conversation_id"]
        contact_id = conversations.get(conv_id)

        if not contact_id:
            no_contact += 1
            continue

        # Verificar se já existe
        ts = msg["created_at"][:19]
        if contact_id in existing and ts in existing[contact_id]:
            skipped += 1
            continue

        # Determinar location_id
        location_id = locations.get(contact_id, default_location)

        # Criar registro
        record = {
            "session_id": contact_id,
            "message": {
                "type": "human" if msg["is_from_lead"] else "ai",
                "content": msg["message_text"] or "",
                "tool_calls": [],
                "additional_kwargs": {},
                "response_metadata": {},
                "invalid_tool_calls": []
            },
            "created_at": msg["created_at"],
            "location_id": location_id
        }
        to_insert.append(record)

    print(f"   {len(to_insert)} registros para inserir")
    print(f"   {skipped} registros já existiam (pulados)")
    print(f"   {no_contact} registros sem contact_id (pulados)")

    # 3. Inserir em lotes
    if to_insert:
        print("\n6. Inserindo dados...")
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
                print(f"   ERRO: {resp.status_code} - {resp.text[:100]}")

        print(f"\n   Total inseridos: {inserted}")
        print(f"   Total erros: {errors}")

    # 4. Verificar resultado
    print("\n7. Verificando resultado...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=count"
    headers_count = headers.copy()
    headers_count["Prefer"] = "count=exact"
    headers_count["Range"] = "0-0"
    resp = requests.get(url, headers=headers_count)
    print(f"   Total em n8n_historico_mensagens: {resp.json()}")

    print("\n=== MIGRAÇÃO CONCLUÍDA ===")

if __name__ == "__main__":
    migrate()
