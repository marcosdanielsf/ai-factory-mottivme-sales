#!/usr/bin/env python3
"""
Popula location_id e api_key na tabela n8n_schedule_tracking
buscando os dados do n8n_historico_mensagens
"""

import requests

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# API Key da agência (Private Integration Token)
GHL_API_KEY = "pit-0f37952b-9f36-4cd9-8706-7705e56372d8"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def main():
    print("=== POPULAR LOCATION_ID E API_KEY ===\n")

    # 1. Buscar location_ids distintos do histórico de mensagens
    print("1. Buscando location_ids do histórico de mensagens...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_historico_mensagens?select=session_id,location_id&location_id=not.is.null"
    resp = requests.get(url, headers=headers)
    historico = resp.json()

    # Criar mapa session_id -> location_id
    location_map = {}
    for h in historico:
        sid = h["session_id"]
        loc = h["location_id"]
        if sid and loc:
            location_map[sid] = loc

    print(f"   {len(location_map)} session_ids com location_id no histórico\n")

    # 2. Buscar leads sem location_id
    print("2. Buscando leads sem location_id no schedule_tracking...")
    url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?select=unique_id&location_id=is.null&limit=5000"
    resp = requests.get(url, headers=headers)
    leads = resp.json()
    print(f"   {len(leads)} leads sem location_id\n")

    # 3. Atualizar leads que têm correspondência no histórico
    print("3. Atualizando leads...")
    updated = 0
    no_match = 0

    for lead in leads:
        uid = lead["unique_id"]

        if uid in location_map:
            location_id = location_map[uid]

            # Atualizar no Supabase
            url = f"{SUPABASE_URL}/rest/v1/n8n_schedule_tracking?unique_id=eq.{uid}"
            data = {
                "location_id": location_id,
                "api_key": GHL_API_KEY
            }
            resp = requests.patch(url, headers=headers, json=data)

            if resp.status_code in [200, 204]:
                updated += 1
                if updated <= 20:  # Mostrar só os 20 primeiros
                    print(f"   ✅ {uid} -> {location_id}")
                elif updated == 21:
                    print("   ... (continuando)")
            else:
                print(f"   ❌ {uid} - Erro: {resp.status_code}")
        else:
            no_match += 1

    print(f"\n=== RESULTADO ===")
    print(f"✅ Atualizados: {updated}")
    print(f"⚠️  Sem correspondência no histórico: {no_match}")


if __name__ == "__main__":
    main()
