#!/usr/bin/env python3
"""
Corrigir location_ids nos registros migrados
Busca o location_id correto de crm_historico_mensagens
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

def get_location_mapping():
    """Buscar mapeamento lead_id -> location_id do crm_historico_mensagens"""
    print("1. Buscando mapeamento lead_id -> location_id do CRM...")
    mapping = {}
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/crm_historico_mensagens?select=lead_id,location_id&location_id=not.is.null&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data or not isinstance(data, list):
            break
        for r in data:
            lead_id = r.get("lead_id")
            loc_id = r.get("location_id")
            if lead_id and loc_id:
                mapping[lead_id] = loc_id
        offset += limit
        if len(data) < limit:
            break
        print(f"   {len(mapping)} mapeamentos encontrados...")

    print(f"   Total: {len(mapping)} leads com location_id\n")
    return mapping

def get_records_to_fix(default_location):
    """Buscar registros que estão com o location_id default"""
    print(f"2. Buscando registros com location_id = {default_location}...")
    records = []
    offset = 0
    limit = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=id,session_id,location_id&location_id=eq.{default_location}&offset={offset}&limit={limit}"
        resp = requests.get(url, headers=headers)
        data = resp.json()
        if not data or not isinstance(data, list):
            break
        records.extend(data)
        offset += limit
        if len(data) < limit:
            break
        print(f"   {len(records)} registros encontrados...")

    print(f"   Total: {len(records)} registros para verificar\n")
    return records

def update_location_ids(records, mapping, default_location):
    """Atualizar location_ids"""
    print("3. Atualizando location_ids...")

    updates_needed = []
    for r in records:
        session_id = r["session_id"]
        if session_id in mapping:
            correct_location = mapping[session_id]
            if correct_location != default_location:
                updates_needed.append({
                    "id": r["id"],
                    "session_id": session_id,
                    "new_location": correct_location
                })

    print(f"   {len(updates_needed)} registros precisam de atualização\n")

    if not updates_needed:
        print("   Nenhuma atualização necessária!")
        return 0

    # Agrupar por location_id para fazer updates em batch
    by_location = {}
    for u in updates_needed:
        loc = u["new_location"]
        if loc not in by_location:
            by_location[loc] = []
        by_location[loc].append(u["id"])

    print(f"   Location IDs diferentes encontrados: {list(by_location.keys())}\n")

    updated = 0
    for location_id, ids in by_location.items():
        print(f"   Atualizando {len(ids)} registros para location_id = {location_id}...")

        # Update em lotes de 100
        for i in range(0, len(ids), 100):
            batch_ids = ids[i:i+100]

            # Fazer update via PATCH para cada ID
            for record_id in batch_ids:
                url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?id=eq.{record_id}"
                resp = requests.patch(
                    url,
                    headers={**headers, "Prefer": "return=minimal"},
                    json={"location_id": location_id}
                )
                if resp.status_code in [200, 204]:
                    updated += 1
                else:
                    print(f"   ERRO ao atualizar {record_id}: {resp.status_code}")

            print(f"      Atualizados: {updated}")

    return updated

def main():
    print("=== CORREÇÃO DE LOCATION_IDS ===\n")

    default_location = "sNwLyynZWP6jEtBy1ubf"

    # 1. Buscar mapeamento
    mapping = get_location_mapping()

    if not mapping:
        print("Nenhum mapeamento encontrado no CRM. Abortando.")
        return

    # 2. Buscar registros a corrigir
    records = get_records_to_fix(default_location)

    # 3. Atualizar
    updated = update_location_ids(records, mapping, default_location)

    print(f"\n=== CONCLUÍDO: {updated} registros atualizados ===")

if __name__ == "__main__":
    main()
